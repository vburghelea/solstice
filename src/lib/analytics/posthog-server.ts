/**
 * Server-side PostHog helper (singleton)
 *
 * Only import this module from server-side code. It reads from process.env directly
 * to avoid polluting client bundles. Designed to be safe for serverless environments.
 */

import { PostHog } from "posthog-node";

let posthogInstance: PostHog | null = null;

interface InitOptions {
  host?: string;
  flushAt?: number;
  flushInterval?: number;
}

/**
 * Initialize and return a singleton PostHog server client.
 * Reads credentials from environment variables (server-first, falls back to Vite client vars):
 *  - POSTHOG_API_KEY / POSTHOG_PERSONAL_API_KEY / POSTHOG_KEY / VITE_POSTHOG_KEY
 *  - VITE_POSTHOG_HOST / NEXT_PUBLIC_POSTHOG_HOST / POSTHOG_HOST (optional, defaults to https://app.posthog.com)
 */
export function getPostHogServer(options: InitOptions = {}): PostHog {
  if (posthogInstance) return posthogInstance;

  // Prefer explicit server API key, but fall back to other common env names or Vite vars
  const apiKey =
    process.env["POSTHOG_API_KEY"] ||
    process.env["POSTHOG_PERSONAL_API_KEY"] ||
    process.env["POSTHOG_KEY"] ||
    process.env["VITE_POSTHOG_KEY"];

  if (!apiKey) {
    throw new Error(
      "PostHog server not configured. Missing server API key. Provide POSTHOG_API_KEY (or VITE_POSTHOG_KEY as fallback).",
    );
  }

  const host =
    options.host ||
    process.env["VITE_POSTHOG_HOST"] ||
    process.env["NEXT_PUBLIC_POSTHOG_HOST"] ||
    process.env["POSTHOG_HOST"] ||
    "https://app.posthog.com";

  // small sensible defaults for server usage (flush quickly)
  const initOptions = {
    host,
    flushAt: options.flushAt ?? 1,
    flushInterval: options.flushInterval ?? 0,
  };

  posthogInstance = new PostHog(apiKey, initOptions);
  // enable verbose debug in development if needed
  if (process.env["NODE_ENV"] !== "production") {
    try {
      // PostHog client exposes `.debug()` in some versions - call if present
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      if (typeof posthogInstance.debug === "function") posthogInstance.debug(true);
    } catch {
      /* ignore */
    }
  }

  return posthogInstance;
}

/**
 * Capture an exception on the server and link it to a distinct_id when available.
 * Uses a $exception event with message + stack in properties to align with PostHog error tracking.
 */
export async function captureExceptionOnServer(
  error: unknown,
  distinctId?: string,
  properties: Record<string, unknown> = {},
): Promise<void> {
  try {
    const posthog = getPostHogServer();
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;

    posthog.capture({
      distinctId: distinctId || "server",
      event: "$exception",
      properties: {
        message,
        stack,
        environment: process.env["NODE_ENV"] || "unknown",
        ...properties,
      },
    });
  } catch (e) {
    // Never throw from error instrumentation
    // Keep this minimal and log to console so we always surface failures during deploy/dev
    console.error("PostHog: Failed to capture exception on server:", e);
  }
}

/**
 * Gracefully flush and shutdown PostHog client. Useful in serverless contexts.
 */
export async function shutdownPostHog(): Promise<void> {
  if (!posthogInstance) return;
  try {
    await posthogInstance.flush?.();
    posthogInstance.shutdown?.();
  } catch (e) {
    console.error("PostHog: Failed to flush/shutdown:", e);
  } finally {
    posthogInstance = null;
  }
}
