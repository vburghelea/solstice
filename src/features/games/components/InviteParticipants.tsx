import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { inviteToGame } from "~/features/games/games.mutations";
import { searchUsersForInvitation } from "~/features/games/games.queries";
import { GameParticipant } from "~/features/games/games.types";
import type { User } from "~/lib/auth/types";
import { useDebounce } from "~/shared/hooks/useDebounce";
import { Button } from "~/shared/ui/button";
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
    },
    onError: (error) => {
      toast.error(`Failed to invite participant: ${error.message}`);
    },
  });

  const handleInviteUser = (userId: string) => {
    inviteMutation.mutate({ data: { gameId, userId } });
  };

  const handleInviteEmail = () => {
    if (emailInvite.length > 0) {
      inviteMutation.mutate({ data: { gameId, email: emailInvite } });
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Invite Participants</h3>

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
            {searchResults.data.map((user) => (
              <div
                key={user.id}
                className="hover:bg-accent flex items-center justify-between rounded-sm p-2"
              >
                <span>{(user as User).name || (user as User).email}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleInviteUser((user as User).id)}
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
        <h4 className="font-semibold">Current Participants</h4>
        {currentParticipants.length === 0 ? (
          <p className="text-muted-foreground text-sm">No participants yet.</p>
        ) : (
          <ul className="bg-background max-h-48 overflow-y-auto rounded-md border p-2">
            {currentParticipants.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-1">
                <span>
                  {p.user?.name || p.user?.email} ({p.role} - {p.status})
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
