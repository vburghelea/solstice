import { describe, expect, it } from "vitest";
import {
  createGameInputSchema,
  inviteToGameInputSchema,
  respondToGameInvitationSchema,
} from "../games.schemas";

describe("Game Schemas", () => {
  describe("createGameInputSchema", () => {
    it("should validate a correct game creation input", () => {
      const validInput = {
        gameSystemId: 1,
        name: "My Awesome Game",
        dateTime: new Date().toISOString(),
        description: "A fun game session for everyone.",
        expectedDuration: 2,
        price: 10,
        language: "English",
        location: {
          address: "123 Main St",
          lat: 34.0522,
          lng: -118.2437,
        },
        visibility: "public",
      };
      const result = createGameInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("should fail validation for missing required fields", () => {
      const invalidInput = {
        gameSystemId: 1,
        // name is missing
        dateTime: new Date().toISOString(),
        description: "A fun game session for everyone.",
        expectedDuration: 2,
        price: 10,
        language: "English",
        location: {
          address: "123 Main St",
          lat: 34.0522,
          lng: -118.2437,
        },
        visibility: "public",
      };
      const result = createGameInputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path[0]).toBe("name");
      }
    });

    it("should fail validation for invalid data types", () => {
      const invalidInput = {
        gameSystemId: "invalid", // Should be number
        name: "My Awesome Game",
        dateTime: new Date().toISOString(),
        description: "A fun game session for everyone.",
        expectedDuration: 2,
        price: 10,
        language: "English",
        location: {
          address: "123 Main St",
          lat: 34.0522,
          lng: -118.2437,
        },
        visibility: "public",
      };
      const result = createGameInputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path[0]).toBe("gameSystemId");
      }
    });
  });

  describe("inviteToGameInputSchema", () => {
    it("should validate a correct invitation input with userId", () => {
      const validInput = {
        gameId: "game-123",
        userId: "user-456",
        role: "invited",
      };
      const result = inviteToGameInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("should validate a correct invitation input with email", () => {
      const validInput = {
        gameId: "game-123",
        email: "test@example.com",
        role: "invited",
      };
      const result = inviteToGameInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("should fail validation if neither userId nor email is provided", () => {
      const invalidInput = {
        gameId: "game-123",
        role: "invited",
      };
      const result = inviteToGameInputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Either userId or email must be provided",
        );
      }
    });

    it("should fail validation for invalid email format", () => {
      const invalidInput = {
        gameId: "game-123",
        email: "invalid-email",
        role: "invited",
      };
      const result = inviteToGameInputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path[0]).toBe("email");
      }
    });
  });

  describe("respondToGameInvitationSchema", () => {
    it("should validate a correct response to invitation (accept)", () => {
      const validInput = {
        participantId: "part-123",
        action: "accept",
      };
      const result = respondToGameInvitationSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("should validate a correct response to invitation (reject)", () => {
      const validInput = {
        participantId: "part-123",
        action: "reject",
      };
      const result = respondToGameInvitationSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("should fail validation for missing participantId", () => {
      const invalidInput = {
        action: "accept",
      };
      const result = respondToGameInvitationSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path[0]).toBe("participantId");
      }
    });

    it("should fail validation for invalid action", () => {
      const invalidInput = {
        participantId: "part-123",
        action: "invalid-action",
      };
      const result = respondToGameInvitationSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path[0]).toBe("action");
      }
    });
  });
});
