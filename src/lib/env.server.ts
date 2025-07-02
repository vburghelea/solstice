/**
 * Server-only environment configuration
 * This module should only be imported in server-side code
 */

// Simple server environment access - no complex loading
export const serverEnv = {
  // Database
  DATABASE_URL: process.env["DATABASE_URL"]!,
  DATABASE_URL_UNPOOLED: process.env["DATABASE_URL_UNPOOLED"],
  DATABASE_POOLED_URL: process.env["DATABASE_POOLED_URL"],
  DATABASE_UNPOOLED_URL: process.env["DATABASE_UNPOOLED_URL"],
  NETLIFY_DATABASE_URL: process.env["NETLIFY_DATABASE_URL"],
  NETLIFY_DATABASE_URL_UNPOOLED: process.env["NETLIFY_DATABASE_URL_UNPOOLED"],

  // Auth
  BETTER_AUTH_SECRET:
    process.env["BETTER_AUTH_SECRET"] || "dev-secret-change-in-production",
  GOOGLE_CLIENT_ID: process.env["GOOGLE_CLIENT_ID"],
  GOOGLE_CLIENT_SECRET: process.env["GOOGLE_CLIENT_SECRET"],

  // Other
  COOKIE_DOMAIN: process.env["COOKIE_DOMAIN"],
  NODE_ENV: process.env["NODE_ENV"] || "development",
  NETLIFY: process.env["NETLIFY"],
  VERCEL_ENV: process.env["VERCEL_ENV"],

  // Client vars are also available on server
  VITE_BASE_URL: process.env["VITE_BASE_URL"]!,
} as const;

// Helper functions
export const getDbUrl = () => serverEnv.DATABASE_URL;

export const getPooledDbUrl = () =>
  serverEnv.DATABASE_POOLED_URL ||
  serverEnv.NETLIFY_DATABASE_URL ||
  serverEnv.DATABASE_URL;

export const getUnpooledDbUrl = () =>
  serverEnv.DATABASE_UNPOOLED_URL ||
  serverEnv.DATABASE_URL_UNPOOLED ||
  serverEnv.NETLIFY_DATABASE_URL_UNPOOLED ||
  serverEnv.DATABASE_URL;

export const getBaseUrl = () => serverEnv.VITE_BASE_URL;
export const getAuthSecret = () => serverEnv.BETTER_AUTH_SECRET;

export const isProduction = () => serverEnv.NODE_ENV === "production";
export const isDevelopment = () => serverEnv.NODE_ENV === "development";
export const isTest = () => serverEnv.NODE_ENV === "test";
export const isServerless = () => !!(serverEnv.NETLIFY || serverEnv.VERCEL_ENV);
