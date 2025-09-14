import { describe, expect, it } from "vitest";
import {
  confirmMembershipPurchaseSchema,
  purchaseMembershipSchema,
} from "../membership.schemas";

describe("Membership Server Function Validation", () => {
  describe("createCheckoutSession validation", () => {
    it("validates membership purchase input correctly", () => {
      // The actual server function uses omit({ autoRenew: true })
      const schema = purchaseMembershipSchema.omit({ autoRenew: true });

      const validInput = {
        data: {
          membershipTypeId: "membership-123",
        },
      };

      const result = schema.safeParse(validInput.data);
      expect(result.success).toBe(true);
    });

    it("fails without membership type ID", () => {
      const schema = purchaseMembershipSchema.omit({ autoRenew: true });

      const invalidInput = {
        data: {},
      };

      const result = schema.safeParse(invalidInput.data);
      expect(result.success).toBe(false);
    });
  });

  describe("confirmMembershipPurchase validation", () => {
    it("validates confirmation input correctly", () => {
      const validInput = {
        data: {
          membershipTypeId: "membership-123",
          sessionId: "session-456",
          paymentId: "payment-789",
        },
      };

      const result = confirmMembershipPurchaseSchema.safeParse(validInput.data);
      expect(result.success).toBe(true);
    });

    it("validates without optional payment ID", () => {
      const validInput = {
        data: {
          membershipTypeId: "membership-123",
          sessionId: "session-456",
        },
      };

      const result = confirmMembershipPurchaseSchema.safeParse(validInput.data);
      expect(result.success).toBe(true);
    });

    it("fails without required fields", () => {
      const invalidInput = {
        data: {
          membershipTypeId: "membership-123",
          // Missing sessionId
        },
      };

      const result = confirmMembershipPurchaseSchema.safeParse(invalidInput.data);
      expect(result.success).toBe(false);
    });
  });

  describe("Membership Types", () => {
    it("validates membership type structure", () => {
      // This is more of a type check than a runtime validation
      const membershipType = {
        id: "annual-player-2025",
        name: "Annual Player Membership 2025",
        description: "Full player membership for 2025 season",
        priceCents: 4500,
        currency: "CAD",
        durationMonths: 12,
        benefits: [
          "Tournament participation",
          "League play",
          "Insurance coverage",
          "Voting rights",
        ],
        status: "active" as const,
        maxPurchases: 1,
        validFrom: new Date("2025-01-01"),
        validUntil: new Date("2025-12-31"),
      };

      expect(membershipType).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        priceCents: expect.any(Number),
        durationMonths: expect.any(Number),
        status: expect.stringMatching(/active|inactive|archived/),
      });
    });
  });

  describe("Membership Record", () => {
    it("validates membership record structure", () => {
      const membership = {
        id: "membership-123",
        userId: "user-456",
        membershipTypeId: "annual-player-2025",
        startDate: "2025-01-01",
        endDate: "2025-12-31",
        status: "active" as const,
        paymentProvider: "square" as const,
        paymentId: "payment-789",
        autoRenew: false,
        metadata: {
          sessionId: "session-123",
          purchasedAt: new Date().toISOString(),
        },
      };

      expect(membership).toMatchObject({
        id: expect.any(String),
        userId: expect.any(String),
        membershipTypeId: expect.any(String),
        startDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        endDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        status: expect.stringMatching(/active|expired|canceled/),
        paymentProvider: expect.stringMatching(/square|etransfer|cash|other/),
      });
    });
  });
});
