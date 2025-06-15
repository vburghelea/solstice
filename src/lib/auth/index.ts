import { serverOnly } from "@tanstack/react-start";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { reactStartCookies } from "better-auth/react-start";

import { db } from "~/db";
import { securityConfig } from "~/lib/security/config";

const getAuthConfig = serverOnly(() =>
  betterAuth({
    baseURL: process.env.VITE_BASE_URL,
    database: drizzleAdapter(db, {
      provider: "pg",
    }),

    // https://www.better-auth.com/docs/integrations/tanstack#usage-tips
    plugins: [reactStartCookies()],

    // Session configuration with security settings
    session: {
      expiresIn: securityConfig.session.maxAge,
      updateAge: securityConfig.session.updateAge,
      cookieCache: securityConfig.session.cookieCache,
    },

    // Secure cookie configuration
    advanced: {
      cookiePrefix: "solstice",
      useSecureCookies: securityConfig.cookies.secure,
      cookies: {
        sessionToken: {
          name: "session",
          options: securityConfig.cookies,
        },
        csrfToken: {
          name: "csrf",
          options: securityConfig.cookies,
        },
      },
    },

    // https://www.better-auth.com/docs/concepts/oauth
    socialProviders: {
      github: {
        clientId: process.env.GITHUB_CLIENT_ID!,
        clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      },
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      },
    },

    // https://www.better-auth.com/docs/authentication/email-password
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: process.env.NODE_ENV === "production",
    },
  }),
);

export const auth = getAuthConfig();
