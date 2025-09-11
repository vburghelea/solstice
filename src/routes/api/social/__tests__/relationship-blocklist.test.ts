import { describe, expect, it, vi } from "vitest";

vi.mock("~/features/social", () => ({
  getRelationshipSnapshot: vi.fn(),
  getBlocklist: vi.fn(),
}));

describe("GET /api/social/relationship and blocklist helpers", () => {
  it("relationship returns 200 on success", async () => {
    const mod = await import("../relationship");
    const social = await import("~/features/social");
    (
      social.getRelationshipSnapshot as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValueOnce({
      success: true,
      data: {
        follows: false,
        followedBy: false,
        blocked: false,
        blockedBy: false,
        isConnection: false,
        targetUser: { id: "u2", name: "", email: "" },
      },
    });
    const res = await mod.handleRelationship({ userId: "u2" });
    expect(res.status).toBe(200);
  });

  it("blocklist returns 200 on success", async () => {
    const mod = await import("../blocklist");
    const social = await import("~/features/social");
    (social.getBlocklist as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      success: true,
      data: { items: [], totalCount: 0 },
    });
    const res = await mod.handleBlocklist({ page: 1, pageSize: 10 });
    expect(res.status).toBe(200);
  });
});
