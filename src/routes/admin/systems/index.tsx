import { createFileRoute } from "@tanstack/react-router";

import {
  AdminSystemsPage,
  adminSystemsSearchSchema,
} from "~/features/game-systems/admin/views/admin-systems-page";
import { useGameSystemsTranslation } from "~/hooks/useTypedTranslation";
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
  const { t } = useGameSystemsTranslation();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  return (
    <AdminSystemsPage
      search={search}
      navigate={navigate}
      detailRoute="/admin/systems/$systemId"
      headerTitle={t("admin.admin_catalog.title")}
      headerDescription={t("admin.admin_catalog.description")}
      className="space-y-6 p-6 lg:p-8"
    />
  );
}
