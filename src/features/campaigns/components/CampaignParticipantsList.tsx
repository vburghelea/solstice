import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ProfileLink } from "~/components/ProfileLink";
import { Avatar } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  removeCampaignParticipantBan,
  respondToCampaignApplication,
  updateCampaignParticipant,
} from "~/features/campaigns/campaigns.mutations";
import {
  CampaignApplication,
  CampaignParticipant,
} from "~/features/campaigns/campaigns.types";
import { useCampaignsTranslation } from "~/hooks/useTypedTranslation";
import type { User } from "~/lib/auth/types";
import { OperationResult } from "~/shared/types/common";

interface CampaignParticipantsListProps {
  campaignId: string;
  isOwner: boolean;
  currentUser: User | null;
  campaignOwnerId: string;
  applications: CampaignApplication[];
  participants: CampaignParticipant[];
}

export function CampaignParticipantsList({
  campaignId,
  isOwner,
  currentUser,
  campaignOwnerId,
  applications,
  participants,
}: CampaignParticipantsListProps) {
  const { t } = useCampaignsTranslation();
  const queryClient = useQueryClient();

  const removeParticipantMutation = useMutation<
    OperationResult<CampaignParticipant>,
    Error,
    { data: { participantId: string; status: "rejected" } }
  >({
    mutationFn: updateCampaignParticipant,
    onSuccess: () => {
      toast.success(t("campaigns.messages.participant_removed_success"));
      queryClient.invalidateQueries({ queryKey: ["campaignParticipants", campaignId] });
      queryClient.invalidateQueries({ queryKey: ["campaignDetails", campaignId] });
    },
    onError: (error) => {
      toast.error(
        t("campaigns.errors.participant_remove_failed", { message: error.message }),
      );
    },
  });

  const handleRemoveParticipant = (participantId: string) => {
    removeParticipantMutation.mutate({
      data: { participantId: participantId, status: "rejected" },
    });
  };

  const removeRejectedParticipantMutation = useMutation<
    OperationResult<boolean>,
    Error,
    { data: { id: string } }
  >({
    mutationFn: removeCampaignParticipantBan,
    onSuccess: () => {
      toast.success(t("campaigns.messages.participant_ban_removed_success"));
      queryClient.invalidateQueries({ queryKey: ["campaignParticipants", campaignId] });
      queryClient.invalidateQueries({ queryKey: ["campaignDetails", campaignId] });
    },
    onError: (error) => {
      toast.error(
        t("campaigns.errors.participant_ban_remove_failed", { message: error.message }),
      );
    },
  });

  const handleAllowParticipant = (participantId: string) => {
    removeRejectedParticipantMutation.mutate({ data: { id: participantId } });
  };

  const respondToCampaignApplicationMutation = useMutation({
    mutationFn: respondToCampaignApplication,
    onSuccess: () => {
      toast.success(t("campaigns.messages.application_status_updated_success"));
      queryClient.invalidateQueries({ queryKey: ["campaignApplications", campaignId] });
      queryClient.invalidateQueries({ queryKey: ["campaignDetails", campaignId] });
    },
    onError: (error) => {
      toast.error(
        t("campaigns.errors.application_update_failed", { message: error.message }),
      );
    },
  });

  const handleApproveApplication = (applicationId: string) => {
    respondToCampaignApplicationMutation.mutate({
      data: {
        applicationId,
        status: "approved",
      },
    });
  };

  const handleRejectApplication = (applicationId: string) => {
    respondToCampaignApplicationMutation.mutate({
      data: {
        applicationId,
        status: "rejected",
      },
    });
  };

  const approvedParticipants = participants.filter(
    (p: CampaignParticipant) => p.status === "approved",
  );
  const rejectedParticipants = participants.filter(
    (p: CampaignParticipant) => p.status === "rejected",
  );
  const pendingApplications = applications.filter(
    (p: CampaignApplication) => p.status === "pending",
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>
            {t("campaigns.participants_list.participants_title", {
              count: approvedParticipants.length,
            })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {approvedParticipants.length === 0 ? (
            <p>{t("campaigns.participants_list.no_participants")}</p>
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
                      {p.userId === campaignOwnerId
                        ? t("campaigns.participants_list.owner_label")
                        : t("campaigns.participants_list.role_status", {
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
                          removeParticipantMutation.variables?.data.participantId === p.id
                        }
                      >
                        {removeParticipantMutation.isPending &&
                        removeParticipantMutation.variables?.data.participantId === p.id
                          ? t("campaigns.participants_list.removing")
                          : t("campaigns.participants_list.remove")}
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
              {t("campaigns.participants_list.pending_applications_title", {
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
                      {t("campaigns.participants_list.status_label", {
                        status: p.status,
                      })}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleApproveApplication(p.id)}
                      disabled={respondToCampaignApplicationMutation.isPending}
                    >
                      {respondToCampaignApplicationMutation.isPending
                        ? t("campaigns.participants_list.approving")
                        : t("campaigns.participants_list.approve")}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRejectApplication(p.id)}
                      disabled={respondToCampaignApplicationMutation.isPending}
                    >
                      {respondToCampaignApplicationMutation.isPending
                        ? t("campaigns.participants_list.rejecting")
                        : t("campaigns.participants_list.reject")}
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
              {t("campaigns.participants_list.banned_title", {
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
                      {t("campaigns.participants_list.role_status", {
                        role: p.role,
                        status: p.status,
                      })}
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
                      ? t("campaigns.participants_list.allowing")
                      : t("campaigns.participants_list.allow")}
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
