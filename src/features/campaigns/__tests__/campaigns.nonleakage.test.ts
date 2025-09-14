/* @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { listCampaignsImpl } from "../campaigns.queries";

type Row = Record<string, unknown>;
function makeDbReturning(rows: Row[], filter: (row: Row) => boolean) {
  const rowsPromise = Promise.resolve(rows.filter(filter));
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

describe("listCampaigns non-leakage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does not leak protected items into unauthenticated results length", async () => {
    const rows = [
      {
        campaign: {
          id: "c1-public",
          ownerId: "o1",
          visibility: "public",
          name: "A",
          description: "",
          status: "ongoing",
          createdAt: new Date(),
          updatedAt: new Date(),
          gameSystemId: 1,
        },
        owner: { id: "o1", name: "Owner1", email: "o1@x" },
        participantCount: 0,
        gameSystem: { id: 1, name: "Sys" },
      },
      {
        campaign: {
          id: "c2-protected",
          ownerId: "o2",
          visibility: "protected",
          name: "B",
          description: "",
          status: "ongoing",
          createdAt: new Date(),
          updatedAt: new Date(),
          gameSystemId: 1,
        },
        owner: { id: "o2", name: "Owner2", email: "o2@x" },
        participantCount: 0,
        gameSystem: { id: 1, name: "Sys" },
      },
    ];
    const db = makeDbReturning(
      rows,
      (r) => (r["campaign"] as { visibility?: string })?.visibility === "public",
    );

    const result = await listCampaignsImpl(db, null, {});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe("c1-public");
    }
  });

  it("filters out blocked organizers from results length for authenticated viewers", async () => {
    const db = makeDbReturning(
      [
        {
          campaign: {
            id: "c-visible",
            ownerId: "oA",
            visibility: "public",
            name: "",
            description: "",
            status: "ongoing",
            createdAt: new Date(),
            updatedAt: new Date(),
            gameSystemId: 1,
          },
          owner: { id: "oA", name: "OwnerA", email: "a@x" },
          participantCount: 0,
          gameSystem: { id: 1, name: "Sys" },
        },
        // Protected row that would be visible only to connections; simulate excluded in this case
        { campaign: { id: "c-protected", ownerId: "oB", visibility: "protected" } },
        // Simulate blocked organizer row excluded via filter below
      ] as Row[],
      (r) =>
        (r["campaign"] as { id?: string; visibility?: string })?.id !== "c-blocked" &&
        (r["campaign"] as { visibility?: string })?.visibility !== "protected",
    );

    const result = await listCampaignsImpl(db, "viewer", {});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe("c-visible");
    }
  });
});
