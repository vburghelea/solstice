import { describe, expect, it, vi } from "vitest";

vi.mock("~/lib/storage/avatars", () => ({
  readAvatar: vi.fn(),
}));

describe("GET /api/avatars/:file", () => {
  it("returns 400 for invalid filenames", async () => {
    const { getAvatarResponse } = await import("../$file");
    const res = await getAvatarResponse("../bad");
    expect(res.status).toBe(400);
  });

  it("returns 404 when not found", async () => {
    const { getAvatarResponse } = await import("../$file");
    const { readAvatar } = await import("~/lib/storage/avatars");
    (readAvatar as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);
    const res = await getAvatarResponse("u1.webp");
    expect(res.status).toBe(404);
  });

  it("returns 200 with correct headers when found", async () => {
    const { getAvatarResponse } = await import("../$file");
    const { readAvatar } = await import("~/lib/storage/avatars");
    (readAvatar as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: new Uint8Array([1, 2, 3]),
      contentType: "image/webp",
    });
    const res = await getAvatarResponse("u1.webp");
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/webp");
    expect(res.headers.get("Cache-Control")).toContain("max-age");
    const ab = await res.arrayBuffer();
    expect(new Uint8Array(ab)).toHaveLength(3);
  });
});
