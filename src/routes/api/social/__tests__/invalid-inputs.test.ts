import { describe, expect, it, vi } from "vitest";

vi.mock("~/features/social", () => ({
  unfollowUser: vi.fn(async () => ({ success: true, data: true })),
  blockUser: vi.fn(async () => ({ success: true, data: true })),
  unblockUser: vi.fn(async () => ({ success: true, data: true })),
  getRelationshipSnapshot: vi.fn(async () => ({
    success: true,
    data: {
      follows: false,
      followedBy: false,
      blocked: false,
      blockedBy: false,
      isConnection: false,
      targetUser: { id: "u", name: "", email: "" },
    },
  })),
  getBlocklist: vi.fn(async () => ({
    success: true,
    data: { items: [], totalCount: 0 },
  })),
}));

describe("/api/social invalid inputs", () => {
  it("unfollow returns 400 on invalid body", async () => {
    const mod = await import("../unfollow");
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await mod.handleUnfollow({ followingId: 123 as unknown as string });
    spy.mockRestore();
    expect(res.status).toBe(400);
  });

  it("block returns 400 on invalid body", async () => {
    const mod = await import("../block");
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await mod.handleBlock({});
    spy.mockRestore();
    expect(res.status).toBe(400);
  });

  it("unblock returns 400 on invalid body", async () => {
    const mod = await import("../unblock");
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await mod.handleUnblock({});
    spy.mockRestore();
    expect(res.status).toBe(400);
  });

  it("relationship returns 400 on missing userId", async () => {
    const mod = await import("../relationship");
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await mod.handleRelationship({});
    spy.mockRestore();
    expect(res.status).toBe(400);
  });

  it("blocklist returns 400 on invalid page", async () => {
    const mod = await import("../blocklist");
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await mod.handleBlocklist({ page: -1, pageSize: 10 });
    spy.mockRestore();
    expect(res.status).toBe(400);
  });
});
