import { createServerOnlyFn } from "@tanstack/react-start";

// ============================================================================
// PERFORMANCE OPTIMIZATION: Shared Database Connection
// ============================================================================
// c15t uses the same database connection pool as the main app to avoid:
// - Connection pool exhaustion in serverless environments
// - Multiple competing pools creating unnecessary connections
// - "Failed query" errors due to connection limits
//
// The c15t tables are in the same database, just with a separate schema.
// ============================================================================

const createInstance = async () => {
  const [{ c15tInstance }, { drizzleAdapter }] = await Promise.all([
    import("@c15t/backend/v2"),
    import("@c15t/backend/v2/db/adapters/drizzle"),
  ]);

  const { env, getConsentTrustedOrigins } = await import("~/lib/env.server");

  // Get the underlying client to pass to c15t's drizzle adapter
  // We use a helper that creates a client with c15t's schema
  const { getDbClient } = await import("~/features/consent/c15t-client-helpers");
  const drizzleClient = await getDbClient();

  const trustedOrigins = getConsentTrustedOrigins();

  return c15tInstance({
    appName: "roundup-games-consent",
    basePath: "/api/c15t",
    trustedOrigins,
    adapter: drizzleAdapter({
      db: drizzleClient,
      provider: "postgresql",
    }),
    advanced: {
      branding: "none",
      disableGeoLocation: env.NODE_ENV !== "production",
      openapi: {
        enabled: env.NODE_ENV !== "production",
      },
    },
    logger: {
      level: env.NODE_ENV === "production" ? "warn" : "debug",
    },
  });
};

let instancePromise: ReturnType<typeof createInstance> | null = null;

export const getConsentBackend = createServerOnlyFn(async () => {
  if (!instancePromise) {
    instancePromise = createInstance();
  }

  return instancePromise;
});
