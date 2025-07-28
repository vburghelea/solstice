import { redirect } from "@tanstack/react-router";
import { createServerFileRoute } from "@tanstack/react-start/server";
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

        // Check if payment was cancelled
        if (!checkoutId || !transactionId) {
          console.log("Payment cancelled or missing data");
          // Redirect back to membership page with error
          return redirect({
            to: "/dashboard/membership",
            search: {
              error: "cancelled",
            },
          });
        }

        // Get the payment service
        const paymentService = await getSquarePaymentService();

        // Verify the payment with Square
        const result = await paymentService.verifyPayment(checkoutId);

        if (!result.success) {
          console.error("Payment verification failed:", result.error);
          return redirect({
            to: "/dashboard/membership",
            search: {
              error: "verification_failed",
            },
          });
        }

        // TODO: In production, we would:
        // 1. Retrieve the checkout session from database
        // 2. Update the membership record
        // 3. Send confirmation email

        // For now, redirect to membership page with success
        return redirect({
          to: "/dashboard/membership",
          search: {
            success: "true",
            payment_id: result.paymentId,
          },
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
