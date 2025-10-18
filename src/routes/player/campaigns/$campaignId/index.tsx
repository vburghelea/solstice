import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type React from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
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
import { useCampaignsTranslation } from "~/hooks/useTypedTranslation";
import { useRateLimitedServerFn } from "~/lib/pacer";
import { HeroBackgroundImage } from "~/shared/components/hero-background-image";
import { InfoItem } from "~/shared/components/info-item";
import { SafeAddressLink } from "~/shared/components/safe-address-link";
import { SafetyRulesView } from "~/shared/components/SafetyRulesView";
import { createResponsiveCloudinaryImage } from "~/shared/lib/cloudinary-assets";
import {
  buildPlayersRange,
  formatExpectedDuration,
  formatPrice,
} from "~/shared/lib/game-formatting";
import { strings } from "~/shared/lib/strings";
import { cn } from "~/shared/lib/utils";
import type { OperationResult } from "~/shared/types/common";
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
  const { t } = useCampaignsTranslation();
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
        throw new Error(
          result.errors?.[0]?.message || t("detail.failed_to_fetch_campaign"),
        );
      }
      if (!result.data) {
        throw new Error(t("detail.campaign_data_not_found"));
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
        toast.success(t("detail.game_session_status_updated"));
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
        toast.error(
          data.errors?.[0]?.message || t("detail.failed_to_update_game_session_status"),
        );
      }
    },
    onError: (error) => {
      toast.error(error.message || t("detail.unexpected_error_updating_game_session"));
    },
  });

  const updateCampaignMutation = useMutation({
    mutationFn: updateCampaign,
    onSuccess: async (data) => {
      if (data.success) {
        toast.success(t("detail.campaign_updated"));
        await queryClient.invalidateQueries({ queryKey: ["campaign", campaignId] });
        setIsEditing(false);
      } else {
        toast.error(data.errors?.[0]?.message || t("detail.failed_to_update_campaign"));
      }
    },
    onError: (error) => {
      toast.error(error.message || t("detail.unexpected_error_occurred"));
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
          result.errors?.[0]?.message || t("detail.failed_to_fetch_application_status"),
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
        toast.success(t("detail.application_submitted"));
        queryClient.invalidateQueries({
          queryKey: ["userCampaignApplication", campaignId, currentUser?.id],
        });
        queryClient.invalidateQueries({ queryKey: ["campaignApplications", campaignId] }); // Invalidate owner's view
        queryClient.invalidateQueries({ queryKey: ["campaignParticipants", campaignId] }); // Invalidate participants list
      } else {
        toast.error(
          data.errors?.[0]?.message || t("detail.failed_to_submit_application"),
        );
      }
    },
    onError: (error) => {
      toast.error(error.message || t("detail.unexpected_error_applying"));
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
    return <div>{t("detail.campaign_not_found")}</div>;
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
  const sessionDuration = formatExpectedDuration(campaign.sessionDuration);
  const sessionDurationLabel = sessionDuration ?? "Organizer will confirm";
  const statusLabel = campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1);
  const visibilityLabel =
    campaign.visibility === "protected"
      ? "Connections & teammates"
      : `${campaign.visibility} visibility`;
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
  if (isOwner && campaign.status === "active") {
    ownerActions.push({
      key: "complete",
      label: t("detail.mark_campaign_completed"),
      icon: CheckCircle2,
      onClick: () =>
        updateCampaignMutation.mutate({
          data: { id: campaignId, status: "completed" },
        }),
      disabled: updateCampaignMutation.isPending || isEditing,
    });
    ownerActions.push({
      key: "cancel",
      label: t("detail.cancel_campaign"),
      icon: XCircle,
      onClick: () => {
        if (window.confirm(t("detail.confirm_cancel_campaign"))) {
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
      label: t("detail.open_session_zero"),
      icon: ScrollText,
      to: "/player/campaigns/$campaignId/zero",
      params: { campaignId },
    });
    ownerActions.push({
      key: "edit",
      label: isEditing ? t("detail.exit_edit_mode") : t("detail.edit_campaign_details"),
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

      <section className="bg-background relative mt-6 min-h-[260px] overflow-hidden">
        {heroBackgroundImage ? (
          <HeroBackgroundImage
            image={heroBackgroundImage}
            alt={heroBackgroundAlt}
            loading="eager"
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
                </div>
                <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl">
                  {campaign.name}
                </h1>
                {canApply ? (
                  <Button
                    className="text-primary hidden bg-white hover:bg-white/90 sm:inline-flex"
                    onClick={() =>
                      applyToCampaignMutation.mutate({ data: { campaignId } })
                    }
                    disabled={applyToCampaignMutation.isPending}
                  >
                    {applyToCampaignMutation.isPending
                      ? t("detail.applying")
                      : t("detail.apply_to_join")}
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
              {t("detail.application_pending")}
            </p>
          ) : null}
          {hasRejectedApplication ? (
            <p className="text-destructive text-sm">{t("detail.application_rejected")}</p>
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
                    <CardTitle>{t("detail.edit_campaign")}</CardTitle>
                    <CardDescription>{t("detail.edit_description")}</CardDescription>
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
                    <CardTitle>{t("detail.about_this_campaign")}</CardTitle>
                    <CardDescription>{t("detail.about_description")}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {campaign.description ? (
                      <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {campaign.description}
                      </p>
                    ) : (
                      <p className="text-muted-foreground">
                        {t("detail.no_description_provided")}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-foreground">
                      {t("detail.game_sessions")}
                    </CardTitle>
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
                          <SelectValue placeholder={t("detail.filter_by_status")} />
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
                            {t("detail.create_session")}
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
                      {t("detail.no_game_sessions_found")}
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
                            label: t("detail.view_game"),
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
                  <CardTitle>{t("detail.campaign_logistics")}</CardTitle>
                  <CardDescription>{t("detail.logistics_description")}</CardDescription>
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
                  <CardTitle>{t("detail.location")}</CardTitle>
                  <CardDescription>
                    {t("detail.location_shared_after_approval")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3 text-sm">
                    <MapPinIcon className="text-muted-foreground mt-1 h-4 w-4" />
                    <div>
                      <p className="text-foreground font-medium">
                        {campaign.location?.address || t("detail.not_specified")}
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
                  <CardTitle>{t("detail.safety_consent")}</CardTitle>
                  <CardDescription>{t("detail.safety_description")}</CardDescription>
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
              {t("detail.price_session")}: {priceLabel}
              {playersRange ? ` • ${playersRange}` : ""}
            </div>
            <Button
              onClick={() => applyToCampaignMutation.mutate({ data: { campaignId } })}
              disabled={applyToCampaignMutation.isPending}
            >
              {applyToCampaignMutation.isPending
                ? t("detail.applying")
                : t("detail.apply_to_join")}
            </Button>
          </div>
        </StickyActionBar>
      ) : null}
    </div>
  );
}
