import { asyncRateLimit } from "@tanstack/pacer";
import { serverOnly } from "@tanstack/react-start";
import type { CheerioAPI } from "cheerio";
import type { CheerioCrawlingContext } from "crawlee";
import { CheerioCrawler } from "crawlee";
import { eq } from "drizzle-orm";
import { CRAWLER_USER_AGENT } from "./config";
import { CrawlSeverity, type CrawlEventLog } from "./logging";

const START_PLAYING_BASE = "https://startplaying.games";
const START_PLAYING_GRAPHQL = `${START_PLAYING_BASE}/api/graphql`;

async function fetchSeoGameSystemLinks(): Promise<string[]> {
  try {
    const response = await fetch(START_PLAYING_GRAPHQL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        operationName: "GetSeoPages",
        variables: {
          includeSeoPage: true,
          seoPageFilter: {
            seoEntityPrimary: {
              slug: {
                eq: "game-systems",
              },
            },
            seoEntitySecondary: null,
          },
          filter: {
            seoEntityPrimary: {
              type: {
                eq: "GAME_SYSTEM",
              },
            },
            seoEntitySecondary: null,
          },
          sort: {
            key: "gameCount",
            sortOrder: "DESCENDING",
          },
          limit: 500,
        },
        extensions: {
          persistedQuery: {
            version: 1,
            sha256Hash:
              "8c89dfb373162dd4c01a622975a4d35df0c84158a4dc3884dc98e9a34dc9df4c",
          },
        },
      }),
    });

    if (!response.ok) {
      console.warn("Failed to fetch SEO pages", response.status, response.statusText);
      return [];
    }

    const data = (await response.json()) as {
      data?: {
        seoPages?: {
          edges?: Array<{ node?: { canonicalUrl?: string } }>;
        };
      };
    };

    const edges = data.data?.seoPages?.edges ?? [];
    const urls: string[] = [];
    for (const edge of edges) {
      const path = edge?.node?.canonicalUrl;
      if (!path) continue;
      const normalizedPath = path.startsWith("/play/")
        ? path
        : `/play${path.startsWith("/") ? path : `/${path}`}`;
      if (normalizedPath.startsWith("/play/")) {
        urls.push(new URL(normalizedPath, START_PLAYING_BASE).toString());
      }
    }
    return urls;
  } catch (error) {
    console.warn("Error fetching SEO page list", error);
    return [];
  }
}

function getNextData(html: string) {
  const match = html.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s);
  if (!match) return null;
  const payload = match[1];
  try {
    return JSON.parse(payload) as unknown;
  } catch (error) {
    console.warn("Failed to parse __NEXT_DATA__ payload", error);
    return null;
  }
}

function traverseForLinks(value: unknown, links: Set<string>) {
  if (!value) return;
  if (typeof value === "string") {
    if (/^\/play\/(?!game-systems)([a-z0-9-]+)$/i.test(value)) {
      links.add(new URL(value, START_PLAYING_BASE).toString());
    }
    return;
  }
  if (Array.isArray(value)) {
    for (const entry of value) {
      traverseForLinks(entry, links);
    }
    return;
  }
  if (typeof value === "object") {
    for (const entry of Object.values(value as Record<string, unknown>)) {
      traverseForLinks(entry, links);
    }
  }
}

type UnknownRecord = Record<string, unknown>;

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function normalizeSlug(candidate: string | undefined, fallbackName?: string) {
  const normalized = candidate?.trim().toLowerCase() ?? "";
  if (normalized) return normalized;
  if (fallbackName) {
    return slugify(fallbackName);
  }
  return "";
}

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value && typeof value === "object");
}

function extractHeroSection(nextData: unknown): UnknownRecord | null {
  if (!isRecord(nextData)) return null;
  const props = nextData["props"];
  if (!isRecord(props)) return null;
  const pageProps = props["pageProps"];
  if (!isRecord(pageProps)) return null;
  const initialCache = pageProps["initialCache"];
  if (!isRecord(initialCache)) return null;
  for (const value of Object.values(initialCache)) {
    if (!isRecord(value)) continue;
    if (value["__typename"] === "SeoPage" && isRecord(value["heroSection"])) {
      return value["heroSection"] as UnknownRecord;
    }
  }
  return null;
}

function getHeroMetadataItems(
  heroSection: UnknownRecord,
  title: string,
): UnknownRecord[] {
  const metadata = Array.isArray(heroSection["metadata"])
    ? (heroSection["metadata"] as unknown[])
    : [];
  const normalizedTitle = title.trim().toLowerCase();
  for (const meta of metadata) {
    if (!isRecord(meta)) continue;
    if (meta["__typename"] !== "SeoPageHeroSectionMetadata") continue;
    const metaTitle =
      typeof meta["title"] === "string" ? meta["title"].trim().toLowerCase() : "";
    if (metaTitle !== normalizedTitle) continue;
    const items = Array.isArray(meta["items"]) ? (meta["items"] as unknown[]) : [];
    return items.filter(
      (item): item is UnknownRecord =>
        isRecord(item) && item["__typename"] === "SeoPageHeroSectionMetadataItem",
    );
  }
  return [];
}

function extractHeroImage(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }
  if (!isRecord(value)) return null;

  const directKeys = ["url", "src", "href"] as const;
  for (const key of directKeys) {
    const candidate = value[key];
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  const image = value["image"];
  if (image) {
    const nested = extractHeroImage(image);
    if (nested) return nested;
  }

  const sources = value["sources"];
  if (Array.isArray(sources)) {
    for (const source of sources) {
      const nested = extractHeroImage(source);
      if (nested) return nested;
    }
  }

  const images = value["images"];
  if (Array.isArray(images)) {
    for (const img of images) {
      const nested = extractHeroImage(img);
      if (nested) return nested;
    }
  }

  return null;
}

function toAbsoluteUrl(rawUrl: string): string | null {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;
  try {
    const resolved = new URL(trimmed, START_PLAYING_BASE);
    if (resolved.protocol === "http:" || resolved.protocol === "https:") {
      return resolved.toString();
    }
  } catch {
    return null;
  }
  return null;
}

function extractReleaseYearFromItems(items: UnknownRecord[]): number | null {
  let fallbackYear: number | null = null;
  for (const item of items) {
    const text = typeof item["text"] === "string" ? item["text"].trim() : "";
    if (!text) continue;
    const endMatch = text.match(/(19|20)\d{2}(?=\D*$)/);
    if (endMatch) {
      const year = Number(endMatch[0]);
      if (!Number.isNaN(year)) {
        return year;
      }
    }
    if (fallbackYear === null) {
      const match = text.match(/(19|20)\d{2}/);
      if (match) {
        const year = Number(match[0]);
        if (!Number.isNaN(year)) {
          fallbackYear = year;
        }
      }
    }
  }
  return fallbackYear;
}

interface SystemDetail {
  slug: string;
  name: string;
  description?: string;
  minPlayers?: number;
  maxPlayers?: number;
  imageUrls: string[];
  tags: string[];
  publisherUrl?: string;
  releaseYear?: number;
  publisherName?: string;
}

export interface TagMaps {
  categories: Record<string, number>;
  mechanics: Record<string, number>;
}

function parseTagValues(raw: string): string[] {
  return raw
    .split(/[•|/,]|\s{2,}/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

function addTags(
  detail: SystemDetail,
  fieldSources: Record<string, "hero" | "dom" | "missing">,
  source: "hero" | "dom",
  values: string[],
) {
  const filtered = values.map((value) => value.trim()).filter(Boolean);
  if (!filtered.length) return;
  const before = detail.tags.length;
  detail.tags = Array.from(new Set([...detail.tags, ...filtered]));
  if (detail.tags.length > before || fieldSources["tags"] === "missing") {
    fieldSources["tags"] = source;
  }
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
  for (const el of $("a[href^='/play/']").toArray()) {
    const href = $(el).attr("href");
    if (!href) continue;
    if (href.startsWith("/play/game-systems")) continue;
    const absolute = new URL(href, START_PLAYING_BASE).toString();
    links.push(absolute);
  }
  if (links.length === 0) {
    const nextData = getNextData($.root().html() ?? "");
    if (nextData) {
      const candidates = new Set<string>();
      traverseForLinks(nextData, candidates);
      candidates.forEach((link) => links.push(link));
      if (candidates.size) {
        console.info(`Recovered ${candidates.size} links via __NEXT_DATA__ traversal`);
      }
    }
    if (links.length === 0) {
      const fallback = $("a[href*='/play/']").toArray().slice(0, 5);
      if (fallback.length) {
        console.warn(
          "parseIndexPage found no direct matches; sample candidates:",
          fallback.map((el) => $(el).attr("href")),
        );
      }
    }
  }
  return Array.from(new Set(links));
}

export function parseDetailPage(
  $: CheerioAPI,
  url: string,
  log?: { info: (message: string) => void; warn: (message: string) => void },
): SystemDetail {
  const pathnameSegments = new URL(url).pathname.split("/").filter(Boolean);
  const slug = pathnameSegments[pathnameSegments.length - 1] ?? "";
  const detail: SystemDetail = {
    slug,
    name: "",
    imageUrls: [],
    tags: [],
  };

  const fieldSources: Record<
    | "name"
    | "description"
    | "minPlayers"
    | "maxPlayers"
    | "tags"
    | "images"
    | "publisherUrl"
    | "releaseYear",
    "hero" | "dom" | "missing"
  > = {
    name: "missing",
    description: "missing",
    minPlayers: "missing",
    maxPlayers: "missing",
    tags: "missing",
    images: "missing",
    publisherUrl: "missing",
    releaseYear: "missing",
  };

  const nextData = getNextData($.root().html() ?? "");
  const heroSection = extractHeroSection(nextData);

  if (heroSection) {
    const heroTitle =
      typeof heroSection["title"] === "string" ? heroSection["title"].trim() : "";
    if (heroTitle) {
      detail.name = heroTitle;
      fieldSources.name = "hero";
    }

    const heroDescription =
      typeof heroSection["descriptionPrimary"] === "string"
        ? heroSection["descriptionPrimary"].trim()
        : "";
    if (heroDescription) {
      detail.description = heroDescription;
      fieldSources.description = "hero";
    }

    const heroImage = extractHeroImage(heroSection["image"]);
    if (heroImage) {
      detail.imageUrls = [heroImage];
      fieldSources.images = "hero";
    }

    const detailsItems = getHeroMetadataItems(heroSection, "Details");
    const playersItem = detailsItems.find((item) => {
      const text = typeof item["text"] === "string" ? item["text"] : "";
      return /\b\d+\s*-\s*\d+\s*Players\b/i.test(text);
    });
    if (playersItem && typeof playersItem["text"] === "string") {
      const match = playersItem["text"].match(/(\d+)\s*-\s*(\d+)/);
      if (match) {
        const min = Number(match[1]);
        const max = Number(match[2]);
        if (!Number.isNaN(min)) {
          detail.minPlayers = min;
          fieldSources.minPlayers = "hero";
        }
        if (!Number.isNaN(max)) {
          detail.maxPlayers = max;
          fieldSources.maxPlayers = "hero";
        }
      }
    }

    const detailTagValues = detailsItems
      .map((item) => (typeof item["text"] === "string" ? item["text"].trim() : ""))
      .filter((text) => text.length > 0)
      .filter((text) => !/\b\d+\s*-\s*\d+\s*Players\b/i.test(text))
      .flatMap((text) => parseTagValues(text));
    addTags(detail, fieldSources, "hero", detailTagValues);

    const metadataTagTitles = ["Themes", "Tags", "Genres", "Mechanics", "Game Mechanics"];

    for (const title of metadataTagTitles) {
      const normalizedTitle = title.toLowerCase();
      const items = getHeroMetadataItems(heroSection, title);
      const values = items
        .map((item) => (typeof item["text"] === "string" ? item["text"].trim() : ""))
        .filter(Boolean)
        .flatMap((text) => parseTagValues(text))
        .filter((value) => value.toLowerCase() !== normalizedTitle);
      addTags(detail, fieldSources, "hero", values);
    }

    const publisherItems = getHeroMetadataItems(heroSection, "Publisher");
    const publisherEntry = publisherItems.find(
      (item) =>
        typeof item["text"] === "string" &&
        item["text"].trim() &&
        typeof item["url"] === "string" &&
        item["url"].trim(),
    );
    if (publisherEntry) {
      detail.publisherName = (publisherEntry["text"] as string).trim();
      const resolvedPublisherUrl = toAbsoluteUrl(publisherEntry["url"] as string);
      if (resolvedPublisherUrl) {
        detail.publisherUrl = resolvedPublisherUrl;
        fieldSources.publisherUrl = "hero";
      }
    }

    const releaseItems = getHeroMetadataItems(heroSection, "Release Date");
    const releaseYear = extractReleaseYearFromItems(releaseItems);
    if (releaseYear !== null) {
      detail.releaseYear = releaseYear;
      fieldSources.releaseYear = "hero";
    }
  }

  if (!detail.name) {
    const domName = $("h1").first().text().trim();
    if (domName) {
      detail.name = domName;
      fieldSources.name = "dom";
    } else {
      detail.name = slug;
    }
  }

  detail.slug = normalizeSlug(detail.slug, detail.name);

  if (!detail.description) {
    const domDescription = $(".description").first().text().trim();
    if (domDescription) {
      detail.description = domDescription;
      fieldSources.description = "dom";
    }
  }

  if (detail.imageUrls.length === 0) {
    const domImages = new Set<string>();
    for (const img of $("img").toArray()) {
      const src = $(img).attr("src");
      if (src && /^https?:/i.test(src)) {
        domImages.add(src);
      }
    }
    if (domImages.size > 0) {
      detail.imageUrls = Array.from(domImages);
      fieldSources.images = "dom";
    }
  }

  const textElements = $("span,div,p");

  if (detail.releaseYear === undefined && textElements.length) {
    const releaseElement = textElements
      .filter(
        (_, el) => /release/i.test($(el).text()) && /(19|20)\d{2}/.test($(el).text()),
      )
      .first();
    if (releaseElement.length) {
      const text = releaseElement.text();
      const endMatch = text.match(/(19|20)\d{2}(?=\D*$)/);
      const match = endMatch ?? text.match(/(19|20)\d{2}/);
      if (match) {
        detail.releaseYear = Number(match[0]);
        fieldSources.releaseYear = "dom";
      }
    }
  }

  if (!detail.publisherName || !detail.publisherUrl) {
    const publisherElement = textElements
      .filter((_, el) => /publisher/i.test($(el).text()) && $(el).find("a").length > 0)
      .first();
    if (publisherElement.length) {
      const publisherAnchor = publisherElement.find("a").first();
      const publisherName = publisherAnchor.text().trim();
      const publisherHref = publisherAnchor.attr("href") ?? "";
      if (!detail.publisherName && publisherName) {
        detail.publisherName = publisherName;
      }
      if (!detail.publisherUrl) {
        const resolved = toAbsoluteUrl(publisherHref);
        if (resolved) {
          detail.publisherUrl = resolved;
          fieldSources.publisherUrl =
            fieldSources.publisherUrl === "missing" ? "dom" : fieldSources.publisherUrl;
        }
      }
    }
  }

  const metadataSectionTitles = new Set([
    "themes",
    "tags",
    "genres",
    "mechanics",
    "game mechanics",
    "systems",
  ]);

  $("div").each((_, el) => {
    const label = $(el).children().first().text().trim().toLowerCase();
    if (!metadataSectionTitles.has(label)) return;

    const anchorValues = $(el)
      .find("a")
      .map((__, anchor) => $(anchor).text().trim())
      .get();
    const chipValues = $(el)
      .find("span,div")
      .map((__, node) => $(node).text().trim())
      .get();

    const combined = [...anchorValues, ...chipValues]
      .map((value) => value.trim())
      .filter(Boolean)
      .flatMap((text) => parseTagValues(text))
      .filter((value) => value.toLowerCase() !== label);

    addTags(detail, fieldSources, "dom", combined);
  });

  detail.tags = Array.from(new Set(detail.tags));

  if (log) {
    log.info(
      `Field sources for ${slug}: name=${fieldSources.name}, description=${fieldSources.description}, ` +
        `minPlayers=${fieldSources.minPlayers}, maxPlayers=${fieldSources.maxPlayers}, tags=${fieldSources.tags}, images=${fieldSources.images}, publisherUrl=${fieldSources.publisherUrl}, releaseYear=${fieldSources.releaseYear}`,
    );
    log.info(
      `Field values for ${slug}: minPlayers=${
        detail.minPlayers ?? "n/a"
      }, maxPlayers=${detail.maxPlayers ?? "n/a"}, tags=${detail.tags.length}, images=${
        detail.imageUrls.length
      }, descriptionLen=${detail.description?.length ?? 0}, releaseYear=${
        detail.releaseYear ?? "n/a"
      }, publisherUrl=${detail.publisherUrl ?? "n/a"}, publisherName=${
        detail.publisherName ?? "n/a"
      }`,
    );
  }

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
    publishers,
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
    publishers,
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
  const {
    db,
    gameSystems,
    mediaAssets,
    gameSystemToCategory,
    gameSystemToMechanics,
    publishers,
  } = await getDb();
  const { uploadImage, computeChecksum } = await getCloudinary();

  let existing = await db
    .select({
      id: gameSystems.id,
      descriptionScraped: gameSystems.descriptionScraped,
      minPlayers: gameSystems.minPlayers,
      maxPlayers: gameSystems.maxPlayers,
      publisherUrl: gameSystems.publisherUrl,
      publisherId: gameSystems.publisherId,
      yearReleased: gameSystems.yearReleased,
      externalRefs: gameSystems.externalRefs,
      heroImageId: gameSystems.heroImageId,
      releaseDate: gameSystems.releaseDate,
      slug: gameSystems.slug,
    })
    .from(gameSystems)
    .where(eq(gameSystems.slug, detail.slug))
    .limit(1);

  if (existing.length === 0 && detail.name) {
    const existingByName = await db
      .select({
        id: gameSystems.id,
        descriptionScraped: gameSystems.descriptionScraped,
        minPlayers: gameSystems.minPlayers,
        maxPlayers: gameSystems.maxPlayers,
        publisherUrl: gameSystems.publisherUrl,
        publisherId: gameSystems.publisherId,
        yearReleased: gameSystems.yearReleased,
        externalRefs: gameSystems.externalRefs,
        heroImageId: gameSystems.heroImageId,
        releaseDate: gameSystems.releaseDate,
        slug: gameSystems.slug,
      })
      .from(gameSystems)
      .where(eq(gameSystems.name, detail.name))
      .limit(1);
    if (existingByName.length) {
      existing = existingByName;
      if (!detail.slug && existingByName[0]?.slug) {
        detail.slug = existingByName[0]!.slug ?? detail.slug;
      }
      console.warn(
        `Matched existing system by name for ${detail.name}; using existing record with slug=${existingByName[0]?.slug ?? detail.slug}`,
      );
    }
  }

  const now = new Date();
  let systemId: number;
  let created = false;
  const updatedFields: string[] = [];
  const heroImageId: number | null = existing[0]?.heroImageId ?? null;
  const releaseDate =
    typeof detail.releaseYear === "number"
      ? new Date(Date.UTC(detail.releaseYear, 0, 1))
      : null;
  const releaseDateValue = releaseDate ? releaseDate.toISOString().slice(0, 10) : null;
  const releaseYearValue = detail.releaseYear ?? null;

  const publisherName = detail.publisherName?.trim();
  let publisherRecord: typeof publishers.$inferSelect | null = null;
  if (publisherName) {
    publisherRecord =
      (await db.query.publishers.findFirst({
        where: eq(publishers.name, publisherName),
      })) ?? null;
    if (!publisherRecord) {
      const insertedPublisher = await db
        .insert(publishers)
        .values({
          name: publisherName,
          websiteUrl: detail.publisherUrl ?? null,
        })
        .onConflictDoNothing()
        .returning();
      if (insertedPublisher.length > 0) {
        publisherRecord = insertedPublisher[0] as typeof publishers.$inferSelect;
      } else {
        publisherRecord =
          (await db.query.publishers.findFirst({
            where: eq(publishers.name, publisherName),
          })) ?? null;
      }
    } else if (
      detail.publisherUrl &&
      publisherRecord.websiteUrl !== detail.publisherUrl
    ) {
      await db
        .update(publishers)
        .set({ websiteUrl: detail.publisherUrl })
        .where(eq(publishers.id, publisherRecord.id));
      publisherRecord = { ...publisherRecord, websiteUrl: detail.publisherUrl };
    }
  }

  const resolvedPublisherUrl = detail.publisherUrl ?? publisherRecord?.websiteUrl ?? null;
  if (!detail.publisherUrl && resolvedPublisherUrl) {
    detail.publisherUrl = resolvedPublisherUrl;
  }

  if (existing.length === 0) {
    const inserted = (await db
      .insert(gameSystems)
      .values({
        name: detail.name,
        slug: detail.slug,
        descriptionScraped: detail.description,
        minPlayers: detail.minPlayers,
        maxPlayers: detail.maxPlayers,
        publisherUrl: resolvedPublisherUrl,
        publisherId: publisherRecord?.id ?? null,
        releaseDate: releaseDateValue,
        yearReleased: releaseYearValue,
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

    applyChange("slug", detail.slug);
    applyChange("descriptionScraped", detail.description ?? null);
    applyChange("minPlayers", detail.minPlayers ?? null);
    applyChange("maxPlayers", detail.maxPlayers ?? null);
    applyChange("publisherUrl", resolvedPublisherUrl);
    applyChange("releaseDate", releaseDateValue);
    applyChange("yearReleased", releaseYearValue);
    if (publisherRecord) {
      applyChange("publisherId", publisherRecord.id);
    }

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
      let asset: Awaited<ReturnType<typeof uploadImage>> | null = null;
      try {
        asset = await uploadImage(url, {
          checksum,
          kind: i === 0 ? "hero" : "gallery",
          moderated: false,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`Failed to upload image for ${detail.slug} (${url}): ${message}`);
        continue;
      }
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
      log.info(`Processing ${request.url}`);
      await pace();
      await new Promise((r) => setTimeout(r, 100 + Math.random() * 300));
      if (request.url === startUrl) {
        const links = parseIndexPage($);
        log.info(`Index page yielded ${links.length} candidate system links`);
        if (links.length) {
          log.info(
            `First few system links: ${links
              .slice(0, 5)
              .map((link) => new URL(link).pathname)
              .join(", ")}`,
          );
        } else {
          const seoLinks = await fetchSeoGameSystemLinks();
          if (seoLinks.length) {
            log.info(`GraphQL recovered ${seoLinks.length} system links`);
            links.push(...seoLinks);
          }
        }
        for (const link of links) {
          await enqueueLinks({ urls: [link] });
        }
        return;
      }
      const startedAt = new Date();
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const detail = parseDetailPage($, request.url, log);
          log.info(
            `Parsed detail for ${detail.slug}: name=${detail.name}, tags=${detail.tags.length}, images=${detail.imageUrls.length}`,
          );
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
          if (noop) {
            log.info(`No-op update for ${detail.slug}`);
          } else {
            log.info(
              `Upsert summary for ${detail.slug}: created=${result.created}, updatedFields=${result.updatedFields.join(",") || "none"}, ` +
                `uploadedAssets=${result.uploadedAssets}, categories=${result.linkedCategories}, mechanics=${result.linkedMechanics}`,
            );
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
          const message = error instanceof Error ? error.message : String(error);
          log.error(`Failed to process ${request.url}: ${message}`);
          console.error(`Failed to process ${request.url}`, error);
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
