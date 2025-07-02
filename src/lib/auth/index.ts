import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { reactStartCookies } from "better-auth/react-start";

import { db } from "~/db";
import * as schema from "~/db/schema";
import { getAuthSecret, getBaseUrl, serverEnv } from "~/lib/env.server";

// Create auth instance lazily to avoid module-level execution
let authInstance: ReturnType<typeof betterAuth> | null = null;

export const auth = new Proxy({} as ReturnType<typeof betterAuth>, {
  get(target, prop) {
    if (!authInstance) {
      // Initialize auth configuration when first accessed
      const baseUrl = getBaseUrl();
      const isProduction = baseUrl?.startsWith("https://") ?? false;
      const cookieDomain = serverEnv.COOKIE_DOMAIN;

      // Debug OAuth configuration
      console.log("Auth config loading...");
      console.log("Base URL:", baseUrl);
      const googleClientId = serverEnv.GOOGLE_CLIENT_ID || "";
      const googleClientSecret = serverEnv.GOOGLE_CLIENT_SECRET || "";

      console.log(
        "Google Client ID:",
        googleClientId ? `Set (${googleClientId.substring(0, 10)}...)` : "Missing",
      );
      console.log("Google Client Secret:", googleClientSecret ? "Set" : "Missing");

      authInstance = betterAuth({
        baseURL: baseUrl,
        secret: getAuthSecret(),
        database: drizzleAdapter(db(), {
          provider: "pg",
          schema: {
            user: schema.user,
            session: schema.session,
            account: schema.account,
            verification: schema.verification,
          },
        }),

        // https://www.better-auth.com/docs/integrations/tanstack#usage-tips
        plugins: [reactStartCookies()],

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

        // https://www.better-auth.com/docs/concepts/oauth
        socialProviders: {
          google: {
            clientId: googleClientId,
            clientSecret: googleClientSecret,
            // Optional: Request additional scopes
            // scope: ["openid", "email", "profile"],
          },
        },

        // https://www.better-auth.com/docs/authentication/email-password
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
      });
    }
    return authInstance[prop as keyof typeof authInstance];
  },
});
