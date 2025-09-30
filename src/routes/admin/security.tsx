import { createFileRoute } from "@tanstack/react-router";

import { AdminSecurityCenter } from "~/features/admin/components/admin-security-center";

export const Route = createFileRoute("/admin/security")({
  component: AdminSecurityRoute,
});

function AdminSecurityRoute() {
  return <AdminSecurityCenter />;
}
