import { CheckCircle, XCircle } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { gameStatusEnum } from "~/db/schema/games.schema";
import type { GameListItem } from "~/features/games/games.types";
import { GameCard } from "./GameCard";

interface CampaignGameSessionCardProps {
  game: GameListItem;
  isOwner: boolean;
  onUpdateStatus: (variables: {
    data: {
      gameId: string;
      status: "scheduled" | "completed" | "canceled";
    };
  }) => void;
}

export function CampaignGameSessionCard({
  game,
  isOwner,
  onUpdateStatus,
}: CampaignGameSessionCardProps) {
  const handleUpdateStatus = (status: (typeof gameStatusEnum.enumValues)[number]) => {
    onUpdateStatus({ data: { gameId: game.id, status } });
  };

  const canCancel = game.status !== "completed" && game.status !== "canceled";
  const isActionable = game.status !== "completed" && game.status !== "canceled";

  return (
    <Card>
      <GameCard game={game} />
      {isOwner && isActionable && (
        <div className="p-4 pt-0">
          <div className="flex gap-2">
            {game.status !== "completed" && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => handleUpdateStatus("completed")}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark Completed
              </Button>
            )}
            {canCancel && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => handleUpdateStatus("canceled")}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Cancel Session
              </Button>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
