/**
 * Square payment integration helper
 * Switches between mock and real implementation based on environment
 */

import { createId } from "@paralleldrive/cuid2";
import { serverOnly } from "@tanstack/react-start";

// This module should only be imported in server-side code

export interface CheckoutSession {
  id: string;
  checkoutUrl: string;
  membershipTypeId: string;
  userId: string;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "cancelled";
  expiresAt: Date;
  orderId?: string | null;
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
 * Mock Square payment helper
 * Returns fake checkout URLs and payment confirmations for development
 */
export class MockSquarePaymentService {
  constructor() {
    console.log("Using MOCK Square payment service");
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
    // Mock implementation - returns a fake checkout URL
    const sessionId = createId();
    // Import the server env to get base URL
    const { getBaseUrl } = await import("~/lib/env.server");
    const baseUrl = getBaseUrl();

    // In real implementation, this would call Square's Checkout API
    const checkoutSession: CheckoutSession = {
      id: sessionId,
      // Mock checkout URL - in production this would be a Square URL
      checkoutUrl: `${baseUrl}/dashboard/membership?mock_checkout=true&session=${sessionId}&type=${membershipTypeId}&amount=${amount}`,
      membershipTypeId,
      userId,
      amount,
      currency: "CAD",
      status: "pending",
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
      orderId: null,
    };

    // In production, we would store this session in the database
    // For now, we'll just return it
    return checkoutSession;
  }

  /**
   * Verify a payment after redirect from Square
   * @param sessionId - The checkout session ID
   * @param paymentId - The payment ID from Square (optional in mock)
   * @returns Payment verification result
   */
  async verifyPayment(sessionId: string, paymentId?: string): Promise<PaymentResult> {
    // Mock implementation - always returns success
    // In real implementation, this would verify with Square API

    if (!sessionId) {
      return {
        success: false,
        error: "Missing session ID",
      };
    }

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      success: true,
      paymentId: paymentId || `mock_payment_${createId()}`,
      orderId: sessionId,
      status: "COMPLETED",
      amount: null,
      currency: "CAD",
    };
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
    // Mock implementation - not used in development

    console.log("Mock webhook received:", { payload, signature });

    return {
      processed: true,
    };
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
    // Mock implementation
    // In production, this would fetch from Square API

    if (!paymentId) return null;

    return {
      id: paymentId,
      status: "completed",
      amount: 4500, // $45.00 in cents
      currency: "CAD",
      createdAt: new Date(),
    };
  }

  /**
   * Create a refund for a payment (mock)
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
    // Mock implementation
    console.log("Mock refund created:", { paymentId, amount, reason });

    return {
      success: true,
      refundId: `mock_refund_${createId()}`,
    };
  }
}

// Type for the payment service interface
export type ISquarePaymentService = MockSquarePaymentService;

// Server-only function to get the appropriate payment service
const getSquarePaymentServiceInternal = serverOnly(async () => {
  const useRealSquare =
    process.env["SQUARE_ENV"] === "production" || process.env["SQUARE_ENV"] === "sandbox";

  if (useRealSquare && process.env["SQUARE_ACCESS_TOKEN"]) {
    try {
      const { getSquarePaymentService: getRealService } = await import("./square-real");
      const realService = getRealService();
      if (realService) {
        console.log("Using REAL Square payment service");
        return realService;
      }
    } catch (error) {
      console.error("Failed to load real Square service:", error);
    }
  }

  // Fall back to mock service
  return new MockSquarePaymentService();
});

// Export singleton instance getter
export const getSquarePaymentService = async (): Promise<ISquarePaymentService> => {
  return getSquarePaymentServiceInternal();
};

// For backward compatibility
export const squarePaymentService = {
  createCheckoutSession: async (
    ...args: Parameters<ISquarePaymentService["createCheckoutSession"]>
  ) => {
    const service = await getSquarePaymentService();
    return service.createCheckoutSession(...args);
  },
  verifyPayment: async (...args: Parameters<ISquarePaymentService["verifyPayment"]>) => {
    const service = await getSquarePaymentService();
    return service.verifyPayment(...args);
  },
  processWebhook: async (
    ...args: Parameters<ISquarePaymentService["processWebhook"]>
  ) => {
    const service = await getSquarePaymentService();
    return service.processWebhook(...args);
  },
  getPaymentDetails: async (
    ...args: Parameters<ISquarePaymentService["getPaymentDetails"]>
  ) => {
    const service = await getSquarePaymentService();
    return service.getPaymentDetails(...args);
  },
};
