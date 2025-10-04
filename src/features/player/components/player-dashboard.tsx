import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import posthog from "posthog-js";
import { useEffect, useId, useMemo, useState } from "react";

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
import { Checkbox } from "~/components/ui/checkbox";
import {
  Calendar,
  CheckCircle2,
  CreditCard,
  ScrollText,
  Swords,
  Trophy,
  Users,
} from "~/components/ui/icons";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import {
  getDashboardStats,
  getNextUserGame,
} from "~/features/dashboard/dashboard.queries";
import { getUpcomingEvents } from "~/features/events/events.queries";
import type { EventWithDetails } from "~/features/events/events.types";
import type { GameListItem } from "~/features/games/games.types";
import { getUserMembershipStatus } from "~/features/membership/membership.queries";
import type { MembershipStatus } from "~/features/membership/membership.types";
import { updatePrivacySettings } from "~/features/profile/profile.mutations";
import { getUserProfile } from "~/features/profile/profile.queries";
import type {
  NotificationPreferences,
  PrivacySettings,
} from "~/features/profile/profile.types";
import {
  defaultNotificationPreferences,
  defaultPrivacySettings,
} from "~/features/profile/profile.types";
import { listPendingGMReviews } from "~/features/reviews/reviews.queries";
import { updateNotificationPreferences } from "~/features/settings/settings.mutations";
import { getUserTeams } from "~/features/teams/teams.queries";
import type { AuthUser } from "~/lib/auth/types";
import { formatDateAndTime } from "~/shared/lib/datetime";
import type { OperationResult } from "~/shared/types/common";

type PlayerPersonaProfile = {
  readonly profileComplete: boolean;
  readonly privacySettings: PrivacySettings;
  readonly notificationPreferences: NotificationPreferences;
};

type ProfileMutationContext = { previous: PlayerPersonaProfile | undefined };

type DashboardStatsData = {
  campaigns: { owned: number; member: number; pendingInvites: number };
  games: { owned: number; member: number; pendingInvites: number };
};

type MembershipStatusValue = MembershipStatus;

type NextGameOperationResult = OperationResult<GameListItem | null>;

type UserTeamsData = Awaited<ReturnType<typeof getUserTeams>>;
type UpcomingEventsData = EventWithDetails[];

const STORAGE_KEYS = {
  dashboardStats: "player-dashboard:stats",
  membership: "player-dashboard:membership",
  teams: "player-dashboard:teams",
  nextGame: "player-dashboard:next-game",
  events: "player-dashboard:events",
  reviews: "player-dashboard:reviews",
  profile: "player-dashboard:profile",
} as const;

function readStoredData<T>(key: string): T | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : undefined;
  } catch (error) {
    console.warn("Failed to parse stored dashboard payload", error);
    return undefined;
  }
}

function persistData<T>(key: string, value: T) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn("Failed to persist dashboard payload", error);
  }
}

function mergePrivacySettings(settings?: PrivacySettings): PrivacySettings {
  return { ...defaultPrivacySettings, ...(settings ?? {}) };
}

function mergeNotificationPreferences(
  preferences?: NotificationPreferences,
): NotificationPreferences {
  return {
    ...defaultNotificationPreferences,
    ...(preferences ?? {}),
  };
}

const DEFAULT_PROFILE_SNAPSHOT: PlayerPersonaProfile = {
  profileComplete: false,
  privacySettings: defaultPrivacySettings,
  notificationPreferences: defaultNotificationPreferences,
};

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
  const queryClient = useQueryClient();
  const [showSpotlight, setShowSpotlight] = useState(false);
  const isAuthenticated = Boolean(user?.id);

  useEffect(() => {
    posthog.onFeatureFlags(() => {
      setShowSpotlight(posthog.isFeatureEnabled("dashboard-new-card") ?? false);
    });
  }, []);

  const { data: personaProfile } = useQuery<PlayerPersonaProfile>({
    queryKey: ["player-profile"],
    queryFn: async () => {
      const result = await getUserProfile();
      if (!result.success || !result.data) {
        throw new Error(result.errors?.[0]?.message ?? "Failed to load player profile");
      }
      return {
        profileComplete: result.data.profileComplete ?? false,
        privacySettings: mergePrivacySettings(result.data.privacySettings),
        notificationPreferences: mergeNotificationPreferences(
          result.data.notificationPreferences,
        ),
      } satisfies PlayerPersonaProfile;
    },
    initialData: () =>
      readStoredData<PlayerPersonaProfile>(STORAGE_KEYS.profile) ??
      DEFAULT_PROFILE_SNAPSHOT,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!isAuthenticated || !personaProfile) {
      return;
    }
    persistData(STORAGE_KEYS.profile, personaProfile);
  }, [isAuthenticated, personaProfile]);

  const { profileComplete, privacySettings, notificationPreferences } =
    personaProfile ?? DEFAULT_PROFILE_SNAPSHOT;

  const dashboardStatsQuery = useQuery<DashboardStatsData | undefined, Error>({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const result = await getDashboardStats();
      if (!result.success) {
        const message =
          "errors" in result && result.errors?.[0]?.message
            ? result.errors[0]?.message
            : "Failed to fetch dashboard stats";
        throw new Error(message);
      }
      return result.data;
    },
    initialData: () =>
      readStoredData<DashboardStatsData>(STORAGE_KEYS.dashboardStats) ?? undefined,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    enabled: isAuthenticated,
  });
  const dashboardStats = dashboardStatsQuery.data;

  useEffect(() => {
    if (!isAuthenticated || !dashboardStats) {
      return;
    }
    persistData(STORAGE_KEYS.dashboardStats, dashboardStats);
  }, [dashboardStats, isAuthenticated]);

  const membershipStatusQuery = useQuery<MembershipStatusValue | null, Error>({
    queryKey: ["membership-status"],
    queryFn: async () => {
      const result = await getUserMembershipStatus();
      if (!result.success) {
        const message =
          "errors" in result && result.errors?.[0]?.message
            ? result.errors[0]?.message
            : "Failed to fetch membership status";
        throw new Error(message);
      }
      return result.data ?? null;
    },
    initialData: () =>
      readStoredData<MembershipStatusValue | null>(STORAGE_KEYS.membership) ?? null,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    enabled: isAuthenticated,
  });
  const membershipStatus = membershipStatusQuery.data;

  useEffect(() => {
    if (!isAuthenticated || membershipStatus === undefined) {
      return;
    }
    persistData(STORAGE_KEYS.membership, membershipStatus);
  }, [isAuthenticated, membershipStatus]);

  const userTeamsQuery = useQuery<UserTeamsData, Error>({
    queryKey: ["userTeams"],
    queryFn: async () => {
      const result = await getUserTeams({ data: {} });
      return result || [];
    },
    initialData: () => readStoredData<UserTeamsData>(STORAGE_KEYS.teams) ?? [],
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    enabled: isAuthenticated,
  });
  const userTeams = useMemo(() => userTeamsQuery.data ?? [], [userTeamsQuery.data]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    persistData(STORAGE_KEYS.teams, userTeams);
  }, [isAuthenticated, userTeams]);

  const nextGameQuery = useQuery<NextGameOperationResult | undefined, Error>({
    queryKey: ["next-user-game"],
    queryFn: async () => getNextUserGame(),
    initialData: () =>
      readStoredData<NextGameOperationResult>(STORAGE_KEYS.nextGame) ?? undefined,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    enabled: isAuthenticated,
  });
  const nextGameResult = nextGameQuery.data;

  useEffect(() => {
    if (!isAuthenticated || !nextGameResult) {
      return;
    }
    persistData(STORAGE_KEYS.nextGame, nextGameResult);
  }, [isAuthenticated, nextGameResult]);
  const nextGame = nextGameResult?.success ? nextGameResult.data : null;

  const upcomingEventsQuery = useQuery<UpcomingEventsData, Error>({
    queryKey: ["upcoming-events-dashboard"],
    queryFn: async () => getUpcomingEvents({ data: { limit: 3 } }),
    initialData: () => readStoredData<UpcomingEventsData>(STORAGE_KEYS.events) ?? [],
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    enabled: isAuthenticated,
  });
  const upcomingEventsRes = useMemo(
    () => upcomingEventsQuery.data ?? [],
    [upcomingEventsQuery.data],
  );

  useEffect(() => {
    if (!isAuthenticated || !Array.isArray(upcomingEventsRes)) {
      return;
    }
    persistData(STORAGE_KEYS.events, upcomingEventsRes);
  }, [isAuthenticated, upcomingEventsRes]);
  const upcomingEvents = useMemo(
    () => (Array.isArray(upcomingEventsRes) ? upcomingEventsRes : []),
    [upcomingEventsRes],
  );

  const pendingReviewsQuery = useQuery({
    queryKey: ["pending-gm-reviews-count"],
    queryFn: async (): Promise<number> => {
      const res = await listPendingGMReviews({ data: { days: 365 } });
      return res.success ? res.data.length : 0;
    },
    refetchOnMount: "always",
    initialData: () => readStoredData<number>(STORAGE_KEYS.reviews) ?? 0,
    enabled: isAuthenticated,
  });
  const pendingReviewsCount = pendingReviewsQuery.data ?? 0;

  useEffect(() => {
    if (!isAuthenticated || typeof pendingReviewsCount !== "number") {
      return;
    }
    persistData(STORAGE_KEYS.reviews, pendingReviewsCount);
  }, [isAuthenticated, pendingReviewsCount]);

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

  const topTeams = useMemo(
    () =>
      userTeams.slice(0, 2).map(
        (
          entry,
        ): {
          id: string;
          name: string;
          memberCount: number;
          role: string;
        } => ({
          id: entry.team.id,
          name: entry.team.name,
          memberCount: entry.memberCount,
          role: entry.membership.role ?? "member",
        }),
      ),
    [userTeams],
  );

  const privacyMutation = useMutation<
    PrivacySettings,
    Error,
    Partial<PrivacySettings>,
    ProfileMutationContext
  >({
    mutationFn: async (patch) => {
      const payload = mergePrivacySettings({
        ...privacySettings,
        ...patch,
      });
      const result = await updatePrivacySettings({ data: payload });
      if (!result.success || !result.data?.privacySettings) {
        throw new Error(
          result.errors?.[0]?.message || "Failed to update privacy settings",
        );
      }
      return mergePrivacySettings(result.data.privacySettings);
    },
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey: ["player-profile"] });
      const previous = queryClient.getQueryData<PlayerPersonaProfile>(["player-profile"]);
      const optimistic = previous
        ? {
            ...previous,
            privacySettings: {
              ...previous.privacySettings,
              ...patch,
            },
          }
        : {
            ...DEFAULT_PROFILE_SNAPSHOT,
            privacySettings: {
              ...DEFAULT_PROFILE_SNAPSHOT.privacySettings,
              ...patch,
            },
          };
      queryClient.setQueryData(["player-profile"], optimistic);
      persistData(STORAGE_KEYS.profile, optimistic);
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["player-profile"], context.previous);
        persistData(STORAGE_KEYS.profile, context.previous);
      }
    },
    onSuccess: (settings) => {
      let snapshot: PlayerPersonaProfile | undefined;
      queryClient.setQueryData<PlayerPersonaProfile | undefined>(
        ["player-profile"],
        (current) => {
          const next = current
            ? { ...current, privacySettings: settings }
            : { ...DEFAULT_PROFILE_SNAPSHOT, privacySettings: settings };
          snapshot = next;
          return next;
        },
      );
      if (snapshot) {
        persistData(STORAGE_KEYS.profile, snapshot);
      }
      posthog.capture("player_privacy_setting_updated", {
        source: "player-dashboard",
        settingCount: Object.keys(settings).length,
      });
    },
  });

  const notificationMutation = useMutation<
    NotificationPreferences,
    Error,
    Partial<NotificationPreferences>,
    ProfileMutationContext
  >({
    mutationFn: async (patch) => {
      const payload = mergeNotificationPreferences({
        ...notificationPreferences,
        ...patch,
      });
      const result = await updateNotificationPreferences({ data: payload });
      if (!result.success || !result.data) {
        throw new Error(
          result.errors?.[0]?.message || "Failed to update notification preferences",
        );
      }
      return mergeNotificationPreferences(result.data);
    },
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey: ["player-profile"] });
      const previous = queryClient.getQueryData<PlayerPersonaProfile>(["player-profile"]);
      const optimistic = previous
        ? {
            ...previous,
            notificationPreferences: {
              ...previous.notificationPreferences,
              ...patch,
            },
          }
        : {
            ...DEFAULT_PROFILE_SNAPSHOT,
            notificationPreferences: {
              ...DEFAULT_PROFILE_SNAPSHOT.notificationPreferences,
              ...patch,
            },
          };
      queryClient.setQueryData(["player-profile"], optimistic);
      persistData(STORAGE_KEYS.profile, optimistic);
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["player-profile"], context.previous);
        persistData(STORAGE_KEYS.profile, context.previous);
      }
    },
    onSuccess: (preferences) => {
      let snapshot: PlayerPersonaProfile | undefined;
      queryClient.setQueryData<PlayerPersonaProfile | undefined>(
        ["player-profile"],
        (current) => {
          const next = current
            ? { ...current, notificationPreferences: preferences }
            : { ...DEFAULT_PROFILE_SNAPSHOT, notificationPreferences: preferences };
          snapshot = next;
          return next;
        },
      );
      if (snapshot) {
        persistData(STORAGE_KEYS.profile, snapshot);
      }
      posthog.capture("player_notification_preference_updated", {
        source: "player-dashboard",
        toggled: Object.entries(preferences).filter(([, value]) => value).length,
      });
    },
  });

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
          <CardHeader className="space-y-3">
            <CardTitle className="text-foreground flex items-center gap-2 text-base font-semibold">
              <Trophy className="h-4 w-4" /> Your control center
            </CardTitle>
            <CardDescription>
              Tune visibility, stay notified, and jump into actions without leaving HQ.
            </CardDescription>
            <Badge
              variant={profileComplete ? "secondary" : "outline"}
              className="border-primary/30 w-fit text-xs font-semibold tracking-widest uppercase"
            >
              {profileComplete ? "Profile dialed in" : "Profile steps remaining"}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-3">
              <p className="text-muted-foreground text-xs tracking-widest uppercase">
                Privacy
              </p>
              <QuickToggle
                label="Only allow invites from connections"
                description="Gate new invitations to trusted contacts."
                checked={privacySettings.allowInvitesOnlyFromConnections ?? false}
                disabled={privacyMutation.isPending}
                onCheckedChange={(value) => {
                  privacyMutation.mutate({
                    allowInvitesOnlyFromConnections: value,
                  });
                }}
              />
              <QuickToggle
                label="Allow follow requests"
                description="Let community members follow your updates."
                checked={privacySettings.allowFollows}
                disabled={privacyMutation.isPending}
                onCheckedChange={(value) => {
                  privacyMutation.mutate({ allowFollows: value });
                }}
              />
            </div>
            <Separator />
            <div className="space-y-3">
              <p className="text-muted-foreground text-xs tracking-widest uppercase">
                Notifications
              </p>
              <QuickToggle
                label="Game reminders"
                description="Get nudges before sessions start."
                checked={notificationPreferences.gameReminders}
                disabled={notificationMutation.isPending}
                onCheckedChange={(value) => {
                  notificationMutation.mutate({ gameReminders: value });
                }}
              />
              <QuickToggle
                label="Review reminders"
                description="Stay accountable to your GMs."
                checked={notificationPreferences.reviewReminders}
                disabled={notificationMutation.isPending}
                onCheckedChange={(value) => {
                  notificationMutation.mutate({ reviewReminders: value });
                }}
              />
            </div>
            <Separator />
            <div className="grid gap-2 sm:grid-cols-2">
              <Button asChild variant="outline" className="justify-start gap-2">
                <Link
                  to="/player/profile"
                  onClick={() => {
                    posthog.capture("player_dashboard_action_selected", {
                      action: "profile",
                    });
                  }}
                >
                  <Users className="h-4 w-4" /> Update profile details
                </Link>
              </Button>
              <Button asChild className="justify-start gap-2">
                <Link
                  to="/player/membership"
                  onClick={() => {
                    posthog.capture("player_dashboard_action_selected", {
                      action: "membership",
                    });
                  }}
                >
                  <CreditCard className="h-4 w-4" />
                  {membershipStatus?.hasMembership
                    ? "Manage membership"
                    : "Activate membership"}
                </Link>
              </Button>
              <Button
                asChild
                variant="secondary"
                className="justify-start gap-2 sm:col-span-2"
              >
                <Link
                  to="/search"
                  onClick={() => {
                    posthog.capture("player_dashboard_action_selected", {
                      action: "discover-games",
                    });
                  }}
                >
                  <Calendar className="h-4 w-4" /> Find a new game night
                </Link>
              </Button>
            </div>
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
                  <Link to={`/player/games/${nextGame.id}`}>Open session briefing</Link>
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
              <Link
                to="/search"
                onClick={() => {
                  posthog.capture("player_dashboard_action_selected", {
                    action: "see-all-events",
                  });
                }}
              >
                See all events
              </Link>
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
        <div className="flex flex-col gap-4">
          <Card className="border-muted-foreground/20">
            <CardHeader>
              <CardTitle className="text-foreground text-base font-semibold">
                Connections radar
              </CardTitle>
              <CardDescription>
                Spotlight on crews that rely on you for momentum this week.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {topTeams.length === 0 ? (
                <EmptyState message="No teams synced yet. Join a crew to get started." />
              ) : (
                <div className="space-y-3">
                  {topTeams.map((team) => (
                    <Link
                      key={team.id}
                      to={`/player/teams/${team.id}`}
                      className="border-muted-foreground/30 hover:border-primary/60 flex items-center justify-between rounded-lg border px-3 py-3 transition-colors"
                    >
                      <div>
                        <p className="text-foreground text-sm font-medium">{team.name}</p>
                        <p className="text-muted-foreground text-xs">
                          {team.role === "owner"
                            ? "You lead this team"
                            : `Role: ${team.role}`}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs font-semibold">
                        {team.memberCount} members
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
              <Button
                asChild
                variant="ghost"
                className="text-primary hover:text-primary justify-start"
              >
                <Link
                  to="/player/teams"
                  onClick={() => {
                    posthog.capture("player_dashboard_action_selected", {
                      action: "teams",
                    });
                  }}
                >
                  Manage teams
                </Link>
              </Button>
              {showSpotlight ? (
                <div className="border-primary/40 bg-primary/5 rounded-lg border px-3 py-3 text-sm">
                  <p className="text-primary font-medium">Beta preview</p>
                  <p className="text-muted-foreground">
                    Advanced teammate recommendations are warming up. Expect curated
                    boosts soon.
                  </p>
                </div>
              ) : null}
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
        </div>
      </section>
    </div>
  );
}

function QuickToggle({
  label,
  description,
  checked,
  disabled,
  onCheckedChange,
}: {
  readonly label: string;
  readonly description: string;
  readonly checked: boolean;
  readonly disabled?: boolean;
  readonly onCheckedChange: (value: boolean) => void;
}) {
  const controlId = useId();
  return (
    <div className="border-muted-foreground/30 flex items-start justify-between gap-3 rounded-lg border px-3 py-3">
      <div className="space-y-1">
        <Label htmlFor={controlId} className="text-foreground text-sm font-medium">
          {label}
        </Label>
        <p className="text-muted-foreground text-xs">{description}</p>
      </div>
      <Checkbox
        id={controlId}
        checked={checked}
        disabled={disabled}
        onCheckedChange={(value) => onCheckedChange(value === true)}
      />
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
