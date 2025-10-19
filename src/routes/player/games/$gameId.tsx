import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type React from "react";
import { useEffect, useState } from "react";
import { LanguageTag } from "~/components/LanguageTag";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  CheckCircle2,
  LoaderIcon,
  MapPinIcon,
  PenSquareIcon,
  Undo2,
  XCircle,
} from "~/components/ui/icons";
import { StickyActionBar } from "~/components/ui/sticky-action-bar";
import { getSystemBySlug } from "~/features/game-systems/game-systems.queries";
import type { GameSystemDetail } from "~/features/game-systems/game-systems.types";
import { GMReviewForm } from "~/features/games/components/GMReviewForm";
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
import { getRelationshipSnapshot } from "~/features/social";
import { useRateLimitedServerFn } from "~/lib/pacer";
import { SafetyRulesView } from "~/shared/components/SafetyRulesView";
import { HeroBackgroundImage } from "~/shared/components/hero-background-image";
import { InfoItem } from "~/shared/components/info-item";
import { SafeAddressLink } from "~/shared/components/safe-address-link";
import { createResponsiveCloudinaryImage } from "~/shared/lib/cloudinary-assets";
import { formatDateAndTime } from "~/shared/lib/datetime";
import {
  buildPlayersRange,
  formatExpectedDuration,
  formatPrice,
} from "~/shared/lib/game-formatting";
import { strings } from "~/shared/lib/strings";
import { cn } from "~/shared/lib/utils";
import type { OperationResult } from "~/shared/types/common";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/shared/ui/tooltip";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function showToast(type: "success" | "error", message: string) {
  const { toast } = await import("sonner");
  toast[type](message);
}

export const Route = createFileRoute("/player/games/$gameId")({
  loader: async ({ params }) => {
    if (!UUID_REGEX.test(params.gameId)) {
      return { game: null, error: "Invalid game ID format.", systemDetails: null };
    }

    const result = await getGame({ data: { id: params.gameId } });
    if (!result.success || !result.data) {
      return { game: null, error: "Failed to load game details.", systemDetails: null };
    }
    let systemDetails: GameSystemDetail | null = null;
    const slug = result.data.gameSystem?.slug;
    if (slug) {
      try {
        systemDetails = await getSystemBySlug({ data: { slug } });
      } catch (error) {
        console.error("Failed to fetch system details for game", error);
      }
    }

    return { game: result.data, error: null, systemDetails };
  },
  component: GameDetailsPage,
});

type OwnerAction = {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
};

function GameDetailsPage() {
  const queryClient = useQueryClient();
  const { gameId } = Route.useParams();
  const { user: currentUser } = Route.useRouteContext();
  const loaderData = Route.useLoaderData() as
    | {
        game: GameWithDetails | null;
        error: string | null;
        systemDetails: GameSystemDetail | null;
      }
    | undefined;
  const initialGame = loaderData?.game ?? null;
  const loaderError = loaderData?.error ?? null;
  const initialSystemDetails = loaderData?.systemDetails ?? null;

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

  const { data: systemDetailsQueryData } = useQuery({
    queryKey: ["gameSystemDetails", game?.gameSystem?.slug],
    queryFn: async () => {
      if (!game?.gameSystem?.slug) return null;
      try {
        return await getSystemBySlug({ data: { slug: game.gameSystem.slug } });
      } catch (error) {
        console.error("Failed to fetch system details", error);
        return null;
      }
    },
    enabled: Boolean(loaderData && game?.gameSystem?.slug),
    initialData: initialSystemDetails ?? undefined,
  });
  const systemDetails = systemDetailsQueryData ?? initialSystemDetails ?? null;

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

  type UpdateGameStatusVariables = {
    data: { gameId: string; status: "scheduled" | "completed" | "canceled" };
  };

  type UpdateGameStatusContext = {
    prevGame?: GameWithDetails;
    previousLists: Record<string, OperationResult<GameListItem[]> | undefined>;
  };

  const updateStatusMutation = useMutation<
    Awaited<ReturnType<typeof updateGameSessionStatus>>,
    Error,
    UpdateGameStatusVariables,
    UpdateGameStatusContext
  >({
    mutationFn: async (vars) =>
      await rlUpdateGameStatus(vars as Parameters<typeof rlUpdateGameStatus>[0]),
    onMutate: async (variables) => {
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

      const context: UpdateGameStatusContext = prevGame
        ? { prevGame, previousLists }
        : { previousLists };
      return context;
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
    return <LoaderIcon className="mx-auto h-8 w-8 animate-spin" />;
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
    game?.status === "scheduled" &&
    (game?.visibility === "public" || (game?.visibility === "protected" && isConnection));

  const approvedParticipants =
    game.participants?.filter(
      (participant) => participant.status === "approved" && participant.role !== "owner",
    ) ?? [];
  const maxPlayers = game.minimumRequirements?.maxPlayers ?? null;
  const seatsAvailable =
    typeof maxPlayers === "number"
      ? Math.max(maxPlayers - approvedParticipants.length, 0)
      : null;
  const playersRange = buildPlayersRange(
    game.minimumRequirements?.minPlayers,
    game.minimumRequirements?.maxPlayers,
  );
  const expectedDuration = formatExpectedDuration(game.expectedDuration);
  const priceLabel = formatPrice(game.price);
  const isCampaignGame = Boolean(game.campaignId);
  const heroBackgroundImage = systemDetails?.heroUrl
    ? createResponsiveCloudinaryImage(systemDetails.heroUrl, {
        transformation: {
          width: 1600,
          height: 900,
          crop: "fill",
          gravity: "auto",
        },
        widths: [640, 960, 1280, 1600],
        sizes: "100vw",
      })
    : null;

  const heroBackgroundAlt = systemDetails?.name
    ? `${systemDetails.name} hero artwork`
    : "";

  const ownerActions: OwnerAction[] = [];
  if (isOwner && game.status === "scheduled") {
    ownerActions.push({
      key: "complete",
      label: "Mark session as completed",
      icon: CheckCircle2,
      onClick: () =>
        updateStatusMutation.mutate({
          data: { gameId, status: "completed" },
        }),
      disabled: updateStatusMutation.isPending || isEditing,
    });
    ownerActions.push({
      key: "cancel",
      label: "Cancel this session",
      icon: XCircle,
      onClick: () => {
        if (window.confirm("Are you sure you want to cancel this game?")) {
          cancelGameMutation.mutate({ data: { id: gameId } });
        }
      },
      disabled: cancelGameMutation.isPending || isEditing,
      destructive: true,
    });
  }
  if (isOwner) {
    ownerActions.push({
      key: "edit",
      label: isEditing ? "Exit edit mode" : "Edit session details",
      icon: isEditing ? Undo2 : PenSquareIcon,
      onClick: () => setIsEditing((prev) => !prev),
      disabled: updateGameMutation.isPending,
    });
  }

  const visibilityLabel =
    game.visibility === "protected"
      ? "Connections & teammates"
      : `${game.visibility} visibility`;

  const statusLabel = game.status.charAt(0).toUpperCase() + game.status.slice(1);

  return (
    <div className="pb-24">
      {blockedAny ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {strings.social.blockedOrganizerBanner}
        </div>
      ) : null}

      <section className="bg-background relative mt-6 min-h-[260px] overflow-hidden">
        {heroBackgroundImage ? (
          <HeroBackgroundImage
            image={heroBackgroundImage}
            alt={heroBackgroundAlt}
            loading="eager"
            className="opacity-25"
          />
        ) : (
          <div
            aria-hidden
            className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_top,_rgba(90,46,141,0.55),_rgba(17,17,17,0.95))]"
          />
        )}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-t from-black/80 via-black/55 to-black/15"
        />
        <div className="relative z-10 flex h-full items-end pb-10">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-6 text-white lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge className="border border-white/30 bg-white/10 text-xs font-medium tracking-wide text-white uppercase">
                    {statusLabel}
                  </Badge>
                  <Badge className="border border-white/20 bg-white/10 text-xs font-medium tracking-wide text-white uppercase">
                    {visibilityLabel}
                  </Badge>
                  {isCampaignGame ? (
                    <Badge className="border border-amber-300/40 bg-amber-300/20 text-xs font-medium tracking-wide text-amber-100 uppercase">
                      Campaign session
                    </Badge>
                  ) : null}
                </div>
                <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl">
                  {game.name}
                </h1>
                {canApply ? (
                  <Button
                    className="text-primary hidden bg-white hover:bg-white/90 sm:inline-flex"
                    onClick={() => applyToGameMutation.mutate({ data: { gameId } })}
                    disabled={applyToGameMutation.isPending}
                  >
                    {applyToGameMutation.isPending ? "Applying..." : "Apply to join"}
                  </Button>
                ) : null}
              </div>
              {ownerActions.length > 0 ? (
                <div className="flex items-center gap-2 self-start lg:self-end">
                  {ownerActions.map((action) => (
                    <Tooltip key={action.key}>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          aria-label={action.label}
                          onClick={action.onClick}
                          disabled={action.disabled}
                          className={cn(
                            "border border-white/20 bg-white/10 text-white hover:bg-white/20 focus-visible:ring-white",
                            action.destructive &&
                              "hover:bg-destructive focus-visible:ring-destructive text-destructive-foreground",
                          )}
                        >
                          <action.icon className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{action.label}</TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="relative -mt-12 pb-12">
        <div className="mx-auto w-full max-w-6xl space-y-6 px-4 sm:px-6 lg:px-8">
          {hasPendingApplication ? (
            <p className="text-muted-foreground text-sm">
              Your application is pending review.
            </p>
          ) : null}
          {hasRejectedApplication ? (
            <p className="text-destructive text-sm">Your application was rejected.</p>
          ) : null}

          <div
            className={cn(
              "grid items-start gap-8",
              isEditing
                ? "lg:grid-cols-1 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"
                : "lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]",
            )}
          >
            <div
              className={cn(
                "space-y-6",
                isEditing ? "lg:order-1 xl:order-none" : undefined,
              )}
            >
              {isEditing ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Edit session</CardTitle>
                    <CardDescription>
                      Update the details your players see publicly.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-0 pb-0">
                    <div className="px-4 pb-6 sm:px-6">
                      <GameForm
                        initialValues={{
                          ...game,
                          gameSystemId: game.gameSystem.id,
                          campaignId: game.campaignId ?? undefined,
                          price: game.price ?? undefined,
                          minimumRequirements: game.minimumRequirements ?? undefined,
                          safetyRules: game.safetyRules ?? undefined,
                          dateTime: new Date(game.dateTime).toISOString().slice(0, 16),
                        }}
                        onSubmit={async (values) => {
                          await updateGameMutation.mutateAsync({
                            data: { ...values, id: gameId },
                          });
                        }}
                        isSubmitting={updateGameMutation.isPending}
                        isCampaignGame={isCampaignGame}
                        gameSystemName={game.gameSystem.name}
                        onCancelEdit={() => setIsEditing(false)}
                      />
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>About this session</CardTitle>
                    <CardDescription>
                      Set the tone and expectations before players request a seat.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {game.description ? (
                      <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {game.description}
                      </p>
                    ) : (
                      <p className="text-muted-foreground">
                        The game organizer hasn't shared additional details yet.
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {game?.status === "completed" &&
              isApprovedParticipant &&
              currentUser?.id &&
              currentUser.id !== game.owner?.id ? (
                <GMReviewGate gameId={gameId} gmId={game.owner!.id} />
              ) : null}

              {isInvited && invitedParticipant ? (
                <RespondToInvitation participant={invitedParticipant} />
              ) : null}

              {isParticipant ? (
                <GameParticipantsList
                  gameId={gameId}
                  isOwner={isOwner}
                  currentUser={currentUser}
                  gameOwnerId={game.owner?.id || ""}
                  applications={applicationsData?.success ? applicationsData.data : []}
                  participants={
                    game.participants?.map((p: GameParticipant) => ({
                      ...p,
                      role: p.role || "player",
                    })) || []
                  }
                />
              ) : null}

              {isOwner ? (
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
              ) : null}
            </div>

            <aside
              className={cn(
                "space-y-6",
                isEditing ? "lg:order-2 xl:order-none" : undefined,
              )}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Session logistics</CardTitle>
                  <CardDescription>
                    Everything you need to know before joining the table.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <InfoItem
                      label="Date & time"
                      value={formatDateAndTime(game.dateTime)}
                    />
                    <InfoItem
                      label="Language"
                      value={<LanguageTag language={game.language} />}
                    />
                    <InfoItem label="Price" value={priceLabel} />
                    <InfoItem label="Players" value={playersRange} />
                    <InfoItem
                      label="Seats available"
                      value={
                        seatsAvailable != null ? `${seatsAvailable} open` : "Contact GM"
                      }
                    />
                    <InfoItem
                      label="Duration"
                      value={
                        expectedDuration ??
                        (game.gameSystem?.averagePlayTime
                          ? `${game.gameSystem.averagePlayTime} min`
                          : "GM will confirm")
                      }
                    />
                  </div>
                  {isCampaignGame ? (
                    <div className="border-primary/30 bg-primary/10 text-muted-foreground mt-6 rounded-lg border px-3 py-2 text-sm">
                      This session is part of an ongoing campaign.
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Location</CardTitle>
                  <CardDescription>Confirmed once your seat is approved.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3 text-sm">
                    <MapPinIcon className="text-muted-foreground mt-1 h-4 w-4" />
                    <div>
                      <p className="text-foreground font-medium">
                        {game.location.address}
                      </p>
                      <SafeAddressLink address={game.location.address} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Safety & consent</CardTitle>
                  <CardDescription>
                    Shared ground rules for every participant.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SafetyRulesView safetyRules={game.safetyRules} />
                </CardContent>
              </Card>
            </aside>
          </div>
        </div>
      </section>

      {canApply ? (
        <StickyActionBar>
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
            <div className="text-sm">
              Price: {priceLabel}
              {playersRange ? ` • ${playersRange}` : ""}
            </div>
            <Button
              onClick={() => applyToGameMutation.mutate({ data: { gameId } })}
              disabled={applyToGameMutation.isPending}
            >
              {applyToGameMutation.isPending ? "Applying..." : "Apply to join"}
            </Button>
          </div>
        </StickyActionBar>
      ) : null}
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
    <div id="gm-review" className="my-4 scroll-mt-24">
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
