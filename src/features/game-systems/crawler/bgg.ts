import { and, eq } from "drizzle-orm";
import { XMLParser } from "fast-xml-parser";
import type { db } from "~/db";
import {
  externalCategoryMap,
  externalMechanicMap,
  gameSystemToCategory,
  gameSystemToMechanics,
  gameSystems,
  mediaAssets,
} from "~/db/schema";
import type { ExternalRefs } from "~/db/schema/game-systems.schema";
import type { CrawlSeverity as CrawlSeverityType } from "./logging";

interface SearchItem {
  "@_id": string;
  name?: { "@_value": string };
}

interface SearchResponse {
  items?: { item?: SearchItem | SearchItem[] };
}

export function parseSearch(xml: string, name: string): number | null {
  const parser = new XMLParser({ ignoreAttributes: false });
  const data = parser.parse(xml) as SearchResponse;
  const items = data.items?.item;
  if (!items) return null;
  const list = Array.isArray(items) ? items : [items];
  const match = list.find(
    (i) => i.name?.["@_value"]?.toLowerCase() === name.toLowerCase(),
  );
  const chosen = match ?? list[0];
  return chosen ? Number(chosen["@_id"]) : null;
}

export interface BggThing {
  yearPublished?: number;
  publishers: string[];
  categories: string[];
  mechanics: string[];
  numComments?: number;
  usersRated?: number;
  description?: string;
  thumbnail?: string;
  image?: string;
  minPlayers?: number;
  maxPlayers?: number;
  playingTime?: number;
  minAge?: number;
}

interface ThingLink {
  "@_type": string;
  "@_value": string;
}

interface ThingRatings {
  usersrated?: { "@_value": string };
  numcomments?: { "@_value": string };
}

interface ThingItem {
  yearpublished?: { "@_value": string };
  minplayers?: { "@_value": string };
  maxplayers?: { "@_value": string };
  playingtime?: { "@_value": string };
  minage?: { "@_value": string };
  description?: string;
  thumbnail?: string;
  image?: string;
  link?: ThingLink | ThingLink[];
  statistics?: { ratings?: ThingRatings };
}

interface ThingResponse {
  items?: { item?: ThingItem };
}

export function parseThing(xml: string): BggThing {
  const parser = new XMLParser({ ignoreAttributes: false });
  const data = parser.parse(xml) as ThingResponse;
  const item = data.items?.item;
  const links = item?.link ? (Array.isArray(item.link) ? item.link : [item.link]) : [];
  const getValues = (type: string) =>
    links.filter((l) => l["@_type"] === type).map((l) => l["@_value"]);

  const year = item?.yearpublished?.["@_value"];
  const minPlayers = item?.minplayers?.["@_value"];
  const maxPlayers = item?.maxplayers?.["@_value"];
  const playingTime = item?.playingtime?.["@_value"];
  const minAge = item?.minage?.["@_value"];
  const ratings = item?.statistics?.ratings;
  const numCommentsRaw = ratings?.numcomments?.["@_value"];
  const usersRatedRaw = ratings?.usersrated?.["@_value"];

  return {
    ...(year ? { yearPublished: Number(year) } : {}),
    ...(minPlayers ? { minPlayers: Number(minPlayers) } : {}),
    ...(maxPlayers ? { maxPlayers: Number(maxPlayers) } : {}),
    ...(playingTime ? { playingTime: Number(playingTime) } : {}),
    ...(minAge ? { minAge: Number(minAge) } : {}),
    publishers: getValues("boardgamepublisher"),
    categories: getValues("boardgamecategory"),
    mechanics: getValues("boardgamemechanic"),
    ...(item?.description ? { description: item.description.trim() } : {}),
    ...(item?.thumbnail ? { thumbnail: item.thumbnail.trim() } : {}),
    ...(item?.image ? { image: item.image.trim() } : {}),
    ...(numCommentsRaw ? { numComments: Number(numCommentsRaw) } : {}),
    ...(usersRatedRaw ? { usersRated: Number(usersRatedRaw) } : {}),
  };
}

export async function searchBggId(name: string) {
  const userAgent = process.env["CRAWLER_USER_AGENT"] ?? "SolsticeGameCrawler/1.0";
  const res = await fetch(
    `https://boardgamegeek.com/xmlapi2/search?type=boardgame&query=${encodeURIComponent(
      name,
    )}`,
    {
      headers: {
        "User-Agent": userAgent,
      },
    },
  );
  const text = await res.text();
  return parseSearch(text, name);
}

export async function fetchBggThing(id: number) {
  const userAgent = process.env["CRAWLER_USER_AGENT"] ?? "SolsticeGameCrawler/1.0";
  const res = await fetch(`https://boardgamegeek.com/xmlapi2/thing?id=${id}&stats=1`, {
    headers: {
      "User-Agent": userAgent,
    },
  });
  const text = await res.text();
  return parseThing(text);
}

type Db = Awaited<ReturnType<typeof db>>;

interface EnrichParams {
  id: number;
  name: string;
  externalRefs?: ExternalRefs | null;
  releaseDate?: Date | null;
  cmsApproved?: boolean;
}

/**
 * Preserve existing media assets when recrawling.
 * Returns true if existing assets should be preserved.
 */
async function shouldPreserveMediaAssets(
  database: Db,
  gameSystemId: number,
): Promise<boolean> {
  const { hasModeratedMediaAssets } = await import("~/lib/storage/media-assets");
  return await hasModeratedMediaAssets(database, gameSystemId);
}

/**
 * Handle BGG media assets (thumbnail and image URLs).
 * Only creates new assets if no moderated assets exist for the game system.
 */
async function handleBggMediaAssets(
  database: Db,
  gameSystemId: number,
  thing: BggThing,
): Promise<void> {
  // Skip if no media URLs available
  if (!thing.thumbnail && !thing.image) {
    return;
  }

  // Check if we should preserve existing assets
  const preserveAssets = await shouldPreserveMediaAssets(database, gameSystemId);
  if (preserveAssets) {
    console.log(
      `Preserving existing moderated media assets for game system ${gameSystemId}`,
    );
    return;
  }

  // Remove existing non-moderated assets from both Cloudinary and database
  const { deleteNonModeratedMediaAssets } = await import("~/lib/storage/media-assets");
  await deleteNonModeratedMediaAssets(database, gameSystemId);

  // Upload and add thumbnail if available
  if (thing.thumbnail) {
    try {
      const { uploadGameSystemMediaFromUrl } = await import("~/lib/storage/media-assets");
      const uploadedAsset = await uploadGameSystemMediaFromUrl(
        thing.thumbnail,
        {
          type: "thumbnail",
          gameSystemId,
          source: "bgg",
          moderated: false, // BGG assets start as non-moderated
          license: "BGG Fair Use",
          licenseUrl: "https://boardgamegeek.com/wiki/page/Copyright",
          originalUrl: thing.thumbnail,
        },
        database,
      );

      await database
        .insert(mediaAssets)
        .values({
          gameSystemId,
          publicId: uploadedAsset.publicId,
          secureUrl: uploadedAsset.secureUrl,
          width: uploadedAsset.width,
          height: uploadedAsset.height,
          format: uploadedAsset.format,
          kind: uploadedAsset.kind,
          orderIndex: 0,
          moderated: uploadedAsset.moderated,
          checksum: uploadedAsset.checksum,
          license: uploadedAsset.license,
          licenseUrl: uploadedAsset.licenseUrl,
        })
        .onConflictDoNothing();

      console.log(
        `Successfully uploaded BGG thumbnail to Cloudinary: ${uploadedAsset.publicId}`,
      );
    } catch (error) {
      console.warn(
        `Failed to upload BGG thumbnail to Cloudinary, falling back to URL reference:`,
        error,
      );
      console.log(`Note: BGG image URL ${thing.thumbnail} may be expired or blocked`);

      // Fallback to storing URL reference only if upload fails
      // This creates a database record but doesn't upload to Cloudinary
      await database
        .insert(mediaAssets)
        .values({
          gameSystemId,
          publicId: `bgg-thumb-fallback-${gameSystemId}-${Date.now()}`,
          secureUrl: thing.thumbnail,
          kind: "thumbnail",
          orderIndex: 0,
          moderated: false, // BGG assets start as non-moderated
          license: "BGG Fair Use",
          licenseUrl: "https://boardgamegeek.com/wiki/page/Copyright",
          checksum: `fallback-${thing.thumbnail.slice(-20)}`, // Create a checksum for the URL
        })
        .onConflictDoNothing();

      console.log(`Created fallback record for BGG thumbnail: ${thing.thumbnail}`);
    }
  }

  // Upload and add main image if available and different from thumbnail
  if (thing.image && thing.image !== thing.thumbnail) {
    try {
      const { uploadGameSystemMediaFromUrl } = await import("~/lib/storage/media-assets");
      const uploadedAsset = await uploadGameSystemMediaFromUrl(
        thing.image,
        {
          type: "hero",
          gameSystemId,
          source: "bgg",
          moderated: false, // BGG assets start as non-moderated
          license: "BGG Fair Use",
          licenseUrl: "https://boardgamegeek.com/wiki/page/Copyright",
          originalUrl: thing.image,
        },
        database,
      );

      await database
        .insert(mediaAssets)
        .values({
          gameSystemId,
          publicId: uploadedAsset.publicId,
          secureUrl: uploadedAsset.secureUrl,
          width: uploadedAsset.width,
          height: uploadedAsset.height,
          format: uploadedAsset.format,
          kind: uploadedAsset.kind,
          orderIndex: 1,
          moderated: uploadedAsset.moderated,
          checksum: uploadedAsset.checksum,
          license: uploadedAsset.license,
          licenseUrl: uploadedAsset.licenseUrl,
        })
        .onConflictDoNothing();

      console.log(
        `Successfully uploaded BGG hero image to Cloudinary: ${uploadedAsset.publicId}`,
      );
    } catch (error) {
      console.warn(
        `Failed to upload BGG hero image to Cloudinary, falling back to URL reference:`,
        error,
      );
      console.log(`Note: BGG image URL ${thing.image} may be expired or blocked`);

      // Fallback to storing URL reference only if upload fails
      await database
        .insert(mediaAssets)
        .values({
          gameSystemId,
          publicId: `bgg-image-fallback-${gameSystemId}-${Date.now()}`,
          secureUrl: thing.image,
          kind: "hero",
          orderIndex: 1,
          moderated: false, // BGG assets start as non-moderated
          license: "BGG Fair Use",
          licenseUrl: "https://boardgamegeek.com/wiki/page/Copyright",
          checksum: `fallback-${thing.image.slice(-20)}`, // Create a checksum for the URL
        })
        .onConflictDoNothing();

      console.log(`Created fallback record for BGG hero image: ${thing.image}`);
    }
  }
}

export async function enrichFromBgg(
  database: Db,
  system: EnrichParams,
  preloadedThing?: BggThing | null,
) {
  const existingId = system.externalRefs?.bgg;
  const bggId = existingId ? Number(existingId) : await searchBggId(system.name);
  if (!bggId) return null;
  const thing = preloadedThing ?? (await fetchBggThing(bggId));
  const externalRefs = { ...(system.externalRefs ?? {}), bgg: String(bggId) };
  const update: Record<string, unknown> = { externalRefs };

  // Basic date update
  if (!system.releaseDate && thing.yearPublished) {
    update["releaseDate"] = new Date(thing.yearPublished, 0, 1);
  }

  // Only update scraped description if not already CMS approved
  if (thing.description && !system.cmsApproved) {
    update["descriptionScraped"] = thing.description;
  }

  // Update game metadata (only if not CMS approved to preserve manual edits)
  if (!system.cmsApproved) {
    if (thing.minPlayers) update["minPlayers"] = thing.minPlayers;
    if (thing.maxPlayers) update["maxPlayers"] = thing.maxPlayers;
    if (thing.playingTime) update["averagePlayTime"] = thing.playingTime;
    if (thing.minAge) update["ageRating"] = thing.minAge.toString();
  }

  await database.update(gameSystems).set(update).where(eq(gameSystems.id, system.id));

  // Handle BGG media assets (only if not CMS approved)
  if (!system.cmsApproved) {
    await handleBggMediaAssets(database, system.id, thing);
  }

  for (const category of thing.categories) {
    const mapping = await database.query.externalCategoryMap.findFirst({
      where: and(
        eq(externalCategoryMap.source, "bgg"),
        eq(externalCategoryMap.externalTag, category),
      ),
    });
    if (mapping) {
      await database
        .insert(gameSystemToCategory)
        .values({ gameSystemId: system.id, categoryId: mapping.categoryId })
        .onConflictDoNothing();
    }
  }

  for (const mechanic of thing.mechanics) {
    const mapping = await database.query.externalMechanicMap.findFirst({
      where: and(
        eq(externalMechanicMap.source, "bgg"),
        eq(externalMechanicMap.externalTag, mechanic),
      ),
    });
    if (mapping) {
      await database
        .insert(gameSystemToMechanics)
        .values({
          gameSystemId: system.id,
          mechanicsId: mapping.mechanicId,
        })
        .onConflictDoNothing();
    }
  }

  return { bggId, yearPublished: thing.yearPublished };
}

/**
 * Main BGG crawler function that runs the complete crawling process
 */
export async function crawlBggSystems() {
  const { asyncRateLimit } = await import("@tanstack/pacer");
  const { load } = await import("cheerio");
  const { and, eq } = await import("drizzle-orm");
  const { Buffer } = await import("node:buffer");

  const {
    closeConnections,
    db,
    externalCategoryMap,
    externalMechanicMap,
    gameSystemCategories,
    gameSystemMechanics,
    gameSystemToCategory,
    gameSystemToMechanics,
    gameSystems,
    mediaAssets,
    publishers,
    systemCrawlEvents,
  } = await import("~/db");

  const { CRAWLER_USER_AGENT } = await import("./config");
  const { CrawlSeverity } = await import("./logging");

  type Database = Awaited<ReturnType<typeof db>>;

  interface BrowseCandidate {
    id: number;
    name: string;
    href: string;
    rank: number;
  }

  interface BggDetailData {
    name?: string;
    description?: string;
    minPlayers?: number;
    maxPlayers?: number;
    averagePlayTime?: number;
    minAge?: number;
    yearPublished?: number;
    publishers: string[];
    categories: string[];
    mechanics: string[];
    numComments?: number;
    usersRated?: number;
    averageWeight?: number;
    averageRating?: number;
    heroImageUrl?: string;
  }

  interface CandidateDetail extends BrowseCandidate {
    thing: BggThing;
    detail: BggDetailData | null;
  }

  interface TaxonomyContext {
    categories: Map<string, number>;
    mechanics: Map<string, number>;
    externalCategories: Map<string, number>;
    externalMechanics: Map<string, number>;
  }

  function normalizeName(name: string) {
    return name.trim();
  }

  function normalizeKey(name: string) {
    return name.trim().toLowerCase();
  }

  function slugify(value: string) {
    return value
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);
  }

  function releaseDateFromThing(thing: BggThing) {
    if (!thing.yearPublished) return null;
    return new Date(Date.UTC(thing.yearPublished, 0, 1)).toISOString().slice(0, 10);
  }

  const GEEK_PRELOAD_REGEX = /GEEK\.geekitemPreload\s*=\s*(\{.*?\});/s;

  function toNumber(value: unknown): number | undefined {
    if (value == null) return undefined;
    const num = Number(String(value));
    return Number.isFinite(num) ? num : undefined;
  }

  function uniqueNames(entries: unknown): string[] {
    if (!Array.isArray(entries)) return [];
    const names = new Set<string>();
    for (const entry of entries) {
      if (entry && typeof entry === "object") {
        const name = (entry as { name?: string }).name;
        if (typeof name === "string" && name.trim()) {
          names.add(name.trim());
        }
      }
    }
    return Array.from(names);
  }

  function cleanDescription(html?: string | null): string | null {
    if (!html) return null;
    const wrapper = load(`<section>${html}</section>`);
    const text = wrapper("section").text().replace(/\s+/g, " ").trim();
    return text.length ? text : null;
  }

  async function fetchBggDetailData(
    id: number,
    userAgent: string,
  ): Promise<BggDetailData | null> {
    const res = await fetch(`https://boardgamegeek.com/boardgame/${id}`, {
      headers: {
        "User-Agent": userAgent,
      },
    });
    if (!res.ok) {
      console.warn(
        `Failed to load BGG detail page for ${id}: ${res.status} ${res.statusText}`,
      );
      return null;
    }
    const html = await res.text();
    const match = GEEK_PRELOAD_REGEX.exec(html);
    if (!match) {
      console.warn(`Missing geekitemPreload data for BGG id ${id}`);
      return null;
    }
    try {
      const preload = JSON.parse(match[1]) as {
        item?: {
          name?: string;
          description?: string;
          minplayers?: string;
          maxplayers?: string;
          minplaytime?: string;
          maxplaytime?: string;
          minage?: string;
          yearpublished?: string;
          links?: Record<string, unknown>;
          stats?: Record<string, unknown>;
          images?: Record<string, unknown>;
        };
      };
      const item = preload.item;
      if (!item) return null;
      const minPlayers = toNumber(item.minplayers);
      const maxPlayers = toNumber(item.maxplayers);
      const minPlayTime = toNumber(item.minplaytime);
      const maxPlayTime = toNumber(item.maxplaytime);
      const averagePlayTime =
        minPlayTime && maxPlayTime
          ? Math.round((minPlayTime + maxPlayTime) / 2)
          : (maxPlayTime ?? minPlayTime);

      const links = item.links ?? {};
      const stats = item.stats ?? {};

      const detail: BggDetailData = {
        publishers: uniqueNames((links as Record<string, unknown>)["boardgamepublisher"]),
        categories: uniqueNames((links as Record<string, unknown>)["boardgamecategory"]),
        mechanics: uniqueNames((links as Record<string, unknown>)["boardgamemechanic"]),
      };

      const cleanedDescription = cleanDescription(item.description ?? null);
      if (cleanedDescription) {
        detail.description = cleanedDescription;
      }

      if (typeof item.name === "string" && item.name.trim()) {
        detail.name = item.name.trim();
      }
      if (minPlayers !== undefined) detail.minPlayers = minPlayers;
      if (maxPlayers !== undefined) detail.maxPlayers = maxPlayers;
      if (averagePlayTime !== undefined) detail.averagePlayTime = averagePlayTime;
      const minAge = toNumber(item.minage);
      if (minAge !== undefined) detail.minAge = minAge;
      const yearPublished = toNumber(item.yearpublished);
      if (yearPublished !== undefined) detail.yearPublished = yearPublished;

      const numComments = toNumber(stats["numcomments"]);
      if (numComments !== undefined) detail.numComments = numComments;
      const usersRated = toNumber(stats["usersrated"]);
      if (usersRated !== undefined) detail.usersRated = usersRated;
      const averageWeight = toNumber(stats["avgweight"]);
      if (averageWeight !== undefined) detail.averageWeight = averageWeight;
      const averageRating = toNumber(stats["average"]);
      if (averageRating !== undefined) detail.averageRating = averageRating;

      const images = item.images ?? {};
      const originalImage =
        typeof images["original"] === "string" ? images["original"].trim() : "";
      if (originalImage) {
        detail.heroImageUrl = originalImage;
      }

      return detail;
    } catch (error) {
      console.warn(`Failed to parse geekitemPreload for BGG id ${id}`, error);
      return null;
    }
  }

  const DEFAULT_SORT = "numvoters";

  async function fetchBrowseCandidates(
    userAgent: string,
    desired: number,
    startPage = 1,
    maxPages = 10,
  ): Promise<BrowseCandidate[]> {
    const seen = new Map<number, BrowseCandidate>();
    let page = startPage;
    const sortKey = process.env["BGG_SORT"] ?? DEFAULT_SORT;
    const sortDir = process.env["BGG_SORT_DIR"] ?? "desc";
    while (seen.size < desired && page < startPage + maxPages) {
      const pageSuffix = page === 1 ? "" : `/page/${page}`;
      const url = `https://boardgamegeek.com/browse/boardgame${pageSuffix}?sort=${sortKey}&sortdir=${sortDir}`;
      const res = await fetch(url, {
        headers: {
          "User-Agent": userAgent,
        },
      });
      if (!res.ok) {
        console.warn(
          `Failed to load BGG browse page ${page}: ${res.status} ${res.statusText}`,
        );
        break;
      }
      const html = await res.text();
      const $ = load(html);
      $("#collectionitems tr[id^='row_']").each((_, row) => {
        const idAttr = $(row).attr("id") ?? "";
        const anchor = $(row).find(".collection_objectname a").first();
        const name = anchor.text().trim();
        if (!name) return;
        const href = anchor.attr("href") ?? "";
        if (!href.includes("/boardgame/") && !href.includes("/rpgitem/")) {
          return;
        }
        if (href.includes("/boardgameexpansion/")) {
          return;
        }
        let id = Number(idAttr.replace("row_", ""));
        if (!Number.isFinite(id) || id === 0) {
          const match = href.match(/\/(?:boardgame|rpgitem)\/(\d+)/i);
          if (!match) return;
          id = Number(match[1]);
        }
        if (!Number.isFinite(id)) return;
        if (seen.has(id)) return;
        const rankText = $(row)
          .find(".collection_rank")
          .text()
          .replace(/[^0-9]/g, "")
          .trim();
        const rank = Number(rankText) || seen.size + 1;
        seen.set(id, { id, name, href, rank });
      });
      page += 1;
    }
    return Array.from(seen.values());
  }

  async function fetchDetailedCandidates(
    candidates: BrowseCandidate[],
    userAgent: string,
  ): Promise<CandidateDetail[]> {
    const pace = asyncRateLimit(async () => {}, { limit: 1, window: 1100 });
    const detailed: CandidateDetail[] = [];
    for (const item of candidates) {
      await pace();
      try {
        const detail = await fetchBggDetailData(item.id, userAgent);
        let thing: BggThing | null = null;
        if (detail) {
          thing = {
            publishers: detail.publishers,
            categories: detail.categories,
            mechanics: detail.mechanics,
          };
          if (detail.yearPublished !== undefined) {
            thing.yearPublished = detail.yearPublished;
          }
          if (detail.numComments !== undefined) {
            thing.numComments = detail.numComments;
          }
          if (detail.usersRated !== undefined) {
            thing.usersRated = detail.usersRated;
          }
        }
        if (!thing) {
          thing = await fetchBggThing(item.id);
        }
        if (!thing) {
          console.warn(`Skipping BGG id ${item.id}; no detail data available`);
          continue;
        }
        if (detail) {
          if (detail.publishers.length) {
            thing.publishers = detail.publishers;
          }
          if (detail.categories.length) {
            thing.categories = detail.categories;
          }
          if (detail.mechanics.length) {
            thing.mechanics = detail.mechanics;
          }
          if (detail.yearPublished !== undefined) {
            thing.yearPublished = detail.yearPublished;
          }
          if (detail.numComments !== undefined) {
            thing.numComments = detail.numComments;
          }
          if (detail.usersRated !== undefined) {
            thing.usersRated = detail.usersRated;
          }
        }
        detailed.push({ ...item, thing, detail });
      } catch (error) {
        console.warn(`Failed to fetch BGG thing for ${item.id}`, error);
      }
    }
    return detailed;
  }

  function normalizeReleaseDate(value: unknown): string | null {
    if (!value) return null;
    if (value instanceof Date) {
      return value.toISOString().slice(0, 10);
    }
    if (typeof value === "string" && value.trim()) {
      return value.slice(0, 10);
    }
    return null;
  }

  function detailsToExternalRefs(
    existing: ExternalRefs | null | undefined,
    id: number,
  ): ExternalRefs {
    return { ...(existing ?? {}), bgg: String(id) };
  }

  async function buildTaxonomyContext(database: Database): Promise<TaxonomyContext> {
    const [categoryRows, mechanicRows, externalCategoryRows, externalMechanicRows] =
      await Promise.all([
        database
          .select({ id: gameSystemCategories.id, name: gameSystemCategories.name })
          .from(gameSystemCategories),
        database
          .select({ id: gameSystemMechanics.id, name: gameSystemMechanics.name })
          .from(gameSystemMechanics),
        database
          .select({
            externalTag: externalCategoryMap.externalTag,
            categoryId: externalCategoryMap.categoryId,
          })
          .from(externalCategoryMap)
          .where(eq(externalCategoryMap.source, "bgg")),
        database
          .select({
            externalTag: externalMechanicMap.externalTag,
            mechanicId: externalMechanicMap.mechanicId,
          })
          .from(externalMechanicMap)
          .where(eq(externalMechanicMap.source, "bgg")),
      ]);

    const categories = new Map<string, number>();
    for (const row of categoryRows) {
      categories.set(normalizeKey(row.name), row.id);
    }

    const mechanics = new Map<string, number>();
    for (const row of mechanicRows) {
      mechanics.set(normalizeKey(row.name), row.id);
    }

    const externalCategories = new Map<string, number>();
    for (const row of externalCategoryRows) {
      externalCategories.set(normalizeKey(row.externalTag), row.categoryId);
    }

    const externalMechanics = new Map<string, number>();
    for (const row of externalMechanicRows) {
      externalMechanics.set(normalizeKey(row.externalTag), row.mechanicId);
    }

    return { categories, mechanics, externalCategories, externalMechanics };
  }

  async function ensureCategory(
    database: Database,
    taxonomy: TaxonomyContext,
    rawName: string,
  ): Promise<number | null> {
    const normalized = normalizeName(rawName);
    if (!normalized) return null;
    const key = normalizeKey(normalized);
    const cached = taxonomy.categories.get(key);
    if (cached) return cached;

    await database
      .insert(gameSystemCategories)
      .values({ name: normalized })
      .onConflictDoNothing();

    const existing = await database.query.gameSystemCategories.findFirst({
      where: eq(gameSystemCategories.name, normalized),
    });

    const categoryId = existing?.id ?? null;

    if (!categoryId) return null;
    taxonomy.categories.set(key, categoryId);
    return categoryId;
  }

  async function ensureMechanic(
    database: Database,
    taxonomy: TaxonomyContext,
    rawName: string,
  ): Promise<number | null> {
    const normalized = normalizeName(rawName);
    if (!normalized) return null;
    const key = normalizeKey(normalized);
    const cached = taxonomy.mechanics.get(key);
    if (cached) return cached;

    await database
      .insert(gameSystemMechanics)
      .values({ name: normalized })
      .onConflictDoNothing();

    const existing = await database.query.gameSystemMechanics.findFirst({
      where: eq(gameSystemMechanics.name, normalized),
    });

    const mechanicId = existing?.id ?? null;

    if (!mechanicId) return null;
    taxonomy.mechanics.set(key, mechanicId);
    return mechanicId;
  }

  async function ensureExternalCategoryMapping(
    database: Database,
    taxonomy: TaxonomyContext,
    externalName: string,
    categoryId: number,
  ) {
    const key = normalizeKey(externalName);
    if (taxonomy.externalCategories.has(key)) return;
    await database
      .insert(externalCategoryMap)
      .values({
        source: "bgg",
        externalTag: externalName,
        categoryId,
      })
      .onConflictDoNothing();
    taxonomy.externalCategories.set(key, categoryId);
  }

  async function ensureExternalMechanicMapping(
    database: Database,
    taxonomy: TaxonomyContext,
    externalName: string,
    mechanicId: number,
  ) {
    const key = normalizeKey(externalName);
    if (taxonomy.externalMechanics.has(key)) return;
    await database
      .insert(externalMechanicMap)
      .values({
        source: "bgg",
        externalTag: externalName,
        mechanicId,
      })
      .onConflictDoNothing();
    taxonomy.externalMechanics.set(key, mechanicId);
  }

  async function linkTaxonomy(
    database: Database,
    taxonomy: TaxonomyContext,
    systemId: number,
    categories: string[],
    mechanics: string[],
  ) {
    const uniqueCategories = Array.from(
      new Set(categories.map((category) => normalizeName(category)).filter(Boolean)),
    );
    for (const categoryName of uniqueCategories) {
      const categoryId = await ensureCategory(database, taxonomy, categoryName);
      if (!categoryId) continue;
      await ensureExternalCategoryMapping(database, taxonomy, categoryName, categoryId);
      await database
        .insert(gameSystemToCategory)
        .values({ gameSystemId: systemId, categoryId })
        .onConflictDoNothing();
    }

    const uniqueMechanics = Array.from(
      new Set(mechanics.map((mechanic) => normalizeName(mechanic)).filter(Boolean)),
    );
    for (const mechanicName of uniqueMechanics) {
      const mechanicId = await ensureMechanic(database, taxonomy, mechanicName);
      if (!mechanicId) continue;
      await ensureExternalMechanicMapping(database, taxonomy, mechanicName, mechanicId);
      await database
        .insert(gameSystemToMechanics)
        .values({ gameSystemId: systemId, mechanicsId: mechanicId })
        .onConflictDoNothing();
    }
  }

  async function ensureHeroImage(
    database: Database,
    systemId: number,
    heroUrl: string,
    currentHeroId: number | null,
    userAgent: string,
  ): Promise<number | null> {
    if (currentHeroId) {
      return currentHeroId;
    }

    // Get game system metadata for enhanced upload
    const gameSystem = await database.query.gameSystems.findFirst({
      where: eq(gameSystems.id, systemId),
      columns: { name: true, slug: true, sourceOfTruth: true },
    });

    if (!gameSystem) {
      console.warn(`Game system with ID ${systemId} not found for hero image upload`);
      return currentHeroId;
    }

    try {
      const response = await fetch(heroUrl, {
        headers: {
          "User-Agent": userAgent,
        },
      });
      if (!response.ok) {
        console.warn(
          `Failed to download hero image for system ${systemId}: ${response.status} ${response.statusText}`,
        );
        return currentHeroId;
      }
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const { computeChecksum } = await import("~/lib/storage/cloudinary");
      const checksum = computeChecksum(buffer);

      const existingAsset = await database.query.mediaAssets.findFirst({
        where: and(
          eq(mediaAssets.gameSystemId, systemId),
          eq(mediaAssets.checksum, checksum),
        ),
      });
      if (existingAsset) {
        if (!currentHeroId) {
          await database
            .update(gameSystems)
            .set({ heroImageId: existingAsset.id })
            .where(eq(gameSystems.id, systemId));
        }
        return existingAsset.id;
      }

      const { uploadGameSystemMediaFromUrl } = await import("~/lib/storage/media-assets");
      const uploaded = await uploadGameSystemMediaFromUrl(
        heroUrl,
        {
          type: "hero",
          gameSystemId: systemId,
          source: "bgg",
          moderated: false,
          license: "BGG Fair Use",
          licenseUrl: "https://boardgamegeek.com/wiki/page/Copyright",
          originalUrl: heroUrl,
        },
        database,
      );

      const inserted = (await database
        .insert(mediaAssets)
        .values({
          gameSystemId: systemId,
          publicId: uploaded.publicId,
          secureUrl: uploaded.secureUrl,
          width: uploaded.width,
          height: uploaded.height,
          format: uploaded.format,
          license: uploaded.license ?? null,
          licenseUrl: uploaded.licenseUrl ?? null,
          kind: uploaded.kind,
          orderIndex: 0,
          moderated: uploaded.moderated,
          checksum: uploaded.checksum,
        })
        .returning()) as (typeof mediaAssets.$inferSelect)[];

      const newHeroId = inserted[0]?.id ?? null;
      if (newHeroId) {
        await database
          .update(gameSystems)
          .set({ heroImageId: newHeroId })
          .where(eq(gameSystems.id, systemId));
      }
      return newHeroId;
    } catch (error) {
      console.warn(`Failed to process hero image for system ${systemId}`, error);
      return currentHeroId;
    }
  }

  async function recordCrawlEvent(
    database: Database,
    gameSystemId: number,
    params: {
      status: "success" | "partial" | "error";
      startedAt: Date;
      finishedAt: Date;
      severity: CrawlSeverityType;
      errorMessage?: string;
      details?: Record<string, unknown>;
    },
  ) {
    await database.insert(systemCrawlEvents).values({
      gameSystemId,
      source: "bgg",
      status: params.status,
      startedAt: params.startedAt,
      finishedAt: params.finishedAt,
      severity: params.severity,
      errorMessage: params.errorMessage,
      details: params.details ?? null,
    });
  }

  async function processCandidate(
    database: Database,
    candidate: CandidateDetail,
    taxonomy: TaxonomyContext,
    userAgent: string,
  ) {
    const startedAt = new Date();
    const preferredName = candidate.detail?.name?.trim() || candidate.name;
    const slug = slugify(preferredName);
    if (!slug) {
      console.warn(`Skipping ${preferredName} due to empty slug`);
      return { status: "skipped" as const };
    }

    const existing = await database
      .select({
        id: gameSystems.id,
        name: gameSystems.name,
        slug: gameSystems.slug,
        externalRefs: gameSystems.externalRefs,
        releaseDate: gameSystems.releaseDate,
        yearReleased: gameSystems.yearReleased,
        descriptionScraped: gameSystems.descriptionScraped,
        minPlayers: gameSystems.minPlayers,
        maxPlayers: gameSystems.maxPlayers,
        averagePlayTime: gameSystems.averagePlayTime,
        ageRating: gameSystems.ageRating,
        complexityRating: gameSystems.complexityRating,
        publisherId: gameSystems.publisherId,
        heroImageId: gameSystems.heroImageId,
        cmsApproved: gameSystems.cmsApproved,
      })
      .from(gameSystems)
      .where(eq(gameSystems.slug, slug))
      .limit(1);

    const detail = candidate.detail;
    let systemId: number;
    let externalRefs = detailsToExternalRefs(existing[0]?.externalRefs, candidate.id);
    let releaseDateIso = normalizeReleaseDate(existing[0]?.releaseDate);
    let releaseDateForEnrichment = releaseDateIso ? new Date(releaseDateIso) : null;
    let yearReleased = existing[0]?.yearReleased ?? null;
    let created = false;
    const currentHeroImageId = existing[0]?.heroImageId ?? null;

    const thingReleaseDate = releaseDateFromThing(candidate.thing);
    if (!yearReleased && candidate.thing.yearPublished) {
      yearReleased = candidate.thing.yearPublished;
    }
    if (!releaseDateIso && thingReleaseDate) {
      releaseDateIso = thingReleaseDate;
      releaseDateForEnrichment = new Date(thingReleaseDate);
    }

    if (existing.length === 0) {
      console.log(
        `No existing record for ${preferredName}; creating new system with slug ${slug}`,
      );
      const inserted = (await database
        .insert(gameSystems)
        .values({
          name: preferredName,
          slug,
          externalRefs,
          sourceOfTruth: "bgg",
          crawlStatus: "processing",
          lastCrawledAt: startedAt,
          releaseDate: releaseDateIso,
          yearReleased,
          descriptionScraped: detail?.description ?? null,
          minPlayers: detail?.minPlayers ?? null,
          maxPlayers: detail?.maxPlayers ?? null,
          averagePlayTime: detail?.averagePlayTime ?? null,
          ageRating: detail?.minAge ? `${detail.minAge}+` : null,
          complexityRating: detail?.averageWeight
            ? detail.averageWeight.toFixed(2)
            : null,
        })
        .returning()) as (typeof gameSystems.$inferSelect)[];
      systemId = inserted[0]!.id;
      externalRefs = (inserted[0]!.externalRefs as ExternalRefs | null | undefined)
        ? detailsToExternalRefs(inserted[0]!.externalRefs as ExternalRefs, candidate.id)
        : externalRefs;
      const insertedRelease = normalizeReleaseDate(inserted[0]!.releaseDate);
      if (insertedRelease) {
        releaseDateIso = insertedRelease;
        releaseDateForEnrichment = new Date(insertedRelease);
      }
      yearReleased = inserted[0]!.yearReleased ?? yearReleased;
      created = true;
    } else {
      systemId = existing[0]!.id;
      console.log(
        `Updating existing system ${preferredName} (id=${systemId}) voters:${
          candidate.thing.usersRated ?? 0
        } comments:${candidate.thing.numComments ?? 0}`,
      );
      const update: Record<string, unknown> = {
        externalRefs,
        crawlStatus: "processing",
        lastCrawledAt: startedAt,
      };
      if (!existing[0]!.releaseDate && releaseDateIso) {
        update["releaseDate"] = releaseDateIso;
      }
      if (!existing[0]!.yearReleased && yearReleased) {
        update["yearReleased"] = yearReleased;
      }

      if (detail) {
        if (detail.description && !existing[0]!.descriptionScraped) {
          update["descriptionScraped"] = detail.description;
        }
        if (detail.minPlayers && !existing[0]!.minPlayers) {
          update["minPlayers"] = detail.minPlayers;
        }
        if (detail.maxPlayers && !existing[0]!.maxPlayers) {
          update["maxPlayers"] = detail.maxPlayers;
        }
        if (detail.averagePlayTime && !existing[0]!.averagePlayTime) {
          update["averagePlayTime"] = detail.averagePlayTime;
        }
        if (detail.minAge && !existing[0]!.ageRating) {
          update["ageRating"] = `${detail.minAge}+`;
        }
        if (detail.averageWeight && !existing[0]!.complexityRating) {
          update["complexityRating"] = detail.averageWeight.toFixed(2);
        }
      }
      await database.update(gameSystems).set(update).where(eq(gameSystems.id, systemId));
    }

    if (detail?.heroImageUrl) {
      await ensureHeroImage(
        database,
        systemId,
        detail.heroImageUrl,
        currentHeroImageId,
        userAgent,
      );
    }

    if (detail) {
      await linkTaxonomy(
        database,
        taxonomy,
        systemId,
        detail.categories ?? [],
        detail.mechanics ?? [],
      );
    }

    let publisherRecord: typeof publishers.$inferSelect | null = null;
    const primaryPublisher = detail?.publishers?.[0]?.trim();
    if (primaryPublisher) {
      publisherRecord =
        (await database.query.publishers.findFirst({
          where: eq(publishers.name, primaryPublisher),
        })) ?? null;
      if (!publisherRecord) {
        const insertedPublisher = await database
          .insert(publishers)
          .values({ name: primaryPublisher })
          .onConflictDoNothing()
          .returning();
        if (insertedPublisher.length > 0) {
          publisherRecord = insertedPublisher[0];
        } else {
          publisherRecord =
            (await database.query.publishers.findFirst({
              where: eq(publishers.name, primaryPublisher),
            })) ?? null;
        }
      }
    }

    if (!existing[0]?.publisherId && publisherRecord) {
      await database
        .update(gameSystems)
        .set({ publisherId: publisherRecord.id })
        .where(eq(gameSystems.id, systemId));
    }

    const finishedAt = new Date();
    try {
      const enrichment = await enrichFromBgg(
        database,
        {
          id: systemId,
          name: preferredName,
          externalRefs,
          releaseDate: releaseDateForEnrichment,
          cmsApproved: existing[0]?.cmsApproved ?? false,
        },
        candidate.thing,
      );

      await database
        .update(gameSystems)
        .set({
          externalRefs,
          crawlStatus: enrichment ? "success" : "partial",
          lastCrawledAt: finishedAt,
          lastSuccessAt: finishedAt,
          errorMessage: null,
        })
        .where(eq(gameSystems.id, systemId));

      await recordCrawlEvent(database, systemId, {
        status: enrichment ? "success" : "partial",
        startedAt,
        finishedAt,
        severity: CrawlSeverity.INFO,
        details: {
          bggId: candidate.id,
          name: candidate.name,
          numComments: candidate.thing.numComments ?? null,
          usersRated: candidate.thing.usersRated ?? null,
          rank: candidate.rank,
          created,
        },
      });

      return {
        status: enrichment ? "success" : "partial",
        created,
      } as const;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      await database
        .update(gameSystems)
        .set({
          crawlStatus: "error",
          lastCrawledAt: finishedAt,
          errorMessage: message,
        })
        .where(eq(gameSystems.id, systemId));

      await recordCrawlEvent(database, systemId, {
        status: "error",
        startedAt,
        finishedAt,
        severity: CrawlSeverity.ERROR,
        errorMessage: message,
        details: {
          bggId: candidate.id,
          name: candidate.name,
          created,
        },
      });

      console.error(`Failed to process BGG system ${candidate.name}`, error);
      return { status: "error" as const, created };
    }
  }

  interface BatchResult {
    processed: number;
    success: number;
    partial: number;
    error: number;
    created: number;
  }

  async function runBatch(
    database: Database,
    userAgent: string,
    desired: number,
    label: string,
    startPage: number,
    taxonomy: TaxonomyContext,
  ): Promise<BatchResult> {
    console.log(`\n=== Starting BGG batch: ${label} (page ${startPage}) ===`);
    const candidates = await fetchBrowseCandidates(userAgent, desired + 50, startPage, 4);
    console.log(
      `Batch ${label} candidates fetched: ${candidates.length}. Sample: ${candidates
        .slice(0, 5)
        .map((c) => `${c.name}#${c.id}[rank:${c.rank}]`)
        .join(", ")}`,
    );
    if (candidates.length === 0) {
      console.warn(`Batch ${label} has no candidates; skipping.`);
      return { processed: 0, success: 0, partial: 0, error: 0, created: 0 };
    }

    const detailed = await fetchDetailedCandidates(candidates, userAgent);
    console.log(
      `Batch ${label} details resolved for ${detailed.length} systems. Sample: ${detailed
        .slice(0, 5)
        .map(
          (c) =>
            `${c.detail?.name ?? c.name} voters:${
              c.detail?.usersRated ?? c.thing.usersRated ?? 0
            } comments:${c.detail?.numComments ?? c.thing.numComments ?? 0}`,
        )
        .join(", ")}`,
    );
    if (detailed.length === 0) {
      console.warn(`Batch ${label} missing detail data; skipping.`);
      return { processed: 0, success: 0, partial: 0, error: 0, created: 0 };
    }

    detailed.sort((a, b) => {
      const aVoters = a.thing.usersRated ?? 0;
      const bVoters = b.thing.usersRated ?? 0;
      if (bVoters !== aVoters) {
        return bVoters - aVoters;
      }
      const aComments = a.thing.numComments ?? 0;
      const bComments = b.thing.numComments ?? 0;
      if (bComments !== aComments) {
        return bComments - aComments;
      }
      return a.rank - b.rank;
    });

    const selected = detailed.slice(0, desired);
    console.log(
      `Batch ${label} processing ${selected.length} systems. Top candidate: ${
        selected[0]
          ? `${selected[0].detail?.name ?? selected[0].name} (${selected[0].thing.usersRated ?? 0} voters, ${selected[0].thing.numComments ?? 0} comments)`
          : "none"
      }`,
    );

    let createdCount = 0;
    let successCount = 0;
    let partialCount = 0;
    let errorCount = 0;
    let processedCount = 0;
    for (const candidate of selected) {
      const result = await processCandidate(database, candidate, taxonomy, userAgent);
      if (result.status === "skipped") {
        console.log(`Batch ${label}: skipped ${candidate.name} after slug check`);
        continue;
      }
      processedCount += 1;
      if (result.created) {
        createdCount += 1;
        console.log(
          `Batch ${label}: created ${candidate.detail?.name ?? candidate.name} (BGG ${candidate.id}) voters:${
            candidate.thing.usersRated ?? 0
          } comments:${candidate.thing.numComments ?? 0}`,
        );
      }
      if (result.status === "success") {
        successCount += 1;
      } else if (result.status === "partial") {
        partialCount += 1;
        console.log(
          `Batch ${label}: partial enrichment for ${candidate.detail?.name ?? candidate.name}; check taxonomy mappings or release date coverage`,
        );
      } else if (result.status === "error") {
        errorCount += 1;
        console.error(
          `Batch ${label}: error state for ${candidate.detail?.name ?? candidate.name}; see above logs`,
        );
      }
    }

    console.log(
      `Batch ${label} complete: ${successCount} success, ${partialCount} partial, ${errorCount} errors, ${createdCount} created (processed ${processedCount})`,
    );

    return {
      processed: processedCount,
      success: successCount,
      partial: partialCount,
      error: errorCount,
      created: createdCount,
    };
  }

  async function main() {
    const limit = Number(process.env["BGG_LIMIT"] ?? "100");
    const desired = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 200) : 100;
    const userAgent = process.env["CRAWLER_USER_AGENT"] ?? CRAWLER_USER_AGENT;
    console.log(`Fetching BGG browse data batches with desired size ${desired}`);

    const database = await db();
    const taxonomy = await buildTaxonomyContext(database);

    const batches = [
      { label: "Top 1-100", startPage: 1 },
      { label: "Top 101-200", startPage: 2 },
    ];

    let totalProcessed = 0;
    let totalSuccess = 0;
    let totalPartial = 0;
    let totalError = 0;
    let totalCreated = 0;

    for (const batch of batches) {
      const result = await runBatch(
        database,
        userAgent,
        desired,
        batch.label,
        batch.startPage,
        taxonomy,
      );
      totalProcessed += result.processed;
      totalSuccess += result.success;
      totalPartial += result.partial;
      totalError += result.error;
      totalCreated += result.created;
    }

    console.log(
      `\nBGG crawl summary: ${totalSuccess} success, ${totalPartial} partial, ${totalError} errors, ${totalCreated} created across ${totalProcessed} processed systems`,
    );
  }

  try {
    await main();
  } catch (error) {
    console.error("BGG crawler run failed", error);
    process.exitCode = 1;
  } finally {
    await closeConnections();
  }
}
