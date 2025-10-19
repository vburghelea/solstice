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
import { respondToGameInvitation } from "~/features/games/games.mutations";
import type { GameParticipant } from "~/features/games/games.types";
import { useGamesTranslation } from "~/hooks/useTypedTranslation";
import { OperationResult } from "~/shared/types/common";

interface RespondToInvitationProps {
  participant: GameParticipant;
}

export function RespondToInvitation({ participant }: RespondToInvitationProps) {
  const { t } = useGamesTranslation();
  const queryClient = useQueryClient();

  const respondMutation = useMutation<
    OperationResult<GameParticipant | boolean>,
    Error,
    { data: { participantId: string; action: "accept" | "reject" } }
  >({
    mutationFn: respondToGameInvitation,
    onSuccess: async (data) => {
      if (data.success) {
        toast.success(t("messages.invitation_response_recorded"));
        await queryClient.invalidateQueries({ queryKey: ["game", participant.gameId] });
        await queryClient.invalidateQueries({
          queryKey: ["gameApplications", participant.gameId],
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
        <CardTitle>{t("titles.game_invitation")}</CardTitle>
        <CardDescription>{t("descriptions.game_invitation")}</CardDescription>
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
