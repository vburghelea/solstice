import { describe, expect, it } from "vitest";

import { buildCloudinaryUrl, isCloudinaryUrl } from "~/shared/lib/cloudinary";

const SAMPLE_URL =
  "https://res.cloudinary.com/demo/image/upload/v1719777345/sample-folder/sample-image.jpg";

describe("cloudinary utils", () => {
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
});
