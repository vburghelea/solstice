import { createServerFn } from "@tanstack/react-start";
import { and, eq } from "drizzle-orm";
import { membershipPaymentSessions, memberships, membershipTypes } from "~/db/schema";
import { getAuthMiddleware, requireUser } from "~/lib/server/auth";
import { zod$ } from "~/lib/server/fn-utils";
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

const RETRYABLE_PAYMENT_ERROR_PATTERNS = [/pending/i, /not available/i, /processing/i];

function isRetryablePaymentError(message: string | undefined): boolean {
  if (!message) return false;
  return RETRYABLE_PAYMENT_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

async function wait(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

const getSquarePaymentService = async () => {
  const { squarePaymentService } = await import("~/lib/payments/square");
  return squarePaymentService;
};

/**
 * Create a checkout session for membership purchase
 */
export const createCheckoutSession = createServerFn({ method: "POST" })
  .middleware(getAuthMiddleware())
  .inputValidator(zod$(purchaseMembershipSchema.omit({ autoRenew: true })))
  .handler(
    async ({
      data,
      context,
    }): Promise<MembershipOperationResult<CheckoutSessionResult>> => {
      try {
        // Import server-only modules inside the handler
        const [{ getDb }] = await Promise.all([import("~/db/server-helpers")]);

        const db = await getDb();
        const user = requireUser(context);

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
          .where(and(eq(memberships.userId, user.id), eq(memberships.status, "active")))
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
          user.id,
          membershipType.priceCents,
        );

        await db
          .insert(membershipPaymentSessions)
          .values({
            userId: user.id,
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
  .middleware(getAuthMiddleware())
  .inputValidator(zod$(confirmMembershipPurchaseSchema))
  .handler(async ({ data, context }): Promise<MembershipOperationResult<Membership>> => {
    try {
      // Import server-only modules inside the handler
      const [{ getDb }] = await Promise.all([import("~/db/server-helpers")]);

      const db = await getDb();
      const user = requireUser(context);

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

      if (paymentSession.userId !== user.id) {
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
      let paymentResult = await squarePaymentService.verifyPayment(
        paymentSession.squareCheckoutId,
        data.paymentId ?? paymentSession.squarePaymentId ?? undefined,
      );

      let retryAttempts = 0;
      const maxRetryAttempts = 2;

      while (
        !paymentResult.success &&
        retryAttempts < maxRetryAttempts &&
        isRetryablePaymentError(paymentResult.error)
      ) {
        retryAttempts += 1;
        await wait(750 * retryAttempts);

        const [latestSession] = await db
          .select()
          .from(membershipPaymentSessions)
          .where(eq(membershipPaymentSessions.id, paymentSession.id))
          .limit(1);

        if (
          latestSession &&
          latestSession.status === "completed" &&
          latestSession.squarePaymentId
        ) {
          paymentResult = {
            success: true,
            paymentId: latestSession.squarePaymentId,
            orderId: latestSession.squareOrderId,
            status: "COMPLETED",
            amount: latestSession.amountCents,
            currency: latestSession.currency,
          };
          break;
        }

        paymentResult = await squarePaymentService.verifyPayment(
          paymentSession.squareCheckoutId,
          data.paymentId ?? paymentSession.squarePaymentId ?? undefined,
        );
      }

      if (!paymentResult.success) {
        const now = new Date();
        await db
          .update(membershipPaymentSessions)
          .set({
            status: paymentSession.status === "completed" ? "completed" : "failed",
            metadata: {
              ...(paymentSession.metadata ?? {}),
              lastError: paymentResult.error || "Payment verification failed",
              lastErrorAt: now.toISOString(),
              retryAttempts,
            },
            updatedAt: now,
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

      const now = new Date();
      const { finalizeMembershipForSession } = await import("./membership.finalize");
      const finalizeResult = await finalizeMembershipForSession({
        db,
        paymentSession,
        membershipType,
        paymentId: squarePaymentId,
        orderId: paymentResult.orderId ?? paymentSession.squareOrderId ?? null,
        sessionId: data.sessionId,
        now,
      });

      const confirmedMembership = finalizeResult.membership;
      const membershipWasCreated = finalizeResult.wasCreated;

      // Send confirmation email
      if (membershipWasCreated) {
        try {
          const { sendMembershipPurchaseReceipt } = await import("~/lib/email/sendgrid");

          await sendMembershipPurchaseReceipt({
            to: {
              email: user.email,
              name: user.name || undefined,
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
