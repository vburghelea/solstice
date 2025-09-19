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

    const parseParam = (value: string | null): string | boolean | null => {
      if (value === null) return null;
      try {
        return JSON.parse(value);
      } catch {
        // If the value isn't JSON-encoded, fall back to the raw string
        return value;
      }
    };

    const asString = (value: string | boolean | null): string | null => {
      if (typeof value === "string") return value;
      if (typeof value === "boolean") return value ? "true" : "false";
      return null;
    };

    const successRaw = parseParam(searchParams.get("success"));
    const paymentIdRaw = parseParam(searchParams.get("payment_id"));
    const sessionRaw = parseParam(searchParams.get("session"));
    const typeRaw = parseParam(searchParams.get("type"));
    const errorRaw = parseParam(searchParams.get("error"));
    const mockCheckoutRaw = parseParam(searchParams.get("mock_checkout"));

    return {
      isMockCheckout: mockCheckoutRaw === true || mockCheckoutRaw === "true",
      sessionId: asString(sessionRaw),
      success: successRaw === true || successRaw === "true",
      error: asString(errorRaw),
      paymentId: asString(paymentIdRaw),
      membershipTypeId: asString(typeRaw),
    };
  }, []); // Empty deps since URL doesn't change after mount
}

/**
 * Get appropriate error message for payment errors
 */
export function getPaymentErrorMessage(error: string | null): string | null {
  if (!error) return null;

  const errorMessages: Record<string, string> = {
    cancelled: "Payment was cancelled",
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
