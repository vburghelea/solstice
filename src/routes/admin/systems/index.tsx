import { createFileRoute } from "@tanstack/react-router";

import {
  AdminSystemsPage,
  adminSystemsSearchSchema,
} from "~/features/game-systems/admin/views/admin-systems-page";
import { requireRole } from "~/lib/auth/middleware/role-guard";

export const Route = createFileRoute("/admin/systems/")({
  validateSearch: adminSystemsSearchSchema.parse,
  beforeLoad: async ({ context }) => {
    await requireRole({
      user: context.user,
      requiredRoles: ["Platform Admin", "Roundup Games Admin", "Super Admin"],
      redirectTo: "/admin",
    });
  },
  component: AdminSystemsRoute,
});

function AdminSystemsRoute() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  return (
    <AdminSystemsPage
      search={search}
      navigate={navigate}
      detailRoute="/admin/systems/$systemId"
      headerTitle="System catalog"
      headerDescription="Audit crawler health, editorial readiness, and media moderation across every published ruleset."
      className="space-y-6 p-6 lg:p-8"
    />
  );
}
