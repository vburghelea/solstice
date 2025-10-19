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
import { removeGameParticipant } from "~/features/games/games.mutations";
import { GameParticipant } from "~/features/games/games.types";
import { useGamesTranslation } from "~/hooks/useTypedTranslation";

interface ManageInvitationsProps {
  gameId: string;
  invitations: GameParticipant[];
}

export function ManageInvitations({ gameId, invitations }: ManageInvitationsProps) {
  const { t } = useGamesTranslation();
  const queryClient = useQueryClient();

  const rejectInvitationMutation = useMutation({
    mutationFn: removeGameParticipant, // This will be used for rejecting (deleting the entry)
    onSuccess: (data) => {
      if (data.success) {
        toast.success(t("messages.invitation_rejected_success"));
        queryClient.invalidateQueries({ queryKey: ["game", gameId] });
      } else {
        toast.error(data.errors?.[0]?.message || t("errors.failed_to_reject_invitation"));
      }
    },
    onError: (error) => {
      toast.error(`${t("errors.failed_to_reject_invitation")}: ${error.message}`);
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
        <CardTitle>{t("titles.manage_invitations")}</CardTitle>
        <CardDescription>{t("descriptions.manage_invitations")}</CardDescription>
      </CardHeader>
      <CardContent>
        {invitations.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            {t("status.no_pending_invitations")}
          </p>
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
                        ({t("invitation_status.invited")} - {invitation.status})
                      </span>
                    </>
                  ) : (
                    <span>
                      {t("status.unknown_user")} ({t("invitation_status.invited")} -{" "}
                      {invitation.status})
                    </span>
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
                      t("buttons.revoke")
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
