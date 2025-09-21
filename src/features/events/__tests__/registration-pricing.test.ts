import { describe, expect, it } from "vitest";
import { calculateRegistrationAmountCents } from "~/features/events/utils";

const baseEvent = {
  teamRegistrationFee: 20000,
  individualRegistrationFee: 5000,
  earlyBirdDiscount: 0,
  earlyBirdDeadline: null,
} as unknown as Parameters<typeof calculateRegistrationAmountCents>[0];

function makeEvent(
  overrides: Partial<Parameters<typeof calculateRegistrationAmountCents>[0]> = {},
) {
  const event = { ...baseEvent, ...overrides } as Record<string, unknown>;
  for (const key of Object.keys(event)) {
    if (event[key] === undefined) {
      delete event[key];
    }
  }
  return event as Parameters<typeof calculateRegistrationAmountCents>[0];
}

describe("calculateRegistrationAmountCents", () => {
  const referenceDate = new Date("2025-05-01T00:00:00Z");

  it("returns team base fee when no discount configured", () => {
    const amount = calculateRegistrationAmountCents(makeEvent(), "team", referenceDate);
    expect(amount).toBe(20000);
  });

  it("returns individual base fee when no discount configured", () => {
    const amount = calculateRegistrationAmountCents(
      makeEvent(),
      "individual",
      referenceDate,
    );
    expect(amount).toBe(5000);
  });

  it("returns 0 for zero or negative fees", () => {
    expect(
      calculateRegistrationAmountCents(
        makeEvent({ teamRegistrationFee: 0 }),
        "team",
        referenceDate,
      ),
    ).toBe(0);

    expect(
      calculateRegistrationAmountCents(
        makeEvent({ teamRegistrationFee: -1 }),
        "team",
        referenceDate,
      ),
    ).toBe(0);

    expect(
      calculateRegistrationAmountCents(
        makeEvent({ teamRegistrationFee: null }),
        "team",
        referenceDate,
      ),
    ).toBe(0);
  });

  it("applies early-bird discount when now is before the deadline", () => {
    const deadline = new Date("2025-06-01T00:00:00Z");
    const amount = calculateRegistrationAmountCents(
      makeEvent({ earlyBirdDiscount: 25, earlyBirdDeadline: deadline }),
      "team",
      new Date("2025-05-31T00:00:00Z"),
    );
    expect(amount).toBe(15000);
  });

  it("applies early-bird discount when now equals the deadline", () => {
    const deadline = new Date("2025-06-01T00:00:00Z");
    const amount = calculateRegistrationAmountCents(
      makeEvent({ earlyBirdDiscount: 25, earlyBirdDeadline: deadline }),
      "team",
      new Date("2025-06-01T00:00:00Z"),
    );
    expect(amount).toBe(15000);
  });

  it("does not apply early-bird discount after the deadline", () => {
    const deadline = new Date("2025-06-01T00:00:00Z");
    const amount = calculateRegistrationAmountCents(
      makeEvent({ earlyBirdDiscount: 25, earlyBirdDeadline: deadline }),
      "team",
      new Date("2025-06-01T00:00:00.001Z"),
    );
    expect(amount).toBe(20000);
  });

  it("clamps negative discounts to zero", () => {
    const deadline = new Date("2025-06-01T00:00:00Z");
    const amount = calculateRegistrationAmountCents(
      makeEvent({ earlyBirdDiscount: -20, earlyBirdDeadline: deadline }),
      "team",
      new Date("2025-05-15T00:00:00Z"),
    );
    expect(amount).toBe(20000);
  });

  it("clamps discounts above 100 to a free registration", () => {
    const deadline = new Date("2025-06-01T00:00:00Z");
    const amount = calculateRegistrationAmountCents(
      makeEvent({ earlyBirdDiscount: 150, earlyBirdDeadline: deadline }),
      "team",
      new Date("2025-05-15T00:00:00Z"),
    );
    expect(amount).toBe(0);
  });

  it("rounds correctly for fractional discounts", () => {
    const deadline = new Date("2025-06-01T00:00:00Z");
    const amount = calculateRegistrationAmountCents(
      makeEvent({
        teamRegistrationFee: 999,
        earlyBirdDiscount: 33,
        earlyBirdDeadline: deadline,
      }),
      "team",
      new Date("2025-05-15T00:00:00Z"),
    );
    expect(amount).toBe(669);
  });

  it("applies discount logic for individual registrations", () => {
    const deadline = new Date("2025-06-01T00:00:00Z");
    const amount = calculateRegistrationAmountCents(
      makeEvent({ earlyBirdDiscount: 10, earlyBirdDeadline: deadline }),
      "individual",
      new Date("2025-05-20T00:00:00Z"),
    );
    expect(amount).toBe(4500);
  });

  it("ignores discounts when no deadline provided", () => {
    const amount = calculateRegistrationAmountCents(
      makeEvent({ earlyBirdDiscount: 50, earlyBirdDeadline: null }),
      "team",
      referenceDate,
    );
    expect(amount).toBe(20000);
  });
});
