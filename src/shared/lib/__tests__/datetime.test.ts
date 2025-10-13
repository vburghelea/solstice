import { describe, expect, it } from "vitest";

import { formatDateAndTime, formatTimeHHmm } from "~/shared/lib/datetime";

describe("datetime utilities", () => {
  it("formats 24-hour time with leading zeros", () => {
    expect(formatTimeHHmm("2025-10-20T05:07:00")).toBe("05:07");
    expect(formatTimeHHmm("2025-10-20T18:45:00")).toBe("18:45");
  });

  it("formats date and time in dd/mm/yyyy hh:mm", () => {
    expect(formatDateAndTime("2025-10-20T18:00:00")).toBe("20/10/2025 18:00");
  });
});
