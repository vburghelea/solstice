import { createServerFn } from "@tanstack/react-start";
import { and, eq, inArray, or, sql } from "drizzle-orm";
import type { EventRegistration, NewCheckoutItem } from "~/db/schema";
import {
  checkoutItems,
  checkoutSessions,
  eventRegistrations,
  events,
  membershipPurchases,
  membershipTypes,
  registrationGroupMembers,
  registrationGroups,
  registrationInvites,
  teamMembers,
  user as userTable,
} from "~/db/schema";
import { createEventInputSchema } from "~/db/schema/events.schema";
import { atomicJsonbMerge } from "~/lib/db/jsonb-utils";
import { getAuthMiddleware, requireUser } from "~/lib/server/auth";
import { zod$ } from "~/lib/server/fn-utils";
import { assertFeatureEnabled } from "~/tenant/feature-gates";
import type { EventPaymentMetadata } from "./events.db-types";
import {
  cancelEntireEventSchema,
  cancelEventRegistrationSchema,
  createEventSchema,
  markEtransferPaidSchema,
  markEtransferReminderSchema,
  registerForEventSchema,
  updateEventSchema,
} from "./events.schemas";
import type {
  CancelEventResult,
  EventOperationResult,
  EventRegistrationResultPayload,
  EventRegistrationWithDetails,
  EventWithDetails,
} from "./events.types";
import type { RegistrationGroupMemberRole } from "./registration-groups.types";
import {
  generateRegistrationInviteToken,
  hashRegistrationInviteToken,
  normalizeInviteEmail,
  resolveInviteExpiry,
} from "./registration-groups.utils";
import type { EventRegistrationWithRoster } from "./utils";
import {
  appendCancellationNote,
  buildEtransferSnapshot,
  calculateRegistrationAmountCents,
  castEventJsonbFields,
  castRegistrationJsonbFields,
  currentTimestamp,
  getClockFromContext,
  isoTimestamp,
  markEtransferPaidMetadata,
  markEtransferReminderMetadata,
} from "./utils";

/**
 * Cancel an entire event and cascade updates to registrations & payments.
 */
export const cancelEvent = createServerFn({ method: "POST" })
  .middleware(getAuthMiddleware())
  .inputValidator(zod$(cancelEntireEventSchema))
  .handler(
    async ({ data, context }): Promise<EventOperationResult<CancelEventResult>> => {
      await assertFeatureEnabled("events");
      const clock = getClockFromContext(context);
      const now = currentTimestamp(clock);
      const nowIso = isoTimestamp(clock);

      try {
        const [{ getDb }] = await Promise.all([import("~/db/server-helpers")]);
        const db = await getDb();
        const user = requireUser(context);

        const [eventRecord] = await db
          .select()
          .from(events)
          .where(eq(events.id, data.eventId))
          .limit(1);

        if (!eventRecord) {
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

        let authorized = eventRecord.organizerId === user.id;
        if (!authorized) {
          const { isAdmin } = await import("~/lib/auth/utils/admin-check");
          authorized = await isAdmin(user.id);
        }

        if (!authorized) {
          return {
            success: false,
            errors: [
              {
                code: "FORBIDDEN",
                message: "You cannot cancel this event",
              },
            ],
          };
        }

        await db
          .update(events)
          .set({
            status: "cancelled",
            updatedAt: now,
            metadata: atomicJsonbMerge(events.metadata, {
              cancelledAt: nowIso,
              cancelledBy: user.id,
              cancellationReason: data.reason ?? null,
            }),
          })
          .where(eq(events.id, data.eventId));

        const registrations = await db
          .select()
          .from(eventRegistrations)
          .where(eq(eventRegistrations.eventId, data.eventId));

        const registrationIds = registrations.map((registration) => registration.id);
        const checkoutItemsWithSessions =
          registrationIds.length > 0
            ? await db
                .select({
                  item: checkoutItems,
                  session: checkoutSessions,
                })
                .from(checkoutItems)
                .innerJoin(
                  checkoutSessions,
                  eq(checkoutItems.checkoutSessionId, checkoutSessions.id),
                )
                .where(inArray(checkoutItems.eventRegistrationId, registrationIds))
            : [];

        const latestSessionByRegistration = new Map<
          string,
          {
            item: (typeof checkoutItemsWithSessions)[number]["item"];
            session: (typeof checkoutItemsWithSessions)[number]["session"];
          }
        >();
        for (const row of checkoutItemsWithSessions) {
          if (!row.item.eventRegistrationId) continue;
          const current = latestSessionByRegistration.get(row.item.eventRegistrationId);
          if (
            !current ||
            (row.session.createdAt ?? now) > (current.session.createdAt ?? now)
          ) {
            latestSessionByRegistration.set(row.item.eventRegistrationId, row);
          }
        }

        const result: CancelEventResult = {
          eventId: data.eventId,
          affected: {
            totalRegistrations: registrations.length,
            cancelled: 0,
            alreadyCancelled: 0,
            squareRefunded: 0,
            etransferMarkedForRefund: 0,
            freeOrUnpaid: 0,
          },
          errors: [],
        };

        const squareService =
          data.refundMode === "auto" ? await getSquarePaymentService() : null;

        for (const registration of registrations) {
          if (registration.status === "cancelled") {
            result.affected.alreadyCancelled += 1;
            continue;
          }

          const existingMetadata = (registration.paymentMetadata ??
            {}) as EventPaymentMetadata;
          const noteParts = [`Event cancelled by ${user.id} at ${nowIso}`];
          if (data.reason) {
            noteParts.push(`Reason: ${data.reason}`);
          }
          const cancellationNote = noteParts.join(" — ");

          const paymentMetadata = appendCancellationNote(
            existingMetadata,
            cancellationNote,
          );
          const existingNotes = registration.internalNotes ?? "";
          const hasNoteAlready = existingNotes.split("\n").includes(cancellationNote);
          const internalNotes = hasNoteAlready
            ? existingNotes
            : [cancellationNote, existingNotes].filter(Boolean).join("\n");

          const baseUpdate: Partial<typeof eventRegistrations.$inferInsert> = {
            status: "cancelled",
            cancelledAt: now,
            updatedAt: now,
            internalNotes,
            paymentMetadata,
          };

          let finalPaymentStatus = registration.paymentStatus;
          let sessionUpdated = false;
          const checkoutEntry = latestSessionByRegistration.get(registration.id);
          const amountPaid = registration.amountPaidCents ?? 0;
          const amountDue = registration.amountDueCents ?? 0;
          const amountToRefund = amountPaid > 0 ? amountPaid : amountDue;

          if (registration.paymentMethod === "square" && amountToRefund > 0) {
            if (data.refundMode === "none") {
              result.affected.freeOrUnpaid += 1;
            } else if (!squareService || data.refundMode === "manual") {
              finalPaymentStatus = "refund_required";
              result.affected.etransferMarkedForRefund += 1;
            } else {
              let paymentId = checkoutEntry?.session.providerPaymentId ?? null;

              if (!paymentId && checkoutEntry?.session.providerCheckoutId) {
                const verification = await squareService.verifyPayment(
                  checkoutEntry.session.providerCheckoutId,
                );
                if (verification.success && verification.paymentId) {
                  paymentId = verification.paymentId;
                  await db
                    .update(checkoutSessions)
                    .set({
                      providerPaymentId: paymentId,
                      updatedAt: now,
                    })
                    .where(eq(checkoutSessions.id, checkoutEntry.session.id));
                }
              }

              if (!paymentId) {
                finalPaymentStatus = "refund_required";
                result.affected.etransferMarkedForRefund += 1;
                result.errors.push({
                  registrationId: registration.id,
                  code: "NO_PAYMENT_SESSION",
                  message:
                    "Square payment could not be resolved; flagged for manual refund.",
                });
              } else {
                try {
                  const refund = await squareService.createRefund(
                    paymentId,
                    amountToRefund,
                    "Event cancelled",
                  );

                  if (refund.success) {
                    finalPaymentStatus = "refunded";
                    result.affected.squareRefunded += 1;
                    if (checkoutEntry) {
                      await db
                        .update(checkoutSessions)
                        .set({
                          status: "refunded",
                          metadata: atomicJsonbMerge(checkoutSessions.metadata, {
                            refundedAt: nowIso,
                            refundId: refund.refundId ?? null,
                            cancelledBy: user.id,
                          }),
                          updatedAt: now,
                        })
                        .where(eq(checkoutSessions.id, checkoutEntry.session.id));
                      sessionUpdated = true;
                    }
                  } else {
                    finalPaymentStatus = "refund_required";
                    result.affected.etransferMarkedForRefund += 1;
                    result.errors.push({
                      registrationId: registration.id,
                      code: "REFUND_FAILED",
                      message: refund.error ?? "Square refund failed",
                      paymentId,
                    });
                  }
                } catch (refundError) {
                  finalPaymentStatus = "refund_required";
                  result.affected.etransferMarkedForRefund += 1;
                  result.errors.push({
                    registrationId: registration.id,
                    code: "REFUND_FAILED",
                    message:
                      refundError instanceof Error
                        ? refundError.message
                        : "Square refund threw an unexpected error",
                    paymentId,
                  });
                }
              }
            }
          } else if (registration.paymentMethod === "etransfer" && amountToRefund > 0) {
            finalPaymentStatus = "refund_required";
            result.affected.etransferMarkedForRefund += 1;
          } else {
            result.affected.freeOrUnpaid += 1;
          }

          const update = {
            ...baseUpdate,
            paymentStatus: finalPaymentStatus,
          } satisfies Partial<typeof eventRegistrations.$inferInsert>;

          await db
            .update(eventRegistrations)
            .set(update)
            .where(eq(eventRegistrations.id, registration.id));

          if (checkoutEntry && !sessionUpdated) {
            await db
              .update(checkoutSessions)
              .set({
                status: "cancelled",
                metadata: atomicJsonbMerge(checkoutSessions.metadata, {
                  cancelledAt: nowIso,
                  cancelledBy: user.id,
                }),
                updatedAt: now,
              })
              .where(eq(checkoutSessions.id, checkoutEntry.session.id));
          }

          result.affected.cancelled += 1;
        }

        if (data.notify !== false) {
          try {
            const { sendEventCancellationNotifications } =
              await import("~/lib/server/notifications/events/cancellation");
            await sendEventCancellationNotifications({
              db,
              event: eventRecord,
              ...(data.reason ? { reason: data.reason } : {}),
            });
          } catch (notificationError) {
            console.warn("Failed to send cancellation notifications:", notificationError);
          }
        }

        return {
          success: true,
          data: result,
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
    },
  );

/**
 * Create a new event
 */
export const createEvent = createServerFn({ method: "POST" })
  .middleware(getAuthMiddleware())
  .inputValidator(zod$(createEventSchema))
  .handler(async ({ data, context }): Promise<EventOperationResult<EventWithDetails>> => {
    await assertFeatureEnabled("events");
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
          errors: validationResult.error.issues.map((issue) => ({
            code: "VALIDATION_ERROR" as const,
            message: issue.message,
            field: issue.path.join("."),
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
  .inputValidator(zod$(updateEventSchema))
  .handler(async ({ data, context }): Promise<EventOperationResult<EventWithDetails>> => {
    await assertFeatureEnabled("events");
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

      // Check if user is organizer or admin
      const { isAdmin } = await import("~/lib/auth/utils/admin-check");
      const userIsAdmin = await isAdmin(user.id);

      if (existingEvent.organizerId !== user.id && !userIsAdmin) {
        return {
          success: false,
          errors: [
            {
              code: "FORBIDDEN",
              message: "Only the event organizer or an admin can update this event",
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

const getSquarePaymentService = async () => {
  const { getSquarePaymentService: loadSquareService } =
    await import("~/lib/payments/square");
  return loadSquareService();
};

/**
 * Register for an event
 */
export const registerForEvent = createServerFn({ method: "POST" })
  .middleware(getAuthMiddleware())
  .inputValidator(zod$(registerForEventSchema))
  .handler(
    async ({
      data,
      context,
    }): Promise<EventOperationResult<EventRegistrationResultPayload>> => {
      await assertFeatureEnabled("events");
      try {
        const [{ getDb }] = await Promise.all([import("~/db/server-helpers")]);

        const db = await getDb();
        const user = requireUser(context);
        const clock = getClockFromContext(context);

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

        const now = currentTimestamp(clock);
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

        const requestedGroupType =
          data.groupType ?? (data.teamId ? "team" : "individual");
        const registrationType: EventRegistration["registrationType"] =
          requestedGroupType === "team" || requestedGroupType === "relay"
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

        if (registrationType === "team" && !data.teamId) {
          return {
            success: false,
            errors: [
              {
                code: "FORBIDDEN",
                message: "A team selection is required for team registrations",
              },
            ],
          };
        }

        if (requestedGroupType === "individual" && data.invites?.length) {
          return {
            success: false,
            errors: [
              {
                code: "VALIDATION_ERROR",
                message: "Invites are not supported for individual registrations",
              },
            ],
          };
        }

        const { resolveMembershipEligibility } =
          await import("~/features/membership/membership.eligibility");
        const eligibility = await resolveMembershipEligibility({
          db,
          userId: user.id,
          eventId: event.id,
          asOf: now,
        });

        const needsMembership =
          event.requireMembership &&
          !eligibility.hasActiveMembership &&
          !eligibility.hasActiveDayPass;
        const wantsMembershipPurchase = Boolean(data.membershipTypeId);

        if (needsMembership && paymentMethod === "etransfer") {
          return {
            success: false,
            errors: [
              {
                code: "FORBIDDEN",
                message: "Membership is required and must be paid by card",
              },
            ],
          };
        }

        if (needsMembership && !wantsMembershipPurchase) {
          return {
            success: false,
            errors: [
              {
                code: "MEMBERSHIP_REQUIRED",
                message: "Membership is required to register for this event",
              },
            ],
          };
        }

        if (
          (needsMembership || wantsMembershipPurchase) &&
          eligibility.hasActiveMembership
        ) {
          return {
            success: false,
            errors: [
              {
                code: "VALIDATION_ERROR",
                message: "You already have an active membership",
              },
            ],
          };
        }

        let membershipType: typeof membershipTypes.$inferSelect | null = null;
        let membershipFeeCents = 0;

        if (needsMembership || wantsMembershipPurchase) {
          const [resolvedMembershipType] = await db
            .select()
            .from(membershipTypes)
            .where(
              and(
                eq(membershipTypes.id, data.membershipTypeId ?? ""),
                eq(membershipTypes.status, "active"),
              ),
            )
            .limit(1);

          if (!resolvedMembershipType) {
            return {
              success: false,
              errors: [
                {
                  code: "NOT_FOUND",
                  message: "Membership type not found or inactive",
                },
              ],
            };
          }

          membershipType = resolvedMembershipType;
          membershipFeeCents = membershipType.priceCents;
        }

        // Check for existing registration with any active status (pending, confirmed, waitlisted)
        // This prevents duplicate registrations and checkout sessions
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
              inArray(eventRegistrations.status, ["pending", "confirmed", "waitlisted"]),
            ),
          )
          .limit(1);

        if (existingRegistration.length > 0) {
          const status = existingRegistration[0].status;
          const message =
            status === "pending"
              ? "You have a pending registration. Please complete payment or cancel it first."
              : "You or your team are already registered for this event";
          return {
            success: false,
            errors: [
              {
                code: "ALREADY_REGISTERED",
                message,
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
        const totalAmountCents = amountDueCents + membershipFeeCents;

        let paymentStatus: EventRegistration["paymentStatus"] = "pending";
        let amountPaidCents: number | null = null;
        let paymentCompletedAt: Date | null = null;

        if (totalAmountCents === 0) {
          paymentStatus = "paid";
          amountPaidCents = 0;
          paymentCompletedAt = now;
        } else if (paymentMethod === "etransfer") {
          paymentStatus = "awaiting_etransfer";
        }

        const paymentMetadata =
          paymentMethod === "etransfer"
            ? buildEtransferSnapshot(
                event.etransferInstructions,
                event.etransferRecipient,
              )
            : null;

        const toDateString = (value: Date | string) =>
          value instanceof Date
            ? value.toISOString().split("T")[0]
            : new Date(value).toISOString().split("T")[0];

        const registrationStatus = totalAmountCents === 0 ? "confirmed" : "pending";
        const memberStatus = registrationStatus === "confirmed" ? "active" : "pending";
        const groupStatus = registrationStatus === "confirmed" ? "confirmed" : "pending";

        const groupMinSize =
          requestedGroupType === "pair"
            ? (event.minPlayersPerPair ?? 2)
            : requestedGroupType === "relay"
              ? (event.minPlayersPerRelay ?? event.minPlayersPerTeam ?? null)
              : registrationType === "team"
                ? (event.minPlayersPerTeam ?? null)
                : null;
        const groupMaxSize =
          requestedGroupType === "pair"
            ? (event.maxPlayersPerPair ?? 2)
            : requestedGroupType === "relay"
              ? (event.maxPlayersPerRelay ?? event.maxPlayersPerTeam ?? null)
              : registrationType === "team"
                ? (event.maxPlayersPerTeam ?? null)
                : null;

        const rawInvites =
          requestedGroupType === "individual" ? [] : (data.invites ?? []);
        const normalizedInvites = rawInvites
          .map((invite) => ({
            email: normalizeInviteEmail(invite.email),
            role: invite.role ?? "member",
          }))
          .filter((invite) => invite.email.length > 0);

        const inviteMap = new Map<string, RegistrationGroupMemberRole>();
        for (const invite of normalizedInvites) {
          if (invite.email === normalizeInviteEmail(user.email ?? "")) {
            continue;
          }
          inviteMap.set(invite.email, invite.role);
        }

        const inviteList = Array.from(inviteMap.entries()).map(([email, role]) => ({
          email,
          role,
        }));

        if (groupMaxSize && 1 + inviteList.length > groupMaxSize) {
          return {
            success: false,
            errors: [
              {
                code: "VALIDATION_ERROR",
                message: "This registration group exceeds the maximum size",
              },
            ],
          };
        }

        if (groupMinSize && 1 + inviteList.length < groupMinSize) {
          return {
            success: false,
            errors: [
              {
                code: "VALIDATION_ERROR",
                message: `This registration group requires at least ${groupMinSize} members`,
              },
            ],
          };
        }

        const inviteEmails = inviteList.map((invite) => invite.email);
        const existingUsers =
          inviteEmails.length > 0
            ? await db
                .select({
                  id: userTable.id,
                  email: userTable.email,
                  name: userTable.name,
                })
                .from(userTable)
                .where(inArray(userTable.email, inviteEmails))
            : [];
        const userByEmail = new Map(
          existingUsers
            .filter((record) => Boolean(record.email))
            .map((record) => [
              record.email as string,
              {
                id: record.id,
                email: record.email ?? null,
                name: record.name ?? null,
              },
            ]),
        );

        type RegistrationInvitePayload = {
          email: string;
          role: RegistrationGroupMemberRole;
          token: string;
          tokenHash: string;
          expiresAt: Date;
          user?: { id: string; email: string | null; name: string | null };
        };

        const invitePayloads: RegistrationInvitePayload[] =
          inviteList.length > 0
            ? await Promise.all(
                inviteList.map(async (invite) => {
                  const token = await generateRegistrationInviteToken();
                  const tokenHash = await hashRegistrationInviteToken(token);
                  const matchedUser = userByEmail.get(invite.email);
                  return {
                    email: invite.email,
                    role: invite.role,
                    token,
                    tokenHash,
                    expiresAt: resolveInviteExpiry(),
                    ...(matchedUser ? { user: matchedUser } : {}),
                  };
                }),
              )
            : [];

        const result = await db.transaction(async (tx) => {
          const [group] = await tx
            .insert(registrationGroups)
            .values({
              eventId: event.id,
              groupType: requestedGroupType,
              status: groupStatus,
              captainUserId: user.id,
              teamId: data.teamId ?? null,
              minSize: groupMinSize,
              maxSize: groupMaxSize,
            })
            .returning();

          await tx.insert(registrationGroupMembers).values({
            groupId: group.id,
            userId: user.id,
            email: user.email ?? null,
            role: "captain",
            status: memberStatus,
            invitedByUserId: user.id,
            invitedAt: now,
            joinedAt: memberStatus === "active" ? now : null,
          });

          if (invitePayloads.length > 0) {
            await tx.insert(registrationGroupMembers).values(
              invitePayloads.map((invite) => ({
                groupId: group.id,
                userId: invite.user?.id ?? null,
                email: invite.email,
                role: invite.role,
                status: "invited" as const,
                invitedByUserId: user.id,
                invitedAt: now,
              })),
            );

            await tx.insert(registrationInvites).values(
              invitePayloads.map((invite) => ({
                groupId: group.id,
                email: invite.email,
                tokenHash: invite.tokenHash,
                status: "pending" as const,
                expiresAt: invite.expiresAt,
              })),
            );
          }

          const [registration] = await tx
            .insert(eventRegistrations)
            .values({
              eventId: data.eventId,
              registrationGroupId: group.id,
              userId: user.id,
              teamId: data.teamId,
              registrationType,
              division: data.division,
              notes: data.notes,
              // Store directly as JSONB - Drizzle handles serialization
              // Normalize to object format if array is passed
              roster: data.roster
                ? Array.isArray(data.roster)
                  ? { players: data.roster }
                  : data.roster
                : null,
              status: registrationStatus,
              paymentStatus,
              paymentMethod,
              paymentId: null,
              amountDueCents,
              amountPaidCents,
              paymentCompletedAt,
              paymentMetadata,
            })
            .returning();

          let membershipPurchase: typeof membershipPurchases.$inferSelect | null = null;

          if (membershipType) {
            const isDayPass = membershipType.durationMonths === 0;
            const startDate = isDayPass ? event.startDate : now;
            const endDate = isDayPass
              ? event.endDate
              : (() => {
                  const end = new Date(now);
                  end.setMonth(end.getMonth() + membershipType.durationMonths);
                  return end;
                })();

            const [purchase] = await tx
              .insert(membershipPurchases)
              .values({
                membershipTypeId: membershipType.id,
                userId: user.id,
                eventId: isDayPass ? event.id : null,
                startDate: toDateString(startDate),
                endDate: toDateString(endDate),
                status: "pending",
                metadata: {
                  source: "event_registration",
                  eventId: event.id,
                  registrationId: registration.id,
                  registrationGroupId: group.id,
                },
              })
              .returning();

            membershipPurchase = purchase;
          }

          return {
            registration,
            group,
            membershipPurchase,
          };
        });

        const { registration, membershipPurchase } = result;

        if (invitePayloads.length > 0) {
          const { sendRegistrationGroupInviteEmail } =
            await import("~/lib/email/sendgrid");
          for (const invite of invitePayloads) {
            try {
              await sendRegistrationGroupInviteEmail({
                to: {
                  email: invite.email,
                  name: invite.user?.name ?? undefined,
                },
                eventId: event.id,
                eventName: event.name,
                groupType: requestedGroupType,
                inviteToken: invite.token,
                invitedByName: user.name ?? undefined,
                invitedByEmail: user.email ?? undefined,
              });
            } catch (error) {
              console.error("Failed to send registration group invite email", error);
            }
          }
        }

        let paymentResponse: EventRegistrationResultPayload["payment"];

        if (paymentMethod === "square" && totalAmountCents > 0) {
          const squareService = await getSquarePaymentService();
          const checkoutSession = await squareService.createEventCheckoutSession({
            eventId: event.id,
            registrationId: registration.id,
            userId: user.id,
            amount: totalAmountCents,
            eventName: event.name,
          });

          const [session] = await db
            .insert(checkoutSessions)
            .values({
              userId: user.id,
              provider: "square",
              providerCheckoutId: checkoutSession.id,
              providerCheckoutUrl: checkoutSession.checkoutUrl,
              providerOrderId: checkoutSession.orderId ?? null,
              amountTotalCents: totalAmountCents,
              currency: checkoutSession.currency,
              expiresAt: checkoutSession.expiresAt ?? null,
              metadata: {
                eventId: event.id,
                registrationId: registration.id,
                registrationType,
              },
            })
            .returning();

          const checkoutItemRows: NewCheckoutItem[] = [
            {
              checkoutSessionId: session.id,
              itemType: "event_registration",
              description: `Event registration: ${event.name}`,
              quantity: 1,
              amountCents: amountDueCents,
              currency: checkoutSession.currency,
              eventRegistrationId: registration.id,
              metadata: {
                registrationType,
              },
            },
          ];

          if (membershipPurchase) {
            checkoutItemRows.push({
              checkoutSessionId: session.id,
              itemType: "membership_purchase",
              description: `Membership: ${membershipType?.name ?? "Membership"}`,
              quantity: 1,
              amountCents: membershipFeeCents,
              currency: checkoutSession.currency,
              membershipPurchaseId: membershipPurchase.id,
              metadata: {
                eventId: event.id,
                registrationId: registration.id,
              },
            });
          }

          await db.insert(checkoutItems).values(checkoutItemRows);

          paymentResponse = {
            method: "square",
            checkoutUrl: checkoutSession.checkoutUrl,
            sessionId: checkoutSession.id,
          };
        } else if (totalAmountCents === 0) {
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
  .inputValidator(zod$(markEtransferPaidSchema))
  .handler(
    async ({
      data,
      context,
    }): Promise<EventOperationResult<EventRegistrationWithRoster>> => {
      await assertFeatureEnabled("events");
      try {
        const [{ getDb }] = await Promise.all([import("~/db/server-helpers")]);

        const db = await getDb();
        const user = requireUser(context);
        const clock = getClockFromContext(context);

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

        const now = currentTimestamp(clock);
        const existingMetadata = (registration.paymentMetadata ||
          {}) as EventPaymentMetadata;
        const updatedMetadata = markEtransferPaidMetadata(
          existingMetadata,
          user.id,
          clock,
        );

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
  .inputValidator(zod$(markEtransferReminderSchema))
  .handler(
    async ({
      data,
      context,
    }): Promise<EventOperationResult<EventRegistrationWithRoster>> => {
      await assertFeatureEnabled("events");
      try {
        const [{ getDb }] = await Promise.all([import("~/db/server-helpers")]);

        const db = await getDb();
        const user = requireUser(context);
        const clock = getClockFromContext(context);

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

        const now = currentTimestamp(clock);
        const existingMetadata = (registration.paymentMetadata ||
          {}) as EventPaymentMetadata;
        const updatedMetadata = markEtransferReminderMetadata(
          existingMetadata,
          user.id,
          clock,
        );

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
  .inputValidator(zod$(cancelEventRegistrationSchema))
  .handler(
    async ({
      data,
      context,
    }): Promise<EventOperationResult<EventRegistrationWithRoster>> => {
      await assertFeatureEnabled("events");
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
