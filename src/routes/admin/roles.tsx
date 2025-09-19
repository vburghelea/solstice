import { createFileRoute } from "@tanstack/react-router";
import { RoleManagementDashboard } from "~/features/roles/components/role-management-dashboard";
import { requireGlobalAdmin } from "~/lib/auth/middleware/role-guard";

export const Route = createFileRoute("/admin/roles")({
  beforeLoad: async ({ context }) => {
    await requireGlobalAdmin(context.user);
  },
  component: AdminRolesPage,
});

function AdminRolesPage() {
  return (
    <div className="container mx-auto space-y-8 p-6">
      <RoleManagementDashboard />
    </div>
  );
}
