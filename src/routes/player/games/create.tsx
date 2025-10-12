import { createFileRoute, useSearch } from "@tanstack/react-router";

import {
  createGameSearchSchema,
  GameCreateView,
  GameSessionTipsCard,
} from "~/routes/gm/games/create";

export const Route = createFileRoute("/player/games/create")({
  component: PlayerCreateGamePage,
  validateSearch: (search) => createGameSearchSchema.parse(search),
});

function PlayerCreateGamePage() {
  const { campaignId } = useSearch({ from: Route.id });
  return (
    <GameCreateView
      basePath="/player/games"
      backLinkTo="/player/games"
      tips={<GameSessionTipsCard />}
      campaignId={campaignId}
    />
  );
}
