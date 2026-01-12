import { createFileRoute } from "@tanstack/react-router";
import { RoleManagementDashboard } from "~/features/roles/components/role-management-dashboard";
import { createPageHead } from "~/shared/lib/page-head";

export const Route = createFileRoute("/dashboard/admin/roles")({
  head: () => createPageHead("Role Management"),
  component: AdminRolesPage,
});

function AdminRolesPage() {
  return (
    <div className="container mx-auto space-y-8 p-6">
      <RoleManagementDashboard />
    </div>
  );
}
