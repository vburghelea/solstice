import { createServerFn } from "@tanstack/react-start";
import { and, eq, or, sql } from "drizzle-orm";
import { z } from "zod";
import type { Event as DbEvent, EventRegistration } from "~/db/schema";
import { eventRegistrations, events, teamMembers } from "~/db/schema";
import { createEventInputSchema } from "~/db/schema/events.schema";
import type {
  EventAmenities,
  EventDivisions,
  EventMetadata,
  EventRegistrationRoster,
  EventRequirements,
  EventRules,
  EventSchedule,
} from "./events.db-types";
import {
  cancelEventRegistrationSchema,
  createEventSchema,
  registerForEventSchema,
  updateEventSchema,
} from "./events.schemas";
import type { EventOperationResult, EventWithDetails } from "./events.types";

// Helper to cast database event to properly typed event
function castEventJsonbFields(event: DbEvent): EventWithDetails {
  return {
    ...event,
    rules: (event.rules || {}) as EventRules,
    schedule: (event.schedule || {}) as EventSchedule,
    divisions: (event.divisions || {}) as EventDivisions,
    amenities: (event.amenities || {}) as EventAmenities,
    requirements: (event.requirements || {}) as EventRequirements,
    metadata: (event.metadata || {}) as EventMetadata,
  } as EventWithDetails;
}

/**
 * Cancel an event
 */
export const cancelEvent = createServerFn({ method: "POST" })
  .validator(z.object({ eventId: z.string().uuid() }).parse)
  .handler(async ({ data }): Promise<EventOperationResult<null>> => {
    try {
      // Import server-only modules inside the handler
      const [{ getDb }, { getAuth }] = await Promise.all([
        import("~/db/server-helpers"),
        import("~/lib/auth/server-helpers"),
      ]);

      const db = await getDb();
      const auth = await getAuth();
      const { getWebRequest } = await import("@tanstack/react-start/server");
      const { headers } = getWebRequest();
      const session = await auth.api.getSession({ headers });

      if (!session?.user?.id) {
        return {
          success: false,
          errors: [
            {
              code: "UNAUTHORIZED",
              message: "User not authenticated",
            },
          ],
        };
      }

      // Check if user owns the event
      const [event] = await db
        .select({ organizerId: events.organizerId })
        .from(events)
        .where(eq(events.id, data.eventId))
        .limit(1);

      if (!event) {
        return {
          success: false,
          errors: [
            {
              code: "NOT_FOUND",
              message: "Event not found",
            },
          ],
        };
      }

      if (event.organizerId !== session.user.id) {
        return {
          success: false,
          errors: [
            {
              code: "FORBIDDEN",
              message: "You don't have permission to cancel this event",
            },
          ],
        };
      }

      // Update event status to cancelled
      await db
        .update(events)
        .set({
          status: "cancelled",
          updatedAt: new Date(),
        })
        .where(eq(events.id, data.eventId));

      // TODO: Send cancellation emails to registered participants

      return {
        success: true,
        data: null,
      };
    } catch (error) {
      console.error("Error cancelling event:", error);
      return {
        success: false,
        errors: [
          {
            code: "DATABASE_ERROR",
            message: "Failed to cancel event",
          },
        ],
      };
    }
  });

/**
 * Create a new event
 */
export const createEvent = createServerFn({ method: "POST" })
  .validator(createEventSchema.parse)
  .handler(async ({ data }): Promise<EventOperationResult<EventWithDetails>> => {
    try {
      // Import server-only modules inside the handler
      const [{ getDb }, { getAuth }] = await Promise.all([
        import("~/db/server-helpers"),
        import("~/lib/auth/server-helpers"),
      ]);

      const db = await getDb();
      const auth = await getAuth();
      const { getWebRequest } = await import("@tanstack/react-start/server");
      const { headers } = getWebRequest();
      const session = await auth.api.getSession({ headers });

      if (!session?.user?.id) {
        return {
          success: false,
          errors: [
            {
              code: "UNAUTHORIZED",
              message: "User not authenticated",
            },
          ],
        };
      }

      // Validate input
      const validationResult = createEventInputSchema.safeParse(data);
      if (!validationResult.success) {
        return {
          success: false,
          errors: validationResult.error.errors.map((err) => ({
            code: "VALIDATION_ERROR" as const,
            message: err.message,
            field: err.path.join("."),
          })),
        };
      }

      // Check for duplicate slug
      const [existingEvent] = await db
        .select({ id: events.id })
        .from(events)
        .where(eq(events.slug, data.slug))
        .limit(1);

      if (existingEvent) {
        return {
          success: false,
          errors: [
            {
              code: "DUPLICATE_SLUG",
              message: "An event with this slug already exists",
              field: "slug",
            },
          ],
        };
      }

      // Validate dates
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);

      if (startDate > endDate) {
        return {
          success: false,
          errors: [
            {
              code: "INVALID_DATES",
              message: "Start date must be before end date",
            },
          ],
        };
      }

      // Create event
      const [newEvent] = await db
        .insert(events)
        .values({
          ...data,
          organizerId: session.user.id,
          startDate: data.startDate,
          endDate: data.endDate,
        })
        .returning();

      return {
        success: true,
        data: castEventJsonbFields(newEvent),
      };
    } catch (error) {
      console.error("Error creating event:", error);
      return {
        success: false,
        errors: [
          {
            code: "DATABASE_ERROR",
            message: "Failed to create event",
          },
        ],
      };
    }
  });

/**
 * Update an event
 */
export const updateEvent = createServerFn({ method: "POST" })
  .validator(updateEventSchema.parse)
  .handler(async ({ data }): Promise<EventOperationResult<EventWithDetails>> => {
    try {
      // Import server-only modules inside the handler
      const [{ getDb }, { getAuth }] = await Promise.all([
        import("~/db/server-helpers"),
        import("~/lib/auth/server-helpers"),
      ]);

      const db = await getDb();
      const auth = await getAuth();
      const { getWebRequest } = await import("@tanstack/react-start/server");
      const { headers } = getWebRequest();
      const session = await auth.api.getSession({ headers });

      if (!session?.user?.id) {
        return {
          success: false,
          errors: [
            {
              code: "UNAUTHORIZED",
              message: "User not authenticated",
            },
          ],
        };
      }

      // Check if event exists and user is organizer
      const [existingEvent] = await db
        .select()
        .from(events)
        .where(eq(events.id, data.eventId))
        .limit(1);

      if (!existingEvent) {
        return {
          success: false,
          errors: [
            {
              code: "NOT_FOUND",
              message: "Event not found",
            },
          ],
        };
      }

      if (existingEvent.organizerId !== session.user.id) {
        return {
          success: false,
          errors: [
            {
              code: "FORBIDDEN",
              message: "Only the event organizer can update this event",
            },
          ],
        };
      }

      // Check for duplicate slug if updating
      if (data.data.slug && data.data.slug !== existingEvent.slug) {
        const [duplicateEvent] = await db
          .select({ id: events.id })
          .from(events)
          .where(
            and(eq(events.slug, data.data.slug), sql`${events.id} != ${data.eventId}`),
          )
          .limit(1);

        if (duplicateEvent) {
          return {
            success: false,
            errors: [
              {
                code: "DUPLICATE_SLUG",
                message: "An event with this slug already exists",
                field: "slug",
              },
            ],
          };
        }
      }

      // Validate dates if provided
      if (data.data.startDate || data.data.endDate) {
        const startDate = new Date(data.data.startDate || existingEvent.startDate);
        const endDate = new Date(data.data.endDate || existingEvent.endDate);

        if (startDate > endDate) {
          return {
            success: false,
            errors: [
              {
                code: "INVALID_DATES",
                message: "Start date must be before end date",
              },
            ],
          };
        }
      }

      // Update event
      const [updatedEvent] = await db
        .update(events)
        .set({
          ...data.data,
          updatedAt: new Date(),
        })
        .where(eq(events.id, data.eventId))
        .returning();

      return {
        success: true,
        data: castEventJsonbFields(updatedEvent),
      };
    } catch (error) {
      console.error("Error updating event:", error);
      return {
        success: false,
        errors: [
          {
            code: "DATABASE_ERROR",
            message: "Failed to update event",
          },
        ],
      };
    }
  });

/**
 * Register for an event
 */
// Type for EventRegistration with properly typed roster
type EventRegistrationWithRoster = Omit<EventRegistration, "roster"> & {
  roster: EventRegistrationRoster;
};

// Helper to cast registration jsonb fields
function castRegistrationJsonbFields(
  registration: EventRegistration,
): EventRegistrationWithRoster {
  return {
    ...registration,
    roster: (registration.roster || {}) as EventRegistrationRoster,
  };
}

export const registerForEvent = createServerFn({ method: "POST" })
  .validator(registerForEventSchema.parse)
  .handler(
    async ({ data }): Promise<EventOperationResult<EventRegistrationWithRoster>> => {
      try {
        // Import server-only modules inside the handler
        const [{ getDb }, { getAuth }] = await Promise.all([
          import("~/db/server-helpers"),
          import("~/lib/auth/server-helpers"),
        ]);

        const db = await getDb();
        const auth = await getAuth();
        const { getWebRequest } = await import("@tanstack/react-start/server");
        const { headers } = getWebRequest();
        const session = await auth.api.getSession({ headers });

        if (!session?.user?.id) {
          return {
            success: false,
            errors: [
              {
                code: "UNAUTHORIZED",
                message: "User not authenticated",
              },
            ],
          };
        }

        // Get event details
        const [event] = await db
          .select()
          .from(events)
          .where(eq(events.id, data.eventId))
          .limit(1);

        if (!event) {
          return {
            success: false,
            errors: [
              {
                code: "NOT_FOUND",
                message: "Event not found",
              },
            ],
          };
        }

        // Check if registration is open
        if (event.status !== "registration_open") {
          return {
            success: false,
            errors: [
              {
                code: "REGISTRATION_CLOSED",
                message: "Registration is not open for this event",
              },
            ],
          };
        }

        const now = new Date();
        if (event.registrationOpensAt && now < event.registrationOpensAt) {
          return {
            success: false,
            errors: [
              {
                code: "REGISTRATION_CLOSED",
                message: "Registration has not opened yet",
              },
            ],
          };
        }

        if (event.registrationClosesAt && now > event.registrationClosesAt) {
          return {
            success: false,
            errors: [
              {
                code: "REGISTRATION_CLOSED",
                message: "Registration has closed",
              },
            ],
          };
        }

        // Check if already registered
        const existingRegistration = await db
          .select()
          .from(eventRegistrations)
          .where(
            and(
              eq(eventRegistrations.eventId, data.eventId),
              or(
                eq(eventRegistrations.userId, session.user.id),
                data.teamId ? eq(eventRegistrations.teamId, data.teamId) : undefined,
              ),
              eq(eventRegistrations.status, "confirmed"),
            ),
          )
          .limit(1);

        if (existingRegistration.length > 0) {
          return {
            success: false,
            errors: [
              {
                code: "ALREADY_REGISTERED",
                message: "You or your team are already registered for this event",
              },
            ],
          };
        }

        // Check capacity
        const registrationCount = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(eventRegistrations)
          .where(
            and(
              eq(eventRegistrations.eventId, data.eventId),
              eq(eventRegistrations.status, "confirmed"),
            ),
          );

        const currentCount = registrationCount[0].count;

        if (
          event.registrationType === "team" &&
          event.maxTeams &&
          currentCount >= event.maxTeams
        ) {
          return {
            success: false,
            errors: [
              {
                code: "EVENT_FULL",
                message: "This event is full",
              },
            ],
          };
        }

        if (
          event.registrationType === "individual" &&
          event.maxParticipants &&
          currentCount >= event.maxParticipants
        ) {
          return {
            success: false,
            errors: [
              {
                code: "EVENT_FULL",
                message: "This event is full",
              },
            ],
          };
        }

        // If team registration, verify user is team member
        if (data.teamId) {
          const [membership] = await db
            .select()
            .from(teamMembers)
            .where(
              and(
                eq(teamMembers.teamId, data.teamId),
                eq(teamMembers.userId, session.user.id),
                eq(teamMembers.status, "active"),
              ),
            )
            .limit(1);

          if (!membership) {
            return {
              success: false,
              errors: [
                {
                  code: "FORBIDDEN",
                  message: "You must be an active member of the team to register",
                },
              ],
            };
          }

          // Only captains and coaches can register teams
          if (membership.role !== "captain" && membership.role !== "coach") {
            return {
              success: false,
              errors: [
                {
                  code: "FORBIDDEN",
                  message:
                    "Only team captains and coaches can register the team for events",
                },
              ],
            };
          }
        }

        // Create registration
        const [registration] = await db
          .insert(eventRegistrations)
          .values({
            eventId: data.eventId,
            userId: session.user.id,
            teamId: data.teamId,
            registrationType: data.teamId ? "team" : "individual",
            division: data.division,
            notes: data.notes,
            roster: data.roster ? JSON.stringify(data.roster) : null,
            status: "pending", // Will be confirmed after payment
            paymentStatus: "pending",
          })
          .returning();

        return {
          success: true,
          data: castRegistrationJsonbFields(registration),
        };
      } catch (error) {
        console.error("Error registering for event:", error);
        return {
          success: false,
          errors: [
            {
              code: "DATABASE_ERROR",
              message: "Failed to register for event",
            },
          ],
        };
      }
    },
  );

/**
 * Cancel event registration
 */
export const cancelEventRegistration = createServerFn({ method: "POST" })
  .validator(cancelEventRegistrationSchema.parse)
  .handler(
    async ({ data }): Promise<EventOperationResult<EventRegistrationWithRoster>> => {
      try {
        // Import server-only modules inside the handler
        const [{ getDb }, { getAuth }] = await Promise.all([
          import("~/db/server-helpers"),
          import("~/lib/auth/server-helpers"),
        ]);

        const db = await getDb();
        const auth = await getAuth();
        const { getWebRequest } = await import("@tanstack/react-start/server");
        const { headers } = getWebRequest();
        const session = await auth.api.getSession({ headers });

        if (!session?.user?.id) {
          return {
            success: false,
            errors: [
              {
                code: "UNAUTHORIZED",
                message: "User not authenticated",
              },
            ],
          };
        }

        // Get registration
        const [registration] = await db
          .select()
          .from(eventRegistrations)
          .where(eq(eventRegistrations.id, data.registrationId))
          .limit(1);

        if (!registration) {
          return {
            success: false,
            errors: [
              {
                code: "NOT_FOUND",
                message: "Registration not found",
              },
            ],
          };
        }

        // Check if user can cancel
        if (registration.userId !== session.user.id) {
          // Check if user is team captain/coach
          if (registration.teamId) {
            const [membership] = await db
              .select()
              .from(teamMembers)
              .where(
                and(
                  eq(teamMembers.teamId, registration.teamId),
                  eq(teamMembers.userId, session.user.id),
                  eq(teamMembers.status, "active"),
                ),
              )
              .limit(1);

            if (
              !membership ||
              (membership.role !== "captain" && membership.role !== "coach")
            ) {
              return {
                success: false,
                errors: [
                  {
                    code: "FORBIDDEN",
                    message:
                      "Only the registrant or team leaders can cancel this registration",
                  },
                ],
              };
            }
          } else {
            return {
              success: false,
              errors: [
                {
                  code: "FORBIDDEN",
                  message: "You can only cancel your own registration",
                },
              ],
            };
          }
        }

        // Update registration
        const [cancelledRegistration] = await db
          .update(eventRegistrations)
          .set({
            status: "cancelled",
            cancelledAt: new Date(),
            internalNotes: data.reason,
            updatedAt: new Date(),
          })
          .where(eq(eventRegistrations.id, data.registrationId))
          .returning();

        return {
          success: true,
          data: castRegistrationJsonbFields(cancelledRegistration),
        };
      } catch (error) {
        console.error("Error cancelling registration:", error);
        return {
          success: false,
          errors: [
            {
              code: "DATABASE_ERROR",
              message: "Failed to cancel registration",
            },
          ],
        };
      }
    },
  );
