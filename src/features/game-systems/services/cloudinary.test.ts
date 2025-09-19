import { describe, expect, it, vi } from "vitest";
import { computeChecksum, deleteImage, uploadImage } from "./cloudinary";

vi.mock("cloudinary", () => ({
  v2: {
    config: vi.fn(),
    uploader: {
      upload: vi.fn(async () => ({
        public_id: "test",
        secure_url: "https://example.com/image.jpg",
        width: 100,
        height: 100,
        format: "jpg",
      })),
      destroy: vi.fn(async () => ({ result: "ok" })),
    },
  },
}));

describe("Cloudinary service", () => {
  it("computes checksum", () => {
    expect(computeChecksum("hello")).toBe("5d41402abc4b2a76b9719d911017c592");
  });

  it("uploads image with metadata", async () => {
    const result = await uploadImage("file", {
      checksum: "abc",
      license: "CC0",
      licenseUrl: "https://example.com",
      kind: "hero",
      moderated: false,
    });
    expect(result.publicId).toBe("test");
    expect(result.kind).toBe("hero");
  });

  it("deletes image", async () => {
    await expect(deleteImage("test")).resolves.toBeUndefined();
  });
});
