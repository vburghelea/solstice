import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ProfileLink } from "~/components/ProfileLink";
import { removeGameParticipant } from "~/features/games/games.mutations";
import { GameParticipant } from "~/features/games/games.types";
import { Button } from "~/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/shared/ui/card";

interface ManageInvitationsProps {
  gameId: string;
  invitations: GameParticipant[];
}

export function ManageInvitations({ gameId, invitations }: ManageInvitationsProps) {
  const queryClient = useQueryClient();

  const rejectInvitationMutation = useMutation({
    mutationFn: removeGameParticipant, // This will be used for rejecting (deleting the entry)
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Invitation rejected successfully!");
        queryClient.invalidateQueries({ queryKey: ["game", gameId] });
      } else {
        toast.error(data.errors?.[0]?.message || "Failed to reject invitation");
      }
    },
    onError: (error) => {
      toast.error(`Failed to reject invitation: ${error.message}`);
    },
  });

  const handleReject = (participantId: string) => {
    rejectInvitationMutation.mutate({
      data: {
        id: participantId,
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Invitations</CardTitle>
        <CardDescription>Review and process pending invitations.</CardDescription>
      </CardHeader>
      <CardContent>
        {invitations.length === 0 ? (
          <p className="text-muted-foreground text-sm">No pending invitations.</p>
        ) : (
          <ul className="bg-background max-h-60 overflow-y-auto rounded-md border p-2">
            {invitations.map((invitation) => (
              <li
                key={invitation.id}
                className="flex items-center justify-between border-b py-2 last:border-b-0"
              >
                <span>
                  {invitation.user ? (
                    <ProfileLink
                      userId={invitation.user.id}
                      username={invitation.user.name || invitation.user.email}
                    />
                  ) : (
                    "Unknown User"
                  )}{" "}
                  (Invited - {invitation.status})
                </span>
                <div className="flex space-x-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleReject(invitation.id)}
                    disabled={rejectInvitationMutation.isPending}
                  >
                    {rejectInvitationMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      "Revoke"
                    )}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
