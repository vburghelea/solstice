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
  ScrollText,
  Swords,
  Trophy,
  User,
  UserPlus,
  Users,
  XCircle,
} from "~/components/ui/icons";
import {
  getDashboardStats,
  getNextUserGame,
} from "~/features/dashboard/dashboard.queries";
import { getUpcomingEvents } from "~/features/events/events.queries";
import { getUserMembershipStatus } from "~/features/membership/membership.queries";
import { listPendingGMReviews } from "~/features/reviews/reviews.queries";
import { getUserTeams } from "~/features/teams/teams.queries";
import { formatDateAndTime } from "~/shared/lib/datetime";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardIndex,
});

function DashboardIndex() {
  const { user } = Route.useRouteContext();

  const { data: dashboardStats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const result = await getDashboardStats();
      if (!result.success) {
        throw new Error(result.errors?.[0]?.message || "Failed to fetch dashboard stats");
      }
      return result.data;
    },
  });

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
  // Next upcoming game for the user (owner or participant)
  const { data: nextGameResult } = useQuery({
    queryKey: ["next-user-game"],
    queryFn: async () => {
      const result = await getNextUserGame();
      return result;
    },
  });
  const nextGame = nextGameResult?.success ? nextGameResult.data : null;

  // Upcoming events count (public, published or registration_open, starting today or later)
  const { data: upcomingEventsRes } = useQuery({
    queryKey: ["upcoming-events-dashboard"],
    queryFn: async () => getUpcomingEvents({ data: { limit: 3 } }),
  });
  const upcomingEventsCount = Array.isArray(upcomingEventsRes)
    ? upcomingEventsRes.length
    : 0;

  // Pending GM reviews count
  const { data: pendingReviewsCount = 0 } = useQuery({
    queryKey: ["pending-gm-reviews-count"],
    queryFn: async () => {
      const res = await listPendingGMReviews({ data: { days: 365 } });
      return res.success ? res.data.length : 0;
    },
    refetchOnMount: "always",
  });

  function formatTimeDistance(date: Date) {
    const now = new Date().getTime();
    const diff = new Date(date).getTime() - now;
    if (diff <= 0) return "now";
    const mins = Math.round(diff / 60000);
    if (mins < 60) return `in ${mins}m`;
    const hours = Math.round(mins / 60);
    if (hours < 24) return `in ${hours}h`;
    const days = Math.round(hours / 24);
    return `in ${days}d`;
  }

  return (
    <div className="container mx-auto space-y-8 p-4 sm:p-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          Welcome back, {user?.name || "Player"}!
        </h1>
        <p className="text-muted-foreground mt-1 sm:mt-2">
          Here's an overview of your account
        </p>
      </div>

      {/* Now & Next (Mobile-first) */}
      <div className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
        {nextGame ? (
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-medium text-gray-500">Next up</div>
              <div className="mt-1 text-base font-semibold text-gray-900">
                {nextGame.name}
              </div>
              <div className="mt-1 text-sm text-gray-600">
                🗓️ {formatDateAndTime(nextGame.dateTime)} • {nextGame.location.address}
              </div>
              <div className="mt-1 text-xs text-gray-500">
                {formatTimeDistance(new Date(nextGame.dateTime))}
              </div>
            </div>
            <Button asChild>
              <Link to={`/dashboard/games/${nextGame.id}`}>View</Link>
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <div className="text-base font-semibold text-gray-900">
                No upcoming games
              </div>
              <div className="text-sm text-gray-600">Discover and join a new session</div>
            </div>
            <Button asChild variant="secondary">
              <Link to="/search">Find games</Link>
            </Button>
          </div>
        )}
      </div>

      {/* Stats Cards (mobile 1-col, desktop grid) */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Pending GM Reviews */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900">
              Pending Reviews
            </CardTitle>
            <ScrollText className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingReviewsCount}</div>
            <p className="text-muted-foreground mt-1 text-xs">
              {pendingReviewsCount === 0
                ? "You're all caught up"
                : "Reviews awaiting your feedback"}
            </p>
            <div className="mt-3">
              <Button asChild variant="outline" size="sm">
                <Link to="/dashboard/reviews/pending">Review Now</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        {/* Membership Status Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900">
              Membership Status
            </CardTitle>
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
            <CardTitle className="text-sm font-medium text-gray-900">My Teams</CardTitle>
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
            <CardTitle className="text-sm font-medium text-gray-900">
              Upcoming Events
            </CardTitle>
            <Calendar className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingEventsCount}</div>
            <p className="text-muted-foreground mt-1 text-xs">
              {upcomingEventsCount === 0 ? "No events scheduled" : "Events this season"}
            </p>
          </CardContent>
        </Card>

        {/* Campaigns Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900">Campaigns</CardTitle>
            <ScrollText className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardStats?.campaigns.owned ?? 0}
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              {dashboardStats?.campaigns.member ?? 0} as member,{" "}
              {dashboardStats?.campaigns.pendingInvites ?? 0} invites
            </p>
          </CardContent>
        </Card>

        {/* Games Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900">Games</CardTitle>
            <Swords className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats?.games.owned ?? 0}</div>
            <p className="text-muted-foreground mt-1 text-xs">
              {dashboardStats?.games.member ?? 0} as member,{" "}
              {dashboardStats?.games.pendingInvites ?? 0} invites
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Quick Actions</h2>
        {/* Mobile: Full-width buttons */}
        <div className="grid gap-3 md:hidden">
          <Button asChild className="w-full">
            <Link to="/dashboard/profile">View Profile</Link>
          </Button>
          <Button asChild className="w-full">
            <Link to="/dashboard/membership">
              {membershipStatus?.hasMembership ? "Renew Membership" : "Buy Membership"}
            </Link>
          </Button>
          <Button className="w-full" variant="outline" disabled>
            Join a Team (Soon)
          </Button>
        </div>

        {/* Desktop: Cards */}
        <div className="hidden gap-4 md:grid md:grid-cols-2 lg:grid-cols-3">
          {/* Complete Profile - always shown since profile is complete to access dashboard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
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
              <CardTitle className="flex items-center gap-2 text-gray-900">
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
              <CardTitle className="flex items-center gap-2 text-gray-900">
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
