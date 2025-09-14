import { describe, expect, it, vi } from "vitest";
import { getSystemBySlugHandler, listSystemsHandler } from "../game-systems.queries";

const systemsData = [
  {
    system: { id: 1, slug: "dnd-5e" },
    hero: { id: 10, orderIndex: 0, moderated: false },
  },
  { system: { id: 2, slug: "pathfinder" }, hero: null },
];

const imagesData = [
  { image: { id: 10, gameSystemId: 1, orderIndex: 0, moderated: false } },
  { image: { id: 11, gameSystemId: 1, orderIndex: 1, moderated: false } },
  { image: { id: 12, gameSystemId: 1, orderIndex: 2, moderated: true } },
];

const fakeDb = {
  select: (selection: Record<string, unknown>) => ({
    from: (table: string) => {
      if (table === "gameSystems") {
        if (selection["count"] !== undefined) {
          return [{ count: systemsData.length }];
        }
        if (selection["hero"]) {
          return {
            leftJoin: () => ({
              limit: () => ({ offset: () => systemsData }),
            }),
          };
        }
        return {
          where: () => ({ limit: () => [systemsData[0]] }),
        };
      }
      if (table === "mediaAssets") {
        return {
          where: () => ({
            orderBy: () => imagesData.filter((i) => !i.image.moderated),
          }),
        };
      }
      if (table === "faqs") {
        return {
          where: () => [
            {
              faq: {
                id: 1,
                question: "What?",
                answer: "Yes",
                source: "sp",
                isCmsOverride: false,
              },
            },
          ],
        };
      }
      return {};
    },
  }),
};

vi.mock("~/db/server-helpers", () => ({ getDb: vi.fn(() => fakeDb) }));
vi.mock("~/db/schema", () => ({
  gameSystems: "gameSystems",
  mediaAssets: "mediaAssets",
  faqs: "faqs",
}));
vi.mock("drizzle-orm", () => ({
  and: (...args: unknown[]) => ({ and: args }),
  eq: (...args: unknown[]) => ({ eq: args }),
  sql: <T = unknown>() => ({}) as T,
  asc: (...args: unknown[]) => ({ asc: args }),
}));
vi.mock("drizzle-orm/pg-core", () => ({ alias: (t: string) => t }));

describe("game systems queries", () => {
  it("lists systems with hero images and total count", async () => {
    const result = await listSystemsHandler({ data: { page: 1, perPage: 20 } });
    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.items[0].hero).toEqual({ id: 10, orderIndex: 0, moderated: false });
  });

  it("returns detail with gallery filtered for moderation", async () => {
    const result = await getSystemBySlugHandler({ data: { slug: "dnd-5e" } });
    expect(result?.heroImage).toEqual({
      id: 10,
      gameSystemId: 1,
      orderIndex: 0,
      moderated: false,
    });
    expect(result?.gallery).toHaveLength(2);
    expect(result?.gallery.every((img) => img.moderated === false)).toBe(true);
    expect(result?.faqs).toHaveLength(1);
  });
});
