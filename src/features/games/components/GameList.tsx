import { GameListItem } from "~/features/games/games.types";
import { GameCard } from "./GameCard";

interface GameListProps {
  games: GameListItem[];
}

export function GameList({ games }: GameListProps) {
  if (games.length === 0) {
    return <p className="text-muted-foreground">No games found. Create one!</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {games.map((game) => (
        <GameCard key={game.id} game={game} />
      ))}
    </div>
  );
}
