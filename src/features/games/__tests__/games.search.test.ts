/* @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { searchGamesImpl } from "../games.queries";

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
  let lastLimit: number | null = null;

  const makeResult = (items: Row[]) => {
    const promise = Promise.resolve(items);
    return Object.assign(promise, {
      limit(limit: number) {
        lastLimit = limit;
        return makeResult(items.slice(0, limit));
      },
      offset(offset: number) {
        return makeResult(items.slice(offset));
      },
    });
  };

  const finalResult = makeResult(normalized);

  const whereChain = {
    groupBy: () => ({
      orderBy: () => finalResult,
    }),
  };

  type JoinChain = {
    innerJoin: () => JoinChain;
    leftJoin: () => JoinChain;
    where: () => typeof whereChain;
  };

  const joinChain: JoinChain = {
    innerJoin: () => joinChain,
    leftJoin: () => joinChain,
    where: () => whereChain,
  };

  return {
    db: {
      select: () => ({
        from: () => joinChain,
      }),
    } as unknown,
    getLimit: () => lastLimit,
  };
}

describe("searchGamesImpl", () => {
  beforeEach(() => vi.clearAllMocks());

  it("short-circuits for queries below minimum length", async () => {
    const { db, getLimit } = makeDbReturning([]);
    const result = await searchGamesImpl(db, "viewer", "ab");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(0);
    }
    expect(getLimit()).toBeNull();
  });

  it("limits results to public entries and enforces the 20 item cap", async () => {
    const rows: Row[] = Array.from({ length: 30 }, (_, index) => {
      const visibility =
        index < 22 ? "public" : index % 2 === 0 ? "private" : "protected";
      return {
        id: `g-${index}`,
        ownerId: `o-${index}`,
        visibility,
        participantCount: 0,
        gameSystem: { id: 1, name: "Sys" },
        owner: {
          id: `o-${index}`,
          name: `Owner ${index}`,
          email: `owner${index}@example.com`,
        },
        dateTime: new Date(),
        description: `Game ${index}`,
        expectedDuration: 60,
        language: "en",
        location: {},
        status: "scheduled",
        minimumRequirements: {},
        safetyRules: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });

    const { db, getLimit } = makeDbReturning(rows);
    const result = await searchGamesImpl(db, "viewer", "test search");
    expect(getLimit()).toBe(20);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(20);
      expect(result.data.every((item) => item.visibility === "public")).toBe(true);
      expect(result.data[0].id).toBe("g-0");
    }
  });
});
