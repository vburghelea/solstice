import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { updateCampaignParticipant } from "~/features/campaigns/campaigns.mutations";
import { getCampaignParticipants } from "~/features/campaigns/campaigns.queries";
import { CampaignParticipant } from "~/features/campaigns/campaigns.types";
import type { User } from "~/lib/auth/types";
import { OperationResult } from "~/shared/types/common";

interface CampaignParticipantsListProps {
  campaignId: string;
  isOwner: boolean;
  currentUser: User | null;
  campaignOwnerId: string;
}

export function CampaignParticipantsList({
  campaignId,
  isOwner,
  currentUser,
  campaignOwnerId,
}: CampaignParticipantsListProps) {
  const queryClient = useQueryClient();

  const { data: participantsData, isLoading } = useQuery({
    queryKey: ["campaignParticipants", campaignId],
    queryFn: () => getCampaignParticipants({ data: { id: campaignId } }),
    enabled: !!campaignId,
  });

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
  );
}
