import { createFileRoute } from "@tanstack/react-router";
import { sql } from "drizzle-orm";
import { membershipTypes } from "~/db/schema";

interface HealthCheckResult {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  environment: {
    stage: string;
    isServerless: boolean;
    region: string;
  };
  services: {
    database: {
      status: "connected" | "error";
      latencyMs?: number;
      serverTime?: string;
      consecutiveFailures?: number;
      lastError?: string | null;
      message?: string;
    };
    membershipTypes?: {
      status: "available" | "error";
      count?: number;
      message?: string;
    };
    square: {
      status: "configured" | "not_configured";
      environment: string;
      hasApplicationId: boolean;
      hasLocationId: boolean;
      hasWebhookKey: boolean;
    };
  };
  metrics: {
    connectionPool: {
      pooled: {
        consecutiveFailures: number;
        lastError: string | null;
        isConnected: boolean;
      };
      unpooled: {
        consecutiveFailures: number;
        lastError: string | null;
        isConnected: boolean;
      };
    };
  };
}

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () => {
        const startTime = Date.now();

        // Get environment info
        const stage = process.env["SST_STAGE"] || "local";
        const isServerless = !!(
          process.env["AWS_LAMBDA_FUNCTION_NAME"] || process.env["AWS_EXECUTION_ENV"]
        );
        const region = process.env["AWS_REGION"] || "local";

        const checks: HealthCheckResult = {
          status: "healthy",
          timestamp: new Date().toISOString(),
          version: process.env["npm_package_version"] || "unknown",
          environment: {
            stage,
            isServerless,
            region,
          },
          services: {
            database: { status: "error", message: "Not checked yet" },
            square: {
              status: process.env["SQUARE_ACCESS_TOKEN"]
                ? "configured"
                : "not_configured",
              environment: process.env["SQUARE_ENV"] || "not_set",
              hasApplicationId: !!process.env["SQUARE_APPLICATION_ID"],
              hasLocationId: !!process.env["SQUARE_LOCATION_ID"],
              hasWebhookKey: !!process.env["SQUARE_WEBHOOK_SIGNATURE_KEY"],
            },
          },
          metrics: {
            connectionPool: {
              pooled: { consecutiveFailures: 0, lastError: null, isConnected: false },
              unpooled: { consecutiveFailures: 0, lastError: null, isConnected: false },
            },
          },
        };

        // Check database connection with detailed metrics
        try {
          const { testConnection, getConnectionMetrics } = await import("~/db");

          // Get connection metrics first (doesn't require a connection)
          const metrics = getConnectionMetrics();
          checks.metrics.connectionPool = {
            pooled: {
              consecutiveFailures: metrics.pooled.consecutiveFailures,
              lastError: metrics.pooled.lastError,
              isConnected: metrics.pooled.isConnected,
            },
            unpooled: {
              consecutiveFailures: metrics.unpooled.consecutiveFailures,
              lastError: metrics.unpooled.lastError,
              isConnected: metrics.unpooled.isConnected,
            },
          };

          // Run the connection test
          const dbHealth = await testConnection();

          checks.services.database = {
            status: dbHealth.healthy ? "connected" : "error",
            latencyMs: dbHealth.latencyMs,
            ...(dbHealth.serverTime ? { serverTime: dbHealth.serverTime } : {}),
            consecutiveFailures: dbHealth.metrics.pooled.consecutiveFailures,
            ...(dbHealth.error || dbHealth.metrics.pooled.lastError
              ? { lastError: dbHealth.error || dbHealth.metrics.pooled.lastError }
              : {}),
          };

          if (!dbHealth.healthy) {
            checks.status = "unhealthy";
          }
        } catch (error) {
          checks.status = "unhealthy";
          checks.services.database = {
            status: "error",
            message:
              error instanceof Error ? error.message : "Database connection failed",
            latencyMs: Date.now() - startTime,
          };
        }

        // Check membership types (only if database is healthy)
        if (checks.services.database.status === "connected") {
          try {
            const { getDb } = await import("~/db/server-helpers");
            const db = await getDb();

            const types = await db
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
            // Don't mark as unhealthy, just degraded
            if (checks.status === "healthy") {
              checks.status = "degraded";
            }
          }
        }

        // Determine status code
        const statusCode =
          checks.status === "healthy" ? 200 : checks.status === "degraded" ? 200 : 503;

        // Log health check result for monitoring
        console.log(
          JSON.stringify({
            timestamp: checks.timestamp,
            level: checks.status === "healthy" ? "info" : "warn",
            component: "health-check",
            message: `Health check: ${checks.status}`,
            databaseStatus: checks.services.database.status,
            databaseLatencyMs: checks.services.database.latencyMs,
            consecutiveFailures: checks.metrics.connectionPool.pooled.consecutiveFailures,
            totalDurationMs: Date.now() - startTime,
          }),
        );

        return new Response(JSON.stringify(checks, null, 2), {
          status: statusCode,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "X-Health-Status": checks.status,
            "X-Response-Time": `${Date.now() - startTime}ms`,
          },
        });
      },
    },
  },
});
