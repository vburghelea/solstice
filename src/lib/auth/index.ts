import { serverOnly } from "@tanstack/react-start";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { reactStartCookies } from "better-auth/react-start";

import { db } from "~/db";
import * as schema from "~/db/schema";
import { env, getAuthSecret, getBaseUrl } from "~/lib/env";

// Determine if we should use secure cookies based on the URL, not NODE_ENV
const baseUrl = getBaseUrl();
const isProduction = baseUrl?.startsWith("https://") ?? false;
const cookieDomain = env.get("COOKIE_DOMAIN");

const getAuthConfig = serverOnly(() =>
  betterAuth({
    baseURL: baseUrl,
    secret: getAuthSecret(),
    database: drizzleAdapter(db, {
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
      github: {
        clientId: env.get("GITHUB_CLIENT_ID") || "",
        clientSecret: env.get("GITHUB_CLIENT_SECRET") || "",
      },
      google: {
        clientId: env.get("GOOGLE_CLIENT_ID") || "",
        clientSecret: env.get("GOOGLE_CLIENT_SECRET") || "",
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
        trustedProviders: ["google", "github"], // Auto-link these providers
      },
    },
  }),
);

export const auth = getAuthConfig();
