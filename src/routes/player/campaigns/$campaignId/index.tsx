import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type React from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LanguageTag } from "~/components/LanguageTag";
import { ProfileLink } from "~/components/ProfileLink";
import { Avatar } from "~/components/ui/avatar";
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
  ScrollText,
  Undo2,
  XCircle,
} from "~/components/ui/icons";
import { SafeLink as Link } from "~/components/ui/SafeLink";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { StickyActionBar } from "~/components/ui/sticky-action-bar";
import {
  applyToCampaign,
  updateCampaign,
} from "~/features/campaigns/campaigns.mutations";
import {
  getCampaign,
  getCampaignApplicationForUser,
  getCampaignApplications,
} from "~/features/campaigns/campaigns.queries";
import type { updateCampaignInputSchema } from "~/features/campaigns/campaigns.schemas";
import type {
  CampaignParticipant,
  CampaignWithDetails,
} from "~/features/campaigns/campaigns.types";
import { CampaignForm } from "~/features/campaigns/components/CampaignForm";
import { CampaignParticipantsList } from "~/features/campaigns/components/CampaignParticipantsList";
import { InviteParticipants } from "~/features/campaigns/components/InviteParticipants";
import { ManageInvitations } from "~/features/campaigns/components/ManageInvitations";
import { RespondToInvitation } from "~/features/campaigns/components/RespondToInvitation";
import { getSystemBySlug } from "~/features/game-systems/game-systems.queries";
import type { GameSystemDetail } from "~/features/game-systems/game-systems.types";
import { CampaignGameSessionCard } from "~/features/games/components/CampaignGameSessionCard";
import { updateGameSessionStatus } from "~/features/games/games.mutations";
import { listGameSessionsByCampaignId } from "~/features/games/games.queries";
import type { GameListItem } from "~/features/games/games.types";
import { getRelationshipSnapshot } from "~/features/social";
import { useRateLimitedServerFn } from "~/lib/pacer";
import { SafetyRulesView } from "~/shared/components/SafetyRulesView";
import { strings } from "~/shared/lib/strings";
import { cn } from "~/shared/lib/utils";
import type { OperationResult } from "~/shared/types/common";
import { ThumbsScore } from "~/shared/ui/thumbs-score";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/shared/ui/tooltip";

import { z } from "zod";
import { gameStatusEnum } from "~/db/schema/games.schema";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const Route = createFileRoute("/player/campaigns/$campaignId/")({
  component: CampaignDetailsPage,
  validateSearch: z.object({
    status: z.enum(gameStatusEnum.enumValues).optional(),
  }),
  loader: async ({ params }) => {
    if (!UUID_REGEX.test(params.campaignId)) {
      return {
        campaign: null,
        error: "Invalid campaign ID format.",
        systemDetails: null,
      };
    }

    const result = await getCampaign({ data: { id: params.campaignId } });

    if (!result.success || !result.data) {
      return {
        campaign: null,
        error: "Failed to load campaign details.",
        systemDetails: null,
      };
    }

    let systemDetails: GameSystemDetail | null = null;
    const slug = result.data.gameSystem?.slug;
    if (slug) {
      try {
        systemDetails = await getSystemBySlug({ data: { slug } });
      } catch (error) {
        console.error("Failed to fetch system details for campaign", error);
      }
    }

    return { campaign: result.data, error: null, systemDetails };
  },
});

type OwnerAction = {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
  disabled?: boolean;
  to?: string;
  params?: Record<string, string>;
  destructive?: boolean;
};

function CampaignDetailsPage() {
  const queryClient = useQueryClient();
  const { campaignId } = Route.useParams();
  const { user: currentUser } = Route.useRouteContext();
  const navigate = Route.useNavigate(); // Use route-specific useNavigate

  const [isEditing, setIsEditing] = useState(false);

  const rlUpdateGameSessionStatus = useRateLimitedServerFn(updateGameSessionStatus, {
    type: "mutation",
  });

  const loaderData = Route.useLoaderData() as
    | {
        campaign: CampaignWithDetails | null;
        error: string | null;
        systemDetails: GameSystemDetail | null;
      }
    | undefined;
  const initialCampaign = loaderData?.campaign ?? null;
  const loaderError = loaderData?.error ?? null;
  const initialSystemDetails = loaderData?.systemDetails ?? null;

  const { data: campaign, isLoading } = useQuery({
    queryKey: ["campaign", campaignId], // Simplified queryKey
    queryFn: async () => {
      const result = await getCampaign({ data: { id: campaignId } });
      if (!result.success) {
        throw new Error(result.errors?.[0]?.message || "Failed to fetch campaign");
      }
      if (!result.data) {
        throw new Error("Campaign data not found");
      }
      return result.data;
    },
    enabled: !!campaignId,
    refetchOnMount: "always",
    initialData: initialCampaign ?? undefined,
  });

  useEffect(() => {
    if (loaderError) {
      toast.error(loaderError);
    }
  }, [loaderError]);

  // Proactively invalidate potentially stale caches on initial mount to avoid empty flashes
  useEffect(() => {
    if (campaignId) {
      queryClient.invalidateQueries({ queryKey: ["campaign", campaignId] });
      queryClient.invalidateQueries({ queryKey: ["campaignGameSessions", campaignId] });
      queryClient.invalidateQueries({ queryKey: ["campaignApplications", campaignId] });
      if (currentUser?.id) {
        queryClient.invalidateQueries({
          queryKey: ["userCampaignApplication", campaignId, currentUser.id],
        });
      }
    }
  }, [campaignId, queryClient, currentUser?.id]);

  const isOwner = campaign?.owner?.id === currentUser?.id;
  const { data: rel } = useQuery({
    queryKey: ["relationship", campaign?.owner?.id],
    queryFn: () => getRelationshipSnapshot({ data: { userId: campaign!.owner!.id } }),
    enabled: !!currentUser?.id && !!campaign?.owner?.id,
    refetchOnMount: "always",
  });
  const blockedAny = !!rel && rel.success && (rel.data.blocked || rel.data.blockedBy);
  const isConnection = !!rel && rel.success && rel.data.isConnection;

  const isInvited = campaign?.participants?.some(
    (p) => p.userId === currentUser?.id && p.role === "invited" && p.status === "pending",
  );
  const invitedParticipant = campaign?.participants?.find(
    (p) => p.userId === currentUser?.id && p.role === "invited" && p.status === "pending",
  );
  const isParticipant = campaign?.participants?.some(
    (p) =>
      p.userId === currentUser?.id &&
      (p.role === "player" || p.role === "invited") &&
      p.status !== "rejected",
  );

  const updateGameSessionStatusMutation = useMutation({
    mutationFn: async (vars: Parameters<typeof rlUpdateGameSessionStatus>[0]) =>
      await rlUpdateGameSessionStatus(vars),
    onSuccess: async (data) => {
      if (data.success) {
        toast.success("Game session status updated successfully!");
        queryClient.invalidateQueries({
          queryKey: ["campaignGameSessions", campaignId, statusFilter],
        });
        // If organizer is current user and completed, refresh profile (gamesHosted)
        try {
          if (currentUser?.id && isOwner && data.data?.status === "completed") {
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
        toast.error(data.errors?.[0]?.message || "Failed to update game session status");
      }
    },
    onError: (error) => {
      toast.error(
        error.message ||
          "An unexpected error occurred while updating game session status",
      );
    },
  });

  const updateCampaignMutation = useMutation({
    mutationFn: updateCampaign,
    onSuccess: async (data) => {
      if (data.success) {
        toast.success("Campaign updated successfully");
        await queryClient.invalidateQueries({ queryKey: ["campaign", campaignId] });
        setIsEditing(false);
      } else {
        toast.error(data.errors?.[0]?.message || "Failed to update campaign");
      }
    },
    onError: (error) => {
      toast.error(error.message || "An unexpected error occurred");
    },
  });

  const { data: systemDetailsQueryData } = useQuery({
    queryKey: ["campaignSystemDetails", campaign?.gameSystem?.slug],
    queryFn: async () => {
      if (!campaign?.gameSystem?.slug) return null;
      try {
        return await getSystemBySlug({ data: { slug: campaign.gameSystem.slug } });
      } catch (error) {
        console.error("Failed to fetch system details", error);
        return null;
      }
    },
    enabled: Boolean(loaderData && campaign?.gameSystem?.slug),
    initialData: initialSystemDetails ?? undefined,
  });
  const systemDetails = systemDetailsQueryData ?? initialSystemDetails ?? null;

  const { data: userApplication, isLoading: isLoadingUserApplication } = useQuery({
    queryKey: ["userCampaignApplication", campaignId, currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return null;

      const result = await getCampaignApplicationForUser({
        data: { campaignId, userId: currentUser.id },
      });

      if (!result.success) {
        toast.error(
          result.errors?.[0]?.message || "Failed to fetch your application status.",
        );
        return null;
      }

      return result.data;
    },
    enabled: !!campaignId && !!currentUser?.id && !isOwner && !isParticipant, // Only fetch if not owner/participant
    refetchOnMount: "always",
  });

  const applyToCampaignMutation = useMutation({
    mutationFn: applyToCampaign,
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Application submitted successfully!");
        queryClient.invalidateQueries({
          queryKey: ["userCampaignApplication", campaignId, currentUser?.id],
        });
        queryClient.invalidateQueries({ queryKey: ["campaignApplications", campaignId] }); // Invalidate owner's view
        queryClient.invalidateQueries({ queryKey: ["campaignParticipants", campaignId] }); // Invalidate participants list
      } else {
        toast.error(data.errors?.[0]?.message || "Failed to submit application.");
      }
    },
    onError: (error) => {
      toast.error(error.message || "An unexpected error occurred while applying.");
    },
  });

  const { status: statusFilter = "" } = Route.useSearch(); // Use useSearch for statusFilter

  const { data: gameSessionsData, isLoading: isLoadingGameSessions } = useQuery<
    OperationResult<GameListItem[]>
  >({
    queryKey: ["campaignGameSessions", campaignId, statusFilter],
    queryFn: async () => {
      const baseData = { campaignId };
      const data =
        statusFilter && statusFilter.trim() !== ""
          ? { ...baseData, status: statusFilter }
          : baseData;
      return await listGameSessionsByCampaignId({ data });
    },
    enabled: !!campaignId,
    refetchOnMount: "always",
  });

  const { data: applicationsData, isLoading: isLoadingApplications } = useQuery({
    queryKey: ["campaignApplications", campaignId],
    queryFn: () => getCampaignApplications({ data: { id: campaignId } }),
    enabled: !!campaignId && isOwner,
    refetchOnMount: "always",
  });

  if (
    isLoading ||
    isLoadingApplications ||
    isLoadingGameSessions ||
    isLoadingUserApplication
  ) {
    return <LoaderIcon className="mx-auto h-8 w-8 animate-spin" />;
  }

  if (!campaign) {
    return <div>Campaign not found</div>;
  }

  const hasPendingApplication = userApplication?.status === "pending";
  const hasRejectedApplication = userApplication?.status === "rejected";
  const currentUserParticipant = campaign?.participants?.find(
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
    campaign?.status === "active" &&
    (campaign?.visibility === "public" ||
      (campaign?.visibility === "protected" && isConnection)) &&
    !blockedAny;

  const gameSessions = gameSessionsData?.success ? gameSessionsData.data : [];
  const playersRange = buildPlayersRange(
    campaign.minimumRequirements?.minPlayers,
    campaign.minimumRequirements?.maxPlayers,
  );
  const priceLabel = formatPrice(campaign.pricePerSession);
  const sessionDurationLabel = formatMinutes(campaign.sessionDuration);
  const heroSubtitle = [
    campaign.recurrence,
    campaign.timeOfDay,
    campaign.gameSystem?.name,
  ]
    .filter(Boolean)
    .join(" • ");
  const statusLabel = campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1);
  const visibilityLabel =
    campaign.visibility === "protected"
      ? "Connections & teammates"
      : `${campaign.visibility} visibility`;
  const heroStyle = systemDetails?.heroUrl
    ? {
        backgroundImage: `linear-gradient(to top, rgba(10,10,10,0.65), rgba(10,10,10,0.2)), url('${systemDetails.heroUrl}')`,
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : undefined;

  const ownerActions: OwnerAction[] = [];
  if (isOwner && campaign.status === "active") {
    ownerActions.push({
      key: "complete",
      label: "Mark campaign as completed",
      icon: CheckCircle2,
      onClick: () =>
        updateCampaignMutation.mutate({
          data: { id: campaignId, status: "completed" },
        }),
      disabled: updateCampaignMutation.isPending || isEditing,
    });
    ownerActions.push({
      key: "cancel",
      label: "Cancel this campaign",
      icon: XCircle,
      onClick: () => {
        if (window.confirm("Are you sure you want to cancel this campaign?")) {
          updateCampaignMutation.mutate({
            data: { id: campaignId, status: "canceled" },
          });
        }
      },
      disabled: updateCampaignMutation.isPending || isEditing,
      destructive: true,
    });
  }
  if (isOwner) {
    ownerActions.push({
      key: "session-zero",
      label: "Open session zero notes",
      icon: ScrollText,
      to: "/player/campaigns/$campaignId/zero",
      params: { campaignId },
    });
    ownerActions.push({
      key: "edit",
      label: isEditing ? "Exit edit mode" : "Edit campaign details",
      icon: isEditing ? Undo2 : PenSquareIcon,
      onClick: () => setIsEditing((prev) => !prev),
      disabled: updateCampaignMutation.isPending,
    });
  }

  return (
    <div key={campaignId} className="pb-24">
      {blockedAny ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {strings.social.blockedOrganizerBanner}
        </div>
      ) : null}

      <section
        className="bg-background relative mt-6 min-h-[260px] overflow-hidden"
        style={heroStyle}
      >
        {!systemDetails?.heroUrl ? (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(90,46,141,0.55),_rgba(17,17,17,0.95))]" />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/55 to-black/15" />
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
                </div>
                <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl">
                  {campaign.name}
                </h1>
                <p className="text-sm text-white/85 sm:text-base">{heroSubtitle}</p>
                {campaign.owner ? (
                  <div className="flex flex-wrap items-center gap-3 text-sm text-white/85">
                    <div className="flex items-center gap-2">
                      <Avatar
                        name={campaign.owner.name}
                        email={campaign.owner.email}
                        srcUploaded={campaign.owner.uploadedAvatarPath ?? null}
                        srcProvider={campaign.owner.image ?? null}
                        userId={campaign.owner.id}
                        className="h-8 w-8 border border-white/20"
                      />
                      <ProfileLink
                        userId={campaign.owner.id}
                        username={campaign.owner.name || campaign.owner.email}
                        className="font-medium text-white hover:text-white/90"
                      />
                      <span className="text-white/60">•</span>
                      <ThumbsScore
                        value={campaign.owner.gmRating ?? null}
                        className="text-white"
                      />
                    </div>
                  </div>
                ) : null}
                {canApply ? (
                  <Button
                    className="text-primary hidden bg-white hover:bg-white/90 sm:inline-flex"
                    onClick={() =>
                      applyToCampaignMutation.mutate({ data: { campaignId } })
                    }
                    disabled={applyToCampaignMutation.isPending}
                  >
                    {applyToCampaignMutation.isPending ? "Applying..." : "Apply to join"}
                  </Button>
                ) : null}
              </div>
              {ownerActions.length > 0 ? (
                <div className="flex items-center gap-2 self-start lg:self-end">
                  {ownerActions.map((action) => (
                    <Tooltip key={action.key}>
                      <TooltipTrigger asChild>
                        {action.to ? (
                          <Button
                            asChild
                            variant="secondary"
                            size="icon"
                            className={cn(
                              "border border-white/20 bg-white/10 text-white hover:bg-white/20 focus-visible:ring-white",
                              action.destructive &&
                                "text-destructive-foreground hover:bg-destructive focus-visible:ring-destructive",
                            )}
                          >
                            <Link
                              to={action.to}
                              params={action.params ?? {}}
                              aria-label={action.label}
                            >
                              <action.icon className="h-4 w-4" />
                            </Link>
                          </Button>
                        ) : (
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
                                "text-destructive-foreground hover:bg-destructive focus-visible:ring-destructive",
                            )}
                          >
                            <action.icon className="h-4 w-4" />
                          </Button>
                        )}
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
                    <CardTitle>Edit campaign</CardTitle>
                    <CardDescription>
                      Update the overarching details for your ongoing story.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-0 pb-0">
                    <div className="px-4 pb-6 sm:px-6">
                      <CampaignForm
                        initialValues={{
                          ...(campaign as Partial<
                            z.infer<typeof updateCampaignInputSchema>
                          >),
                          gameSystemId: campaign.gameSystem.id,
                          pricePerSession: campaign.pricePerSession ?? undefined,
                          minimumRequirements: campaign.minimumRequirements ?? undefined,
                          safetyRules: campaign.safetyRules ?? undefined,
                          sessionZeroData: campaign.sessionZeroData ?? undefined,
                          campaignExpectations:
                            campaign.campaignExpectations ?? undefined,
                          tableExpectations: campaign.tableExpectations ?? undefined,
                          characterCreationOutcome:
                            campaign.characterCreationOutcome ?? undefined,
                        }}
                        onSubmit={async (values) => {
                          await updateCampaignMutation.mutateAsync({
                            data: { ...values, id: campaignId },
                          });
                        }}
                        isSubmitting={updateCampaignMutation.isPending}
                        onCancelEdit={() => setIsEditing(false)}
                        isGameSystemReadOnly={true}
                        gameSystemName={campaign.gameSystem.name}
                      />
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>About this campaign</CardTitle>
                    <CardDescription>
                      Summarize the tone, arc, and player expectations.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {campaign.description ? (
                      <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {campaign.description}
                      </p>
                    ) : (
                      <p className="text-muted-foreground">
                        The organizer hasn't shared additional campaign context yet.
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-foreground">Game sessions</CardTitle>
                    <div className="flex items-center gap-4">
                      <Select
                        value={statusFilter}
                        onValueChange={(value) => {
                          navigate({
                            search: {
                              status: value as (typeof gameStatusEnum.enumValues)[number],
                            },
                          });
                        }}
                      >
                        <SelectTrigger className="w-[180px]">
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
                      {isOwner ? (
                        <Button size="sm" asChild>
                          <Link to="/player/games/create" search={{ campaignId }}>
                            Create session
                          </Link>
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  {isLoadingGameSessions ? (
                    <div className="bg-background/80 absolute inset-0 z-10 flex items-center justify-center">
                      <LoaderIcon className="text-primary h-8 w-8 animate-spin" />
                    </div>
                  ) : null}
                  {gameSessions.length === 0 ? (
                    <p className="text-muted-foreground">
                      No game sessions found for this campaign with the selected status.
                    </p>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {gameSessions.map((gameSession: GameListItem) => (
                        <CampaignGameSessionCard
                          key={gameSession.id}
                          game={gameSession}
                          isOwner={isOwner}
                          onUpdateStatus={updateGameSessionStatusMutation.mutate}
                          viewLink={{
                            to: "/player/games/$gameId",
                            params: { gameId: gameSession.id },
                            from: "/player/campaigns/$campaignId",
                            label: "View Game",
                          }}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {isInvited && invitedParticipant ? (
                <RespondToInvitation participant={invitedParticipant} />
              ) : null}

              {isParticipant ? (
                <CampaignParticipantsList
                  campaignId={campaignId}
                  isOwner={isOwner}
                  currentUser={currentUser}
                  campaignOwnerId={campaign.owner?.id || ""}
                  applications={applicationsData?.success ? applicationsData.data : []}
                  participants={
                    campaign.participants?.map((p: CampaignParticipant) => ({
                      ...p,
                      role: p.role || "player",
                    })) || []
                  }
                />
              ) : null}

              {isOwner ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <InviteParticipants
                    campaignId={campaignId}
                    currentParticipants={campaign.participants || []}
                  />
                  <ManageInvitations
                    campaignId={campaignId}
                    invitations={
                      campaign?.participants?.filter(
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
                  <CardTitle>Campaign logistics</CardTitle>
                  <CardDescription>
                    Keep everyone aligned on cadence and table shape.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <InfoItem label="Game system" value={campaign.gameSystem?.name} />
                    <InfoItem label="Recurrence" value={campaign.recurrence} />
                    <InfoItem label="Time of day" value={campaign.timeOfDay} />
                    <InfoItem
                      label="Language"
                      value={<LanguageTag language={campaign.language} />}
                    />
                    <InfoItem label="Price per session" value={priceLabel} />
                    <InfoItem label="Players" value={playersRange} />
                    <InfoItem label="Session duration" value={sessionDurationLabel} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Organizer</CardTitle>
                  <CardDescription>
                    The campaign lead and primary contact.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center gap-3">
                  <Avatar
                    name={campaign.owner?.name ?? null}
                    email={campaign.owner?.email ?? null}
                    srcUploaded={campaign.owner?.uploadedAvatarPath ?? null}
                    srcProvider={campaign.owner?.image ?? null}
                    userId={campaign.owner?.id ?? null}
                    className="h-12 w-12"
                  />
                  <div>
                    {campaign.owner ? (
                      <ProfileLink
                        userId={campaign.owner.id}
                        username={campaign.owner.name || campaign.owner.email}
                        className="text-foreground font-semibold"
                      />
                    ) : (
                      <p className="text-muted-foreground">Unassigned</p>
                    )}
                    {campaign.owner ? (
                      <ThumbsScore
                        value={campaign.owner.gmRating ?? null}
                        className="text-muted-foreground"
                      />
                    ) : null}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Location</CardTitle>
                  <CardDescription>Shared after your seat is approved.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3 text-sm">
                    <MapPinIcon className="text-muted-foreground mt-1 h-4 w-4" />
                    <div>
                      <p className="text-foreground font-medium">
                        {campaign.location?.address || "Not specified"}
                      </p>
                      {campaign.location?.address ? (
                        <SafeAddressLink address={campaign.location.address} />
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Safety & consent</CardTitle>
                  <CardDescription>
                    Consistency for every session in the campaign.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SafetyRulesView safetyRules={campaign.safetyRules} />
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
              Price/session: {priceLabel}
              {playersRange ? ` • ${playersRange}` : ""}
            </div>
            <Button
              onClick={() => applyToCampaignMutation.mutate({ data: { campaignId } })}
              disabled={applyToCampaignMutation.isPending}
            >
              {applyToCampaignMutation.isPending ? "Applying..." : "Apply to join"}
            </Button>
          </div>
        </StickyActionBar>
      ) : null}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  if (value == null || (typeof value === "string" && value.trim().length === 0)) {
    return null;
  }

  return (
    <div className="space-y-1">
      <p className="text-muted-foreground text-xs tracking-wide uppercase">{label}</p>
      <div className="text-foreground font-medium">{value}</div>
    </div>
  );
}

function SafeAddressLink({ address }: { address: string }) {
  const href = `https://maps.google.com/?q=${encodeURIComponent(address)}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-primary text-xs font-medium underline-offset-4 hover:underline"
    >
      Open in Google Maps
    </a>
  );
}

function formatPrice(price: number | null | undefined) {
  if (price == null) {
    return "Free";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
  }).format(price);
}

function buildPlayersRange(
  minPlayers: number | null | undefined,
  maxPlayers: number | null | undefined,
) {
  if (minPlayers && maxPlayers) {
    return `${minPlayers}-${maxPlayers} players`;
  }
  if (minPlayers) {
    return `${minPlayers}+ players`;
  }
  if (maxPlayers) {
    return `Up to ${maxPlayers} players`;
  }
  return "Player count TBD";
}

function formatMinutes(duration: number | null | undefined) {
  if (duration == null) {
    return "Organizer will confirm";
  }

  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;
  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (hours > 0) {
    return `${hours}h`;
  }
  return `${minutes}m`;
}
