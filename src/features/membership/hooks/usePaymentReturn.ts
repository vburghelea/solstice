import { useMemo } from "react";

export interface PaymentReturnParams {
  isMockCheckout: boolean;
  sessionId: string | null;
  success: boolean;
  error: string | null;
  paymentId: string | null;
  membershipTypeId: string | null;
}

/**
 * Parse payment return parameters from URL without using useEffect
 * This hook extracts payment-related query parameters for processing
 */
export function usePaymentReturn(): PaymentReturnParams {
  return useMemo(() => {
    if (typeof window === "undefined") {
      return {
        isMockCheckout: false,
        sessionId: null,
        success: false,
        error: null,
        paymentId: null,
        membershipTypeId: null,
      };
    }

    const searchParams = new URLSearchParams(window.location.search);

    return {
      isMockCheckout: searchParams.get("mock_checkout") === "true",
      sessionId: searchParams.get("session"),
      success: searchParams.get("success") === "true",
      error: searchParams.get("error"),
      paymentId: searchParams.get("payment_id"),
      membershipTypeId: searchParams.get("type"),
    };
  }, []); // Empty deps since URL doesn't change after mount
}

/**
 * Get appropriate error message for payment errors
 */
export function getPaymentErrorMessage(error: string | null): string | null {
  if (!error) return null;

  const errorMessages: Record<string, string> = {
    canceled: "Payment was canceled",
    verification_failed: "Payment verification failed",
    processing_error: "An error occurred while processing your payment",
  };

  return errorMessages[error] || "Payment failed";
}

/**
 * Clear payment-related query parameters from URL
 */
export function clearPaymentParams(): void {
  if (typeof window !== "undefined") {
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}
