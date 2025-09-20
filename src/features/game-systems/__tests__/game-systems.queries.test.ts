import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getSystemBySlugHandler,
  listPopularSystemsHandler,
  listSystemsHandler,
} from "~/features/game-systems/game-systems.queries";

const publishedSystem = {
  system: {
    id: 1,
    name: "Blades in the Dark",
    slug: "blades-in-the-dark",
    descriptionCms: "Pull off daring scores in a haunted city.",
    descriptionScraped: "Scraped description",
    minPlayers: 3,
    maxPlayers: 6,
    optimalPlayers: 4,
    averagePlayTime: 180,
    yearReleased: 2017,
    releaseDate: new Date("2017-03-01"),
    publisherId: 5,
    heroImageId: 100,
    externalRefs: {
      startplaying: "https://startplaying.games/system/blades",
      bgg: "https://boardgamegeek.com/rpg/21837/blades-dark",
    },
    isPublished: true,
  },
  hero: {
    id: 100,
    secureUrl: "https://cdn.example/hero-blades.jpg",
    kind: "hero",
    orderIndex: 0,
    license: null,
    licenseUrl: null,
    width: 1200,
    height: 800,
    moderated: false,
  },
  publisher: {
    id: 5,
    name: "Magpie Games",
    websiteUrl: "https://magpiegames.com",
    verified: true,
  },
  gameCount: 12,
};

const draftSystem = {
  system: {
    id: 2,
    name: "Unpublished Blades Variant",
    slug: "unpublished-blades",
    descriptionCms: "Internal notes only.",
    descriptionScraped: null,
    minPlayers: 2,
    maxPlayers: 5,
    optimalPlayers: 3,
    averagePlayTime: 150,
    yearReleased: 2018,
    releaseDate: new Date("2018-01-01"),
    publisherId: 6,
    heroImageId: 101,
    externalRefs: null,
    isPublished: false,
  },
  hero: {
    id: 101,
    secureUrl: "https://cdn.example/hero-draft.jpg",
    kind: "hero",
    orderIndex: 1,
    license: null,
    licenseUrl: null,
    width: 1200,
    height: 800,
    moderated: false,
  },
  publisher: {
    id: 6,
    name: "Secret Games",
    websiteUrl: null,
    verified: false,
  },
  gameCount: 0,
};

const systemsRows = [publishedSystem, draftSystem];

const categoriesRows = [
  { id: 1, name: "Heist", description: null },
  { id: 2, name: "Dark Fantasy", description: null },
];

const mechanicsRows = [
  { id: 10, name: "Position and Effect", description: null },
  { id: 11, name: "Stress Economy", description: null },
];

const categoryMapRows = [
  { systemId: 1, id: 1, name: "Heist", description: null },
  { systemId: 1, id: 2, name: "Dark Fantasy", description: null },
];

const mechanicMapRows = [
  { systemId: 1, id: 10, name: "Position and Effect", description: null },
  { systemId: 1, id: 11, name: "Stress Economy", description: null },
];

const galleryRows = [
  {
    systemId: 1,
    asset: {
      id: 200,
      secureUrl: "https://cdn.example/gallery-blades.jpg",
      kind: "gallery",
      orderIndex: 1,
      license: "CC-BY",
      licenseUrl: "https://license.example",
      width: 1024,
      height: 768,
      moderated: false,
    },
  },
];

const faqRows = [
  {
    faq: {
      id: 1,
      question: "What dice do I need?",
      answer: "A handful of d6s is enough to run every score.",
      source: "cms",
      isCmsOverride: true,
    },
  },
];

interface QueryBuilder<T> extends PromiseLike<T> {
  leftJoin: (...args: unknown[]) => QueryBuilder<T>;
  innerJoin: (...args: unknown[]) => QueryBuilder<T>;
  where: (...args: unknown[]) => QueryBuilder<T>;
  orderBy: (...args: unknown[]) => QueryBuilder<T>;
  limit: (value: number) => QueryBuilder<T>;
  offset: (value: number) => QueryBuilder<T>;
  execute: () => Promise<T>;
}

const createBuilder = <T>(response: T): QueryBuilder<T> => {
  const builder: QueryBuilder<T> = {
    leftJoin: () => builder,
    innerJoin: () => builder,
    where: () => builder,
    orderBy: () => builder,
    limit: () => builder,
    offset: () => builder,
    execute: () => Promise.resolve(response),
    then: (onfulfilled, onrejected) =>
      Promise.resolve(response).then(onfulfilled, onrejected ?? undefined),
  };

  return builder;
};

const evaluateSystemClause = (
  row: (typeof systemsRows)[number],
  clause: unknown,
): boolean => {
  if (!clause || typeof clause !== "object") return true;
  if ("and" in (clause as Record<string, unknown>)) {
    return (clause as { and: unknown[] }).and.every((part) =>
      evaluateSystemClause(row, part),
    );
  }
  if ("eq" in (clause as Record<string, unknown>)) {
    const [column, value] = (clause as { eq: [string, unknown] }).eq;
    if (column === mockSchema.gameSystems.isPublished) {
      return row.system.isPublished === value;
    }
  }
  return true;
};

const createSystemsBuilder = (): QueryBuilder<typeof systemsRows> => {
  let currentRows = systemsRows;
  let currentLimit: number | undefined;
  let currentOffset: number | undefined;

  const builder: QueryBuilder<typeof systemsRows> = {
    leftJoin: () => builder,
    innerJoin: () => builder,
    where: (clause: unknown) => {
      currentRows = systemsRows.filter((row) => evaluateSystemClause(row, clause));
      return builder;
    },
    orderBy: () => builder,
    limit: (value: number) => {
      currentLimit = value;
      return builder;
    },
    offset: (value: number) => {
      currentOffset = value;
      return builder;
    },
    execute: () => {
      let rows = currentRows;
      if (typeof currentOffset === "number") {
        rows = rows.slice(currentOffset);
      }
      if (typeof currentLimit === "number") {
        rows = rows.slice(0, currentLimit);
      }
      return Promise.resolve(rows);
    },
    then: (onfulfilled, onrejected) =>
      builder.execute().then(onfulfilled, onrejected ?? undefined),
  };

  return builder;
};

const createCountBuilder = (): QueryBuilder<Array<{ count: number }>> => {
  let currentRows = systemsRows;

  const builder: QueryBuilder<Array<{ count: number }>> = {
    leftJoin: () => builder,
    innerJoin: () => builder,
    where: (clause: unknown) => {
      currentRows = systemsRows.filter((row) => evaluateSystemClause(row, clause));
      return builder;
    },
    orderBy: () => builder,
    limit: () => builder,
    offset: () => builder,
    execute: () => Promise.resolve([{ count: currentRows.length }]),
    then: (onfulfilled, onrejected) =>
      builder.execute().then(onfulfilled, onrejected ?? undefined),
  };

  return builder;
};

const mockSchema = {
  gameSystems: {
    table: "gameSystems",
    id: "gameSystems.id",
    name: "gameSystems.name",
    slug: "gameSystems.slug",
    descriptionCms: "gameSystems.descriptionCms",
    descriptionScraped: "gameSystems.descriptionScraped",
    minPlayers: "gameSystems.minPlayers",
    maxPlayers: "gameSystems.maxPlayers",
    optimalPlayers: "gameSystems.optimalPlayers",
    averagePlayTime: "gameSystems.averagePlayTime",
    yearReleased: "gameSystems.yearReleased",
    releaseDate: "gameSystems.releaseDate",
    publisherId: "gameSystems.publisherId",
    heroImageId: "gameSystems.heroImageId",
    externalRefs: "gameSystems.externalRefs",
    isPublished: "gameSystems.isPublished",
  },
  mediaAssets: { table: "mediaAssets", id: "mediaAssets.id" },
  publishers: {
    table: "publishers",
    id: "publishers.id",
    name: "publishers.name",
    websiteUrl: "publishers.websiteUrl",
    verified: "publishers.verified",
  },
  gameSystemCategories: {
    table: "gameSystemCategories",
    id: "gameSystemCategories.id",
    name: "gameSystemCategories.name",
    description: "gameSystemCategories.description",
  },
  gameSystemMechanics: {
    table: "gameSystemMechanics",
    id: "gameSystemMechanics.id",
    name: "gameSystemMechanics.name",
    description: "gameSystemMechanics.description",
  },
  gameSystemToCategory: {
    table: "gameSystemToCategory",
    gameSystemId: "gameSystemToCategory.gameSystemId",
    categoryId: "gameSystemToCategory.categoryId",
  },
  gameSystemToMechanics: {
    table: "gameSystemToMechanics",
    gameSystemId: "gameSystemToMechanics.gameSystemId",
    mechanicId: "gameSystemToMechanics.mechanicId",
  },
  faqs: { table: "faqs", id: "faqs.id" },
  games: { table: "games", gameSystemId: "games.gameSystemId", id: "games.id" },
} as const;

const fakeDb = {
  select: vi.fn((selection: Record<string, unknown>) => ({
    from: (table: unknown) => {
      switch (table) {
        case mockSchema.gameSystemCategories:
          return createBuilder(categoriesRows);
        case mockSchema.gameSystemMechanics:
          return createBuilder(mechanicsRows);
        case mockSchema.gameSystems:
          if ("system" in selection || "gameCount" in selection) {
            return createSystemsBuilder();
          }
          if ("count" in selection) {
            return createCountBuilder();
          }
          return createBuilder([]);
        case mockSchema.gameSystemToCategory:
          return createBuilder(categoryMapRows);
        case mockSchema.gameSystemToMechanics:
          return createBuilder(mechanicMapRows);
        case mockSchema.mediaAssets:
          return createBuilder(galleryRows);
        case mockSchema.faqs:
          return createBuilder(faqRows);
        case mockSchema.games:
          return {
            groupBy: () => ({
              as: () => ({
                gameSystemId: "counts.gameSystemId",
                sessionCount: "counts.sessionCount",
              }),
            }),
          };
        default:
          return createBuilder([]);
      }
    },
  })),
};

vi.mock("~/db/server-helpers", () => ({
  getDb: vi.fn(async () => fakeDb),
}));

vi.mock("~/db/schema", () => mockSchema);

const andMock = vi.fn((...args: unknown[]) => ({ and: args }));
const eqMock = vi.fn((...args: unknown[]) => ({ eq: args }));
const ilikeMock = vi.fn((...args: unknown[]) => ({ ilike: args }));

vi.mock("drizzle-orm", () => ({
  and: andMock,
  asc: (value: unknown) => ({ asc: value }),
  desc: (value: unknown) => ({ desc: value }),
  eq: eqMock,
  gte: (...args: unknown[]) => ({ gte: args }),
  ilike: ilikeMock,
  inArray: (...args: unknown[]) => ({ inArray: args }),
  lte: (...args: unknown[]) => ({ lte: args }),
  sql: <T = unknown>() =>
    ({
      as: () => ({}) as T,
    }) as T,
}));

vi.mock("drizzle-orm/pg-core", () => ({
  alias: (_table: unknown, name: string) => name,
}));

beforeEach(() => {
  eqMock.mockClear();
  andMock.mockClear();
  ilikeMock.mockClear();
});

describe("game systems queries", () => {
  it("lists systems with hero, taxonomy, and filter metadata", async () => {
    const result = await listSystemsHandler({ data: { page: 1, perPage: 12 } });

    expect(result.page).toBe(1);
    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);

    const [system] = result.items;
    expect(system.name).toBe("Blades in the Dark");
    expect(system.heroUrl).toBe("https://cdn.example/hero-blades.jpg");
    expect(system.categories.map((item) => item.name)).toEqual(["Heist", "Dark Fantasy"]);
    expect(system.mechanics).toEqual([]);
    expect(system.publisher?.name).toBe("Magpie Games");

    expect(result.availableFilters.categories).toHaveLength(2);
  });

  it("returns system detail with gallery, faq, and external links", async () => {
    const result = await getSystemBySlugHandler({ data: { slug: "blades-in-the-dark" } });

    expect(result).not.toBeNull();
    expect(result?.name).toBe("Blades in the Dark");
    expect(result?.heroUrl).toBe("https://cdn.example/hero-blades.jpg");
    expect(result?.gallery).toHaveLength(1);
    expect(result?.gallery[0]?.license).toBe("CC-BY");
    expect(result?.faqs).toHaveLength(1);
    expect(result?.externalRefs?.startplaying).toContain("startplaying");
  });

  it("excludes unpublished systems from list results", async () => {
    const result = await listSystemsHandler({ data: { page: 1, perPage: 20 } });

    expect(result.items.map((item) => item.slug)).toEqual(["blades-in-the-dark"]);
    expect(eqMock).toHaveBeenCalledWith(mockSchema.gameSystems.isPublished, true);
  });

  it("filters unpublished systems from the popular systems list", async () => {
    const result = await listPopularSystemsHandler();

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe(publishedSystem.system.id);
    expect(eqMock).toHaveBeenCalledWith(mockSchema.gameSystems.isPublished, true);
  });
});
