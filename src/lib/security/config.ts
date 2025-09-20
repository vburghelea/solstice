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
    maxAge: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // Update session if older than 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },

  // CORS configuration
  cors: {
    credentials: true,
    origin: getBaseUrl(),
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
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

// Type exports
export type SecurityConfig = typeof securityConfig;
export type CookieConfig = typeof securityConfig.cookies;
export type SessionConfig = typeof securityConfig.session;
