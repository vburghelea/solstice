import { Link } from "@tanstack/react-router";
import { Calendar } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import type { GameListItem } from "~/features/games/games.types";

interface GameCardProps {
  game: GameListItem;
}

export function GameCard({ game }: GameCardProps) {
  const formattedDateTime = new Date(game.dateTime).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

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
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Game System</span>
            <span className="font-medium">{game.gameSystem?.name || "N/A"}</span>
          </div>
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
            <Link to="/dashboard/games/$gameId" params={{ gameId: game.id }}>
              View Game
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
