import { useConsentManager } from "@c15t/react";
import { useRouter } from "@tanstack/react-router";
import { ReactNode, useEffect } from "react";
import {
  captureEvent,
  getPostHogInstance,
  initializePostHogClient,
} from "~/lib/analytics/posthog";
import { AuthUser } from "~/lib/auth/types";
import { isAnalyticsEnabled } from "~/lib/env.client";

export const PostHogProvider = ({
  children,
  user,
}: {
  children: ReactNode;
  user: AuthUser | null; // Allow null user
}) => {
  const router = useRouter();
  const { consents } = useConsentManager();
  const measurementAllowed = Boolean(consents.measurement);

  // Initialize PostHog client when provider mounts
  useEffect(() => {
    if (typeof window !== "undefined" && isAnalyticsEnabled()) {
      try {
        initializePostHogClient();
      } catch (error) {
        console.error("Failed to initialize PostHog client:", error);
      }
    }
  }, []);

  // Handle user identification
  useEffect(() => {
    if (typeof window === "undefined" || !isAnalyticsEnabled() || !measurementAllowed) {
      return;
    }

    // If user is null or undefined, reset PostHog
    if (!user) {
      getPostHogInstance()
        .then((posthog) => {
          if (posthog) {
            try {
              posthog.reset();
            } catch (error) {
              console.error("Failed to reset PostHog:", error);
            }
          }
        })
        .catch((error) => {
          console.error("Failed to load PostHog client for reset:", error);
        });
      return;
    }

    // Load PostHog client instance and identify user
    getPostHogInstance()
      .then((posthog) => {
        if (posthog) {
          try {
            posthog.identify(user.id, {
              email: user.email,
              name: user.name,
            });
          } catch (error) {
            console.error("Failed to identify user in PostHog:", error);
          }
        }
      })
      .catch((error) => {
        console.error("Failed to load PostHog client for user identification:", error);
      });
  }, [user, measurementAllowed]);

  useEffect(() => {
    if (typeof window === "undefined" || !isAnalyticsEnabled()) {
      return;
    }

    getPostHogInstance()
      .then((posthog) => {
        if (!posthog) {
          return;
        }

        if (measurementAllowed) {
          try {
            posthog.opt_in_capturing();
          } catch (error) {
            console.error("Failed to opt into PostHog capturing:", error);
          }
        } else {
          try {
            posthog.opt_out_capturing();
            posthog.reset();
          } catch (error) {
            console.error("Failed to opt out of PostHog capturing:", error);
          }
        }
      })
      .catch((error) => {
        console.error("Failed to update PostHog consent state:", error);
      });
  }, [measurementAllowed]);

  // Handle pageview tracking
  useEffect(() => {
    if (typeof window === "undefined" || !isAnalyticsEnabled() || !measurementAllowed) {
      return;
    }

    // Capture initial pageview when component mounts
    captureEvent("$pageview").catch((error) => {
      console.error("Failed to capture initial pageview event:", error);
    });

    const unsubscribe = router.subscribe("onResolved", () => {
      // Use the captureEvent helper function
      captureEvent("$pageview").catch((error) => {
        console.error("Failed to capture pageview event:", error);
      });
    });

    return unsubscribe;
  }, [router, measurementAllowed]);
  return <>{children}</>;
};
