import { describe, expect, it, vi } from "vitest";

vi.mock("~/features/social", () => ({
  followUser: vi.fn(),
}));
vi.mock("@tanstack/react-start/server", () => ({
  createFileRoute: () => ({ methods: () => ({}) }),
  getRequest: () => ({
    headers: {
      get: () => null,
    },
  }),
}));

describe("POST /api/social/follow", () => {
  it("returns 200 on success", async () => {
    const mod = await import("../follow");
    const social = await import("~/features/social");
    (social.followUser as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      success: true,
      data: true,
    });
    const res = await mod.handleFollow({ followingId: "u2" });
    expect(res.status).toBe(200);
  });

  it("returns 400 on validation error", async () => {
    const mod = await import("../follow");
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await mod.handleFollow({ followingId: "" });
    errSpy.mockRestore();
    expect(res.status).toBe(400);
  });
});
