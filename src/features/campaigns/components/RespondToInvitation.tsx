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
import { useCampaignsTranslation } from "~/hooks/useTypedTranslation";
import { OperationResult } from "~/shared/types/common";

interface RespondToInvitationProps {
  participant: CampaignParticipant;
}

export function RespondToInvitation({ participant }: RespondToInvitationProps) {
  const { t } = useCampaignsTranslation();
  const queryClient = useQueryClient();

  const respondMutation = useMutation<
    OperationResult<CampaignParticipant | boolean>,
    Error,
    { data: { participantId: string; action: "accept" | "reject" } }
  >({
    mutationFn: respondToCampaignInvitation,
    onSuccess: async (data) => {
      if (data.success) {
        toast.success(t("messages.invitation_response_recorded"));
        await queryClient.invalidateQueries({
          queryKey: ["campaign", participant.campaignId],
        });
        await queryClient.invalidateQueries({
          queryKey: ["campaignApplications", participant.campaignId],
        });
        await queryClient.invalidateQueries({ queryKey: ["currentUser"] }); // Invalidate currentUser query
      } else {
        toast.error(
          data.errors?.[0]?.message || t("errors.failed_to_respond_invitation"),
        );
      }
    },
    onError: (error) => {
      toast.error(error.message || t("errors.unexpected_error"));
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
        <CardTitle>{t("titles.campaign_invitation")}</CardTitle>
        <CardDescription>{t("descriptions.campaign_invitation")}</CardDescription>
      </CardHeader>
      <CardContent className="flex gap-4">
        <Button
          onClick={handleAccept}
          disabled={respondMutation.isPending}
          className="flex-1"
        >
          {respondMutation.isPending &&
          respondMutation.variables?.data.action === "accept"
            ? t("buttons.accepting")
            : t("buttons.accept")}
        </Button>
        <Button
          onClick={handleReject}
          disabled={respondMutation.isPending}
          variant="outline"
          className="flex-1"
        >
          {respondMutation.isPending &&
          respondMutation.variables?.data.action === "reject"
            ? t("buttons.rejecting")
            : t("buttons.reject")}
        </Button>
      </CardContent>
    </Card>
  );
}
