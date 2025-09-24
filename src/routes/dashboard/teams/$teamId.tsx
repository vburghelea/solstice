import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeftIcon,
  CalendarIcon,
  LinkIcon,
  MapPinIcon,
  UsersIcon,
} from "lucide-react";
import { ProfileLink } from "~/components/ProfileLink";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { getTeam, getTeamMembers } from "~/features/teams/teams.queries";
import { useCountries } from "~/shared/hooks/useCountries";
import { UserAvatar } from "~/shared/ui/user-avatar";

export const Route = createFileRoute("/dashboard/teams/$teamId")({
  loader: async ({ params }) => {
    const [teamData, members] = await Promise.all([
      getTeam({ data: { teamId: params.teamId } }),
      getTeamMembers({ data: { teamId: params.teamId } }),
    ]);

    if (!teamData) {
      throw new Error("Team not found");
    }

    return { teamData, members };
  },
  component: TeamDetailsPage,
});

function TeamDetailsPage() {
  const { teamId } = Route.useParams();
  const { teamData: initialTeamData, members: initialMembers } = Route.useLoaderData();
  const { getCountryName } = useCountries();

  const { data: teamData } = useSuspenseQuery({
    queryKey: ["team", teamId],
    queryFn: async () => getTeam({ data: { teamId } }),
    initialData: initialTeamData,
  });

  const { data: members } = useSuspenseQuery({
    queryKey: ["teamMembers", teamId],
    queryFn: async () => getTeamMembers({ data: { teamId } }),
    initialData: initialMembers,
  });

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
            <h1 className="text-foreground text-3xl font-bold">{team.name}</h1>
            {team.city && (
              <p className="text-muted-foreground mt-1 flex items-center">
                <MapPinIcon className="mr-1 h-4 w-4" />
                {team.city}
                {team.country ? `, ${getCountryName(team.country)}` : ""}
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
                      <UserAvatar
                        className="h-10 w-10"
                        name={user.name ?? null}
                        email={user.email ?? null}
                        srcUploaded={
                          (user as { uploadedAvatarPath?: string | null })
                            .uploadedAvatarPath ?? null
                        }
                        srcProvider={user.image ?? null}
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
                          {member.jerseyNumber && <span>#{member.jerseyNumber}</span>}
                          {member.position && <span>{member.position}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="text-muted-foreground text-sm">
                      Joined {new Date(member.joinedAt).toLocaleDateString()}
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
            <CardContent className="space-y-2">
              <Button className="w-full" variant="outline" asChild>
                <Link to="/dashboard/teams/$teamId/members" params={{ teamId }}>
                  <UsersIcon className="mr-2 h-4 w-4" />
                  Manage Members
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
