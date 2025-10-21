import React from "react";
import { vi } from "vitest";

// Create a mock navigate function that can be used across tests
export const mockNavigate = vi.fn();

// Mock router creation functions
const createRootRouteMock = vi.fn((options?: Record<string, unknown>) => ({
  ...options,
  addChildren: vi.fn((children: unknown[]) => ({
    children,
  })),
}));

const createRouteMock = vi.fn((options?: Record<string, unknown> | string) => {
  // Handle createFileRoute signature: function(path) => function(routeConfig)
  if (typeof options === "string") {
    // Return a function that can be called with route configuration
    return vi.fn((routeConfig?: Record<string, unknown>) => ({
      ...routeConfig,
      component: routeConfig?.["component"],
      loader: routeConfig?.["loader"] || vi.fn(),
      useParams: vi.fn(),
      useLoaderData: vi.fn(),
      useSearch: vi.fn(),
      useRouteContext: vi.fn(),
      // eslint-disable-next-line @eslint-react/hooks-extra/no-unnecessary-use-prefix
      useNavigate: () => mockNavigate,
      options: routeConfig || { component: undefined },
    }));
  }
  // Handle createRoute signature: function(options) => options
  return {
    ...(options as Record<string, unknown>),
  };
});

const createRouterMock = vi.fn((options?: Record<string, unknown>) => ({
  ...options,
  load: vi.fn().mockResolvedValue(undefined),
}));

const createMemoryHistoryMock = vi.fn((options?: Record<string, unknown>) => ({
  ...options,
}));

const RouterProviderMock = ({
  router,
}: {
  router: { routeTree?: { children?: { component?: () => React.ReactNode }[] } };
}) => {
  // Get the component from the router's route tree
  // This is a simplified mock that tries to render the first component it finds
  const routeTree = router?.routeTree;
  if (routeTree?.children?.length) {
    const firstChild = routeTree.children[0];
    if (firstChild?.component) {
      return React.createElement(firstChild.component);
    }
  }

  // Fallback for testing
  return React.createElement(
    "div",
    { "data-testid": "router-provider" },
    "Router Provider",
  );
};

const OutletMock = () =>
  React.createElement("div", { "data-testid": "outlet" }, "Outlet");

// Create a centralized TanStack Router mock that conditionally provides real functions
export const tanStackRouterMock = {
  // Router creation functions
  createRootRoute: createRootRouteMock,
  createRoute: createRouteMock,
  createRouter: createRouterMock,
  createFileRoute: createRouteMock, // Alias for createRoute in file-based routing
  createMemoryHistory: createMemoryHistoryMock,
  RouterProvider: RouterProviderMock,
  Outlet: OutletMock,

  // Mock the hooks and components
  // eslint-disable-next-line @eslint-react/hooks-extra/no-unnecessary-use-prefix
  useNavigate: () => mockNavigate,
  // eslint-disable-next-line @eslint-react/hooks-extra/no-unnecessary-use-prefix
  useRouterState: () => ({
    location: {
      pathname: "/",
      href: "/",
      publicHref: "/",
      url: "http://localhost:5173/",
      search: {},
      searchStr: "",
      state: {} as never,
      hash: "",
    },
    status: "idle",
    loadedAt: Date.now(),
    isLoading: false,
    isTransitioning: false,
    matches: [],
    cachedMatches: [],
    statusCode: 200,
  }),
  // eslint-disable-next-line @eslint-react/hooks-extra/no-unnecessary-use-prefix
  useRouter: () => ({ invalidate: vi.fn() }),
  Link: (
    props: {
      to: string;
      children: React.ReactNode;
    } & React.AnchorHTMLAttributes<HTMLAnchorElement>,
  ) => (
    <a href={props.to} {...props}>
      {props.children}
    </a>
  ),
};

// Helper function to set up router mock with custom pathname
export const setupRouterMock = (pathname: string = "/") => {
  mockNavigate.mockClear();
  return {
    ...tanStackRouterMock,
    useRouterState: () => ({
      ...tanStackRouterMock.useRouterState(),
      location: {
        ...tanStackRouterMock.useRouterState().location,
        pathname,
        href: pathname,
        publicHref: pathname,
        url: `http://localhost:5173${pathname}`,
      },
    }),
  };
};
