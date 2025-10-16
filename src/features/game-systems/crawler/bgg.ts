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
  type ExternalRefs,
} from "~/db/schema";

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
        `Failed to upload BGG thumbnail to Cloudinary, falling back to URL:`,
        error,
      );
      // Fallback to storing URL only if upload fails
      await database
        .insert(mediaAssets)
        .values({
          gameSystemId,
          publicId: `bgg-thumb-${gameSystemId}`,
          secureUrl: thing.thumbnail,
          kind: "thumbnail",
          orderIndex: 0,
          moderated: false, // BGG assets start as non-moderated
          license: "BGG Fair Use",
          licenseUrl: "https://boardgamegeek.com/wiki/page/Copyright",
        })
        .onConflictDoNothing();
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
        `Failed to upload BGG hero image to Cloudinary, falling back to URL:`,
        error,
      );
      // Fallback to storing URL only if upload fails
      await database
        .insert(mediaAssets)
        .values({
          gameSystemId,
          publicId: `bgg-image-${gameSystemId}`,
          secureUrl: thing.image,
          kind: "hero",
          orderIndex: 1,
          moderated: false, // BGG assets start as non-moderated
          license: "BGG Fair Use",
          licenseUrl: "https://boardgamegeek.com/wiki/page/Copyright",
        })
        .onConflictDoNothing();
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
