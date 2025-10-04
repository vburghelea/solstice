import { createFileRoute } from "@tanstack/react-router";

import { AdminUserDirectory } from "~/features/admin/components/admin-user-directory";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsersRoute,
});

function AdminUsersRoute() {
  return <AdminUserDirectory />;
}
