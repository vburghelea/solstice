import { createFileRoute } from "@tanstack/react-router";
import { TemplateAdminPanel } from "~/features/templates/components/template-admin-panel";
import { createPageHead } from "~/shared/lib/page-head";
import { requireFeatureInRoute } from "~/tenant/feature-gates";

export const Route = createFileRoute("/dashboard/admin/sin/templates")({
  beforeLoad: () => {
    requireFeatureInRoute("sin_templates");
  },
  head: () => createPageHead("Templates"),
  component: SinTemplatesAdminPage,
});

function SinTemplatesAdminPage() {
  return (
    <div className="container mx-auto space-y-6 p-6">
      <TemplateAdminPanel />
    </div>
  );
}
