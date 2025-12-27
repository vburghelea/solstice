import { createFileRoute } from "@tanstack/react-router";
import { ReportingDashboardShell } from "~/features/reporting/components/reporting-dashboard-shell";
import { requireFeatureInRoute } from "~/tenant/feature-gates";

export const Route = createFileRoute("/dashboard/admin/sin/reporting")({
  beforeLoad: () => {
    requireFeatureInRoute("sin_admin_reporting");
  },
  component: SinReportingAdminPage,
});

function SinReportingAdminPage() {
  return (
    <div className="container mx-auto space-y-6 p-6">
      <ReportingDashboardShell />
    </div>
  );
}
