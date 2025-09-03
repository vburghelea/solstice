import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle, Edit2, LoaderCircle, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { GameForm } from "~/features/games/components/GameForm";
import { GameParticipantsList } from "~/features/games/components/GameParticipantsList";
import { InviteParticipants } from "~/features/games/components/InviteParticipants";

import { ManageInvitations } from "~/features/games/components/ManageInvitations";
import { RespondToInvitation } from "~/features/games/components/RespondToInvitation";
import {
  applyToGame,
  cancelGame,
  updateGame,
  updateGameSessionStatus,
} from "~/features/games/games.mutations";
import {
  getGame,
  getGameApplicationForUser,
  getGameApplications,
} from "~/features/games/games.queries";
import type {
  GameListItem,
  GameParticipant,
  GameWithDetails,
} from "~/features/games/games.types";
import type { OperationResult } from "~/shared/types/common";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const Route = createFileRoute("/dashboard/games/$gameId")({
  loader: async ({ params }) => {
    if (!UUID_REGEX.test(params.gameId)) {
      toast.error("Invalid game ID format.");
      throw new Error("Invalid game ID");
    }

    const result = await getGame({ data: { id: params.gameId } });
    if (!result.success || !result.data) {
      toast.error("Failed to load game details.");
      throw new Error("Game not found");
    }
    return { game: result.data };
  },
  component: GameDetailsPage,
});

function GameDetailsView({ game }: { game: GameWithDetails }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-gray-900">{game.name}</CardTitle>
        <CardDescription>{game.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="font-semibold">Game System</p>
            <p>{game.gameSystem.name}</p>
          </div>
          <div>
            <p className="font-semibold">Date & Time</p>
            <p>{new Date(game.dateTime).toLocaleString()}</p>
          </div>
          <div>
            <p className="font-semibold">Expected Duration</p>
            <p>{game.expectedDuration} minutes</p>
          </div>
          <div>
            <p className="font-semibold">Price</p>
            <p>{game.price ? `€${game.price}` : "Free"}</p>
          </div>
          <div>
            <p className="font-semibold">Language</p>
            <p>{game.language}</p>
          </div>
          <div>
            <p className="font-semibold">Visibility</p>
            <p>{game.visibility}</p>
          </div>
        </div>
        <Separator />
        <div>
          <p className="font-semibold">Location</p>
          <p>{game.location.address}</p>
        </div>
        <Separator />
        <div>
          <p className="font-semibold">Minimum Requirements</p>
          <p>
            Players: {game.minimumRequirements?.minPlayers} -{" "}
            {game.minimumRequirements?.maxPlayers}
          </p>
          <p>Language Level: {game.minimumRequirements?.languageLevel}</p>
        </div>
        <Separator />
        <div>
          <p className="font-semibold">Safety Rules</p>
          <ul>
            {game.safetyRules &&
              Object.entries(game.safetyRules).map(
                ([rule, enabled]) =>
                  enabled && <li key={rule}>{rule.replace(/-/g, " ")}</li>,
              )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

export function GameDetailsPage() {
  const queryClient = useQueryClient();
  const { gameId } = Route.useParams();
  const { user: currentUser } = Route.useRouteContext();

  const [isEditing, setIsEditing] = useState(false);

  const { data: game, isLoading } = useQuery({
    queryKey: ["game", gameId], // Simplified queryKey
    queryFn: async () => {
      const result = await getGame({ data: { id: gameId } });
      if (!result.success) {
        throw new Error(result.errors?.[0]?.message || "Failed to fetch game");
      }
      if (!result.data) {
        throw new Error("Game data not found");
      }
      return result.data;
    },
    enabled: !!gameId,
  });

  const isOwner = game?.owner?.id === currentUser?.id;
  const isInvited = game?.participants?.some(
    (p: GameParticipant) =>
      p.userId === currentUser?.id && p.role === "invited" && p.status === "pending",
  );
  const invitedParticipant = game?.participants?.find(
    (p: GameParticipant) =>
      p.userId === currentUser?.id && p.role === "invited" && p.status === "pending",
  );
  const isParticipant = game?.participants?.some(
    (p: GameParticipant) =>
      p.userId === currentUser?.id &&
      (p.role === "player" || p.role === "invited") &&
      p.status !== "rejected",
  );

  const updateGameMutation = useMutation({
    mutationFn: updateGame,
    onSuccess: async (data) => {
      if (data.success) {
        toast.success("Game updated successfully");
        await queryClient.invalidateQueries({ queryKey: ["game", gameId] });
        setIsEditing(false);
      } else {
        toast.error(data.errors?.[0]?.message || "Failed to update game");
      }
    },
    onError: (error) => {
      toast.error(error.message || "An unexpected error occurred");
    },
  });

  const cancelGameMutation = useMutation({
    mutationFn: cancelGame,
    onMutate: async () => {
      // Cancel queries for detail and lists
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ["game", gameId] }),
        queryClient.cancelQueries({ queryKey: ["allVisibleGames"] }),
      ]);

      // Snapshot previous state
      const prevGame = queryClient.getQueryData<GameWithDetails | undefined>([
        "game",
        gameId,
      ]);

      const statuses: Array<"scheduled" | "completed" | "canceled"> = [
        "scheduled",
        "completed",
        "canceled",
      ];
      const previousLists: Record<string, OperationResult<GameListItem[]> | undefined> =
        {};
      let foundItem: GameListItem | undefined = undefined;
      for (const s of statuses) {
        const key = ["allVisibleGames", s] as const;
        const prev = queryClient.getQueryData<OperationResult<GameListItem[]>>(key);
        previousLists[s] = prev;
        if (prev?.success && !foundItem) {
          const item = prev.data.find((g) => g.id === gameId);
          if (item) foundItem = item;
        }
      }

      // Optimistically update detail
      if (prevGame) {
        queryClient.setQueryData<GameWithDetails>(["game", gameId], {
          ...prevGame,
          status: "canceled",
        });
      }

      // Optimistically update lists
      for (const s of statuses) {
        const key = ["allVisibleGames", s] as const;
        const prev = previousLists[s];
        if (!prev?.success) continue;
        let list = prev.data;
        if (s === "canceled") {
          if (foundItem) {
            const updatedItem: GameListItem = {
              ...foundItem,
              status: "canceled",
            } as GameListItem;
            list = [updatedItem, ...list.filter((g) => g.id !== gameId)];
          }
        } else {
          list = list.filter((g) => g.id !== gameId);
        }
        queryClient.setQueryData<OperationResult<GameListItem[]>>(key, {
          success: true,
          data: list,
        });
      }

      return { prevGame, previousLists };
    },
    onError: (error, _vars, context) => {
      // Rollback detail
      if (context?.prevGame) {
        queryClient.setQueryData(["game", gameId], context.prevGame);
      }
      // Rollback lists
      const prev = context?.previousLists;
      if (prev) {
        (Object.keys(prev) as Array<"scheduled" | "completed" | "canceled">).forEach(
          (s) => {
            const key = ["allVisibleGames", s] as const;
            const val = prev[s];
            if (val) queryClient.setQueryData(key, val);
          },
        );
      }
      toast.error(error.message || "An unexpected error occurred");
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Game cancelled successfully");
      } else {
        toast.error(data.errors?.[0]?.message || "Failed to cancel game");
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["game", gameId] });
      await queryClient.invalidateQueries({ queryKey: ["allVisibleGames"] });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: updateGameSessionStatus,
    onMutate: async (variables: {
      data: { gameId: string; status: "scheduled" | "completed" | "canceled" };
    }) => {
      const { gameId: gid, status: newStatus } = variables.data;
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ["game", gid] }),
        queryClient.cancelQueries({ queryKey: ["allVisibleGames"] }),
      ]);

      const prevGame = queryClient.getQueryData<GameWithDetails | undefined>([
        "game",
        gid,
      ]);

      const statuses: Array<"scheduled" | "completed" | "canceled"> = [
        "scheduled",
        "completed",
        "canceled",
      ];
      const previousLists: Record<string, OperationResult<GameListItem[]> | undefined> =
        {};
      let foundItem: GameListItem | undefined = undefined;
      for (const s of statuses) {
        const key = ["allVisibleGames", s] as const;
        const prev = queryClient.getQueryData<OperationResult<GameListItem[]>>(key);
        previousLists[s] = prev;
        if (prev?.success && !foundItem) {
          const item = prev.data.find((g) => g.id === gid);
          if (item) foundItem = item;
        }
      }

      if (prevGame) {
        queryClient.setQueryData<GameWithDetails>(["game", gid], {
          ...prevGame,
          status: newStatus,
        });
      }

      for (const s of statuses) {
        const key = ["allVisibleGames", s] as const;
        const prev = previousLists[s];
        if (!prev?.success) continue;
        let list = prev.data;
        if (s === newStatus) {
          if (foundItem) {
            const updatedItem: GameListItem = {
              ...foundItem,
              status: newStatus,
            } as GameListItem;
            list = [updatedItem, ...list.filter((g) => g.id !== gid)];
          }
        } else {
          list = list.filter((g) => g.id !== gid);
        }
        queryClient.setQueryData<OperationResult<GameListItem[]>>(key, {
          success: true,
          data: list,
        });
      }

      return { prevGame, previousLists };
    },
    onError: (error, _vars, context) => {
      if (context?.prevGame) {
        queryClient.setQueryData(["game", gameId], context.prevGame);
      }
      const prev = context?.previousLists;
      if (prev) {
        (Object.keys(prev) as Array<"scheduled" | "completed" | "canceled">).forEach(
          (s) => {
            const key = ["allVisibleGames", s] as const;
            const val = prev[s];
            if (val) queryClient.setQueryData(key, val);
          },
        );
      }
      toast.error(error.message || "An unexpected error occurred");
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Game marked as completed");
      } else {
        toast.error(data.errors?.[0]?.message || "Failed to update status");
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["game", gameId] });
      await queryClient.invalidateQueries({ queryKey: ["allVisibleGames"] });
    },
  });

  const { data: applicationsData, isLoading: isLoadingApplications } = useQuery({
    queryKey: ["gameApplications", gameId],
    queryFn: () => getGameApplications({ data: { id: gameId } }),
    enabled: !!gameId && isOwner, // Only enable if gameId is available and current user is owner
  });

  const { data: userApplication, isLoading: isLoadingUserApplication } = useQuery({
    queryKey: ["userGameApplication", gameId, currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return null;
      const result = await getGameApplicationForUser({
        data: { gameId, userId: currentUser.id },
      });
      if (!result.success) {
        toast.error(
          result.errors?.[0]?.message || "Failed to fetch your application status.",
        );
        return null;
      }
      return result.data;
    },
    enabled: !!gameId && !!currentUser?.id && !isOwner && !isParticipant, // Only fetch if not owner/participant
  });

  const applyToGameMutation = useMutation({
    mutationFn: applyToGame,
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Application submitted successfully!");
        queryClient.invalidateQueries({
          queryKey: ["userGameApplication", gameId, currentUser?.id],
        });
        queryClient.invalidateQueries({ queryKey: ["gameApplications", gameId] }); // Invalidate owner's view
        queryClient.invalidateQueries({ queryKey: ["gameParticipants", gameId] }); // Invalidate participants list
      } else {
        toast.error(data.errors?.[0]?.message || "Failed to submit application.");
      }
    },
    onError: (error) => {
      toast.error(error.message || "An unexpected error occurred while applying.");
    },
  });

  if (isLoading || isLoadingApplications || isLoadingUserApplication) {
    return <LoaderCircle className="mx-auto h-8 w-8 animate-spin" />;
  }

  if (!game) {
    return <div>Game not found</div>;
  }

  const hasPendingApplication = userApplication?.status === "pending";
  const hasRejectedApplication = userApplication?.status === "rejected";
  const currentUserParticipant = game?.participants?.find(
    (p) => p.userId === currentUser?.id,
  );
  const hasRejectedParticipantStatus = currentUserParticipant?.status === "rejected";

  const canApply =
    currentUser &&
    !isOwner &&
    !isParticipant &&
    !hasPendingApplication &&
    !hasRejectedApplication &&
    !hasRejectedParticipantStatus &&
    game?.status === "scheduled" && // Only allow applying to scheduled games
    (game?.visibility === "public" || game?.visibility === "protected"); // Only allow applying to public/protected games

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-gray-900">Game Details</CardTitle>
              <CardDescription>
                View and manage the details of this game session.
              </CardDescription>
            </div>
            {isOwner && !isEditing && game.status === "scheduled" && (
              <div className="flex items-center gap-2">
                <Button
                  onClick={() =>
                    updateStatusMutation.mutate({ data: { gameId, status: "completed" } })
                  }
                  variant="outline"
                  size="sm"
                  disabled={updateStatusMutation.isPending}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark Completed
                </Button>
                <Button
                  onClick={() => {
                    if (window.confirm("Are you sure you want to cancel this game?")) {
                      cancelGameMutation.mutate({ data: { id: gameId } });
                    }
                  }}
                  variant="destructive"
                  size="sm"
                  disabled={cancelGameMutation.isPending}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancel Game
                </Button>
                <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit Game
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <GameForm
              initialValues={{
                ...game,
                gameSystemId: game.gameSystem.id, // Pre-populate gameSystemId
                campaignId: game.campaignId ?? undefined,
                price: game.price ?? undefined,
                minimumRequirements: game.minimumRequirements ?? undefined,
                safetyRules: game.safetyRules ?? undefined,
                dateTime: new Date(game.dateTime).toISOString().slice(0, 16),
              }}
              onSubmit={async (values) => {
                await updateGameMutation.mutateAsync({ data: { ...values, id: gameId } });
              }}
              isSubmitting={updateGameMutation.isPending}
              isCampaignGame={!!game.campaignId} // Pass campaign status
              gameSystemName={game.gameSystem.name} // Pass game system name for display
              onCancelEdit={() => setIsEditing(false)} // Pass cancel handler
            />
          ) : (
            <GameDetailsView game={game} />
          )}
        </CardContent>
      </Card>

      {canApply && (
        <Button
          onClick={() => applyToGameMutation.mutate({ data: { gameId } })}
          disabled={applyToGameMutation.isPending}
        >
          {applyToGameMutation.isPending ? "Applying..." : "Apply to Game"}
        </Button>
      )}

      {hasPendingApplication && (
        <p className="text-muted-foreground">Your application is pending review.</p>
      )}

      {hasRejectedApplication && (
        <p className="text-destructive">Your application was rejected.</p>
      )}

      {isInvited && invitedParticipant && (
        <RespondToInvitation participant={invitedParticipant} />
      )}

      {isParticipant && (
        <GameParticipantsList
          gameId={gameId}
          isOwner={isOwner}
          currentUser={currentUser}
          gameOwnerId={game.owner?.id || ""}
          applications={applicationsData?.success ? applicationsData.data : []}
          participants={
            game.participants?.map((p: GameParticipant) => ({
              ...p,
              role: p.role || "player", // Default to "player" if role is missing
            })) || []
          }
        />
      )}

      {isOwner && (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <InviteParticipants
              gameId={gameId}
              currentParticipants={game.participants || []}
            />
            <ManageInvitations
              gameId={gameId}
              invitations={
                game?.participants?.filter(
                  (p) => p.role === "invited" && p.status === "pending",
                ) || []
              }
            />
          </div>
        </>
      )}
    </div>
  );
}
