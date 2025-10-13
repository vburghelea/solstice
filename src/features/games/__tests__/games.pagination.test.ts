/* @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { listGamesWithCountImpl } from "../games.queries";

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

function makeDbReturning(rows: Row[], options: { totalCount?: number } = {}) {
  const normalized = rows.map(normalizeRow);
  let lastLimit: number | null = null;
  let lastOffset: number | null = null;

  const select = vi.fn((selection?: unknown) => {
    const isCountSelection =
      typeof selection === "object" &&
      selection !== null &&
      "value" in (selection as Record<string, unknown>);

    if (isCountSelection) {
      return {
        from: () => ({
          where: () =>
            Promise.resolve([{ value: options.totalCount ?? normalized.length }]),
        }),
      };
    }

    const orderResult = Object.assign(Promise.resolve(normalized), {
      limit(limit: number) {
        lastLimit = limit;
        return {
          offset(offset: number) {
            lastOffset = offset;
            return Promise.resolve(normalized.slice(offset, offset + limit));
          },
        };
      },
      offset(offset: number) {
        lastOffset = offset;
        return Promise.resolve(normalized.slice(offset));
      },
    });

    const whereChain = {
      groupBy: () => ({
        orderBy: () => orderResult,
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
      from: () => joinChain,
    };
  });

  return {
    db: { select } as unknown,
    select,
    getLimit: () => lastLimit,
    getOffset: () => lastOffset,
  };
}

describe("listGamesWithCountImpl pagination", () => {
  beforeEach(() => vi.clearAllMocks());

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

  it("returns paginated items with dedicated count query", async () => {
    const { db, select, getLimit, getOffset } = makeDbReturning(rows, {
      totalCount: 5,
    });

    const res = await listGamesWithCountImpl(db, null, {}, 1, 2);
    expect(select).toHaveBeenCalledTimes(2);
    expect(getLimit()).toBe(2);
    expect(getOffset()).toBe(0);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.totalCount).toBe(5);
      expect(res.data.items).toHaveLength(2);
      expect(res.data.items[0].id).toBe("g1");
      expect(res.data.items[1].id).toBe("g2");
    }
  });

  it("applies offset when requesting subsequent pages", async () => {
    const { db, getLimit, getOffset } = makeDbReturning(rows);

    const res = await listGamesWithCountImpl(db, null, {}, 2, 2);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.totalCount).toBe(3);
      expect(res.data.items).toHaveLength(1);
      expect(res.data.items[0].id).toBe("g3");
    }
    expect(getLimit()).toBe(2);
    expect(getOffset()).toBe(2);
  });
});
