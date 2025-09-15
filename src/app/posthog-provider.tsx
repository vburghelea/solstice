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

  // Initialize PostHog client when provider mounts
  useEffect(() => {
    console.debug("PostHogProvider: Initializing PostHog client");
    if (typeof window !== "undefined" && isAnalyticsEnabled()) {
      try {
        console.debug("PostHogProvider: Calling initializePostHogClient");
        initializePostHogClient();
      } catch (error) {
        console.error("Failed to initialize PostHog client:", error);
      }
    } else {
      console.debug(
        "PostHogProvider: Skipping initialization - window undefined or analytics disabled",
      );
      console.debug("PostHogProvider: window undefined:", typeof window === "undefined");
      console.debug("PostHogProvider: analytics enabled:", isAnalyticsEnabled());
    }
  }, []);

  // Handle user identification
  useEffect(() => {
    console.debug("PostHogProvider: User effect triggered", user);
    if (typeof window === "undefined" || !isAnalyticsEnabled()) {
      console.debug(
        "PostHogProvider: Skipping user identification - window undefined or analytics disabled",
      );
      return;
    }

    // If user is null or undefined, reset PostHog
    if (!user) {
      console.debug("PostHogProvider: No user, resetting PostHog");
      getPostHogInstance()
        .then((posthog) => {
          if (posthog) {
            console.debug("PostHogProvider: PostHog instance found, resetting");
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

    console.debug("PostHogProvider: Identifying user", user.id);
    // Load PostHog client instance and identify user
    getPostHogInstance()
      .then((posthog) => {
        if (posthog) {
          console.debug("PostHogProvider: PostHog instance found, identifying user");
          try {
            posthog.identify(user.id, {
              email: user.email,
              name: user.name,
            });
          } catch (error) {
            console.error("Failed to identify user in PostHog:", error);
          }
        } else {
          console.debug(
            "PostHogProvider: No PostHog instance found for user identification",
          );
        }
      })
      .catch((error) => {
        console.error("Failed to load PostHog client for user identification:", error);
      });
  }, [user]);

  // Handle pageview tracking
  useEffect(() => {
    console.debug("PostHogProvider: Pageview tracking effect triggered");
    if (typeof window === "undefined" || !isAnalyticsEnabled()) {
      console.debug(
        "PostHogProvider: Skipping pageview tracking - window undefined or analytics disabled",
      );
      return;
    }

    // Capture initial pageview when component mounts
    console.debug("PostHogProvider: Capturing initial pageview");
    captureEvent("$pageview").catch((error) => {
      console.error("Failed to capture initial pageview event:", error);
    });

    console.debug("PostHogProvider: Setting up pageview tracking");
    const unsubscribe = router.subscribe("onResolved", () => {
      console.debug("PostHogProvider: Page resolved, capturing pageview");
      // Use the captureEvent helper function
      captureEvent("$pageview").catch((error) => {
        console.error("Failed to capture pageview event:", error);
      });
    });

    return unsubscribe;
  }, [router]);
  return <>{children}</>;
};
