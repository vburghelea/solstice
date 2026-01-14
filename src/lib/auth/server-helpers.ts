/**
 * Server-only auth helpers
 * This module contains auth configuration that requires server-side environment variables
 */
import { passkey } from "@better-auth/passkey";
import { APIError, betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthMiddleware } from "better-auth/api";
import { twoFactor } from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { getBrand } from "~/tenant";

// Lazy-loaded auth instance
let authInstance: ReturnType<typeof betterAuth> | undefined;
let authInitPromise: Promise<ReturnType<typeof betterAuth>> | undefined;

const assertServerOnly = () => {
  if (typeof window !== "undefined") {
    throw new Error("Auth helpers can only be used on the server.");
  }
};

// Create and export the auth instance with server configuration
const createAuth = async (): Promise<ReturnType<typeof betterAuth>> => {
  assertServerOnly();
  // Import server modules when auth is created
  const { db } = await import("~/db");
  const schema = await import("~/db/schema");
  const { env, getAuthSecret, getBaseUrl, isProduction } =
    await import("~/lib/env.server");
  const brand = getBrand();

  const baseUrl = getBaseUrl();
  const isHttpsDeployment = baseUrl?.startsWith("https://") ?? false;
  const cookieDomain = env.COOKIE_DOMAIN;
  const allowedOAuthDomains = Array.isArray(env.OAUTH_ALLOWED_DOMAINS)
    ? env.OAUTH_ALLOWED_DOMAINS
    : [];
  const googleClientId = env.GOOGLE_CLIENT_ID || "";
  const googleClientSecret = env.GOOGLE_CLIENT_SECRET || "";
  const microsoftClientId = env.MICROSOFT_CLIENT_ID || "";
  const microsoftClientSecret = env.MICROSOFT_CLIENT_SECRET || "";
  const microsoftTenantId = env.MICROSOFT_TENANT_ID;
  const microsoftAuthority = env.MICROSOFT_AUTHORITY;
  const microsoftPrompt = env.MICROSOFT_PROMPT;
  const appleClientId = env.APPLE_CLIENT_ID || "";
  const appleClientSecret = env.APPLE_CLIENT_SECRET || "";
  const appleAppBundleIdentifier = env.APPLE_APP_BUNDLE_IDENTIFIER;

  const microsoftConfigured = Boolean(microsoftClientId && microsoftClientSecret);
  const appleConfigured = Boolean(appleClientId && appleClientSecret);

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

  const resolveTwoFactorUserId = async (ctx: {
    context: {
      authCookies: { sessionToken: { name: string } };
      secret: string;
      internalAdapter: {
        findVerificationValue: (token: string) => Promise<{ value: string } | null>;
      };
      createAuthCookie: (name: string) => { name: string };
    };
    getSignedCookie: (name: string, secret: string) => Promise<string | false | null>;
  }) => {
    const twoFactorCookie = ctx.context.createAuthCookie("two_factor");
    const cookieResult = await ctx.getSignedCookie(
      twoFactorCookie.name,
      ctx.context.secret,
    );
    // getSignedCookie returns false if signature is invalid
    const identifier = typeof cookieResult === "string" ? cookieResult : null;
    if (!identifier) return null;

    const verification =
      await ctx.context.internalAdapter.findVerificationValue(identifier);
    return verification?.value ?? null;
  };

  const securityEventPlugin = {
    id: "security-events",
    hooks: {
      before: [
        {
          matcher(context: { path?: string }) {
            return context.path === "/sign-up/email";
          },
          handler: createAuthMiddleware(async (ctx) => {
            const password =
              typeof ctx.body?.password === "string" ? ctx.body.password : "";
            if (!password) {
              throw new APIError("BAD_REQUEST", {
                message: "Password is required",
              });
            }

            const { validatePassword } =
              await import("~/lib/security/utils/password-validator");
            const validation = validatePassword(password);
            if (!validation.isValid) {
              throw new APIError("BAD_REQUEST", {
                message: validation.errors[0] ?? "Password does not meet requirements",
              });
            }
          }),
        },
        {
          matcher(context: { path?: string }) {
            return context.path === "/sign-in/email";
          },
          handler: createAuthMiddleware(async (ctx) => {
            const email =
              typeof ctx.body?.email === "string" ? ctx.body.email.toLowerCase() : null;
            if (!email) return;

            const userResult = await ctx.context.internalAdapter.findUserByEmail(email);
            const userId = userResult?.user?.id ?? null;
            if (!userId) return;

            const { isAccountLocked } = await import("~/lib/security/lockout");
            const lock = await isAccountLocked(userId);
            if (lock) {
              throw new APIError("FORBIDDEN", {
                message: "Account locked. Contact an administrator for access.",
              });
            }
          }),
        },
        {
          matcher(context: { path?: string }) {
            return context.path === "/sign-out";
          },
          handler: createAuthMiddleware(async (ctx) => {
            const sessionToken = await ctx.getSignedCookie(
              ctx.context.authCookies.sessionToken.name,
              ctx.context.secret,
            );
            if (!sessionToken) return;

            const session = await ctx.context.internalAdapter.findSession(sessionToken);
            return {
              context: {
                securityEventUserId: session?.user?.id ?? null,
              },
            };
          }),
        },
      ],
      after: [
        {
          matcher(context: { path?: string }) {
            return (
              context.path === "/sign-in/email" ||
              context.path === "/sign-out" ||
              context.path?.startsWith("/two-factor/verify-") === true
            );
          },
          handler: createAuthMiddleware(async (ctx) => {
            const returned = ctx.context.returned;
            const isError = returned instanceof APIError;
            const headers = ctx.headers ?? new Headers();
            const userAgent = headers.get("user-agent");
            const geoCountry =
              headers.get("cf-ipcountry") ?? headers.get("x-vercel-ip-country");
            const geoRegion =
              headers.get("x-vercel-ip-country-region") ??
              headers.get("x-country-region");

            const { recordSecurityEvent } = await import("~/lib/security/events");
            const { applySecurityRules } = await import("~/lib/security/detection");

            const recordEvent = async (
              event: Omit<
                Parameters<typeof recordSecurityEvent>[0],
                "headers" | "userAgent" | "geoCountry" | "geoRegion"
              >,
            ) => {
              const created = await recordSecurityEvent({
                ...event,
                headers,
                userAgent: userAgent ?? null,
                geoCountry: geoCountry ?? null,
                geoRegion: geoRegion ?? null,
              });

              if (created?.userId) {
                await applySecurityRules({
                  userId: created.userId,
                  eventType: created.eventType,
                  eventId: created.id,
                  ipAddress: created.ipAddress,
                  userAgent: created.userAgent,
                  geoCountry: created.geoCountry,
                  geoRegion: created.geoRegion,
                });
              }

              return created;
            };

            if (ctx.path === "/sign-in/email") {
              const isTwoFactorRedirect =
                !isError &&
                returned &&
                typeof returned === "object" &&
                "twoFactorRedirect" in returned;

              if (isError) {
                const email =
                  typeof ctx.body?.email === "string"
                    ? ctx.body.email.toLowerCase()
                    : null;
                const userResult = email
                  ? await ctx.context.internalAdapter.findUserByEmail(email)
                  : null;
                await recordEvent({
                  userId: userResult?.user?.id ?? null,
                  eventType: "login_fail",
                });
                return;
              }

              if (isTwoFactorRedirect) {
                return;
              }

              const responseUserId =
                returned &&
                typeof returned === "object" &&
                "user" in returned &&
                typeof returned.user === "object"
                  ? ((returned.user as { id?: string | null }).id ?? null)
                  : null;
              const userId = responseUserId ?? ctx.context.newSession?.user?.id ?? null;

              if (userId) {
                await recordEvent({
                  userId,
                  eventType: "login_success",
                });
              }

              return;
            }

            if (ctx.path.startsWith("/two-factor/verify-")) {
              const responseUserId =
                returned &&
                typeof returned === "object" &&
                "user" in returned &&
                typeof returned.user === "object"
                  ? ((returned.user as { id?: string | null }).id ?? null)
                  : null;
              const fallbackUserId = await resolveTwoFactorUserId(ctx);
              const userId =
                responseUserId ?? ctx.context.newSession?.user?.id ?? fallbackUserId;

              if (userId) {
                if (isError) {
                  await recordEvent({
                    userId,
                    eventType: "mfa_fail",
                  });
                } else {
                  await recordEvent({
                    userId,
                    eventType: "mfa_success",
                  });
                  await recordEvent({
                    userId,
                    eventType: "login_success",
                  });
                }
              }

              return;
            }

            if (ctx.path === "/sign-out") {
              const userId = (ctx.context as { securityEventUserId?: string | null })
                .securityEventUserId;
              if (userId && !isError) {
                await recordEvent({
                  userId,
                  eventType: "logout",
                });
              }
            }
          }),
        },
      ],
    },
  };

  const trustedOrigins = isProduction()
    ? [baseUrl]
    : [
        baseUrl,
        "http://localhost:3001",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:8888",
      ];

  if (appleConfigured) {
    trustedOrigins.push("https://appleid.apple.com");
  }

  const trustedOAuthProviders = ["google"];
  if (microsoftConfigured) {
    trustedOAuthProviders.push("microsoft");
  }

  const passkeyOrigin = baseUrl ? new URL(baseUrl).origin : undefined;
  const passkeyRpId = baseUrl ? new URL(baseUrl).hostname : "localhost";

  return betterAuth({
    appName: brand.name,
    baseURL: baseUrl,
    secret: getAuthSecret(),
    trustedOrigins: Array.from(new Set(trustedOrigins)),
    database: drizzleAdapter(dbConnection, {
      provider: "pg",
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
        twoFactor: schema.twoFactor,
        passkey: schema.passkey,
      },
    }),

    // Session configuration with security settings
    session: {
      expiresIn: 60 * 60 * 8, // 8 hours
      updateAge: 60 * 30, // 30 minutes
      // NOTE: cookieCache is disabled due to a known bug with tanstackStartCookies
      // that prevents session_token cookie from being set. See:
      // https://github.com/better-auth/better-auth/issues/5639
      // Re-enable once the upstream fix is released.
    },

    // Secure cookie configuration
    advanced: {
      cookiePrefix: "solstice",
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
              mapProfileToUser: (profile: {
                email?: string | null | undefined;
                hd?: string | undefined;
              }) => {
                const email = profile.email?.toLowerCase();
                const domain = email?.split("@")[1];
                const hostedDomain = profile.hd?.toLowerCase();

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
      ...(microsoftConfigured
        ? {
            microsoft: {
              clientId: microsoftClientId,
              clientSecret: microsoftClientSecret,
              ...(microsoftTenantId ? { tenantId: microsoftTenantId } : {}),
              ...(microsoftAuthority ? { authority: microsoftAuthority } : {}),
              ...(microsoftPrompt ? { prompt: microsoftPrompt } : {}),
            },
          }
        : {}),
      ...(appleConfigured
        ? {
            apple: {
              clientId: appleClientId,
              clientSecret: appleClientSecret,
              ...(appleAppBundleIdentifier
                ? { appBundleIdentifier: appleAppBundleIdentifier }
                : {}),
            },
          }
        : {}),
    },

    // Email and password authentication
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: isProduction(),
    },

    // Account linking configuration
    account: {
      accountLinking: {
        enabled: true,
        trustedProviders: trustedOAuthProviders, // Auto-link these providers
      },
    },

    // https://www.better-auth.com/docs/integrations/tanstack#usage-tips
    plugins: [
      twoFactor({
        issuer: brand.name,
        totpOptions: {
          digits: 6,
          period: 30,
        },
        backupCodeOptions: {
          amount: 10,
          length: 8,
        },
      }),
      passkey({
        rpID: passkeyRpId,
        rpName: brand.name,
        ...(passkeyOrigin ? { origin: passkeyOrigin } : {}),
      }),
      securityEventPlugin,
      tanstackStartCookies(), // MUST be the last plugin
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
export const getAuth = async (): Promise<ReturnType<typeof betterAuth>> => {
  assertServerOnly();

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
