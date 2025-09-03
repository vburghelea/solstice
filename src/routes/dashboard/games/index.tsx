import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
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
import { updateGameSessionStatus } from "~/features/games/games.mutations";
import { listGames } from "~/features/games/games.queries";
import type { GameListItem } from "~/features/games/games.types";
import type { OperationResult } from "~/shared/types/common";
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
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();

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

  const updateStatusMutation = useMutation({
    mutationFn: updateGameSessionStatus,
    // Optimistic update list caches for all statuses
    onMutate: async (variables: {
      data: { gameId: string; status: "scheduled" | "completed" | "canceled" };
    }) => {
      const { gameId, status: newStatus } = variables.data;
      const statuses: Array<"scheduled" | "completed" | "canceled"> = [
        "scheduled",
        "completed",
        "canceled",
      ];

      // Cancel ongoing fetches for any games lists
      await Promise.all(
        statuses.map((s) =>
          queryClient.cancelQueries({ queryKey: ["allVisibleGames", s] }),
        ),
      );

      // Snapshot previous caches and locate the game item
      const previous: Record<string, OperationResult<GameListItem[]> | undefined> = {};
      let foundItem: GameListItem | undefined = undefined;

      for (const s of statuses) {
        const key = ["allVisibleGames", s] as const;
        const prev = queryClient.getQueryData<OperationResult<GameListItem[]>>(key);
        previous[s] = prev;
        if (prev?.success) {
          const item = prev.data.find((g) => g.id === gameId);
          if (item && !foundItem) foundItem = item;
        }
      }

      // Update caches
      for (const s of statuses) {
        const key = ["allVisibleGames", s] as const;
        const prev = previous[s];
        if (!prev?.success) continue;
        let list = prev.data;
        if (s === newStatus) {
          if (foundItem) {
            const updatedItem: GameListItem = {
              ...foundItem,
              status: newStatus,
            } as GameListItem;
            list = [updatedItem, ...list.filter((g) => g.id !== gameId)];
          }
        } else {
          // Remove from lists of other statuses
          list = list.filter((g) => g.id !== gameId);
        }
        queryClient.setQueryData<OperationResult<GameListItem[]>>(key, {
          success: true,
          data: list,
        });
      }

      return { previous };
    },
    onError: (err, _vars, context) => {
      // Rollback to previous caches
      const prev = context?.previous as
        | Record<string, OperationResult<GameListItem[]> | undefined>
        | undefined;
      if (prev) {
        (Object.keys(prev) as Array<"scheduled" | "completed" | "canceled">).forEach(
          (s) => {
            const key = ["allVisibleGames", s] as const;
            const val = prev[s];
            if (val) queryClient.setQueryData(key, val);
          },
        );
      }
      toast.error(err.message || "An unexpected error occurred");
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Game status updated");
      } else {
        toast.error(result.errors?.[0]?.message || "Failed to update status");
      }
    },
    onSettled: async () => {
      // Ensure server truth eventually
      await queryClient.invalidateQueries({ queryKey: ["allVisibleGames"] });
    },
  });

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
            <GameCard
              key={game.id}
              game={game}
              isOwner={!!user && game.owner?.id === user.id}
              onUpdateStatus={updateStatusMutation.mutate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
