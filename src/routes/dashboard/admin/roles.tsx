import { createFileRoute } from "@tanstack/react-router";
import { RoleManagementDashboard } from "~/features/roles/components/role-management-dashboard";

export const Route = createFileRoute("/dashboard/admin/roles")({
  component: AdminRolesPage,
});

function AdminRolesPage() {
  return (
    <div className="container mx-auto space-y-8 p-6">
      <RoleManagementDashboard />
    </div>
  );
}
