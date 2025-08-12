import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
  const queryClient = useQueryClient();

  const removeParticipantMutation = useMutation<
    OperationResult<CampaignParticipant>,
    Error,
    { data: { participantId: string; status: "rejected" } }
  >({
    mutationFn: updateCampaignParticipant,
    onSuccess: () => {
      toast.success("Participant removed successfully!");
      queryClient.invalidateQueries({ queryKey: ["campaignParticipants", campaignId] });
      queryClient.invalidateQueries({ queryKey: ["campaignDetails", campaignId] });
    },
    onError: (error) => {
      toast.error(`Failed to remove participant: ${error.message}`);
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
      toast.success("Participant ban removed successfully!");
      queryClient.invalidateQueries({ queryKey: ["campaignParticipants", campaignId] });
      queryClient.invalidateQueries({ queryKey: ["campaignDetails", campaignId] });
    },
    onError: (error) => {
      toast.error(`Failed to remove participant ban: ${error.message}`);
    },
  });

  const handleAllowParticipant = (participantId: string) => {
    removeRejectedParticipantMutation.mutate({ data: { id: participantId } });
  };

  const respondToCampaignApplicationMutation = useMutation({
    mutationFn: respondToCampaignApplication,
    onSuccess: () => {
      toast.success("Application status updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["campaignApplications", campaignId] });
      queryClient.invalidateQueries({ queryKey: ["campaignDetails", campaignId] });
    },
    onError: (error) => {
      toast.error(`Failed to update application status: ${error.message}`);
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
                    {p.user.name || p.user.email} (
                    {p.userId === campaignOwnerId ? "owner" : p.role} - {p.status})
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
                          removeParticipantMutation.variables?.data.participantId === p.id
                        }
                      >
                        {removeParticipantMutation.isPending &&
                        removeParticipantMutation.variables?.data.participantId === p.id
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
                    {p.user.name || p.user.email} ({p.status})
                  </span>
                  <div className="flex space-x-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleApproveApplication(p.id)}
                      disabled={removeRejectedParticipantMutation.isPending}
                    >
                      {removeRejectedParticipantMutation.isPending
                        ? "Approving..."
                        : "Approve"}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRejectApplication(p.id)}
                      disabled={removeParticipantMutation.isPending}
                    >
                      {removeParticipantMutation.isPending ? "Rejecting..." : "Reject"}
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
              Banned from the Campaign ({rejectedParticipants.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {rejectedParticipants.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-1">
                  <span>
                    {p.user.name || p.user.email} ({p.role} - {p.status})
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
