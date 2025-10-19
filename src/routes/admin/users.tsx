import { createFileRoute } from "@tanstack/react-router";

import { AdminUserDirectory } from "~/features/admin/components/admin-user-directory";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsersRoute,
});

function AdminUsersRoute() {
  const { user } = Route.useRouteContext() as {
    user: { id: string } | null;
  };
  return <AdminUserDirectory currentUser={user} />;
}
