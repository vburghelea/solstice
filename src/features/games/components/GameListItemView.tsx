import { Link } from "@tanstack/react-router";
import { Calendar, ChevronRight, MapPin, Sparkles, Users } from "lucide-react";
import type { GameListItem } from "~/features/games/games.types";
import { formatDateAndTime } from "~/shared/lib/datetime";
import { Button } from "~/shared/ui/button";
import { List } from "~/shared/ui/list";

interface GameListItemViewProps {
  game: GameListItem;
}

export function GameListItemView({ game }: GameListItemViewProps) {
  const formattedDate = formatDateAndTime(game.dateTime);
  const price = game.price ? `$${(game.price / 100).toFixed(2)}` : "Free";

  return (
    <List.Item className="group px-4 py-4 sm:px-5 sm:py-5">
      <article className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <h3 className="text-foreground truncate text-base font-semibold sm:text-lg">
              {game.name}
            </h3>
            {game.description ? (
              <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                {game.description}
              </p>
            ) : null}
          </div>
          <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="text-muted-foreground size-4" />
              <span className="truncate">{formattedDate}</span>
            </span>
            {game.location?.address ? (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="text-muted-foreground size-4" />
                <span className="truncate">{game.location.address}</span>
              </span>
            ) : null}
            {game.gameSystem?.name ? (
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="text-muted-foreground size-4" />
                <span className="truncate">{game.gameSystem.name}</span>
              </span>
            ) : null}
            <span className="text-foreground inline-flex items-center gap-1.5 font-medium">
              {price}
            </span>
            {typeof game.participantCount === "number" ? (
              <span className="inline-flex items-center gap-1.5">
                <Users className="text-muted-foreground size-4" />
                <span>{game.participantCount}</span>
              </span>
            ) : null}
          </div>
        </div>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="w-full shrink-0 gap-1.5 sm:w-auto"
        >
          <Link
            to="/game/$gameId"
            params={{ gameId: game.id }}
            className="flex items-center justify-center"
          >
            View
            <ChevronRight className="size-4" />
          </Link>
        </Button>
      </article>
    </List.Item>
  );
}
