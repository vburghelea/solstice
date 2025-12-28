import { createFileRoute } from "@tanstack/react-router";
import { SupportAdminPanel } from "~/features/support/components/support-admin-panel";
import { requireFeatureInRoute } from "~/tenant/feature-gates";

export const Route = createFileRoute("/dashboard/admin/sin/support")({
  beforeLoad: () => {
    requireFeatureInRoute("sin_support");
  },
  component: SinSupportAdminPage,
});

function SinSupportAdminPage() {
  return (
    <div className="container mx-auto space-y-6 p-6">
      <SupportAdminPanel />
    </div>
  );
}
