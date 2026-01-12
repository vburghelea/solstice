import { createFileRoute } from "@tanstack/react-router";
import { DataQualityDashboard } from "~/features/data-quality/components/data-quality-dashboard";
import { createPageHead } from "~/shared/lib/page-head";
import { requireFeatureInRoute } from "~/tenant/feature-gates";

export const Route = createFileRoute("/dashboard/admin/sin/data-quality")({
  beforeLoad: () => {
    requireFeatureInRoute("sin_data_quality");
  },
  head: () => createPageHead("Data Quality"),
  component: SinDataQualityPage,
});

function SinDataQualityPage() {
  return (
    <div className="container mx-auto space-y-6 p-6">
      <DataQualityDashboard />
    </div>
  );
}
