import { createFileRoute } from "@tanstack/react-router";
import { SupportRequestsPanel } from "~/features/support/components/support-requests-panel";
import { requireFeatureInRoute } from "~/tenant/feature-gates";

export const Route = createFileRoute("/dashboard/sin/support")({
  beforeLoad: () => {
    requireFeatureInRoute("sin_support");
  },
  component: SinSupportPage,
});

function SinSupportPage() {
  return (
    <div className="container mx-auto space-y-6 p-6">
      <SupportRequestsPanel />
    </div>
  );
}
