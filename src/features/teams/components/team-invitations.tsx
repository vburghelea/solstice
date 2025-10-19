import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { acceptTeamInvite, declineTeamInvite } from "~/features/teams/teams.mutations";
import type { PendingTeamInvite } from "~/features/teams/teams.queries";
import { useTeamsTranslation } from "~/hooks/useTypedTranslation";
import { formatDistanceToNowLocalized } from "~/lib/i18n/utils";
import { cn } from "~/shared/lib/utils";

export interface TeamInvitationsSectionProps {
  invites: PendingTeamInvite[];
}

export function TeamInvitationsSection({ invites }: TeamInvitationsSectionProps) {
  const { t, currentLanguage } = useTeamsTranslation();
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const queryClient = useQueryClient();

  const acceptInviteMutation = useMutation({
    mutationFn: async (teamId: string) => acceptTeamInvite({ data: { teamId } }),
    onMutate: async (teamId: string) => {
      await queryClient.cancelQueries({ queryKey: ["pendingTeamInvites"] });
      const previousInvites = queryClient.getQueryData<PendingTeamInvite[]>([
        "pendingTeamInvites",
      ]);
      queryClient.setQueryData<PendingTeamInvite[]>(
        ["pendingTeamInvites"],
        (current = []) => current.filter((invite) => invite.membership.teamId !== teamId),
      );

      return { previousInvites, teamId };
    },
    onSuccess: () => {
      setFeedback({ type: "success", message: t("invitations.accepted") });
    },
    onError: (error, _teamId, context) => {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : t("errors.accept_failed"),
      });
      if (context?.previousInvites) {
        queryClient.setQueryData(["pendingTeamInvites"], context.previousInvites);
      }
    },
    onSettled: (_, __, teamId) => {
      invalidateTeamQueries(teamId ?? "");
    },
  });

  const declineInviteMutation = useMutation({
    mutationFn: async (teamId: string) => declineTeamInvite({ data: { teamId } }),
    onMutate: async (teamId: string) => {
      await queryClient.cancelQueries({ queryKey: ["pendingTeamInvites"] });
      const previousInvites = queryClient.getQueryData<PendingTeamInvite[]>([
        "pendingTeamInvites",
      ]);
      queryClient.setQueryData<PendingTeamInvite[]>(
        ["pendingTeamInvites"],
        (current = []) => current.filter((invite) => invite.membership.teamId !== teamId),
      );

      return { previousInvites, teamId };
    },
    onSuccess: () => {
      setFeedback({ type: "success", message: t("invitations.declined") });
    },
    onError: (error, _teamId, context) => {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : t("errors.decline_failed"),
      });
      if (context?.previousInvites) {
        queryClient.setQueryData(["pendingTeamInvites"], context.previousInvites);
      }
    },
    onSettled: (_, __, teamId) => {
      invalidateTeamQueries(teamId ?? "");
    },
  });

  function invalidateTeamQueries(teamId: string) {
    queryClient.invalidateQueries({ queryKey: ["pendingTeamInvites"] });
    queryClient.invalidateQueries({ queryKey: ["user-teams"] });
    queryClient.invalidateQueries({ queryKey: ["teamMembers", teamId] });
  }

  if (invites.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl">{t("invitations.title")}</CardTitle>
        <Badge variant="secondary" className="tracking-wide uppercase">
          {t("invitations.badge", { count: invites.length })}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {feedback && (
          <div
            className={cn(
              "rounded-md border px-3 py-2 text-sm",
              feedback.type === "error"
                ? "border-destructive/40 bg-destructive/10 text-destructive"
                : "border-primary/40 bg-primary/5 text-primary",
            )}
          >
            {feedback.message}
          </div>
        )}

        {invites.map((invite) => {
          const invitedAt = invite.membership.invitedAt
            ? new Date(invite.membership.invitedAt)
            : undefined;
          const requestedAt = invite.membership.requestedAt
            ? new Date(invite.membership.requestedAt)
            : undefined;

          const activityTimestamp = invitedAt || requestedAt;
          const activityLabel = invitedAt
            ? t("invitations.sent")
            : requestedAt
              ? t("invitations.request_created")
              : null;

          const isProcessing =
            acceptInviteMutation.isPending || declineInviteMutation.isPending;

          return (
            <Card key={invite.membership.id} className="border-muted bg-muted/20">
              <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">{invite.team.name}</h3>
                    <Badge variant="outline" className="capitalize">
                      {invite.membership.role}
                    </Badge>
                  </div>
                  {activityTimestamp && activityLabel && (
                    <p className="text-muted-foreground mt-1 text-sm">
                      {activityLabel}{" "}
                      {formatDistanceToNowLocalized(activityTimestamp, currentLanguage, {
                        addSuffix: true,
                      })}
                    </p>
                  )}
                  {invite.inviter?.name && (
                    <p className="text-muted-foreground mt-2 text-sm">
                      {t("invitations.invited_by", { name: invite.inviter.name })}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2 md:flex-row">
                  <Button
                    variant="default"
                    onClick={() =>
                      void acceptInviteMutation.mutateAsync(invite.membership.teamId)
                    }
                    disabled={isProcessing}
                  >
                    {acceptInviteMutation.isPending
                      ? t("invitations.accepting")
                      : t("invitations.accept")}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      void declineInviteMutation.mutateAsync(invite.membership.teamId)
                    }
                    disabled={isProcessing}
                  >
                    {declineInviteMutation.isPending
                      ? t("invitations.declining")
                      : t("invitations.decline")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </CardContent>
    </Card>
  );
}

export default TeamInvitationsSection;
