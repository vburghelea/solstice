import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { updateGameParticipant } from "~/features/games/games.mutations";
import { getGameParticipants } from "~/features/games/games.queries";
import type { GameParticipant, OperationResult } from "~/features/games/games.types";
import type { User } from "~/lib/auth/types";

interface GameParticipantsListProps {
  gameId: string;
  isOwner: boolean;
  currentUser: User | null;
  gameOwnerId: string;
}

export function GameParticipantsList({
  gameId,
  isOwner,
  currentUser,
  gameOwnerId,
}: GameParticipantsListProps) {
  const queryClient = useQueryClient();

  const { data: participantsData, isLoading } = useQuery({
    queryKey: ["gameParticipants", gameId],
    queryFn: () => getGameParticipants({ data: { id: gameId } }),
    enabled: !!gameId,
  });

  const removeParticipantMutation = useMutation<
    OperationResult<GameParticipant>,
    Error,
    { data: { id: string; status: "rejected" } }
  >({
    mutationFn: updateGameParticipant,
    onSuccess: () => {
      toast.success("Participant removed successfully!");
      queryClient.invalidateQueries({ queryKey: ["gameParticipants", gameId] });
      queryClient.invalidateQueries({ queryKey: ["gameDetails", gameId] });
    },
    onError: (error) => {
      toast.error(`Failed to remove participant: ${error.message}`);
    },
  });

  const handleRemoveParticipant = (participantId: string) => {
    removeParticipantMutation.mutate({ data: { id: participantId, status: "rejected" } });
  };

  if (isLoading) {
    return <LoaderCircle className="mx-auto h-8 w-8 animate-spin" />;
  }

  if (!participantsData?.success || !participantsData.data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Participants</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Failed to load participants or no participants found.</p>
        </CardContent>
      </Card>
    );
  }

  const participants = participantsData.data;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Participants ({participants.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {participants.length === 0 ? (
          <p>No participants yet.</p>
        ) : (
          <ul className="space-y-2">
            {participants.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-1">
                <span>
                  {p.user.name || p.user.email} (
                  {p.userId === gameOwnerId ? "owner" : p.role} - {p.status})
                </span>
                {isOwner &&
                  p.role !== "applicant" &&
                  p.status !== "rejected" &&
                  p.userId !== currentUser?.id && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveParticipant(p.id)}
                      disabled={
                        removeParticipantMutation.isPending &&
                        removeParticipantMutation.variables?.data.id === p.id
                      }
                    >
                      {removeParticipantMutation.isPending &&
                      removeParticipantMutation.variables?.data.id === p.id
                        ? "Removing..."
                        : "Remove"}
                    </Button>
                  )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
