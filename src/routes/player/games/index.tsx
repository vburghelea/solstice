import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Calendar, ChevronRight, Gamepad2, PlusIcon, Users } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
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
import { cn } from "~/shared/lib/utils";
import type { OperationResult } from "~/shared/types/common";

function getStatusBadgeVariant(status: GameListItem["status"]) {
  switch (status) {
    case "completed":
      return "default" as const;
    case "canceled":
      return "destructive" as const;
    case "scheduled":
    default:
      return "secondary" as const;
  }
}

export const Route = createFileRoute("/player/games/")({
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

function GamesPage() {
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
          <h1 className="text-foreground text-2xl font-bold sm:text-3xl">My Games</h1>
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
            <SelectTrigger className="border-border bg-card text-foreground w-[160px] border sm:w-[180px]">
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
            <Link to="/player/games/create">
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
              <Link to="/player/games/create">
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
            <ul className="space-y-3">
              {games.map((g: GameListItem) => {
                const formattedDateTime = formatDateAndTime(g.dateTime);
                return (
                  <li key={g.id}>
                    <article
                      className={cn(
                        "bg-card text-card-foreground border-border rounded-xl border p-4 shadow-sm transition-shadow hover:shadow-md",
                        "focus-within:ring-ring/70 focus-within:ring-offset-background focus-within:ring-2 focus-within:ring-offset-2 focus-within:outline-none",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge
                              variant={getStatusBadgeVariant(g.status)}
                              className="px-2 py-0 text-[11px] capitalize"
                            >
                              {g.status}
                            </Badge>
                            <h3 className="truncate text-base leading-6 font-semibold">
                              {g.name}
                            </h3>
                          </div>
                          <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                            <span className="inline-flex items-center gap-1">
                              <Calendar
                                className="h-3.5 w-3.5 flex-shrink-0"
                                aria-hidden
                              />
                              <span className="truncate">{formattedDateTime}</span>
                            </span>
                            <span className="inline-flex min-w-0 items-center gap-1">
                              <span className="truncate">
                                {g.gameSystem?.name || "N/A"}
                              </span>
                            </span>
                          </div>
                          <div className="text-muted-foreground flex items-center gap-1 text-xs">
                            <Users className="h-3.5 w-3.5 flex-shrink-0" aria-hidden />
                            <span>
                              {g.participantCount} participant
                              {g.participantCount === 1 ? "" : "s"}
                            </span>
                          </div>
                        </div>
                        <Button asChild variant="outline" size="sm" className="shrink-0">
                          <Link to="/player/games/$gameId" params={{ gameId: g.id }}>
                            View
                            <ChevronRight className="ml-1 h-4 w-4" aria-hidden />
                          </Link>
                        </Button>
                      </div>
                    </article>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Desktop grid */}
          <div className="hidden gap-6 md:grid md:grid-cols-2 lg:grid-cols-3">
            {games.map((game: GameListItem) => (
              <GameCard
                key={game.id}
                game={game}
                isOwner={!!user && game.owner?.id === user.id}
                onUpdateStatus={updateStatusMutation.mutate}
                viewLink={{
                  to: "/player/games/$gameId",
                  params: { gameId: game.id },
                  from: "/player/games",
                  label: "View Game",
                }}
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
