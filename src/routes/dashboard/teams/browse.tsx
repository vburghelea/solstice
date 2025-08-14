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
import { ArrowLeftIcon, SearchIcon, UsersIcon } from "~/components/ui/icons";
import { Input } from "~/components/ui/input";
import type { TeamListItem } from "~/features/teams/teams.queries";
import { listTeams, searchTeams } from "~/features/teams/teams.queries";
import { useCountries } from "~/shared/hooks/useCountries";

export const Route = createFileRoute("/dashboard/teams/browse")({
  loader: async () => {
    // Pre-fetch all teams
    const teams = await listTeams({ data: { includeInactive: false } });
    return { teams };
  },
  component: BrowseTeamsPage,
});

function BrowseTeamsPage() {
  const { teams: initialTeams } = Route.useLoaderData();
  const [searchQuery, setSearchQuery] = useState("");
  const { getCountryName } = useCountries();

  const { data: allTeams } = useSuspenseQuery({
    queryKey: ["allTeams"],
    queryFn: async () => listTeams({ data: { includeInactive: false } }),
    initialData: initialTeams,
  });

  const { data: searchResults } = useQuery({
    queryKey: ["searchTeams", searchQuery],
    queryFn: async () =>
      searchQuery ? searchTeams({ data: { query: searchQuery } }) : [],
    enabled: searchQuery.length > 0,
  });

  const teams = searchQuery
    ? (searchResults || []).map((item) => ({ ...item, creator: null }))
    : allTeams;

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/dashboard/teams">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to My Teams
          </Link>
        </Button>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Browse Teams</h1>
        <p className="text-muted-foreground">Discover and join teams in your area</p>
      </div>

      <div className="mb-6">
        <div className="relative">
          <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            type="search"
            placeholder="Search teams by name or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-muted-foreground pl-10"
          />
        </div>
      </div>

      {teams.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <UsersIcon className="text-muted-foreground mb-4 h-12 w-12" />
            <h3 className="mb-2 text-lg font-semibold">No teams found</h3>
            <p className="text-muted-foreground text-center">
              {searchQuery
                ? "Try a different search term"
                : "No teams available to browse"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((teamItem) => (
            <PublicTeamCard
              key={teamItem.team.id}
              teamItem={teamItem}
              getCountryName={getCountryName}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PublicTeamCard({
  teamItem,
  getCountryName,
}: {
  teamItem: TeamListItem;
  getCountryName: (isoCode: string | null | undefined) => string;
}) {
  const { team, memberCount, creator } = teamItem;

  return (
    <Card className="transition-shadow hover:shadow-lg">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl text-gray-900">{team.name}</CardTitle>
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
            <span className="text-muted-foreground">Members</span>
            <span className="font-medium">{memberCount}</span>
          </div>
          {team.foundedYear && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Founded</span>
              <span className="font-medium">{team.foundedYear}</span>
            </div>
          )}
          {creator && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Created by</span>
              <span className="truncate font-medium">
                {creator.name || creator.email}
              </span>
            </div>
          )}
        </div>
        <div className="mt-4">
          <Button asChild variant="outline" size="sm" className="w-full">
            <Link to="/dashboard/teams/$teamId" params={{ teamId: team.id }}>
              View Team
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
