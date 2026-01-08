import { createServerOnlyFn } from "@tanstack/react-start";

const createInstance = async () => {
  const [{ c15tInstance }, { drizzleAdapter }, { default: postgres }, { drizzle }] =
    await Promise.all([
      import("@c15t/backend/v2"),
      import("@c15t/backend/v2/db/adapters/drizzle"),
      import("postgres"),
      import("drizzle-orm/postgres-js"),
    ]);

  const { consentSchema } = await import("~/features/consent/c15t.schema");

  const { env, getConsentDbUrl, getConsentTrustedOrigins } =
    await import("~/lib/env.server");

  const connectionString = getConsentDbUrl();
  const sql = postgres(connectionString, {
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  const db = drizzle(sql, {
    schema: consentSchema,
    casing: "snake_case",
  });
  const trustedOrigins = getConsentTrustedOrigins();

  return c15tInstance({
    appName: "roundup-games-consent",
    basePath: "/api/c15t",
    trustedOrigins,
    adapter: drizzleAdapter({
      db,
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
