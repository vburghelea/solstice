import { createFileRoute } from "@tanstack/react-router";
import { sql } from "drizzle-orm";
import { membershipTypes } from "~/db/schema";

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () => {
        const checks = {
          status: "healthy",
          timestamp: new Date().toISOString(),
          services: {} as Record<string, unknown>,
        };

        try {
          // Import server-only modules inside the handler
          const { getDb } = await import("~/db/server-helpers");

          // Check database connection
          const db = await getDb();

          await db.execute(sql`SELECT 1`);
          checks.services["database"] = { status: "connected" };
        } catch {
          checks.status = "unhealthy";
          checks.services["database"] = {
            status: "error",
            message: "Database connection failed",
          };
        }

        try {
          // Check membership types
          const { getDb } = await import("~/db/server-helpers");
          const db = await getDb();

          const types = await db
            .select({ count: sql<number>`count(*)` })
            .from(membershipTypes);

          checks.services["membershipTypes"] = {
            status: "available",
            count: types[0]?.count || 0,
          };
        } catch {
          checks.services["membershipTypes"] = {
            status: "error",
            message: "Failed to query membership types",
          };
        }

        // Check Square configuration
        checks.services["square"] = {
          status: process.env["SQUARE_ACCESS_TOKEN"] ? "configured" : "not_configured",
          environment: process.env["SQUARE_ENV"] || "not_set",
          hasApplicationId: !!process.env["SQUARE_APPLICATION_ID"],
          hasLocationId: !!process.env["SQUARE_LOCATION_ID"],
          hasWebhookKey: !!process.env["SQUARE_WEBHOOK_SIGNATURE_KEY"],
        };

        const statusCode = checks.status === "healthy" ? 200 : 503;

        return new Response(JSON.stringify(checks, null, 2), {
          status: statusCode,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
          },
        });
      },
    },
  },
});
