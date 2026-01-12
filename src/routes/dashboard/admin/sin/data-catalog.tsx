import { createFileRoute } from "@tanstack/react-router";
import { DataCatalogPanel } from "~/features/data-catalog/components/data-catalog-panel";
import { createPageHead } from "~/shared/lib/page-head";
import { requireFeatureInRoute } from "~/tenant/feature-gates";

export const Route = createFileRoute("/dashboard/admin/sin/data-catalog")({
  beforeLoad: () => {
    requireFeatureInRoute("sin_data_catalog");
  },
  head: () => createPageHead("Data Catalog"),
  component: SinDataCatalogPage,
});

function SinDataCatalogPage() {
  return (
    <div className="container mx-auto space-y-6 p-6">
      <DataCatalogPanel />
    </div>
  );
}
