import { createFileRoute, Outlet } from "@tanstack/react-router";
import { createPageHead } from "~/shared/lib/page-head";
import { requireFeatureInRoute } from "~/tenant/feature-gates";

export const Route = createFileRoute("/dashboard/teams")({
  beforeLoad: () => {
    requireFeatureInRoute("teams");
  },
  head: () => createPageHead("Teams"),
  component: TeamsLayout,
});

function TeamsLayout() {
  return <Outlet />;
}
