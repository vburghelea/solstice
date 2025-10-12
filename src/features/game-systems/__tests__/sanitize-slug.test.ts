import { describe, expect, it } from "vitest";

import { sanitizeSlug } from "../lib/sanitize-slug";

describe("sanitizeSlug", () => {
  it("returns slug when defined", () => {
    expect(sanitizeSlug("example", 42)).toBe("example");
  });

  it("trims whitespace before validating", () => {
    expect(sanitizeSlug("  trimmed  ", 7)).toBe("trimmed");
  });

  it("falls back to id when slug missing", () => {
    expect(sanitizeSlug(null, 5)).toBe("5");
    expect(sanitizeSlug("", 8)).toBe("8");
  });
});
