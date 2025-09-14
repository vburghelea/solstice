import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { updateCampaign } from "~/features/campaigns/campaigns.mutations";
import {
  getCampaign,
  getCampaignParticipants,
} from "~/features/campaigns/campaigns.queries";
import { SessionZeroForm } from "~/features/campaigns/components/SessionZeroForm";

export const Route = createFileRoute("/dashboard/campaigns/$campaignId/zero")({
  loader: async ({ params }) => {
    const result = await getCampaign({ data: { id: params.campaignId } });
    if (!result.success || !result.data) {
      toast.error("Failed to load campaign details.");
      throw new Error("Campaign not found");
    }
    return { campaign: result.data };
  },
  component: SessionZeroPage,
});

function SessionZeroPage() {
  const { campaign } = Route.useLoaderData();
  const { user: currentUser } = Route.useRouteContext();
  const queryClient = useQueryClient();

  const { data: participants = [] } = useQuery({
    queryKey: ["campaign-participants", campaign.id],
    queryFn: async () => {
      const result = await getCampaignParticipants({ data: { id: campaign.id } });
      return result.success ? result.data : [];
    },
  });

  const isOwner = campaign?.owner?.id === currentUser?.id;
  const isParticipant = participants.some(
    (p) => p.user.id === currentUser?.id && p.role === "player",
  );
  const isInvitee = participants.some(
    (p) => p.user.id === currentUser?.id && p.role === "invited",
  );

  const canView = isOwner || isParticipant || isInvitee;
  const canEdit = isOwner;

  const updateCampaignMutation = useMutation({
    mutationFn: updateCampaign,
    onSuccess: async (data) => {
      if (data.success) {
        toast.success("Session Zero details updated successfully!");
        await queryClient.invalidateQueries({ queryKey: ["campaign", campaign.id] });
      } else {
        toast.error(data.errors?.[0]?.message || "Failed to update Session Zero details");
      }
    },
    onError: (error) => {
      toast.error(error.message || "An unexpected error occurred");
    },
  });

  if (!campaign) {
    return <LoaderCircle className="mx-auto h-8 w-8 animate-spin" />;
  }

  if (!canView) {
    return (
      <div className="container mx-auto max-w-4xl space-y-6 p-6">
        <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
        <p>You do not have permission to view this page.</p>
        <Link to="/dashboard/campaigns">
          <Button variant="outline">Back to Campaigns</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Session Zero for {campaign.name}</CardTitle>
          <Link
            to="/dashboard/campaigns/$campaignId"
            params={{ campaignId: campaign.id }}
          >
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Campaign
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="space-y-4">
          <CardDescription>
            Information gathered during the Session Zero meeting.
            {!canEdit && " (Read-only)"}
          </CardDescription>
          <SessionZeroForm
            initialValues={{
              sessionZeroData: campaign.sessionZeroData,
              characterCreationOutcome: campaign.characterCreationOutcome,
            }}
            onSubmit={async (values) => {
              if (!canEdit) return;
              await updateCampaignMutation.mutateAsync({
                data: {
                  id: campaign.id,
                  sessionZeroData: values.sessionZeroData,
                  characterCreationOutcome: values.characterCreationOutcome,
                },
              });
            }}
            isSubmitting={updateCampaignMutation.isPending}
            isOwner={canEdit}
          />
        </CardContent>
      </Card>
    </div>
  );
}
