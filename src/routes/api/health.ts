import { createAPIFileRoute } from "@tanstack/start/api";
import { sql } from "drizzle-orm";
import { db } from "~/db";
import { membershipTypes } from "~/db/schema";

export default createAPIFileRoute("/api/health")({
  GET: async () => {
    const checks = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: {} as Record<string, unknown>,
    };

    try {
      // Check database connection
      await db().execute(sql`SELECT 1`);
      checks.services.database = { status: "connected" };
    } catch {
      checks.status = "unhealthy";
      checks.services.database = {
        status: "error",
        message: "Database connection failed",
      };
    }

    try {
      // Check membership types
      const types = await db()
        .select({ count: sql<number>`count(*)` })
        .from(membershipTypes);

      checks.services.membershipTypes = {
        status: "available",
        count: types[0]?.count || 0,
      };
    } catch {
      checks.services.membershipTypes = {
        status: "error",
        message: "Failed to query membership types",
      };
    }

    const statusCode = checks.status === "healthy" ? 200 : 503;

    return new Response(JSON.stringify(checks, null, 2), {
      status: statusCode,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
      },
    });
  },
});
