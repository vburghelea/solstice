import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/systems")({
  component: AdminSystemsLayout,
});

function AdminSystemsLayout() {
  return <Outlet />;
}
