import { json } from "@tanstack/react-start";
import { createServerFileRoute } from "@tanstack/react-start/server";
import { getSquarePaymentService } from "~/lib/payments/square";

export const ServerRoute = createServerFileRoute("/api/webhooks/square").methods({
  POST: async ({ request }) => {
    try {
      // Get the raw body for signature verification
      const body = await request.text();

      // Get the signature from headers
      const signature = request.headers.get("x-square-signature") || "";

      if (!signature) {
        console.error("Missing Square webhook signature");
        return json({ error: "Missing signature" }, { status: 401 });
      }

      // Parse the body
      let payload: unknown;
      try {
        payload = JSON.parse(body);
      } catch (error) {
        console.error("Invalid webhook payload:", error);
        return json({ error: "Invalid payload" }, { status: 400 });
      }

      // Get the payment service
      const paymentService = await getSquarePaymentService();

      // Process the webhook
      const result = await paymentService.processWebhook(payload, signature);

      if (!result.processed) {
        console.error("Failed to process webhook:", result.error);
        return json({ error: result.error || "Processing failed" }, { status: 400 });
      }

      // Handle specific event types
      const event = payload as { type: string; data: unknown };
      const eventType = event.type;
      const eventData = event.data as Record<string, unknown>;

      switch (eventType) {
        case "payment.created":
        case "payment.updated": {
          // Extract payment information
          const paymentObj = eventData?.["object"] as Record<string, unknown> | undefined;
          const payment = paymentObj?.["payment"] as Record<string, unknown> | undefined;
          if (!payment) break;

          const orderId = payment["order_id"] as string | undefined;
          const paymentId = payment["id"] as string | undefined;
          const status = payment["status"] as string | undefined;
          const amountMoney = payment["amount_money"] as
            | Record<string, unknown>
            | undefined;
          const amount = amountMoney?.["amount"] as number | undefined;

          console.log("Payment webhook received:", {
            orderId,
            paymentId,
            status,
            amount,
          });

          // TODO: Update membership in database based on payment status
          // This would require storing the order reference when creating checkout

          break;
        }

        case "refund.created":
        case "refund.updated": {
          // Handle refund events
          const refundObj = eventData?.["object"] as Record<string, unknown> | undefined;
          const refund = refundObj?.["refund"] as Record<string, unknown> | undefined;
          if (!refund) break;

          const refundId = refund["id"] as string | undefined;
          const paymentId = refund["payment_id"] as string | undefined;
          const status = refund["status"] as string | undefined;
          const amountMoney = refund["amount_money"] as
            | Record<string, unknown>
            | undefined;
          const amount = amountMoney?.["amount"] as number | undefined;

          console.log("Refund webhook received:", {
            refundId,
            paymentId,
            status,
            amount,
          });

          // TODO: Update membership status based on refund
          // Mark membership as canceled/refunded

          break;
        }

        default:
          console.log("Unhandled webhook event type:", eventType);
      }

      // Return success
      return json({ received: true });
    } catch (error) {
      console.error("Webhook handler error:", error);
      return json({ error: "Internal server error" }, { status: 500 });
    }
  },
});
