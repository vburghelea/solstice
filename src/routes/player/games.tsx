import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/player/games")({
  component: GamesLayout,
});

function GamesLayout() {
  return <Outlet />;
}
