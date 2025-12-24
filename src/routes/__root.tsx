/// <reference types="vite/client" />
import type { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  redirect,
  ScriptOnce,
  Scripts,
} from "@tanstack/react-router";

import { lazy, Suspense } from "react";
import {
  authQueryOptions,
  getCurrentUser,
  type AuthQueryResult,
} from "~/features/auth/auth.queries";
import { StepUpProvider } from "~/features/auth/step-up";
import {
  getLatestPolicyDocument,
  listUserPolicyAcceptances,
} from "~/features/privacy/privacy.queries";
import appCss from "~/styles.css?url";

// Lazy load devtools only in development to exclude from production bundles
const ReactQueryDevtools = import.meta.env.DEV
  ? lazy(() =>
      import("@tanstack/react-query-devtools").then((mod) => ({
        default: mod.ReactQueryDevtools,
      })),
    )
  : null;

const TanStackRouterDevtools = import.meta.env.DEV
  ? lazy(() =>
      import("@tanstack/react-router-devtools").then((mod) => ({
        default: mod.TanStackRouterDevtools,
      })),
    )
  : null;

// Lazy load Toaster to avoid SSR issues
const Toaster = lazy(() => import("sonner").then((mod) => ({ default: mod.Toaster })));

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
  user: AuthQueryResult;
}>()({
  beforeLoad: async ({ context, location }) => {
    try {
      // Check if we're on the server or client
      if (typeof window === "undefined") {
        // Server: use the server function
        const user = await getCurrentUser();
        if (user && location.pathname.startsWith("/dashboard")) {
          const policy = await getLatestPolicyDocument({ data: "privacy_policy" });
          if (policy) {
            const acceptances = await listUserPolicyAcceptances();
            const hasAccepted = acceptances.some(
              (acceptance) => acceptance.policyId === policy.id,
            );
            if (!hasAccepted && location.pathname !== "/dashboard/privacy") {
              throw redirect({ to: "/dashboard/privacy" });
            }
          }
        }

        return { user };
      } else {
        // Client: fetch the full user data
        const user = await context.queryClient.fetchQuery(authQueryOptions());
        if (user && location.pathname.startsWith("/dashboard")) {
          const policy = await getLatestPolicyDocument({ data: "privacy_policy" });
          if (policy) {
            const acceptances = await listUserPolicyAcceptances();
            const hasAccepted = acceptances.some(
              (acceptance) => acceptance.policyId === policy.id,
            );
            if (!hasAccepted && location.pathname !== "/dashboard/privacy") {
              throw redirect({ to: "/dashboard/privacy" });
            }
          }
        }
        return { user };
      }
    } catch (error) {
      console.error("Error loading user:", error);
      return { user: null };
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
        title: "Quadball Canada",
      },
      {
        name: "description",
        content:
          "Official hub for Quadball Canada competitions, club resources, and national team updates.",
      },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <StepUpProvider>
        <Outlet />
      </StepUpProvider>
    </RootDocument>
  );
}

function RootDocument({ children }: { readonly children: React.ReactNode }) {
  return (
    // suppress since we're updating the "dark" class in a custom script below
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <ScriptOnce>
          {`
            // Minimal process shim for TanStack server functions
            if (typeof globalThis.process === 'undefined') {
              globalThis.process = {
                env: { NODE_ENV: '${import.meta.env.PROD ? "production" : "development"}' },
                versions: { node: '22.0.0' }
              };
            }

            // Theme toggle
            document.documentElement.classList.toggle(
              'dark',
              localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
            );
          `}
        </ScriptOnce>

        {children}

        <Suspense fallback={null}>
          <Toaster richColors closeButton />
        </Suspense>
        {import.meta.env.DEV && ReactQueryDevtools && TanStackRouterDevtools && (
          <Suspense fallback={null}>
            <ReactQueryDevtools buttonPosition="bottom-left" />
            <TanStackRouterDevtools position="bottom-right" />
          </Suspense>
        )}

        <Scripts />
      </body>
    </html>
  );
}
