import { PostHog } from "posthog-node";
import { env, isAnalyticsEnabled } from "~/lib/env.client";

// Server-side PostHog client
let postHogClient: PostHog | null = null;

export function getPostHogServerClient(): PostHog | null {
  // Check if analytics is enabled
  if (!isAnalyticsEnabled()) {
    console.debug("PostHog analytics disabled by feature flag");
    return null;
  }

  if (!env.VITE_POSTHOG_KEY || !env.VITE_POSTHOG_HOST) {
    console.warn("PostHog not configured. Missing environment variables.");
    return null;
  }

  if (!postHogClient) {
    try {
      postHogClient = new PostHog(env.VITE_POSTHOG_KEY, {
        host: env.VITE_POSTHOG_HOST,
        flushAt: 1,
        flushInterval: 0,
      });
      console.debug("PostHog server client initialized successfully");
    } catch (error) {
      console.error("Failed to initialize PostHog server client:", error);
      return null;
    }
  }

  return postHogClient;
}

// Client-side PostHog initialization
export function initializePostHogClient(): void {
  // Check if analytics is enabled
  if (!isAnalyticsEnabled()) {
    console.debug("PostHog analytics disabled by feature flag");
    return;
  }

  if (typeof window !== "undefined" && env.VITE_POSTHOG_KEY) {
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
}
