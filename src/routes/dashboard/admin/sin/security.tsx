import { createFileRoute } from "@tanstack/react-router";
import { SecurityDashboard } from "~/features/security/components/security-dashboard";
import { createPageHead } from "~/shared/lib/page-head";
import { requireFeatureInRoute } from "~/tenant/feature-gates";

export const Route = createFileRoute("/dashboard/admin/sin/security")({
  beforeLoad: () => {
    requireFeatureInRoute("sin_admin_security");
  },
  head: () => createPageHead("Security"),
  component: SinSecurityPage,
});

function SinSecurityPage() {
  return (
    <div className="container mx-auto space-y-6 p-6">
      <SecurityDashboard />
    </div>
  );
}
