import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { requireFeatureInRoute } from "~/tenant/feature-gates";
import { createPageHead } from "~/shared/lib/page-head";

export const Route = createFileRoute("/dashboard/sin")({
  beforeLoad: ({ context, location }) => {
    requireFeatureInRoute("sin_portal");
    if (!context.activeOrganizationId) {
      // location.search is an object in TanStack Router, serialize it properly
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
  head: () => createPageHead("SIN dashboard"),
  component: SinLayout,
});

function SinLayout() {
  return <Outlet />;
}
