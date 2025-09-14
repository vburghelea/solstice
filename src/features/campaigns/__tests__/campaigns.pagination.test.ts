/* @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { listCampaignsWithCountImpl } from "../campaigns.queries";

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
        where: () => ({ groupBy: () => rowsPromise }),
      }),
    }),
  } as unknown;
}

describe("listCampaignsWithCountImpl pagination", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns totalCount and paginated items", async () => {
    const rows = [
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
    }
  });
});
