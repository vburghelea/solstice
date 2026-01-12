import { createFileRoute } from "@tanstack/react-router";
import { SupportRequestsPanel } from "~/features/support/components/support-requests-panel";
import { requireFeatureInRoute } from "~/tenant/feature-gates";
import { createPageHead } from "~/shared/lib/page-head";

export const Route = createFileRoute("/dashboard/sin/support")({
  beforeLoad: () => {
    requireFeatureInRoute("sin_support");
  },
  head: () => createPageHead("Support"),
  component: SinSupportPage,
});

function SinSupportPage() {
  return (
    <div className="container mx-auto space-y-6 p-6">
      <SupportRequestsPanel />
    </div>
  );
}
