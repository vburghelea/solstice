import { describe, expect, it, vi } from "vitest";
import {
  mapExternalTagHandler,
  reorderImagesHandler,
  triggerRecrawlHandler,
  upsertCmsContentHandler,
} from "../game-systems.mutations";

const updateCalls: unknown[] = [];
const deleteCalls: unknown[] = [];
type InsertCall = { table: unknown; values: unknown };
const insertCalls: InsertCall[] = [];

const fakeDb = {
  update: vi.fn(() => ({
    set: (vals: unknown) => {
      updateCalls.push(vals);
      return { where: vi.fn() };
    },
  })),
  delete: vi.fn(() => ({
    where: (...args: unknown[]) => {
      deleteCalls.push(args);
      return {};
    },
  })),
  insert: vi.fn((table: unknown) => ({
    values: (vals: unknown) => {
      insertCalls.push({ table, values: vals });
      return {};
    },
  })),
  query: {
    gameSystemCategories: { findFirst: vi.fn() },
    gameSystemMechanics: { findFirst: vi.fn() },
  },
};

vi.mock("~/db/server-helpers", () => ({ getDb: vi.fn(() => fakeDb) }));
vi.mock("~/db/schema", () => ({
  gameSystems: {
    id: "id",
    cmsVersion: "cms_version",
    descriptionCms: "description_cms",
    cmsApproved: "cms_approved",
  },
  faqs: {
    gameSystemId: "game_system_id",
    question: "question",
    answer: "answer",
    source: "source",
    isCmsOverride: "is_cms_override",
  },
  mediaAssets: {
    id: "id",
    orderIndex: "order_index",
  },
  systemCrawlEvents: {
    gameSystemId: "game_system_id",
    source: "source",
    status: "status",
    startedAt: "started_at",
    finishedAt: "finished_at",
  },
  externalCategoryMap: {
    source: "source",
    externalTag: "external_tag",
    categoryId: "category_id",
    confidence: "confidence",
  },
  externalMechanicMap: {
    source: "source",
    externalTag: "external_tag",
    mechanicId: "mechanic_id",
    confidence: "confidence",
  },
  gameSystemCategories: { id: "id" },
  gameSystemMechanics: { id: "id" },
}));
vi.mock("drizzle-orm", () => ({
  eq: (...args: unknown[]) => ({ eq: args }),
  and: (...args: unknown[]) => ({ and: args }),
  sql: (strings: TemplateStringsArray, ...vals: unknown[]) => ({ sql: [strings, vals] }),
}));

describe("game system mutations", () => {
  it("updates CMS content and FAQs", async () => {
    await upsertCmsContentHandler({
      data: {
        systemId: 1,
        description: "Desc",
        faqs: [{ question: "Q", answer: "A" }],
      },
    });
    expect(updateCalls).toHaveLength(1);
    expect(deleteCalls).toHaveLength(1);
    expect(insertCalls).toHaveLength(1);
  });

  it("reorders images", async () => {
    await reorderImagesHandler({
      data: { systemId: 1, imageIds: [5, 6] },
    });
    expect(updateCalls.length).toBeGreaterThanOrEqual(3); // first from upsert, plus two here
  });

  it("queues a recrawl", async () => {
    const initialUpdates = updateCalls.length;
    const initialInserts = insertCalls.length;
    await triggerRecrawlHandler({ data: { systemId: 1 } });
    expect(updateCalls.length).toBe(initialUpdates + 1);
    expect(insertCalls.length).toBe(initialInserts + 1);
  });

  it("maps external tags to categories", async () => {
    fakeDb.query.gameSystemCategories.findFirst.mockResolvedValue({ id: 2 });
    const initialInserts = insertCalls.length;
    await mapExternalTagHandler({
      data: { systemId: 2, source: "bgg", externalId: "x1", confidence: 0.5 },
    });
    expect(insertCalls.length).toBe(initialInserts + 1);
    const last = insertCalls[insertCalls.length - 1];
    expect(last?.table).toEqual(expect.objectContaining({ externalTag: "external_tag" }));
    expect(last?.values).toEqual({
      source: "bgg",
      externalTag: "x1",
      categoryId: 2,
      confidence: 50,
    });
  });
});
