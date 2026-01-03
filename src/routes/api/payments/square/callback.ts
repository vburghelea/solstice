import { createFileRoute, redirect } from "@tanstack/react-router";
import { eq } from "drizzle-orm";
import {
  checkoutItems,
  checkoutSessions,
  eventRegistrations,
  events,
  membershipPurchases,
  membershipTypes,
} from "~/db/schema";
import { user } from "~/db/schema/auth.schema";
import { finalizeMembershipPurchase } from "~/features/membership/membership.finalize";
import { atomicJsonbMerge } from "~/lib/db/jsonb-utils";
import { assertFeatureEnabled } from "~/tenant/feature-gates";

export const Route = createFileRoute("/api/payments/square/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        await assertFeatureEnabled("payments_square");
        try {
          const url = new URL(request.url);
          const params = url.searchParams;

          // Get checkout ID from Square (payment links) or fallbacks
          const checkoutId =
            params.get("checkoutId") ??
            params.get("checkout_id") ??
            params.get("session");
          const transactionId =
            params.get("transactionId") ??
            params.get("paymentId") ??
            params.get("payment_id");
          const orderIdParam = params.get("orderId") ?? params.get("order_id");
          const successParam = params.get("success");
          const hasExplicitSuccess = successParam !== null;
          const isSuccess = successParam === "true" || successParam === "1";

          if (!checkoutId) {
            return redirect({
              to: "/dashboard/membership",
              search: {
                error: "cancelled",
              },
            });
          }

          const { getDb } = await import("~/db/server-helpers");
          const db = await getDb();
          const now = new Date();
          const nowIso = now.toISOString();

          let session = null as typeof checkoutSessions.$inferSelect | null;

          const [sessionRow] = await db
            .select()
            .from(checkoutSessions)
            .where(eq(checkoutSessions.providerCheckoutId, checkoutId))
            .limit(1);

          session = sessionRow ?? null;

          if (!session) {
            const { ensureLegacyCheckoutSession } =
              await import("~/lib/payments/legacy-checkout");
            const legacyResult = await ensureLegacyCheckoutSession({
              db,
              checkoutId,
              paymentId: transactionId ?? null,
              orderId: null,
              now,
            });
            session = legacyResult.session;

            if (legacyResult.legacyType) {
              console.warn("Legacy checkout session migrated during callback", {
                checkoutId,
                legacyType: legacyResult.legacyType,
              });
            }
          }

          if (!session) {
            console.error("Checkout session not found for Square callback", {
              checkoutId,
              transactionId,
            });
            return redirect({
              to: "/dashboard/membership",
              search: {
                error: "processing_error",
              },
            });
          }

          const checkoutRows = await db
            .select({
              item: checkoutItems,
              registration: eventRegistrations,
              event: events,
              purchase: membershipPurchases,
              membershipType: membershipTypes,
            })
            .from(checkoutItems)
            .leftJoin(
              eventRegistrations,
              eq(checkoutItems.eventRegistrationId, eventRegistrations.id),
            )
            .leftJoin(events, eq(eventRegistrations.eventId, events.id))
            .leftJoin(
              membershipPurchases,
              eq(checkoutItems.membershipPurchaseId, membershipPurchases.id),
            )
            .leftJoin(
              membershipTypes,
              eq(membershipPurchases.membershipTypeId, membershipTypes.id),
            )
            .where(eq(checkoutItems.checkoutSessionId, session.id));

          if (checkoutRows.length === 0) {
            console.error("Checkout items not found for Square callback", {
              checkoutId,
              transactionId,
            });
            return redirect({
              to: "/dashboard/membership",
              search: {
                error: "processing_error",
              },
            });
          }

          const firstEvent = checkoutRows.find((row) => row.event)?.event ?? null;

          const shouldCancel =
            (hasExplicitSuccess && !isSuccess) || (!transactionId && !isSuccess);

          if (shouldCancel) {
            await db
              .update(checkoutSessions)
              .set({
                status: "cancelled",
                metadata: atomicJsonbMerge(checkoutSessions.metadata, {
                  cancelledAt: nowIso,
                  squareTransactionId: transactionId ?? null,
                }),
                updatedAt: now,
              })
              .where(eq(checkoutSessions.id, session.id));

            for (const row of checkoutRows) {
              if (row.registration) {
                await db
                  .update(eventRegistrations)
                  .set({
                    paymentStatus: "pending",
                    updatedAt: now,
                    paymentMetadata: {
                      ...((row.registration.paymentMetadata as Record<string, unknown>) ??
                        {}),
                      cancelledAt: nowIso,
                    },
                  })
                  .where(eq(eventRegistrations.id, row.registration.id));
              }

              if (row.purchase) {
                await db
                  .update(membershipPurchases)
                  .set({
                    status: "cancelled",
                    updatedAt: now,
                    metadata: atomicJsonbMerge(membershipPurchases.metadata, {
                      cancelledAt: nowIso,
                    }),
                  })
                  .where(eq(membershipPurchases.id, row.purchase.id));
              }
            }

            return redirect({
              to: firstEvent ? "/dashboard/events" : "/dashboard/membership",
              search: firstEvent
                ? { payment: "cancelled", eventId: firstEvent.id }
                : { error: "cancelled" },
            });
          }

          const { getSquarePaymentService } = await import("~/lib/payments/square");
          const paymentService = await getSquarePaymentService();
          const result = await paymentService.verifyPayment(
            checkoutId,
            transactionId ?? undefined,
          );

          if (!result.success) {
            await db
              .update(checkoutSessions)
              .set({
                status: "failed",
                metadata: atomicJsonbMerge(checkoutSessions.metadata, {
                  lastError: result.error || "Payment verification failed",
                  lastErrorAt: nowIso,
                  squareTransactionId: transactionId,
                }),
                updatedAt: now,
              })
              .where(eq(checkoutSessions.id, session.id));

            return redirect({
              to: firstEvent ? "/dashboard/events" : "/dashboard/membership",
              search: firstEvent
                ? { payment: "verification_failed", eventId: firstEvent.id }
                : { error: "verification_failed" },
            });
          }

          const paymentIdentifier =
            result.paymentId ?? transactionId ?? session.providerPaymentId;

          if (!paymentIdentifier) {
            await db
              .update(checkoutSessions)
              .set({
                status: "failed",
                metadata: atomicJsonbMerge(checkoutSessions.metadata, {
                  lastError: "Missing payment identifier",
                  lastErrorAt: nowIso,
                }),
                updatedAt: now,
              })
              .where(eq(checkoutSessions.id, session.id));

            return redirect({
              to: firstEvent ? "/dashboard/events" : "/dashboard/membership",
              search: firstEvent
                ? { payment: "verification_failed", eventId: firstEvent.id }
                : { error: "verification_failed" },
            });
          }

          await db
            .update(checkoutSessions)
            .set({
              status: "completed",
              providerPaymentId: paymentIdentifier,
              providerOrderId:
                orderIdParam ?? result.orderId ?? session.providerOrderId ?? null,
              metadata: atomicJsonbMerge(checkoutSessions.metadata, {
                squareTransactionId: paymentIdentifier,
                paymentVerifiedAt: nowIso,
                paymentConfirmedAt: nowIso,
              }),
              updatedAt: now,
            })
            .where(eq(checkoutSessions.id, session.id));

          for (const row of checkoutRows) {
            if (row.registration) {
              const existingMetadata = (row.registration.paymentMetadata ?? {}) as Record<
                string,
                unknown
              >;
              const amountCents = row.item.amountCents * (row.item.quantity ?? 1);

              await db
                .update(eventRegistrations)
                .set({
                  paymentStatus: "paid",
                  status:
                    row.registration.status === "cancelled"
                      ? row.registration.status
                      : "confirmed",
                  paymentCompletedAt: now,
                  paymentId: paymentIdentifier,
                  amountPaidCents: amountCents,
                  paymentMetadata: {
                    ...existingMetadata,
                    squareTransactionId: paymentIdentifier,
                    markedPaidAt: nowIso,
                  },
                  updatedAt: now,
                })
                .where(eq(eventRegistrations.id, row.registration.id));
            }

            if (row.purchase && row.membershipType) {
              const finalizeResult = await finalizeMembershipPurchase({
                db,
                purchase: row.purchase,
                membershipType: row.membershipType,
                paymentId: paymentIdentifier,
                orderId: result.orderId ?? session.providerOrderId ?? null,
                sessionId: checkoutId,
                now,
              });

              if (finalizeResult.wasCreated && finalizeResult.membership) {
                const [membershipUser] = await db
                  .select({
                    id: user.id,
                    email: user.email,
                    name: user.name,
                  })
                  .from(user)
                  .where(eq(user.id, row.purchase.userId ?? ""))
                  .limit(1);

                if (membershipUser?.email) {
                  try {
                    const { sendMembershipPurchaseReceipt } =
                      await import("~/lib/email/sendgrid");

                    await sendMembershipPurchaseReceipt({
                      to: {
                        email: membershipUser.email,
                        name: membershipUser.name || undefined,
                      },
                      membershipType: row.membershipType.name,
                      amount: row.membershipType.priceCents,
                      paymentId: paymentIdentifier,
                      expiresAt: new Date(finalizeResult.membership.endDate),
                    });
                  } catch (emailError) {
                    console.error("Failed to send membership receipt", emailError);
                  }
                }
              }
            }
          }

          return redirect({
            to: firstEvent ? "/dashboard/events" : "/dashboard/membership",
            search: firstEvent
              ? { payment: "success", eventId: firstEvent.id }
              : {
                  success: "true",
                  payment_id: paymentIdentifier,
                  session: checkoutId,
                },
          });
        } catch (error) {
          console.error("Square callback error:", error);
          return redirect({
            to: "/dashboard/membership",
            search: {
              error: "processing_error",
            },
          });
        }
      },
    },
  },
});
