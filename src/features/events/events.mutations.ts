import { createServerFn } from "@tanstack/react-start";
import { and, eq, or, sql } from "drizzle-orm";
import { z } from "zod";
import type { Event as DbEvent, EventRegistration } from "~/db/schema";
import {
  eventPaymentSessions,
  eventRegistrations,
  events,
  teamMembers,
} from "~/db/schema";
import { createEventInputSchema } from "~/db/schema/events.schema";
import { getAuthMiddleware, requireUser } from "~/lib/server/auth";
import { zod$ } from "~/lib/server/fn-utils";
import type {
  EventAmenities,
  EventDivisions,
  EventMetadata,
  EventPaymentMetadata,
  EventRegistrationRoster,
  EventRequirements,
  EventRules,
  EventSchedule,
} from "./events.db-types";
import {
  cancelEventRegistrationSchema,
  createEventSchema,
  markEtransferPaidSchema,
  markEtransferReminderSchema,
  registerForEventSchema,
  updateEventSchema,
} from "./events.schemas";
import type {
  EventOperationResult,
  EventRegistrationResultPayload,
  EventRegistrationWithDetails,
  EventWithDetails,
} from "./events.types";

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
  .middleware(getAuthMiddleware())
  .validator(zod$(z.object({ eventId: z.string().uuid() })))
  .handler(async ({ data, context }): Promise<EventOperationResult<null>> => {
    try {
      // Import server-only modules inside the handler
      const [{ getDb }] = await Promise.all([import("~/db/server-helpers")]);

      const db = await getDb();
      const user = requireUser(context);

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

      if (event.organizerId !== user.id) {
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
  .middleware(getAuthMiddleware())
  .validator(zod$(createEventSchema))
  .handler(async ({ data, context }): Promise<EventOperationResult<EventWithDetails>> => {
    try {
      // Import server-only modules inside the handler
      const [{ getDb }] = await Promise.all([import("~/db/server-helpers")]);

      const db = await getDb();
      const user = requireUser(context);

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
          organizerId: user.id,
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
  .middleware(getAuthMiddleware())
  .validator(zod$(updateEventSchema))
  .handler(async ({ data, context }): Promise<EventOperationResult<EventWithDetails>> => {
    try {
      // Import server-only modules inside the handler
      const [{ getDb }] = await Promise.all([import("~/db/server-helpers")]);

      const db = await getDb();
      const user = requireUser(context);

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

      if (existingEvent.organizerId !== user.id) {
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
type EventRegistrationWithRoster = Omit<
  EventRegistration,
  "roster" | "paymentMetadata"
> & {
  roster: EventRegistrationRoster;
  paymentMetadata: EventPaymentMetadata;
};

// Helper to cast registration jsonb fields
function castRegistrationJsonbFields(
  registration: EventRegistration,
): EventRegistrationWithRoster {
  return {
    ...registration,
    roster: (registration.roster || {}) as EventRegistrationRoster,
    paymentMetadata: (registration.paymentMetadata ?? {}) as EventPaymentMetadata,
  };
}

function calculateRegistrationAmountCents(
  event: DbEvent,
  registrationType: "team" | "individual",
  now: Date,
): number {
  const baseFee =
    registrationType === "team"
      ? (event.teamRegistrationFee ?? 0)
      : (event.individualRegistrationFee ?? 0);

  if (!baseFee || baseFee <= 0) {
    return 0;
  }

  const discountPercentage = event.earlyBirdDiscount ?? 0;
  const deadline = event.earlyBirdDeadline ? new Date(event.earlyBirdDeadline) : null;

  if (discountPercentage > 0 && deadline && now <= deadline) {
    const clampedDiscount = Math.min(100, Math.max(0, discountPercentage));
    const discounted = Math.round(baseFee - (baseFee * clampedDiscount) / 100);
    return Math.max(0, discounted);
  }

  return baseFee;
}

const getSquarePaymentService = async () => {
  const { squarePaymentService } = await import("~/lib/payments/square");
  return squarePaymentService;
};

export const registerForEvent = createServerFn({ method: "POST" })
  .middleware(getAuthMiddleware())
  .validator(zod$(registerForEventSchema))
  .handler(
    async ({
      data,
      context,
    }): Promise<EventOperationResult<EventRegistrationResultPayload>> => {
      try {
        const [{ getDb }] = await Promise.all([import("~/db/server-helpers")]);

        const db = await getDb();
        const user = requireUser(context);

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
        const registrationOpens = event.registrationOpensAt;
        const registrationCloses = event.registrationClosesAt;

        if (registrationOpens && now < registrationOpens) {
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

        if (registrationCloses && now > registrationCloses) {
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

        const paymentMethod = data.paymentMethod ?? "square";
        if (paymentMethod === "etransfer" && !event.allowEtransfer) {
          return {
            success: false,
            errors: [
              {
                code: "FORBIDDEN",
                message: "E-transfer is not available for this event",
              },
            ],
          };
        }

        const registrationType: EventRegistration["registrationType"] = data.teamId
          ? "team"
          : "individual";

        if (event.registrationType === "team" && registrationType !== "team") {
          return {
            success: false,
            errors: [
              {
                code: "FORBIDDEN",
                message: "Only team registrations are allowed for this event",
              },
            ],
          };
        }

        if (
          event.registrationType === "individual" &&
          registrationType !== "individual"
        ) {
          return {
            success: false,
            errors: [
              {
                code: "FORBIDDEN",
                message: "Only individual registrations are allowed for this event",
              },
            ],
          };
        }

        const existingRegistration = await db
          .select()
          .from(eventRegistrations)
          .where(
            and(
              eq(eventRegistrations.eventId, data.eventId),
              or(
                eq(eventRegistrations.userId, user.id),
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

        const registrationCount = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(eventRegistrations)
          .where(
            and(
              eq(eventRegistrations.eventId, data.eventId),
              eq(eventRegistrations.status, "confirmed"),
            ),
          );

        const confirmedCount = registrationCount[0].count;

        if (
          event.registrationType === "team" &&
          event.maxTeams &&
          confirmedCount >= event.maxTeams
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
          confirmedCount >= event.maxParticipants
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

        if (data.teamId) {
          const [membership] = await db
            .select()
            .from(teamMembers)
            .where(
              and(
                eq(teamMembers.teamId, data.teamId),
                eq(teamMembers.userId, user.id),
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

        const amountDueCents = calculateRegistrationAmountCents(
          event,
          registrationType,
          now,
        );

        let paymentStatus: EventRegistration["paymentStatus"] = "pending";
        let amountPaidCents: number | null = null;
        let paymentCompletedAt: Date | null = null;

        if (amountDueCents === 0) {
          paymentStatus = "paid";
          amountPaidCents = 0;
          paymentCompletedAt = now;
        } else if (paymentMethod === "etransfer") {
          paymentStatus = "awaiting_etransfer";
        }

        const paymentMetadata: EventPaymentMetadata | null =
          paymentMethod === "etransfer"
            ? {
                ...(event.etransferInstructions
                  ? { instructionsSnapshot: event.etransferInstructions }
                  : {}),
                ...(event.etransferRecipient
                  ? { recipient: event.etransferRecipient }
                  : {}),
              }
            : null;

        const [registration] = await db
          .insert(eventRegistrations)
          .values({
            eventId: data.eventId,
            userId: user.id,
            teamId: data.teamId,
            registrationType,
            division: data.division,
            notes: data.notes,
            roster: data.roster ? JSON.stringify(data.roster) : null,
            status: amountDueCents === 0 ? "confirmed" : "pending",
            paymentStatus,
            paymentMethod,
            paymentId: null,
            amountDueCents,
            amountPaidCents,
            paymentCompletedAt,
            paymentMetadata,
          })
          .returning();

        let paymentResponse: EventRegistrationResultPayload["payment"];

        if (paymentMethod === "square" && amountDueCents > 0) {
          const squareService = await getSquarePaymentService();
          const checkoutSession = await squareService.createEventCheckoutSession({
            eventId: event.id,
            registrationId: registration.id,
            userId: user.id,
            amount: amountDueCents,
            eventName: event.name,
          });

          await db
            .insert(eventPaymentSessions)
            .values({
              registrationId: registration.id,
              eventId: event.id,
              userId: user.id,
              squareCheckoutId: checkoutSession.id,
              squarePaymentLinkUrl: checkoutSession.checkoutUrl,
              squareOrderId: checkoutSession.orderId ?? null,
              amountCents: amountDueCents,
              currency: checkoutSession.currency,
              metadata: {
                eventName: event.name,
                registrationType,
                paymentMethod,
              },
            })
            .onConflictDoUpdate({
              target: eventPaymentSessions.squareCheckoutId,
              set: {
                registrationId: registration.id,
                eventId: event.id,
                userId: user.id,
                squarePaymentLinkUrl: checkoutSession.checkoutUrl,
                squareOrderId: checkoutSession.orderId ?? null,
                amountCents: amountDueCents,
                currency: checkoutSession.currency,
                metadata: {
                  eventName: event.name,
                  registrationType,
                  paymentMethod,
                },
                updatedAt: new Date(),
              },
            });

          paymentResponse = {
            method: "square",
            checkoutUrl: checkoutSession.checkoutUrl,
            sessionId: checkoutSession.id,
          };
        } else if (amountDueCents === 0) {
          paymentResponse = { method: "free" };
        } else {
          paymentResponse = {
            method: "etransfer",
            instructions: event.etransferInstructions ?? null,
            recipient: event.etransferRecipient ?? null,
          };
        }

        const parsedRegistration = castRegistrationJsonbFields(registration);

        const registrationWithDetails: EventRegistrationWithDetails = {
          ...parsedRegistration,
          event: castEventJsonbFields(event),
          user: {
            id: user.id,
            name: user.name ?? user.email ?? "",
            email: user.email ?? "",
          },
        };

        return {
          success: true,
          data: {
            registration: registrationWithDetails,
            payment: paymentResponse,
          },
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

export const markEventEtransferPaid = createServerFn({ method: "POST" })
  .middleware(getAuthMiddleware())
  .validator(zod$(markEtransferPaidSchema))
  .handler(
    async ({
      data,
      context,
    }): Promise<EventOperationResult<EventRegistrationWithRoster>> => {
      try {
        const [{ getDb }] = await Promise.all([import("~/db/server-helpers")]);

        const db = await getDb();
        const user = requireUser(context);

        const registrationWithEvent = await db
          .select({
            registration: eventRegistrations,
            event: events,
          })
          .from(eventRegistrations)
          .innerJoin(events, eq(eventRegistrations.eventId, events.id))
          .where(eq(eventRegistrations.id, data.registrationId))
          .limit(1);

        if (registrationWithEvent.length === 0) {
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

        const [{ registration, event }] = registrationWithEvent;

        const isOrganizer = event.organizerId === user.id;
        let isGlobalAdmin = false;
        if (!isOrganizer) {
          const { isAdmin } = await import("~/lib/auth/utils/admin-check");
          isGlobalAdmin = await isAdmin(user.id);
        }

        if (!isOrganizer && !isGlobalAdmin) {
          return {
            success: false,
            errors: [
              {
                code: "FORBIDDEN",
                message: "You do not have permission to update this registration",
              },
            ],
          };
        }

        if (registration.paymentMethod !== "etransfer") {
          return {
            success: false,
            errors: [
              {
                code: "VALIDATION_ERROR",
                message: "Only e-transfer registrations can be marked as paid manually",
              },
            ],
          };
        }

        const now = new Date();
        const existingMetadata = (registration.paymentMetadata ||
          {}) as EventPaymentMetadata;
        const updatedMetadata: EventPaymentMetadata = {
          ...existingMetadata,
          markedPaidAt: now.toISOString(),
          markedPaidBy: user.id,
        };

        const [updatedRegistration] = await db
          .update(eventRegistrations)
          .set({
            paymentStatus: "paid",
            status:
              registration.status === "cancelled" ? registration.status : "confirmed",
            paymentCompletedAt: now,
            amountPaidCents: registration.amountDueCents,
            paymentMetadata: updatedMetadata,
            updatedAt: now,
          })
          .where(eq(eventRegistrations.id, data.registrationId))
          .returning();

        return {
          success: true,
          data: castRegistrationJsonbFields(updatedRegistration),
        };
      } catch (error) {
        console.error("Error marking e-transfer as paid:", error);
        return {
          success: false,
          errors: [
            {
              code: "DATABASE_ERROR",
              message: "Failed to update registration",
            },
          ],
        };
      }
    },
  );

export const markEventEtransferReminder = createServerFn({ method: "POST" })
  .middleware(getAuthMiddleware())
  .validator(zod$(markEtransferReminderSchema))
  .handler(
    async ({
      data,
      context,
    }): Promise<EventOperationResult<EventRegistrationWithRoster>> => {
      try {
        const [{ getDb }] = await Promise.all([import("~/db/server-helpers")]);

        const db = await getDb();
        const user = requireUser(context);

        const registrationWithEvent = await db
          .select({
            registration: eventRegistrations,
            event: events,
          })
          .from(eventRegistrations)
          .innerJoin(events, eq(eventRegistrations.eventId, events.id))
          .where(eq(eventRegistrations.id, data.registrationId))
          .limit(1);

        if (registrationWithEvent.length === 0) {
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

        const [{ registration, event }] = registrationWithEvent;

        const isOrganizer = event.organizerId === user.id;
        let isGlobalAdmin = false;
        if (!isOrganizer) {
          const { isAdmin } = await import("~/lib/auth/utils/admin-check");
          isGlobalAdmin = await isAdmin(user.id);
        }

        if (!isOrganizer && !isGlobalAdmin) {
          return {
            success: false,
            errors: [
              {
                code: "FORBIDDEN",
                message: "You do not have permission to update this registration",
              },
            ],
          };
        }

        if (registration.paymentMethod !== "etransfer") {
          return {
            success: false,
            errors: [
              {
                code: "VALIDATION_ERROR",
                message: "Only e-transfer registrations can receive reminders",
              },
            ],
          };
        }

        const now = new Date();
        const existingMetadata = (registration.paymentMetadata ||
          {}) as EventPaymentMetadata;
        const updatedMetadata: EventPaymentMetadata = {
          ...existingMetadata,
          lastReminderAt: now.toISOString(),
          lastReminderBy: user.id,
        };

        const [updatedRegistration] = await db
          .update(eventRegistrations)
          .set({
            paymentMetadata: updatedMetadata,
            updatedAt: now,
          })
          .where(eq(eventRegistrations.id, data.registrationId))
          .returning();

        return {
          success: true,
          data: castRegistrationJsonbFields(updatedRegistration),
        };
      } catch (error) {
        console.error("Error marking e-transfer reminder:", error);
        return {
          success: false,
          errors: [
            {
              code: "DATABASE_ERROR",
              message: "Failed to update registration",
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
  .middleware(getAuthMiddleware())
  .validator(zod$(cancelEventRegistrationSchema))
  .handler(
    async ({
      data,
      context,
    }): Promise<EventOperationResult<EventRegistrationWithRoster>> => {
      try {
        const [{ getDb }] = await Promise.all([import("~/db/server-helpers")]);

        const db = await getDb();
        const user = requireUser(context);

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
        if (registration.userId !== user.id) {
          // Check if user is team captain/coach
          if (registration.teamId) {
            const [membership] = await db
              .select()
              .from(teamMembers)
              .where(
                and(
                  eq(teamMembers.teamId, registration.teamId),
                  eq(teamMembers.userId, user.id),
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
