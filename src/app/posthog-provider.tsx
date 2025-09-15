import { useRouter } from "@tanstack/react-router";
import { ReactNode, useEffect } from "react";
import { initializePostHogClient } from "~/lib/analytics/posthog";
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
    if (isAnalyticsEnabled()) {
      try {
        initializePostHogClient();
      } catch (error) {
        console.error("Failed to initialize PostHog client:", error);
      }
    }
  }, []);

  // Handle user identification
  useEffect(() => {
    if (!isAnalyticsEnabled() || !user) {
      return;
    }

    // Load PostHog client instance and identify user
    import("posthog-js")
      .then((ph) => {
        if (ph.default.__loaded) {
          ph.default.identify(user.id, {
            email: user.email,
            name: user.name,
          });
        }
      })
      .catch((error) => {
        console.error("Failed to load PostHog client for user identification:", error);
      });
  }, [user]);

  // Handle pageview tracking
  useEffect(() => {
    // Only track pageviews if analytics is enabled
    if (!isAnalyticsEnabled()) {
      return;
    }

    const unsubscribe = router.subscribe("onResolved", () => {
      // Load PostHog client instance and capture pageview
      import("posthog-js")
        .then((ph) => {
          if (ph.default.__loaded) {
            ph.default.capture("$pageview");
          }
        })
        .catch((error) => {
          console.error("Failed to load PostHog client for pageview tracking:", error);
        });
    });
    return unsubscribe;
  }, [router]);

  return <>{children}</>;
};
