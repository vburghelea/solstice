/// <reference types="vite/client" />
import type { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  ScriptOnce,
  Scripts,
} from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import { auth } from "~/lib/auth-client";
import type { AuthUser } from "~/lib/auth/types";
import appCss from "~/styles.css?url";

// Server function to get user session with proper cookie handling
const getUser = createServerFn({ method: "GET" }).handler(async () => {
  // This handler runs ONLY on the server
  const { auth: serverAuth } = await import("~/lib/auth");
  const { getWebRequest } = await import("@tanstack/react-start/server");
  const { headers } = getWebRequest();
  const session = await serverAuth.api.getSession({
    headers,
  });
  return session?.user || null;
});

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
  user: AuthUser;
}>()({
  beforeLoad: async ({ context }) => {
    // Check if we're on the server or client
    if (typeof window === "undefined") {
      // Server: use the server function
      const user = await getUser();
      return { user };
    } else {
      // Client: use the client-side auth
      const user = await context.queryClient.fetchQuery({
        queryKey: ["user"],
        queryFn: async () => {
          const session = await auth.getSession();
          return session.data?.user || null;
        },
      });
      return { user };
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

        <ReactQueryDevtools buttonPosition="bottom-left" />
        <TanStackRouterDevtools position="bottom-right" />

        <Scripts />
      </body>
    </html>
  );
}
