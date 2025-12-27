import { createFileRoute, Outlet } from "@tanstack/react-router";
import { requireFeatureInRoute } from "~/tenant/feature-gates";

export const Route = createFileRoute("/dashboard/teams")({
  beforeLoad: () => {
    requireFeatureInRoute("qc_teams");
  },
  component: TeamsLayout,
});

function TeamsLayout() {
  return <Outlet />;
}
