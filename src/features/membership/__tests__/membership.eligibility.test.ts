import { describe, expect, it } from "vitest";
import { evaluateMembershipEligibility } from "../membership.eligibility";

describe("Membership eligibility rules", () => {
  it("is eligible when membership is not required", () => {
    const result = evaluateMembershipEligibility({
      requiresMembership: false,
      hasActiveMembership: false,
      hasActiveDayPass: false,
    });

    expect(result.eligible).toBe(true);
  });

  it("is eligible with an active membership", () => {
    const result = evaluateMembershipEligibility({
      requiresMembership: true,
      hasActiveMembership: true,
      hasActiveDayPass: false,
    });

    expect(result.eligible).toBe(true);
  });

  it("is eligible with an active day pass", () => {
    const result = evaluateMembershipEligibility({
      requiresMembership: true,
      hasActiveMembership: false,
      hasActiveDayPass: true,
    });

    expect(result.eligible).toBe(true);
  });

  it("is not eligible without membership or day pass when required", () => {
    const result = evaluateMembershipEligibility({
      requiresMembership: true,
      hasActiveMembership: false,
      hasActiveDayPass: false,
    });

    expect(result.eligible).toBe(false);
  });
});
