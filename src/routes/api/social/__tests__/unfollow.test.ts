import { describe, expect, it, vi } from "vitest";

vi.mock("~/features/social", () => ({
  unfollowUser: vi.fn(),
}));

describe("POST /api/social/unfollow", () => {
  it("returns 200 on success", async () => {
    const mod = await import("../unfollow");
    const social = await import("~/features/social");
    (social.unfollowUser as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      success: true,
      data: true,
    });
    const res = await mod.handleUnfollow({ followingId: "u2" });
    expect(res.status).toBe(200);
  });
});
