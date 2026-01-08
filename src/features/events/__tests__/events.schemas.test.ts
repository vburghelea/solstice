import { describe, expect, it } from "vitest";
import {
  cancelEventRegistrationSchema,
  checkEventRegistrationSchema,
  createEventSchema,
  getEventSchema,
  getUpcomingEventsSchema,
  listEventsSchema,
  registerForEventSchema,
  updateEventSchema,
} from "../events.schemas";

describe("Events Schemas", () => {
  describe("Query Schemas", () => {
    describe("listEventsSchema", () => {
      it("validates with all filters", () => {
        const result = listEventsSchema.safeParse({
          filters: {
            status: ["registration_open", "published"],
            type: "tournament",
            organizerId: "org-123",
            startDateFrom: new Date("2025-01-01"),
            startDateTo: new Date("2025-12-31"),
            city: "München",
            country: "DEU",
            featured: true,
            publicOnly: true,
          },
          page: 1,
          pageSize: 20,
          sortBy: "startDate",
          sortOrder: "asc",
        });
        expect(result.success).toBe(true);
      });

      it("validates with empty input (uses defaults)", () => {
        const result = listEventsSchema.safeParse(undefined);
        expect(result.success).toBe(true);
        expect(result.data).toEqual({});
      });

      it("validates with partial filters", () => {
        const result = listEventsSchema.safeParse({
          filters: {
            type: ["tournament", "league"],
            city: "München",
          },
          sortBy: "name",
        });
        expect(result.success).toBe(true);
      });

      it("validates status as string or array", () => {
        const stringResult = listEventsSchema.safeParse({
          filters: { status: "published" },
        });
        expect(stringResult.success).toBe(true);

        const arrayResult = listEventsSchema.safeParse({
          filters: { status: ["published", "registration_open"] },
        });
        expect(arrayResult.success).toBe(true);
      });

      it("fails with invalid sortBy", () => {
        const result = listEventsSchema.safeParse({
          sortBy: "invalid",
        });
        expect(result.success).toBe(false);
      });

      it("fails with negative page number", () => {
        const result = listEventsSchema.safeParse({
          page: -1,
        });
        expect(result.success).toBe(false);
      });
    });

    describe("getEventSchema", () => {
      it("validates with ID", () => {
        const result = getEventSchema.safeParse({
          id: "event-123",
        });
        expect(result.success).toBe(true);
      });

      it("validates with slug", () => {
        const result = getEventSchema.safeParse({
          slug: "summer-tournament-2025",
        });
        expect(result.success).toBe(true);
      });

      it("validates with both ID and slug", () => {
        const result = getEventSchema.safeParse({
          id: "event-123",
          slug: "summer-tournament-2025",
        });
        expect(result.success).toBe(true);
      });

      it("validates with empty object", () => {
        const result = getEventSchema.safeParse({});
        expect(result.success).toBe(true);
      });
    });

    describe("getUpcomingEventsSchema", () => {
      it("validates with limit", () => {
        const result = getUpcomingEventsSchema.safeParse({
          limit: 5,
        });
        expect(result.success).toBe(true);
      });

      it("validates without input (uses defaults)", () => {
        const result = getUpcomingEventsSchema.safeParse(undefined);
        expect(result.success).toBe(true);
        expect(result.data).toEqual({});
      });

      it("fails with limit over 50", () => {
        const result = getUpcomingEventsSchema.safeParse({
          limit: 51,
        });
        expect(result.success).toBe(false);
      });

      it("fails with negative limit", () => {
        const result = getUpcomingEventsSchema.safeParse({
          limit: -1,
        });
        expect(result.success).toBe(false);
      });
    });

    describe("checkEventRegistrationSchema", () => {
      it("validates with event and user ID", () => {
        const result = checkEventRegistrationSchema.safeParse({
          eventId: "event-123",
          userId: "user-456",
        });
        expect(result.success).toBe(true);
      });

      it("validates with event and team ID", () => {
        const result = checkEventRegistrationSchema.safeParse({
          eventId: "event-123",
          teamId: "team-789",
        });
        expect(result.success).toBe(true);
      });

      it("validates with all IDs", () => {
        const result = checkEventRegistrationSchema.safeParse({
          eventId: "event-123",
          userId: "user-456",
          teamId: "team-789",
        });
        expect(result.success).toBe(true);
      });

      it("validates with only event ID", () => {
        const result = checkEventRegistrationSchema.safeParse({
          eventId: "event-123",
        });
        expect(result.success).toBe(true);
      });

      it("fails without event ID", () => {
        const result = checkEventRegistrationSchema.safeParse({
          userId: "user-456",
        });
        expect(result.success).toBe(false);
      });
    });
  });

  describe("Mutation Schemas", () => {
    describe("createEventSchema", () => {
      it("validates complete event input", () => {
        const validInput = {
          name: "Summer Tournament 2025",
          slug: "summer-games-2025",
          description: "Annual summer tournament",
          shortDescription: "Join us for the biggest event of the summer!",
          type: "tournament",
          status: "published",
          venueName: "Sports Complex",
          venueAddress: "123 Sports Way",
          city: "München",
          country: "DEU",
          postalCode: "80331",
          startDate: "2025-07-15",
          endDate: "2025-07-17",
          registrationType: "team",
          maxTeams: 16,
          minPlayersPerTeam: 9,
          maxPlayersPerTeam: 18,
          teamRegistrationFee: 20000,
          individualRegistrationFee: 5000,
          registrationOpensAt: "2025-06-01T00:00:00Z",
          registrationClosesAt: "2025-07-10T23:59:59Z",
          logoUrl: "https://cdn.example.com/logo.png",
          bannerUrl: "https://cdn.example.com/banner.jpg",
          isPublic: true,
          isFeatured: true,
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
          etransferInstructions: "",
        };

        const result = createEventSchema.safeParse(validInput);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.status).toBe("published");
          expect(result.data.isPublic).toBe(true);
          expect(result.data.isFeatured).toBe(true);
          expect(result.data.logoUrl).toBe("https://cdn.example.com/logo.png");
          expect(result.data.bannerUrl).toBe("https://cdn.example.com/banner.jpg");
          expect(result.data.minPlayersPerTeam).toBe(9);
          expect(result.data.maxPlayersPerTeam).toBe(18);
        }
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

        const result = createEventSchema.safeParse(minimalInput);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.status).toBe("draft");
          expect(result.data.isPublic).toBe(false);
          expect(result.data.isFeatured).toBe(false);
        }
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

          const result = createEventSchema.safeParse(input);
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

          const result = createEventSchema.safeParse(input);
          expect(result.success).toBe(true);
        });
      });

      it("fails with invalid slug format", () => {
        const invalidInput = {
          name: "Test Event",
          slug: "Test Event!",
          type: "tournament",
          startDate: "2025-08-01",
          endDate: "2025-08-01",
          registrationType: "team",
        };

        const result = createEventSchema.safeParse(invalidInput);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain("lowercase with hyphens only");
        }
      });

      it("fails with name too short", () => {
        const invalidInput = {
          name: "Hi",
          slug: "hi-event",
          type: "tournament",
          startDate: "2025-08-01",
          endDate: "2025-08-01",
          registrationType: "team",
        };

        const result = createEventSchema.safeParse(invalidInput);
        expect(result.success).toBe(false);
      });

      it("fails with shortDescription too long", () => {
        const invalidInput = {
          name: "Test Event",
          slug: "test-event",
          shortDescription: "a".repeat(501),
          type: "tournament",
          startDate: "2025-08-01",
          endDate: "2025-08-01",
          registrationType: "team",
        };

        const result = createEventSchema.safeParse(invalidInput);
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

        const result = createEventSchema.safeParse(invalidInput);
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

        const result = createEventSchema.safeParse(invalidInput);
        expect(result.success).toBe(false);
      });

      it("fails with invalid event type", () => {
        const invalidInput = {
          name: "Test Event",
          slug: "test-event",
          type: "workshop",
          startDate: "2025-08-01",
          endDate: "2025-08-01",
          registrationType: "individual",
        };

        const result = createEventSchema.safeParse(invalidInput);
        expect(result.success).toBe(false);
      });

      it("fails without required fields", () => {
        const invalidInput = {
          name: "Test Event",
          slug: "test-event",
        };

        const result = createEventSchema.safeParse(invalidInput);
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

        const result = createEventSchema.safeParse(validInput);
        expect(result.success).toBe(true);
      });
    });

    describe("updateEventSchema", () => {
      it("validates with partial update data", () => {
        const result = updateEventSchema.safeParse({
          eventId: "event-123",
          data: {
            name: "Updated Tournament Name",
            status: "registration_open",
            maxTeams: 16,
          },
        });
        expect(result.success).toBe(true);
      });

      it("validates with status update only", () => {
        const result = updateEventSchema.safeParse({
          eventId: "event-123",
          data: {
            status: "canceled",
          },
        });
        expect(result.success).toBe(true);
      });

      it("validates all status values", () => {
        const statuses = [
          "draft",
          "published",
          "registration_open",
          "registration_closed",
          "in_progress",
          "completed",
          "canceled",
        ];

        statuses.forEach((status) => {
          const result = updateEventSchema.safeParse({
            eventId: "event-123",
            data: { status },
          });
          expect(result.success).toBe(true);
        });
      });

      it("validates with empty data", () => {
        const result = updateEventSchema.safeParse({
          eventId: "event-123",
          data: {},
        });
        expect(result.success).toBe(true);
      });

      it("fails without event ID", () => {
        const result = updateEventSchema.safeParse({
          data: {
            name: "Updated Name",
          },
        });
        expect(result.success).toBe(false);
      });
    });

    describe("registerForEventSchema", () => {
      it("validates team registration with roster", () => {
        const result = registerForEventSchema.safeParse({
          eventId: "event-123",
          teamId: "team-456",
          division: "competitive",
          notes: "Looking forward to the tournament",
          roster: [
            { userId: "user-1", role: "captain" },
            { userId: "user-2", role: "player" },
            { userId: "user-3", role: "player" },
          ],
        });
        expect(result.success).toBe(true);
      });

      it("validates individual registration", () => {
        const result = registerForEventSchema.safeParse({
          eventId: "event-123",
          division: "recreational",
          notes: "First time participating",
        });
        expect(result.success).toBe(true);
      });

      it("validates minimal registration", () => {
        const result = registerForEventSchema.safeParse({
          eventId: "event-123",
        });
        expect(result.success).toBe(true);
      });

      it("fails without event ID", () => {
        const result = registerForEventSchema.safeParse({
          teamId: "team-456",
          division: "competitive",
        });
        expect(result.success).toBe(false);
      });

      it("validates roster with multiple players", () => {
        const result = registerForEventSchema.safeParse({
          eventId: "event-123",
          teamId: "team-456",
          roster: Array.from({ length: 10 }, (_, i) => ({
            userId: `user-${i}`,
            role: i === 0 ? "captain" : "player",
          })),
        });
        expect(result.success).toBe(true);
        expect(result.data?.roster).toHaveLength(10);
      });
    });

    describe("cancelEventRegistrationSchema", () => {
      it("validates with reason", () => {
        const result = cancelEventRegistrationSchema.safeParse({
          registrationId: "reg-123",
          reason: "Team unable to attend due to scheduling conflict",
        });
        expect(result.success).toBe(true);
      });

      it("validates without reason", () => {
        const result = cancelEventRegistrationSchema.safeParse({
          registrationId: "reg-123",
        });
        expect(result.success).toBe(true);
      });

      it("validates with empty reason", () => {
        const result = cancelEventRegistrationSchema.safeParse({
          registrationId: "reg-123",
          reason: "",
        });
        expect(result.success).toBe(true);
      });

      it("fails without registration ID", () => {
        const result = cancelEventRegistrationSchema.safeParse({
          reason: "Cannot attend",
        });
        expect(result.success).toBe(false);
      });
    });
  });
});
