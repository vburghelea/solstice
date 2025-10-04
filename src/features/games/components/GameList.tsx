import type { GameListItem } from "~/features/games/games.types";
import type { GameCardLinkConfig } from "./GameCard";
import { GameCard } from "./GameCard";

interface GameListProps {
  readonly games: GameListItem[];
  readonly getViewLink?: (game: GameListItem) => GameCardLinkConfig | undefined;
}

export function GameList({ games, getViewLink }: GameListProps) {
  if (games.length === 0) {
    return <p className="text-muted-foreground">No games found. Create one!</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {games.map((game) => {
        const link = getViewLink?.(game);
        return (
          <GameCard key={game.id} game={game} {...(link ? { viewLink: link } : {})} />
        );
      })}
    </div>
  );
}
