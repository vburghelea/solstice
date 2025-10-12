import { createServerFn } from "@tanstack/react-start";
import type { SQL } from "drizzle-orm";
import { z } from "zod";
import type { GameSystemMediaAsset, GameSystemTag } from "../game-systems.types";
import { sanitizeSlug } from "../lib/sanitize-slug";
import {
  getAdminGameSystemSchema,
  listAdminGameSystemsSchema,
} from "./game-systems-admin.schemas";
import type {
  AdminExternalTagMapping,
  AdminGameSystemCrawlEvent,
  AdminGameSystemDetail,
  AdminGameSystemListItem,
  AdminGameSystemListResponse,
  AdminSystemSortOption,
  AdminSystemStatusFilter,
  AdminSystemStatusFlag,
} from "./game-systems-admin.types";

interface MediaAssetRow {
  id: number;
  moderated: boolean | null;
  secureUrl?: string | null;
  kind?: string | null;
  orderIndex?: number | null;
  license?: string | null;
  licenseUrl?: string | null;
  width?: number | null;
  height?: number | null;
}

interface DetailedMediaAssetRow extends MediaAssetRow {
  secureUrl: string | null;
}

interface ExternalMappingRow {
  id: number;
  source: string;
  externalTag: string;
  confidence: number | null;
  categoryId?: number;
  mechanicId?: number;
}

interface ListRow {
  system: {
    id: number;
    name: string;
    slug: string | null;
    descriptionCms: string | null;
    descriptionScraped: string | null;
    cmsApproved: boolean;
    isPublished: boolean;
    crawlStatus: string | null;
    lastCrawledAt: Date | string | null;
    lastSuccessAt: Date | string | null;
    errorMessage: string | null;
    heroImageId: number | null;
    updatedAt: Date | string;
    lastApprovedAt: Date | string | null;
    lastApprovedBy: string | null;
  };
  hero: MediaAssetRow | null;
  categoryCount: number | null;
  unmoderatedMediaCount: number | null;
}

const DEFAULT_SORT: AdminSystemSortOption = "updated-desc";
const DEFAULT_STATUS: AdminSystemStatusFilter = "all";
const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 20;

const toIsoString = (value: Date | string | null | undefined) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const applyStatusFilter = (
  items: AdminGameSystemListItem[],
  filter: AdminSystemStatusFilter,
) => {
  switch (filter) {
    case "needs_curation":
      return items.filter((item) => item.needsCuration);
    case "errors":
      return items.filter((item) => item.hasErrors);
    case "published":
      return items.filter((item) => item.isPublished);
    case "unpublished":
      return items.filter((item) => !item.isPublished);
    case "all":
    default:
      return items;
  }
};

const buildStatusFlags = (row: ListRow): AdminSystemStatusFlag[] => {
  const flags: AdminSystemStatusFlag[] = [];
  const cmsDescription = row.system.descriptionCms?.trim() || "";
  const scrapedDescription = row.system.descriptionScraped?.trim() || "";
  const hasSummary = cmsDescription.length > 0 || scrapedDescription.length > 0;
  const heroSelected = row.system.heroImageId != null;
  const heroModerated = heroSelected ? Boolean(row.hero?.moderated) : false;
  const categoryCount = Number(row.categoryCount ?? 0);
  const unmoderatedMediaCount = Number(row.unmoderatedMediaCount ?? 0);
  const crawlStatus = row.system.crawlStatus;

  if (!hasSummary) flags.push("missing-summary");
  if (!heroSelected) flags.push("missing-hero");
  else if (!heroModerated) flags.push("hero-unmoderated");
  if (categoryCount === 0) flags.push("taxonomy-empty");
  if (!row.system.cmsApproved) flags.push("cms-unapproved");
  if (!row.system.isPublished) flags.push("unpublished");
  if (unmoderatedMediaCount > 0) flags.push("unmoderated-media");
  if (crawlStatus === "partial") flags.push("crawl-partial");

  return flags;
};

const mapRowToItem = (row: ListRow): AdminGameSystemListItem => {
  const cmsDescription = row.system.descriptionCms?.trim() || "";
  const scrapedDescription = row.system.descriptionScraped?.trim() || "";
  const hasSummary = cmsDescription.length > 0 || scrapedDescription.length > 0;
  const summarySource =
    cmsDescription.length > 0 ? "cms" : scrapedDescription.length > 0 ? "scraped" : null;
  const heroSelected = row.system.heroImageId != null;
  const heroModerated = heroSelected ? Boolean(row.hero?.moderated) : false;
  const categoryCount = Number(row.categoryCount ?? 0);
  const unmoderatedMediaCount = Number(row.unmoderatedMediaCount ?? 0);
  const statusFlags = buildStatusFlags(row);
  const hasErrors =
    row.system.crawlStatus === "error" || Boolean(row.system.errorMessage?.trim());
  const needsCuration = statusFlags.length > 0 || hasErrors;

  return {
    id: row.system.id,
    name: row.system.name,
    slug: sanitizeSlug(row.system.slug, row.system.id),
    isPublished: row.system.isPublished,
    cmsApproved: row.system.cmsApproved,
    crawlStatus: row.system.crawlStatus,
    lastCrawledAt: toIsoString(row.system.lastCrawledAt),
    lastSuccessAt: toIsoString(row.system.lastSuccessAt),
    updatedAt: toIsoString(row.system.updatedAt) ?? new Date(0).toISOString(),
    heroSelected,
    heroModerated,
    hasSummary,
    summarySource,
    categoryCount,
    unmoderatedMediaCount,
    needsCuration,
    hasErrors,
    statusFlags,
    errorMessage: row.system.errorMessage,
  };
};

const mapDetailedMediaAsset = (
  asset: DetailedMediaAssetRow | null,
): GameSystemMediaAsset | null => {
  if (!asset || asset.id == null || !asset.secureUrl) {
    return null;
  }

  return {
    id: asset.id,
    secureUrl: asset.secureUrl,
    kind: asset.kind ?? null,
    orderIndex: asset.orderIndex ?? null,
    license: asset.license ?? null,
    licenseUrl: asset.licenseUrl ?? null,
    width: asset.width ?? null,
    height: asset.height ?? null,
    moderated: Boolean(asset.moderated),
  };
};

const mapTagRow = (row: {
  id: number | null;
  name: string | null;
  description: string | null;
}): GameSystemTag | null => {
  if (!row.id || !row.name) return null;
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? null,
  };
};

const mapCrawlEventRow = (row: {
  id: number;
  source: string;
  status: string;
  severity: string;
  startedAt: Date | string;
  finishedAt: Date | string;
  httpStatus: number | null;
  errorMessage: string | null;
  details: unknown | null;
}): AdminGameSystemCrawlEvent => {
  const startedAt = toIsoString(row.startedAt) ?? new Date(row.startedAt).toISOString();
  const finishedAt =
    toIsoString(row.finishedAt) ?? new Date(row.finishedAt).toISOString();

  const details =
    row.details && typeof row.details === "object"
      ? (row.details as Record<string, Record<string, never>>)
      : null;

  return {
    id: row.id,
    source: row.source,
    status: row.status,
    severity: row.severity,
    startedAt,
    finishedAt,
    httpStatus: row.httpStatus ?? null,
    errorMessage: row.errorMessage ?? null,
    details,
  };
};

const mapExternalMappingRow = (row: ExternalMappingRow): AdminExternalTagMapping => ({
  id: row.id,
  source: row.source,
  externalTag: row.externalTag,
  confidence: row.confidence ?? 0,
});

const listAdminGameSystemsHandler = async ({
  data,
}: {
  data: z.infer<typeof listAdminGameSystemsSchema>;
}): Promise<AdminGameSystemListResponse> => {
  const [{ getDb }, { gameSystems, mediaAssets, gameSystemToCategory }] =
    await Promise.all([import("~/db/server-helpers"), import("~/db/schema")]);
  const { and, asc, desc, eq, ilike, sql } = await import("drizzle-orm");
  const { alias } = await import("drizzle-orm/pg-core");

  const db = await getDb();
  const heroImage = alias(mediaAssets, "heroImage");

  const categoryCounts = db
    .select({
      systemId: gameSystemToCategory.gameSystemId,
      categoryCount: sql<number>`count(*)`.as("category_count"),
    })
    .from(gameSystemToCategory)
    .groupBy(gameSystemToCategory.gameSystemId)
    .as("categoryCounts");

  const galleryStats = db
    .select({
      systemId: mediaAssets.gameSystemId,
      unmoderatedMediaCount:
        sql<number>`sum(case when ${mediaAssets.moderated} = false then 1 else 0 end)`.as(
          "unmoderated_media_count",
        ),
    })
    .from(mediaAssets)
    .groupBy(mediaAssets.gameSystemId)
    .as("galleryStats");

  const trimmedQuery = data.q?.trim();
  const conditions: SQL[] = [];

  if (trimmedQuery && trimmedQuery.length > 0) {
    conditions.push(ilike(gameSystems.name, `%${trimmedQuery}%`));
  }

  const whereClause =
    conditions.length === 0
      ? null
      : conditions.length === 1
        ? conditions[0]
        : and(...conditions);

  const sort = (data.sort ?? DEFAULT_SORT) as AdminSystemSortOption;
  const orderByClauses = (() => {
    switch (sort) {
      case "name-asc":
        return [asc(gameSystems.name)];
      case "crawl-status":
        return [asc(gameSystems.crawlStatus), desc(gameSystems.updatedAt)];
      case "updated-desc":
      default:
        return [desc(gameSystems.updatedAt), asc(gameSystems.name)];
    }
  })();

  const baseQuery = db
    .select({
      system: {
        id: gameSystems.id,
        name: gameSystems.name,
        slug: gameSystems.slug,
        descriptionCms: gameSystems.descriptionCms,
        descriptionScraped: gameSystems.descriptionScraped,
        cmsApproved: gameSystems.cmsApproved,
        isPublished: gameSystems.isPublished,
        crawlStatus: gameSystems.crawlStatus,
        lastCrawledAt: gameSystems.lastCrawledAt,
        lastSuccessAt: gameSystems.lastSuccessAt,
        errorMessage: gameSystems.errorMessage,
        heroImageId: gameSystems.heroImageId,
        updatedAt: gameSystems.updatedAt,
        lastApprovedAt: gameSystems.lastApprovedAt,
        lastApprovedBy: gameSystems.lastApprovedBy,
      },
      hero: {
        id: heroImage.id,
        moderated: heroImage.moderated,
      },
      categoryCount: sql<number>`coalesce(${categoryCounts.categoryCount}, 0)`.as(
        "categoryCount",
      ),
      unmoderatedMediaCount:
        sql<number>`coalesce(${galleryStats.unmoderatedMediaCount}, 0)`.as(
          "unmoderatedMediaCount",
        ),
    })
    .from(gameSystems)
    .leftJoin(heroImage, eq(heroImage.id, gameSystems.heroImageId))
    .leftJoin(categoryCounts, eq(categoryCounts.systemId, gameSystems.id))
    .leftJoin(galleryStats, eq(galleryStats.systemId, gameSystems.id));

  const queryWithFilters = whereClause ? baseQuery.where(whereClause) : baseQuery;
  const rows = await queryWithFilters.orderBy(...orderByClauses);

  const mappedRows = rows.map((row) =>
    mapRowToItem({
      system: row.system,
      hero:
        row.hero && row.hero.id != null
          ? ({ id: row.hero.id, moderated: row.hero.moderated } as MediaAssetRow)
          : null,
      categoryCount: row.categoryCount,
      unmoderatedMediaCount: row.unmoderatedMediaCount,
    }),
  );

  const status = (data.status ?? DEFAULT_STATUS) as AdminSystemStatusFilter;
  const stats = {
    total: mappedRows.length,
    needsCuration: mappedRows.filter((item) => item.needsCuration).length,
    errors: mappedRows.filter((item) => item.hasErrors).length,
    published: mappedRows.filter((item) => item.isPublished).length,
  };

  const filteredItems = applyStatusFilter(mappedRows, status);

  const requestedPage = Number.isFinite(data.page) ? Number(data.page) : DEFAULT_PAGE;
  const requestedPerPage = Number.isFinite(data.perPage)
    ? Number(data.perPage)
    : DEFAULT_PER_PAGE;

  const perPage = Math.min(Math.max(requestedPerPage, 5), 100);
  const total = filteredItems.length;
  const pageCount = total === 0 ? 0 : Math.ceil(total / perPage);
  const safePage =
    total === 0
      ? DEFAULT_PAGE
      : Math.min(Math.max(requestedPage, DEFAULT_PAGE), pageCount);
  const startIndex = total === 0 ? 0 : (safePage - 1) * perPage;
  const endIndex = total === 0 ? 0 : startIndex + perPage;
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  return {
    items: paginatedItems,
    total,
    page: safePage,
    perPage,
    pageCount,
    stats,
  };
};

export const listAdminGameSystems = createServerFn({ method: "POST" })
  .validator(listAdminGameSystemsSchema.parse)
  .handler(listAdminGameSystemsHandler);

const CRAWL_EVENT_LIMIT = 10;

const getAdminGameSystemHandler = async ({
  data,
}: {
  data: z.infer<typeof getAdminGameSystemSchema>;
}): Promise<AdminGameSystemDetail | null> => {
  const [
    { getDb },
    {
      gameSystems,
      mediaAssets,
      gameSystemCategories,
      gameSystemToCategory,
      gameSystemMechanics,
      gameSystemToMechanics,
      systemCrawlEvents,
      externalCategoryMap,
      externalMechanicMap,
      faqs,
    },
  ] = await Promise.all([import("~/db/server-helpers"), import("~/db/schema")]);
  const { asc, desc, eq, inArray } = await import("drizzle-orm");
  const { alias } = await import("drizzle-orm/pg-core");

  const db = await getDb();
  const heroImage = alias(mediaAssets, "heroImage");

  const [systemRow] = await db
    .select({
      system: {
        id: gameSystems.id,
        name: gameSystems.name,
        slug: gameSystems.slug,
        descriptionCms: gameSystems.descriptionCms,
        descriptionScraped: gameSystems.descriptionScraped,
        cmsApproved: gameSystems.cmsApproved,
        isPublished: gameSystems.isPublished,
        crawlStatus: gameSystems.crawlStatus,
        lastCrawledAt: gameSystems.lastCrawledAt,
        lastSuccessAt: gameSystems.lastSuccessAt,
        errorMessage: gameSystems.errorMessage,
        heroImageId: gameSystems.heroImageId,
        updatedAt: gameSystems.updatedAt,
        externalRefs: gameSystems.externalRefs,
        sourceOfTruth: gameSystems.sourceOfTruth,
        lastApprovedAt: gameSystems.lastApprovedAt,
        lastApprovedBy: gameSystems.lastApprovedBy,
      },
      hero: {
        id: heroImage.id,
        secureUrl: heroImage.secureUrl,
        kind: heroImage.kind,
        orderIndex: heroImage.orderIndex,
        license: heroImage.license,
        licenseUrl: heroImage.licenseUrl,
        width: heroImage.width,
        height: heroImage.height,
        moderated: heroImage.moderated,
      },
    })
    .from(gameSystems)
    .leftJoin(heroImage, eq(heroImage.id, gameSystems.heroImageId))
    .where(eq(gameSystems.id, data.systemId))
    .limit(1);

  if (!systemRow) {
    return null;
  }

  const [categoryRows, mechanicRows, galleryRows, crawlEventRows, faqRows] =
    await Promise.all([
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
        .where(eq(gameSystemToCategory.gameSystemId, data.systemId))
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
        .where(eq(gameSystemToMechanics.gameSystemId, data.systemId))
        .orderBy(asc(gameSystemMechanics.name)),
      db
        .select({
          id: mediaAssets.id,
          secureUrl: mediaAssets.secureUrl,
          kind: mediaAssets.kind,
          orderIndex: mediaAssets.orderIndex,
          license: mediaAssets.license,
          licenseUrl: mediaAssets.licenseUrl,
          width: mediaAssets.width,
          height: mediaAssets.height,
          moderated: mediaAssets.moderated,
        })
        .from(mediaAssets)
        .where(eq(mediaAssets.gameSystemId, data.systemId))
        .orderBy(asc(mediaAssets.orderIndex), asc(mediaAssets.id)),
      db
        .select({
          id: systemCrawlEvents.id,
          source: systemCrawlEvents.source,
          status: systemCrawlEvents.status,
          severity: systemCrawlEvents.severity,
          startedAt: systemCrawlEvents.startedAt,
          finishedAt: systemCrawlEvents.finishedAt,
          httpStatus: systemCrawlEvents.httpStatus,
          errorMessage: systemCrawlEvents.errorMessage,
          details: systemCrawlEvents.details,
        })
        .from(systemCrawlEvents)
        .where(eq(systemCrawlEvents.gameSystemId, data.systemId))
        .orderBy(desc(systemCrawlEvents.startedAt))
        .limit(CRAWL_EVENT_LIMIT),
      db
        .select({ faq: faqs })
        .from(faqs)
        .where(eq(faqs.gameSystemId, data.systemId))
        .orderBy(asc(faqs.id)),
    ]);

  const categories = categoryRows
    .map(mapTagRow)
    .filter((tag): tag is GameSystemTag => Boolean(tag));

  const mechanics = mechanicRows
    .map(mapTagRow)
    .filter((tag): tag is GameSystemTag => Boolean(tag));

  const galleryAssets = galleryRows
    .map((asset) => mapDetailedMediaAsset(asset as DetailedMediaAssetRow))
    .filter((asset): asset is GameSystemMediaAsset => Boolean(asset));

  const categoryIds = categories.map((category) => category.id);
  const mechanicIds = mechanics.map((mechanic) => mechanic.id);

  const [categoryMappingRows, mechanicMappingRows] = await Promise.all([
    categoryIds.length
      ? db
          .select({
            id: externalCategoryMap.id,
            categoryId: externalCategoryMap.categoryId,
            source: externalCategoryMap.source,
            externalTag: externalCategoryMap.externalTag,
            confidence: externalCategoryMap.confidence,
          })
          .from(externalCategoryMap)
          .where(inArray(externalCategoryMap.categoryId, categoryIds))
          .orderBy(asc(externalCategoryMap.source), asc(externalCategoryMap.externalTag))
      : [],
    mechanicIds.length
      ? db
          .select({
            id: externalMechanicMap.id,
            mechanicId: externalMechanicMap.mechanicId,
            source: externalMechanicMap.source,
            externalTag: externalMechanicMap.externalTag,
            confidence: externalMechanicMap.confidence,
          })
          .from(externalMechanicMap)
          .where(inArray(externalMechanicMap.mechanicId, mechanicIds))
          .orderBy(asc(externalMechanicMap.source), asc(externalMechanicMap.externalTag))
      : [],
  ]);

  const categoryMappings = categoryMappingRows.reduce<
    Record<number, AdminExternalTagMapping[]>
  >((acc, row) => {
    const list = acc[row.categoryId] ?? [];
    list.push(mapExternalMappingRow(row));
    acc[row.categoryId] = list;
    return acc;
  }, {});

  const mechanicMappings = mechanicMappingRows.reduce<
    Record<number, AdminExternalTagMapping[]>
  >((acc, row) => {
    const list = acc[row.mechanicId] ?? [];
    list.push(mapExternalMappingRow(row));
    acc[row.mechanicId] = list;
    return acc;
  }, {});

  const unmoderatedMediaCount = galleryAssets.reduce(
    (count, asset) => (asset.moderated ? count : count + 1),
    0,
  );

  const statusRow: ListRow = {
    system: systemRow.system,
    hero:
      systemRow.hero && systemRow.hero.id != null
        ? ({
            id: systemRow.hero.id,
            moderated: systemRow.hero.moderated,
          } as MediaAssetRow)
        : null,
    categoryCount: categories.length,
    unmoderatedMediaCount,
  };

  const baseItem = mapRowToItem(statusRow);
  const heroAsset = mapDetailedMediaAsset(systemRow.hero as DetailedMediaAssetRow | null);

  const crawlEvents = crawlEventRows.map(mapCrawlEventRow);
  const cmsFaqs = faqRows.map((row) => row.faq).filter((faq) => faq.isCmsOverride);
  const scrapedFaqs = faqRows.map((row) => row.faq).filter((faq) => !faq.isCmsOverride);

  const detail: AdminGameSystemDetail = {
    ...baseItem,
    descriptionCms: systemRow.system.descriptionCms,
    descriptionScraped: systemRow.system.descriptionScraped,
    externalRefs:
      (systemRow.system.externalRefs as AdminGameSystemDetail["externalRefs"]) ?? null,
    sourceOfTruth: systemRow.system.sourceOfTruth ?? null,
    lastApprovedAt: toIsoString(systemRow.system.lastApprovedAt),
    lastApprovedBy: systemRow.system.lastApprovedBy ?? null,
    heroImage: heroAsset,
    gallery: galleryAssets,
    categories,
    mechanics,
    crawlEvents,
    categoryMappings,
    mechanicMappings,
    cmsFaqs,
    scrapedFaqs,
  };

  return detail;
};

export const getAdminGameSystem = createServerFn({ method: "POST" })
  .validator(getAdminGameSystemSchema.parse)
  .handler(getAdminGameSystemHandler);
