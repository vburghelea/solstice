import { createFileRoute } from "@tanstack/react-router";

import {
  AdminSystemsPage,
  adminSystemsSearchSchema,
} from "~/features/game-systems/admin/views/admin-systems-page";
import { requireRole } from "~/lib/auth/middleware/role-guard";

export const Route = createFileRoute("/dashboard/systems/")({
  validateSearch: adminSystemsSearchSchema.parse,
  beforeLoad: async ({ context }) => {
    await requireRole({
      user: context.user,
      requiredRoles: ["Games Admin", "Platform Admin"],
      redirectTo: "/dashboard",
    });
  },
  component: DashboardAdminSystemsRoute,
});

function DashboardAdminSystemsRoute() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  return <AdminSystemsPage search={search} navigate={navigate} />;
}
