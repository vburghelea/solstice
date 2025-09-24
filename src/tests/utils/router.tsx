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

// Mock user for route context
export const mockUser: User = {
  id: "test-user-id",
  email: "test@example.com",
  name: "Test User",
  emailVerified: true,
  image: null,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
  profileComplete: true,
  dateOfBirth: new Date("1990-01-01"),
  phone: "+1234567890",
  gender: "male",
  pronouns: "he/him",
  emergencyContact: JSON.stringify({
    name: "Emergency Contact",
    phone: "+0987654321",
    relationship: "spouse",
  }),
  privacySettings: JSON.stringify({
    showEmail: false,
    showPhone: false,
    showDateOfBirth: false,
  }),
  profileVersion: 1,
  profileUpdatedAt: new Date("2024-01-01"),
};

// Create test routes
export function createTestRouter({
  children,
  initialEntries = ["/"],
  user = mockUser,
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
}

// Main render function with router - based on TanStack Router best practices
export async function renderWithRouter(
  ui: ReactElement,
  {
    initialEntries = ["/"],
    user = mockUser,
    includeQueryClient = true,
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
    path: "/",
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
  user = mockUser,
}: {
  routes?: Array<{
    path: string;
    component: () => ReactElement;
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

    return createRoute(baseOptions);
  });

  return rootRoute.addChildren(testRoutes);
}

// Re-export testing utilities
export * from "@testing-library/react";
