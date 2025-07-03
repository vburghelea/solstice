import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { db } from "./db";

export const auth = betterAuth({
  baseURL: process.env["VITE_BASE_URL"] || "http://localhost:3000",
  database: drizzleAdapter(db, {
    provider: "pg",
  }),

  // https://www.better-auth.com/docs/concepts/session-management#session-caching
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },

  // https://www.better-auth.com/docs/concepts/oauth
  socialProviders: {
    // Google OAuth
    ...(process.env["GOOGLE_CLIENT_ID"] && process.env["GOOGLE_CLIENT_SECRET"]
      ? {
          google: {
            clientId: process.env["GOOGLE_CLIENT_ID"],
            clientSecret: process.env["GOOGLE_CLIENT_SECRET"],
          },
        }
      : {}),
    // Discord OAuth
    ...(process.env["DISCORD_CLIENT_ID"] && process.env["DISCORD_CLIENT_SECRET"]
      ? {
          discord: {
            clientId: process.env["DISCORD_CLIENT_ID"],
            clientSecret: process.env["DISCORD_CLIENT_SECRET"],
          },
        }
      : {}),
  },

  // https://www.better-auth.com/docs/authentication/email-password
  emailAndPassword: {
    enabled: true,
    // Uncomment if email verification is required
    // verifyEmail: true,
  },
});
