"use client";

import type { ConsentManagerOptions } from "@c15t/react";
import { ConsentManagerDialog, ConsentManagerProvider, CookieBanner } from "@c15t/react";
import type { ReactNode } from "react";
import { useEffect, useMemo } from "react";
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
    () => ({
      mode: "c15t",
      backendURL: "/api/c15t",
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
    }),
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
      <CookieBanner />
      <ConsentManagerDialog />
    </ConsentManagerProvider>
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
