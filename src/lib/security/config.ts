/**
 * Security configuration for the application
 * Centralizes all security-related settings
 */

import { env, getBaseUrl, isProduction } from "~/lib/env.server";
import { PASSWORD_CONFIG } from "./password-config";

// This module should only be imported in server-side code

export const securityConfig = {
  // Cookie security settings
  cookies: {
    httpOnly: true,
    sameSite: "lax" as const,
    // Force secure cookies in production or when base URL starts with https://
    // This ensures secure cookies even in preview deployments where NODE_ENV might be "test"
    secure: isProduction() || getBaseUrl().startsWith("https://"),
    path: "/",
    // Optional domain restriction for production
    // Set COOKIE_DOMAIN env var to restrict cookies to specific domain
    ...(isProduction() && env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
  },

  // Session configuration
  session: {
    maxAge: 60 * 60 * 8, // 8 hours
    updateAge: 60 * 30, // 30 minutes
    cookieCache: {
      enabled: false,
      maxAge: 60 * 5, // 5 minutes
    },
  },

  // CORS configuration
  cors: {
    credentials: true,
    origin: getBaseUrl(),
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Organization-Id"],
  },

  // Rate limiting defaults
  rateLimit: {
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // 5 requests per window
    },
    api: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // 100 requests per window
    },
  },

  // Password requirements (using shared config)
  password: {
    ...PASSWORD_CONFIG,
    maxLength: 128, // Additional server-side constraint
  },

  // OAuth configuration
  oauth: {
    // Allowed email domains for OAuth sign-ups (comma-separated in env)
    // Example: OAUTH_ALLOWED_DOMAINS=company.com,partner.com
    allowedDomains: env.OAUTH_ALLOWED_DOMAINS,
  },
} as const;

export const SECURITY_THRESHOLDS = {
  loginFailures: {
    flagThreshold: 3,
    flagWindowMs: 15 * 60 * 1000,
    lockThreshold: 5,
    lockWindowMs: 15 * 60 * 1000,
    lockDurationMs: 30 * 60 * 1000,
  },
  mfaFailures: {
    flagThreshold: 2,
    flagWindowMs: 5 * 60 * 1000,
    lockThreshold: 3,
    lockWindowMs: 5 * 60 * 1000,
    lockDurationMs: 15 * 60 * 1000,
  },
  newContext: {
    riskScoreThreshold: 50,
    lookbackLimit: 10,
  },
} as const;

// Type exports
export type SecurityConfig = typeof securityConfig;
export type CookieConfig = typeof securityConfig.cookies;
export type SessionConfig = typeof securityConfig.session;
