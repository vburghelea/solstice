/* @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { listCampaignsWithCountImpl } from "../campaigns.queries";

type CampaignRow = {
  campaign: {
    id: string;
    ownerId: string;
    visibility: string;
    name: string;
    description: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    gameSystemId: number;
    location: null;
    minimumRequirements: null;
    safetyRules: null;
    sessionZeroData?: null;
    campaignExpectations?: null;
    tableExpectations?: null;
    characterCreationOutcome?: null;
  };
  owner: { id: string; name: string | null; email: string };
  participantCount: number;
  gameSystem: { id: number; name: string };
};

function makeDbReturning(rows: CampaignRow[], totalCount = rows.length) {
  const paginationState = {
    lastLimit: undefined as number | undefined,
    lastOffset: undefined as number | undefined,
  };

  return {
    select(selection: Record<string, unknown>) {
      const isCountQuery = "totalCount" in selection;
      const state = {
        limit: undefined as number | undefined,
        offset: undefined as number | undefined,
      };

      const whereChain = {
        limit(value: number) {
          state.limit = value;
          if (!isCountQuery) {
            paginationState.lastLimit = value;
          }
          return whereChain;
        },
        offset(value: number) {
          state.offset = value;
          if (!isCountQuery) {
            paginationState.lastOffset = value;
          }
          return whereChain;
        },
        groupBy: () => {
          if (isCountQuery) {
            return Promise.resolve([{ totalCount }]);
          }
          const start = state.offset ?? 0;
          const limit = state.limit ?? rows.length;
          return Promise.resolve(rows.slice(start, start + limit));
        },
      };

      const joinChain = {
        innerJoin: () => joinChain,
        leftJoin: () => joinChain,
        where: () => whereChain,
      };

      return {
        from: () => joinChain,
      };
    },
    __getPagination: () => paginationState,
  } as unknown;
}

describe("listCampaignsWithCountImpl pagination", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns totalCount and paginated items", async () => {
    const rows: CampaignRow[] = [
      {
        campaign: {
          id: "c1",
          ownerId: "o1",
          visibility: "public",
          name: "C1",
          description: "",
          status: "ongoing",
          createdAt: new Date(),
          updatedAt: new Date(),
          gameSystemId: 1,
          location: null,
          minimumRequirements: null,
          safetyRules: null,
        },
        owner: { id: "o1", name: "A", email: "a@x" },
        participantCount: 0,
        gameSystem: { id: 1, name: "Sys" },
      },
      {
        campaign: {
          id: "c2",
          ownerId: "o1",
          visibility: "public",
          name: "C2",
          description: "",
          status: "ongoing",
          createdAt: new Date(),
          updatedAt: new Date(),
          gameSystemId: 1,
          location: null,
          minimumRequirements: null,
          safetyRules: null,
        },
        owner: { id: "o1", name: "A", email: "a@x" },
        participantCount: 0,
        gameSystem: { id: 1, name: "Sys" },
      },
      {
        campaign: {
          id: "c3",
          ownerId: "o1",
          visibility: "public",
          name: "C3",
          description: "",
          status: "ongoing",
          createdAt: new Date(),
          updatedAt: new Date(),
          gameSystemId: 1,
          location: null,
          minimumRequirements: null,
          safetyRules: null,
        },
        owner: { id: "o1", name: "A", email: "a@x" },
        participantCount: 0,
        gameSystem: { id: 1, name: "Sys" },
      },
    ];

    const db = makeDbReturning(rows);
    const res = await listCampaignsWithCountImpl(db, null, {}, 1, 2);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.totalCount).toBe(3);
      expect(res.data.items).toHaveLength(2);
      expect(res.data.items[0].id).toBe("c1");
      expect(res.data.items[1].id).toBe("c2");
      const pagination = (
        db as {
          __getPagination: () => {
            lastLimit: number | undefined;
            lastOffset: number | undefined;
          };
        }
      ).__getPagination();
      expect(pagination.lastLimit).toBe(2);
      expect(pagination.lastOffset).toBe(0);
    }
  });

  it("paginates subsequent pages", async () => {
    const rows: CampaignRow[] = [
      {
        campaign: {
          id: "c1",
          ownerId: "o1",
          visibility: "public",
          name: "C1",
          description: "",
          status: "ongoing",
          createdAt: new Date(),
          updatedAt: new Date(),
          gameSystemId: 1,
          location: null,
          minimumRequirements: null,
          safetyRules: null,
        },
        owner: { id: "o1", name: "A", email: "a@x" },
        participantCount: 0,
        gameSystem: { id: 1, name: "Sys" },
      },
      {
        campaign: {
          id: "c2",
          ownerId: "o1",
          visibility: "public",
          name: "C2",
          description: "",
          status: "ongoing",
          createdAt: new Date(),
          updatedAt: new Date(),
          gameSystemId: 1,
          location: null,
          minimumRequirements: null,
          safetyRules: null,
        },
        owner: { id: "o1", name: "A", email: "a@x" },
        participantCount: 0,
        gameSystem: { id: 1, name: "Sys" },
      },
      {
        campaign: {
          id: "c3",
          ownerId: "o1",
          visibility: "public",
          name: "C3",
          description: "",
          status: "ongoing",
          createdAt: new Date(),
          updatedAt: new Date(),
          gameSystemId: 1,
          location: null,
          minimumRequirements: null,
          safetyRules: null,
        },
        owner: { id: "o1", name: "A", email: "a@x" },
        participantCount: 0,
        gameSystem: { id: 1, name: "Sys" },
      },
    ];

    const db = makeDbReturning(rows);
    const res = await listCampaignsWithCountImpl(db, null, {}, 2, 2);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.items).toHaveLength(1);
      expect(res.data.items[0].id).toBe("c3");
      const pagination = (
        db as {
          __getPagination: () => {
            lastLimit: number | undefined;
            lastOffset: number | undefined;
          };
        }
      ).__getPagination();
      expect(pagination.lastLimit).toBe(2);
      expect(pagination.lastOffset).toBe(2);
    }
  });
});
