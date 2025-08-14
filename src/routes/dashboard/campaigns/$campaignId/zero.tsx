import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { updateCampaign } from "~/features/campaigns/campaigns.mutations";
import { getCampaign } from "~/features/campaigns/campaigns.queries";
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

  const isOwner = campaign?.owner?.id === currentUser?.id;

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

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-6">
      <h1 className="text-3xl font-bold text-gray-900">
        Session Zero for {campaign.name}
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Session Zero Details</CardTitle>
          <CardDescription>
            Information gathered during the Session Zero meeting.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SessionZeroForm
            initialValues={{
              sessionZeroData: campaign.sessionZeroData,
              characterCreationOutcome: campaign.characterCreationOutcome,
            }}
            onSubmit={async (values) => {
              await updateCampaignMutation.mutateAsync({
                data: {
                  id: campaign.id,
                  sessionZeroData: values.sessionZeroData,
                  characterCreationOutcome: values.characterCreationOutcome,
                },
              });
            }}
            isSubmitting={updateCampaignMutation.isPending}
            isOwner={isOwner}
          />
        </CardContent>
      </Card>
    </div>
  );
}
