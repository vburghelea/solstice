import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { createPageHead } from "~/shared/lib/page-head";
import { requireFeatureInRoute } from "~/tenant/feature-gates";

export const Route = createFileRoute("/dashboard/analytics")({
  beforeLoad: ({ context, location }) => {
    requireFeatureInRoute("sin_analytics");
    if (!context.activeOrganizationId) {
      const searchString =
        Object.keys(location.search).length > 0
          ? "?" +
            new URLSearchParams(location.search as Record<string, string>).toString()
          : "";
      throw redirect({
        to: "/dashboard/select-org",
        search: { redirect: `${location.pathname}${searchString}` },
      });
    }
  },
  head: () => createPageHead("Analytics"),
  component: AnalyticsLayout,
});

function AnalyticsLayout() {
  return <Outlet />;
}
