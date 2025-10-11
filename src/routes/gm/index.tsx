import { createFileRoute } from "@tanstack/react-router";

import {
  GameMasterDashboardContainer,
  loadGameMasterDashboardData,
  type GameMasterDashboardInitialData,
} from "~/features/gm/components/game-master-dashboard-container";

export const Route = createFileRoute("/gm/")({
  loader: loadGameMasterDashboardData,
  component: GameMasterLanding,
});

function GameMasterLanding() {
  const initialData = Route.useLoaderData() as GameMasterDashboardInitialData;
  return <GameMasterDashboardContainer initialData={initialData} />;
}
