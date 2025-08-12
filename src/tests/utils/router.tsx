import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { act, render, RenderOptions } from "@testing-library/react";
import { ReactElement, ReactNode } from "react";
import type { User } from "~/lib/auth/types";
import { MOCK_OWNER_USER } from "~/tests/mocks/users";

// Create a test query client with optimized settings
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

// Create test routes
export function createTestRouter({
  children,
  initialEntries = ["/"],
  user = MOCK_OWNER_USER,
}: {
  children: ReactNode;
  initialEntries?: string[];
  user?: User | null;
}) {
  // Create a root route with context
  const rootRoute = createRootRoute({
    component: () => <Outlet />,
  });

  // Create a test route that renders children
  const testRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => <>{children}</>,
    beforeLoad: () => ({
      user,
    }),
  });

  // Create route tree
  const routeTree = rootRoute.addChildren([testRoute]);

  // Create router with memory history
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries }),
    defaultPendingMinMs: 0, // Critical for test performance
    context: {
      user,
    },
  });

  return router;
}

interface RenderWithRouterOptions extends Omit<RenderOptions, "wrapper"> {
  initialEntries?: string[];
  user?: User | null;
  includeQueryClient?: boolean;
  path?: string;
}

// Main render function with router - based on TanStack Router best practices
export async function renderWithRouter(
  ui: ReactElement,
  {
    initialEntries = ["/"],
    user = MOCK_OWNER_USER,
    includeQueryClient = true,
    path = "/",
    ...renderOptions
  }: RenderWithRouterOptions = {},
) {
  const queryClient = includeQueryClient ? createTestQueryClient() : null;

  // Create a proper test router following TanStack Router patterns
  const rootRoute = createRootRoute({
    component: () => <Outlet />,
  });

  // Create a test route that renders our component
  const testRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: path,
    component: () => ui,
    beforeLoad: () => ({
      user,
    }),
  });

  const routeTree = rootRoute.addChildren([testRoute]);

  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries }),
    defaultPendingMinMs: 0, // Critical for test performance
    context: {
      user,
      queryClient: queryClient || ({} as QueryClient),
    },
  });

  // Wait for router to be ready
  await router.load();

  function Wrapper() {
    const content = <RouterProvider router={router} />;

    if (queryClient) {
      return <QueryClientProvider client={queryClient}>{content}</QueryClientProvider>;
    }

    return content;
  }

  let renderResult: ReturnType<typeof render>;

  await act(async () => {
    renderResult = render(<Wrapper />, renderOptions);
  });

  return {
    ...renderResult!,
    router,
    queryClient,
  };
}

// Utility to create a full route tree for integration tests
export function createTestRouteTree({
  routes = [],
  user = MOCK_OWNER_USER,
}: {
  routes?: Array<{
    path: string;
    component: () => ReactElement;
    loader?: () => Promise<unknown>;
  }>;
  user?: User | null;
}) {
  const rootRoute = createRootRoute({
    component: () => <Outlet />,
  });

  const testRoutes = routes.map((route) => {
    const baseOptions = {
      getParentRoute: () => rootRoute,
      path: route.path,
      component: route.component,
      beforeLoad: () => ({
        user,
      }),
    };

    // Only add loader if it exists
    if (route.loader) {
      return createRoute({
        ...baseOptions,
        loader: route.loader,
      });
    }

    return createRoute(baseOptions);
  });

  return rootRoute.addChildren(testRoutes);
}

// Re-export testing utilities
export * from "@testing-library/react";
