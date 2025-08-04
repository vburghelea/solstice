import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { GameListItem } from "~/features/games/games.types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/shared/ui/card";

interface GameCardProps {
  game: GameListItem;
}

export function GameCard({ game }: GameCardProps) {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{game.gameSystem?.name || "Unknown Game"}</CardTitle>
        <CardDescription>{game.description.substring(0, 100)}...</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm">
          <strong>Date:</strong> {format(new Date(game.dateTime), "PPP p")}
        </p>
        <p className="text-sm">
          <strong>Location:</strong> {game.location.address}
        </p>
        <p className="text-sm">
          <strong>Status:</strong> {game.status}
        </p>
        <p className="text-sm">
          <strong>Participants:</strong> {game.participantCount}
        </p>
        <Link
          from="/dashboard/games"
          to="$gameId"
          params={{ gameId: game.id }}
          className="text-blue-500 hover:underline"
        >
          View Details
        </Link>
      </CardContent>
    </Card>
  );
}
