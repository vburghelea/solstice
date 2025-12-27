import { createFileRoute } from "@tanstack/react-router";
import { PrivacyAdminPanel } from "~/features/privacy/components/privacy-admin-panel";
import { PrivacyDashboard } from "~/features/privacy/components/privacy-dashboard";
import { RetentionPolicyPanel } from "~/features/privacy/components/retention-policy-panel";
import { requireFeatureInRoute } from "~/tenant/feature-gates";

export const Route = createFileRoute("/dashboard/admin/sin/privacy")({
  beforeLoad: () => {
    requireFeatureInRoute("sin_admin_privacy");
  },
  component: SinPrivacyPage,
});

function SinPrivacyPage() {
  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <PrivacyDashboard />
        <PrivacyAdminPanel />
      </div>
      <RetentionPolicyPanel />
    </div>
  );
}
