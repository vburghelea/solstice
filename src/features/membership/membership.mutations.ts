import { createServerFn } from "@tanstack/react-start";
import { and, eq, gte, sql } from "drizzle-orm";
import {
  checkoutItems,
  checkoutSessions,
  membershipPurchases,
  memberships,
  membershipTypes,
} from "~/db/schema";
import { atomicJsonbMerge } from "~/lib/db/jsonb-utils";
import { getAuthMiddleware, requireUser } from "~/lib/server/auth";
import { zod$ } from "~/lib/server/fn-utils";
import { assertFeatureEnabled } from "~/tenant/feature-gates";
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
      await assertFeatureEnabled("membership");
      try {
        // Import server-only modules inside the handler
        const { getDb } = await import("~/db/server-helpers");

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

        // Check if user already has an active, unexpired membership
        // Must check both status AND date to allow renewal of expired memberships
        const [existingMembership] = await db
          .select()
          .from(memberships)
          .where(
            and(
              eq(memberships.userId, user.id),
              eq(memberships.status, "active"),
              gte(memberships.endDate, sql`CURRENT_DATE`),
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

        const now = new Date();
        const startDate = now.toISOString().split("T")[0];
        const endDate = (() => {
          const end = new Date(now);
          end.setMonth(end.getMonth() + membershipType.durationMonths);
          return end.toISOString().split("T")[0];
        })();

        const [membershipPurchase] = await db
          .insert(membershipPurchases)
          .values({
            membershipTypeId: membershipType.id,
            userId: user.id,
            startDate,
            endDate,
            status: "pending",
            metadata: {
              membershipName: membershipType.name,
            },
          })
          .returning();

        // Create checkout session with Square
        const squarePaymentService = await getSquarePaymentService();
        const checkoutSession = await squarePaymentService.createCheckoutSession(
          membershipType.id,
          user.id,
          membershipType.priceCents,
        );

        const [session] = await db
          .insert(checkoutSessions)
          .values({
            userId: user.id,
            provider: "square",
            providerCheckoutId: checkoutSession.id,
            providerCheckoutUrl: checkoutSession.checkoutUrl,
            providerOrderId: checkoutSession.orderId || null,
            amountTotalCents: membershipType.priceCents,
            currency: checkoutSession.currency,
            expiresAt: checkoutSession.expiresAt ?? null,
            metadata: {
              membershipTypeId: membershipType.id,
              membershipName: membershipType.name,
              squareOrderId: checkoutSession.orderId || null,
            },
          })
          .returning();

        await db.insert(checkoutItems).values({
          checkoutSessionId: session.id,
          itemType: "membership_purchase",
          description: membershipType.name,
          quantity: 1,
          amountCents: membershipType.priceCents,
          currency: checkoutSession.currency,
          membershipPurchaseId: membershipPurchase.id,
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
    await assertFeatureEnabled("membership");
    try {
      // Import server-only modules inside the handler
      const { getDb } = await import("~/db/server-helpers");

      const db = await getDb();
      const user = requireUser(context);

      const [session] = await db
        .select()
        .from(checkoutSessions)
        .where(eq(checkoutSessions.providerCheckoutId, data.sessionId))
        .limit(1);

      if (!session) {
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

      if (session.userId !== user.id) {
        return {
          success: false,
          errors: [
            {
              code: "VALIDATION_ERROR",
              message: "Checkout session does not belong to user",
            },
          ],
        };
      }

      const checkoutItemRows = await db
        .select({
          item: checkoutItems,
          purchase: membershipPurchases,
          membershipType: membershipTypes,
          membership: memberships,
        })
        .from(checkoutItems)
        .leftJoin(
          membershipPurchases,
          eq(checkoutItems.membershipPurchaseId, membershipPurchases.id),
        )
        .leftJoin(
          membershipTypes,
          eq(membershipPurchases.membershipTypeId, membershipTypes.id),
        )
        .leftJoin(memberships, eq(membershipPurchases.membershipId, memberships.id))
        .where(eq(checkoutItems.checkoutSessionId, session.id));

      const membershipItem = checkoutItemRows.find(
        (row) => row.item.itemType === "membership_purchase" && row.purchase,
      );

      if (!membershipItem?.purchase || !membershipItem.membershipType) {
        return {
          success: false,
          errors: [
            {
              code: "NOT_FOUND",
              message: "Membership purchase not found for this checkout session",
            },
          ],
        };
      }

      if (data.membershipTypeId !== membershipItem.purchase.membershipTypeId) {
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

      if (session.status === "completed" && session.providerPaymentId) {
        if (membershipItem.membership) {
          return {
            success: true,
            data: castMembershipJsonbFields(membershipItem.membership),
          };
        }
      }

      // Verify payment with Square
      const squarePaymentService = await getSquarePaymentService();
      let paymentResult = await squarePaymentService.verifyPayment(
        session.providerCheckoutId,
        data.paymentId ?? session.providerPaymentId ?? undefined,
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
          .from(checkoutSessions)
          .where(eq(checkoutSessions.id, session.id))
          .limit(1);

        if (
          latestSession &&
          latestSession.status === "completed" &&
          latestSession.providerPaymentId
        ) {
          paymentResult = {
            success: true,
            paymentId: latestSession.providerPaymentId,
            orderId: latestSession.providerOrderId,
            status: "COMPLETED",
            amount: latestSession.amountTotalCents,
            currency: latestSession.currency,
          };
          break;
        }

        paymentResult = await squarePaymentService.verifyPayment(
          session.providerCheckoutId,
          data.paymentId ?? session.providerPaymentId ?? undefined,
        );
      }

      if (!paymentResult.success) {
        const now = new Date();
        await db
          .update(checkoutSessions)
          .set({
            status: session.status === "completed" ? "completed" : "failed",
            metadata: atomicJsonbMerge(checkoutSessions.metadata, {
              lastError: paymentResult.error || "Payment verification failed",
              lastErrorAt: now.toISOString(),
              retryAttempts,
            }),
            updatedAt: now,
          })
          .where(eq(checkoutSessions.id, session.id));

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
        paymentResult.paymentId ?? data.paymentId ?? session.providerPaymentId;

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

      if (
        typeof paymentResult.amount === "number" &&
        paymentResult.amount !== membershipItem.membershipType.priceCents
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
      const { finalizeMembershipPurchase } = await import("./membership.finalize");

      await db
        .update(checkoutSessions)
        .set({
          status: "completed",
          providerPaymentId: squarePaymentId,
          providerOrderId: paymentResult.orderId ?? session.providerOrderId ?? null,
          metadata: atomicJsonbMerge(checkoutSessions.metadata, {
            paymentConfirmedAt: now.toISOString(),
            squareTransactionId: squarePaymentId,
          }),
          updatedAt: now,
        })
        .where(eq(checkoutSessions.id, session.id));

      const finalizeResult = await finalizeMembershipPurchase({
        db,
        purchase: membershipItem.purchase,
        membershipType: membershipItem.membershipType,
        paymentId: squarePaymentId,
        orderId: paymentResult.orderId ?? session.providerOrderId ?? null,
        sessionId: data.sessionId,
        now,
      });

      const confirmedMembership = finalizeResult.membership;
      const membershipWasCreated = finalizeResult.wasCreated;

      // Send confirmation email
      if (membershipWasCreated && confirmedMembership) {
        try {
          const { sendMembershipPurchaseReceipt } = await import("~/lib/email/sendgrid");

          await sendMembershipPurchaseReceipt({
            to: {
              email: user.email,
              name: user.name || undefined,
            },
            membershipType: membershipItem.membershipType.name,
            amount: membershipItem.membershipType.priceCents,
            paymentId: squarePaymentId,
            expiresAt: new Date(confirmedMembership.endDate),
          });
        } catch (emailError) {
          // Log error but don't fail the purchase
          console.error("Failed to send confirmation email:", emailError);
        }
      }

      if (!confirmedMembership) {
        return {
          success: false,
          errors: [
            {
              code: "PAYMENT_ERROR",
              message: "Membership purchase was completed without an active membership",
            },
          ],
        };
      }

      return {
        success: true,
        data: castMembershipJsonbFields(confirmedMembership),
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
