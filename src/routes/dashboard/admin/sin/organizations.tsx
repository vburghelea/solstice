import { createFileRoute } from "@tanstack/react-router";
import { OrganizationAdminPanel } from "~/features/organizations/components/organization-admin-panel";
import { requireFeatureInRoute } from "~/tenant/feature-gates";

export const Route = createFileRoute("/dashboard/admin/sin/organizations")({
  beforeLoad: () => {
    requireFeatureInRoute("sin_admin_orgs");
  },
  component: SinOrganizationsPage,
});

function SinOrganizationsPage() {
  return (
    <div className="container mx-auto space-y-6 p-6">
      <OrganizationAdminPanel />
    </div>
  );
}
