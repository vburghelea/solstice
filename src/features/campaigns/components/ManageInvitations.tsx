import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ProfileLink } from "~/components/ProfileLink";
import { Avatar } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { removeCampaignParticipant } from "~/features/campaigns/campaigns.mutations";
import { CampaignParticipant } from "~/features/campaigns/campaigns.types";

interface ManageInvitationsProps {
  campaignId: string;
  invitations: CampaignParticipant[];
}

export function ManageInvitations({ campaignId, invitations }: ManageInvitationsProps) {
  const queryClient = useQueryClient();

  const rejectInvitationMutation = useMutation({
    mutationFn: removeCampaignParticipant, // This will be used for rejecting (deleting the entry)
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Invitation rejected successfully!");
        queryClient.invalidateQueries({ queryKey: ["campaign", campaignId] });
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
        participantId: participantId,
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
                <div className="flex items-center gap-2">
                  {invitation.user ? (
                    <>
                      <Avatar
                        name={invitation.user.name}
                        email={invitation.user.email}
                        srcUploaded={invitation.user.uploadedAvatarPath ?? null}
                        srcProvider={invitation.user.image ?? null}
                        userId={invitation.user.id}
                        className="h-8 w-8"
                      />
                      <span>
                        <ProfileLink
                          userId={invitation.user.id}
                          username={invitation.user.name || invitation.user.email}
                        />{" "}
                        (Invited - {invitation.status})
                      </span>
                    </>
                  ) : (
                    <span>Unknown User (Invited - {invitation.status})</span>
                  )}
                </div>
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
