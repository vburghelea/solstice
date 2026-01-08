import type { PostHog } from "posthog-js";
import { hasMeasurementConsent } from "~/features/consent/state";
import { env } from "~/lib/env.client";
import { getCspNonce } from "~/shared/lib/csp";

// Client-side PostHog initialization
let postHogInitialized = false;

function resolveCookieDomain(hostname: string): string | undefined {
  // Never set cookie_domain for local dev or single-label hosts
  const isLocal =
    hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".local");
  if (isLocal) return undefined;

  // Don't set cookie_domain for Netlify preview URLs or other complex hostnames
  // to avoid "invalid domain" errors
  if (hostname.includes("netlify")) return undefined;

  // Extract the root domain (e.g., "roundup.games" from "www.roundup.games")
  // This allows cookies to work across subdomains
  const parts = hostname.split(".");
  if (parts.length >= 2) {
    // For domains like "roundup.games", use as-is
    // For subdomains like "www.roundup.games", use "roundup.games"
    return parts.length === 2 ? hostname : parts.slice(-2).join(".");
  }

  return undefined;
}

export function initializePostHogClient(): void {
  // Only initialize in browser environment
  if (typeof window === "undefined") {
    return;
  }

  // Check if analytics is enabled
  if (!env.VITE_ENABLE_ANALYTICS) {
    return;
  }

  // Disable PostHog in development to avoid CORS errors from CDN
  // PostHog's CDN doesn't send proper CORS headers for config.js in development
  if (import.meta.env.DEV) {
    console.info("PostHog is disabled in development to avoid CORS errors");
    return;
  }

  if (!env.VITE_POSTHOG_KEY) {
    console.warn(
      "PostHog not configured. Missing VITE_POSTHOG_KEY environment variable.",
    );
    return;
  }

  // Prevent multiple initializations
  if (postHogInitialized) {
    return;
  }

  // Dynamically import posthog-js to avoid server-side issues
  import("posthog-js")
    .then((posthog) => {
      if (!posthog.default.__loaded && env.VITE_POSTHOG_HOST) {
        try {
          const cookieDomain =
            typeof window !== "undefined"
              ? resolveCookieDomain(window.location.hostname)
              : undefined;

          posthog.default.init(env.VITE_POSTHOG_KEY!, {
            api_host: env.VITE_POSTHOG_HOST,
            // Disable automatic pageview capture since we're handling it manually
            capture_pageview: false,
            capture_pageleave: true,
            disable_session_recording: false,
            // Enable autocapture for automatic event tracking
            autocapture: true,
            // Persist to both localStorage and cookies for robustness
            persistence: "localStorage+cookie",
            cookieless_mode: "on_reject",
            // Avoid invalid cookie domain warnings by scoping to the current host
            ...(cookieDomain ? { cookie_domain: cookieDomain } : {}),
            // Add additional configuration to prevent SSR issues
            loaded: () => {
              postHogInitialized = true;
              try {
                posthog.default.has_opted_out_capturing();
              } catch (error) {
                console.error("PostHog: failed to check opt-out status", error);
              }

              // Register global error handlers to capture uncaught exceptions
              try {
                // Avoid overwriting existing handlers; chain them
                const previousOnError = window.onerror;
                window.onerror = function (
                  message: string | Event,
                  source?: string,
                  lineno?: number,
                  colno?: number,
                  error?: Error,
                ) {
                  try {
                    const ph = posthog.default;
                    if (ph && ph.__loaded) {
                      ph.capture("$exception", {
                        message: error?.message ?? String(message),
                        stack: error?.stack,
                        source,
                        lineno,
                        colno,
                      });
                    }
                  } catch (e) {
                    console.error("PostHog: failed to capture window.onerror", e);
                  }

                  if (typeof previousOnError === "function") {
                    try {
                      return (
                        previousOnError as unknown as (...args: unknown[]) => unknown
                      )(message, source, lineno, colno, error);
                    } catch {
                      /* ignore */
                    }
                  }
                  return false;
                };

                const prevUnhandled = (
                  window as Window & {
                    onunhandledrejection?:
                      | ((ev: PromiseRejectionEvent) => unknown)
                      | null;
                  }
                ).onunhandledrejection;

                window.onunhandledrejection = function (ev: PromiseRejectionEvent) {
                  try {
                    const ph = posthog.default;
                    const reason = ev?.reason;
                    if (ph && ph.__loaded) {
                      ph.capture("$exception", {
                        message: reason?.message ?? String(reason),
                        stack: reason?.stack,
                        unhandled: true,
                      });
                    }
                  } catch (e) {
                    console.error("PostHog: failed to capture onunhandledrejection", e);
                  }

                  if (typeof prevUnhandled === "function") {
                    try {
                      return (prevUnhandled as (...args: unknown[]) => unknown)(ev);
                    } catch {
                      /* ignore */
                    }
                  }
                };
              } catch {
                /* ignore */
              }
            },
            prepare_external_dependency_script: (script) => {
              const nonce = getCspNonce();
              if (nonce) {
                script.setAttribute("nonce", nonce);
              }
              return script;
            },
          });
        } catch (error) {
          console.error("Failed to initialize PostHog client:", error);
        }
      } else if (posthog.default.__loaded) {
        postHogInitialized = true;
      }
    })
    .catch((error) => {
      console.error("Failed to load PostHog client library:", error);
    });
}

// Type guard to check if PostHog is properly loaded
function isPostHogLoaded(posthog: unknown): posthog is PostHog {
  return (
    posthog !== null &&
    posthog !== undefined &&
    typeof posthog === "object" &&
    "__loaded" in posthog &&
    (posthog as { __loaded: boolean }).__loaded === true
  );
}

// Helper function to get PostHog instance safely
export async function getPostHogInstance(): Promise<PostHog | null> {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const posthogModule = await import("posthog-js");
    const posthog = posthogModule.default;

    // If PostHog is already loaded, return it immediately
    if (isPostHogLoaded(posthog)) {
      return posthog;
    }

    // Wait for PostHog to be loaded if it's not already
    // This can happen if the initialization is still in progress
    return new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = 50; // Max 5 seconds (50 * 100ms)

      const checkLoaded = () => {
        attempts++;
        if (isPostHogLoaded(posthog)) {
          resolve(posthog);
        } else if (attempts < maxAttempts) {
          // Check again in 100ms
          setTimeout(checkLoaded, 100);
        } else {
          resolve(null);
        }
      };
      checkLoaded();
    });
  } catch (error) {
    console.error("Failed to get PostHog instance:", error);
    return null;
  }
}

// Helper function to capture events with debugging
export async function captureEvent(
  event: string,
  properties?: Record<string, unknown>,
): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const posthog = await getPostHogInstance();
    if (posthog && hasMeasurementConsent()) {
      posthog.capture(event, properties);
    }
  } catch (error) {
    console.error("Failed to capture PostHog event:", error);
  }
}
