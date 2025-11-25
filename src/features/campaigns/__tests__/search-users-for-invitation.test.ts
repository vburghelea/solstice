/* @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-start", () => ({
  __esModule: true,
  createServerFn: () => ({
    inputValidator: () => ({ handler: (handler: unknown) => handler }),
  }),
  createServerOnlyFn: (fn: () => unknown) => fn(),
}));

import type { CampaignQueryDependencies } from "../campaigns.queries";
import { searchUsersForInvitationImpl } from "../campaigns.queries";

function createStubbedDeps() {
  const whereCalls: unknown[] = [];
  const stubDb = {
    select: () => ({
      from: () => ({
        where: (condition: unknown) => {
          whereCalls.push(condition);
          return {
            orderBy: () => ({
              limit: () =>
                Promise.resolve([
                  { id: "u2", name: "Connected User", email: "u2@example.com" },
                ]),
            }),
          };
        },
      }),
    }),
  };

  const sqlStub = ((strings: TemplateStringsArray, ...values: unknown[]) => ({
    type: "sql",
    strings: Array.from(strings),
    values,
  })) as unknown as CampaignQueryDependencies["sql"];

  const deps = {
    getDb: async () => stubDb,
    getCurrentUser: async () => ({ id: "viewer" }),
    user: { id: "user.id", name: "user.name", email: "user.email" } as unknown,
    or: ((...args: unknown[]) => ({
      type: "or",
      args,
    })) as unknown as CampaignQueryDependencies["or"],
    ilike: ((column: unknown, value: unknown) => ({
      type: "ilike",
      column,
      value,
    })) as unknown as CampaignQueryDependencies["ilike"],
    and: ((...conditions: unknown[]) => ({
      type: "and",
      conditions,
    })) as unknown as CampaignQueryDependencies["and"],
    ne: ((left: unknown, right: unknown) => ({
      type: "ne",
      left,
      right,
    })) as unknown as CampaignQueryDependencies["ne"],
    sql: sqlStub,
    userFollows: Symbol("userFollows"),
    userBlocks: Symbol("userBlocks"),
    teamMembers: Symbol("teamMembers"),
    // Unused dependencies provided as no-ops for type safety
    campaigns: {} as unknown,
    campaignParticipants: {} as unknown,
    campaignApplications: {} as unknown,
    gameSystems: {} as unknown,
    findCampaignById: async () => null,
    findPendingCampaignApplicationsByCampaignId: async () => [],
    findCampaignParticipantsByCampaignId: async () => [],
    findCampaignApplicationById: async () => null,
    findCampaignParticipantById: async () => null,
    findCampaignParticipantByCampaignAndUserId: async () => null,
    findUserByEmail: async () => null,
    getDbTransaction: async () => stubDb,
  } as unknown as CampaignQueryDependencies;

  return { deps, whereCalls };
}

describe("searchUsersForInvitation", () => {
  let whereCalls: unknown[];
  let deps: CampaignQueryDependencies;

  beforeEach(() => {
    const { deps: depsOverride, whereCalls: capturedWhere } = createStubbedDeps();
    whereCalls = capturedWhere;
    deps = depsOverride as CampaignQueryDependencies;
  });

  it("returns an empty result when the query is blank", async () => {
    const result = await searchUsersForInvitationImpl(deps, "   ");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(0);
    }
    expect(whereCalls).toHaveLength(0);
  });

  it("applies relationship gating when searching for users", async () => {
    const result = await searchUsersForInvitationImpl(deps, "User");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(1);
    }

    expect(whereCalls).toHaveLength(1);
    const whereClause = whereCalls[0] as { type: string; conditions: unknown[] };
    expect(whereClause.type).toBe("and");

    const connectionWrapper = whereClause.conditions.find((condition) => {
      if (!condition || typeof condition !== "object") {
        return false;
      }
      const sqlCondition = condition as {
        type?: string;
        values?: Array<{ strings?: string[] }>;
      };
      return (
        sqlCondition.type === "sql" &&
        Array.isArray(sqlCondition.values) &&
        sqlCondition.values[0]?.strings?.join("").includes("EXISTS (")
      );
    });
    expect(connectionWrapper).toBeDefined();

    const blockWrapper = whereClause.conditions.find((condition) => {
      if (!condition || typeof condition !== "object") {
        return false;
      }
      const sqlCondition = condition as { type?: string; strings?: string[] };
      return (
        sqlCondition.type === "sql" &&
        Array.isArray(sqlCondition.strings) &&
        sqlCondition.strings.join("").includes("NOT (")
      );
    });
    expect(blockWrapper).toBeDefined();
  });
});
