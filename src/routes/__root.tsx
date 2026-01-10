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
// Note: validateActiveOrganization removed - using direct resolveOrganizationAccess to avoid redundant session validation
// Note: getLatestPolicyDocument/listUserPolicyAcceptances removed - using inline DB queries to avoid redundant session validation
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

const serializeCookie = (
  name: string,
  value: string,
  options: {
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: "lax" | "strict" | "none";
    path?: string;
    domain?: string;
    maxAge?: number;
  },
) => {
  const segments = [`${name}=${value}`];

  if (options.maxAge !== undefined) {
    segments.push(`Max-Age=${options.maxAge}`);
  }
  if (options.domain) {
    segments.push(`Domain=${options.domain}`);
  }
  if (options.path) {
    segments.push(`Path=${options.path}`);
  }
  if (options.sameSite) {
    const normalized =
      options.sameSite.charAt(0).toUpperCase() + options.sameSite.slice(1);
    segments.push(`SameSite=${normalized}`);
  }
  if (options.secure) {
    segments.push("Secure");
  }
  if (options.httpOnly) {
    segments.push("HttpOnly");
  }

  return segments.join("; ");
};

type ServerTimingEntry = {
  name: string;
  start: number;
  end?: number;
};

const createServerTiming = () => {
  const entries: ServerTimingEntry[] = [];
  const now =
    typeof performance === "undefined" ? () => Date.now() : () => performance.now();

  const start = (name: string) => {
    const entry: ServerTimingEntry = { name, start: now() };
    entries.push(entry);
    return entry;
  };

  const end = (entry: ServerTimingEntry) => {
    entry.end = now();
  };

  const wrap = async <T,>(name: string, task: () => Promise<T>) => {
    const entry = start(name);
    try {
      return await task();
    } finally {
      end(entry);
    }
  };

  const header = () =>
    entries
      .filter((entry) => typeof entry.end === "number")
      .map((entry) => {
        const duration = Math.max(0, (entry.end ?? entry.start) - entry.start);
        return `${entry.name};dur=${duration.toFixed(1)}`;
      })
      .join(", ");

  return { wrap, header };
};

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
  user: AuthQueryResult;
  activeOrganizationId: string | null;
}>()({
  beforeLoad: async ({ context, location }) => {
    const isServer = typeof window === "undefined";
    const serverTiming = isServer ? createServerTiming() : null;
    let getRequest: (() => Request) | null = null;
    let setResponseHeader: ((name: string, value: string) => void) | null = null;
    let setResponseStatus: ((status: number) => void) | null = null;

    const time = async <T,>(name: string, task: () => Promise<T>) =>
      serverTiming ? serverTiming.wrap(name, task) : task();

    const writeServerTiming = () => {
      if (!serverTiming || !setResponseHeader) return;
      const headerValue = serverTiming.header();
      if (headerValue) {
        setResponseHeader("Server-Timing", headerValue);
      }
    };

    try {
      if (isServer) {
        ({ getRequest, setResponseHeader, setResponseStatus } =
          await import("@tanstack/react-start/server"));
      }

      /**
       * IMPORTANT: Short-circuit /auth/* on the server.
       * We only need to know whether a valid session exists to redirect away.
       * Doing full getCurrentUser() hydration first can delay redirect until after
       * SSR streaming has started, which can yield the empty octet-stream response.
       */
      if (isServer && location.pathname.startsWith("/auth")) {
        const { getSessionFromHeaders } = await import("~/lib/auth/session");
        const request = getRequest?.();
        const session = request?.headers
          ? await time("auth.session", () => getSessionFromHeaders(request.headers))
          : null;

        if (session?.user) {
          setResponseStatus?.(302);
          setResponseHeader?.("Location", "/dashboard");
          // Force a real HTTP redirect response before streaming begins
          throw redirect({ to: "/dashboard", statusCode: 302 });
        }

        // Unauthenticated: render auth pages without full SSR user hydration
        return { user: null, activeOrganizationId: null };
      }

      const resolveActiveOrganizationId = async () => {
        if (typeof window === "undefined") {
          const request = getRequest?.();
          if (!request) return null;
          const cookieHeader = request.headers.get("cookie");
          if (!cookieHeader) return null;
          const prefix = "active_org_id=";
          const cookies = cookieHeader.split(";").map((entry) => entry.trim());
          const match = cookies.find((cookie) => cookie.startsWith(prefix));
          const value = match ? decodeURIComponent(match.slice(prefix.length)) : null;
          return value || null;
        }

        return window.localStorage.getItem("active_org_id");
      };

      const clearActiveOrganizationCookie = async () => {
        if (!setResponseHeader) return;
        const { securityConfig } = await import("~/lib/security/config");
        const cookie = serializeCookie("active_org_id", "", {
          ...securityConfig.cookies,
          maxAge: 0,
        });
        setResponseHeader("Set-Cookie", cookie);
      };

      const syncLocalStorage = (organizationId: string | null) => {
        if (typeof window === "undefined") return;
        if (organizationId) {
          window.localStorage.setItem("active_org_id", organizationId);
        } else {
          window.localStorage.removeItem("active_org_id");
        }
      };

      const candidateOrganizationId = await resolveActiveOrganizationId();

      if (isServer) {
        // Server: use the server function
        const user = await time("auth.user", () => getCurrentUser());

        // Check if user needs to complete onboarding (profile + policy acceptance)
        if (user && location.pathname.startsWith("/dashboard")) {
          // Check profile completion first
          if (!user.profileComplete) {
            throw redirect({ to: "/onboarding" });
          }

          // Then check policy acceptance (server-only), using inline DB queries
          // to avoid calling server fns that re-run session validation
          const { getDb } = await import("~/db/server-helpers");
          const db = await getDb();
          const { policyDocuments, userPolicyAcceptances } = await import("~/db/schema");
          const { and, desc, eq, isNotNull, lte } = await import("drizzle-orm");

          const today = new Date().toISOString().slice(0, 10);

          const [policy] = await time("policy.latest", () =>
            db
              .select({ id: policyDocuments.id })
              .from(policyDocuments)
              .where(
                and(
                  eq(policyDocuments.type, "privacy_policy"),
                  isNotNull(policyDocuments.publishedAt),
                  lte(policyDocuments.effectiveDate, today),
                ),
              )
              .orderBy(desc(policyDocuments.effectiveDate))
              .limit(1),
          );

          if (policy?.id) {
            const [acceptance] = await time("policy.acceptance", () =>
              db
                .select({ id: userPolicyAcceptances.id })
                .from(userPolicyAcceptances)
                .where(
                  and(
                    eq(userPolicyAcceptances.userId, user.id),
                    eq(userPolicyAcceptances.policyId, policy.id),
                  ),
                )
                .limit(1),
            );

            if (!acceptance) {
              throw redirect({ to: "/onboarding" });
            }
          }
        }

        let activeOrganizationId: string | null = null;
        if (candidateOrganizationId && user?.id) {
          // Avoid validateActiveOrganization() server fn (it re-validates session via middleware).
          // We already have user.id; call the underlying access resolver directly.
          const isUuid =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
              candidateOrganizationId,
            );
          if (isUuid) {
            const { resolveOrganizationAccess } =
              await import("~/features/organizations/organizations.access");
            const access = await time("org.access", () =>
              resolveOrganizationAccess({
                userId: user.id,
                organizationId: candidateOrganizationId,
              }),
            );
            activeOrganizationId = access?.organizationId ?? null;
          }
        }

        if (candidateOrganizationId && !activeOrganizationId) {
          await clearActiveOrganizationCookie();
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

        let activeOrganizationId: string | null = null;
        if (candidateOrganizationId && user?.id) {
          // Use direct access resolver on client too for consistency
          const isUuid =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
              candidateOrganizationId,
            );
          if (isUuid) {
            // On client, we still need to call a server function, but we can use
            // a lighter-weight one. For now, keep the existing pattern but note
            // that this could be optimized further by caching org access.
            const { validateActiveOrganization } =
              await import("~/features/organizations/organizations.queries");
            const access = await validateActiveOrganization({
              data: { organizationId: candidateOrganizationId },
            });
            activeOrganizationId = access?.organizationId ?? null;
          }
        }

        if (candidateOrganizationId && !activeOrganizationId) {
          syncLocalStorage(null);
        } else if (activeOrganizationId) {
          syncLocalStorage(activeOrganizationId);
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
    } finally {
      if (isServer) {
        writeServerTiming();
      }
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

            // Theme toggle - TEMPORARILY DISABLED: Dark mode disabled app-wide
            // To re-enable, restore: document.documentElement.classList.toggle('dark', localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches));
            document.documentElement.classList.remove('dark');
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
