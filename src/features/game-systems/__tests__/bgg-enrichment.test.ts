import { describe, expect, it, vi } from "vitest";
import * as bgg from "../crawler/bgg";

const updateCalls: unknown[] = [];
const insertCalls: { table: unknown; values: unknown }[] = [];

const categoryMapFind = vi.fn<(_?: unknown) => Promise<{ categoryId: number } | null>>();
const mechanicMapFind = vi.fn<(_?: unknown) => Promise<{ mechanicId: number } | null>>();

const fakeDb = {
  update: vi.fn(() => ({
    set: (vals: unknown) => {
      updateCalls.push(vals);
      return { where: vi.fn() };
    },
  })),
  insert: vi.fn((table: unknown) => ({
    values: (vals: unknown) => {
      insertCalls.push({ table, values: vals });
      return {};
    },
  })),
  query: {
    externalCategoryMap: { findFirst: categoryMapFind },
    externalMechanicMap: { findFirst: mechanicMapFind },
  },
} as const;

vi.stubGlobal(
  "fetch",
  vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("search")) {
      return new Response(
        '<items><item id="456"><name type="primary" value="Foo" /></item></items>',
      );
    }
    if (url.includes("thing")) {
      return new Response(
        '<items><item><yearpublished value="2004" /><link type="boardgamecategory" value="Fantasy" /><link type="boardgamemechanic" value="Dice" /></item></items>',
      );
    }
    return new Response("");
  }),
);

vi.mock("~/db/schema", () => ({
  gameSystems: { id: "id" },
  externalCategoryMap: {
    source: "source",
    externalTag: "external_tag",
    categoryId: "category_id",
  },
  externalMechanicMap: {
    source: "source",
    externalTag: "external_tag",
    mechanicId: "mechanic_id",
  },
  gameSystemToCategory: { gameSystemId: "game_system_id", categoryId: "category_id" },
  gameSystemToMechanics: { gameSystemId: "game_system_id", mechanicsId: "mechanic_id" },
}));

vi.mock("drizzle-orm", () => ({
  eq: (...args: unknown[]) => ({ eq: args }),
  and: (...args: unknown[]) => ({ and: args }),
}));

const { enrichFromBgg } = bgg;

describe("bgg enrichment", () => {
  it("updates external refs and maps taxonomy", async () => {
    categoryMapFind.mockResolvedValue({ categoryId: 1 });
    mechanicMapFind.mockResolvedValue({ mechanicId: 2 });

    await enrichFromBgg(fakeDb as unknown as Parameters<typeof enrichFromBgg>[0], {
      id: 1,
      name: "Foo",
    });

    expect(updateCalls[0]).toMatchObject({
      externalRefs: { bgg: "456" },
      releaseDate: new Date(2004, 0, 1),
    });
    expect(insertCalls).toContainEqual({
      table: expect.objectContaining({ gameSystemId: "game_system_id" }),
      values: { gameSystemId: 1, categoryId: 1 },
    });
    expect(insertCalls).toContainEqual({
      table: expect.objectContaining({ gameSystemId: "game_system_id" }),
      values: { gameSystemId: 1, mechanicsId: 2 },
    });
  });

  it("does not overwrite existing release date", async () => {
    updateCalls.length = 0;
    insertCalls.length = 0;
    categoryMapFind.mockResolvedValue(null);
    mechanicMapFind.mockResolvedValue(null);

    await enrichFromBgg(fakeDb as unknown as Parameters<typeof enrichFromBgg>[0], {
      id: 2,
      name: "Bar",
      releaseDate: new Date(1999, 0, 1),
    });

    expect(updateCalls[0]).toEqual({ externalRefs: { bgg: "456" } });
    expect(insertCalls).toHaveLength(0);
  });
});
