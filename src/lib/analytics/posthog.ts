import type { PostHog } from "posthog-js";
import { env } from "~/lib/env.client";
import { getCspNonce } from "~/shared/lib/csp";

// Client-side PostHog initialization
let postHogInitialized = false;

function resolveCookieDomain(hostname: string): string | undefined {
  // Never set cookie_domain for local dev or single-label hosts
  const isLocal =
    hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".local");
  if (isLocal) return undefined;

  // If host already an apex/subdomain (contains a dot), use it as-is.
  // This avoids invalid domain errors on platforms like Netlify previews.
  if (hostname.includes(".")) return hostname;

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
            // Avoid invalid cookie domain warnings by scoping to the current host
            ...(cookieDomain ? { cookie_domain: cookieDomain } : {}),
            // Add additional configuration to prevent SSR issues
            loaded: () => {
              postHogInitialized = true;

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
    if (posthog) {
      posthog.capture(event, properties);
    }
  } catch (error) {
    console.error("Failed to capture PostHog event:", error);
  }
}
