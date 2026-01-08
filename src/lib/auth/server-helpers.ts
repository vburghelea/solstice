/**
 * Server-only auth helpers
 * This module contains auth configuration that requires server-side environment variables
 */
import { APIError, betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthMiddleware } from "better-auth/api";
import { emailOTP } from "better-auth/plugins";
import { sendEmailVerificationOTP, sendSignInOTP } from "~/lib/email/otp-emails";
import {
  sendEmailVerification,
  sendPasswordResetEmail,
  sendWelcomeEmail,
} from "~/lib/email/resend";

// Lazy-loaded auth instance
let authInstance: ReturnType<typeof betterAuth> | null = null;
let authInitPromise: Promise<ReturnType<typeof betterAuth>> | null = null;

// Create and export the auth instance with server configuration
const createAuth = async () => {
  // Import server modules when auth is created
  const { db } = await import("~/db");
  const schema = await import("~/db/schema");
  const { env, getAuthSecret, getBaseUrl, isProduction } =
    await import("~/lib/env.server");

  const baseUrl = getBaseUrl();
  const isHttpsDeployment = baseUrl?.startsWith("https://") ?? false;
  const cookieDomain = env.COOKIE_DOMAIN;
  const allowedOAuthDomains = Array.isArray(env.OAUTH_ALLOWED_DOMAINS)
    ? env.OAUTH_ALLOWED_DOMAINS
    : [];

  // Debug OAuth configuration
  const googleClientId = env.GOOGLE_CLIENT_ID || "";
  const googleClientSecret = env.GOOGLE_CLIENT_SECRET || "";
  const discordClientId = env.DISCORD_CLIENT_ID || "";
  const discordClientSecret = env.DISCORD_CLIENT_SECRET || "";

  if (process.env["NODE_ENV"] !== "production") {
    console.log("Auth config loading...");
    console.log("Base URL:", baseUrl);

    console.log(
      "Google Client ID:",
      googleClientId ? `Set (${googleClientId.substring(0, 10)}...)` : "Missing",
    );
    console.log("Google Client Secret:", googleClientSecret ? "Set" : "Missing");
    if (allowedOAuthDomains.length > 0) {
      console.log("OAuth allowed domains:", allowedOAuthDomains.join(", "));
    }
  }

  // Get database connection
  const dbConnection = await db();

  return betterAuth({
    baseURL: baseUrl,
    secret: getAuthSecret(),
    trustedOrigins: isProduction()
      ? [baseUrl]
      : [
          baseUrl,
          "http://localhost:5173",
          "http://localhost:5174",
          "http://localhost:8888",
        ],
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
      cookiePrefix: "roundup",
      useSecureCookies: isHttpsDeployment,
      defaultCookieAttributes: cookieDomain
        ? {
            secure: isHttpsDeployment,
            sameSite: "lax",
            httpOnly: true,
            path: "/",
            domain: cookieDomain,
          }
        : {
            secure: isHttpsDeployment,
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
        ...(allowedOAuthDomains.length > 0
          ? {
              mapProfileToUser: (profile) => {
                const email = profile.email?.toLowerCase();
                const domain = email?.split("@")[1];
                const hostedDomain = (profile as { hd?: string }).hd?.toLowerCase();

                const isAllowed = [domain, hostedDomain]
                  .filter((value): value is string => Boolean(value))
                  .some((value) => allowedOAuthDomains.includes(value));

                if (!isAllowed) {
                  const allowedList =
                    allowedOAuthDomains.length === 1
                      ? allowedOAuthDomains[0]
                      : allowedOAuthDomains.join(", ");
                  throw new APIError("UNAUTHORIZED", {
                    message: `Access restricted. Please sign in with an approved domain (${allowedList}).`,
                  });
                }

                return {};
              },
            }
          : {}),
      },
      discord: {
        clientId: discordClientId,
        clientSecret: discordClientSecret,
      },
    },

    // Email and password authentication
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: isProduction(),
      sendResetPassword: async (params: {
        user: { email: string; name?: string };
        url: string;
        token: string;
      }): Promise<void> => {
        const baseUrl = getBaseUrl();
        const resetClientUrl = `${baseUrl}/auth/reset-password?token=${params.token}`;

        try {
          const result = await sendPasswordResetEmail({
            to: { email: params.user.email, name: params.user.name },
            resetUrl: resetClientUrl,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Assuming 24 hours expiry for reset links
          });

          if (!result.success) {
            console.error("Failed to send password reset email:", result.error);
          }
        } catch (error) {
          console.error("Error sending password reset email:", error);
        }
      },
    },

    emailVerification: {
      sendVerificationEmail: async ({
        user,
        url,
      }: {
        user: { email: string; name?: string };
        url: string;
        token: string;
      }) => {
        try {
          const result = await sendEmailVerification({
            to: { email: user.email, name: user.name },
            verificationUrl: url,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          });

          if (!result.success) {
            console.error("Failed to send verification email:", result.error);
          }
        } catch (error) {
          console.error("Error sending verification email:", error);
        }
      },
      sendOnSignUp: true,
    },

    // Account linking configuration
    account: {
      accountLinking: {
        enabled: true,
        trustedProviders: ["google"], // Auto-link these providers
      },
    },

    hooks: {
      after: createAuthMiddleware(async (ctx) => {
        if (env.WELCOME_EMAIL_ENABLED && ctx.path.startsWith("/sign-up")) {
          const newUser = ctx.context.newSession?.user;
          if (newUser) {
            try {
              await sendWelcomeEmail({
                to: {
                  email: newUser.email,
                  name: newUser.name || undefined,
                },
                profileUrl: `${baseUrl}/player/profile`,
              });
            } catch (error) {
              console.error("Error sending welcome email:", error);
            }
          }
        }
      }),
    },

    // https://www.better-auth.com/docs/integrations/tanstack#usage-tips
    plugins: [
      emailOTP({
        async sendVerificationOTP({ email, otp, type }) {
          if (type === "email-verification") {
            await sendEmailVerificationOTP({ to: { email }, otp });
          } else if (type === "sign-in") {
            await sendSignInOTP({ to: { email }, otp });
          }
        },
      }),
    ],
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
  if (authInstance) {
    return authInstance;
  }

  if (!authInitPromise) {
    authInitPromise = createAuth().then((instance) => {
      authInstance = instance;
      return instance;
    });
  }

  return authInitPromise;
};
