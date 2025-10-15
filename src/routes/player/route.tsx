import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { formatDistanceToNow } from "date-fns";
import {
  CalendarDays,
  Gamepad2,
  Home,
  Inbox,
  ScrollText,
  Settings,
  UserCircle,
  Users,
  Users2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import {
  RoleWorkspaceLayout,
  type RoleWorkspaceNavItem,
} from "~/features/layouts/role-workspace-layout";
import { getUserMembershipStatus } from "~/features/membership/membership.queries";
import type { MembershipStatus as PlayerMembershipStatus } from "~/features/membership/membership.types";
import {
  getNextPlayerGame,
  getPlayerWorkspaceStats,
} from "~/features/player/player.queries";
import { resolvePersonaResolution } from "~/features/roles/persona.server";
import type { PersonaResolution } from "~/features/roles/persona.types";
import { RoleSwitcherProvider } from "~/features/roles/role-switcher-context";
import { getUserTeams } from "~/features/teams/teams.queries";
import { requireAuth, requireAuthAndProfile } from "~/lib/auth/guards/route-guards";
import { WORKSPACE_FEATURE_FLAGS } from "~/lib/feature-flag-keys";
import { useFeatureFlag } from "~/lib/feature-flags";
import { formatDateAndTime } from "~/shared/lib/datetime";

const BASE_PLAYER_NAVIGATION: RoleWorkspaceNavItem[] = [
  {
    label: "Overview",
    to: "/player",
    icon: Home,
    exact: true,
    description: "Track membership, invitations, and your next session at a glance.",
  },
  {
    label: "Campaigns",
    to: "/player/campaigns",
    icon: ScrollText,
    description: "Review your active story arcs and plan upcoming beats.",
  },
  {
    label: "Games",
    to: "/player/games",
    icon: Gamepad2,
    description: "Manage scheduled sessions and update participation.",
  },
  {
    label: "Events",
    to: "/player/events",
    icon: CalendarDays,
    description: "Browse upcoming gatherings and confirm attendance.",
  },
  {
    label: "Teams",
    to: "/player/teams",
    icon: Users2,
    description: "Coordinate with your crews and handle invitations.",
  },
  {
    label: "Inbox",
    to: "/player/inbox",
    icon: Inbox,
    description: "Catch up on new announcements and shared threads.",
  },
  {
    label: "Collaboration",
    to: "/player/collaboration",
    icon: Users,
    inMobileNav: false,
    description: "Coordinate with teammates and facilitators without leaving the hub.",
  },
  {
    label: "Profile",
    to: "/player/profile",
    icon: UserCircle,
    section: "account",
    description: "Review and edit your personal details and preferences.",
  },
  {
    label: "Settings",
    to: "/player/settings",
    icon: Settings,
    section: "account",
    description: "Manage privacy, notifications, and connected accounts.",
  },
];

type WorkspaceStatsResult = Awaited<ReturnType<typeof getPlayerWorkspaceStats>>;
type WorkspaceStatsData = Extract<WorkspaceStatsResult, { success: true }>["data"];
type MembershipStatusData = PlayerMembershipStatus;
type NextGameResult = Awaited<ReturnType<typeof getNextPlayerGame>>;
type UserTeamsData = Awaited<ReturnType<typeof getUserTeams>>;

export const Route = createFileRoute("/player")({
  beforeLoad: async ({ context, location }) => {
    if (location.pathname.startsWith("/player/onboarding")) {
      requireAuth({ user: context.user, location });
      return;
    }

    requireAuthAndProfile({ user: context.user, location });
  },
  loader: async () => {
    const resolution = await resolvePersonaResolution({ data: {} });
    return { resolution };
  },
  component: PlayerNamespaceShell,
});

function PlayerNamespaceShell() {
  const { resolution } = Route.useLoaderData() as { resolution: PersonaResolution };
  const loadResolution = useServerFn(resolvePersonaResolution);
  const { user } = Route.useRouteContext();
  const showSharedInbox = useFeatureFlag(WORKSPACE_FEATURE_FLAGS.sharedInbox);
  const showCollaboration = useFeatureFlag(WORKSPACE_FEATURE_FLAGS.collaboration);

  const navigationItems = useMemo(() => {
    return BASE_PLAYER_NAVIGATION.filter((item) => {
      if (item.to === "/player/inbox") {
        return showSharedInbox;
      }

      if (item.to === "/player/collaboration") {
        return showCollaboration;
      }

      return true;
    });
  }, [showCollaboration, showSharedInbox]);

  const workspaceSubtitle = user?.name ? `Welcome back, ${user.name}` : "Welcome back";
  const workspaceLabel = user?.name ? `${user.name}` : "Player";

  return (
    <RoleSwitcherProvider
      initialResolution={resolution}
      onSwitch={async (personaId) =>
        loadResolution({ data: { preferredPersonaId: personaId, forceRefresh: true } })
      }
    >
      <RoleWorkspaceLayout
        title="Player workspace"
        description="Manage sessions, invitations, and community insights from one responsive hub."
        navItems={navigationItems}
        fallbackLabel="Player"
        subtitle={workspaceSubtitle}
        workspaceLabel={workspaceLabel}
        headerSlot={<PlayerWorkspaceSummary />}
      />
    </RoleSwitcherProvider>
  );
}

function PlayerWorkspaceSummary() {
  const { user } = Route.useRouteContext();
  const isAuthenticated = Boolean(user?.id);

  const workspaceStatsQuery = useQuery<WorkspaceStatsData>({
    queryKey: ["player-workspace-stats"],
    queryFn: async () => {
      const result = await getPlayerWorkspaceStats();
      if (!result.success || !result.data) {
        const message =
          ("errors" in result && result.errors?.[0]?.message) ||
          "Failed to load workspace stats";
        throw new Error(message);
      }
      return result.data;
    },
    staleTime: 5 * 60 * 1000,
    enabled: isAuthenticated,
  });

  const membershipStatusQuery = useQuery<MembershipStatusData | null>({
    queryKey: ["membership-status"],
    queryFn: async () => {
      const result = await getUserMembershipStatus();
      if (!result.success) {
        const message =
          ("errors" in result && result.errors?.[0]?.message) ||
          "Failed to load membership status";
        throw new Error(message);
      }
      return result.data ?? null;
    },
    staleTime: 5 * 60 * 1000,
    enabled: isAuthenticated,
  });

  const nextGameQuery = useQuery<NextGameResult | undefined>({
    queryKey: ["next-user-game"],
    queryFn: async () => getNextPlayerGame(),
    staleTime: 5 * 60 * 1000,
    enabled: isAuthenticated,
  });

  const teamsQuery = useQuery<UserTeamsData>({
    queryKey: ["userTeams"],
    queryFn: async () => getUserTeams({ data: {} }),
    staleTime: 5 * 60 * 1000,
    enabled: isAuthenticated,
  });

  const membershipStatus = membershipStatusQuery.data;
  const nextGame = nextGameQuery.data?.success ? nextGameQuery.data.data : null;
  const teams = useMemo(() => teamsQuery.data ?? [], [teamsQuery.data]);
  const firstTeam = teams[0];
  const workspaceStats = workspaceStatsQuery.data;
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    if (!isHydrated) {
      // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
      setIsHydrated(true);
    }
  }, [isHydrated]); // isHydrated only changes once, safe for hydration detection

  const totalInvites =
    (workspaceStats?.campaigns.pendingInvites ?? 0) +
    (workspaceStats?.games.pendingInvites ?? 0);

  const membershipBadgeVariant = membershipStatus?.hasMembership
    ? "default"
    : "secondary";
  const membershipLabel = membershipStatus?.hasMembership ? "Active" : "Inactive";
  const membershipDetail = membershipStatus?.hasMembership
    ? membershipStatus.daysRemaining
      ? `${membershipStatus.daysRemaining} days remaining`
      : "Membership active"
    : "No active membership";

  const isLoading =
    workspaceStatsQuery.isLoading ||
    membershipStatusQuery.isLoading ||
    nextGameQuery.isLoading ||
    teamsQuery.isLoading;

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium">Membership</CardTitle>
          <Badge
            variant={membershipBadgeVariant}
            className={
              membershipStatus?.hasMembership
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                : undefined
            }
          >
            {membershipLabel}
          </Badge>
        </CardHeader>
        <CardContent className="text-muted-foreground flex flex-col gap-2 text-sm">
          <span>
            {!isHydrated || membershipStatusQuery.isLoading ? (
              <span className="bg-muted inline-block h-4 w-36 animate-pulse rounded" />
            ) : (
              membershipDetail
            )}
          </span>
          <Link to="/player/membership" className="text-primary text-xs font-medium">
            Manage membership
          </Link>
        </CardContent>
      </Card>

      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium">Next session</CardTitle>
          <CalendarDays className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent className="text-muted-foreground flex flex-col gap-2 text-sm">
          {!isHydrated || isLoading ? (
            <Skeleton className="h-4 w-40" />
          ) : nextGame ? (
            <>
              <span className="text-foreground font-medium">{nextGame.name}</span>
              <span>{formatDateAndTime(nextGame.dateTime)}</span>
              <span className="text-muted-foreground text-xs tracking-wide uppercase">
                {formatDistanceToNow(new Date(nextGame.dateTime), { addSuffix: true })}
              </span>
              <Link
                from="/player"
                to="/player/games/$gameId"
                params={{ gameId: nextGame.id }}
                className="text-primary text-xs font-medium"
              >
                View game details
              </Link>
            </>
          ) : (
            <span>No upcoming games scheduled</span>
          )}
        </CardContent>
      </Card>

      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium">Community</CardTitle>
          <Users className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent className="text-muted-foreground flex flex-col gap-2 text-sm">
          {!isHydrated || isLoading ? (
            <Skeleton className="h-4 w-32" />
          ) : (
            <>
              <span className="text-foreground font-medium">
                {firstTeam ? firstTeam.team.name : "You're not on a team yet"}
              </span>
              <span>
                {teams.length > 0
                  ? `${teams.length} team${teams.length === 1 ? "" : "s"} connected`
                  : "Join a team to coordinate sessions"}
              </span>
              <span>
                {totalInvites > 0
                  ? `${totalInvites} pending invite${totalInvites === 1 ? "" : "s"}`
                  : "No pending invitations"}
              </span>
              <Link to="/player/teams" className="text-primary text-xs font-medium">
                Browse teams
              </Link>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
