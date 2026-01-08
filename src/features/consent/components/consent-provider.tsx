"use client";

import type { ConsentManagerOptions } from "@c15t/react";
import { ConsentManagerDialog, ConsentManagerProvider, CookieBanner } from "@c15t/react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { PostHogProvider } from "~/app/posthog-provider";
import { getPostHogInstance, initializePostHogClient } from "~/lib/analytics/posthog";
import type { AuthUser } from "~/lib/auth/types";
import { isAnalyticsEnabled } from "~/lib/env.client";
import { ThemeProvider } from "~/shared/hooks/useTheme";
import { consentCategoryIds, consentTranslations } from "../config";
import { setConsentStateSnapshot } from "../state";
import { ConsentStateSync } from "./consent-state-sync";

export function ConsentProvider({
  children,
  user,
}: {
  children: ReactNode;
  user: AuthUser | null;
}) {
  const options = useMemo<ConsentManagerOptions>(
    () =>
      ({
        // Use offline mode in development to avoid backend initialization errors
        // In production, use backend mode to sync consent across devices
        mode: import.meta.env.DEV ? "offline" : "c15t",
        ...(import.meta.env.DEV
          ? {}
          : {
              backendURL: "/api/c15t",
            }),
        consentCategories: consentCategoryIds,
        translations: consentTranslations,
        ignoreGeoLocation: import.meta.env.DEV,
        callbacks: {
          async onConsentSet({ preferences }) {
            setConsentStateSnapshot(preferences);

            if (!isAnalyticsEnabled()) {
              return;
            }

            try {
              const posthog = await getPostHogInstance();
              if (!posthog) {
                return;
              }

              if (preferences.measurement) {
                posthog.opt_in_capturing();
              } else {
                posthog.opt_out_capturing();
              }
            } catch (error) {
              console.error("Failed to sync PostHog consent:", error);
            }
          },
        },
        react: {
          colorScheme: "system",
        },
      }) as ConsentManagerOptions,
    [],
  );

  return (
    <ConsentManagerProvider options={options}>
      <ConsentStateSync />
      <PostHogBootstrap>
        <PostHogProvider user={user}>
          <ThemeProvider>{children}</ThemeProvider>
        </PostHogProvider>
      </PostHogBootstrap>
      {/* Defer consent UI rendering to prevent hydration mismatch */}
      <DeferredConsentUI />
    </ConsentManagerProvider>
  );
}

// Defer rendering of consent UI until after client-side hydration
// This prevents hydration mismatches caused by c15t components rendering
// differently on server vs client (e.g., localStorage access, geo detection)
function DeferredConsentUI() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <>
      <CookieBanner />
      <ConsentManagerDialog />
    </>
  );
}

function PostHogBootstrap({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!isAnalyticsEnabled()) {
      return;
    }

    initializePostHogClient();
  }, []);

  return <>{children}</>;
}
