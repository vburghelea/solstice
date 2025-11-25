import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { LocalizedButtonLink } from "~/components/ui/LocalizedLink";
import { Badge } from "~/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { LoaderIcon, PlusIcon, UsersIcon } from "~/components/ui/icons";
import { TeamInvitationsSection } from "~/features/teams/components/team-invitations";
import type { PendingTeamInvite, UserTeam } from "~/features/teams/teams.queries";
import { getPendingTeamInvites, getUserTeams } from "~/features/teams/teams.queries";
import { useTeamsTranslation } from "~/hooks/useTypedTranslation";
import { useCountries } from "~/shared/hooks/useCountries";

export const Route = createFileRoute("/player/teams/")({
  loader: async () => {
    const userTeams = (await getUserTeams()) as UserTeam[];
    const pendingInvites = (await getPendingTeamInvites()) as PendingTeamInvite[];
    return { userTeams, pendingInvites };
  },
  component: TeamsIndexPage,
});

function TeamsIndexPage() {
  const { t } = useTeamsTranslation();
  const teamsTranslation = useTranslation("teams");
  const { ready } = teamsTranslation;

  const loaderData = Route.useLoaderData() as {
    userTeams: UserTeam[];
    pendingInvites: PendingTeamInvite[];
  };
  const initialTeams = loaderData.userTeams as UserTeam[];
  const initialInvites = loaderData.pendingInvites as PendingTeamInvite[];

  const { data: userTeams, isFetching: isFetchingTeams } = useSuspenseQuery<UserTeam[]>({
    queryKey: ["userTeams"],
    queryFn: async () => getUserTeams() as Promise<UserTeam[]>,
    initialData: () => initialTeams,
  });

  const { data: pendingInvites, isFetching: isFetchingInvites } = useSuspenseQuery<
    PendingTeamInvite[]
  >({
    queryKey: ["pendingTeamInvites"],
    queryFn: async () => getPendingTeamInvites() as Promise<PendingTeamInvite[]>,
    initialData: () => initialInvites,
  });

  const pendingCount = pendingInvites.length;

  // Use state to prevent hydration mismatch with refreshing indicator
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Update refreshing state after mount to prevent hydration mismatch
  React.useEffect(() => {
    // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
    setIsRefreshing(isFetchingTeams || isFetchingInvites);
  }, [isFetchingTeams, isFetchingInvites]);

  // Prevent hydration mismatch by waiting for translations to be ready
  if (!ready) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="bg-muted h-8 w-32 animate-pulse rounded" />
              <div className="bg-muted h-6 w-20 animate-pulse rounded" />
            </div>
            <div className="bg-muted mt-2 h-4 w-48 animate-pulse rounded" />
          </div>
          <div className="bg-muted h-10 w-28 animate-pulse rounded" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="space-y-3">
                  <div className="bg-muted h-5 w-2/3 animate-pulse rounded" />
                  <div className="bg-muted h-4 w-1/2 animate-pulse rounded" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-muted h-4 w-1/2 animate-pulse rounded" />
                <div className="bg-muted h-4 w-2/3 animate-pulse rounded" />
                <div className="bg-muted h-4 w-1/3 animate-pulse rounded" />
                <div className="mt-6 flex gap-2">
                  <div className="bg-muted h-9 flex-1 animate-pulse rounded" />
                  <div className="bg-muted h-9 flex-1 animate-pulse rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{t("my_teams.title")}</h1>
            {pendingCount > 0 && (
              <Badge variant="secondary" className="text-xs uppercase">
                {pendingCount}{" "}
                {pendingCount > 1
                  ? t("my_teams.pending_invites")
                  : t("my_teams.pending_invite")}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">{t("my_teams.subtitle")}</p>
        </div>
        <LocalizedButtonLink
          to="/player/teams/create"
          translationKey="links.team_management.create_team"
          translationNamespace="navigation"
        >
          <PlusIcon className="mr-2 h-4 w-4" />
          {t("my_teams.create_team")}
        </LocalizedButtonLink>
      </div>

      <div className="space-y-6">
        {isRefreshing && (
          <div className="bg-brand-red/5 text-brand-red flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold tracking-wider uppercase">
            <LoaderIcon className="h-4 w-4 animate-spin" /> {t("my_teams.refreshing")}
          </div>
        )}

        {pendingCount > 0 && <TeamInvitationsSection invites={pendingInvites} />}

        {userTeams.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <UsersIcon className="text-muted-foreground mb-4 h-12 w-12" />
              <h3 className="mb-2 text-lg font-semibold">
                {t("my_teams.no_teams_title")}
              </h3>
              <p className="text-muted-foreground mb-4 text-center">
                {t("my_teams.no_teams_subtitle")}
              </p>
              <div className="flex gap-4">
                <LocalizedButtonLink
                  to="/player/teams/browse"
                  variant="outline"
                  translationKey="links.team_management.browse_teams"
                  translationNamespace="navigation"
                >
                  {t("my_teams.browse_teams")}
                </LocalizedButtonLink>
                <LocalizedButtonLink
                  to="/player/teams/create"
                  translationKey="links.team_management.create_team"
                  translationNamespace="navigation"
                >
                  <PlusIcon className="mr-2 h-4 w-4" />
                  {t("my_teams.create_team")}
                </LocalizedButtonLink>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-4 flex justify-end">
              <LocalizedButtonLink
                to="/player/teams/browse"
                variant="outline"
                translationKey="links.team_management.browse_teams"
                translationNamespace="navigation"
              >
                {t("my_teams.browse_all_teams")}
              </LocalizedButtonLink>
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
  const { getCountryName } = useCountries();
  const { t } = useTeamsTranslation();

  return (
    <Card className="transition-shadow hover:shadow-lg">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-foreground text-xl">{team.name}</CardTitle>
            {team.city && (
              <CardDescription>
                {team.city}
                {team.country ? `, ${getCountryName(team.country)}` : ""}
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
            <span className="text-muted-foreground">{t("team_card.role")}</span>
            <span className="font-medium capitalize">{membership.role}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{t("team_card.members")}</span>
            <span className="font-medium">{memberCount}</span>
          </div>
          {membership.jerseyNumber && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                {t("team_card.jersey_number")}
              </span>
              <span className="font-medium">{membership.jerseyNumber}</span>
            </div>
          )}
          {membership.position && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("team_card.position")}</span>
              <span className="font-medium">{membership.position}</span>
            </div>
          )}
        </div>
        <div className="mt-4 flex gap-2">
          <LocalizedButtonLink
            to="/player/teams/$teamId"
            params={{ teamId: team.id }}
            variant="outline"
            size="sm"
            className="flex-1"
            translationKey="links.common.view_details"
            translationNamespace="navigation"
            ariaLabelTranslationKey="links.accessibility.link_aria_label.team_page"
          >
            {t("team_card.view_team")}
          </LocalizedButtonLink>
          {["captain", "coach"].includes(membership.role) && (
            <LocalizedButtonLink
              to="/player/teams/$teamId/manage"
              params={{ teamId: team.id }}
              variant="outline"
              size="sm"
              className="flex-1"
              translationKey="links.actions.manage"
              translationNamespace="navigation"
            >
              {t("team_card.manage")}
            </LocalizedButtonLink>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
