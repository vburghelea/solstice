import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { SafeLink as Link } from "~/components/ui/SafeLink";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Trophy,
  User,
  UserPlus,
  Users,
  XCircle,
} from "~/components/ui/icons";
import { getUserMembershipStatus } from "~/features/membership/membership.queries";
import { getUserTeams } from "~/features/teams/teams.queries";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardIndex,
});

function DashboardIndex() {
  const { user } = Route.useRouteContext();

  // Fetch membership status
  const { data: membershipStatus } = useQuery({
    queryKey: ["membership-status"],
    queryFn: async () => {
      const result = await getUserMembershipStatus();
      if (!result.success) {
        throw new Error(
          result.errors?.[0]?.message || "Failed to fetch membership status",
        );
      }
      return result.data || null;
    },
  });

  // Fetch user's teams
  const { data: userTeams = [] } = useQuery({
    queryKey: ["userTeams"],
    queryFn: async () => {
      const result = await getUserTeams({ data: {} });
      return result || [];
    },
  });

  const teamCount = userTeams.length;
  const upcomingEventsCount = 0;

  return (
    <div className="container mx-auto space-y-8 p-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {user?.name || "Player"}!
        </h1>
        <p className="text-muted-foreground mt-2">
          Here's an overview of your Roundup Games account
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Membership Status Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Membership Status</CardTitle>
            {membershipStatus?.hasMembership ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="text-muted-foreground h-4 w-4" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {membershipStatus?.hasMembership ? "Active" : "Inactive"}
            </div>
            {membershipStatus?.hasMembership && membershipStatus.daysRemaining ? (
              <p className="text-muted-foreground mt-1 text-xs">
                <Clock className="mr-1 inline h-3 w-3" />
                {membershipStatus.daysRemaining} days remaining
              </p>
            ) : null}
            {!membershipStatus?.hasMembership && (
              <p className="text-muted-foreground mt-1 text-xs">
                <AlertCircle className="mr-1 inline h-3 w-3" />
                No active membership
              </p>
            )}
          </CardContent>
        </Card>

        {/* Teams Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Teams</CardTitle>
            <Users className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamCount}</div>
            <p className="text-muted-foreground mt-1 text-xs">
              {teamCount === 0
                ? "Not on any teams yet"
                : `Active team${teamCount !== 1 ? "s" : ""}`}
            </p>
          </CardContent>
        </Card>

        {/* Upcoming Events Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
            <Calendar className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingEventsCount}</div>
            <p className="text-muted-foreground mt-1 text-xs">
              {upcomingEventsCount === 0 ? "No events scheduled" : "Events this season"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Complete Profile - always shown since profile is complete to access dashboard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                View Profile
              </CardTitle>
              <CardDescription>
                Review and update your profile information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link to="/dashboard/profile">View Profile</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Buy/Renew Membership */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                {membershipStatus?.hasMembership ? "Renew Membership" : "Buy Membership"}
              </CardTitle>
              <CardDescription>
                {membershipStatus?.hasMembership
                  ? "Extend your membership for another year"
                  : "Get your annual player membership"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link to="/dashboard/membership">
                  {membershipStatus?.hasMembership ? "Renew Now" : "Get Membership"}
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Join Team */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Join a Team
              </CardTitle>
              <CardDescription>
                Find and join a team to compete in tournaments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity - Placeholder */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Recent Activity</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="text-muted-foreground flex items-center justify-center py-8">
              <Trophy className="mr-3 h-12 w-12 opacity-20" />
              <div>
                <p className="text-sm font-medium">No recent activity</p>
                <p className="text-xs">Your recent activities will appear here</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
