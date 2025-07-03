/**
 * Security configuration for the application
 * Centralizes all security-related settings
 */

import { env } from "@/lib/env.server";

export const securityConfig = {
  // Cookie security settings
  cookies: {
    httpOnly: true,
    sameSite: "lax" as const,
    // Force secure cookies when VITE_BASE_URL starts with https://
    // This ensures secure cookies even in preview deployments where NODE_ENV might be "test"
    secure: env.VITE_BASE_URL.startsWith("https://"),
    path: "/",
    // Optional domain restriction for production
    // Set COOKIE_DOMAIN env var to restrict cookies to specific domain
    ...(process.env["NODE_ENV"] === "production" && process.env["COOKIE_DOMAIN"]
      ? { domain: process.env["COOKIE_DOMAIN"] }
      : {}),
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
    origin: process.env["VITE_BASE_URL"] || "http://localhost:8888",
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

  // Password requirements
  password: {
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
  },

  // OAuth configuration
  oauth: {
    // Allowed email domains for OAuth sign-ups (comma-separated in env)
    // Example: OAUTH_ALLOWED_DOMAINS=company.com,partner.com
    allowedDomains: process.env["OAUTH_ALLOWED_DOMAINS"]?.split(",") || [],
  },
} as const;

// Type exports
export type SecurityConfig = typeof securityConfig;
export type CookieConfig = typeof securityConfig.cookies;
export type SessionConfig = typeof securityConfig.session;
