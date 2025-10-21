import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/test-square")({
  server: {
    handlers: {
      GET: async () => {
        const hasAccessToken = !!process.env["SQUARE_ACCESS_TOKEN"];
        const hasLocationId = !!process.env["SQUARE_LOCATION_ID"];
        const locationId = process.env["SQUARE_LOCATION_ID"];
        const env = process.env["SQUARE_ENV"];

        // Only show first/last few chars for security
        const maskValue = (val: string | undefined) => {
          if (!val) return "NOT SET";
          if (val.length < 10) return `${val.substring(0, 3)}...`;
          return `${val.substring(0, 5)}...${val.substring(val.length - 5)}`;
        };

        return Response.json({
          status: "Square Config Check",
          hasAccessToken,
          hasLocationId,
          locationId: maskValue(locationId),
          environment: env || "NOT SET",
          isValidLocationId: locationId && locationId !== "test-location-id",
          timestamp: new Date().toISOString(),
        });
      },
    },
  },
});
