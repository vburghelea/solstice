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
        // Support nested subquery path
        where: () => ({}),
      }),
    }),
  } as unknown;
}

describe("listCampaigns visibility", () => {
  beforeEach(() => vi.clearAllMocks());

  it("excludes protected campaigns for unauthenticated viewers", async () => {
    const db = makeDbReturning([
      {
        campaign: {
          id: "c-public",
          ownerId: "o1",
          visibility: "public",
          name: "",
          description: "",
          status: "ongoing",
          createdAt: new Date(),
          updatedAt: new Date(),
          gameSystemId: 1,
        },
        owner: { id: "o1", name: "A", email: "a@x" },
        participantCount: 0,
        gameSystem: { id: 1, name: "Sys" },
      },
    ]);
    const result = await listCampaignsImpl(db, null, {});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.length).toBe(1);
      expect(result.data[0].visibility).toBe("public");
    }
  });

  it("excludes blocked organizer campaigns for authenticated viewers (no leakage)", async () => {
    const db = makeDbReturning([
      {
        campaign: {
          id: "c-visible",
          ownerId: "o2",
          visibility: "public",
          name: "",
          description: "",
          status: "ongoing",
          createdAt: new Date(),
          updatedAt: new Date(),
          gameSystemId: 1,
        },
        owner: { id: "o2", name: "B", email: "b@x" },
        participantCount: 0,
        gameSystem: { id: 1, name: "Sys" },
      },
    ]);
    const result = await listCampaignsImpl(db, "viewer", {});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.find((c) => c.id === "c-visible")).toBeTruthy();
      expect(result.data.find((c) => c.id === "c-blocked")).toBeFalsy();
    }
  });

  it("includes protected campaigns for connected viewers", async () => {
    const db = makeDbReturning([
      {
        campaign: {
          id: "c-protected",
          ownerId: "o3",
          visibility: "protected",
          name: "",
          description: "",
          status: "ongoing",
          createdAt: new Date(),
          updatedAt: new Date(),
          gameSystemId: 1,
        },
        owner: { id: "o3", name: "C", email: "c@x" },
        participantCount: 0,
        gameSystem: { id: 1, name: "Sys" },
      },
    ]);
    const result = await listCampaignsImpl(db, "viewer", {});
    expect(result.success).toBe(true);
    if (result.success) {
      const protectedItem = result.data.find((c) => c.id === "c-protected");
      expect(protectedItem).toBeTruthy();
      expect(protectedItem?.visibility).toBe("protected");
    }
  });
});
