import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock ~/db to control query results
const userBlocksFindFirst = vi.fn();
const userFollowsFindFirst = vi.fn();

vi.mock("~/db", () => {
  return {
    db: () => ({
      query: {
        userBlocks: { findFirst: userBlocksFindFirst },
        userFollows: { findFirst: userFollowsFindFirst },
      },
    }),
  };
});

import { getRelationship, isConnectionsOnlyEligible } from "../relationship.server";

describe("relationship.server", () => {
  beforeEach(() => {
    userBlocksFindFirst.mockReset();
    userFollowsFindFirst.mockReset();
  });

  it("returns no relation when no follows or blocks", async () => {
    userBlocksFindFirst.mockResolvedValue(null);
    userFollowsFindFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(null);

    const rel = await getRelationship("u1-a", "u2-a");
    expect(rel).toEqual({
      follows: false,
      followedBy: false,
      blocked: false,
      blockedBy: false,
      isConnection: false,
    });
  });

  it("sets follows true when viewer follows target", async () => {
    userBlocksFindFirst.mockResolvedValue(null);
    userFollowsFindFirst.mockResolvedValueOnce({ id: "f1" }).mockResolvedValueOnce(null);

    const rel = await getRelationship("u1-b", "u2-b");
    expect(rel.follows).toBe(true);
    expect(rel.followedBy).toBe(false);
    expect(rel.isConnection).toBe(true);
  });

  it("sets followedBy true when target follows viewer", async () => {
    userBlocksFindFirst.mockResolvedValue(null);
    userFollowsFindFirst.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: "f2" });

    const rel = await getRelationship("u1-c", "u2-c");
    expect(rel.follows).toBe(false);
    expect(rel.followedBy).toBe(true);
    expect(rel.isConnection).toBe(true);
  });

  it("sets blocked true when viewer blocks target", async () => {
    userBlocksFindFirst.mockResolvedValue({ blockerId: "u1-d", blockeeId: "u2-d" });
    userFollowsFindFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(null);

    const rel = await getRelationship("u1-d", "u2-d");
    expect(rel.blocked).toBe(true);
    expect(rel.blockedBy).toBe(false);
  });

  it("sets blockedBy true when target blocks viewer", async () => {
    userBlocksFindFirst.mockResolvedValue({ blockerId: "u2-e", blockeeId: "u1-e" });
    userFollowsFindFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(null);

    const rel = await getRelationship("u1-e", "u2-e");
    expect(rel.blocked).toBe(false);
    expect(rel.blockedBy).toBe(true);
  });

  it("isConnectionsOnlyEligible short-circuits on null viewer", async () => {
    const ok = await isConnectionsOnlyEligible(null, "u2");
    expect(ok).toBe(false);
  });
});
