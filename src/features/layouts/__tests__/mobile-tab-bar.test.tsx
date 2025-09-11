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
    const membersRoute = createRoute({
      getParentRoute: () => dashboardRoute,
      path: "members",
      component: () => <div>Members</div>,
    });
    const profileRoute = createRoute({
      getParentRoute: () => dashboardRoute,
      path: "profile",
      component: () => <div>Profile</div>,
    });
    const reportsRoute = createRoute({
      getParentRoute: () => dashboardRoute,
      path: "reports",
      component: () => <div>Reports</div>,
    });
    const settingsRoute = createRoute({
      getParentRoute: () => dashboardRoute,
      path: "settings",
      component: () => <div>Settings</div>,
    });

    const routeTree = rootRoute.addChildren([
      dashboardRoute,
      eventsRoute,
      membersRoute,
      profileRoute,
      reportsRoute,
      settingsRoute,
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
    expect(within(mobileNav).getByRole("link", { name: /profile/i })).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(within(mobileNav).getByRole("link", { name: /events/i }));
    });
    await waitFor(() =>
      expect(router.history.location.pathname).toBe("/dashboard/events"),
    );

    await act(async () => {
      fireEvent.click(within(mobileNav).getByRole("link", { name: /members/i }));
    });
    await waitFor(() =>
      expect(router.history.location.pathname).toBe("/dashboard/members"),
    );

    await act(async () => {
      fireEvent.click(within(mobileNav).getByRole("link", { name: /settings/i }));
    });
    await waitFor(() =>
      expect(router.history.location.pathname).toBe("/dashboard/settings"),
    );
  });
});
