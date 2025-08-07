import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
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
import { Separator } from "~/components/ui/separator";
import { updateCampaign } from "~/features/campaigns/campaigns.mutations";
import {
  getCampaign,
  getCampaignApplications,
} from "~/features/campaigns/campaigns.queries";
import type { CampaignWithDetails } from "~/features/campaigns/campaigns.types";
import { CampaignForm } from "~/features/campaigns/components/CampaignForm";
import { InviteParticipants } from "~/features/campaigns/components/InviteParticipants";
import { ManageApplications } from "~/features/campaigns/components/ManageApplications";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const Route = createFileRoute("/dashboard/campaigns/$campaignId")({
  loader: async ({ params }) => {
    if (!UUID_REGEX.test(params.campaignId)) {
      toast.error("Invalid campaign ID format.");
      throw new Error("Invalid campaign ID");
    }

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

function CampaignDetailsPage() {
  const initialData = Route.useLoaderData();
  const queryClient = useQueryClient();
  const { campaignId } = Route.useParams();
  const { user: currentUser } = Route.useRouteContext();

  const [isEditing, setIsEditing] = useState(false);

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

  const isOwner = campaign?.owner?.id === currentUser?.id;

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

  if (isLoading || isLoadingApplications) {
    return <LoaderCircle className="mx-auto h-8 w-8 animate-spin" />;
  }

  if (!campaign) {
    return <div>Campaign not found</div>;
  }

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
