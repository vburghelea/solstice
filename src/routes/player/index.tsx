import { createFileRoute } from "@tanstack/react-router";

import { PlayerDashboard } from "~/features/player/components/player-dashboard";

export const Route = createFileRoute("/player/")({
  component: PlayerLanding,
});

function PlayerLanding() {
  const { user } = Route.useRouteContext();
  return <PlayerDashboard user={user} />;
}
