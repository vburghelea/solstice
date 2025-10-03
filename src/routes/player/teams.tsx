import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/player/teams")({
  component: TeamsLayout,
});

function TeamsLayout() {
  return <Outlet />;
}
