import { createServerFn } from "@tanstack/react-start";
import type { SQL } from "drizzle-orm";
import { z } from "zod";
import { getSystemBySlugSchema, listSystemsSchema } from "./game-systems.schemas";
import type {
  AvailableGameSystemFilters,
  GameSystemCategoryTag,
  GameSystemDetail,
  GameSystemListResult,
  GameSystemMediaAsset,
  GameSystemPublisherInfo,
  GameSystemTag,
  PopularGameSystem,
} from "./game-systems.types";

const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 20;

const searchCategoriesSchema = z.object({
  q: z.string().optional(),
  limit: z.number().int().min(1).max(100).optional().default(20),
});

export const searchCategoriesHandler = async ({
  data,
}: {
  data: z.infer<typeof searchCategoriesSchema>;
}): Promise<GameSystemCategoryTag[]> => {
  const [{ getDb }, { gameSystemCategories }] = await Promise.all([
    import("~/db/server-helpers"),
    import("~/db/schema"),
  ]);
  const { asc, ilike } = await import("drizzle-orm");

  const db = await getDb();
  const limit = data.limit ?? 20;
  const searchTerm = data.q?.trim();

  const baseQuery = db
    .select({
      id: gameSystemCategories.id,
      name: gameSystemCategories.name,
      description: gameSystemCategories.description,
    })
    .from(gameSystemCategories)
    .orderBy(asc(gameSystemCategories.name));

  const filteredQuery = searchTerm
    ? baseQuery.where(ilike(gameSystemCategories.name, `%${searchTerm}%`))
    : baseQuery;

  const rows = await filteredQuery.limit(limit);

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
  }));
};

export const searchCategories = createServerFn({ method: "POST" })
  .validator(searchCategoriesSchema.parse)
  .handler(searchCategoriesHandler);

const POPULAR_SYSTEM_LIMIT = 10;

export const listPopularSystemsHandler = async (): Promise<PopularGameSystem[]> => {
  const [{ getDb }, { gameSystems, mediaAssets, publishers, games }] = await Promise.all([
    import("~/db/server-helpers"),
    import("~/db/schema"),
  ]);
  const { alias } = await import("drizzle-orm/pg-core");
  const { asc, desc, eq, sql } = await import("drizzle-orm");

  const db = await getDb();
  const heroImage = alias(mediaAssets, "heroImage");

  const counts = db
    .select({
      gameSystemId: games.gameSystemId,
      sessionCount: sql<number>`count(${games.id})::int`.as("sessionCount"),
    })
    .from(games)
    .groupBy(games.gameSystemId)
    .as("system_session_counts");

  const rows = await db
    .select({
      system: gameSystems,
      hero: heroImage,
      publisher: {
        id: publishers.id,
        name: publishers.name,
        websiteUrl: publishers.websiteUrl,
        verified: publishers.verified,
      },
      gameCount: sql<number>`coalesce(${counts.sessionCount}, 0)`.as("game_count"),
    })
    .from(gameSystems)
    .leftJoin(counts, eq(counts.gameSystemId, gameSystems.id))
    .leftJoin(heroImage, eq(heroImage.id, gameSystems.heroImageId))
    .leftJoin(publishers, eq(gameSystems.publisherId, publishers.id))
    .orderBy(desc(sql`coalesce(${counts.sessionCount}, 0)`), asc(gameSystems.name))
    .limit(POPULAR_SYSTEM_LIMIT);

  return rows.map(({ system, hero, gameCount }) => {
    const heroAsset = mapMediaAsset(hero as MediaAssetRow | null);
    return {
      id: system.id,
      name: system.name,
      slug: sanitizeSlug(system.slug, system.id),
      summary: system.descriptionCms ?? system.descriptionScraped ?? null,
      heroUrl: heroAsset?.secureUrl ?? null,
      gameCount: gameCount ?? 0,
    };
  });
};

export const listPopularSystems = createServerFn({ method: "GET" }).handler(
  listPopularSystemsHandler,
);

interface MediaAssetRow {
  id: number;
  secureUrl: string;
  kind: string | null;
  orderIndex: number | null;
  license: string | null;
  licenseUrl: string | null;
  width: number | null;
  height: number | null;
  moderated: boolean;
}

interface PublisherRow {
  id: number | null;
  name: string | null;
  websiteUrl: string | null;
  verified: boolean | null;
}

const sanitizeSlug = (slug: string | null, fallbackId: number) =>
  slug && slug.length > 0 ? slug : String(fallbackId);

const toDateString = (value: Date | string | null | undefined) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().split("T")[0] ?? null;
};

const mapMediaAsset = (asset: MediaAssetRow | null): GameSystemMediaAsset | null => {
  if (!asset) return null;
  return {
    id: asset.id,
    secureUrl: asset.secureUrl,
    kind: asset.kind,
    orderIndex: asset.orderIndex,
    license: asset.license,
    licenseUrl: asset.licenseUrl,
    width: asset.width,
    height: asset.height,
    moderated: asset.moderated,
  };
};

const mapPublisher = (publisher: PublisherRow | null): GameSystemPublisherInfo | null => {
  if (!publisher || !publisher.id || !publisher.name) return null;
  return {
    id: publisher.id,
    name: publisher.name,
    websiteUrl: publisher.websiteUrl ?? null,
    verified: Boolean(publisher.verified),
  };
};

const dedupe = (values: number[]) => Array.from(new Set(values));

const intersectIds = (current: number[] | null, next: number[]) => {
  if (current === null) return next;
  const nextSet = new Set(next);
  return current.filter((value) => nextSet.has(value));
};

export const listSystemsHandler = async ({
  data,
}: {
  data: z.infer<typeof listSystemsSchema>;
}): Promise<GameSystemListResult> => {
  const [
    { getDb },
    { gameSystems, mediaAssets, publishers, gameSystemCategories, gameSystemToCategory },
  ] = await Promise.all([import("~/db/server-helpers"), import("~/db/schema")]);
  const { and, asc, eq, ilike, inArray, sql } = await import("drizzle-orm");
  const { alias } = await import("drizzle-orm/pg-core");

  const db = await getDb();

  const fetchAvailableFilters = async (): Promise<AvailableGameSystemFilters> => {
    const categoryRows = await db
      .select({
        id: gameSystemCategories.id,
        name: gameSystemCategories.name,
        description: gameSystemCategories.description,
      })
      .from(gameSystemCategories)
      .orderBy(asc(gameSystemCategories.name));

    return {
      categories: categoryRows
        .filter((row) => row.id != null && row.name)
        .map((row) => ({
          id: row.id,
          name: row.name,
          description: row.description ?? null,
        })),
    };
  };

  const filtersPromise = fetchAvailableFilters();

  const page = Math.max(1, data.page ?? DEFAULT_PAGE);
  const perPage = Math.min(Math.max(data.perPage ?? DEFAULT_PER_PAGE, 1), 50);
  const offset = (page - 1) * perPage;

  let filteredIds: number[] | undefined;
  const applyIntersection = (ids: number[]) => {
    const nextIds = dedupe(ids);
    filteredIds = filteredIds ? intersectIds(filteredIds, nextIds) : nextIds;
  };

  if (data.genreIds?.length) {
    const matches = await db
      .select({ systemId: gameSystemToCategory.gameSystemId })
      .from(gameSystemToCategory)
      .where(inArray(gameSystemToCategory.categoryId, data.genreIds));
    applyIntersection(matches.map((row) => row.systemId));
  }

  if (filteredIds && filteredIds.length === 0) {
    return {
      items: [],
      page,
      perPage,
      total: 0,
      availableFilters: await filtersPromise,
    };
  }

  const conditions: SQL[] = [];

  if (filteredIds && filteredIds.length > 0) {
    conditions.push(inArray(gameSystems.id, filteredIds));
  }

  if (data.q?.trim()) {
    conditions.push(ilike(gameSystems.name, `%${data.q.trim()}%`));
  }

  const whereClause =
    conditions.length === 0
      ? sql`true`
      : conditions.length === 1
        ? conditions[0]
        : and(...conditions);

  const heroImage = alias(mediaAssets, "heroImage");

  const baseSystemsQuery = db
    .select({
      system: gameSystems,
      hero: heroImage,
      publisher: {
        id: publishers.id,
        name: publishers.name,
        websiteUrl: publishers.websiteUrl,
        verified: publishers.verified,
      },
    })
    .from(gameSystems)
    .leftJoin(heroImage, eq(heroImage.id, gameSystems.heroImageId))
    .leftJoin(publishers, eq(gameSystems.publisherId, publishers.id));

  const baseTotalQuery = db
    .select({ count: sql<number>`count(*)::int` })
    .from(gameSystems);

  const systemsQueryWithFilters = baseSystemsQuery.where(whereClause);

  const totalQueryWithFilters = baseTotalQuery.where(whereClause);

  const [systemsRows, totalRows] = await Promise.all([
    systemsQueryWithFilters.orderBy(asc(gameSystems.name)).limit(perPage).offset(offset),
    totalQueryWithFilters,
  ]);

  const systemIds = systemsRows.map((row) => row.system.id);

  const categoryMap = new Map<number, GameSystemTag[]>();
  const galleryMap = new Map<number, GameSystemMediaAsset[]>();

  if (systemIds.length > 0) {
    const [categoryRowsForSystems, galleryRows] = await Promise.all([
      db
        .select({
          systemId: gameSystemToCategory.gameSystemId,
          id: gameSystemCategories.id,
          name: gameSystemCategories.name,
          description: gameSystemCategories.description,
        })
        .from(gameSystemToCategory)
        .innerJoin(
          gameSystemCategories,
          eq(gameSystemToCategory.categoryId, gameSystemCategories.id),
        )
        .where(inArray(gameSystemToCategory.gameSystemId, systemIds))
        .orderBy(asc(gameSystemCategories.name))
        .execute(),
      db
        .select({
          systemId: mediaAssets.gameSystemId,
          asset: mediaAssets,
        })
        .from(mediaAssets)
        .where(
          and(
            inArray(mediaAssets.gameSystemId, systemIds),
            eq(mediaAssets.moderated, false),
          ),
        )
        .orderBy(asc(mediaAssets.orderIndex))
        .execute(),
    ]);

    for (const row of categoryRowsForSystems) {
      if (!row.id || !row.name) continue;
      const group = categoryMap.get(row.systemId) ?? [];
      group.push({
        id: row.id,
        name: row.name,
        description: row.description ?? null,
      });
      categoryMap.set(row.systemId, group);
    }

    for (const row of galleryRows) {
      const asset = mapMediaAsset(row.asset as MediaAssetRow);
      if (!asset) continue;
      const group = galleryMap.get(row.systemId) ?? [];
      group.push(asset);
      galleryMap.set(row.systemId, group);
    }
  }

  const availableFilters = await filtersPromise;
  const total = Number(totalRows?.[0]?.count ?? 0);

  const items = systemsRows.map(({ system, hero, publisher }) => {
    const systemId = system.id;
    const categories = categoryMap.get(systemId) ?? [];
    const galleryAssets = galleryMap.get(systemId) ?? [];
    const heroAsset =
      mapMediaAsset(hero as MediaAssetRow | null) ?? galleryAssets[0] ?? null;

    return {
      id: system.id,
      name: system.name,
      slug: sanitizeSlug(system.slug, system.id),
      summary: system.descriptionCms ?? system.descriptionScraped ?? null,
      heroUrl: heroAsset?.secureUrl ?? null,
      heroImage: heroAsset,
      categories,
      mechanics: [],
      minPlayers: system.minPlayers,
      maxPlayers: system.maxPlayers,
      optimalPlayers: system.optimalPlayers,
      averagePlayTime: system.averagePlayTime,
      publisher: mapPublisher(publisher as PublisherRow | null),
      yearReleased: system.yearReleased,
      releaseDate: toDateString(system.releaseDate),
    };
  });

  return {
    items,
    page,
    perPage,
    total,
    availableFilters,
  };
};

export const listSystems = createServerFn({ method: "POST" })
  .validator(listSystemsSchema.parse)
  .handler(listSystemsHandler);

export const getSystemBySlugHandler = async ({
  data,
}: {
  data: z.infer<typeof getSystemBySlugSchema>;
}): Promise<GameSystemDetail | null> => {
  const [
    { getDb },
    {
      gameSystems,
      mediaAssets,
      faqs,
      publishers,
      gameSystemCategories,
      gameSystemMechanics,
      gameSystemToCategory,
      gameSystemToMechanics,
    },
  ] = await Promise.all([import("~/db/server-helpers"), import("~/db/schema")]);
  const { and, asc, eq } = await import("drizzle-orm");
  const { alias } = await import("drizzle-orm/pg-core");

  const db = await getDb();
  const heroImage = alias(mediaAssets, "heroImage");

  const [row] = await db
    .select({
      system: gameSystems,
      hero: heroImage,
      publisher: {
        id: publishers.id,
        name: publishers.name,
        websiteUrl: publishers.websiteUrl,
        verified: publishers.verified,
      },
    })
    .from(gameSystems)
    .leftJoin(heroImage, eq(heroImage.id, gameSystems.heroImageId))
    .leftJoin(publishers, eq(gameSystems.publisherId, publishers.id))
    .where(eq(gameSystems.slug, data.slug))
    .limit(1)
    .execute();

  if (!row) return null;

  const systemId = row.system.id;

  const [categoryRows, mechanicRows, galleryRows, faqRows] = await Promise.all([
    db
      .select({
        id: gameSystemCategories.id,
        name: gameSystemCategories.name,
        description: gameSystemCategories.description,
      })
      .from(gameSystemToCategory)
      .innerJoin(
        gameSystemCategories,
        eq(gameSystemToCategory.categoryId, gameSystemCategories.id),
      )
      .where(eq(gameSystemToCategory.gameSystemId, systemId))
      .orderBy(asc(gameSystemCategories.name)),
    db
      .select({
        id: gameSystemMechanics.id,
        name: gameSystemMechanics.name,
        description: gameSystemMechanics.description,
      })
      .from(gameSystemToMechanics)
      .innerJoin(
        gameSystemMechanics,
        eq(gameSystemToMechanics.mechanicsId, gameSystemMechanics.id),
      )
      .where(eq(gameSystemToMechanics.gameSystemId, systemId))
      .orderBy(asc(gameSystemMechanics.name)),
    db
      .select({ asset: mediaAssets })
      .from(mediaAssets)
      .where(
        and(eq(mediaAssets.gameSystemId, systemId), eq(mediaAssets.moderated, false)),
      )
      .orderBy(asc(mediaAssets.orderIndex)),
    db
      .select({ faq: faqs })
      .from(faqs)
      .where(eq(faqs.gameSystemId, systemId))
      .orderBy(asc(faqs.id)),
  ]);

  const categories: GameSystemTag[] = categoryRows
    .filter((row) => row.id != null && row.name)
    .map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description ?? null,
    }));

  const mechanics: GameSystemTag[] = mechanicRows
    .filter((row) => row.id != null && row.name)
    .map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description ?? null,
    }));

  const galleryAssets = galleryRows
    .map(({ asset }) => mapMediaAsset(asset as MediaAssetRow))
    .filter((asset): asset is GameSystemMediaAsset => Boolean(asset));

  const heroImageAsset =
    mapMediaAsset(row.hero as MediaAssetRow | null) ?? galleryAssets[0] ?? null;
  const gallery = heroImageAsset
    ? galleryAssets.filter((asset) => asset.id !== heroImageAsset.id)
    : galleryAssets;

  return {
    id: row.system.id,
    name: row.system.name,
    slug: sanitizeSlug(row.system.slug, row.system.id),
    summary: row.system.descriptionCms ?? row.system.descriptionScraped ?? null,
    heroUrl: heroImageAsset?.secureUrl ?? null,
    heroImage: heroImageAsset,
    categories,
    mechanics,
    minPlayers: row.system.minPlayers,
    maxPlayers: row.system.maxPlayers,
    optimalPlayers: row.system.optimalPlayers,
    averagePlayTime: row.system.averagePlayTime,
    publisher: mapPublisher(row.publisher as PublisherRow | null),
    yearReleased: row.system.yearReleased,
    releaseDate: toDateString(row.system.releaseDate),
    description: row.system.descriptionCms ?? row.system.descriptionScraped ?? null,
    descriptionCms: row.system.descriptionCms ?? null,
    descriptionScraped: row.system.descriptionScraped ?? null,
    externalRefs: row.system.externalRefs ?? null,
    gallery,
    faqs: faqRows.map((entry) => entry.faq),
  };
};

export const getSystemBySlug = createServerFn({ method: "POST" })
  .validator(getSystemBySlugSchema.parse)
  .handler(getSystemBySlugHandler);

export type ListSystemsResult = Awaited<ReturnType<typeof listSystems>>;
export type GetSystemBySlugResult = Awaited<ReturnType<typeof getSystemBySlug>>;
