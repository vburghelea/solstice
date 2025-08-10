import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { respondToGameApplication } from "~/features/games/games.mutations"; // Import respondToGameApplication
import { GameApplication } from "~/features/games/games.types";
import { Button } from "~/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/shared/ui/card";

interface ManageApplicationsProps {
  gameId: string;
  applications: GameApplication[];
}

export function ManageApplications({ gameId, applications }: ManageApplicationsProps) {
  const queryClient = useQueryClient();

  const respondToApplicationMutation = useMutation({
    mutationFn: respondToGameApplication,
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Application status updated successfully!");
        queryClient.invalidateQueries({ queryKey: ["gameApplications", gameId] });
        queryClient.invalidateQueries({ queryKey: ["gameDetails", gameId] });
      } else {
        toast.error(data.errors?.[0]?.message || "Failed to update application status");
      }
    },
    onError: (error) => {
      toast.error(`Failed to update application status: ${error.message}`);
    },
  });

  const handleApprove = (applicationId: string) => {
    respondToApplicationMutation.mutate({
      data: {
        applicationId: applicationId,
        status: "approved",
      },
    });
  };

  const handleReject = (applicationId: string) => {
    respondToApplicationMutation.mutate({
      data: {
        applicationId: applicationId,
        status: "rejected",
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Applications</CardTitle>
        <CardDescription>Review and process player applications.</CardDescription>
      </CardHeader>
      <CardContent>
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
                </span>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleApprove(app.id)}
                    disabled={respondToApplicationMutation.isPending}
                  >
                    {respondToApplicationMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      "Approve"
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleReject(app.id)}
                    disabled={respondToApplicationMutation.isPending}
                  >
                    {respondToApplicationMutation.isPending ? (
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
      </CardContent>
    </Card>
  );
}
