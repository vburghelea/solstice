/// <reference types="vite/client" />
import type { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  ScriptOnce,
  Scripts,
} from "@tanstack/react-router";

import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import { lazy, Suspense } from "react";
import { getCurrentUser } from "~/features/auth/auth.queries";
import type { AuthUser } from "~/lib/auth/types";
import appCss from "~/styles.css?url";

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
        title: "React TanStarter",
      },
      {
        name: "description",
        content: "A minimal starter template for 🏝️ TanStack Start.",
      },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
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
          {`document.documentElement.classList.toggle(
            'dark',
            localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
            )`}
        </ScriptOnce>

        {children}

        <Suspense fallback={null}>
          <Toaster richColors closeButton />
        </Suspense>
        {typeof window !== "undefined" && (
          <>
            <ReactQueryDevtools buttonPosition="bottom-left" />
            <TanStackRouterDevtools position="bottom-right" />
          </>
        )}

        <Scripts />
      </body>
    </html>
  );
}
