/// <reference types="vite/client" />
import type { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  HeadContent,
  isRedirect,
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
import { OrgContextProvider } from "~/features/organizations/org-context";
import {
  getLatestPolicyDocument,
  listUserPolicyAcceptances,
} from "~/features/privacy/privacy.queries";
import appCss from "~/styles.css?url";
import { getBrand } from "~/tenant";
import { getTenantKey } from "~/tenant/tenant-env";

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
  activeOrganizationId: string | null;
}>()({
  beforeLoad: async ({ context, location }) => {
    try {
      const resolveActiveOrganizationId = async () => {
        if (typeof window === "undefined") {
          const { getRequest } = await import("@tanstack/react-start/server");
          const request = getRequest();
          const cookieHeader = request.headers.get("cookie");
          if (!cookieHeader) return null;
          const prefix = "active_org_id=";
          const cookies = cookieHeader.split(";").map((entry) => entry.trim());
          const match = cookies.find((cookie) => cookie.startsWith(prefix));
          return match ? decodeURIComponent(match.slice(prefix.length)) : null;
        }

        return window.localStorage.getItem("active_org_id");
      };

      const activeOrganizationId = await resolveActiveOrganizationId();

      // Check if we're on the server or client
      if (typeof window === "undefined") {
        // Server: use the server function
        const user = await getCurrentUser();

        // Check if user needs to complete onboarding (profile + policy acceptance)
        if (user && location.pathname.startsWith("/dashboard")) {
          // Check profile completion first
          if (!user.profileComplete) {
            throw redirect({ to: "/onboarding" });
          }

          // Then check policy acceptance (only on server to avoid client navigation issues)
          const policy = await getLatestPolicyDocument({ data: "privacy_policy" });
          if (policy) {
            const acceptances = await listUserPolicyAcceptances();
            const hasAccepted = acceptances.some(
              (acceptance) => acceptance.policyId === policy.id,
            );
            if (!hasAccepted) {
              // Redirect to onboarding which now handles policy acceptance
              throw redirect({ to: "/onboarding" });
            }
          }
        }

        return { user, activeOrganizationId };
      } else {
        // Client: fetch the full user data
        const user = await context.queryClient.fetchQuery(authQueryOptions());

        // On client-side navigation, we rely on React Query for policy checks
        // The onboarding page will handle showing the policy step if needed
        if (user && !user.profileComplete && location.pathname.startsWith("/dashboard")) {
          throw redirect({ to: "/onboarding" });
        }

        return { user, activeOrganizationId };
      }
    } catch (error) {
      // Re-throw redirects - they're navigation signals, not errors
      if (isRedirect(error)) {
        throw error;
      }
      console.error("Error loading user:", error);
      return { user: null, activeOrganizationId: null };
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
        title: getBrand().name,
      },
      {
        name: "description",
        content: getBrand().description ?? "Member portal for Solstice tenants.",
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
        <OrgContextProvider>
          <Outlet />
        </OrgContextProvider>
      </StepUpProvider>
    </RootDocument>
  );
}

function RootDocument({ children }: { readonly children: React.ReactNode }) {
  return (
    // suppress since we're updating the "dark" class in a custom script below
    <html lang="en" data-tenant={getTenantKey()} suppressHydrationWarning>
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
