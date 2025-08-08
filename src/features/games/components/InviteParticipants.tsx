import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { inviteToGame, removeGameParticipant } from "~/features/games/games.mutations";
import { searchUsersForInvitation } from "~/features/games/games.queries";
import type { GameParticipant } from "~/features/games/games.types";
import { useDebounce } from "~/shared/hooks/useDebounce";
import { OperationResult } from "~/shared/types/common";
import { Button } from "~/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/shared/ui/card";
import { Input } from "~/shared/ui/input";
import { Label } from "~/shared/ui/label";

interface InviteParticipantsProps {
  gameId: string;
  currentParticipants: GameParticipant[];
}

export function InviteParticipants({
  gameId,
  currentParticipants,
}: InviteParticipantsProps) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [emailInvite, setEmailInvite] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const { data: searchResults, isLoading: isSearchingUsers } = useQuery({
    queryKey: ["searchUsers", debouncedSearchTerm],
    queryFn: () => searchUsersForInvitation({ data: { query: debouncedSearchTerm } }),
    enabled: debouncedSearchTerm.length >= 4,
  });

  const inviteMutation = useMutation({
    mutationFn: inviteToGame,
    onSuccess: () => {
      toast.success("Participant invited successfully!");
      setSearchTerm("");
      setEmailInvite("");
      queryClient.invalidateQueries({ queryKey: ["gameDetails", gameId] });
      queryClient.invalidateQueries({ queryKey: ["gameApplications", gameId] });
      queryClient.invalidateQueries({ queryKey: ["gameParticipants", gameId] }); // Invalidate participants list
    },
    onError: (error) => {
      toast.error(`Failed to invite participant: ${error.message}`);
    },
  });

  const revokeMutation = useMutation<
    OperationResult<boolean>,
    Error,
    { data: { id: string } }
  >({
    mutationFn: removeGameParticipant,
    onSuccess: () => {
      toast.success("Invitation revoked successfully!");
      queryClient.invalidateQueries({ queryKey: ["gameDetails", gameId] });
      queryClient.invalidateQueries({ queryKey: ["gameApplications", gameId] });
      queryClient.invalidateQueries({ queryKey: ["gameParticipants", gameId] }); // Invalidate participants list
    },
    onError: (error) => {
      toast.error(`Failed to revoke invitation: ${error.message}`);
    },
  });

  const handleInviteUser = (userId: string) => {
    inviteMutation.mutate({ data: { gameId, userId, role: "invited" } });
  };

  const handleInviteEmail = () => {
    if (emailInvite.length > 0) {
      inviteMutation.mutate({ data: { gameId, email: emailInvite, role: "invited" } });
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
        <CardTitle>Invite Participants</CardTitle>
        <CardDescription>Search for users or invite them by email.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="user-search">Search Users</Label>
          <Input
            id="user-search"
            placeholder="Search by name or email (4+ chars)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {isSearchingUsers && debouncedSearchTerm.length >= 4 && (
            <p className="text-muted-foreground flex items-center text-sm">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Searching...
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
                    <span>{user.name || user.email}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleInviteUser(user.id)}
                      disabled={inviteMutation.isPending}
                    >
                      Invite
                    </Button>
                  </div>
                ))}
            </div>
          )}
          {searchResults?.success &&
            searchResults.data.length === 0 &&
            debouncedSearchTerm.length >= 4 &&
            !isSearchingUsers && (
              <p className="text-muted-foreground mt-2 text-sm">No users found.</p>
            )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email-invite">Invite by Email</Label>
          <div className="flex space-x-2">
            <Input
              id="email-invite"
              type="email"
              placeholder="Enter email address"
              value={emailInvite}
              onChange={(e) => setEmailInvite(e.target.value)}
            />
            <Button
              onClick={handleInviteEmail}
              disabled={inviteMutation.isPending || emailInvite.length === 0}
            >
              {inviteMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Invite"
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold">Pending Invitations</h4>
          {pendingInvites.length === 0 ? (
            <p className="text-muted-foreground text-sm">No pending invitations.</p>
          ) : (
            <ul className="bg-background max-h-48 overflow-y-auto rounded-md border p-2">
              {pendingInvites.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-1">
                  <span>{p.user?.name || p.user?.email}</span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRevokeInvitation(p.id)}
                    disabled={revokeMutation.isPending}
                  >
                    {revokeMutation.isPending &&
                    revokeMutation.variables?.data.id === p.id
                      ? "Revoking..."
                      : "Revoke"}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
