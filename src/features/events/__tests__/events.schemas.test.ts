import { describe, expect, it } from "vitest";
import {
  cancelEventRegistrationSchema,
  checkEventRegistrationSchema,
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
            city: "Toronto",
            province: "ON",
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
            city: "Vancouver",
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

      it("fails with limit over 10", () => {
        const result = getUpcomingEventsSchema.safeParse({
          limit: 11,
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
      it("validates with event ID only", () => {
        const result = checkEventRegistrationSchema.safeParse({
          eventId: "event-123",
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

      it("fails without event ID", () => {
        const result = checkEventRegistrationSchema.safeParse({
          teamId: "team-789",
        });
        expect(result.success).toBe(false);
      });

      it("fails with empty object", () => {
        const result = checkEventRegistrationSchema.safeParse({});
        expect(result.success).toBe(false);
      });
    });
  });

  describe("Mutation Schemas", () => {
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
            status: "cancelled",
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
          "cancelled",
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
