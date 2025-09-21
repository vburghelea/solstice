import { describe, expect, it } from "vitest";
import { createEventInputSchema } from "~/db/schema/events.schema";

describe("Event Base Schemas", () => {
  describe("createEventInputSchema", () => {
    it("validates complete event input", () => {
      const validInput = {
        name: "Summer Quadball Tournament 2025",
        slug: "summer-quadball-2025",
        description: "Annual summer tournament",
        shortDescription: "Join us for the biggest Quadball event of the summer!",
        type: "tournament",
        venueName: "Toronto Sports Complex",
        venueAddress: "123 Sports Way",
        city: "Toronto",
        province: "ON",
        postalCode: "M5V 3A8",
        startDate: "2025-07-15",
        endDate: "2025-07-17",
        registrationType: "team",
        maxTeams: 16,
        teamRegistrationFee: 20000, // $200 in cents
        individualRegistrationFee: 5000,
        registrationOpensAt: "2025-06-01T00:00:00Z",
        registrationClosesAt: "2025-07-10T23:59:59Z",
        status: "draft",
        visibility: "public",
        rules: {
          format: "Swiss rounds followed by knockout",
          divisions: ["competitive", "recreational"],
        },
        schedule: {
          day1: "Registration and opening ceremony",
          day2: "Pool play",
          day3: "Playoffs and finals",
        },
        amenities: {
          parking: true,
          foodAvailable: true,
          livestream: false,
        },
        allowEtransfer: true,
        etransferRecipient: "payments@example.com",
        etransferInstructions: "Send with answer 'quadball'.",
      };

      const result = createEventInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("validates minimal required fields", () => {
      const minimalInput = {
        name: "Quick Tournament",
        slug: "quick-tournament",
        type: "tournament",
        startDate: "2025-08-01",
        endDate: "2025-08-01",
        registrationType: "individual",
      };

      const result = createEventInputSchema.safeParse(minimalInput);
      expect(result.success).toBe(true);
    });

    it("validates all event types", () => {
      const types = ["tournament", "league", "camp", "clinic", "social", "other"];

      types.forEach((type) => {
        const input = {
          name: `Test ${type}`,
          slug: `test-${type}`,
          type,
          startDate: "2025-08-01",
          endDate: "2025-08-01",
          registrationType: "individual",
        };

        const result = createEventInputSchema.safeParse(input);
        expect(result.success).toBe(true);
      });
    });

    it("validates all registration types", () => {
      const registrationTypes = ["team", "individual", "both"];

      registrationTypes.forEach((registrationType) => {
        const input = {
          name: "Test Event",
          slug: "test-event",
          type: "tournament",
          startDate: "2025-08-01",
          endDate: "2025-08-01",
          registrationType,
        };

        const result = createEventInputSchema.safeParse(input);
        expect(result.success).toBe(true);
      });
    });

    it("fails with invalid slug format", () => {
      const invalidInput = {
        name: "Test Event",
        slug: "Test Event!", // Should be lowercase with hyphens only
        type: "tournament",
        startDate: "2025-08-01",
        endDate: "2025-08-01",
        registrationType: "team",
      };

      const result = createEventInputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain("lowercase with hyphens only");
      }
    });

    it("fails with name too short", () => {
      const invalidInput = {
        name: "Hi", // Min 3 characters
        slug: "hi-event",
        type: "tournament",
        startDate: "2025-08-01",
        endDate: "2025-08-01",
        registrationType: "team",
      };

      const result = createEventInputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it("fails with shortDescription too long", () => {
      const invalidInput = {
        name: "Test Event",
        slug: "test-event",
        shortDescription: "a".repeat(501), // Max 500 characters
        type: "tournament",
        startDate: "2025-08-01",
        endDate: "2025-08-01",
        registrationType: "team",
      };

      const result = createEventInputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it("fails with negative fees", () => {
      const invalidInput = {
        name: "Test Event",
        slug: "test-event",
        type: "tournament",
        startDate: "2025-08-01",
        endDate: "2025-08-01",
        registrationType: "team",
        teamRegistrationFee: -100,
      };

      const result = createEventInputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it("fails with invalid e-transfer email when enabled", () => {
      const invalidInput = {
        name: "Test Event",
        slug: "test-event",
        type: "tournament",
        startDate: "2025-08-01",
        endDate: "2025-08-01",
        registrationType: "team",
        allowEtransfer: true,
        etransferRecipient: "not-an-email",
      };

      const result = createEventInputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it("fails with invalid event type", () => {
      const invalidInput = {
        name: "Test Event",
        slug: "test-event",
        type: "workshop", // Not a valid type
        startDate: "2025-08-01",
        endDate: "2025-08-01",
        registrationType: "individual",
      };

      const result = createEventInputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it("fails without required fields", () => {
      const invalidInput = {
        name: "Test Event",
        slug: "test-event",
        // Missing type, dates, and registrationType
      };

      const result = createEventInputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it("validates with zero fees", () => {
      const validInput = {
        name: "Free Event",
        slug: "free-event",
        type: "social",
        startDate: "2025-08-01",
        endDate: "2025-08-01",
        registrationType: "individual",
        teamRegistrationFee: 0,
        individualRegistrationFee: 0,
      };

      const result = createEventInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });
  });
});
