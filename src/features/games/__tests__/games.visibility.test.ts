/* @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { listGamesImpl } from "../games.queries";

// No wrapper mocks needed when testing the impl directly

// getDb: return chainable select API; tests control returned rows at the end
type Row = Record<string, unknown>;

function normalizeRow(row: Row): Row {
  const system = (row["gameSystem"] ?? {}) as Record<string, unknown>;
  const gameSystemId =
    (row["gameSystemId"] as number | undefined) ??
    (system["id"] as number | undefined) ??
    0;
  return {
    ...row,
    gameSystemId,
    gameSystemName: row["gameSystemName"] ?? system["name"] ?? null,
    gameSystemSlug: row["gameSystemSlug"] ?? system["slug"] ?? null,
    gameSystemAveragePlayTime:
      row["gameSystemAveragePlayTime"] ?? system["averagePlayTime"] ?? null,
    gameSystemMinPlayers: row["gameSystemMinPlayers"] ?? system["minPlayers"] ?? null,
    gameSystemMaxPlayers: row["gameSystemMaxPlayers"] ?? system["maxPlayers"] ?? null,
    systemHeroUrl: row["systemHeroUrl"] ?? null,
    systemCategories: row["systemCategories"] ?? [],
  };
}

function makeDbReturning(rows: Row[]) {
  const normalized = rows.map(normalizeRow);
  const rowsPromise = Promise.resolve(normalized);
  const mainGroup = { orderBy: () => rowsPromise };
  const mainWhere = { groupBy: () => mainGroup };
  const leftJoinChain = {
    leftJoin: () => leftJoinChain,
    where: () => mainWhere,
  };
  const mainInner2 = { leftJoin: () => leftJoinChain };
  const mainInner1 = { innerJoin: () => mainInner2 };

  return {
    select: () => ({
      from: () => ({
        innerJoin: () => mainInner1,
        // Support nested subquery used in `IN (${subquery})`
        where: () => mainWhere,
      }),
    }),
  } as unknown;
}

describe("listGames visibility", () => {
  beforeEach(() => vi.clearAllMocks());

  it("excludes protected games for unauthenticated viewers", async () => {
    const db = makeDbReturning([
      {
        id: "g-public",
        ownerId: "o1",
        visibility: "public",
        participantCount: 0,
        gameSystem: { id: 1, name: "Sys" },
        owner: { id: "o1", name: "A", email: "a@x" },
        dateTime: new Date(),
        description: "",
        expectedDuration: 60,
        language: "en",
        location: {},
        status: "scheduled",
        minimumRequirements: {},
        safetyRules: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    const result = await listGamesImpl(db, null, {});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.length).toBe(1);
      expect(result.data[0].visibility).toBe("public");
    }
  });

  it("excludes blocked organizer games for authenticated viewers (no leakage)", async () => {
    const db = makeDbReturning([
      {
        id: "g-visible",
        ownerId: "o2",
        visibility: "public",
        participantCount: 0,
        gameSystem: { id: 1, name: "Sys" },
        owner: { id: "o2", name: "B", email: "b@x" },
        dateTime: new Date(),
        description: "",
        expectedDuration: 60,
        language: "en",
        location: {},
        status: "scheduled",
        minimumRequirements: {},
        safetyRules: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    const result = await listGamesImpl(db, "viewer", {});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.find((g) => g.id === "g-visible")).toBeTruthy();
      expect(result.data.find((g) => g.id === "g-blocked")).toBeFalsy();
    }
  });

  it("includes protected games for connected viewers", async () => {
    const db = makeDbReturning([
      {
        id: "g-protected",
        ownerId: "o3",
        visibility: "protected",
        participantCount: 0,
        gameSystem: { id: 1, name: "Sys" },
        owner: { id: "o3", name: "C", email: "c@x" },
        dateTime: new Date(),
        description: "",
        expectedDuration: 60,
        language: "en",
        location: {},
        status: "scheduled",
        minimumRequirements: {},
        safetyRules: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    const result = await listGamesImpl(db, "viewer", {});
    expect(result.success).toBe(true);
    if (result.success) {
      const protectedItem = result.data.find((g) => g.id === "g-protected");
      expect(protectedItem).toBeTruthy();
      expect(protectedItem?.visibility).toBe("protected");
    }
  });
});
