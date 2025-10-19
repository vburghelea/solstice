/// <reference types="vite/client" />
import type { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  ScriptOnce,
  Scripts,
} from "@tanstack/react-router";

import { lazy, Suspense, useEffect } from "react";
import { getCurrentUser } from "~/features/auth/auth.queries";
import { ConsentProvider } from "~/features/consent";
import type { AuthUser } from "~/lib/auth/types";
import { i18nConfig, type SupportedLanguage } from "~/lib/i18n/config";
import { detectLanguageFromPath } from "~/lib/i18n/detector";
import i18n from "~/lib/i18n/i18n";
import appCss from "~/styles.css?url";

type RootRouteContext = {
  readonly user: AuthUser | null;
  readonly language: SupportedLanguage;
};

// Lazy load devtools to avoid hydration issues
const ReactQueryDevtools = lazy(() =>
  import("@tanstack/react-query-devtools").then((mod) => ({
    default: mod.ReactQueryDevtools,
  })),
);
const TanStackRouterDevtools = lazy(() =>
  import("@tanstack/react-router-devtools").then((mod) => ({
    default: mod.TanStackRouterDevtools,
  })),
);

// Lazy load Toaster to avoid SSR issues
const Toaster = lazy(() => import("sonner").then((mod) => ({ default: mod.Toaster })));

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
  user: AuthUser | null;
  language: SupportedLanguage;
}>()({
  beforeLoad: async ({ location }) => {
    const detectedLanguage =
      detectLanguageFromPath(location.pathname) ?? i18nConfig.defaultLanguage;

    try {
      // Ensure i18n is properly initialized and language is set before proceeding
      if (!i18n.isInitialized) {
        // i18n should already be initialized from providers.tsx, but wait just in case
        await new Promise<void>((resolve) => {
          if (i18n.isInitialized) {
            resolve();
          } else {
            i18n.on("initialized", resolve);
          }
        });
      }

      // Force language change and wait for it to complete
      if (i18n.language !== detectedLanguage) {
        await i18n.changeLanguage(detectedLanguage);
      }

      const user = await getCurrentUser();
      return { user, language: detectedLanguage };
    } catch (error) {
      console.error("Error loading user:", error);
      return { user: null, language: detectedLanguage };
    }
  },
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Roundup Games",
      },
      {
        name: "description",
        content: "Tabletop and board game platform for players all over the world!",
      },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  component: RootComponent,
});

function RootComponent() {
  const { user, language } = Route.useRouteContext() as RootRouteContext;

  useEffect(() => {
    let cancelled = false;

    const syncLanguage = async () => {
      // Only change language if there's a mismatch to prevent unnecessary re-renders
      if (i18n.language !== language) {
        await i18n.changeLanguage(language);
      }

      if (typeof window === "undefined" || cancelled) {
        return;
      }

      const snapshot = {
        routeLanguage: language,
        i18nLanguage: i18n.language,
        availableLanguages: i18n.languages,
        resourceStatus: i18nConfig.supportedLanguages.reduce(
          (acc, lng) => ({
            ...acc,
            [lng]: {
              navigation: i18n.hasResourceBundle(lng, "navigation"),
              common: i18n.hasResourceBundle(lng, "common"),
              about: i18n.hasResourceBundle(lng, "about"),
            },
          }),
          {} as Record<SupportedLanguage, Record<string, boolean>>,
        ),
      };

      if (i18nConfig.debug) {
        console.info("[RootComponent] Language sync complete", snapshot);
      }
    };

    void syncLanguage();

    return () => {
      cancelled = true;
    };
  }, [language]);

  return (
    <RootDocument language={language}>
      <ConsentProvider user={user}>
        <Outlet />
      </ConsentProvider>
    </RootDocument>
  );
}

function RootDocument({
  children,
  language,
}: {
  readonly children: React.ReactNode;
  readonly language: SupportedLanguage;
}) {
  return (
    // suppress since we're updating the "dark" class in a custom script below
    <html lang={language} suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="bg-background min-h-screen overflow-x-hidden font-sans antialiased">
        <ScriptOnce>
          {`
            try {
              var theme = null;
              try {
                theme = localStorage.getItem('theme');
              } catch (_e) {
                theme = null;
              }
              var prefersDark = false;
              try {
                prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
              } catch (_e) {
                prefersDark = false;
              }
              var isDark = theme ? theme === 'dark' : prefersDark;
              var root = document.documentElement;
              if (isDark) root.classList.add('dark'); else root.classList.remove('dark');
            } catch (_e) {
              // no-op: never break hydration due to theme script
            }
          `}
        </ScriptOnce>

        {children}

        <Suspense fallback={null}>
          <Toaster richColors closeButton />
        </Suspense>
        <Suspense fallback={null}>
          <ReactQueryDevtools buttonPosition="bottom-left" />
          <TanStackRouterDevtools position="bottom-right" />
        </Suspense>

        <Scripts />
      </body>
    </html>
  );
}
