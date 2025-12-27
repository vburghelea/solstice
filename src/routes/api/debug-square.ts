import { createFileRoute } from "@tanstack/react-router";
import { getSquarePaymentService } from "~/lib/payments/square";
import { debugGuard } from "~/lib/server/debug-guard";
import { assertFeatureEnabled } from "~/tenant/feature-gates";

export const Route = createFileRoute("/api/debug-square")({
  server: {
    handlers: {
      GET: async () => {
        await assertFeatureEnabled("qc_payments_square");
        // Block access in production - returns 404
        const guardResponse = debugGuard();
        if (guardResponse) return guardResponse;

        try {
          // Test if we can get the Square service and what type it is
          const service = await getSquarePaymentService();
          const serviceName = service.constructor.name;

          // Only expose non-sensitive configuration info - no checkout creation
          return Response.json({
            status: "Square Debug Info",
            serviceType: serviceName,
            isRealSquare: serviceName === "SquarePaymentService",
            isMockSquare: serviceName === "MockSquarePaymentService",
            env: {
              SQUARE_ENV: process.env["SQUARE_ENV"] || "NOT SET",
              hasAccessToken: !!process.env["SQUARE_ACCESS_TOKEN"],
              hasLocationId: !!process.env["SQUARE_LOCATION_ID"],
            },
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          return Response.json(
            {
              error: "Failed to debug Square",
              message: error instanceof Error ? error.message : String(error),
            },
            { status: 500 },
          );
        }
      },
    },
  },
});
