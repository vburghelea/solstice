/**
 * Server-only environment configuration
 * This module should only be imported in server-side code
 */

// Load environment variables from .env during development
import { config as dotenvConfig } from "dotenv";
dotenvConfig();

import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    // Database
    DATABASE_URL: z.string().url(),
    DATABASE_URL_UNPOOLED: z.string().url().optional(),
    DATABASE_POOLED_URL: z.string().url().optional(),
    DATABASE_UNPOOLED_URL: z.string().url().optional(),
    NETLIFY_DATABASE_URL: z.string().url().optional(),
    NETLIFY_DATABASE_URL_UNPOOLED: z.string().url().optional(),

    // Auth
    BETTER_AUTH_SECRET: z
      .string()
      .min(1, "BETTER_AUTH_SECRET must be set")
      .default("dev-secret-change-in-production"),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),

    // Other
    COOKIE_DOMAIN: z.string().optional(),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    NETLIFY: z.string().optional(),
    VERCEL_ENV: z.string().optional(),

    // Client vars are also available on server
    // In production, Netlify provides URL env var
    VITE_BASE_URL: z.string().url().optional(),

    // Netlify automatically provides these
    URL: z.string().url().optional(), // The main URL of the site
    SITE_URL: z.string().url().optional(), // The site's URL
    DEPLOY_URL: z.string().url().optional(), // The specific deploy URL
    DEPLOY_PRIME_URL: z.string().url().optional(), // The prime URL for the deploy
  },
  // Use process.env since we've just loaded .env
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});

// Helper functions
export const getDbUrl = () => env.DATABASE_URL;

export const getPooledDbUrl = () =>
  env.DATABASE_POOLED_URL || env.NETLIFY_DATABASE_URL || env.DATABASE_URL;

export const getUnpooledDbUrl = () =>
  env.DATABASE_UNPOOLED_URL ||
  env.DATABASE_URL_UNPOOLED ||
  env.NETLIFY_DATABASE_URL_UNPOOLED ||
  env.DATABASE_URL;

export const getBaseUrl = () => {
  // In production, use Netlify's automatically provided URLs
  if (isProduction() || env.NETLIFY) {
    // Priority: URL > SITE_URL > DEPLOY_PRIME_URL > DEPLOY_URL
    return (
      env.URL ||
      env.SITE_URL ||
      env.DEPLOY_PRIME_URL ||
      env.DEPLOY_URL ||
      "https://app.netlify.com"
    );
  }
  // In development/test, require VITE_BASE_URL
  if (!env.VITE_BASE_URL) {
    throw new Error("VITE_BASE_URL is required in development");
  }
  return env.VITE_BASE_URL;
};
export const getAuthSecret = () => env.BETTER_AUTH_SECRET;

export const isProduction = () => env.NODE_ENV === "production";
export const isDevelopment = () => env.NODE_ENV === "development";
export const isTest = () => env.NODE_ENV === "test";
export const isServerless = () => !!(env.NETLIFY || env.VERCEL_ENV);
