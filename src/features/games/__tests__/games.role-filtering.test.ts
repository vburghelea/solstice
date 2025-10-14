/* @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { listGamesImpl } from "../games.queries";

// Test database mock that can return different data based on filters
function makeDbReturning(rows: unknown[]) {
  const normalized = rows.map((row) => {
    const typedRow = row as Record<string, unknown>;
    const system = (typedRow["gameSystem"] as Record<string, unknown>) || {
      id: 1,
      name: "Test System",
    };
    return {
      ...typedRow,
      gameSystemId: typedRow["gameSystemId"] || system["id"],
      gameSystemName: system["name"],
      gameSystemSlug: system["slug"],
      gameSystemAveragePlayTime: system["averagePlayTime"],
      gameSystemMinPlayers: system["minPlayers"],
      gameSystemMaxPlayers: system["maxPlayers"],
      systemHeroUrl: typedRow["systemHeroUrl"] || null,
      systemCategories: typedRow["systemCategories"] || [],
      // Preserve user role fields from mock data
      userRole: typedRow["userRole"] || null,
      userStatus: typedRow["userStatus"] || null,
    };
  });

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
        where: () => mainWhere,
      }),
    }),
  } as unknown;
}

describe("listGames role filtering", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns only owned games when userRole filter is 'owner'", async () => {
    const db = makeDbReturning([
      {
        id: "game-owned",
        ownerId: "user1",
        visibility: "public",
        participantCount: 2,
        gameSystem: { id: 1, name: "D&D" },
        owner: { id: "user1", name: "Owner", email: "owner@test.com" },
        dateTime: new Date(),
        description: "My owned game",
        expectedDuration: 180,
        language: "en",
        location: {},
        status: "scheduled",
        minimumRequirements: {},
        safetyRules: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const result = await listGamesImpl(db, "user1", { userRole: "owner" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.length).toBe(1);
      expect(result.data[0].id).toBe("game-owned");
      expect(result.data[0].userRole).toEqual({ role: "owner", status: "approved" });
    }
  });

  it("returns only participated games when userRole filter is 'player'", async () => {
    const db = makeDbReturning([
      {
        id: "game-participating",
        ownerId: "other-user",
        visibility: "public",
        participantCount: 3,
        gameSystem: { id: 1, name: "D&D" },
        owner: { id: "other-user", name: "Other Owner", email: "other@test.com" },
        dateTime: new Date(),
        description: "Game I'm participating in",
        expectedDuration: 180,
        language: "en",
        location: {},
        status: "scheduled",
        minimumRequirements: {},
        safetyRules: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        userRole: "player" as const, // Simulate participant record
        userStatus: "approved" as const,
      },
    ]);

    const result = await listGamesImpl(db, "user1", { userRole: "player" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.length).toBe(1);
      expect(result.data[0].id).toBe("game-participating");
      expect(result.data[0].userRole).toEqual({ role: "player", status: "approved" });
    }
  });

  it("returns empty when user has no games matching the role filter", async () => {
    const db = makeDbReturning([]);

    const result = await listGamesImpl(db, "user1", { userRole: "owner" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.length).toBe(0);
    }
  });

  it("handles unauthenticated user with role filter gracefully", async () => {
    const db = makeDbReturning([]);

    const result = await listGamesImpl(db, null, { userRole: "owner" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.length).toBe(0);
    }
  });

  it("correctly maps owner role in query results", async () => {
    const db = makeDbReturning([
      {
        id: "my-game",
        ownerId: "current-user",
        visibility: "public",
        participantCount: 1,
        gameSystem: { id: 1, name: "D&D" },
        owner: { id: "current-user", name: "Me", email: "me@test.com" },
        dateTime: new Date(),
        description: "My game",
        expectedDuration: 180,
        language: "en",
        location: {},
        status: "scheduled",
        minimumRequirements: {},
        safetyRules: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const result = await listGamesImpl(db, "current-user", {});

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.length).toBe(1);
      expect(result.data[0].id).toBe("my-game");
      // Should automatically assign owner role even without explicit filter
      expect(result.data[0].userRole).toEqual({ role: "owner", status: "approved" });
    }
  });

  it("does not assign owner role to games owned by others", async () => {
    const db = makeDbReturning([
      {
        id: "others-game",
        ownerId: "other-user",
        visibility: "public",
        participantCount: 2,
        gameSystem: { id: 1, name: "D&D" },
        owner: { id: "other-user", name: "Other", email: "other@test.com" },
        dateTime: new Date(),
        description: "Someone else's game",
        expectedDuration: 180,
        language: "en",
        location: {},
        status: "scheduled",
        minimumRequirements: {},
        safetyRules: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const result = await listGamesImpl(db, "current-user", {});

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.length).toBe(1);
      expect(result.data[0].id).toBe("others-game");
      expect(result.data[0].userRole).toBeNull(); // No role assigned
    }
  });
});
