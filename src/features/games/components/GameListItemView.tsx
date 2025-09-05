import { Link } from "@tanstack/react-router";
import { Calendar, ChevronRight, MapPin, Sparkles, Users } from "lucide-react";
import type { GameListItem } from "~/features/games/games.types";
import { List } from "~/shared/ui/list";

interface GameListItemViewProps {
  game: GameListItem;
}

export function GameListItemView({ game }: GameListItemViewProps) {
  const formattedDate = new Date(game.dateTime).toLocaleString();
  const price = game.price ? `$${(game.price / 100).toFixed(2)}` : "Free";

  return (
    <List.Item className="group">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-base font-semibold text-gray-900">
            {game.name}
          </div>
          {game.description ? (
            <div className="text-muted-foreground mt-0.5 line-clamp-1 text-sm">
              {game.description}
            </div>
          ) : null}
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" /> {formattedDate}
            </span>
            {game.location?.address ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> {game.location.address}
              </span>
            ) : null}
            {game.gameSystem?.name ? (
              <span className="inline-flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5" /> {game.gameSystem.name}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1">{price}</span>
            {typeof game.participantCount === "number" ? (
              <span className="inline-flex items-center gap-1">
                <Users className="h-3.5 w-3.5" /> {game.participantCount}
              </span>
            ) : null}
          </div>
        </div>
        <Link
          to="/game/$gameId"
          params={{ gameId: game.id }}
          className="text-primary inline-flex shrink-0 items-center gap-1 text-sm font-medium hover:underline"
        >
          View
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </List.Item>
  );
}
