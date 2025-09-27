import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Edit2, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button, buttonVariants } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { gameStatusEnum } from "~/db/schema/games.schema";
import {
  applyToCampaign,
  updateCampaign,
} from "~/features/campaigns/campaigns.mutations";
import {
  getCampaign,
  getCampaignApplicationForUser,
  getCampaignApplications,
} from "~/features/campaigns/campaigns.queries";
import type { updateCampaignInputSchema } from "~/features/campaigns/campaigns.schemas"; // Import updateCampaignInputSchema
import type {
  CampaignParticipant,
  CampaignWithDetails,
} from "~/features/campaigns/campaigns.types";
import { CampaignForm } from "~/features/campaigns/components/CampaignForm";
import { CampaignParticipantsList } from "~/features/campaigns/components/CampaignParticipantsList";
import { InviteParticipants } from "~/features/campaigns/components/InviteParticipants";

import { ProfileLink } from "~/components/ProfileLink";
import { Avatar } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { StickyActionBar } from "~/components/ui/sticky-action-bar";
import { ManageInvitations } from "~/features/campaigns/components/ManageInvitations";
import { RespondToInvitation } from "~/features/campaigns/components/RespondToInvitation";
import { CampaignGameSessionCard } from "~/features/games/components/CampaignGameSessionCard";
import { updateGameSessionStatus } from "~/features/games/games.mutations";
import { listGameSessionsByCampaignId } from "~/features/games/games.queries";
import type { GameListItem } from "~/features/games/games.types";
import { getRelationshipSnapshot } from "~/features/social";
import { useRateLimitedServerFn } from "~/lib/pacer";
import { SafetyRulesView } from "~/shared/components/SafetyRulesView";
import type { OperationResult } from "~/shared/types/common";
import { ThumbsScore } from "~/shared/ui/thumbs-score";

import { z } from "zod";

export const Route = createFileRoute("/dashboard/campaigns/$campaignId/")({
  component: CampaignDetailsPage,
  validateSearch: z.object({
    status: z.enum(gameStatusEnum.enumValues).optional(),
  }),
});

function CampaignDetailsView({ campaign }: { campaign: CampaignWithDetails }) {
  return (
    <div className="space-y-3">
      <details
        id="general"
        className="bg-card scroll-mt-24 rounded-lg border open:shadow-sm"
        open
      >
        <summary className="text-foreground cursor-pointer px-4 py-3 font-medium select-none">
          General
        </summary>
        <div className="text-foreground grid gap-4 px-4 pt-2 pb-4 md:grid-cols-2">
          <div>
            <p className="font-semibold">Game System</p>
            <p>{campaign.gameSystem?.name || "Not specified"}</p>
          </div>
          <div>
            <p className="font-semibold">Recurrence</p>
            <p>{campaign.recurrence}</p>
          </div>
          <div>
            <p className="font-semibold">Time of Day</p>
            <p>{campaign.timeOfDay}</p>
          </div>
          <div>
            <p className="font-semibold">Session Duration</p>
            <p>{campaign.sessionDuration}</p>
          </div>
          <div>
            <p className="font-semibold">Price Per Session</p>
            <p>{campaign.pricePerSession ? `€${campaign.pricePerSession}` : "Free"}</p>
          </div>
          <div>
            <p className="font-semibold">Language</p>
            <p>{campaign.language}</p>
          </div>
          <div>
            <p className="font-semibold">Visibility</p>
            {campaign.visibility === "protected" ? (
              <Badge variant="secondary">Connections-only</Badge>
            ) : (
              <p className="capitalize">{campaign.visibility}</p>
            )}
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
          <p>{campaign.location?.address || "Not specified"}</p>
        </div>
      </details>

      <details
        id="requirements"
        className="bg-card scroll-mt-24 rounded-lg border open:shadow-sm"
      >
        <summary className="text-foreground cursor-pointer px-4 py-3 font-medium select-none">
          Minimum Requirements
        </summary>
        <div className="text-foreground grid gap-4 px-4 pt-2 pb-4">
          <div>
            <p className="font-semibold">Players</p>
            <p>
              {campaign.minimumRequirements?.minPlayers ?? "?"} -{" "}
              {campaign.minimumRequirements?.maxPlayers ?? "?"}
            </p>
          </div>
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
          <SafetyRulesView safetyRules={campaign.safetyRules} />
        </div>
      </details>
    </div>
  );
}

function CampaignDetailsPage() {
  const queryClient = useQueryClient();
  const { campaignId } = Route.useParams();
  const { user: currentUser } = Route.useRouteContext();
  const navigate = Route.useNavigate(); // Use route-specific useNavigate

  const [isEditing, setIsEditing] = useState(false);

  const rlUpdateGameSessionStatus = useRateLimitedServerFn(updateGameSessionStatus, {
    type: "mutation",
  });

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
  });

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
    return <LoaderCircle className="mx-auto h-8 w-8 animate-spin" />;
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
    campaign?.status === "active" && // Only allow applying to active campaigns
    (campaign?.visibility === "public" ||
      (campaign?.visibility === "protected" && isConnection)) &&
    !blockedAny;

  const gameSessions = gameSessionsData?.success ? gameSessionsData.data : [];

  return (
    <div key={campaignId} className="space-y-6">
      {blockedAny && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          You cannot interact with this organizer due to block settings.
        </div>
      )}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3">
            {isOwner && !isEditing ? (
              <div className="flex items-center justify-end gap-2">
                <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit Campaign
                </Button>
                <Link
                  to="/dashboard/campaigns/$campaignId/zero"
                  params={{ campaignId }}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  Session Zero
                </Link>
              </div>
            ) : null}
            <div>
              <CardTitle className="text-foreground">{campaign.name}</CardTitle>
              {campaign.description ? (
                <CardDescription className="mt-1">{campaign.description}</CardDescription>
              ) : null}
            </div>
            <div className="text-muted-foreground text-sm">
              🗓️ {campaign.recurrence} • 🕒 {campaign.timeOfDay} • 🎲{" "}
              {campaign.gameSystem.name}
            </div>
            {campaign.owner ? (
              <div className="text-sm">
                <div className="flex items-center gap-2">
                  <Avatar
                    name={campaign.owner.name}
                    email={campaign.owner.email}
                    srcUploaded={campaign.owner.uploadedAvatarPath ?? null}
                    srcProvider={campaign.owner.image ?? null}
                    userId={campaign.owner.id}
                    className="h-6 w-6"
                  />
                  <ProfileLink
                    userId={campaign.owner.id}
                    username={campaign.owner.name || campaign.owner.email}
                    className="font-medium"
                  />
                  <span className="text-muted-foreground">•</span>
                  <ThumbsScore value={campaign.owner.gmRating ?? null} />
                </div>
              </div>
            ) : null}
          </div>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <CampaignForm
              initialValues={{
                ...(campaign as Partial<z.infer<typeof updateCampaignInputSchema>>),
                gameSystemId: campaign.gameSystem.id,
                pricePerSession: campaign.pricePerSession ?? undefined,
                minimumRequirements: campaign.minimumRequirements ?? undefined,
                safetyRules: campaign.safetyRules ?? undefined,
                // New session zero fields
                sessionZeroData: campaign.sessionZeroData ?? undefined,
                campaignExpectations: campaign.campaignExpectations ?? undefined,
                tableExpectations: campaign.tableExpectations ?? undefined,
                characterCreationOutcome: campaign.characterCreationOutcome ?? undefined,
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
          ) : (
            <CampaignDetailsView campaign={campaign} />
          )}
        </CardContent>
      </Card>

      {canApply && (
        <StickyActionBar>
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
            <div className="text-sm">
              {campaign.pricePerSession
                ? `Price/Session: €${campaign.pricePerSession}`
                : "Free"}
              {campaign.minimumRequirements?.minPlayers &&
              campaign.minimumRequirements?.maxPlayers
                ? ` • Players ${campaign.minimumRequirements.minPlayers}-${campaign.minimumRequirements.maxPlayers}`
                : ""}
            </div>
            <Button
              onClick={() => applyToCampaignMutation.mutate({ data: { campaignId } })}
              disabled={applyToCampaignMutation.isPending}
            >
              {applyToCampaignMutation.isPending ? "Applying..." : "Apply to Campaign"}
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

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-foreground">Game Sessions</CardTitle>
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
              {isOwner && (
                <Button size="sm" asChild>
                  <Link to="/dashboard/games/create" search={{ campaignId }}>
                    Create Game Session
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative">
          {isLoadingGameSessions && (
            <div className="bg-background/80 absolute inset-0 z-10 flex items-center justify-center">
              <LoaderCircle className="text-primary h-8 w-8 animate-spin" />
            </div>
          )}
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
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {isInvited && invitedParticipant && (
        <RespondToInvitation participant={invitedParticipant} />
      )}

      {isParticipant && (
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
      )}

      {isOwner && (
        <>
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
        </>
      )}
    </div>
  );
}
