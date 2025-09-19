import { createServerFn, serverOnly } from "@tanstack/react-start";
import { and, eq } from "drizzle-orm";
import { membershipPaymentSessions, memberships, membershipTypes } from "~/db/schema";
import type { MembershipMetadata } from "./membership.db-types";
import {
  confirmMembershipPurchaseSchema,
  purchaseMembershipSchema,
} from "./membership.schemas";
import type {
  CheckoutSessionResult,
  Membership,
  MembershipOperationResult,
} from "./membership.types";

// Helper to cast membership jsonb fields
function castMembershipJsonbFields(
  membership: typeof memberships.$inferSelect,
): Membership {
  return {
    ...membership,
    metadata: (membership.metadata || {}) as MembershipMetadata,
  } as Membership;
}

/**
 * Server-only helper to get Square payment service
 * This ensures the Square module is never included in the client bundle
 */
const getSquarePaymentService = serverOnly(async () => {
  const { squarePaymentService } = await import("~/lib/payments/square");
  return squarePaymentService;
});

/**
 * Create a checkout session for membership purchase
 */
export const createCheckoutSession = createServerFn({ method: "POST" })
  .validator(purchaseMembershipSchema.omit({ autoRenew: true }).parse)
  .handler(
    async ({ data }): Promise<MembershipOperationResult<CheckoutSessionResult>> => {
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
                code: "VALIDATION_ERROR",
                message: "User not authenticated",
              },
            ],
          };
        }

        // Verify membership type exists and is active

        const [membershipType] = await db
          .select()
          .from(membershipTypes)
          .where(
            and(
              eq(membershipTypes.id, data.membershipTypeId),
              eq(membershipTypes.status, "active"),
            ),
          )
          .limit(1);

        if (!membershipType) {
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

        // Check if user already has an active membership
        const [existingMembership] = await db
          .select()
          .from(memberships)
          .where(
            and(
              eq(memberships.userId, session.user.id),
              eq(memberships.status, "active"),
            ),
          )
          .limit(1);

        if (existingMembership) {
          return {
            success: false,
            errors: [
              {
                code: "VALIDATION_ERROR",
                message: "User already has an active membership",
              },
            ],
          };
        }

        // Create checkout session with Square
        const squarePaymentService = await getSquarePaymentService();
        const checkoutSession = await squarePaymentService.createCheckoutSession(
          membershipType.id,
          session.user.id,
          membershipType.priceCents,
        );

        await db
          .insert(membershipPaymentSessions)
          .values({
            userId: session.user.id,
            membershipTypeId: membershipType.id,
            squareCheckoutId: checkoutSession.id,
            squarePaymentLinkUrl: checkoutSession.checkoutUrl,
            squareOrderId: checkoutSession.orderId || null,
            amountCents: membershipType.priceCents,
            currency: checkoutSession.currency,
            expiresAt: checkoutSession.expiresAt ?? null,
            metadata: {
              membershipName: membershipType.name,
              squareOrderId: checkoutSession.orderId || null,
            },
          })
          .onConflictDoUpdate({
            target: membershipPaymentSessions.squareCheckoutId,
            set: {
              membershipTypeId: membershipType.id,
              squarePaymentLinkUrl: checkoutSession.checkoutUrl,
              squareOrderId: checkoutSession.orderId || null,
              amountCents: membershipType.priceCents,
              currency: checkoutSession.currency,
              expiresAt: checkoutSession.expiresAt ?? null,
              metadata: {
                membershipName: membershipType.name,
                squareOrderId: checkoutSession.orderId || null,
              },
              updatedAt: new Date(),
            },
          });

        return {
          success: true,
          data: {
            checkoutUrl: checkoutSession.checkoutUrl,
            sessionId: checkoutSession.id,
          },
        };
      } catch (error) {
        console.error("Error creating checkout session:", error);
        return {
          success: false,
          errors: [
            {
              code: "PAYMENT_ERROR",
              message: "Failed to create checkout session",
            },
          ],
        };
      }
    },
  );

/**
 * Confirm membership purchase after payment
 */
export const confirmMembershipPurchase = createServerFn({ method: "POST" })
  .validator(confirmMembershipPurchaseSchema.parse)
  .handler(async ({ data }): Promise<MembershipOperationResult<Membership>> => {
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
              code: "VALIDATION_ERROR",
              message: "User not authenticated",
            },
          ],
        };
      }

      // Look up the stored payment session
      const [paymentSession] = await db
        .select()
        .from(membershipPaymentSessions)
        .where(eq(membershipPaymentSessions.squareCheckoutId, data.sessionId))
        .limit(1);

      if (!paymentSession) {
        return {
          success: false,
          errors: [
            {
              code: "NOT_FOUND",
              message: "Checkout session not found",
            },
          ],
        };
      }

      if (paymentSession.userId !== session.user.id) {
        return {
          success: false,
          errors: [
            {
              code: "VALIDATION_ERROR",
              message: "Payment session does not belong to user",
            },
          ],
        };
      }

      if (data.membershipTypeId !== paymentSession.membershipTypeId) {
        return {
          success: false,
          errors: [
            {
              code: "VALIDATION_ERROR",
              message: "Membership type mismatch",
            },
          ],
        };
      }

      if (paymentSession.status === "completed" && paymentSession.squarePaymentId) {
        const [existingMembershipByPayment] = await db
          .select()
          .from(memberships)
          .where(eq(memberships.paymentId, paymentSession.squarePaymentId))
          .limit(1);

        if (existingMembershipByPayment) {
          return {
            success: true,
            data: castMembershipJsonbFields(existingMembershipByPayment),
          };
        }
      }

      // Verify payment with Square
      const squarePaymentService = await getSquarePaymentService();
      const paymentResult = await squarePaymentService.verifyPayment(
        paymentSession.squareCheckoutId,
        data.paymentId ?? paymentSession.squarePaymentId ?? undefined,
      );

      if (!paymentResult.success) {
        await db
          .update(membershipPaymentSessions)
          .set({
            status: paymentSession.status === "completed" ? "completed" : "failed",
            metadata: {
              ...(paymentSession.metadata ?? {}),
              lastError: paymentResult.error || "Payment verification failed",
              lastErrorAt: new Date().toISOString(),
            },
            updatedAt: new Date(),
          })
          .where(eq(membershipPaymentSessions.id, paymentSession.id));

        return {
          success: false,
          errors: [
            {
              code: "PAYMENT_ERROR",
              message: paymentResult.error || "Payment verification failed",
            },
          ],
        };
      }

      const squarePaymentId =
        paymentResult.paymentId ?? data.paymentId ?? paymentSession.squarePaymentId;

      if (!squarePaymentId) {
        return {
          success: false,
          errors: [
            {
              code: "PAYMENT_ERROR",
              message: "Missing payment identifier",
            },
          ],
        };
      }

      // Get membership type details

      const [membershipType] = await db
        .select()
        .from(membershipTypes)
        .where(eq(membershipTypes.id, data.membershipTypeId))
        .limit(1);

      if (!membershipType) {
        return {
          success: false,
          errors: [
            {
              code: "NOT_FOUND",
              message: "Membership type not found",
            },
          ],
        };
      }

      if (
        typeof paymentResult.amount === "number" &&
        paymentResult.amount !== membershipType.priceCents
      ) {
        return {
          success: false,
          errors: [
            {
              code: "PAYMENT_ERROR",
              message: "Payment amount does not match membership price",
            },
          ],
        };
      }

      if (paymentResult.currency && paymentResult.currency !== "CAD") {
        return {
          success: false,
          errors: [
            {
              code: "PAYMENT_ERROR",
              message: "Payment currency is not supported",
            },
          ],
        };
      }

      const confirmedMembership = await db.transaction(async (tx) => {
        const [existingMembershipByPayment] = await tx
          .select()
          .from(memberships)
          .where(eq(memberships.paymentId, squarePaymentId))
          .limit(1);

        if (existingMembershipByPayment) {
          await tx
            .update(membershipPaymentSessions)
            .set({
              status: "completed",
              squarePaymentId,
              squareOrderId: paymentResult.orderId ?? paymentSession.squareOrderId,
              metadata: {
                ...(paymentSession.metadata ?? {}),
                membershipId: existingMembershipByPayment.id,
                paymentConfirmedAt: new Date().toISOString(),
                squareOrderId: paymentResult.orderId ?? paymentSession.squareOrderId,
              },
              updatedAt: new Date(),
            })
            .where(eq(membershipPaymentSessions.id, paymentSession.id));

          return existingMembershipByPayment;
        }

        // Calculate membership dates
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + membershipType.durationMonths);

        const [newMembership] = await tx
          .insert(memberships)
          .values({
            userId: session.user.id,
            membershipTypeId: membershipType.id,
            startDate: startDate.toISOString().split("T")[0],
            endDate: endDate.toISOString().split("T")[0],
            status: "active",
            paymentProvider: "square",
            paymentId: squarePaymentId,
            metadata: {
              ...(paymentSession.metadata ?? {}),
              sessionId: data.sessionId,
              purchasedAt: new Date().toISOString(),
            },
          })
          .returning();

        await tx
          .update(membershipPaymentSessions)
          .set({
            status: "completed",
            squarePaymentId,
            squareOrderId: paymentResult.orderId ?? paymentSession.squareOrderId,
            metadata: {
              ...(paymentSession.metadata ?? {}),
              membershipId: newMembership.id,
              paymentConfirmedAt: new Date().toISOString(),
              squareOrderId: paymentResult.orderId ?? paymentSession.squareOrderId,
            },
            updatedAt: new Date(),
          })
          .where(eq(membershipPaymentSessions.id, paymentSession.id));

        return newMembership;
      });

      // Send confirmation email
      try {
        const { sendMembershipPurchaseReceipt } = await import("~/lib/email/sendgrid");

        await sendMembershipPurchaseReceipt({
          to: {
            email: session.user.email,
            name: session.user.name || undefined,
          },
          membershipType: membershipType.name,
          amount: membershipType.priceCents,
          paymentId: squarePaymentId,
          expiresAt: new Date(confirmedMembership.endDate),
        });
      } catch (emailError) {
        // Log error but don't fail the purchase
        console.error("Failed to send confirmation email:", emailError);
      }

      return {
        success: true,
        data: castMembershipJsonbFields(
          confirmedMembership as typeof memberships.$inferSelect,
        ),
      };
    } catch (error) {
      console.error("Error confirming membership purchase:", error);
      return {
        success: false,
        errors: [
          {
            code: "DATABASE_ERROR",
            message: "Failed to create membership record",
          },
        ],
      };
    }
  });
