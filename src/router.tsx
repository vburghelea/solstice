import { QueryClient } from "@tanstack/react-query";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";

import { DefaultCatchBoundary } from "~/components/DefaultCatchBoundary";
import { NotFound } from "~/components/NotFound";
import { routeTree } from "./routeTree.gen";

function createAppRouter() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        staleTime: 1000 * 60 * 2, // 2 minutes
      },
    },
  });

  const router = createTanStackRouter({
    routeTree,
    context: { queryClient, user: null },
    defaultPreload: "intent",
    // react-query will handle data fetching & caching
    // https://tanstack.com/router/latest/docs/framework/react/guide/data-loading#passing-all-loader-events-to-an-external-cache
    defaultPreloadStaleTime: 0,
    defaultErrorComponent: DefaultCatchBoundary,
    defaultNotFoundComponent: NotFound,
    scrollRestoration: true,
    defaultStructuralSharing: true,
  });

  setupRouterSsrQueryIntegration({ router, queryClient });

  return router;
}

export type AppRouter = ReturnType<typeof createAppRouter>;

let clientRouter: AppRouter | undefined;

export function getRouter(): AppRouter {
  if (typeof window === "undefined") {
    return createAppRouter();
  }

  const router = clientRouter ?? (clientRouter = createAppRouter());
  return router;
}
