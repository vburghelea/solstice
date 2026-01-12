import { createFileRoute } from "@tanstack/react-router";
import { FormBuilderShell } from "~/features/forms/components/form-builder-shell";
import { createPageHead } from "~/shared/lib/page-head";
import { requireFeatureInRoute } from "~/tenant/feature-gates";

export const Route = createFileRoute("/dashboard/admin/sin/forms")({
  beforeLoad: () => {
    requireFeatureInRoute("sin_admin_forms");
  },
  head: () => createPageHead("Form Builder"),
  component: SinFormsAdminPage,
});

function SinFormsAdminPage() {
  return (
    <div className="container mx-auto space-y-6 p-6">
      <FormBuilderShell />
    </div>
  );
}
