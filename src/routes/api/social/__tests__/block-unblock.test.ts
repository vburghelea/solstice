import { describe, expect, it, vi } from "vitest";

vi.mock("~/features/social", () => ({
  blockUser: vi.fn(),
  unblockUser: vi.fn(),
}));
vi.mock("@tanstack/react-start/server", () => ({
  createFileRoute: () => ({ methods: () => ({}) }),
  getRequest: () => ({
    headers: {
      get: () => null,
    },
  }),
}));

describe("POST /api/social/block|unblock", () => {
  it("block returns 200 on success", async () => {
    const mod = await import("../block");
    const social = await import("~/features/social");
    (social.blockUser as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      success: true,
      data: true,
    });
    const res = await mod.handleBlock({ userId: "u2" });
    expect(res.status).toBe(200);
  });

  it("unblock returns 200 on success", async () => {
    const mod = await import("../unblock");
    const social = await import("~/features/social");
    (social.unblockUser as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      success: true,
      data: true,
    });
    const res = await mod.handleUnblock({ userId: "u2" });
    expect(res.status).toBe(200);
  });
});
