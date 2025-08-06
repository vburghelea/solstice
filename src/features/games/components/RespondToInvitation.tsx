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
import type { GameParticipant, OperationResult } from "~/features/games/games.types";

interface RespondToInvitationProps {
  participant: GameParticipant;
}

export function RespondToInvitation({ participant }: RespondToInvitationProps) {
  const queryClient = useQueryClient();

  const respondMutation = useMutation<
    OperationResult<GameParticipant | boolean>,
    Error,
    { data: { participantId: string; action: "accept" | "reject" } }
  >({
    mutationFn: respondToGameInvitation,
    onSuccess: async (data) => {
      if (data.success) {
        toast.success("Invitation response recorded.");
        await queryClient.invalidateQueries({ queryKey: ["game", participant.gameId] });
        await queryClient.invalidateQueries({
          queryKey: ["gameApplications", participant.gameId],
        });
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
        <CardTitle>Game Invitation</CardTitle>
        <CardDescription>
          You have been invited to this game. Please accept or reject the invitation.
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
