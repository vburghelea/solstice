import { describe, expect, it, vi } from "vitest";

import {
  getSystemBySlugHandler,
  listSystemsHandler,
} from "~/features/game-systems/game-systems.queries";

const systemsRows = [
  {
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
  },
];

const countRows = [{ count: systemsRows.length }];

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
  limit: (...args: unknown[]) => QueryBuilder<T>;
  offset: (...args: unknown[]) => QueryBuilder<T>;
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

const fakeDb = {
  select: vi.fn((selection: Record<string, unknown>) => ({
    from: (table: string) => {
      switch (table) {
        case "gameSystemCategories":
          return createBuilder(categoriesRows);
        case "gameSystemMechanics":
          return createBuilder(mechanicsRows);
        case "gameSystems":
          if ("system" in selection) {
            return createBuilder(systemsRows);
          }
          if ("count" in selection) {
            return createBuilder(countRows);
          }
          return createBuilder([]);
        case "gameSystemToCategory":
          return createBuilder(categoryMapRows);
        case "gameSystemToMechanics":
          return createBuilder(mechanicMapRows);
        case "mediaAssets":
          return createBuilder(galleryRows);
        case "faqs":
          return createBuilder(faqRows);
        default:
          return createBuilder([]);
      }
    },
  })),
};

vi.mock("~/db/server-helpers", () => ({
  getDb: vi.fn(async () => fakeDb),
}));

vi.mock("~/db/schema", () => ({
  gameSystems: "gameSystems",
  mediaAssets: "mediaAssets",
  publishers: "publishers",
  gameSystemCategories: "gameSystemCategories",
  gameSystemMechanics: "gameSystemMechanics",
  gameSystemToCategory: "gameSystemToCategory",
  gameSystemToMechanics: "gameSystemToMechanics",
  faqs: "faqs",
}));

vi.mock("drizzle-orm", () => ({
  and: (...args: unknown[]) => ({ and: args }),
  asc: (value: unknown) => ({ asc: value }),
  eq: (...args: unknown[]) => ({ eq: args }),
  gte: (...args: unknown[]) => ({ gte: args }),
  ilike: (...args: unknown[]) => ({ ilike: args }),
  inArray: (...args: unknown[]) => ({ inArray: args }),
  lte: (...args: unknown[]) => ({ lte: args }),
  sql: <T = unknown>() => ({}) as T,
}));

vi.mock("drizzle-orm/pg-core", () => ({ alias: (_table: string, name: string) => name }));

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
});
