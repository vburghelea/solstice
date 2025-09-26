import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ProfileLink } from "~/components/ProfileLink";
import { Avatar } from "~/components/ui/avatar";
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
import { TypedLink as Link } from "~/components/ui/TypedLink";
import { useAuth } from "~/features/auth";
import { requestTeamMembership } from "~/features/teams/teams.mutations";
import {
  getTeam,
  getTeamMembers,
  getViewerTeamMembership,
  type ViewerTeamMembership,
} from "~/features/teams/teams.queries";
import { unwrapServerFnResult } from "~/lib/server/fn-utils";

export const Route = createFileRoute("/dashboard/teams/$teamId/")({
  component: TeamDetailsPage,
  loader: async ({ params }) => {
    const [team, members, membership] = await Promise.all([
      getTeam({ data: { teamId: params.teamId } }),
      getTeamMembers({ data: { teamId: params.teamId } }),
      getViewerTeamMembership({ data: { teamId: params.teamId } }),
    ]);

    if (!team) {
      throw new Error("Team not found");
    }

    return { team, members, membership };
  },
});

function TeamDetailsPage() {
  const { teamId } = Route.useParams();

  const {
    team: teamData,
    members: initialMembers,
    membership: initialMembership,
  } = Route.useLoaderData() as {
    team: NonNullable<Awaited<ReturnType<typeof getTeam>>>;
    members: Awaited<ReturnType<typeof getTeamMembers>>;
    membership: ViewerTeamMembership | null;
  };

  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [requestState, setRequestState] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const { data: teamQueryData } = useSuspenseQuery<NonNullable<
    Awaited<ReturnType<typeof getTeam>>
  > | null>({
    queryKey: ["team", teamId],
    queryFn: async () => getTeam({ data: { teamId } }),
    initialData: teamData,
  });

  const { data: members } = useSuspenseQuery<Awaited<ReturnType<typeof getTeamMembers>>>({
    queryKey: ["teamMembers", teamId],
    queryFn: async () => getTeamMembers({ data: { teamId } }),
    initialData: initialMembers,
  });

  const { data: viewerMembership } = useSuspenseQuery<ViewerTeamMembership | null>({
    queryKey: ["teamMembership", teamId, user?.id ?? "anonymous"],
    queryFn: async () => getViewerTeamMembership({ data: { teamId } }),
    initialData: initialMembership,
  });

  useEffect(() => {
    const key = ["teamMembership", teamId, user?.id ?? "anonymous"] as const;
    queryClient.invalidateQueries({ queryKey: key, exact: true });
  }, [teamId, user?.id, queryClient]);

  const viewerMemberEntry = user
    ? members.find((member) => member.user.id === user.id)
    : undefined;

  const resolvedStatus = viewerMemberEntry?.member.status ?? viewerMembership?.status;
  const resolvedRole = viewerMemberEntry?.member.role ?? viewerMembership?.role;
  const resolvedInvitedBy = viewerMemberEntry?.invitedBy?.id
    ? viewerMemberEntry.invitedBy
    : viewerMembership?.invitedBy
      ? { id: viewerMembership.invitedBy }
      : undefined;
  const resolvedDecisionAt =
    viewerMemberEntry?.member.decisionAt ?? viewerMembership?.decisionAt ?? null;

  const isActiveMember = resolvedStatus === "active";
  const pendingInviteFromTeam =
    resolvedStatus === "pending" && Boolean(resolvedInvitedBy);
  const pendingJoinRequest = resolvedStatus === "pending" && !resolvedInvitedBy;
  const canManageTeam =
    isActiveMember && ["captain", "coach"].includes(resolvedRole ?? "");
  const canRequestJoin =
    Boolean(user) && !isActiveMember && !pendingInviteFromTeam && !pendingJoinRequest;
  const wasDeclined = resolvedStatus === "declined";
  const declinedAt = useMemo(
    () => (resolvedDecisionAt ? new Date(resolvedDecisionAt) : null),
    [resolvedDecisionAt],
  );

  useEffect(() => {
    // Temporary debug log requested to inspect membership gating.
    console.debug("[TeamQuickActions] membership state", {
      userId: user?.id ?? "anonymous",
      teamId,
      viewerMembership,
      rosterDerived: viewerMemberEntry?.member ?? null,
      resolvedStatus,
      resolvedRole,
      canManageTeam,
      pendingInviteFromTeam,
      pendingJoinRequest,
      canRequestJoin,
      wasDeclined,
      declinedAt,
    });
  }, [
    user?.id,
    teamId,
    viewerMembership,
    viewerMemberEntry?.member,
    resolvedStatus,
    resolvedRole,
    canManageTeam,
    pendingInviteFromTeam,
    pendingJoinRequest,
    canRequestJoin,
    wasDeclined,
    resolvedDecisionAt,
    declinedAt,
  ]);

  const requestMembershipMutation = useMutation({
    mutationFn: () => unwrapServerFnResult(requestTeamMembership({ data: { teamId } })),
    onSuccess: () => {
      setRequestState({
        type: "success",
        message: "Join request sent to the team captains.",
      });
      queryClient.invalidateQueries({ queryKey: ["pendingTeamInvites"] });
      queryClient.invalidateQueries({ queryKey: ["teamMembers", teamId] });
      queryClient.invalidateQueries({ queryKey: ["userTeams"] });
      queryClient.invalidateQueries({
        queryKey: ["teamMembership", teamId, user?.id ?? "anonymous"],
      });
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

  if (!teamQueryData) {
    return <div>Team not found</div>;
  }

  const { team, memberCount } = teamQueryData;

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
            <h1 className="text-foreground text-3xl font-bold">{team.name}</h1>
            {team.city && (
              <p className="text-muted-foreground mt-1 flex items-center">
                <MapPinIcon className="mr-1 h-4 w-4" />
                {team.city}
                {team.country ? `, ${team.country}` : ""}
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
              <CardTitle className="text-foreground">About</CardTitle>
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
              <CardTitle className="text-foreground flex items-center justify-between">
                Members
                <Badge variant="secondary">{memberCount}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {members.map(({ member, user }) => (
                  <div key={member.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar
                        className="h-10 w-10"
                        name={user.name ?? null}
                        email={user.email ?? null}
                        srcUploaded={user.uploadedAvatarPath ?? null}
                        srcProvider={user.image ?? null}
                        userId={user.id}
                      />
                      <div>
                        <ProfileLink
                          userId={user.id}
                          username={user.name || user.email}
                        />
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
              <CardTitle className="text-foreground">Team Stats</CardTitle>
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
              <CardTitle className="text-foreground">Quick Actions</CardTitle>
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

              {canManageTeam ? (
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
              ) : canRequestJoin ? (
                <div className="space-y-2">
                  {wasDeclined && (
                    <div className="text-muted-foreground text-sm">
                      {`Your previous join request was declined${declinedAt ? ` on ${declinedAt.toLocaleDateString()}` : ""}. You can submit another request.`}
                    </div>
                  )}
                  <Button
                    className="w-full"
                    onClick={handleRequestToJoin}
                    disabled={requestMembershipMutation.isPending}
                  >
                    {requestMembershipMutation.isPending
                      ? "Sending request..."
                      : wasDeclined
                        ? "Request Again"
                        : "Ask to Join"}
                  </Button>
                </div>
              ) : user ? (
                <div className="text-muted-foreground text-sm">
                  You do not currently have permissions to manage or request changes for
                  this team.
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-muted-foreground text-sm">
                    Sign in to request a spot on this team.
                  </div>
                  <Button className="w-full" variant="outline" asChild>
                    <Link to="/auth/login">Sign In</Link>
                  </Button>
                </div>
              )}

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
