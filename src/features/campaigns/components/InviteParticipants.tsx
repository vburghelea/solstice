import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import type { ChangeEvent } from "react";
import { useState } from "react";
import { toast } from "sonner";
import { inviteToCampaign } from "~/features/campaigns/campaigns.mutations";
import { CampaignParticipant } from "~/features/campaigns/campaigns.types";
import { searchUsersForInvitation } from "~/features/games/games.queries"; // Re-using games query for user search
import { useRateLimitedServerFn } from "~/lib/pacer";
import { useDebounce } from "~/shared/hooks/useDebounce";

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

interface InviteParticipantsProps {
  campaignId: string;
  currentParticipants: CampaignParticipant[];
}

export function InviteParticipants({
  campaignId,
  currentParticipants,
}: InviteParticipantsProps) {
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

  const rlInviteToCampaign = useRateLimitedServerFn(inviteToCampaign, {
    type: "social",
  });

  const inviteMutation = useMutation({
    mutationFn: rlInviteToCampaign,
    onSuccess: () => {
      toast.success("Participant invited successfully!");
      setSearchTerm("");
      setEmailInvite("");
      setInviteeName("");
      queryClient.invalidateQueries({ queryKey: ["campaign", campaignId] });
      queryClient.invalidateQueries({ queryKey: ["campaignParticipants", campaignId] });
    },
    onError: (error) => {
      toast.error(`Failed to invite participant: ${error.message}`);
    },
  });

  const handleInviteUser = (userId: string) => {
    inviteMutation.mutate({ data: { campaignId, userId, role: "invited" } });
  };

  const handleInviteEmail = () => {
    if (emailInvite.length > 0 && inviteeName.length > 0) {
      inviteMutation.mutate({
        data: { campaignId, email: emailInvite, name: inviteeName, role: "invited" },
      });
    }
  };

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
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setSearchTerm(event.target.value)
            }
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
          <div className="space-y-2">
            <Input
              id="invitee-name"
              placeholder="Enter name"
              value={inviteeName}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setInviteeName(event.target.value)
              }
            />
            <Input
              id="email-invite"
              type="email"
              placeholder="Enter email address"
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
                "Invite"
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
