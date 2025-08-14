import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Gamepad2, PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "~/components/ui/card";
import { GameCard } from "~/features/games/components/GameCard";
import { listGames } from "~/features/games/games.queries";
import type { GameListItem } from "~/features/games/games.types";
import { Button } from "~/shared/ui/button";

export const Route = createFileRoute("/dashboard/games/")({
  component: GamesPage,
  loader: async () => {
    const result = await listGames({ data: { filters: { status: "scheduled" } } });
    if (!result.success) {
      toast.error("Failed to load games.");
      return { games: [] };
    }
    return { games: result.data };
  },
});

function GamesPage() {
  const { games: initialGames } = Route.useLoaderData();

  const { data: gamesData } = useSuspenseQuery({
    queryKey: ["allVisibleGames", "scheduled"],
    queryFn: () => listGames({ data: { filters: { status: "scheduled" } } }),
    initialData: { success: true, data: initialGames },
  });

  const games = gamesData.success ? gamesData.data : [];

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Games</h1>
          <p className="text-muted-foreground">Manage your game sessions</p>
        </div>
        <Button asChild>
          <Link to="/dashboard/games/create">
            <PlusIcon className="mr-2 h-4 w-4" />
            Create New Game
          </Link>
        </Button>
      </div>

      {games.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Gamepad2 className="text-muted-foreground mb-4 h-12 w-12" />
            <h3 className="mb-2 text-lg font-semibold">No games yet</h3>
            <p className="text-muted-foreground mb-4 text-center">
              Create your first game session to get started
            </p>
            <Button asChild>
              <Link to="/dashboard/games/create">
                <PlusIcon className="mr-2 h-4 w-4" />
                Create New Game
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {games.map((game: GameListItem) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      )}
    </div>
  );
}
