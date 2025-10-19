import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import type { ChangeEvent } from "react";
import { useState } from "react";
import { toast } from "sonner";
import { inviteToGame, removeGameParticipant } from "~/features/games/games.mutations";
import { searchUsersForInvitation } from "~/features/games/games.queries";
import type { GameParticipant } from "~/features/games/games.types";
import { useRateLimitedServerFn } from "~/lib/pacer";
import { useDebounce } from "~/shared/hooks/useDebounce";
import type { OperationResult } from "~/shared/types/common";

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
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useGamesTranslation } from "~/hooks/useTypedTranslation";

interface InviteParticipantsProps {
  gameId: string;
  currentParticipants: GameParticipant[];
}

export function InviteParticipants({
  gameId,
  currentParticipants,
}: InviteParticipantsProps) {
  const { t } = useGamesTranslation();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [emailInvite, setEmailInvite] = useState("");
  const [inviteeName, setInviteeName] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const { data: searchResults, isLoading: isSearchingUsers } = useQuery({
    queryKey: ["searchUsers", debouncedSearchTerm],
    queryFn: () => searchUsersForInvitation({ data: { query: debouncedSearchTerm } }),
    enabled: debouncedSearchTerm.length >= 4,
  });

  const rlInviteToGame = useRateLimitedServerFn(inviteToGame, {
    type: "social",
  });

  const inviteMutation = useMutation({
    mutationFn: rlInviteToGame,
    onSuccess: () => {
      toast.success(t("messages.participant_invited_success"));
      setSearchTerm("");
      setEmailInvite("");
      setInviteeName("");
      queryClient.invalidateQueries({ queryKey: ["game", gameId] });
    },
    onError: (error) => {
      toast.error(`${t("errors.failed_to_invite_participant")}: ${error.message}`);
    },
  });

  const revokeMutation = useMutation<
    OperationResult<boolean>,
    Error,
    { data: { id: string } }
  >({
    mutationFn: removeGameParticipant,
    onSuccess: () => {
      toast.success(t("messages.invitation_revoked_success"));
      queryClient.invalidateQueries({ queryKey: ["gameDetails", gameId] });
      queryClient.invalidateQueries({ queryKey: ["gameApplications", gameId] });
      queryClient.invalidateQueries({ queryKey: ["gameParticipants", gameId] }); // Invalidate participants list
    },
    onError: (error) => {
      toast.error(`${t("errors.failed_to_revoke_invitation")}: ${error.message}`);
    },
  });

  const handleInviteUser = (userId: string) => {
    inviteMutation.mutate({ data: { gameId, userId, role: "invited" } });
  };

  const handleInviteEmail = () => {
    if (emailInvite.length > 0 && inviteeName.length > 0) {
      inviteMutation.mutate({
        data: { gameId, email: emailInvite, name: inviteeName, role: "invited" },
      });
    }
  };

  const handleRevokeInvitation = (participantId: string) => {
    revokeMutation.mutate({ data: { id: participantId } });
  };

  const pendingInvites = currentParticipants.filter(
    (p) => p.role === "invited" && p.status === "pending",
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("titles.invite_participants")}</CardTitle>
        <CardDescription>{t("descriptions.invite_participants")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="user-search">{t("labels.search_users")}</Label>
          <Input
            id="user-search"
            placeholder={t("placeholders.search_users")}
            value={searchTerm}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setSearchTerm(event.target.value)
            }
          />
          {isSearchingUsers && debouncedSearchTerm.length >= 4 && (
            <p className="text-muted-foreground flex items-center text-sm">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("status.searching")}
            </p>
          )}
          {searchResults?.success && searchResults.data.length > 0 && (
            <div className="bg-popover mt-2 max-h-48 overflow-y-auto rounded-md border p-2 shadow-md">
              {searchResults.data
                .filter(
                  (user) =>
                    !currentParticipants.some(
                      (participant) => participant.userId === user.id,
                    ),
                )
                .map((user) => (
                  <div
                    key={user.id}
                    className="hover:bg-accent flex items-center justify-between rounded-sm p-2"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar
                        name={user.name}
                        email={user.email}
                        srcUploaded={
                          (user as { uploadedAvatarPath?: string | null })
                            .uploadedAvatarPath ?? null
                        }
                        srcProvider={(user as { image?: string | null }).image ?? null}
                        userId={user.id}
                        className="h-8 w-8"
                      />
                      <ProfileLink userId={user.id} username={user.name || user.email} />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleInviteUser(user.id)}
                      disabled={inviteMutation.isPending}
                    >
                      {t("buttons.invite")}
                    </Button>
                  </div>
                ))}
            </div>
          )}
          {searchResults?.success &&
            searchResults.data.length === 0 &&
            debouncedSearchTerm.length >= 4 &&
            !isSearchingUsers && (
              <p className="text-muted-foreground mt-2 text-sm">
                {t("status.no_users_found")}
              </p>
            )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email-invite">{t("labels.invite_by_email")}</Label>
          <div className="space-y-2">
            <Input
              id="invitee-name"
              placeholder={t("placeholders.enter_name")}
              value={inviteeName}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setInviteeName(event.target.value)
              }
            />
            <Input
              id="email-invite"
              type="email"
              placeholder={t("placeholders.enter_email")}
              value={emailInvite}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setEmailInvite(event.target.value)
              }
            />
            <Button
              onClick={handleInviteEmail}
              disabled={
                inviteMutation.isPending ||
                emailInvite.length === 0 ||
                inviteeName.length === 0
              }
            >
              {inviteMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                t("buttons.invite")
              )}
            </Button>
          </div>
        </div>

        {pendingInvites.length > 0 && (
          <div className="space-y-3">
            <Label>{t("labels.pending_invitations")}</Label>
            <div className="space-y-2">
              {pendingInvites.map((participant) => {
                const participantName =
                  participant.user?.name ??
                  participant.user?.email ??
                  t("labels.pending_participant");

                return (
                  <div
                    key={participant.id}
                    className="border-border flex items-center justify-between rounded-md border p-3"
                  >
                    <div>
                      <p className="font-medium">{participantName}</p>
                      {participant.user?.email ? (
                        <p className="text-muted-foreground text-xs">
                          {participant.user.email}
                        </p>
                      ) : null}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRevokeInvitation(participant.id)}
                      disabled={revokeMutation.isPending}
                    >
                      {revokeMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      {t("buttons.revoke")}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
