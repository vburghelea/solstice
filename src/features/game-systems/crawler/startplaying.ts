import { asyncRateLimit } from "@tanstack/pacer";
import { serverOnly } from "@tanstack/react-start";
import type { CheerioAPI } from "cheerio";
import type { CheerioCrawlingContext } from "crawlee";
import { CheerioCrawler } from "crawlee";
import { eq } from "drizzle-orm";
import { CRAWLER_USER_AGENT } from "./config";
import { CrawlSeverity, type CrawlEventLog } from "./logging";

interface SystemDetail {
  slug: string;
  name: string;
  description?: string;
  minPlayers?: number;
  maxPlayers?: number;
  imageUrls: string[];
  tags: string[];
  publisherUrl?: string;
}

export interface TagMaps {
  categories: Record<string, number>;
  mechanics: Record<string, number>;
}

export function partitionTags(tags: string[], maps: TagMaps) {
  const categoryIds: number[] = [];
  const mechanicIds: number[] = [];
  const unmapped: Record<string, number> = {};
  for (const raw of tags) {
    const tag = raw.toLowerCase();
    if (maps.categories[tag]) {
      categoryIds.push(maps.categories[tag]);
    } else if (maps.mechanics[tag]) {
      mechanicIds.push(maps.mechanics[tag]);
    } else {
      unmapped[tag] = (unmapped[tag] ?? 0) + 1;
    }
  }
  return { categoryIds, mechanicIds, unmapped };
}

export function parseIndexPage($: CheerioAPI): string[] {
  const links: string[] = [];
  for (const el of $("a[href^='/play/game-system']").toArray()) {
    const href = $(el).attr("href");
    if (href) {
      links.push(new URL(href, "https://startplaying.games").toString());
    }
  }
  return Array.from(new Set(links));
}

export function parseDetailPage($: CheerioAPI, url: string): SystemDetail {
  const name = $("h1").first().text().trim();
  const description = $(".description").text().trim() || undefined;
  const playersText = $(".players").text();
  let minPlayers: number | undefined;
  let maxPlayers: number | undefined;
  const match = playersText.match(/(\d+)\s*-\s*(\d+)/);
  if (match) {
    minPlayers = Number(match[1]);
    maxPlayers = Number(match[2]);
  }
  const imageUrls: string[] = [];
  for (const img of $("img").toArray()) {
    const src = $(img).attr("src");
    if (src && src.startsWith("http")) {
      imageUrls.push(src);
    }
  }
  const tags: string[] = [];
  for (const tag of $(".tag").toArray()) {
    const text = $(tag).text().trim();
    if (text) tags.push(text);
  }
  const publisherUrl = $("a.publisher").attr("href") || undefined;
  const slug = new URL(url).pathname.split("/").pop() || "";
  const detail: SystemDetail = {
    slug,
    name,
    imageUrls,
    tags,
    ...(description ? { description } : {}),
    ...(minPlayers !== undefined ? { minPlayers } : {}),
    ...(maxPlayers !== undefined ? { maxPlayers } : {}),
    ...(publisherUrl ? { publisherUrl } : {}),
  };
  return detail;
}

const getDb = serverOnly(async () => {
  const { db } = await import("~/db");
  const {
    gameSystems,
    systemCrawlEvents,
    mediaAssets,
    externalCategoryMap,
    externalMechanicMap,
    gameSystemToCategory,
    gameSystemToMechanics,
  } = await import("~/db/schema");
  const database = await db();
  return {
    db: database,
    gameSystems,
    systemCrawlEvents,
    mediaAssets,
    externalCategoryMap,
    externalMechanicMap,
    gameSystemToCategory,
    gameSystemToMechanics,
  };
});

const getCloudinary = serverOnly(async () => {
  const { uploadImage, computeChecksum } = await import("../services/cloudinary");
  return { uploadImage, computeChecksum };
});

async function recordEvent(event: CrawlEventLog) {
  const { db, systemCrawlEvents, gameSystems } = await getDb();
  const system = await db
    .select({ id: gameSystems.id })
    .from(gameSystems)
    .where(eq(gameSystems.slug, event.systemSlug))
    .limit(1);
  const gameSystemId = system[0]?.id;
  if (!gameSystemId) return;
  await db.insert(systemCrawlEvents).values({
    gameSystemId,
    source: event.source,
    status: event.status,
    startedAt: event.startedAt,
    finishedAt: event.finishedAt,
    httpStatus: event.httpStatus,
    errorMessage: event.errorMessage,
    severity: event.severity,
    details: event.details ?? null,
  });
}

interface UpsertDetailResult {
  systemId: number;
  created: boolean;
  updatedFields: string[];
  uploadedAssets: number;
  linkedCategories: number;
  linkedMechanics: number;
  unmapped: Record<string, number>;
}

export async function upsertDetail(
  detail: SystemDetail,
  maps: TagMaps,
  unmappedCounts: Record<string, number>,
): Promise<UpsertDetailResult> {
  const { db, gameSystems, mediaAssets, gameSystemToCategory, gameSystemToMechanics } =
    await getDb();
  const { uploadImage, computeChecksum } = await getCloudinary();

  const existing = await db
    .select({
      id: gameSystems.id,
      descriptionScraped: gameSystems.descriptionScraped,
      minPlayers: gameSystems.minPlayers,
      maxPlayers: gameSystems.maxPlayers,
      publisherUrl: gameSystems.publisherUrl,
      externalRefs: gameSystems.externalRefs,
      heroImageId: gameSystems.heroImageId,
    })
    .from(gameSystems)
    .where(eq(gameSystems.slug, detail.slug))
    .limit(1);

  const now = new Date();
  let systemId: number;
  let created = false;
  const updatedFields: string[] = [];
  const heroImageId: number | null = existing[0]?.heroImageId ?? null;

  if (existing.length === 0) {
    const inserted = (await db
      .insert(gameSystems)
      .values({
        name: detail.name,
        slug: detail.slug,
        descriptionScraped: detail.description,
        minPlayers: detail.minPlayers,
        maxPlayers: detail.maxPlayers,
        publisherUrl: detail.publisherUrl,
        externalRefs: { startplaying: detail.slug },
        crawlStatus: "success",
        lastCrawledAt: now,
        lastSuccessAt: now,
      })
      .returning()) as { id: number }[];
    systemId = inserted[0]!.id;
    created = true;
  } else {
    const existingRow = existing[0];
    systemId = existingRow.id;
    const updates: Record<string, unknown> = {
      crawlStatus: "success",
      lastCrawledAt: now,
    };

    const applyChange = <T>(field: keyof typeof existingRow, value: T) => {
      const previous = (existingRow as Record<string, unknown>)[field] ?? null;
      const next = (value as unknown) ?? null;
      if (previous !== next) {
        updates[field as string] = value;
        updatedFields.push(field as string);
      }
    };

    applyChange("descriptionScraped", detail.description ?? null);
    applyChange("minPlayers", detail.minPlayers ?? null);
    applyChange("maxPlayers", detail.maxPlayers ?? null);
    applyChange("publisherUrl", detail.publisherUrl ?? null);

    const mergedRefs = {
      ...(existingRow.externalRefs ?? {}),
      startplaying: detail.slug,
    };
    if ((existingRow.externalRefs?.startplaying ?? null) !== detail.slug) {
      updates["externalRefs"] = mergedRefs;
      updatedFields.push("externalRefs");
    }

    if (updatedFields.length > 0) {
      updates["lastSuccessAt"] = now;
      await db.update(gameSystems).set(updates).where(eq(gameSystems.id, systemId));
    } else {
      await db
        .update(gameSystems)
        .set({ crawlStatus: "success", lastCrawledAt: now })
        .where(eq(gameSystems.id, systemId));
    }
  }

  const { categoryIds, mechanicIds, unmapped } = partitionTags(detail.tags, maps);
  for (const tag of Object.keys(unmapped)) {
    unmappedCounts[tag] = (unmappedCounts[tag] ?? 0) + unmapped[tag];
  }

  let linkedCategories = 0;
  if (categoryIds.length) {
    const inserted = await db
      .insert(gameSystemToCategory)
      .values(categoryIds.map((id) => ({ gameSystemId: systemId, categoryId: id })))
      .onConflictDoNothing()
      .returning();
    linkedCategories = inserted.length;
  }

  let linkedMechanics = 0;
  if (mechanicIds.length) {
    const inserted = await db
      .insert(gameSystemToMechanics)
      .values(mechanicIds.map((id) => ({ gameSystemId: systemId, mechanicsId: id })))
      .onConflictDoNothing()
      .returning();
    linkedMechanics = inserted.length;
  }

  const existingAssets = await db
    .select({ checksum: mediaAssets.checksum })
    .from(mediaAssets)
    .where(eq(mediaAssets.gameSystemId, systemId));
  const existingChecksums = new Set(
    existingAssets.map((asset) => asset.checksum).filter(Boolean),
  );

  let uploadedAssets = 0;
  if (detail.imageUrls.length) {
    const uploadedIds: number[] = [];
    for (let i = 0; i < detail.imageUrls.length; i++) {
      const url = detail.imageUrls[i];
      const checksum = computeChecksum(url);
      if (existingChecksums.has(checksum)) {
        continue;
      }
      const asset = await uploadImage(url, {
        checksum,
        kind: i === 0 ? "hero" : "gallery",
        moderated: false,
      });
      const inserted = (await db
        .insert(mediaAssets)
        .values({
          gameSystemId: systemId,
          publicId: asset.publicId,
          secureUrl: asset.secureUrl,
          width: asset.width,
          height: asset.height,
          format: asset.format,
          license: asset.license,
          licenseUrl: asset.licenseUrl,
          kind: asset.kind,
          orderIndex: i,
          moderated: asset.moderated,
          checksum: asset.checksum,
        })
        .returning()) as { id: number }[];
      uploadedIds.push(inserted[0]!.id);
      if (asset.checksum) {
        existingChecksums.add(asset.checksum);
      }
    }
    uploadedAssets = uploadedIds.length;
    if (uploadedIds.length && !heroImageId) {
      await db
        .update(gameSystems)
        .set({ heroImageId: uploadedIds[0] })
        .where(eq(gameSystems.id, systemId));
    }
  }

  return {
    systemId,
    created,
    updatedFields,
    uploadedAssets,
    linkedCategories,
    linkedMechanics,
    unmapped,
  };
}

export async function crawlStartPlayingSystems(
  startUrl = "https://startplaying.games/play/game-systems",
) {
  const robots = await fetch("https://startplaying.games/robots.txt").then((r) =>
    r.text(),
  );
  if (robots.includes("Disallow: /play")) {
    throw new Error("Crawling disallowed by robots.txt");
  }
  const pace = asyncRateLimit(async () => {}, { limit: 1, window: 2000 });

  const { db, externalCategoryMap, externalMechanicMap } = await getDb();
  const categoryRows = await db
    .select({ tag: externalCategoryMap.externalTag, id: externalCategoryMap.categoryId })
    .from(externalCategoryMap)
    .where(eq(externalCategoryMap.source, "startplaying"));
  const mechanicRows = await db
    .select({ tag: externalMechanicMap.externalTag, id: externalMechanicMap.mechanicId })
    .from(externalMechanicMap)
    .where(eq(externalMechanicMap.source, "startplaying"));

  const maps: TagMaps = { categories: {}, mechanics: {} };
  for (const row of categoryRows) {
    maps.categories[row.tag.toLowerCase()] = row.id;
  }
  for (const row of mechanicRows) {
    maps.mechanics[row.tag.toLowerCase()] = row.id;
  }

  const unmappedCounts: Record<string, number> = {};

  const crawler = new CheerioCrawler({
    maxConcurrency: 1,
    async requestHandler({ request, $, enqueueLinks, log }: CheerioCrawlingContext) {
      await pace();
      await new Promise((r) => setTimeout(r, 100 + Math.random() * 300));
      if (request.url === startUrl) {
        const links = parseIndexPage($);
        for (const link of links) {
          await enqueueLinks({ urls: [link] });
        }
        return;
      }
      const startedAt = new Date();
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const detail = parseDetailPage($, request.url);
          const result = await upsertDetail(detail, maps, unmappedCounts);
          const noop =
            !result.created &&
            result.updatedFields.length === 0 &&
            result.uploadedAssets === 0 &&
            result.linkedCategories === 0 &&
            result.linkedMechanics === 0;
          const details: Record<string, unknown> = {
            created: result.created,
            updatedFields: result.updatedFields,
            uploadedAssets: result.uploadedAssets,
            linkedCategories: result.linkedCategories,
            linkedMechanics: result.linkedMechanics,
            noop,
          };
          if (Object.keys(result.unmapped).length > 0) {
            details["unmapped"] = result.unmapped;
          }
          await recordEvent({
            systemSlug: detail.slug,
            source: "startplaying",
            status: "success",
            startedAt,
            finishedAt: new Date(),
            severity: CrawlSeverity.INFO,
            details,
          });
          log.info(`crawled ${detail.slug}`);
          return;
        } catch (error) {
          if (attempt === 2) {
            await recordEvent({
              systemSlug: new URL(request.url).pathname.split("/").pop() || "",
              source: "startplaying",
              status: "error",
              startedAt,
              finishedAt: new Date(),
              errorMessage: error instanceof Error ? error.message : String(error),
              severity: CrawlSeverity.ERROR,
              details: { attempts: attempt + 1 },
            });
            return;
          }
          const delay = 1000 * 2 ** attempt;
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    },
    preNavigationHooks: [
      async ({ request }: CheerioCrawlingContext) => {
        request.headers ??= {};
        request.headers["User-Agent"] = CRAWLER_USER_AGENT;
      },
    ],
  });
  await crawler.run([startUrl]);
  if (Object.keys(unmappedCounts).length) {
    console.warn("Unmapped tags", unmappedCounts);
  }
}
