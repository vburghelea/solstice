import { useQuery } from "@tanstack/react-query";
import posthog from "posthog-js";
import { useEffect, useMemo, useState } from "react";

import { SafeLink as Link } from "~/components/ui/SafeLink";
import { Avatar } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Calendar,
  CheckCircle2,
  CreditCard,
  ScrollText,
  Swords,
  Trophy,
  Users,
} from "~/components/ui/icons";
import {
  getDashboardStats,
  getNextUserGame,
} from "~/features/dashboard/dashboard.queries";
import { getUpcomingEvents } from "~/features/events/events.queries";
import { getUserMembershipStatus } from "~/features/membership/membership.queries";
import { listPendingGMReviews } from "~/features/reviews/reviews.queries";
import { getUserTeams } from "~/features/teams/teams.queries";
import type { AuthUser } from "~/lib/auth/types";
import { formatDateAndTime } from "~/shared/lib/datetime";

function formatTimeDistance(date: Date) {
  const now = new Date().getTime();
  const diff = new Date(date).getTime() - now;
  if (diff <= 0) {
    return "now";
  }
  const mins = Math.round(diff / 60000);
  if (mins < 60) {
    return `in ${mins}m`;
  }
  const hours = Math.round(mins / 60);
  if (hours < 24) {
    return `in ${hours}h`;
  }
  const days = Math.round(hours / 24);
  return `in ${days}d`;
}

function initialsFromName(name?: string | null) {
  if (!name) {
    return "P";
  }
  const [first, second] = name.split(" ");
  if (first && second) {
    return `${first[0]}${second[0]}`.toUpperCase();
  }
  if (first) {
    return first.slice(0, 2).toUpperCase();
  }
  return "P";
}

export function PlayerDashboard({ user }: { readonly user: AuthUser | null }) {
  const [showSpotlight, setShowSpotlight] = useState(false);

  useEffect(() => {
    posthog.onFeatureFlags(() => {
      setShowSpotlight(posthog.isFeatureEnabled("dashboard-new-card") ?? false);
    });
  }, []);

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

  const { data: userTeams = [] } = useQuery({
    queryKey: ["userTeams"],
    queryFn: async () => {
      const result = await getUserTeams({ data: {} });
      return result || [];
    },
  });

  const { data: nextGameResult } = useQuery({
    queryKey: ["next-user-game"],
    queryFn: async () => getNextUserGame(),
  });
  const nextGame = nextGameResult?.success ? nextGameResult.data : null;

  const { data: upcomingEventsRes } = useQuery({
    queryKey: ["upcoming-events-dashboard"],
    queryFn: async () => getUpcomingEvents({ data: { limit: 3 } }),
  });
  const upcomingEvents = useMemo(
    () => (Array.isArray(upcomingEventsRes) ? upcomingEventsRes : []),
    [upcomingEventsRes],
  );

  const { data: pendingReviewsCount = 0 } = useQuery({
    queryKey: ["pending-gm-reviews-count"],
    queryFn: async () => {
      const res = await listPendingGMReviews({ data: { days: 365 } });
      return res.success ? res.data.length : 0;
    },
    refetchOnMount: "always",
  });

  const teamCount = userTeams.length;
  const membershipLabel = membershipStatus?.hasMembership ? "Active" : "Inactive";
  const membershipDetail = membershipStatus?.hasMembership
    ? membershipStatus.daysRemaining
      ? `${membershipStatus.daysRemaining} days remaining`
      : "Membership active"
    : "No active membership";

  const campaignsSummary = dashboardStats?.campaigns ?? {
    owned: 0,
    member: 0,
    pendingInvites: 0,
  };
  const gamesSummary = dashboardStats?.games ?? {
    owned: 0,
    member: 0,
    pendingInvites: 0,
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-4 sm:p-6">
      <section className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card className="border-muted-foreground/20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/15 via-transparent to-purple-500/20" />
          <CardHeader className="relative z-10 space-y-4 sm:space-y-6">
            <div className="flex items-center gap-4">
              <Avatar
                name={user?.name ?? "Player"}
                fallback={initialsFromName(user?.name)}
                className="h-12 w-12 border border-white/20 shadow-sm"
              />
              <div>
                <p className="text-muted-foreground text-xs tracking-widest uppercase">
                  Player HQ
                </p>
                <h1 className="text-foreground text-2xl font-semibold sm:text-3xl">
                  Welcome back, {user?.name || "Leo"}
                </h1>
              </div>
            </div>
            <p className="text-muted-foreground max-w-xl text-sm sm:text-base">
              Stay on top of sessions, invitations, and community highlights. Everything
              Leo needs to feel connected is organized here.
            </p>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <Badge variant="outline" className="border-primary/40 text-primary">
                <CheckCircle2 className="mr-2 h-3.5 w-3.5" /> Privacy controls ready
              </Badge>
              <Badge
                variant="secondary"
                className="bg-secondary/60 text-secondary-foreground"
              >
                {teamCount} team{teamCount === 1 ? "" : "s"} synced
              </Badge>
            </div>
          </CardHeader>
        </Card>
        <Card className="border-muted-foreground/20">
          <CardHeader className="space-y-1">
            <CardTitle className="text-foreground flex items-center gap-2 text-base font-semibold">
              <Trophy className="h-4 w-4" /> Leo's momentum
            </CardTitle>
            <CardDescription>
              Keep your profile sharp so teammates know when to invite you.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Button asChild variant="outline" className="justify-start gap-2">
              <Link to="/dashboard/profile">
                <Users className="h-4 w-4" /> Update profile details
              </Link>
            </Button>
            <Button asChild className="justify-start gap-2">
              <Link to="/dashboard/membership">
                <CreditCard className="h-4 w-4" />
                {membershipStatus?.hasMembership
                  ? "Manage membership"
                  : "Activate membership"}
              </Link>
            </Button>
            <Button asChild variant="secondary" className="justify-start gap-2">
              <Link to="/search">
                <Calendar className="h-4 w-4" /> Find a new game night
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Card className="border-muted-foreground/20">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-muted-foreground text-xs tracking-widest uppercase">
                Next up
              </p>
              <CardTitle className="text-foreground text-xl font-semibold">
                {nextGame ? nextGame.name : "No upcoming games"}
              </CardTitle>
            </div>
            <Badge variant="outline" className="border-muted text-xs font-medium">
              {nextGame
                ? formatTimeDistance(new Date(nextGame.dateTime))
                : "Stay available"}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {nextGame ? (
              <div className="space-y-3">
                <p className="text-muted-foreground text-sm">
                  {formatDateAndTime(nextGame.dateTime)} · {nextGame.location.address}
                </p>
                <Button asChild>
                  <Link to={`/dashboard/games/${nextGame.id}`}>
                    Open session briefing
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-muted-foreground text-sm">
                  Keep your calendar flexible and claim a spot in the next adventure.
                </p>
                <Button asChild variant="secondary">
                  <Link to="/search">Discover a new session</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="border-muted-foreground/20">
          <CardHeader>
            <CardTitle className="text-foreground text-base font-semibold">
              Relationship health
            </CardTitle>
            <CardDescription>
              A quick pulse on how you're staying connected across the community.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-muted-foreground text-xs tracking-widest uppercase">
                Membership
              </p>
              <p className="text-foreground mt-1 text-lg font-semibold">
                {membershipLabel}
              </p>
              <p className="text-muted-foreground text-sm">{membershipDetail}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs tracking-widest uppercase">
                Pending reviews
              </p>
              <p className="text-foreground mt-1 text-lg font-semibold">
                {pendingReviewsCount}
              </p>
              <p className="text-muted-foreground text-sm">
                {pendingReviewsCount === 0
                  ? "You're all caught up"
                  : "Share your table stories"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs tracking-widest uppercase">
                Teams
              </p>
              <p className="text-foreground mt-1 text-lg font-semibold">{teamCount}</p>
              <p className="text-muted-foreground text-sm">
                {teamCount === 0 ? "Join a crew" : "Active teams you're with"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs tracking-widest uppercase">
                Upcoming events
              </p>
              <p className="text-foreground mt-1 text-lg font-semibold">
                {upcomingEvents.length}
              </p>
              <p className="text-muted-foreground text-sm">
                {upcomingEvents.length === 0
                  ? "Watch the calendar"
                  : "Opportunities waiting"}
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="border-muted-foreground/20">
          <CardHeader>
            <CardTitle className="text-foreground text-base font-semibold">
              Campaign commitments
            </CardTitle>
            <CardDescription>
              Track how you lead and participate so nothing slips.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <StatPill
              label="Owner"
              value={campaignsSummary.owned}
              icon={<ScrollText className="h-4 w-4" />}
            />
            <StatPill
              label="Player"
              value={campaignsSummary.member}
              icon={<Users className="h-4 w-4" />}
            />
            <StatPill
              label="Invites"
              value={campaignsSummary.pendingInvites}
              icon={<Calendar className="h-4 w-4" />}
            />
          </CardContent>
        </Card>
        <Card className="border-muted-foreground/20">
          <CardHeader>
            <CardTitle className="text-foreground text-base font-semibold">
              Game roster
            </CardTitle>
            <CardDescription>
              Know where you're leading, playing, and queued to join next.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <StatPill
              label="GM"
              value={gamesSummary.owned}
              icon={<Swords className="h-4 w-4" />}
            />
            <StatPill
              label="Player"
              value={gamesSummary.member}
              icon={<Users className="h-4 w-4" />}
            />
            <StatPill
              label="Invites"
              value={gamesSummary.pendingInvites}
              icon={<Calendar className="h-4 w-4" />}
            />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Card className="border-muted-foreground/20">
          <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <CardTitle className="text-foreground text-base font-semibold">
                Events worth exploring
              </CardTitle>
              <CardDescription>
                Recommendations refresh automatically as new sessions go live.
              </CardDescription>
            </div>
            <Button asChild variant="ghost" className="text-primary hover:text-primary">
              <Link to="/search">See all events</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingEvents.length === 0 ? (
              <EmptyState message="No featured events right now." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="border-muted-foreground/20 bg-muted/40 rounded-xl border p-4 shadow-sm"
                  >
                    <p className="text-muted-foreground text-xs tracking-widest uppercase">
                      {event.city}, {event.province ?? event.country}
                    </p>
                    <p className="text-foreground mt-2 text-base font-semibold">
                      {event.name}
                    </p>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {formatDateAndTime(event.startDate)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="border-muted-foreground/20">
          <CardHeader>
            <CardTitle className="text-foreground text-base font-semibold">
              Focus spotlight
            </CardTitle>
            <CardDescription>
              Highlights unlock gradually as we pilot player-first experiments.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {showSpotlight ? (
              <div className="space-y-3">
                <p className="text-foreground text-sm font-medium">
                  Early access: collaborative calendar sync
                </p>
                <p className="text-muted-foreground text-sm">
                  Enable calendar sharing so trusted friends can nudge you when they're
                  planning a session that fits your vibe.
                </p>
                <Button className="w-full">Join the pilot</Button>
              </div>
            ) : (
              <EmptyState message="Stay tuned. A new experiment is loading." />
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function StatPill({
  label,
  value,
  icon,
}: {
  readonly label: string;
  readonly value: number;
  readonly icon: React.ReactNode;
}) {
  return (
    <div className="border-muted-foreground/20 bg-background/70 rounded-xl border p-4">
      <div className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
        {icon}
        {label}
      </div>
      <p className="text-foreground mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function EmptyState({ message }: { readonly message: string }) {
  return (
    <div className="border-muted-foreground/30 flex flex-col items-start gap-2 rounded-xl border border-dashed p-4 text-left">
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  );
}
