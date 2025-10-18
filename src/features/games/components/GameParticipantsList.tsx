import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ProfileLink } from "~/components/ProfileLink";
import { Avatar } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  removeGameParticipantBan,
  respondToGameApplication,
  updateGameParticipant,
} from "~/features/games/games.mutations";
import { GameApplication, GameParticipant } from "~/features/games/games.types";
import { useGamesTranslation } from "~/hooks/useTypedTranslation";
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
  const { t } = useGamesTranslation();

  const removeParticipantMutation = useMutation<
    OperationResult<GameParticipant>,
    Error,
    { data: { id: string; status: "rejected" } }
  >({
    mutationFn: updateGameParticipant,
    onSuccess: () => {
      toast.success(t("participants_list.success_messages.participant_removed"));
      queryClient.invalidateQueries({ queryKey: ["gameParticipants", gameId] });
      queryClient.invalidateQueries({ queryKey: ["gameDetails", gameId] });
    },
    onError: (error) => {
      toast.error(
        t("participants_list.error_messages.failed_to_remove", { error: error.message }),
      );
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
      toast.success(t("participants_list.success_messages.ban_removed"));
      queryClient.invalidateQueries({ queryKey: ["gameParticipants", gameId] });
      queryClient.invalidateQueries({ queryKey: ["gameDetails", gameId] });
    },
    onError: (error) => {
      toast.error(
        t("participants_list.error_messages.failed_to_remove_ban", {
          error: error.message,
        }),
      );
    },
  });

  const respondToGameApplicationMutation = useMutation({
    mutationFn: respondToGameApplication,
    onSuccess: () => {
      toast.success(t("participants_list.success_messages.application_updated"));
      queryClient.invalidateQueries({ queryKey: ["gameApplications", gameId] });
      queryClient.invalidateQueries({ queryKey: ["gameDetails", gameId] });
    },
    onError: (error) => {
      toast.error(
        t("participants_list.error_messages.failed_to_update_application", {
          error: error.message,
        }),
      );
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
          <CardTitle>
            {t("participants_list.participants_title", {
              count: approvedParticipants.length,
            })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {approvedParticipants.length === 0 ? (
            <p>{t("participants_list.no_participants")}</p>
          ) : (
            <ul className="space-y-2">
              {approvedParticipants.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    <Avatar
                      name={p.user.name}
                      email={p.user.email}
                      srcUploaded={p.user.uploadedAvatarPath ?? null}
                      srcProvider={p.user.image ?? null}
                      userId={p.userId}
                      className="h-8 w-8"
                    />
                    <span>
                      <ProfileLink
                        userId={p.userId}
                        username={p.user.name || p.user.email}
                      />{" "}
                      {p.userId === gameOwnerId
                        ? t("participants_list.owner_label")
                        : t("participants_list.role_status", {
                            role: p.role,
                            status: p.status,
                          })}
                    </span>
                  </div>
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
                          ? t("participants_list.buttons.removing")
                          : t("participants_list.buttons.remove")}
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
            <CardTitle>
              {t("participants_list.pending_applications_title", {
                count: pendingApplications.length,
              })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {pendingApplications.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    <Avatar
                      name={p.user.name}
                      email={p.user.email}
                      srcUploaded={p.user.uploadedAvatarPath ?? null}
                      srcProvider={p.user.image ?? null}
                      userId={p.userId}
                      className="h-8 w-8"
                    />
                    <span>
                      <ProfileLink
                        userId={p.userId}
                        username={p.user.name || p.user.email}
                      />{" "}
                      ({p.status})
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleApproveApplication(p.id)}
                      disabled={respondToGameApplicationMutation.isPending}
                    >
                      {respondToGameApplicationMutation.isPending
                        ? t("participants_list.buttons.approving")
                        : t("participants_list.buttons.approve")}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRejectApplication(p.id)}
                      disabled={respondToGameApplicationMutation.isPending}
                    >
                      {respondToGameApplicationMutation.isPending
                        ? t("participants_list.buttons.rejecting")
                        : t("participants_list.buttons.reject")}
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
            <CardTitle>
              {t("participants_list.banned_title", {
                count: rejectedParticipants.length,
              })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {rejectedParticipants.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    <Avatar
                      name={p.user.name}
                      email={p.user.email}
                      srcUploaded={p.user.uploadedAvatarPath ?? null}
                      srcProvider={p.user.image ?? null}
                      userId={p.userId}
                      className="h-8 w-8"
                    />
                    <span>
                      <ProfileLink
                        userId={p.userId}
                        username={p.user.name || p.user.email}
                      />{" "}
                      ({p.role} - {p.status})
                    </span>
                  </div>
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
                      ? t("participants_list.buttons.allowing")
                      : t("participants_list.buttons.allow")}
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
