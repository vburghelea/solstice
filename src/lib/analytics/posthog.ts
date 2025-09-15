import { env } from "~/lib/env.client";

// Client-side PostHog initialization
export function initializePostHogClient(): void {
  // Only initialize in browser environment
  if (typeof window === "undefined") {
    return;
  }

  // Check if analytics is enabled
  if (!env.VITE_ENABLE_ANALYTICS) {
    console.debug("PostHog analytics disabled by feature flag");
    return;
  }

  if (!env.VITE_POSTHOG_KEY) {
    console.warn(
      "PostHog not configured. Missing VITE_POSTHOG_KEY environment variable.",
    );
    return;
  }

  // Dynamically import posthog-js to avoid server-side issues
  import("posthog-js")
    .then((posthog) => {
      if (!posthog.default.__loaded && env.VITE_POSTHOG_HOST) {
        try {
          posthog.default.init(env.VITE_POSTHOG_KEY!, {
            api_host: env.VITE_POSTHOG_HOST,
            capture_pageview: true,
            capture_pageleave: true,
            disable_session_recording: false,
            // Enable autocapture for automatic event tracking
            autocapture: true,
          });
          console.debug("PostHog client initialized successfully");
        } catch (error) {
          console.error("Failed to initialize PostHog client:", error);
        }
      }
    })
    .catch((error) => {
      console.error("Failed to load PostHog client library:", error);
    });
}
