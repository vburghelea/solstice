/// <reference types="vite/client" />
import type { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  ScriptOnce,
  Scripts,
} from "@tanstack/react-router";

import { lazy, Suspense } from "react";
import { PostHogProvider } from "~/app/posthog-provider";
import { getCurrentUser } from "~/features/auth/auth.queries";
import type { AuthUser } from "~/lib/auth/types";
import { ThemeProvider } from "~/shared/hooks/useTheme";
import appCss from "~/styles.css?url";

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
  user: AuthUser;
}>()({
  beforeLoad: async ({ context }) => {
    try {
      // Check if we're on the server or client
      if (typeof window === "undefined") {
        // Server: use the server function
        const user = await getCurrentUser();
        return { user };
      } else {
        // Client: fetch the full user data
        const user = await context.queryClient.fetchQuery({
          queryKey: ["user"],
          queryFn: getCurrentUser,
        });
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
  const { user } = Route.useRouteContext();
  return (
    <RootDocument>
      <PostHogProvider user={user}>
        <ThemeProvider>
          <Outlet />
        </ThemeProvider>
      </PostHogProvider>
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
