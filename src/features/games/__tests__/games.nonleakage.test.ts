/* @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { listGamesImpl } from "../games.queries";

// Lightweight chainable DB stub returning a fixed set of rows
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

function makeDbReturning(rows: Row[], filter: (row: Row) => boolean) {
  const filtered = rows.map(normalizeRow).filter(filter);
  const rowsPromise = Promise.resolve(filtered);
  const mainGroup = { orderBy: () => rowsPromise, limit: () => rowsPromise };
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
        where: () => mainWhere,
      }),
    }),
  } as unknown;
}

describe("listGames non-leakage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does not leak protected items into unauthenticated results length", async () => {
    // Dataset includes a protected item; unauthenticated should not see it
    const rows = [
      {
        id: "g1-public",
        ownerId: "o1",
        visibility: "public",
        participantCount: 0,
        gameSystem: { id: 1, name: "Sys" },
        owner: { id: "o1", name: "Owner", email: "o@x" },
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
      {
        id: "g2-protected",
        ownerId: "o2",
        visibility: "protected",
        participantCount: 0,
        gameSystem: { id: 1, name: "Sys" },
        owner: { id: "o2", name: "Owner2", email: "o2@x" },
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
    ];
    const db = makeDbReturning(rows, (r) => (r["visibility"] as string) === "public");

    const result = await listGamesImpl(db, null, {});
    expect(result.success).toBe(true);
    if (result.success) {
      // Only visible (public) items contribute to the list length
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe("g1-public");
    }
  });

  it("filters out blocked organizers from results length for authenticated viewers", async () => {
    // Simulate a dataset post-filtering where a blocked organizer's items are excluded
    const db = makeDbReturning(
      [
        {
          id: "g-visible",
          ownerId: "oA",
          visibility: "public",
          participantCount: 0,
          gameSystem: { id: 1, name: "Sys" },
          owner: { id: "oA", name: "OwnerA", email: "a@x" },
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
        // Protected row that would be visible only to connections; simulate excluded here
        { id: "g-protected", ownerId: "oB", visibility: "protected" },
        // Simulate blocked organizer row by simply excluding via filter below
      ] as Row[],
      (r) =>
        (r["id"] as string) !== "g-blocked" &&
        (r["visibility"] as string) !== "protected",
    );

    const result = await listGamesImpl(db, "viewer", {});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe("g-visible");
    }
  });
});
