import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/teams/$teamId")({
  component: TeamLayout,
});

function TeamLayout() {
  return <Outlet />;
}
