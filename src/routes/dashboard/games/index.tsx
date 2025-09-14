import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Calendar, ChevronRight, Gamepad2, PlusIcon, Users } from "lucide-react";
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
import { listGamesWithCount } from "~/features/games/games.queries";
import type { GameListItem } from "~/features/games/games.types";
import { formatDateAndTime } from "~/shared/lib/datetime";
import type { OperationResult } from "~/shared/types/common";
import { Button } from "~/shared/ui/button";
import { List } from "~/shared/ui/list";

export const Route = createFileRoute("/dashboard/games/")({
  component: GamesPage,
  validateSearch: z.object({
    status: z.enum(gameStatusEnum.enumValues).optional(),
    page: z.coerce.number().int().min(1).optional(),
    pageSize: z.coerce.number().int().min(1).max(100).optional(),
  }),
  loader: async () => {
    const result: OperationResult<{
      items: GameListItem[];
      totalCount: number;
    }> = await listGamesWithCount({
      data: { filters: { status: "scheduled" }, page: 1, pageSize: 20 },
    });
    if (!result.success) {
      toast.error("Failed to load games.");
      return { games: [], totalCount: 0 };
    }
    return { games: result.data.items, totalCount: result.data.totalCount };
  },
});

export function GamesPage() {
  const {
    status = "scheduled",
    page: searchPage,
    pageSize: searchPageSize,
  } = Route.useSearch();
  const page = Math.max(1, Number(searchPage ?? 1));
  const navigate = Route.useNavigate();
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();

  const pageSize = Math.min(100, Math.max(1, Number(searchPageSize ?? 20)));
  const { data: gamesData } = useSuspenseQuery<
    OperationResult<{ items: GameListItem[]; totalCount: number }>
  >({
    queryKey: ["allVisibleGames", status, page, pageSize],
    queryFn: async () => {
      const result: OperationResult<{
        items: GameListItem[];
        totalCount: number;
      }> = await listGamesWithCount({
        data: { filters: { status }, page, pageSize },
      });
      if (!result.success) {
        toast.error("Failed to load games.");
      }
      return result;
    },
  });

  const games = gamesData.success ? gamesData.data.items : [];
  const totalCount = gamesData.success ? gamesData.data.totalCount : 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

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
    <div className="container mx-auto p-4 sm:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">My Games</h1>
          <p className="text-muted-foreground">Manage your game sessions</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <Select
            value={status}
            onValueChange={(value) => {
              navigate({
                search: { status: value as (typeof gameStatusEnum.enumValues)[number] },
              });
            }}
          >
            <SelectTrigger className="w-[160px] border border-gray-300 bg-white text-gray-900 sm:w-[180px]">
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
        <>
          {/* Mobile list */}
          <div className="md:hidden">
            <List>
              {games.map((g: GameListItem) => {
                const formattedDateTime = formatDateAndTime(g.dateTime);
                const statusBadgeClass =
                  g.status === "scheduled"
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : g.status === "completed"
                      ? "bg-green-50 text-green-700 border-green-200"
                      : "bg-red-50 text-red-700 border-red-200";
                return (
                  <List.Item key={g.id} className="group">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <div
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize ${statusBadgeClass}`}
                          >
                            {g.status}
                          </div>
                          <div className="truncate text-base font-semibold text-gray-900">
                            {g.name}
                          </div>
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-xs text-gray-600">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" /> {formattedDateTime}
                          </span>
                          <span className="truncate">{g.gameSystem?.name || "N/A"}</span>
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                          <Users className="h-3.5 w-3.5" /> {g.participantCount}{" "}
                          participants
                        </div>
                      </div>
                      <Link
                        to="/dashboard/games/$gameId"
                        params={{ gameId: g.id }}
                        className="text-primary inline-flex shrink-0 items-center gap-1 text-sm font-medium hover:underline"
                      >
                        View
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </List.Item>
                );
              })}
            </List>
          </div>

          {/* Desktop grid */}
          <div className="hidden gap-6 md:grid md:grid-cols-2 lg:grid-cols-3">
            {games.map((game: GameListItem) => (
              <GameCard
                key={game.id}
                game={game}
                isOwner={!!user && game.owner?.id === user.id}
                onUpdateStatus={updateStatusMutation.mutate}
              />
            ))}
          </div>
        </>
      )}
      <div className="mt-6 flex items-center justify-between">
        <div className="text-muted-foreground text-sm">
          Page {page} of {totalPages} • {totalCount} total
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              navigate({ search: { status, page: Math.max(1, page - 1), pageSize } })
            }
            disabled={page <= 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              navigate({
                search: { status, page: Math.min(totalPages, page + 1), pageSize },
              })
            }
            disabled={page >= totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
