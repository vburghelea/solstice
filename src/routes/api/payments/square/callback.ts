import { redirect } from "@tanstack/react-router";
import { createServerFileRoute } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import { membershipPaymentSessions } from "~/db/schema";
import { getSquarePaymentService } from "~/lib/payments/square";

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
              error: "cancelled",
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

        const nowIso = new Date().toISOString();

        // Check if payment was cancelled
        if (!transactionId) {
          if (paymentSession) {
            await db
              .update(membershipPaymentSessions)
              .set({
                status: "cancelled",
                metadata: {
                  ...(paymentSession.metadata ?? {}),
                  cancelledAt: nowIso,
                },
                updatedAt: new Date(),
              })
              .where(eq(membershipPaymentSessions.id, paymentSession.id));
          }

          return redirect({
            to: "/dashboard/membership",
            search: {
              error: "cancelled",
            },
          });
        }

        if (paymentSession) {
          await db
            .update(membershipPaymentSessions)
            .set({
              squarePaymentId: transactionId,
              metadata: {
                ...(paymentSession.metadata ?? {}),
                squareTransactionId: transactionId,
                callbackReceivedAt: nowIso,
              },
              updatedAt: new Date(),
            })
            .where(eq(membershipPaymentSessions.id, paymentSession.id));
        }

        // Get the payment service
        const paymentService = await getSquarePaymentService();

        // Verify the payment with Square
        const result = await paymentService.verifyPayment(checkoutId, transactionId);

        if (!result.success) {
          console.error("Payment verification failed:", result.error);

          if (paymentSession) {
            await db
              .update(membershipPaymentSessions)
              .set({
                status: "failed",
                metadata: {
                  ...(paymentSession.metadata ?? {}),
                  lastError: result.error || "Payment verification failed",
                  lastErrorAt: nowIso,
                  squareTransactionId: transactionId,
                },
                updatedAt: new Date(),
              })
              .where(eq(membershipPaymentSessions.id, paymentSession.id));
          }

          return redirect({
            to: "/dashboard/membership",
            search: {
              error: "verification_failed",
            },
          });
        }

        const paymentIdentifier = result.paymentId || transactionId;

        if (paymentSession) {
          await db
            .update(membershipPaymentSessions)
            .set({
              status: "completed",
              squarePaymentId: paymentIdentifier,
              metadata: {
                ...(paymentSession.metadata ?? {}),
                squareTransactionId: paymentIdentifier,
                paymentVerifiedAt: nowIso,
              },
              updatedAt: new Date(),
            })
            .where(eq(membershipPaymentSessions.id, paymentSession.id));
        }

        const searchParams: Record<string, string> = {
          success: "true",
          payment_id: paymentIdentifier,
          session: checkoutId,
        };

        if (paymentSession?.membershipTypeId) {
          searchParams["type"] = paymentSession.membershipTypeId;
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
