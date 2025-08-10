import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { respondToCampaignInvitation } from "~/features/campaigns/campaigns.mutations";
import type { CampaignParticipant } from "~/features/campaigns/campaigns.types";
import { OperationResult } from "~/shared/types/common";

interface RespondToInvitationProps {
  participant: CampaignParticipant;
}

export function RespondToInvitation({ participant }: RespondToInvitationProps) {
  const queryClient = useQueryClient();

  const respondMutation = useMutation<
    OperationResult<CampaignParticipant | boolean>,
    Error,
    { data: { participantId: string; action: "accept" | "reject" } }
  >({
    mutationFn: respondToCampaignInvitation,
    onSuccess: async (data) => {
      if (data.success) {
        toast.success("Invitation response recorded.");
        await queryClient.invalidateQueries({
          queryKey: ["campaign", participant.campaignId],
        });
        await queryClient.invalidateQueries({
          queryKey: ["campaignApplications", participant.campaignId],
        });
        await queryClient.invalidateQueries({ queryKey: ["currentUser"] }); // Invalidate currentUser query
      } else {
        toast.error(data.errors?.[0]?.message || "Failed to respond to invitation.");
      }
    },
    onError: (error) => {
      toast.error(error.message || "An unexpected error occurred.");
    },
  });

  const handleAccept = () => {
    respondMutation.mutate({ data: { participantId: participant.id, action: "accept" } });
  };

  const handleReject = () => {
    respondMutation.mutate({ data: { participantId: participant.id, action: "reject" } });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Campaign Invitation</CardTitle>
        <CardDescription>
          You have been invited to this campaign. Please accept or reject the invitation.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex gap-4">
        <Button
          onClick={handleAccept}
          disabled={respondMutation.isPending}
          className="flex-1"
        >
          {respondMutation.isPending &&
          respondMutation.variables?.data.action === "accept"
            ? "Accepting..."
            : "Accept"}
        </Button>
        <Button
          onClick={handleReject}
          disabled={respondMutation.isPending}
          variant="outline"
          className="flex-1"
        >
          {respondMutation.isPending &&
          respondMutation.variables?.data.action === "reject"
            ? "Rejecting..."
            : "Reject"}
        </Button>
      </CardContent>
    </Card>
  );
}
