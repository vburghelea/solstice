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

    // SST/AWS Lambda
    SST_STAGE: z.string().optional(),
    AWS_LAMBDA_FUNCTION_NAME: z.string().optional(),
    AWS_EXECUTION_ENV: z.string().optional(),

    // Base URL (set via SST secrets in production, VITE_BASE_URL in dev)
    VITE_BASE_URL: z.url().optional(),
  },
  // Use process.env since we've just loaded .env
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});

// Helper functions
export const getDbUrl = () => env.DATABASE_URL;

export const getPooledDbUrl = () => env.DATABASE_URL;

export const getUnpooledDbUrl = () => env.DATABASE_URL_UNPOOLED || env.DATABASE_URL;

export const getBaseUrl = () => {
  // SST sets BASE_URL via secrets in production
  const sst = process.env["BASE_URL"];
  const explicit = env.VITE_BASE_URL;

  const candidate = sst || explicit;

  if (!candidate) {
    throw new Error(
      "Base URL is unknown. Set BASE_URL (SST) or VITE_BASE_URL (local dev).",
    );
  }

  return candidate;
};

export const getAuthSecret = () => env.BETTER_AUTH_SECRET;

export const isProduction = () => env.NODE_ENV === "production";
export const isDevelopment = () => env.NODE_ENV === "development";
export const isTest = () => env.NODE_ENV === "test";

export const isServerless = () =>
  !!(process.env["AWS_LAMBDA_FUNCTION_NAME"] || process.env["AWS_EXECUTION_ENV"]);

export const isAWSLambda = () =>
  !!(process.env["AWS_LAMBDA_FUNCTION_NAME"] || process.env["AWS_EXECUTION_ENV"]);

export const getSSTStage = () => process.env["SST_STAGE"];
