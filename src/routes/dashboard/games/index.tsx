import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Gamepad2, PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Card, CardContent } from "~/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { gameStatusEnum } from "~/db/schema";
import { GameCard } from "~/features/games/components/GameCard";
import { listGames } from "~/features/games/games.queries";
import type { GameListItem } from "~/features/games/games.types";
import { Button } from "~/shared/ui/button";

export const Route = createFileRoute("/dashboard/games/")({
  component: GamesPage,
  validateSearch: z.object({
    status: z.enum(gameStatusEnum.enumValues).optional(),
  }),
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
  const { status = "scheduled" } = Route.useSearch();
  const navigate = Route.useNavigate();

  const { data: gamesData } = useSuspenseQuery({
    queryKey: ["allVisibleGames", status],
    queryFn: async () => {
      const result = await listGames({ data: { filters: { status } } });
      if (!result.success) {
        toast.error("Failed to load games.");
        return { success: false, data: [] };
      }
      return result;
    },
  });

  const games = gamesData.success ? gamesData.data : [];

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Games</h1>
          <p className="text-muted-foreground">Manage your game sessions</p>
        </div>
        <div className="flex items-center gap-4">
          <Select
            value={status}
            onValueChange={(value) => {
              navigate({
                search: { status: value as (typeof gameStatusEnum.enumValues)[number] },
              });
            }}
          >
            <SelectTrigger className="w-[180px] border border-gray-300 bg-white text-gray-900">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              {gameStatusEnum.enumValues.map((status) => (
                <SelectItem key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button asChild>
            <Link to="/dashboard/games/create">
              <PlusIcon className="mr-2 h-4 w-4" />
              Create New Game
            </Link>
          </Button>
        </div>
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
