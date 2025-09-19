import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle, Edit2, LoaderCircle, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { StickyActionBar } from "~/components/ui/sticky-action-bar";
import { GameForm } from "~/features/games/components/GameForm";
import { GameParticipantsList } from "~/features/games/components/GameParticipantsList";
import { InviteParticipants } from "~/features/games/components/InviteParticipants";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/shared/ui/card";

import { ProfileLink } from "~/components/ProfileLink";
import { GMReviewForm } from "~/features/games/components/GMReviewForm";
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
import { getRelationshipSnapshot } from "~/features/social";
import { useRateLimitedServerFn } from "~/lib/pacer";
import { SafetyRulesView } from "~/shared/components/SafetyRulesView";
import { formatDateAndTime } from "~/shared/lib/datetime";
import { strings } from "~/shared/lib/strings";
import type { OperationResult } from "~/shared/types/common";
import { Badge } from "~/shared/ui/badge";
import { ThumbsScore } from "~/shared/ui/thumbs-score";
import { UserAvatar } from "~/shared/ui/user-avatar";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function showToast(type: "success" | "error", message: string) {
  const { toast } = await import("sonner");
  toast[type](message);
}

export const Route = createFileRoute("/dashboard/games/$gameId")({
  loader: async ({ params }) => {
    if (!UUID_REGEX.test(params.gameId)) {
      return { game: null, error: "Invalid game ID format." };
    }

    const result = await getGame({ data: { id: params.gameId } });
    if (!result.success || !result.data) {
      return { game: null, error: "Failed to load game details." };
    }
    return { game: result.data, error: null };
  },
  component: GameDetailsPage,
});

function GameDetailsView({ game }: { game: GameWithDetails }) {
  return (
    <div className="space-y-4">
      <details
        id="general"
        className="bg-card scroll-mt-24 rounded-lg border open:shadow-sm"
        open
      >
        <summary className="text-foreground cursor-pointer px-4 py-3 font-medium select-none">
          General
        </summary>
        <div className="text-foreground px-4 pt-2 pb-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="font-semibold">Game System</p>
              <p>{game.gameSystem.name}</p>
            </div>
            <div>
              <p className="font-semibold">Date & Time</p>
              <p>{formatDateAndTime(game.dateTime)}</p>
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
              {game.visibility === "protected" ? (
                <Badge variant="secondary">Connections-only</Badge>
              ) : (
                <p className="capitalize">{game.visibility}</p>
              )}
            </div>
          </div>
        </div>
      </details>

      <details
        id="location"
        className="bg-card scroll-mt-24 rounded-lg border open:shadow-sm"
      >
        <summary className="text-foreground cursor-pointer px-4 py-3 font-medium select-none">
          Location
        </summary>
        <div className="text-foreground px-4 pt-2 pb-4">
          <p>{game.location.address}</p>
        </div>
      </details>

      <details
        id="requirements"
        className="bg-card scroll-mt-24 rounded-lg border open:shadow-sm"
      >
        <summary className="text-foreground cursor-pointer px-4 py-3 font-medium select-none">
          Minimum Requirements
        </summary>
        <div className="text-foreground px-4 pt-2 pb-4">
          <p>
            Players: {game.minimumRequirements?.minPlayers} -{" "}
            {game.minimumRequirements?.maxPlayers}
          </p>
          <p>Language Level: {game.minimumRequirements?.languageLevel}</p>
        </div>
      </details>

      <details
        id="safety"
        className="bg-card scroll-mt-24 rounded-lg border open:shadow-sm"
      >
        <summary className="text-foreground cursor-pointer px-4 py-3 font-medium select-none">
          Safety Rules
        </summary>
        <div className="text-foreground px-4 pt-2 pb-4">
          <SafetyRulesView safetyRules={game.safetyRules} />
        </div>
      </details>
    </div>
  );
}

export function GameDetailsPage() {
  const queryClient = useQueryClient();
  const { gameId } = Route.useParams();
  const { user: currentUser } = Route.useRouteContext();
  const { game: initialGame, error: loaderError } = Route.useLoaderData() as {
    game: GameWithDetails | null;
    error: string | null;
  };

  const [isEditing, setIsEditing] = useState(false);

  const rlUpdateGame = useRateLimitedServerFn(updateGame, { type: "mutation" });
  const rlCancelGame = useRateLimitedServerFn(cancelGame, { type: "mutation" });
  const rlUpdateGameStatus = useRateLimitedServerFn(updateGameSessionStatus, {
    type: "mutation",
  });

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
    initialData: initialGame ?? undefined,
  });

  useEffect(() => {
    if (loaderError) {
      void showToast("error", loaderError);
    }
  }, [loaderError]);

  const isOwner = game?.owner?.id === currentUser?.id;
  const { data: rel } = useQuery({
    queryKey: ["relationship", game?.owner?.id],
    queryFn: () => getRelationshipSnapshot({ data: { userId: game!.owner!.id } }),
    enabled: !!currentUser?.id && !!game?.owner?.id,
    refetchOnMount: "always",
  });
  const blockedAny = !!rel && rel.success && (rel.data.blocked || rel.data.blockedBy);
  const isConnection = !!rel && rel.success && rel.data.isConnection;
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
  const isApprovedParticipant = game?.participants?.some(
    (p: GameParticipant) =>
      p.userId === currentUser?.id &&
      (p.role === "player" || p.role === "invited") &&
      p.status === "approved",
  );

  // Rendered inline where relevant

  const updateGameMutation = useMutation({
    mutationFn: async (vars: Parameters<typeof rlUpdateGame>[0]) =>
      await rlUpdateGame(vars),
    onSuccess: async (data) => {
      if (data.success) {
        void showToast("success", "Game updated successfully");
        await queryClient.invalidateQueries({ queryKey: ["game", gameId] });
        setIsEditing(false);
      } else {
        void showToast("error", data.errors?.[0]?.message || "Failed to update game");
      }
    },
    onError: (error) => {
      void showToast("error", error.message || "An unexpected error occurred");
    },
  });

  const cancelGameMutation = useMutation({
    mutationFn: async (vars: Parameters<typeof rlCancelGame>[0]) =>
      await rlCancelGame(vars),
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
      void showToast("error", error.message || "An unexpected error occurred");
    },
    onSuccess: (data) => {
      if (data.success) {
        void showToast("success", "Game canceled successfully");
      } else {
        void showToast("error", data.errors?.[0]?.message || "Failed to cancel game");
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["game", gameId] });
      await queryClient.invalidateQueries({ queryKey: ["allVisibleGames"] });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (vars: Parameters<typeof rlUpdateGameStatus>[0]) =>
      await rlUpdateGameStatus(vars),
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
      void showToast("error", error.message || "An unexpected error occurred");
    },
    onSuccess: async (data) => {
      if (data.success) {
        void showToast("success", "Game marked as completed");
        // If owner completed the game, refresh profile stats to reflect gamesHosted increment
        try {
          if (isOwner && currentUser?.id && data.data?.status === "completed") {
            await Promise.all([
              queryClient.invalidateQueries({ queryKey: ["userProfile"] }),
              queryClient.invalidateQueries({
                queryKey: ["userProfile", currentUser.id],
              }),
            ]);
          }
        } catch (_err) {
          void _err;
          // ignore cache invalidation errors
        }
      } else {
        void showToast("error", data.errors?.[0]?.message || "Failed to update status");
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
        void showToast(
          "error",
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
        void showToast("success", "Application submitted successfully!");
        queryClient.invalidateQueries({
          queryKey: ["userGameApplication", gameId, currentUser?.id],
        });
        queryClient.invalidateQueries({ queryKey: ["gameApplications", gameId] }); // Invalidate owner's view
        queryClient.invalidateQueries({ queryKey: ["gameParticipants", gameId] }); // Invalidate participants list
      } else {
        void showToast(
          "error",
          data.errors?.[0]?.message || "Failed to submit application.",
        );
      }
    },
    onError: (error) => {
      void showToast(
        "error",
        error.message || "An unexpected error occurred while applying.",
      );
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
    !blockedAny &&
    game?.status === "scheduled" && // Only allow applying to scheduled games
    (game?.visibility === "public" || (game?.visibility === "protected" && isConnection)); // Protected requires connection

  return (
    <div className="space-y-6">
      {blockedAny && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {strings.social.blockedOrganizerBanner}
        </div>
      )}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3">
            {isOwner && !isEditing && game.status === "scheduled" ? (
              <div className="flex items-center justify-end gap-2">
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
            ) : null}
            <div>
              <CardTitle className="text-foreground">{game.name}</CardTitle>
              {game.description ? (
                <CardDescription className="mt-1">{game.description}</CardDescription>
              ) : null}
            </div>
            <div className="text-muted-foreground text-sm">
              🗓️ {formatDateAndTime(game.dateTime)} • 📍 {game.location.address} • 🎲{" "}
              {game.gameSystem.name}
            </div>
            {game.owner ? (
              <div className="text-sm">
                <div className="flex items-center gap-2">
                  <UserAvatar
                    name={game.owner.name}
                    email={game.owner.email}
                    srcUploaded={game.owner.uploadedAvatarPath ?? null}
                    srcProvider={game.owner.image ?? null}
                    className="h-6 w-6"
                  />
                  <ProfileLink
                    userId={game.owner.id}
                    username={game.owner.name || game.owner.email}
                    className="font-medium"
                  />
                  <span className="text-muted-foreground">•</span>
                  <ThumbsScore value={game.owner.gmRating ?? null} />
                </div>
              </div>
            ) : null}
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

      {/* GM Review prompt for approved participants after completion */}
      {game?.status === "completed" &&
        isApprovedParticipant &&
        currentUser?.id &&
        currentUser.id !== game.owner?.id && (
          <GMReviewGate gameId={gameId} gmId={game.owner!.id} />
        )}

      {canApply && (
        <StickyActionBar>
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
            <div className="text-sm">
              {game.price ? `Price: €${game.price}` : "Free"}
              {game.minimumRequirements?.minPlayers &&
              game.minimumRequirements?.maxPlayers
                ? ` • Players ${game.minimumRequirements.minPlayers}-${game.minimumRequirements.maxPlayers}`
                : ""}
            </div>
            <Button
              onClick={() => applyToGameMutation.mutate({ data: { gameId } })}
              disabled={applyToGameMutation.isPending}
            >
              {applyToGameMutation.isPending ? "Applying..." : "Apply to Game"}
            </Button>
          </div>
        </StickyActionBar>
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

function GMReviewGate({ gameId, gmId }: { gameId: string; gmId: string }) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["myGMReviewForGame", gameId],
    queryFn: async () => {
      const { getMyGMReviewForGame } = await import("~/features/profile/profile.social");
      return getMyGMReviewForGame({ data: { gameId } });
    },
  });

  if (isLoading) return null;
  if (data && data.success && data.data) return null;

  return (
    <div className="my-4">
      <GMReviewForm
        gameId={gameId}
        gmId={gmId}
        onSubmitted={() => {
          queryClient.invalidateQueries({ queryKey: ["myGMReviewForGame", gameId] });
        }}
      />
    </div>
  );
}
