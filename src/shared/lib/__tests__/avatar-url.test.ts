import { describe, expect, it } from "vitest";
import { normalizeUploadedAvatarPath } from "~/shared/lib/avatar-url";

describe("normalizeUploadedAvatarPath", () => {
  it("converts /avatars path to /api/avatars", () => {
    expect(normalizeUploadedAvatarPath("/avatars/x.webp")).toBe("/api/avatars/x.webp");
  });
  it("keeps /api/avatars path unchanged", () => {
    expect(normalizeUploadedAvatarPath("/api/avatars/x.webp")).toBe(
      "/api/avatars/x.webp",
    );
  });
  it("returns null for nullish", () => {
    expect(normalizeUploadedAvatarPath(null)).toBeNull();
    expect(normalizeUploadedAvatarPath(undefined)).toBeNull();
  });
});
