import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/roles")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard/admin/roles" });
  },
});
