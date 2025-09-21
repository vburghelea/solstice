/**
 * Square payment integration helper - REAL implementation
 * This module handles real Square API interactions
 */

import { createId } from "@paralleldrive/cuid2";
import { eq } from "drizzle-orm";
import type { Square } from "square";
import { SquareClient, SquareEnvironment, SquareError, WebhooksHelper } from "square";
import { membershipPaymentSessions, memberships } from "~/db/schema";

// This module should only be imported in server-side code

export interface CheckoutSession {
  id: string;
  checkoutUrl: string;
  userId: string;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "cancelled";
  expiresAt: Date;
  orderId?: string | null;
  membershipTypeId?: string;
  eventId?: string;
  registrationId?: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  error?: string;
  orderId?: string | null;
  status?: string | null;
  amount?: number | null;
  currency?: string | null;
}

/**
 * Real Square payment helper
 * Handles actual Square API interactions for production
 */
export class SquarePaymentService {
  private client: SquareClient;
  private locationId: string;

  constructor() {
    // Get environment variables
    const accessToken = process.env["SQUARE_ACCESS_TOKEN"];
    const locationId = process.env["SQUARE_LOCATION_ID"];
    const environment = process.env["SQUARE_ENV"] || "sandbox";

    if (!accessToken) {
      throw new Error("SQUARE_ACCESS_TOKEN is required");
    }

    if (!locationId) {
      throw new Error("SQUARE_LOCATION_ID is required");
    }

    // Initialize Square client
    this.client = new SquareClient({
      token: accessToken,
      environment:
        environment === "production"
          ? SquareEnvironment.Production
          : SquareEnvironment.Sandbox,
    });

    this.locationId = locationId;
  }

  /**
   * Create a checkout session for membership purchase
   * @param membershipTypeId - ID of the membership type to purchase
   * @param userId - ID of the user making the purchase
   * @param amount - Amount in cents
   * @returns Checkout session with URL to redirect user
   */
  async createCheckoutSession(
    membershipTypeId: string,
    userId: string,
    amount: number,
  ): Promise<CheckoutSession> {
    try {
      // Import the server env to get base URL
      const { getBaseUrl } = await import("~/lib/env.server");
      const baseUrl = getBaseUrl();

      // Create idempotency key for Square
      const idempotencyKey = createId();

      // Create checkout request

      // Create payment link with Square (recommended over Checkout API)
      const paymentLinkRequest: Square.checkout.CreatePaymentLinkRequest = {
        idempotencyKey,
        description: "Annual Player Membership",
        quickPay: {
          name: "Annual Player Membership",
          priceMoney: {
            amount: BigInt(amount),
            currency: "CAD",
          },
          locationId: this.locationId,
        },
        checkoutOptions: {
          allowTipping: false,
          redirectUrl: `${baseUrl}/api/payments/square/callback`,
          askForShippingAddress: false,
          merchantSupportEmail:
            process.env["SUPPORT_EMAIL"] || "support@quadballcanada.com",
        },
        // Note: prePopulatedData.buyerEmail will be added when we have user email
        paymentNote: `Membership purchase for user ${userId}`,
      };

      const result = await this.client.checkout.paymentLinks.create(paymentLinkRequest);

      if (!result.paymentLink?.id || !result.paymentLink?.url) {
        throw new Error("Failed to create payment link");
      }

      // Create our internal session object
      const checkoutSession: CheckoutSession = {
        id: result.paymentLink.id,
        checkoutUrl: result.paymentLink.url,
        membershipTypeId,
        userId,
        amount,
        currency: "CAD",
        status: "pending",
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
        orderId: result.paymentLink.orderId || null,
      };

      // In a real implementation, we would store this session in the database
      // For now, we'll encode it in the state parameter
      return checkoutSession;
    } catch (error) {
      console.error("Square checkout error:", error);

      if (error instanceof SquareError) {
        // Log all Square API errors for debugging
        for (const err of error.errors ?? []) {
          console.error(
            `[Square] ${err.category} / ${err.code} @ ${err.field}: ${err.detail}`,
          );
        }
        const errorDetail =
          error.errors?.map((e) => e.detail).join("; ") ||
          error.message ||
          "Unknown error";
        throw new Error(`Square API error: ${errorDetail}`);
      }

      throw error;
    }
  }

  async createEventCheckoutSession(params: {
    eventId: string;
    registrationId: string;
    userId: string;
    amount: number;
    eventName: string;
  }): Promise<CheckoutSession> {
    try {
      const { getBaseUrl } = await import("~/lib/env.server");
      const baseUrl = getBaseUrl();

      const idempotencyKey = createId();

      const paymentLinkRequest: Square.checkout.CreatePaymentLinkRequest = {
        idempotencyKey,
        description: `Event registration for ${params.eventName}`,
        quickPay: {
          name: `Event Registration - ${params.eventName}`,
          priceMoney: {
            amount: BigInt(params.amount),
            currency: "CAD",
          },
          locationId: this.locationId,
        },
        checkoutOptions: {
          allowTipping: false,
          redirectUrl: `${baseUrl}/api/payments/square/callback`,
          askForShippingAddress: false,
          merchantSupportEmail:
            process.env["SUPPORT_EMAIL"] || "support@quadballcanada.com",
        },
        paymentNote: `Event registration ${params.registrationId} for event ${params.eventId}`,
      };

      const result = await this.client.checkout.paymentLinks.create(paymentLinkRequest);

      if (!result.paymentLink?.id || !result.paymentLink?.url) {
        throw new Error("Failed to create payment link for event registration");
      }

      return {
        id: result.paymentLink.id,
        checkoutUrl: result.paymentLink.url,
        userId: params.userId,
        amount: params.amount,
        currency: "CAD",
        status: "pending",
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        orderId: result.paymentLink.orderId || null,
        eventId: params.eventId,
        registrationId: params.registrationId,
        metadata: {
          eventName: params.eventName,
        },
      };
    } catch (error) {
      console.error("Square event checkout error:", error);
      if (error instanceof SquareError) {
        for (const err of error.errors ?? []) {
          console.error(
            `[Square] ${err.category} / ${err.code} @ ${err.field}: ${err.detail}`,
          );
        }
        const errorDetail =
          error.errors?.map((e) => e.detail).join("; ") ||
          error.message ||
          "Unknown error";
        throw new Error(`Square API error: ${errorDetail}`);
      }
      throw error;
    }
  }

  /**
   * Verify a payment after redirect from Square
   * @param checkoutId - The checkout ID from Square
   * @returns Payment verification result
   */
  async verifyPayment(checkoutId: string, paymentId?: string): Promise<PaymentResult> {
    try {
      if (!checkoutId) {
        return {
          success: false,
          error: "Missing checkout ID",
        };
      }

      const paymentLinkResponse = await this.client.checkout.paymentLinks.get({
        id: checkoutId,
      });
      const paymentLink = paymentLinkResponse.paymentLink;

      if (!paymentLink) {
        return {
          success: false,
          error: "Checkout session not found",
        };
      }

      let resolvedPaymentId = paymentId ?? null;
      const paymentLinkOrderId = paymentLink.orderId;

      let order: Square.Order | null = null;

      if (paymentLinkOrderId) {
        try {
          const orderResponse = await this.client.orders.get({
            orderId: paymentLinkOrderId,
          });
          order = orderResponse.order ?? null;
        } catch (orderError) {
          console.warn("Failed to fetch order for payment verification", orderError);
        }
      }

      if (!resolvedPaymentId && order) {
        resolvedPaymentId =
          order.tenders?.find((tender) => tender.paymentId)?.paymentId ?? null;
      }

      if (!resolvedPaymentId) {
        return {
          success: false,
          error: "Payment still pending or not available",
        };
      }

      let paymentResponse = await this.client.payments.get({
        paymentId: resolvedPaymentId,
      });
      let payment = paymentResponse.payment;

      if (!payment) {
        return {
          success: false,
          error: "Payment not found",
        };
      }

      if (
        payment.orderId &&
        paymentLinkOrderId &&
        payment.orderId !== paymentLinkOrderId
      ) {
        return {
          success: false,
          error: "Payment does not match checkout session",
        };
      }

      if (payment.status === "APPROVED") {
        try {
          await this.client.payments.complete({ paymentId: resolvedPaymentId });
          paymentResponse = await this.client.payments.get({
            paymentId: resolvedPaymentId,
          });
          payment = paymentResponse.payment;
        } catch (completeError) {
          console.warn("Failed to capture approved payment", completeError);
        }
      }

      if (!payment?.status || payment.status !== "COMPLETED") {
        return {
          success: false,
          error: `Payment status is ${payment?.status ?? "unknown"}`,
        };
      }

      const expectedAmount = order?.totalMoney?.amount ?? null;

      const actualAmount =
        payment.amountMoney?.amount ?? payment.totalMoney?.amount ?? null;

      if (
        expectedAmount !== null &&
        actualAmount !== null &&
        actualAmount !== expectedAmount
      ) {
        console.warn("Payment amount does not match checkout amount", {
          paymentAmount: actualAmount?.toString(),
          expectedAmount: expectedAmount.toString(),
          paymentId: payment.id,
          checkoutId,
        });
      }

      const amountBigint =
        payment.amountMoney?.amount ?? payment.totalMoney?.amount ?? null;
      const normalizedAmount = amountBigint !== null ? Number(amountBigint) : null;
      const currency =
        payment.amountMoney?.currency ?? payment.totalMoney?.currency ?? null;

      return {
        success: true,
        paymentId: payment.id ?? resolvedPaymentId,
        orderId: payment.orderId ?? paymentLinkOrderId ?? null,
        status: payment.status ?? null,
        amount: normalizedAmount,
        currency: currency ?? null,
      };
    } catch (error) {
      console.error("Payment verification error:", error);

      if (error instanceof SquareError) {
        const errorDetail = error.errors?.[0]?.detail || error.message || "Unknown error";
        return {
          success: false,
          error: `Square API error: ${errorDetail}`,
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to verify payment",
      };
    }
  }

  /**
   * Process a webhook from Square
   * @param payload - Webhook payload
   * @param signature - Webhook signature for verification
   * @returns Processing result
   */
  async processWebhook(
    payload: unknown,
    signature: string,
  ): Promise<{ processed: boolean; error?: string }> {
    try {
      const webhookSignatureKey = process.env["SQUARE_WEBHOOK_SIGNATURE_KEY"];

      if (!webhookSignatureKey) {
        console.error("SQUARE_WEBHOOK_SIGNATURE_KEY not configured");
        return {
          processed: false,
          error: "Webhook signature key not configured",
        };
      }

      // Verify webhook signature using Square's WebhooksHelper
      const isValid = await WebhooksHelper.verifySignature({
        requestBody: JSON.stringify(payload),
        signatureHeader: signature,
        signatureKey: webhookSignatureKey,
        notificationUrl: process.env["SQUARE_WEBHOOK_URL"] || "",
      });

      if (!isValid && process.env["NODE_ENV"] !== "development") {
        return {
          processed: false,
          error: "Invalid webhook signature",
        };
      }

      // Process webhook based on type
      const event = payload as { type: string; data: unknown };
      const eventType = event.type;
      const eventTimestamp = new Date().toISOString();

      switch (eventType) {
        case "payment.created":
        case "payment.updated":
          // Handle payment events
          {
            const eventData = event.data as Record<string, unknown> | undefined;
            const paymentObj = eventData?.["object"] as
              | Record<string, unknown>
              | undefined;
            const payment = paymentObj?.["payment"] as
              | Record<string, unknown>
              | undefined;

            if (!payment) break;

            const paymentId = payment["id"] as string | undefined;
            const orderId = payment["order_id"] as string | undefined;
            const status = (payment["status"] as string | undefined)?.toUpperCase();

            try {
              const { getDb } = await import("~/db/server-helpers");
              const db = await getDb();

              let session: typeof membershipPaymentSessions.$inferSelect | null = null;

              if (paymentId) {
                const [foundByPayment] = await db
                  .select()
                  .from(membershipPaymentSessions)
                  .where(eq(membershipPaymentSessions.squarePaymentId, paymentId))
                  .limit(1);

                session = foundByPayment ?? null;
              }

              if (!session && orderId) {
                const [foundByOrder] = await db
                  .select()
                  .from(membershipPaymentSessions)
                  .where(eq(membershipPaymentSessions.squareOrderId, orderId))
                  .limit(1);

                session = foundByOrder ?? null;
              }

              if (session) {
                const statusMap: Record<string, typeof session.status> = {
                  COMPLETED: "completed",
                  APPROVED: "completed",
                  FAILED: "failed",
                  CANCELED: "cancelled",
                  CANCELED_BY_CUSTOMER: "cancelled",
                };

                const nextStatus = statusMap[status ?? ""] ?? session.status;
                const nextPaymentId = paymentId ?? session.squarePaymentId ?? undefined;

                await db
                  .update(membershipPaymentSessions)
                  .set({
                    status: nextStatus,
                    squarePaymentId: nextPaymentId ?? session.squarePaymentId,
                    squareOrderId: orderId ?? session.squareOrderId,
                    metadata: {
                      ...(session.metadata ?? {}),
                      lastWebhookEvent: eventType,
                      lastWebhookAt: eventTimestamp,
                      squarePaymentStatus: status,
                    },
                    updatedAt: new Date(),
                  })
                  .where(eq(membershipPaymentSessions.id, session.id));
              }
            } catch (dbError) {
              console.error("Failed to update payment session from webhook:", dbError);
            }
          }
          break;

        case "refund.created":
        case "refund.updated":
          // Handle refund events
          {
            const eventData = event.data as Record<string, unknown> | undefined;
            const refundObj = eventData?.["object"] as
              | Record<string, unknown>
              | undefined;
            const refund = refundObj?.["refund"] as Record<string, unknown> | undefined;
            if (!refund) break;

            const refundId = refund["id"] as string | undefined;
            const paymentId = refund["payment_id"] as string | undefined;
            const status = (refund["status"] as string | undefined)?.toUpperCase();

            if (!paymentId) break;

            try {
              const { getDb } = await import("~/db/server-helpers");
              const db = await getDb();

              const [session] = await db
                .select()
                .from(membershipPaymentSessions)
                .where(eq(membershipPaymentSessions.squarePaymentId, paymentId))
                .limit(1);

              if (session) {
                await db
                  .update(membershipPaymentSessions)
                  .set({
                    metadata: {
                      ...(session.metadata ?? {}),
                      lastRefundStatus: status,
                      lastRefundId: refundId,
                      lastRefundAt: eventTimestamp,
                    },
                    updatedAt: new Date(),
                  })
                  .where(eq(membershipPaymentSessions.id, session.id));
              }

              const [membershipRecord] = await db
                .select()
                .from(memberships)
                .where(eq(memberships.paymentId, paymentId))
                .limit(1);

              if (membershipRecord) {
                const targetStatus =
                  status === "COMPLETED" ? "cancelled" : membershipRecord.status;

                await db
                  .update(memberships)
                  .set({
                    status: targetStatus,
                    metadata: {
                      ...(membershipRecord.metadata ?? {}),
                      refundId,
                      refundStatus: status,
                      refundUpdatedAt: eventTimestamp,
                    },
                    updatedAt: new Date(),
                  })
                  .where(eq(memberships.id, membershipRecord.id));
              }
            } catch (dbError) {
              console.error("Failed to update records from refund webhook:", dbError);
            }
          }
          break;

        default:
          console.log("Unknown webhook event type:", eventType);
      }

      return {
        processed: true,
      };
    } catch (error) {
      console.error("Webhook processing error:", error);

      return {
        processed: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get payment details
   * @param paymentId - The payment ID to look up
   * @returns Payment details or null
   */
  async getPaymentDetails(paymentId: string): Promise<{
    id: string;
    status: string;
    amount: number;
    currency: string;
    createdAt: Date;
    receiptUrl?: string | undefined;
  } | null> {
    try {
      if (!paymentId) return null;

      const result = await this.client.payments.get({ paymentId });

      if (!result.payment) {
        return null;
      }

      return {
        id: result.payment.id!,
        status: result.payment.status || "unknown",
        amount: Number(result.payment.amountMoney?.amount || 0),
        currency: result.payment.amountMoney?.currency || "CAD",
        createdAt: new Date(result.payment.createdAt!),
        receiptUrl: result.payment.receiptUrl || undefined,
      };
    } catch (error) {
      console.error("Error fetching payment details:", error);
      return null;
    }
  }

  /**
   * Create a refund for a payment
   * @param paymentId - The payment ID to refund
   * @param amount - Amount to refund in cents (optional, defaults to full refund)
   * @param reason - Reason for the refund
   * @returns Refund result
   */
  async createRefund(
    paymentId: string,
    amount?: number,
    reason?: string,
  ): Promise<{ success: boolean; refundId?: string; error?: string }> {
    try {
      const idempotencyKey = createId();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const request: any = {
        idempotencyKey,
        paymentId,
        reason: reason || "Customer requested refund",
      };

      if (amount) {
        request.amountMoney = {
          amount: BigInt(amount),
          currency: "CAD",
        };
      }

      const result = await this.client.refunds.refundPayment(request);

      if (!result.refund?.id) {
        return {
          success: false,
          error: "Failed to create refund",
        };
      }

      return {
        success: true,
        refundId: result.refund.id,
      };
    } catch (error) {
      console.error("Refund creation error:", error);

      if (error instanceof SquareError) {
        const errorDetail = error.errors?.[0]?.detail || error.message || "Unknown error";
        return {
          success: false,
          error: `Square API error: ${errorDetail}`,
        };
      }

      return {
        success: false,
        error: "Failed to create refund",
      };
    }
  }
}

// Export function to get the appropriate service based on environment
export function getSquarePaymentService() {
  const useRealSquare =
    process.env["SQUARE_ENV"] === "production" || process.env["SQUARE_ENV"] === "sandbox";

  if (useRealSquare && process.env["SQUARE_ACCESS_TOKEN"]) {
    return new SquarePaymentService();
  }

  // Fall back to mock service if not configured
  console.warn("Square not configured, using mock payment service");
  return null; // Will fall back to mock in the main square.ts file
}
