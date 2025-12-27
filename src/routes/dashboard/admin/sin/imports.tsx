import { createFileRoute } from "@tanstack/react-router";
import { ImportWizardShell } from "~/features/imports/components/import-wizard-shell";
import { requireFeatureInRoute } from "~/tenant/feature-gates";

export const Route = createFileRoute("/dashboard/admin/sin/imports")({
  beforeLoad: () => {
    requireFeatureInRoute("sin_admin_imports");
  },
  component: SinImportsAdminPage,
});

function SinImportsAdminPage() {
  return (
    <div className="container mx-auto space-y-6 p-6">
      <ImportWizardShell />
    </div>
  );
}
