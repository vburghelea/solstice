import { describe, expect, it, vi } from "vitest";
import { buildCloudinaryUrl, isCloudinaryUrl } from "~/shared/lib/cloudinary";
import { computeChecksum, deleteImage, uploadImage } from "../cloudinary";

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

const SAMPLE_URL =
  "https://res.cloudinary.com/demo/image/upload/v1719777345/sample-folder/sample-image.jpg";
const SAMPLE_URL_NO_VERSION =
  "https://res.cloudinary.com/demo/image/upload/sample-image.jpg";

describe("Cloudinary storage operations", () => {
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

describe("Cloudinary URL utilities", () => {
  it("detects cloudinary urls", () => {
    expect(isCloudinaryUrl(SAMPLE_URL)).toBe(true);
    expect(isCloudinaryUrl("https://example.com/image.jpg")).toBe(false);
  });

  it("injects transformation options", () => {
    const transformed = buildCloudinaryUrl(SAMPLE_URL, { width: 800, height: 600 });
    expect(transformed).toContain("f_auto");
    expect(transformed).toContain("q_auto:good");
    expect(transformed).toContain("w_800");
    expect(transformed).toContain("h_600");
  });

  it("generates dpr aware srcsets", () => {
    const base = buildCloudinaryUrl(SAMPLE_URL, { width: 800 });
    const retina = buildCloudinaryUrl(SAMPLE_URL, { width: 800, dpr: 2 });
    expect(retina).toContain("dpr_2");
    expect(retina).not.toBe(base);
  });

  it("inserts transforms when url has no version segment", () => {
    const transformed = buildCloudinaryUrl(SAMPLE_URL_NO_VERSION, { width: 600 });
    expect(transformed).toContain(
      "/image/upload/f_auto,q_auto:good,w_600,c_fill/sample-image.jpg",
    );
    expect(transformed.endsWith("sample-image.jpg")).toBe(true);
  });
});
