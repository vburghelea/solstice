import { Link } from "@tanstack/react-router"; // Added Link import
import { Calendar, CheckCircle, XCircle } from "lucide-react";
import { ProfileLink } from "~/components/ProfileLink";
import { Avatar } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card"; // Added Card imports
import { gameStatusEnum } from "~/db/schema/games.schema";
import type { GameListItem } from "~/features/games/games.types";
import { formatDateAndTime } from "~/shared/lib/datetime";
import { ThumbsScore } from "~/shared/ui/thumbs-score";

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

  const formattedDateTime = formatDateAndTime(game.dateTime);

  return (
    <Card className="transition-shadow hover:shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl">{game.name}</CardTitle>
        <div className="text-muted-foreground mt-1 flex items-center text-sm">
          <Calendar className="mr-2 h-4 w-4" />
          <span>{formattedDateTime}</span>
        </div>
        {game.description && (
          <CardDescription className="mt-2 line-clamp-2">
            {game.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          {game.owner && (
            <div className="flex items-center gap-2">
              <Avatar
                name={game.owner.name}
                email={game.owner.email}
                srcUploaded={game.owner.uploadedAvatarPath ?? null}
                srcProvider={game.owner.image ?? null}
                userId={game.owner.id}
                className="h-6 w-6"
              />
              <ProfileLink
                userId={game.owner.id}
                username={game.owner.name || game.owner.email}
                className="font-medium"
              />
              <span className="text-muted-foreground">•</span>
              <ThumbsScore value={game.owner.gmRating ?? null} />
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Players</span>
            <span className="font-medium">
              {game.minimumRequirements?.minPlayers || "?"} -{" "}
              {game.minimumRequirements?.maxPlayers || "?"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Visibility</span>
            <span className="font-medium capitalize">{game.visibility}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Participants</span>
            <span className="font-medium">{game.participantCount}</span>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link
              from="/dashboard/campaigns/$campaignId"
              to="/dashboard/games/$gameId"
              params={{ gameId: game.id }}
            >
              View Game
            </Link>
          </Button>
        </div>
      </CardContent>
      {isOwner && isActionable && (
        <div className="p-4 pt-0">
          <div className="flex flex-col gap-2">
            {game.status !== "completed" && (
              <Button
                variant="outline"
                size="sm"
                className="flex-2"
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
                className="flex-2"
                onClick={() => {
                  if (window.confirm("Are you sure you want to cancel this session?")) {
                    handleUpdateStatus("canceled");
                  }
                }}
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
