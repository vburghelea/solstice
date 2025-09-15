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
  user: AuthUser;
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
    if (typeof window === "undefined" || !isAnalyticsEnabled() || !user) {
      console.debug(
        "PostHogProvider: Skipping user identification - window undefined, analytics disabled, or no user",
      );
      return;
    }

    console.debug("PostHogProvider: Identifying user", user.id);
    // Load PostHog client instance and identify user
    getPostHogInstance()
      .then((posthog) => {
        if (posthog) {
          console.debug("PostHogProvider: PostHog instance found, identifying user");
          posthog.identify(user.id, {
            email: user.email,
            name: user.name,
          });
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

    console.debug("PostHogProvider: Setting up pageview tracking");
    const unsubscribe = router.subscribe("onResolved", () => {
      console.debug("PostHogProvider: Page resolved, capturing pageview");
      captureEvent("$pageview");
    });

    return unsubscribe;
  }, [router]);
  return <>{children}</>;
};
