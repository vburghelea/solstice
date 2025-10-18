import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { DataErrorState } from "~/components/ui/data-state";
import { ArrowLeftIcon, SearchIcon, UsersIcon } from "~/components/ui/icons";
import { Input } from "~/components/ui/input";
import { Skeleton } from "~/components/ui/skeleton";
import type { TeamListItem } from "~/features/teams/teams.queries";
import { listTeams, searchTeams } from "~/features/teams/teams.queries";
import { useTeamsTranslation } from "~/hooks/useTypedTranslation";
import { useCountries } from "~/shared/hooks/useCountries";
import { List } from "~/shared/ui/list";

export const Route = createFileRoute("/player/teams/browse")({
  loader: async () => {
    // Pre-fetch all teams
    const teams = await listTeams({ data: { includeInactive: false } });
    return { teams };
  },
  component: BrowseTeamsPage,
});

function BrowseTeamsPage() {
  const { t } = useTeamsTranslation();
  const { teams: initialTeams } = Route.useLoaderData();
  const [searchQuery, setSearchQuery] = useState("");
  const { getCountryName } = useCountries();

  const { data: allTeams, isFetching: isFetchingAll } = useSuspenseQuery({
    queryKey: ["allTeams"],
    queryFn: async () => listTeams({ data: { includeInactive: false } }),
    initialData: initialTeams,
  });

  const {
    data: searchResults = [],
    isFetching: isSearching,
    isError: searchErrored,
    refetch: retrySearch,
  } = useQuery({
    queryKey: ["searchTeams", searchQuery],
    queryFn: async () =>
      searchQuery ? searchTeams({ data: { query: searchQuery } }) : [],
    enabled: searchQuery.length > 0,
    initialData: [],
  });

  const teams = searchQuery
    ? searchResults.map((item) => ({ ...item, creator: null }))
    : allTeams;

  const showSkeletons =
    (searchQuery ? isSearching : isFetchingAll) && (teams?.length ?? 0) === 0;
  const skeletonKeys = ["alpha", "bravo", "charlie", "delta", "echo", "foxtrot"];

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/player/teams">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            {t("teams.browse.back_to_my_teams")}
          </Link>
        </Button>
      </div>

      <div className="mb-8">
        <h1 className="text-foreground text-3xl font-bold">{t("teams.browse.title")}</h1>
        <p className="text-muted-foreground">{t("teams.browse.subtitle")}</p>
      </div>

      <div className="mb-6">
        <div className="relative">
          <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            type="search"
            placeholder={t("teams.browse.search_placeholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-muted-foreground pl-10"
          />
        </div>
      </div>

      {searchQuery && searchErrored ? (
        <DataErrorState
          title={t("teams.browse.search_error_title")}
          description={t("teams.browse.search_error_description")}
          onRetry={() => retrySearch()}
        />
      ) : showSkeletons ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {skeletonKeys.map((key) => (
            <TeamCardSkeleton key={key} />
          ))}
        </div>
      ) : teams.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <UsersIcon className="text-muted-foreground mb-4 h-12 w-12" />
            <h3 className="mb-2 text-lg font-semibold">
              {t("teams.browse.no_teams_title")}
            </h3>
            <p className="text-muted-foreground text-center">
              {searchQuery
                ? t("teams.browse.try_different_search")
                : t("teams.browse.no_teams_subtitle")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile list */}
          <div className="md:hidden">
            <List>
              {teams.map((teamItem) => (
                <List.Item key={teamItem.team.id} className="group">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-foreground truncate text-base font-semibold">
                        {teamItem.team.name}
                      </div>
                      <div className="text-muted-foreground mt-1 text-xs">
                        {teamItem.team.city}
                        {teamItem.team.country
                          ? `, ${getCountryName(teamItem.team.country)}`
                          : ""}
                      </div>
                      <div className="text-muted-foreground mt-1 text-xs">
                        {t("teams.browse.members")}: {teamItem.memberCount}
                      </div>
                    </div>
                    <Link
                      to="/player/teams/$teamId"
                      params={{ teamId: teamItem.team.id }}
                      className="text-primary inline-flex shrink-0 items-center gap-1 text-sm font-medium hover:underline"
                    >
                      {t("teams.browse.view")}
                    </Link>
                  </div>
                </List.Item>
              ))}
            </List>
          </div>

          {/* Desktop grid */}
          <div className="hidden gap-6 md:grid md:grid-cols-2 lg:grid-cols-3">
            {teams.map((teamItem) => (
              <PublicTeamCard
                key={teamItem.team.id}
                teamItem={teamItem}
                getCountryName={getCountryName}
                t={t}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function PublicTeamCard({
  teamItem,
  getCountryName,
  t,
}: {
  teamItem: TeamListItem;
  getCountryName: (isoCode: string | null | undefined) => string;
  t: (key: string) => string;
}) {
  const { team, memberCount, creator } = teamItem;

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
            <span className="text-muted-foreground">{t("teams.browse.members")}</span>
            <span className="font-medium">{memberCount}</span>
          </div>
          {team.foundedYear && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("teams.browse.founded")}</span>
              <span className="font-medium">{team.foundedYear}</span>
            </div>
          )}
          {creator && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                {t("teams.browse.created_by")}
              </span>
              <span className="truncate font-medium">
                {creator.name || creator.email}
              </span>
            </div>
          )}
        </div>
        <div className="mt-4">
          <Button asChild variant="outline" size="sm" className="w-full">
            <Link to="/player/teams/$teamId" params={{ teamId: team.id }}>
              {t("teams.browse.view_team")}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function TeamCardSkeleton() {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="space-y-3">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="mt-6 h-9 w-full" />
      </CardContent>
    </Card>
  );
}
