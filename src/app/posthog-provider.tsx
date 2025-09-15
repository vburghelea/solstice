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
    // Dynamically import posthog-js to avoid server-side issues
    import("posthog-js")
      .then((posthog) => {
        if (user) {
          posthog.default.identify(user.id, {
            email: user.email,
            name: user.name,
          });
        } else {
          posthog.default.reset();
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
      // Dynamically import posthog-js to avoid server-side issues
      import("posthog-js")
        .then((posthog) => {
          posthog.default.capture("$pageview");
        })
        .catch((error) => {
          console.error("Failed to load PostHog client for pageview tracking:", error);
        });
    });
    return unsubscribe;
  }, [router]);

  return <>{children}</>;
};
