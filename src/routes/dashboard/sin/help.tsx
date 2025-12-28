import { createFileRoute } from "@tanstack/react-router";
import { HelpCenter } from "~/features/help/components/help-center";
import { requireFeatureInRoute } from "~/tenant/feature-gates";

export const Route = createFileRoute("/dashboard/sin/help")({
  beforeLoad: () => {
    requireFeatureInRoute("sin_help_center");
  },
  component: SinHelpCenterPage,
});

function SinHelpCenterPage() {
  return (
    <div className="container mx-auto space-y-6 p-6">
      <HelpCenter />
    </div>
  );
}
