import { createFileRoute, redirect } from "@tanstack/react-router";
import { createPageHead } from "~/shared/lib/page-head";
import { requireFeatureInRoute } from "~/tenant/feature-gates";

export const Route = createFileRoute("/dashboard/admin/sin/analytics")({
  beforeLoad: () => {
    requireFeatureInRoute("sin_admin_analytics");
    throw redirect({ to: "/dashboard/analytics/explore" });
  },
  head: () => createPageHead("Analytics"),
});
