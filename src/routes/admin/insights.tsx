import { createFileRoute } from "@tanstack/react-router";

import { AdminInsightsDashboard } from "~/features/admin/components/admin-insights-dashboard";

export const Route = createFileRoute("/admin/insights")({
  component: AdminInsightsRoute,
});

function AdminInsightsRoute() {
  return <AdminInsightsDashboard />;
}
