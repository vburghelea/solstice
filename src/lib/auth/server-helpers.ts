/**
 * Server-only auth helpers
 * This module contains auth configuration that requires server-side environment variables
 */
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { reactStartCookies } from "better-auth/react-start";

// Lazy-loaded auth instance
let authInstance: ReturnType<typeof betterAuth> | null = null;

// Create and export the auth instance with server configuration
const createAuth = async () => {
  // Import server modules when auth is created
  const { db } = await import("~/db");
  const schema = await import("~/db/schema");
  const { env, getAuthSecret, getBaseUrl } = await import("~/lib/env.server");

  const baseUrl = getBaseUrl();
  const isProduction = baseUrl?.startsWith("https://") ?? false;
  const cookieDomain = env.COOKIE_DOMAIN;

  // Debug OAuth configuration
  console.log("Auth config loading...");
  console.log("Base URL:", baseUrl);
  const googleClientId = env.GOOGLE_CLIENT_ID || "";
  const googleClientSecret = env.GOOGLE_CLIENT_SECRET || "";

  console.log(
    "Google Client ID:",
    googleClientId ? `Set (${googleClientId.substring(0, 10)}...)` : "Missing",
  );
  console.log("Google Client Secret:", googleClientSecret ? "Set" : "Missing");

  // Get database connection
  const dbConnection = await db();

  return betterAuth({
    baseURL: baseUrl,
    secret: getAuthSecret(),
    trustedOrigins: isProduction
      ? [baseUrl]
      : ["http://localhost:5173", "http://localhost:8888"],
    database: drizzleAdapter(dbConnection, {
      provider: "pg",
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
      },
    }),

    // Session configuration with security settings
    session: {
      expiresIn: 60 * 60 * 24 * 30, // 30 days
      updateAge: 60 * 60 * 24, // 1 day
      cookieCache: {
        enabled: true,
        maxAge: 60 * 5, // 5 minutes
      },
    },

    // Secure cookie configuration
    advanced: {
      cookiePrefix: "solstice",
      useSecureCookies: isProduction,
      defaultCookieAttributes: cookieDomain
        ? {
            secure: isProduction,
            sameSite: "lax",
            httpOnly: true,
            path: "/",
            domain: cookieDomain,
          }
        : {
            secure: isProduction,
            sameSite: "lax",
            httpOnly: true,
            path: "/",
          },
    },

    // OAuth providers configuration
    socialProviders: {
      google: {
        clientId: googleClientId,
        clientSecret: googleClientSecret,
      },
    },

    // Email and password authentication
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: isProduction,
    },

    // Account linking configuration
    account: {
      accountLinking: {
        enabled: true,
        trustedProviders: ["google"], // Auto-link these providers
      },
    },

    // https://www.better-auth.com/docs/integrations/tanstack#usage-tips
    plugins: [reactStartCookies()], // MUST be the last plugin
  });
};

// Export auth as a getter that creates instance on first use
export const auth = new Proxy({} as ReturnType<typeof betterAuth>, {
  get(target, prop) {
    if (!authInstance) {
      throw new Error("Auth must be initialized asynchronously. Use getAuth() instead.");
    }
    return authInstance[prop as keyof typeof authInstance];
  },
});

// Export async getter for auth
export const getAuth = async () => {
  if (!authInstance) {
    authInstance = await createAuth();
  }
  return authInstance;
};
