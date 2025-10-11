import { createFileRoute } from "@tanstack/react-router";

import { RoleManagementDashboard } from "~/features/roles/components/role-management-dashboard";

export const Route = createFileRoute("/admin/roles")({
  component: RoleManagementDashboard,
});
