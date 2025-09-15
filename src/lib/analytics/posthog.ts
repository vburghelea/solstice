import { env } from "~/lib/env.client";

// Client-side PostHog initialization
let postHogInitialized = false;

export function initializePostHogClient(): void {
  // Only initialize in browser environment
  if (typeof window === "undefined") {
    console.debug("PostHog: Skipping initialization in server environment");
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

  console.debug("PostHog: Initializing client with key:", env.VITE_POSTHOG_KEY);
  console.debug("PostHog: Using host:", env.VITE_POSTHOG_HOST);

  // Prevent multiple initializations
  if (postHogInitialized) {
    console.debug("PostHog: Client already initialized");
    return;
  }

  // Dynamically import posthog-js to avoid server-side issues
  import("posthog-js")
    .then((posthog) => {
      if (!posthog.default.__loaded && env.VITE_POSTHOG_HOST) {
        try {
          console.debug("PostHog: Initializing PostHog client");
          posthog.default.init(env.VITE_POSTHOG_KEY!, {
            api_host: env.VITE_POSTHOG_HOST,
            capture_pageview: true,
            capture_pageleave: true,
            disable_session_recording: false,
            // Enable autocapture for automatic event tracking
            autocapture: true,
            // Add additional configuration to prevent SSR issues
            loaded: (posthogInstance) => {
              postHogInitialized = true;
              console.debug("PostHog client initialized successfully");
              // Debug: Log the posthog instance
              console.debug("PostHog instance:", posthogInstance);
            },
          });
        } catch (error) {
          console.error("Failed to initialize PostHog client:", error);
        }
      } else if (posthog.default.__loaded) {
        postHogInitialized = true;
        console.debug("PostHog client already loaded");
      } else {
        console.debug("PostHog: Client not loaded, skipping initialization");
      }
    })
    .catch((error) => {
      console.error("Failed to load PostHog client library:", error);
    });
}

// Helper function to get PostHog instance safely
export async function getPostHogInstance() {
  if (typeof window === "undefined") {
    console.debug("PostHog: Cannot get instance in server environment");
    return null;
  }

  try {
    const posthog = await import("posthog-js");
    const instance = posthog.default.__loaded ? posthog.default : null;
    console.debug("PostHog: Got instance:", !!instance);
    return instance;
  } catch (error) {
    console.error("Failed to get PostHog instance:", error);
    return null;
  }
}

// Helper function to capture events with debugging
export async function captureEvent(event: string, properties?: Record<string, unknown>) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const posthog = await getPostHogInstance();
    if (posthog) {
      console.debug("PostHog: Capturing event:", event, properties);
      posthog.capture(event, properties);
    } else {
      console.debug("PostHog: Cannot capture event, client not initialized");
    }
  } catch (error) {
    console.error("Failed to capture PostHog event:", error);
  }
}
