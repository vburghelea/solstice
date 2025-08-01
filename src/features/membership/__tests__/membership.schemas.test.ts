import { describe, expect, it } from "vitest";
import {
  cancelMembershipSchema,
  confirmMembershipPurchaseSchema,
  getMembershipTypeSchema,
  purchaseMembershipSchema,
} from "../membership.schemas";

describe("Membership Schemas", () => {
  describe("getMembershipTypeSchema", () => {
    it("validates valid membership type ID", () => {
      const validInput = {
        membershipTypeId: "membership-123",
      };

      const result = getMembershipTypeSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("fails without membership type ID", () => {
      const invalidInput = {};

      const result = getMembershipTypeSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it("fails with non-string membership type ID", () => {
      const invalidInput = {
        membershipTypeId: 123,
      };

      const result = getMembershipTypeSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });
  });

  describe("purchaseMembershipSchema", () => {
    it("validates valid purchase input", () => {
      const validInput = {
        membershipTypeId: "membership-123",
        autoRenew: true,
      };

      const result = purchaseMembershipSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      expect(result.data?.autoRenew).toBe(true);
    });

    it("validates purchase input without autoRenew (defaults to false)", () => {
      const validInput = {
        membershipTypeId: "membership-123",
      };

      const result = purchaseMembershipSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      expect(result.data?.autoRenew).toBe(false);
    });

    it("fails without membership type ID", () => {
      const invalidInput = {
        autoRenew: true,
      };

      const result = purchaseMembershipSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it("fails with invalid autoRenew type", () => {
      const invalidInput = {
        membershipTypeId: "membership-123",
        autoRenew: "yes", // Should be boolean
      };

      const result = purchaseMembershipSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });
  });

  describe("cancelMembershipSchema", () => {
    it("validates valid cancellation with all fields", () => {
      const validInput = {
        membershipId: "membership-123",
        reason: "Moving to another country",
        immediate: true,
      };

      const result = cancelMembershipSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      expect(result.data?.reason).toBe("Moving to another country");
      expect(result.data?.immediate).toBe(true);
    });

    it("validates cancellation without optional fields", () => {
      const validInput = {
        membershipId: "membership-123",
      };

      const result = cancelMembershipSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      expect(result.data?.reason).toBeUndefined();
      expect(result.data?.immediate).toBe(false);
    });

    it("validates cancellation with only reason", () => {
      const validInput = {
        membershipId: "membership-123",
        reason: "No longer playing",
      };

      const result = cancelMembershipSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      expect(result.data?.reason).toBe("No longer playing");
      expect(result.data?.immediate).toBe(false);
    });

    it("fails without membership ID", () => {
      const invalidInput = {
        reason: "No longer playing",
        immediate: true,
      };

      const result = cancelMembershipSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it("accepts empty string as reason", () => {
      const validInput = {
        membershipId: "membership-123",
        reason: "",
        immediate: false,
      };

      const result = cancelMembershipSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      expect(result.data?.reason).toBe("");
    });
  });

  describe("confirmMembershipPurchaseSchema", () => {
    it("validates valid confirmation with all fields", () => {
      const validInput = {
        membershipTypeId: "membership-123",
        sessionId: "session-456",
        paymentId: "payment-789",
      };

      const result = confirmMembershipPurchaseSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      expect(result.data?.paymentId).toBe("payment-789");
    });

    it("validates confirmation without optional payment ID", () => {
      const validInput = {
        membershipTypeId: "membership-123",
        sessionId: "session-456",
      };

      const result = confirmMembershipPurchaseSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      expect(result.data?.paymentId).toBeUndefined();
    });

    it("fails without membership type ID", () => {
      const invalidInput = {
        sessionId: "session-456",
        paymentId: "payment-789",
      };

      const result = confirmMembershipPurchaseSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it("fails without session ID", () => {
      const invalidInput = {
        membershipTypeId: "membership-123",
        paymentId: "payment-789",
      };

      const result = confirmMembershipPurchaseSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it("fails with non-string IDs", () => {
      const invalidInput = {
        membershipTypeId: 123,
        sessionId: 456,
        paymentId: 789,
      };

      const result = confirmMembershipPurchaseSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });
  });
});
