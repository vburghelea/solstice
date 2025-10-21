import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
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
import { formatDistanceToNowLocalized } from "~/lib/i18n/utils";

import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { LocalizedLink } from "~/components/ui/LocalizedLink";
import { Skeleton } from "~/components/ui/skeleton";
import { RoleWorkspaceLayout } from "~/features/layouts/role-workspace-layout";
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
import { useNavigationTranslation } from "~/hooks/useTypedTranslation";
import { requireAuth, requireAuthAndProfile } from "~/lib/auth/guards/route-guards";
import { WORKSPACE_FEATURE_FLAGS } from "~/lib/feature-flag-keys";
import { useFeatureFlag } from "~/lib/feature-flags";
import { formatDateAndTime } from "~/shared/lib/datetime";

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
  const { t } = useNavigationTranslation();
  const { resolution } = Route.useLoaderData() as { resolution: PersonaResolution };
  const loadResolution = useServerFn(resolvePersonaResolution);
  const { user } = Route.useRouteContext();
  const showSharedInbox = useFeatureFlag(WORKSPACE_FEATURE_FLAGS.sharedInbox);
  const showCollaboration = useFeatureFlag(WORKSPACE_FEATURE_FLAGS.collaboration);

  const basePlayerNavigation = useMemo(
    () => [
      {
        label: t("workspaces.player.nav.overview.label"),
        to: "/player",
        icon: Home,
        exact: true,
        description: t("workspaces.player.nav.overview.description"),
      },
      {
        label: t("workspaces.player.nav.campaigns.label"),
        to: "/player/campaigns",
        icon: ScrollText,
        description: t("workspaces.player.nav.campaigns.description"),
      },
      {
        label: t("workspaces.player.nav.games.label"),
        to: "/player/games",
        icon: Gamepad2,
        description: t("workspaces.player.nav.games.description"),
      },
      {
        label: t("workspaces.player.nav.events.label"),
        to: "/player/events",
        icon: CalendarDays,
        description: t("workspaces.player.nav.events.description"),
      },
      {
        label: t("workspaces.player.nav.teams.label"),
        to: "/player/teams",
        icon: Users2,
        description: t("workspaces.player.nav.teams.description"),
      },
      {
        label: t("workspaces.player.nav.inbox.label"),
        to: "/player/inbox",
        icon: Inbox,
        description: t("workspaces.player.nav.inbox.description"),
      },
      {
        label: t("workspaces.player.nav.collaboration.label"),
        to: "/player/collaboration",
        icon: Users,
        inMobileNav: false,
        description: t("workspaces.player.nav.collaboration.description"),
      },
      {
        label: t("workspaces.player.nav.profile.label"),
        to: "/player/profile",
        icon: UserCircle,
        section: "account" as const,
        description: t("workspaces.player.nav.profile.description"),
      },
      {
        label: t("workspaces.player.nav.settings.label"),
        to: "/player/settings",
        icon: Settings,
        section: "account" as const,
        description: t("workspaces.player.nav.settings.description"),
      },
    ],
    [t],
  );

  const navigationItems = useMemo(() => {
    return basePlayerNavigation.filter((item) => {
      if (item.to === "/player/inbox") {
        return showSharedInbox;
      }

      if (item.to === "/player/collaboration") {
        return showCollaboration;
      }

      return true;
    });
  }, [basePlayerNavigation, showCollaboration, showSharedInbox]);

  const workspaceSubtitle = user?.name
    ? t("workspaces.player.welcome_back", { name: user.name })
    : t("workspaces.player.welcome_back_generic");
  const workspaceLabel = user?.name ? user.name : t("workspaces.player.fallback_label");

  return (
    <RoleSwitcherProvider
      initialResolution={resolution}
      onSwitch={async (personaId) =>
        loadResolution({ data: { preferredPersonaId: personaId, forceRefresh: true } })
      }
    >
      <RoleWorkspaceLayout
        title={t("workspaces.player.title")}
        description={t("workspaces.player.description")}
        navItems={navigationItems}
        fallbackLabel={t("workspaces.player.fallback_label")}
        subtitle={workspaceSubtitle}
        workspaceLabel={workspaceLabel}
        headerSlot={<PlayerWorkspaceSummary />}
      />
    </RoleSwitcherProvider>
  );
}

function PlayerWorkspaceSummary() {
  const { t, currentLanguage } = useNavigationTranslation();
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
  const membershipLabel = membershipStatus?.hasMembership
    ? t("workspaces.player.summary.active")
    : t("workspaces.player.summary.inactive");
  const membershipDetail = membershipStatus?.hasMembership
    ? membershipStatus.daysRemaining
      ? t("workspaces.player.summary.days_remaining", {
          days: membershipStatus.daysRemaining,
        })
      : t("workspaces.player.summary.membership_active")
    : t("workspaces.player.summary.no_active_membership");

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
          <CardTitle className="text-sm font-medium">
            {t("workspaces.player.summary.membership")}
          </CardTitle>
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
          <LocalizedLink
            to="/player/membership"
            translationKey="links.membership.manage_membership"
            className="text-primary text-xs font-medium"
          >
            {t("workspaces.player.summary.manage_membership")}
          </LocalizedLink>
        </CardContent>
      </Card>

      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium">
            {t("workspaces.player.summary.next_session")}
          </CardTitle>
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
                {formatDistanceToNowLocalized(
                  new Date(nextGame.dateTime),
                  currentLanguage,
                  { addSuffix: true },
                )}
              </span>
              <LocalizedLink
                to="/player/games/$gameId"
                params={{ gameId: nextGame.id }}
                translationKey="links.game_management.view_game_details"
                ariaLabelTranslationKey="links.accessibility.link_aria_label.game_details"
                className="text-primary text-xs font-medium"
              >
                {t("workspaces.player.summary.view_game_details")}
              </LocalizedLink>
            </>
          ) : (
            <span>{t("workspaces.player.summary.no_upcoming_games")}</span>
          )}
        </CardContent>
      </Card>

      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium">
            {t("workspaces.player.summary.community")}
          </CardTitle>
          <Users className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent className="text-muted-foreground flex flex-col gap-2 text-sm">
          {!isHydrated || isLoading ? (
            <Skeleton className="h-4 w-32" />
          ) : (
            <>
              <span className="text-foreground font-medium">
                {firstTeam
                  ? firstTeam.team.name
                  : t("workspaces.player.summary.not_on_a_team")}
              </span>
              <span>
                {teams.length > 0
                  ? t("workspaces.player.summary.teams_connected", {
                      count: teams.length,
                      plural: teams.length === 1 ? "" : "s",
                    })
                  : t("workspaces.player.summary.join_a_team")}
              </span>
              <span>
                {totalInvites > 0
                  ? t("workspaces.player.summary.pending_invites", {
                      count: totalInvites,
                      plural: totalInvites === 1 ? "" : "s",
                    })
                  : t("workspaces.player.summary.no_pending_invitations")}
              </span>
              <LocalizedLink
                to="/player/teams"
                translationKey="links.team_management.browse_teams"
                className="text-primary text-xs font-medium"
              >
                {t("workspaces.player.summary.browse_teams")}
              </LocalizedLink>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
