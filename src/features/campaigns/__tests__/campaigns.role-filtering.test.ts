/* @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { listCampaignsImpl } from "../campaigns.queries";

function makeDbReturning(rows: unknown[]) {
  const rowsPromise = Promise.resolve(rows);
  const mainWhere = { groupBy: () => rowsPromise };
  const mainLeftJoin = { where: () => mainWhere };
  const mainInner2 = { leftJoin: () => mainLeftJoin };
  const mainInner1 = { innerJoin: () => mainInner2 };
  return {
    select: () => ({
      from: () => ({
        innerJoin: () => mainInner1,
        where: () => ({}),
      }),
    }),
  } as unknown;
}

describe("listCampaigns role filtering", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns only owned campaigns when userRole filter is 'owner'", async () => {
    const db = makeDbReturning([
      {
        campaign: {
          id: "campaign-owned",
          ownerId: "user1",
          visibility: "public",
          name: "My Campaign",
          description: "A campaign I own",
          status: "active",
          createdAt: new Date(),
          updatedAt: new Date(),
          gameSystemId: 1,
          location: {},
          minimumRequirements: {},
          safetyRules: {},
        },
        owner: { id: "user1", name: "Campaign Owner", email: "owner@test.com" },
        participantCount: 5,
        gameSystem: { id: 1, name: "D&D 5e" },
      },
    ]);

    const result = await listCampaignsImpl(db, "user1", { userRole: "owner" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.length).toBe(1);
      expect(result.data[0].id).toBe("campaign-owned");
      expect(result.data[0].userRole).toEqual({ role: "owner", status: "approved" });
    }
  });

  it("returns empty for player role when user doesn't participate", async () => {
    const db = makeDbReturning([]);

    const result = await listCampaignsImpl(db, "user1", { userRole: "player" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.length).toBe(0);
    }
  });

  it("returns empty for invited role when user has no invitations", async () => {
    const db = makeDbReturning([]);

    const result = await listCampaignsImpl(db, "user1", { userRole: "invited" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.length).toBe(0);
    }
  });

  it("returns empty when user has no campaigns matching the role filter", async () => {
    const db = makeDbReturning([]);

    const result = await listCampaignsImpl(db, "user1", { userRole: "owner" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.length).toBe(0);
    }
  });

  it("handles unauthenticated user with role filter gracefully", async () => {
    const db = makeDbReturning([]);

    const result = await listCampaignsImpl(db, null, { userRole: "owner" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.length).toBe(0);
    }
  });

  it("correctly maps owner role in query results", async () => {
    const db = makeDbReturning([
      {
        campaign: {
          id: "my-campaign",
          ownerId: "current-user",
          visibility: "public",
          name: "My Campaign",
          description: "A campaign I run",
          status: "active",
          createdAt: new Date(),
          updatedAt: new Date(),
          gameSystemId: 1,
          location: {},
          minimumRequirements: {},
          safetyRules: {},
          sessionZeroData: null,
          campaignExpectations: null,
          tableExpectations: null,
          characterCreationOutcome: null,
        },
        owner: { id: "current-user", name: "Me", email: "me@test.com" },
        participantCount: 6,
        gameSystem: { id: 1, name: "D&D 5e" },
      },
    ]);

    const result = await listCampaignsImpl(db, "current-user", {});

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.length).toBe(1);
      expect(result.data[0].id).toBe("my-campaign");
      // Should automatically assign owner role even without explicit filter
      expect(result.data[0].userRole).toEqual({ role: "owner", status: "approved" });
    }
  });

  it("does not assign owner role to campaigns owned by others", async () => {
    const db = makeDbReturning([
      {
        campaign: {
          id: "others-campaign",
          ownerId: "other-user",
          visibility: "public",
          name: "Other Campaign",
          description: "Someone else's campaign",
          status: "active",
          createdAt: new Date(),
          updatedAt: new Date(),
          gameSystemId: 1,
          location: {},
          minimumRequirements: {},
          safetyRules: {},
          sessionZeroData: null,
          campaignExpectations: null,
          tableExpectations: null,
          characterCreationOutcome: null,
        },
        owner: { id: "other-user", name: "Other", email: "other@test.com" },
        participantCount: 4,
        gameSystem: { id: 1, name: "Pathfinder" },
      },
    ]);

    const result = await listCampaignsImpl(db, "current-user", {});

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.length).toBe(1);
      expect(result.data[0].id).toBe("others-campaign");
      expect(result.data[0].userRole).toBeNull(); // No role assigned
    }
  });

  it("combines role filter with status filter correctly", async () => {
    const db = makeDbReturning([
      {
        campaign: {
          id: "active-owned-campaign",
          ownerId: "user1",
          visibility: "public",
          name: "Active Campaign",
          description: "My active campaign",
          status: "active",
          createdAt: new Date(),
          updatedAt: new Date(),
          gameSystemId: 1,
          location: {},
          minimumRequirements: {},
          safetyRules: {},
        },
        owner: { id: "user1", name: "Me", email: "me@test.com" },
        participantCount: 3,
        gameSystem: { id: 1, name: "D&D 5e" },
      },
    ]);

    const result = await listCampaignsImpl(db, "user1", {
      userRole: "owner",
      status: "active",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.length).toBe(1);
      expect(result.data[0].id).toBe("active-owned-campaign");
      expect(result.data[0].status).toBe("active");
      expect(result.data[0].userRole).toEqual({ role: "owner", status: "approved" });
    }
  });
});
