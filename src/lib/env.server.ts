/**
 * Server-only environment configuration
 * This module should only be imported in server-side code
 */

// This module should only be imported in server-side code

// Load dotenv synchronously before createEnv is called
import dotenv from "dotenv";
if (import.meta.env.SSR && import.meta.env.DEV) {
  dotenv.config();
  dotenv.config({ path: ".env", override: true });
}

import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

import { parseOAuthAllowedDomains } from "./env/oauth-domain";

export const env = createEnv({
  server: {
    // Database
    DATABASE_URL: z.url(),
    DATABASE_URL_UNPOOLED: z.url().optional(),
    DATABASE_POOLED_URL: z.url().optional(),
    DATABASE_UNPOOLED_URL: z.url().optional(),
    NETLIFY_DATABASE_URL: z.url().optional(),
    NETLIFY_DATABASE_URL_UNPOOLED: z.url().optional(),

    // Auth - Secret must be set explicitly, no fallbacks
    // Generate with: node scripts/generate-auth-secret.js
    BETTER_AUTH_SECRET: z
      .string()
      .min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    OAUTH_ALLOWED_DOMAINS: z
      .string()
      .optional()
      .transform((value, ctx) => {
        try {
          return parseOAuthAllowedDomains(value);
        } catch (error) {
          ctx.addIssue({
            code: "custom",
            message:
              error instanceof Error
                ? error.message
                : "Invalid OAuth allowed domains configuration",
            path: ["OAUTH_ALLOWED_DOMAINS"],
          });
          return z.NEVER;
        }
      }),

    // Square Payment Integration
    SQUARE_ENV: z.enum(["sandbox", "production"]).optional(),
    SQUARE_APPLICATION_ID: z.string().optional(),
    SQUARE_ACCESS_TOKEN: z.string().optional(),
    SQUARE_LOCATION_ID: z.string().optional(),
    SQUARE_WEBHOOK_SIGNATURE_KEY: z.string().optional(),
    SQUARE_WEBHOOK_URL: z.url().optional(),
    SUPPORT_EMAIL: z.email().optional(),

    // SendGrid Email Integration
    SENDGRID_API_KEY: z.string().optional(),
    SENDGRID_FROM_EMAIL: z.email().optional(),
    SENDGRID_FROM_NAME: z.string().optional(),

    // Other
    COOKIE_DOMAIN: z.string().optional(),
    NODE_ENV: z.enum(["development", "production", "test"]).prefault("development"),
    NETLIFY: z.string().optional(),
    VERCEL_ENV: z.string().optional(),

    // SST/AWS Lambda
    SST_STAGE: z.string().optional(),
    AWS_LAMBDA_FUNCTION_NAME: z.string().optional(),
    AWS_EXECUTION_ENV: z.string().optional(),

    // Client vars are also available on server
    // In production, Netlify provides URL env var
    VITE_BASE_URL: z.url().optional(),

    // Netlify automatically provides these
    URL: z.url().optional(), // The main URL of the site
    SITE_URL: z.url().optional(), // The site's URL
    DEPLOY_URL: z.url().optional(), // The specific deploy URL
    DEPLOY_PRIME_URL: z.url().optional(), // The prime URL for the deploy
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
  const explicit = env.VITE_BASE_URL;
  const netlifyUrl = env.URL || env.SITE_URL || env.DEPLOY_PRIME_URL || env.DEPLOY_URL;
  const vercelCandidate = process.env["NEXT_PUBLIC_VERCEL_URL"];
  const vercelUrl = vercelCandidate
    ? vercelCandidate.startsWith("http")
      ? vercelCandidate
      : `https://${vercelCandidate}`
    : undefined;

  const candidate = explicit || netlifyUrl || vercelUrl;

  if (!candidate) {
    throw new Error(
      "Base URL is unknown. Set VITE_BASE_URL or rely on Netlify/Vercel provided URLs.",
    );
  }

  return candidate;
};
export const getAuthSecret = () => env.BETTER_AUTH_SECRET;

export const isProduction = () => env.NODE_ENV === "production";
export const isDevelopment = () => env.NODE_ENV === "development";
export const isTest = () => env.NODE_ENV === "test";
export const isServerless = () =>
  !!(
    env.NETLIFY ||
    env.VERCEL_ENV ||
    process.env["VERCEL"] === "1" ||
    // AWS Lambda detection
    process.env["AWS_LAMBDA_FUNCTION_NAME"] ||
    process.env["AWS_EXECUTION_ENV"]
  );

export const isAWSLambda = () =>
  !!(process.env["AWS_LAMBDA_FUNCTION_NAME"] || process.env["AWS_EXECUTION_ENV"]);

export const getSSTStage = () => process.env["SST_STAGE"];
