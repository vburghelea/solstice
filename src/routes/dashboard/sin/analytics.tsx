import { createFileRoute, redirect } from "@tanstack/react-router";
import { requireFeatureInRoute } from "~/tenant/feature-gates";

export const Route = createFileRoute("/dashboard/sin/analytics")({
  beforeLoad: () => {
    requireFeatureInRoute("sin_analytics");
    throw redirect({ to: "/dashboard/analytics/explore" });
  },
});
