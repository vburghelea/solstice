import { redirect } from "@tanstack/react-router";
import { createServerFileRoute } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import { membershipPaymentSessions, membershipTypes } from "~/db/schema";
import { user } from "~/db/schema/auth.schema";

export const ServerRoute = createServerFileRoute("/api/payments/square/callback").methods(
  {
    GET: async ({ request }) => {
      try {
        const url = new URL(request.url);
        const params = url.searchParams;

        // Get checkout ID from Square
        const checkoutId = params.get("checkoutId");
        const transactionId = params.get("transactionId");

        if (!checkoutId) {
          return redirect({
            to: "/dashboard/membership",
            search: {
              error: "canceled",
            },
          });
        }

        const { getDb } = await import("~/db/server-helpers");
        const db = await getDb();

        const [paymentSession] = await db
          .select()
          .from(membershipPaymentSessions)
          .where(eq(membershipPaymentSessions.squareCheckoutId, checkoutId))
          .limit(1);

        if (!paymentSession) {
          console.error("Membership payment session not found for Square callback", {
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

        let sessionRecord = paymentSession;
        const now = new Date();
        const nowIso = now.toISOString();

        // Check if payment was cancelled
        if (!transactionId) {
          await db
            .update(membershipPaymentSessions)
            .set({
              status: "cancelled",
              metadata: {
                ...(sessionRecord.metadata ?? {}),
                cancelledAt: nowIso,
              },
              updatedAt: now,
            })
            .where(eq(membershipPaymentSessions.id, sessionRecord.id));

          return redirect({
            to: "/dashboard/membership",
            search: {
              error: "cancelled",
            },
          });
        }

        const callbackMetadata = {
          ...(sessionRecord.metadata ?? {}),
          squareTransactionId: transactionId,
          callbackReceivedAt: nowIso,
        } as Record<string, unknown>;

        await db
          .update(membershipPaymentSessions)
          .set({
            squarePaymentId: transactionId,
            metadata: callbackMetadata,
            updatedAt: now,
          })
          .where(eq(membershipPaymentSessions.id, sessionRecord.id));

        sessionRecord = {
          ...sessionRecord,
          squarePaymentId: transactionId,
          metadata: callbackMetadata,
          updatedAt: now,
        };

        // Get the payment service
        const { getSquarePaymentService } = await import("~/lib/payments/square");
        const paymentService = await getSquarePaymentService();

        // Verify the payment with Square
        const result = await paymentService.verifyPayment(checkoutId, transactionId);

        if (!result.success) {
          console.error("Payment verification failed:", result.error);

          await db
            .update(membershipPaymentSessions)
            .set({
              status: "failed",
              metadata: {
                ...(sessionRecord.metadata ?? {}),
                lastError: result.error || "Payment verification failed",
                lastErrorAt: nowIso,
                squareTransactionId: transactionId,
              },
              updatedAt: now,
            })
            .where(eq(membershipPaymentSessions.id, sessionRecord.id));

          return redirect({
            to: "/dashboard/membership",
            search: {
              error: "verification_failed",
            },
          });
        }

        const paymentIdentifier = result.paymentId || transactionId;

        const verifiedMetadata = {
          ...(sessionRecord.metadata ?? {}),
          squareTransactionId: paymentIdentifier,
          paymentVerifiedAt: nowIso,
        } as Record<string, unknown>;

        await db
          .update(membershipPaymentSessions)
          .set({
            status: "completed",
            squarePaymentId: paymentIdentifier,
            metadata: verifiedMetadata,
            updatedAt: now,
          })
          .where(eq(membershipPaymentSessions.id, sessionRecord.id));

        sessionRecord = {
          ...sessionRecord,
          status: "completed",
          squarePaymentId: paymentIdentifier,
          metadata: verifiedMetadata,
          updatedAt: now,
        };

        const [membershipType] = await db
          .select()
          .from(membershipTypes)
          .where(eq(membershipTypes.id, sessionRecord.membershipTypeId))
          .limit(1);

        if (!membershipType) {
          await db
            .update(membershipPaymentSessions)
            .set({
              status: "failed",
              metadata: {
                ...(sessionRecord.metadata ?? {}),
                lastError: "Membership type not found",
                lastErrorAt: nowIso,
              },
              updatedAt: now,
            })
            .where(eq(membershipPaymentSessions.id, sessionRecord.id));

          return redirect({
            to: "/dashboard/membership",
            search: {
              error: "processing_error",
            },
          });
        }

        if (
          typeof result.amount === "number" &&
          result.amount !== membershipType.priceCents
        ) {
          console.error("Payment amount mismatch", {
            expected: membershipType.priceCents,
            actual: result.amount,
            paymentIdentifier,
            checkoutId,
          });

          await db
            .update(membershipPaymentSessions)
            .set({
              status: "failed",
              metadata: {
                ...(sessionRecord.metadata ?? {}),
                lastError: "Payment amount mismatch",
                lastErrorAt: nowIso,
              },
              updatedAt: now,
            })
            .where(eq(membershipPaymentSessions.id, sessionRecord.id));

          return redirect({
            to: "/dashboard/membership",
            search: {
              error: "processing_error",
            },
          });
        }

        if (result.currency && result.currency !== "CAD") {
          console.error("Unsupported payment currency", {
            expected: "CAD",
            actual: result.currency,
            paymentIdentifier,
            checkoutId,
          });

          await db
            .update(membershipPaymentSessions)
            .set({
              status: "failed",
              metadata: {
                ...(sessionRecord.metadata ?? {}),
                lastError: "Unsupported payment currency",
                lastErrorAt: nowIso,
              },
              updatedAt: now,
            })
            .where(eq(membershipPaymentSessions.id, sessionRecord.id));

          return redirect({
            to: "/dashboard/membership",
            search: {
              error: "processing_error",
            },
          });
        }

        const { finalizeMembershipForSession } = await import(
          "~/features/membership/membership.finalize"
        );

        const finalizeTimestamp = new Date();
        const finalizeResult = await finalizeMembershipForSession({
          db,
          paymentSession: sessionRecord,
          membershipType,
          paymentId: paymentIdentifier,
          orderId: result.orderId ?? sessionRecord.squareOrderId ?? null,
          sessionId: sessionRecord.squareCheckoutId,
          now: finalizeTimestamp,
        });

        if (finalizeResult.wasCreated) {
          const [membershipUser] = await db
            .select({
              id: user.id,
              email: user.email,
              name: user.name,
            })
            .from(user)
            .where(eq(user.id, sessionRecord.userId))
            .limit(1);

          if (membershipUser?.email) {
            try {
              const { sendMembershipPurchaseReceipt } = await import(
                "~/lib/email/sendgrid"
              );

              await sendMembershipPurchaseReceipt({
                to: {
                  email: membershipUser.email,
                  name: membershipUser.name || undefined,
                },
                membershipType: membershipType.name,
                amount: membershipType.priceCents,
                paymentId: paymentIdentifier,
                expiresAt: new Date(finalizeResult.membership.endDate),
              });
            } catch (emailError) {
              console.error("Failed to send membership receipt", emailError);
            }
          }
        }

        const searchParams: Record<string, string> = {
          success: "true",
          payment_id: paymentIdentifier,
          session: checkoutId,
        };

        if (sessionRecord.membershipTypeId) {
          searchParams["type"] = sessionRecord.membershipTypeId;
        }

        if (finalizeResult.membership?.id) {
          searchParams["membership_id"] = finalizeResult.membership.id;
        }

        return redirect({
          to: "/dashboard/membership",
          search: searchParams,
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
);
