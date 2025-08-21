import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ProfileLink } from "~/components/ProfileLink";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  removeGameParticipantBan,
  respondToGameApplication,
  updateGameParticipant,
} from "~/features/games/games.mutations";
import { GameApplication, GameParticipant } from "~/features/games/games.types";
import type { User } from "~/lib/auth/types";
import { OperationResult } from "~/shared/types/common";

interface GameParticipantsListProps {
  gameId: string;
  isOwner: boolean;
  currentUser: User | null;
  gameOwnerId: string;
  applications: GameApplication[];
  participants: GameParticipant[];
}

export function GameParticipantsList({
  gameId,
  isOwner,
  currentUser,
  gameOwnerId,
  applications,
  participants,
}: GameParticipantsListProps) {
  const queryClient = useQueryClient();

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

  const handleAllowParticipant = (participantId: string) => {
    removeRejectedParticipantMutation.mutate({ data: { id: participantId } });
  };

  const removeRejectedParticipantMutation = useMutation<
    OperationResult<boolean>,
    Error,
    { data: { id: string } }
  >({
    mutationFn: removeGameParticipantBan,
    onSuccess: () => {
      toast.success("Participant ban removed successfully!");
      queryClient.invalidateQueries({ queryKey: ["gameParticipants", gameId] });
      queryClient.invalidateQueries({ queryKey: ["gameDetails", gameId] });
    },
    onError: (error) => {
      toast.error(`Failed to remove participant ban: ${error.message}`);
    },
  });

  const respondToGameApplicationMutation = useMutation({
    mutationFn: respondToGameApplication,
    onSuccess: () => {
      toast.success("Application status updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["gameApplications", gameId] });
      queryClient.invalidateQueries({ queryKey: ["gameDetails", gameId] });
    },
    onError: (error) => {
      toast.error(`Failed to update application status: ${error.message}`);
    },
  });

  const handleApproveApplication = (applicationId: string) => {
    respondToGameApplicationMutation.mutate({
      data: {
        applicationId,
        status: "approved",
      },
    });
  };

  const handleRejectApplication = (applicationId: string) => {
    respondToGameApplicationMutation.mutate({
      data: {
        applicationId,
        status: "rejected",
      },
    });
  };

  const approvedParticipants = participants.filter(
    (p: GameParticipant) => p.status !== "rejected" && p.status !== "pending",
  );
  const rejectedParticipants = participants.filter(
    (p: GameParticipant) => p.status === "rejected",
  );
  const pendingApplications = applications.filter(
    (p: GameApplication) => p.status === "pending",
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Participants ({approvedParticipants.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {approvedParticipants.length === 0 ? (
            <p>No participants yet.</p>
          ) : (
            <ul className="space-y-2">
              {approvedParticipants.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-1">
                  <span>
                    <ProfileLink
                      userId={p.userId}
                      username={p.user.name || p.user.email}
                    />{" "}
                    {p.userId === gameOwnerId ? "(owner)" : `(${p.role} - ${p.status})`}
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

      {isOwner && pendingApplications.length > 0 && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Pending Applications ({pendingApplications.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {pendingApplications.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-1">
                  <span>
                    <ProfileLink
                      userId={p.userId}
                      username={p.user.name || p.user.email}
                    />{" "}
                    ({p.status})
                  </span>
                  <div className="flex space-x-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleApproveApplication(p.id)}
                      disabled={respondToGameApplicationMutation.isPending}
                    >
                      {respondToGameApplicationMutation.isPending
                        ? "Approving..."
                        : "Approve"}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRejectApplication(p.id)}
                      disabled={respondToGameApplicationMutation.isPending}
                    >
                      {respondToGameApplicationMutation.isPending
                        ? "Rejecting..."
                        : "Reject"}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {isOwner && rejectedParticipants.length > 0 && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Banned from the Game ({rejectedParticipants.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {rejectedParticipants.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-1">
                  <span>
                    <ProfileLink
                      userId={p.userId}
                      username={p.user.name || p.user.email}
                    />{" "}
                    ({p.role} - {p.status})
                  </span>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleAllowParticipant(p.id)}
                    disabled={
                      removeRejectedParticipantMutation.isPending &&
                      removeRejectedParticipantMutation.variables?.data.id === p.id
                    }
                  >
                    {removeRejectedParticipantMutation.isPending &&
                    removeRejectedParticipantMutation.variables?.data.id === p.id
                      ? "Allowing..."
                      : "Allow"}
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </>
  );
}
