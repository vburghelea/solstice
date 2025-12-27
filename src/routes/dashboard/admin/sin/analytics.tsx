import { createFileRoute } from "@tanstack/react-router";
import { ReportBuilderShell } from "~/features/reports/components/report-builder-shell";
import { requireFeatureInRoute } from "~/tenant/feature-gates";

export const Route = createFileRoute("/dashboard/admin/sin/analytics")({
  beforeLoad: () => {
    requireFeatureInRoute("sin_admin_analytics");
  },
  component: SinAnalyticsAdminPage,
});

function SinAnalyticsAdminPage() {
  return (
    <div className="container mx-auto space-y-6 p-6">
      <ReportBuilderShell />
    </div>
  );
}
