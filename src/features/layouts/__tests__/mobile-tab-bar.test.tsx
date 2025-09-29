import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AdminLayout } from "../admin-layout";

describe("MobileTabBar navigation", () => {
  it("renders tab items and navigates on click", async () => {
    const rootRoute = createRootRoute({ component: () => <Outlet /> });
    const dashboardRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: "/dashboard",
      component: () => <AdminLayout />,
      beforeLoad: () => ({
        user: {
          id: "u1",
          roles: [{ role: { name: "Platform Admin" } }],
        },
      }),
    });
    const eventsRoute = createRoute({
      getParentRoute: () => dashboardRoute,
      path: "events",
      component: () => <div>Events</div>,
    });
    const gamesRoute = createRoute({
      getParentRoute: () => dashboardRoute,
      path: "games",
      component: () => <div>Games</div>,
    });
    const campaignsRoute = createRoute({
      getParentRoute: () => dashboardRoute,
      path: "campaigns",
      component: () => <div>Campaigns</div>,
    });

    const routeTree = rootRoute.addChildren([
      dashboardRoute,
      eventsRoute,
      gamesRoute,
      campaignsRoute,
    ]);

    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ["/dashboard"] }),
      context: { user: { id: "u1" } },
    });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    await router.load();
    await act(async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>,
      );
    });

    const mobileNav = screen.getByRole("navigation", { name: /primary/i, hidden: true });
    expect(within(mobileNav).getByRole("link", { name: /home/i })).toBeInTheDocument();
    expect(within(mobileNav).getByRole("link", { name: /events/i })).toBeInTheDocument();
    expect(within(mobileNav).getByRole("link", { name: /games/i })).toBeInTheDocument();
    expect(
      within(mobileNav).getByRole("link", { name: /campaigns/i }),
    ).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(within(mobileNav).getByRole("link", { name: /events/i }));
    });
    await waitFor(() =>
      expect(router.history.location.pathname).toBe("/dashboard/events"),
    );

    await act(async () => {
      fireEvent.click(within(mobileNav).getByRole("link", { name: /games/i }));
    });
    await waitFor(() =>
      expect(router.history.location.pathname).toBe("/dashboard/games"),
    );

    await act(async () => {
      fireEvent.click(within(mobileNav).getByRole("link", { name: /campaigns/i }));
    });
    await waitFor(() =>
      expect(router.history.location.pathname).toBe("/dashboard/campaigns"),
    );
  });
});
