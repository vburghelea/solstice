import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateGameParticipant } from "~/features/games/games.mutations";
import { GameParticipant } from "~/features/games/games.types";
import { Button } from "~/shared/ui/button";

interface ManageApplicationsProps {
  gameId: string;
  applications: GameParticipant[];
}

export function ManageApplications({ gameId, applications }: ManageApplicationsProps) {
  const queryClient = useQueryClient();

  const updateParticipantMutation = useMutation({
    mutationFn: updateGameParticipant,
    onSuccess: () => {
      toast.success("Participant status updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["gameApplications", gameId] });
      queryClient.invalidateQueries({ queryKey: ["gameDetails", gameId] });
    },
    onError: (error) => {
      toast.error(`Failed to update participant status: ${error.message}`);
    },
  });

  const handleApprove = (participantId: string) => {
    updateParticipantMutation.mutate({
      data: {
        id: participantId,
        status: "approved",
        role: "player", // Change role to player upon approval
      },
    });
  };

  const handleReject = (participantId: string) => {
    updateParticipantMutation.mutate({
      data: {
        id: participantId,
        status: "rejected",
      },
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Manage Applications</h3>

      {applications.length === 0 ? (
        <p className="text-muted-foreground text-sm">No pending applications.</p>
      ) : (
        <ul className="bg-background max-h-60 overflow-y-auto rounded-md border p-2">
          {applications.map((app) => (
            <li
              key={app.id}
              className="flex items-center justify-between border-b py-2 last:border-b-0"
            >
              <span>
                {app.user?.name || app.user?.email} (Applicant - {app.status})
                {app.message && (
                  <p className="text-muted-foreground mt-1 text-xs">
                    Message: {app.message}
                  </p>
                )}
              </span>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleApprove(app.id)}
                  disabled={updateParticipantMutation.isPending}
                >
                  {updateParticipantMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    "Approve"
                  )}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleReject(app.id)}
                  disabled={updateParticipantMutation.isPending}
                >
                  {updateParticipantMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    "Reject"
                  )}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
