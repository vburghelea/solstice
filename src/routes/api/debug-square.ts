import { createFileRoute } from "@tanstack/react-router";
import { getSquarePaymentService } from "~/lib/payments/square";

export const Route = createFileRoute("/api/debug-square")({
  server: {
    handlers: {
      GET: async () => {
        try {
          // Test if we can get the Square service and what type it is
          const service = await getSquarePaymentService();
          const serviceName = service.constructor.name;

          // Try to create a test checkout session to see the actual error
          let testError = null;
          try {
            await service.createCheckoutSession(
              "annual-player-2025",
              "test-user-id",
              4500,
            );
          } catch (error) {
            testError = error instanceof Error ? error.message : String(error);
          }

          return Response.json({
            status: "Square Debug Info",
            serviceType: serviceName,
            isRealSquare: serviceName === "SquarePaymentService",
            isMockSquare: serviceName === "MockSquarePaymentService",
            testCheckoutError: testError,
            env: {
              SQUARE_ENV: process.env["SQUARE_ENV"] || "NOT SET",
              hasAccessToken: !!process.env["SQUARE_ACCESS_TOKEN"],
              hasLocationId: !!process.env["SQUARE_LOCATION_ID"],
              locationId: process.env["SQUARE_LOCATION_ID"]?.substring(0, 10) + "...",
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
