import { createServerFn } from "@tanstack/react-start";
import { and, eq } from "drizzle-orm";
import { db } from "~/db";
import { memberships, membershipTypes } from "~/db/schema";
import { auth } from "~/lib/auth";
import { squarePaymentService } from "~/lib/payments/square";
import type {
  CheckoutSessionResult,
  MembershipOperationResult,
  MembershipPurchaseInput,
} from "./membership.types";

/**
 * Create a checkout session for membership purchase
 */
export const createCheckoutSession = createServerFn({ method: "POST" }).handler(
  // @ts-expect-error - TanStack Start type inference issue
  async ({
    data,
  }: {
    data: { membershipTypeId: string };
  }): Promise<MembershipOperationResult<CheckoutSessionResult>> => {
    try {
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
      const [membershipType] = await db()
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
      const [existingMembership] = await db()
        .select()
        .from(memberships)
        .where(
          and(eq(memberships.userId, session.user.id), eq(memberships.status, "active")),
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
      const checkoutSession = await squarePaymentService.createCheckoutSession(
        membershipType.id,
        session.user.id,
        membershipType.priceCents,
      );

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
export const confirmMembershipPurchase = createServerFn({ method: "POST" }).handler(
  // @ts-expect-error - TanStack Start type inference issue
  async ({
    data,
  }: {
    data: MembershipPurchaseInput;
  }): Promise<MembershipOperationResult<typeof memberships.$inferSelect>> => {
    try {
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

      // Verify payment with Square
      const paymentResult = await squarePaymentService.verifyPayment(
        data.sessionId,
        data.paymentId,
      );

      if (!paymentResult.success) {
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

      // Get membership type details
      const [membershipType] = await db()
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

      // Calculate membership dates
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + membershipType.durationMonths);

      // Create membership record
      const [newMembership] = await db()
        .insert(memberships)
        .values({
          userId: session.user.id,
          membershipTypeId: membershipType.id,
          startDate: startDate.toISOString().split("T")[0], // Format as YYYY-MM-DD
          endDate: endDate.toISOString().split("T")[0],
          status: "active",
          paymentProvider: "square",
          paymentId: paymentResult.paymentId,
          metadata: {
            sessionId: data.sessionId,
            purchasedAt: new Date().toISOString(),
          },
        })
        .returning();

      return {
        success: true,
        data: newMembership,
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
  },
);
