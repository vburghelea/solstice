import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { TypedLink as Link } from "~/components/ui/TypedLink";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { PlusIcon, UsersIcon } from "~/components/ui/icons";
import { TeamInvitationsSection } from "~/features/teams/components/team-invitations";
import type { PendingTeamInvite, UserTeam } from "~/features/teams/teams.queries";
import { getPendingTeamInvites, getUserTeams } from "~/features/teams/teams.queries";

export const Route = createFileRoute("/dashboard/teams/")({
  loader: async () => {
    const userTeams = (await getUserTeams()) as UserTeam[];
    const pendingInvites = (await getPendingTeamInvites()) as PendingTeamInvite[];
    return { userTeams, pendingInvites };
  },
  component: TeamsIndexPage,
});

function TeamsIndexPage() {
  const loaderData = Route.useLoaderData() as {
    userTeams: UserTeam[];
    pendingInvites: PendingTeamInvite[];
  };
  const initialTeams = loaderData.userTeams as UserTeam[];
  const initialInvites = loaderData.pendingInvites as PendingTeamInvite[];

  const { data: userTeams } = useSuspenseQuery<UserTeam[]>({
    queryKey: ["userTeams"],
    queryFn: async () => getUserTeams() as Promise<UserTeam[]>,
    initialData: () => initialTeams,
  });

  const { data: pendingInvites } = useSuspenseQuery<PendingTeamInvite[]>({
    queryKey: ["pendingTeamInvites"],
    queryFn: async () => getPendingTeamInvites() as Promise<PendingTeamInvite[]>,
    initialData: () => initialInvites,
  });

  const pendingCount = pendingInvites.length;

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">My Teams</h1>
            {pendingCount > 0 && (
              <Badge variant="secondary" className="text-xs uppercase">
                {pendingCount} pending invite{pendingCount > 1 ? "s" : ""}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">Manage your teams and memberships</p>
        </div>
        <Button asChild>
          <Link to="/dashboard/teams/create">
            <PlusIcon className="mr-2 h-4 w-4" />
            Create Team
          </Link>
        </Button>
      </div>

      <div className="space-y-6">
        {pendingCount > 0 && <TeamInvitationsSection invites={pendingInvites} />}

        {userTeams.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <UsersIcon className="text-muted-foreground mb-4 h-12 w-12" />
              <h3 className="mb-2 text-lg font-semibold">No teams yet</h3>
              <p className="text-muted-foreground mb-4 text-center">
                Join an existing team or create your own to get started
              </p>
              <div className="flex gap-4">
                <Button asChild variant="outline">
                  <Link to="/dashboard/teams/browse">Browse Teams</Link>
                </Button>
                <Button asChild>
                  <Link to="/dashboard/teams/create">
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Create Team
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-4 flex justify-end">
              <Button asChild variant="outline">
                <Link to="/dashboard/teams/browse">Browse All Teams</Link>
              </Button>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {userTeams.map((userTeam) => (
                <TeamCard key={userTeam.team.id} userTeam={userTeam} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function TeamCard({ userTeam }: { userTeam: UserTeam }) {
  const { team, membership, memberCount } = userTeam;

  return (
    <Card className="transition-shadow hover:shadow-lg">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl">{team.name}</CardTitle>
            {team.city && (
              <CardDescription>
                {team.city}
                {team.province ? `, ${team.province}` : ""}
              </CardDescription>
            )}
          </div>
          {team.primaryColor && (
            <div
              className="h-8 w-8 rounded-full border"
              style={{ backgroundColor: team.primaryColor }}
            />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Role</span>
            <span className="font-medium capitalize">{membership.role}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Members</span>
            <span className="font-medium">{memberCount}</span>
          </div>
          {membership.jerseyNumber && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Jersey #</span>
              <span className="font-medium">{membership.jerseyNumber}</span>
            </div>
          )}
          {membership.position && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Position</span>
              <span className="font-medium">{membership.position}</span>
            </div>
          )}
        </div>
        <div className="mt-4 flex gap-2">
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link to="/dashboard/teams/$teamId" params={{ teamId: team.id }}>
              View Team
            </Link>
          </Button>
          {["captain", "coach"].includes(membership.role) && (
            <Button asChild variant="outline" size="sm" className="flex-1">
              <Link to="/dashboard/teams/$teamId/manage" params={{ teamId: team.id }}>
                Manage
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
