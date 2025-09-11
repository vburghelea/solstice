/* @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { listGamesWithCountImpl } from "../games.queries";

function makeDbReturning(rows: unknown[]) {
  const rowsPromise = Promise.resolve(rows);
  const mainGroup = { orderBy: () => rowsPromise, limit: () => rowsPromise };
  const mainWhere = { groupBy: () => mainGroup };
  const mainLeftJoin = { where: () => mainWhere };
  const mainInner2 = { leftJoin: () => mainLeftJoin };
  const mainInner1 = { innerJoin: () => mainInner2 };

  return {
    select: () => ({
      from: () => ({
        innerJoin: () => mainInner1,
        where: () => ({ groupBy: () => mainGroup }),
      }),
    }),
  } as unknown;
}

describe("listGamesWithCountImpl pagination", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns totalCount and paginated items", async () => {
    const rows = [
      {
        id: "g1",
        ownerId: "o1",
        campaignId: null,
        gameSystemId: 1,
        name: "G1",
        dateTime: new Date(),
        description: "",
        expectedDuration: 60,
        price: 0,
        language: "en",
        location: {},
        status: "scheduled",
        minimumRequirements: {},
        visibility: "public",
        safetyRules: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        owner: { id: "o1", name: "A", email: "a@x" },
        gameSystem: { id: 1, name: "Sys" },
        participantCount: 0,
      },
      {
        id: "g2",
        ownerId: "o1",
        campaignId: null,
        gameSystemId: 1,
        name: "G2",
        dateTime: new Date(),
        description: "",
        expectedDuration: 60,
        price: 0,
        language: "en",
        location: {},
        status: "scheduled",
        minimumRequirements: {},
        visibility: "public",
        safetyRules: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        owner: { id: "o1", name: "A", email: "a@x" },
        gameSystem: { id: 1, name: "Sys" },
        participantCount: 0,
      },
      {
        id: "g3",
        ownerId: "o1",
        campaignId: null,
        gameSystemId: 1,
        name: "G3",
        dateTime: new Date(),
        description: "",
        expectedDuration: 60,
        price: 0,
        language: "en",
        location: {},
        status: "scheduled",
        minimumRequirements: {},
        visibility: "public",
        safetyRules: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        owner: { id: "o1", name: "A", email: "a@x" },
        gameSystem: { id: 1, name: "Sys" },
        participantCount: 0,
      },
    ];
    const db = makeDbReturning(rows);

    const res = await listGamesWithCountImpl(db, null, {}, 1, 2);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.totalCount).toBe(3);
      expect(res.data.items).toHaveLength(2);
      expect(res.data.items[0].id).toBe("g1");
      expect(res.data.items[1].id).toBe("g2");
    }
  });
});
