import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/games")({
  component: GamesLayout,
});

function GamesLayout() {
  return <Outlet />;
}
