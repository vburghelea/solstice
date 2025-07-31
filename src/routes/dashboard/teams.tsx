import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/teams")({
  component: TeamsLayout,
});

function TeamsLayout() {
  return <Outlet />;
}
