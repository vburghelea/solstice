/**
 * Client-safe environment variables
 * Only VITE_ prefixed variables are available in the browser
 */

import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  clientPrefix: "VITE_",
  client: {
    VITE_BASE_URL: z.string().url(),
    VITE_ENABLE_ANALYTICS: z.boolean().default(false),
    VITE_ENABLE_SENTRY: z.boolean().default(false),
    VITE_POSTHOG_KEY: z.string().optional(),
    VITE_SENTRY_DSN: z.string().optional(),
  },
  runtimeEnv: import.meta.env,
  emptyStringAsUndefined: true,
  // Workaround for VITE_BASE_URL validation during SSR
  // See: https://github.com/t3-oss/t3-env/issues/110
  skipValidation: !!process.env["SKIP_ENV_VALIDATION"],
});

// Helper functions for client-side feature flags
export const isAnalyticsEnabled = () => env.VITE_ENABLE_ANALYTICS;
export const isSentryEnabled = () => env.VITE_ENABLE_SENTRY;

// Determine the correct base URL
const getClientBaseUrl = () => {
  // In the browser, use the current origin
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  // During SSR, fall back to the validated VITE_BASE_URL
  return env.VITE_BASE_URL;
};

export const getBaseUrl = () => getClientBaseUrl();
