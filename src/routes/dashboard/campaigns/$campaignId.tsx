import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Edit2, LoaderCircle, Save, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { FormSubmitButton } from "~/components/form-fields/FormSubmitButton";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { ArrowLeftIcon } from "~/components/ui/icons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";
import { gameStatusEnum } from "~/db/schema/games.schema";
import { updateCampaign } from "~/features/campaigns/campaigns.mutations";
import {
  getCampaign,
  getCampaignApplications,
} from "~/features/campaigns/campaigns.queries";
import type { CampaignWithDetails } from "~/features/campaigns/campaigns.types";
import { CampaignForm } from "~/features/campaigns/components/CampaignForm";
import { CampaignParticipantsList } from "~/features/campaigns/components/CampaignParticipantsList"; // Added
import { InviteParticipants } from "~/features/campaigns/components/InviteParticipants";
import { ManageApplications } from "~/features/campaigns/components/ManageApplications";
import { RespondToInvitation } from "~/features/campaigns/components/RespondToInvitation"; // Added
import { CampaignGameSessionCard } from "~/features/games/components/CampaignGameSessionCard";
import { updateGameSessionStatus } from "~/features/games/games.mutations";
import { listGameSessionsByCampaignId } from "~/features/games/games.queries";

export const Route = createFileRoute("/dashboard/campaigns/$campaignId")({
  loader: async ({ params }) => {
    const result = await getCampaign({ data: { id: params.campaignId } });
    if (!result.success || !result.data) {
      toast.error("Failed to load campaign details.");
      throw new Error("Campaign not found");
    }
    return { campaign: result.data };
  },
  component: CampaignDetailsPage,
});

function CampaignDetailsView({ campaign }: { campaign: CampaignWithDetails }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{campaign.name}</CardTitle>
        <CardDescription>{campaign.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
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
            <p>{campaign.visibility}</p>
          </div>
        </div>
        <Separator />
        <div>
          <p className="font-semibold">Location</p>
          <p>{campaign.location.address}</p>
        </div>
        <Separator />
        <div>
          <p className="font-semibold">Minimum Requirements</p>
          <p>Language Level: {campaign.minimumRequirements?.languageLevel}</p>
        </div>
        <Separator />
        <div>
          <p className="font-semibold">Safety Rules</p>
          <ul>
            {campaign.safetyRules &&
              Object.entries(campaign.safetyRules).map(
                ([rule, enabled]) =>
                  enabled && <li key={rule}>{rule.replace(/-/g, " ")}</li>,
              )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

export function CampaignDetailsPage() {
  const initialData = Route.useLoaderData();
  const queryClient = useQueryClient();
  const { campaignId } = Route.useParams();
  const { user: currentUser } = Route.useRouteContext();

  const [isEditing, setIsEditing] = useState(false);
  const [statusFilter, setStatusFilter] =
    useState<(typeof gameStatusEnum.enumValues)[number]>("scheduled");

  const { data: campaign, isLoading } = useQuery({
    queryKey: [campaignId, initialData.campaign.id],
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
    initialData: initialData.campaign,
    enabled: !!campaignId,
  });

  const isOwner = initialData.campaign?.owner?.id === currentUser?.id;

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
    mutationFn: updateGameSessionStatus,
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Game session status updated successfully!");
        queryClient.invalidateQueries({
          queryKey: ["campaignGameSessions", campaignId, statusFilter],
        });
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

  const { data: applicationsData, isLoading: isLoadingApplications } = useQuery({
    queryKey: ["campaignApplications", campaignId],
    queryFn: () => getCampaignApplications({ data: { id: campaignId } }),
    enabled: !!campaignId && isOwner,
  });

  const { data: gameSessionsData, isLoading: isLoadingGameSessions } = useQuery({
    queryKey: ["campaignGameSessions", campaignId, statusFilter],
    queryFn: () =>
      listGameSessionsByCampaignId({ data: { campaignId, status: statusFilter } }),
    enabled: !!campaignId,
  });

  if (isLoading || isLoadingApplications || isLoadingGameSessions) {
    return <LoaderCircle className="mx-auto h-8 w-8 animate-spin" />;
  }

  if (!campaign) {
    return <div>Campaign not found</div>;
  }

  const gameSessions = gameSessionsData?.success ? gameSessionsData.data : [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Campaign Details</CardTitle>
              <CardDescription>
                View and manage the details of this campaign.
              </CardDescription>
            </div>
            {isOwner && !isEditing ? (
              <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                <Edit2 className="mr-2 h-4 w-4" />
                Edit Campaign
              </Button>
            ) : isOwner && isEditing ? (
              <div className="flex gap-2">
                <Button onClick={() => setIsEditing(false)} variant="outline" size="sm">
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/dashboard/campaigns">
                    <ArrowLeftIcon className="mr-2 h-4 w-4" />
                    Back to Campaigns
                  </Link>
                </Button>
                <FormSubmitButton
                  isSubmitting={updateCampaignMutation.isPending}
                  onClick={() => {}}
                  size="sm"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </FormSubmitButton>
              </div>
            ) : null}
          </div>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <CampaignForm
              initialValues={{
                ...campaign,
                pricePerSession: campaign.pricePerSession ?? undefined,
                minimumRequirements: campaign.minimumRequirements ?? undefined,
                safetyRules: campaign.safetyRules ?? undefined,
              }}
              onSubmit={async (values) => {
                await updateCampaignMutation.mutateAsync({
                  data: { ...values, id: campaignId },
                });
              }}
              isSubmitting={updateCampaignMutation.isPending}
            />
          ) : (
            <CampaignDetailsView campaign={campaign} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Game Sessions</CardTitle>
            <div className="flex items-center gap-4">
              <Select
                value={statusFilter}
                onValueChange={(value) =>
                  setStatusFilter(value as (typeof gameStatusEnum.enumValues)[number])
                }
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
        <CardContent>
          {isLoadingGameSessions ? (
            <LoaderCircle className="mx-auto h-8 w-8 animate-spin" />
          ) : gameSessions.length === 0 ? (
            <p className="text-muted-foreground">
              No game sessions found for this campaign with the selected status.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {gameSessions.map((gameSession) => (
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
        />
      )}

      {isOwner && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <InviteParticipants
            campaignId={campaignId}
            currentParticipants={campaign.participants || []}
          />
          <ManageApplications
            campaignId={campaignId}
            applications={applicationsData?.success ? applicationsData.data : []}
          />
        </div>
      )}
    </div>
  );
}
