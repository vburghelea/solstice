import { and, eq } from "drizzle-orm";
import { XMLParser } from "fast-xml-parser";
import type { db } from "~/db";
import {
  externalCategoryMap,
  externalMechanicMap,
  gameSystemToCategory,
  gameSystemToMechanics,
  gameSystems,
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
  const ratings = item?.statistics?.ratings;
  const numCommentsRaw = ratings?.numcomments?.["@_value"];
  const usersRatedRaw = ratings?.usersrated?.["@_value"];
  return {
    ...(year ? { yearPublished: Number(year) } : {}),
    publishers: getValues("boardgamepublisher"),
    categories: getValues("boardgamecategory"),
    mechanics: getValues("boardgamemechanic"),
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
  if (!system.releaseDate && thing.yearPublished) {
    update["releaseDate"] = new Date(thing.yearPublished, 0, 1);
  }
  await database.update(gameSystems).set(update).where(eq(gameSystems.id, system.id));

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
