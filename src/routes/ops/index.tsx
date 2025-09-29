import { createFileRoute } from "@tanstack/react-router";

import { OpsOverviewDashboard } from "~/features/ops/components/ops-overview-dashboard";

export const Route = createFileRoute("/ops/")({
  component: OpsLanding,
});

function OpsLanding() {
  return <OpsOverviewDashboard />;
}
