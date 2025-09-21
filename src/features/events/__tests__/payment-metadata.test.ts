import { describe, expect, it } from "vitest";
import {
  appendCancellationNote,
  buildEtransferSnapshot,
  fixedClock,
  markEtransferPaidMetadata,
  markEtransferReminderMetadata,
} from "~/features/events/utils";

describe("payment metadata utilities", () => {
  const clock = fixedClock("2025-01-01T12:00:00.000Z");

  it("builds snapshot with instructions and recipient", () => {
    expect(buildEtransferSnapshot("send to x", "pay@club.ca")).toEqual({
      instructionsSnapshot: "send to x",
      recipient: "pay@club.ca",
    });
  });

  it("marks e-transfer paid with actor + timestamp", () => {
    const meta = markEtransferPaidMetadata(undefined, "user-123", clock);
    expect(meta.markedPaidBy).toBe("user-123");
    expect(meta.markedPaidAt).toBe("2025-01-01T12:00:00.000Z");
  });

  it("marks e-transfer reminder with actor + timestamp", () => {
    const meta = markEtransferReminderMetadata({ notes: "pending" }, "admin-1", clock);
    expect(meta.lastReminderBy).toBe("admin-1");
    expect(meta.lastReminderAt).toBe("2025-01-01T12:00:00.000Z");
    expect(meta.notes).toBe("pending");
  });

  it("appends cancellation notes only once", () => {
    const note = "Event cancelled by admin";
    const first = appendCancellationNote({}, note);
    const second = appendCancellationNote(first, note);
    expect(second.notes).toBe(note);
  });
});
