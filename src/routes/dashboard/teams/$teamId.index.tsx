import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { TypedLink as Link } from "~/components/ui/TypedLink";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  ArrowLeftIcon,
  CalendarIcon,
  LinkIcon,
  MapPinIcon,
  UsersIcon,
} from "~/components/ui/icons";
import { useAuth } from "~/features/auth";
import { requestTeamMembership } from "~/features/teams/teams.mutations";
import { getTeam, getTeamMembers } from "~/features/teams/teams.queries";

export const Route = createFileRoute("/dashboard/teams/$teamId/")({
  component: TeamDetailsPage,
});

function TeamDetailsPage() {
  const { teamId } = Route.useParams();

  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [requestState, setRequestState] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const { data: teamData } = useSuspenseQuery({
    queryKey: ["team", teamId],
    queryFn: async () => getTeam({ data: { teamId } }),
    // Don't pass stale data - let React Query fetch fresh data when invalidated
    // This ensures updates are reflected immediately after navigation
  });

  const { data: members } = useSuspenseQuery({
    queryKey: ["teamMembers", teamId],
    queryFn: async () => getTeamMembers({ data: { teamId } }),
    // Don't pass stale data - let React Query fetch fresh data when invalidated
  });

  const membershipRecord = members.find((member) => member.user.id === user?.id);
  const membershipStatus = membershipRecord?.member.status;
  const isActiveMember = membershipStatus === "active";
  const pendingInviteFromTeam =
    membershipStatus === "pending" && Boolean(membershipRecord?.invitedBy?.id);
  const pendingJoinRequest =
    membershipStatus === "pending" && !membershipRecord?.invitedBy?.id;

  const requestMembershipMutation = useMutation({
    mutationFn: () => requestTeamMembership({ data: { teamId } }),
    onSuccess: () => {
      setRequestState({
        type: "success",
        message: "Join request sent to the team captains.",
      });
      queryClient.invalidateQueries({ queryKey: ["pendingTeamInvites"] });
      queryClient.invalidateQueries({ queryKey: ["teamMembers", teamId] });
      queryClient.invalidateQueries({ queryKey: ["userTeams"] });
    },
    onError: (error) => {
      setRequestState({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to send join request right now.",
      });
    },
  });

  const handleRequestToJoin = () => {
    setRequestState(null);
    requestMembershipMutation.mutate();
  };

  if (!teamData) {
    return <div>Team not found</div>;
  }

  const { team, memberCount } = teamData;

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/dashboard/teams">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Teams
          </Link>
        </Button>
      </div>

      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">{team.name}</h1>
            {team.city && (
              <p className="text-muted-foreground mt-1 flex items-center">
                <MapPinIcon className="mr-1 h-4 w-4" />
                {team.city}
                {team.province ? `, ${team.province}` : ""}
              </p>
            )}
          </div>
          {team.primaryColor && (
            <div className="flex gap-2">
              <div
                className="h-12 w-12 rounded-full border"
                style={{ backgroundColor: team.primaryColor }}
              />
              {team.secondaryColor && (
                <div
                  className="h-12 w-12 rounded-full border"
                  style={{ backgroundColor: team.secondaryColor }}
                />
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              {team.description ? (
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {team.description}
                </p>
              ) : (
                <p className="text-muted-foreground italic">No description provided</p>
              )}

              <div className="mt-4 space-y-2">
                {team.foundedYear && (
                  <div className="flex items-center text-sm">
                    <CalendarIcon className="text-muted-foreground mr-2 h-4 w-4" />
                    Founded in {team.foundedYear}
                  </div>
                )}
                {team.website && (
                  <div className="flex items-center text-sm">
                    <LinkIcon className="text-muted-foreground mr-2 h-4 w-4" />
                    <a
                      href={team.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {team.website}
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Members
                <Badge variant="secondary">{memberCount}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {members.map(({ member, user }) => (
                  <div key={member.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={user.image || undefined}
                          alt={user.name || ""}
                        />
                        <AvatarFallback>
                          {user.name
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase() || "??"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.name || user.email}</p>
                        <div className="text-muted-foreground flex items-center gap-2 text-sm">
                          <Badge variant="outline" className="capitalize">
                            {member.role}
                          </Badge>
                          {member.status === "pending" && (
                            <Badge variant="secondary">Pending</Badge>
                          )}
                          {member.jerseyNumber && <span>#{member.jerseyNumber}</span>}
                          {member.position && <span>{member.position}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="text-muted-foreground text-sm">
                      {member.status === "pending"
                        ? member.invitedAt
                          ? `Invited ${new Date(member.invitedAt).toLocaleDateString()}`
                          : member.requestedAt
                            ? `Requested ${new Date(member.requestedAt).toLocaleDateString()}`
                            : "Pending"
                        : `Joined ${new Date(member.joinedAt).toLocaleDateString()}`}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-muted-foreground text-sm">Total Members</p>
                  <p className="text-2xl font-bold">{memberCount}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Status</p>
                  <Badge variant={team.isActive === "true" ? "default" : "secondary"}>
                    {team.isActive === "true" ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Created</p>
                  <p className="text-sm">
                    {new Date(team.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {requestState && (
                <div
                  className={
                    requestState.type === "success"
                      ? "border-primary/40 bg-primary/5 text-primary rounded-md border px-3 py-2 text-sm"
                      : "border-destructive/40 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm"
                  }
                >
                  {requestState.message}
                </div>
              )}

              {isActiveMember ? (
                <Button className="w-full" variant="outline" asChild>
                  <Link to="/dashboard/teams/$teamId/members" params={{ teamId }}>
                    <UsersIcon className="mr-2 h-4 w-4" />
                    Manage Members
                  </Link>
                </Button>
              ) : pendingInviteFromTeam ? (
                <div className="text-muted-foreground text-sm">
                  You have a pending invitation for this team. Visit the Teams dashboard
                  to accept or decline.
                </div>
              ) : pendingJoinRequest ? (
                <div className="text-muted-foreground text-sm">
                  Your join request is awaiting approval from the team captains.
                </div>
              ) : user ? (
                <Button
                  className="w-full"
                  onClick={handleRequestToJoin}
                  disabled={requestMembershipMutation.isPending}
                >
                  {requestMembershipMutation.isPending
                    ? "Sending request..."
                    : "Ask to Join"}
                </Button>
              ) : null}

              <Button asChild variant="outline" className="w-full">
                <Link to="/dashboard/teams/browse">Browse Teams</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
