import { describe, expect, it } from "vitest";
import {
  createCampaignInputSchema,
  inviteToCampaignInputSchema,
  respondToCampaignApplicationSchema,
  searchUsersForInvitationSchema,
} from "../campaigns.schemas";

describe("Campaign Schemas", () => {
  describe("createCampaignInputSchema", () => {
    it("should validate a correct campaign creation input", () => {
      const validInput = {
        gameSystemId: 1,
        ownerId: "user-1",
        name: "My Awesome Campaign",
        description: "A fun campaign for everyone.",
        recurrence: "weekly",
        timeOfDay: "evenings",
        sessionDuration: 120,
        language: "English",
        visibility: "public",
      };
      const result = createCampaignInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("should fail validation for missing required fields", () => {
      const invalidInput = {
        description: "A fun campaign for everyone.",
        recurrence: "weekly",
        timeOfDay: "evenings",
        sessionDuration: 120,
        language: "English",
        visibility: "public",
      };
      const result = createCampaignInputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path[0]).toBe("name");
      }
    });
  });

  describe("inviteToCampaignInputSchema", () => {
    it("should validate a correct invitation input with userId", () => {
      const validInput = {
        campaignId: "campaign-123",
        userId: "user-456",
      };
      const result = inviteToCampaignInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("should validate a correct invitation input with email", () => {
      const validInput = {
        campaignId: "campaign-123",
        email: "test@example.com",
      };
      const result = inviteToCampaignInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("should fail validation if neither userId nor email is provided", () => {
      const invalidInput = {
        campaignId: "campaign-123",
      };
      const result = inviteToCampaignInputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Either userId or email must be provided",
        );
      }
    });
  });

  describe("respondToCampaignApplicationSchema", () => {
    it("should validate a correct search query", () => {
      const validInput = {
        query: "test",
      };
      const result = searchUsersForInvitationSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("should fail validation for an empty search query", () => {
      const invalidInput = {
        query: "",
      };
      const result = searchUsersForInvitationSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Search query cannot be empty");
      }
    });
  });

  describe("searchUsersForInvitationSchema", () => {
    it("should validate a correct response to application (approved)", () => {
      const validInput = {
        applicationId: "app-123",
        status: "approved",
      };
      const result = respondToCampaignApplicationSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("should validate a correct response to application (rejected)", () => {
      const validInput = {
        applicationId: "app-123",
        status: "rejected",
      };
      const result = respondToCampaignApplicationSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("should fail validation for missing applicationId", () => {
      const invalidInput = {
        status: "approved",
      };
      const result = respondToCampaignApplicationSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path[0]).toBe("applicationId");
      }
    });

    it("should fail validation for invalid status", () => {
      const invalidInput = {
        applicationId: "app-123",
        status: "invalid-status",
      };
      const result = respondToCampaignApplicationSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path[0]).toBe("status");
      }
    });
  });
});
