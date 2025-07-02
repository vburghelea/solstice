/**
 * Client-safe environment variables
 * Only VITE_ prefixed variables are available in the browser
 */

// Determine the correct base URL
const getClientBaseUrl = () => {
  // In the browser, use the current origin
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  // During SSR, fall back to the VITE_BASE_URL
  return import.meta.env["VITE_BASE_URL"] || "http://localhost:8888";
};

export const clientEnv = {
  VITE_BASE_URL: getClientBaseUrl(),
  VITE_ENABLE_ANALYTICS: import.meta.env["VITE_ENABLE_ANALYTICS"] === "true",
  VITE_ENABLE_SENTRY: import.meta.env["VITE_ENABLE_SENTRY"] === "true",
  VITE_POSTHOG_KEY: import.meta.env["VITE_POSTHOG_KEY"] as string | undefined,
  VITE_SENTRY_DSN: import.meta.env["VITE_SENTRY_DSN"] as string | undefined,
} as const;

// Helper functions for client-side feature flags
export const isAnalyticsEnabled = () => clientEnv.VITE_ENABLE_ANALYTICS;
export const isSentryEnabled = () => clientEnv.VITE_ENABLE_SENTRY;
export const getBaseUrl = () => clientEnv.VITE_BASE_URL;
