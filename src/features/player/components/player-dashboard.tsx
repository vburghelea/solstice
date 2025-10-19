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
import { getUpcomingEvents } from "~/features/events/events.queries";
import type { EventWithDetails } from "~/features/events/events.types";
import type { GameListItem } from "~/features/games/games.types";
import { getUserMembershipStatus } from "~/features/membership/membership.queries";
import type { MembershipStatus } from "~/features/membership/membership.types";
import {
  getNextPlayerGame,
  getPlayerWorkspaceStats,
} from "~/features/player/player.queries";
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
import { updateNotificationPreferences } from "~/features/settings/settings.mutations";
import { listPendingGMReviews } from "~/features/social/social.queries";
import type { PendingGMReviewItem } from "~/features/social/social.types";
import { getUserTeams } from "~/features/teams/teams.queries";
import { useCommonTranslation, usePlayerTranslation } from "~/hooks/useTypedTranslation";
import type { AuthUser } from "~/lib/auth/types";
import { formatDateAndTime } from "~/shared/lib/datetime";
import type { OperationResult } from "~/shared/types/common";

type PlayerPersonaProfile = {
  readonly profileComplete: boolean;
  readonly privacySettings: PrivacySettings;
  readonly notificationPreferences: NotificationPreferences;
};

type ProfileMutationContext = { previous: PlayerPersonaProfile | undefined };

type PlayerWorkspaceStatsData = {
  campaigns: { owned: number; member: number; pendingInvites: number };
  games: { owned: number; member: number; pendingInvites: number };
};

type MembershipStatusValue = MembershipStatus;

type NextGameOperationResult = OperationResult<GameListItem | null>;

type UserTeamsData = Awaited<ReturnType<typeof getUserTeams>>;
type UpcomingEventsData = EventWithDetails[];

const STORAGE_KEYS = {
  workspaceStats: "player-workspace:stats",
  membership: "player-workspace:membership",
  teams: "player-workspace:teams",
  nextGame: "player-workspace:next-game",
  events: "player-workspace:events",
  reviews: "player-workspace:reviews",
  profile: "player-workspace:profile",
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

function initialsFromName(name?: string | null, defaultInitial = "P") {
  if (!name) {
    return defaultInitial;
  }
  const [first, second] = name.split(" ");
  if (first && second) {
    return `${first[0]}${second[0]}`.toUpperCase();
  }
  if (first) {
    return first.slice(0, 2).toUpperCase();
  }
  return defaultInitial;
}

function normalizePendingReview(entry: unknown): PendingGMReviewItem | null {
  if (!entry || typeof entry !== "object") {
    return null;
  }

  const candidate = entry as {
    gameId?: unknown;
    gameName?: unknown;
    dateTime?: unknown;
    gm?: {
      id?: unknown;
      name?: unknown;
      gmRating?: unknown;
    };
  };

  if (typeof candidate.gameId !== "string" || typeof candidate.gameName !== "string") {
    return null;
  }

  const rawDate = candidate.dateTime;
  if (
    !(
      rawDate instanceof Date ||
      typeof rawDate === "string" ||
      typeof rawDate === "number"
    )
  ) {
    return null;
  }
  const parsedDate = rawDate instanceof Date ? rawDate : new Date(rawDate);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  const gm = candidate.gm;
  if (!gm || typeof gm !== "object") {
    return null;
  }

  const gmId = (gm as { id?: unknown }).id;
  if (typeof gmId !== "string") {
    return null;
  }

  const gmName = (gm as { name?: unknown }).name;
  const gmRating = (gm as { gmRating?: unknown }).gmRating;

  const normalizedGm: PendingGMReviewItem["gm"] = {
    id: gmId,
    name: typeof gmName === "string" ? gmName : null,
  };
  if (typeof gmRating === "number") {
    normalizedGm.gmRating = gmRating;
  } else if (gmRating === null) {
    normalizedGm.gmRating = null;
  }

  return {
    gameId: candidate.gameId,
    gameName: candidate.gameName,
    dateTime: parsedDate,
    gm: normalizedGm,
  };
}

export function PlayerDashboard({ user }: { readonly user: AuthUser | null }) {
  const { t: playerT } = usePlayerTranslation();
  const { t: commonT } = useCommonTranslation();
  const queryClient = useQueryClient();
  const [showSpotlight, setShowSpotlight] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const isAuthenticated = Boolean(user?.id);

  useEffect(() => {
    if (!isHydrated) {
      // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
      setIsHydrated(true);
    }
  }, [isHydrated]); // isHydrated only changes once, safe for hydration detection

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
        throw new Error(
          result.errors?.[0]?.message ??
            playerT("dashboard.errors.failed_to_load_profile"),
        );
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

  const workspaceStatsQuery = useQuery<PlayerWorkspaceStatsData | undefined, Error>({
    queryKey: ["player-workspace-stats"],
    queryFn: async () => {
      const result = await getPlayerWorkspaceStats();
      if (!result.success) {
        const message =
          "errors" in result && result.errors?.[0]?.message
            ? result.errors[0]?.message
            : playerT("dashboard.errors.failed_to_fetch_workspace_stats");
        throw new Error(message);
      }
      return result.data;
    },
    initialData: () =>
      readStoredData<PlayerWorkspaceStatsData>(STORAGE_KEYS.workspaceStats) ?? undefined,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    enabled: isAuthenticated,
  });
  const workspaceStats =
    !isHydrated || workspaceStatsQuery.isLoading ? undefined : workspaceStatsQuery.data;

  useEffect(() => {
    if (!isAuthenticated || !workspaceStats) {
      return;
    }
    persistData(STORAGE_KEYS.workspaceStats, workspaceStats);
  }, [isAuthenticated, workspaceStats]);

  const membershipStatusQuery = useQuery<MembershipStatusValue | null, Error>({
    queryKey: ["membership-status"],
    queryFn: async () => {
      const result = await getUserMembershipStatus();
      if (!result.success) {
        const message =
          "errors" in result && result.errors?.[0]?.message
            ? result.errors[0]?.message
            : playerT("dashboard.errors.failed_to_fetch_membership_status");
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
  const membershipStatus =
    !isHydrated || membershipStatusQuery.isLoading
      ? undefined
      : membershipStatusQuery.data;

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
  const userTeams = useMemo(
    () => (!isHydrated || userTeamsQuery.isLoading ? [] : (userTeamsQuery.data ?? [])),
    [isHydrated, userTeamsQuery.isLoading, userTeamsQuery.data],
  );

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    persistData(STORAGE_KEYS.teams, userTeams);
  }, [isAuthenticated, userTeams]);

  const nextGameQuery = useQuery<NextGameOperationResult | undefined, Error>({
    queryKey: ["next-player-game"],
    queryFn: async () => getNextPlayerGame(),
    initialData: () =>
      readStoredData<NextGameOperationResult>(STORAGE_KEYS.nextGame) ?? undefined,
    initialDataUpdatedAt: () => 0,
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
  const nextGame =
    !isHydrated || nextGameQuery.isLoading
      ? null
      : nextGameResult?.success
        ? nextGameResult.data
        : null;

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

  const pendingReviewsQuery = useQuery<PendingGMReviewItem[]>({
    queryKey: ["pending-gm-reviews"],
    queryFn: async () => {
      const res = await listPendingGMReviews({ data: { days: 365 } });
      if (!res.success || !Array.isArray(res.data)) {
        return [];
      }
      return res.data
        .map((item) => normalizePendingReview(item))
        .filter((item): item is PendingGMReviewItem => Boolean(item));
    },
    refetchOnMount: "always",
    initialData: () => {
      const cached = readStoredData<unknown>(STORAGE_KEYS.reviews);
      if (!Array.isArray(cached)) {
        return [];
      }
      return cached
        .map((item) => normalizePendingReview(item))
        .filter((item): item is PendingGMReviewItem => Boolean(item));
    },
    enabled: isAuthenticated,
  });
  const pendingReviews = useMemo(
    () =>
      !isHydrated || pendingReviewsQuery.isLoading
        ? []
        : (pendingReviewsQuery.data ?? []),
    [isHydrated, pendingReviewsQuery.isLoading, pendingReviewsQuery.data],
  );
  const pendingReviewsCount = pendingReviews.length;

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    persistData(STORAGE_KEYS.reviews, pendingReviews);
  }, [isAuthenticated, pendingReviews]);

  const teamCount = userTeams.length;
  const membershipLabel = membershipStatus?.hasMembership
    ? playerT("dashboard.membership.status_active")
    : playerT("dashboard.membership.status_inactive");
  const membershipDetail = membershipStatus?.hasMembership
    ? membershipStatus.daysRemaining
      ? `${membershipStatus.daysRemaining} days remaining`
      : playerT("dashboard.membership.active")
    : playerT("dashboard.membership.no_active_membership");

  const campaignsSummary = workspaceStats?.campaigns ?? {
    owned: 0,
    member: 0,
    pendingInvites: 0,
  };
  const gamesSummary = workspaceStats?.games ?? {
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
          result.errors?.[0]?.message ||
            playerT("dashboard.errors.failed_to_update_privacy_settings"),
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
          result.errors?.[0]?.message ||
            playerT("dashboard.errors.failed_to_update_notification_preferences"),
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
                name={user?.name ?? commonT("default_values.player_name")}
                fallback={initialsFromName(
                  user?.name,
                  playerT("dashboard.persona_initial"),
                )}
                className="h-12 w-12 border border-white/20 shadow-sm"
              />
              <div>
                <p className="text-muted-foreground text-xs tracking-widest uppercase">
                  {playerT("dashboard.ui.headquarters.title")}
                </p>
                <h1 className="text-foreground text-2xl font-semibold sm:text-3xl">
                  {playerT("dashboard.ui.welcome_back")}
                  {user?.name?.trim() ? `, ${user.name.trim()}` : ""}
                </h1>
              </div>
            </div>
            <p className="text-muted-foreground max-w-xl text-sm sm:text-base">
              {playerT("dashboard.ui.subtitle")}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <Badge variant="outline" className="border-primary/40 text-primary">
                <CheckCircle2 className="mr-2 h-3.5 w-3.5" />{" "}
                {playerT("dashboard.ui.badges.privacy_ready")}
              </Badge>
              <Badge
                variant="secondary"
                className="bg-secondary/60 text-secondary-foreground"
              >
                {playerT("dashboard.ui.teams_synced", {
                  count: teamCount,
                  plural: teamCount === 1 ? "" : "s",
                })}
              </Badge>
            </div>
          </CardHeader>
          {pendingReviewsCount > 0 ? (
            <CardContent className="bg-background/70 relative z-10 border-t border-white/10 p-4 sm:p-6">
              <div className="text-primary flex items-center gap-2 text-xs font-semibold tracking-widest uppercase sm:text-sm">
                <ScrollText className="h-4 w-4" />
                {playerT("dashboard.ui.review_reminders.title")}
              </div>
              <div className="mt-3 space-y-2">
                {pendingReviews.map((review) => (
                  <Link
                    key={`${review.gameId}-${review.dateTime.toISOString()}`}
                    to={`/player/games/${review.gameId}#gm-review`}
                    className="group border-primary/30 bg-primary/10 hover:border-primary/50 hover:bg-primary/15 flex items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition"
                  >
                    <div className="flex min-w-0 flex-col">
                      <span className="text-foreground truncate font-medium">
                        {review.gameName}
                      </span>
                      <span className="text-muted-foreground mt-1 text-xs">
                        {playerT("dashboard.ui.review_gm", {
                          gmName: review.gm.name ?? "your GM",
                          date: formatDateAndTime(review.dateTime),
                        })}
                      </span>
                    </div>
                    <span className="text-primary group-hover:text-primary/80 text-xs font-semibold tracking-widest uppercase transition">
                      {playerT("dashboard.ui.start_review")}
                    </span>
                  </Link>
                ))}
              </div>
            </CardContent>
          ) : null}
        </Card>
        <Card className="border-muted-foreground/20">
          <CardHeader className="space-y-3">
            <CardTitle className="text-foreground flex items-center gap-2 text-base font-semibold">
              <Trophy className="h-4 w-4" />{" "}
              {playerT("dashboard.ui.control_center.title")}
            </CardTitle>
            <CardDescription>
              {playerT("dashboard.ui.control_center.subtitle")}
            </CardDescription>
            {isHydrated && (
              <Badge
                variant={profileComplete ? "secondary" : "outline"}
                className="border-primary/30 w-fit text-xs font-semibold tracking-widest uppercase"
              >
                {profileComplete
                  ? playerT("dashboard.ui.badges.profile_complete")
                  : playerT("dashboard.ui.badges.profile_steps_remaining")}
              </Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-3">
              <p className="text-muted-foreground text-xs tracking-widest uppercase">
                {commonT("account.sections.privacy")}
              </p>
              <QuickToggle
                label={playerT("dashboard.privacy.invites_from_connections.label")}
                description={playerT(
                  "dashboard.privacy.invites_from_connections.description",
                )}
                checked={privacySettings.allowInvitesOnlyFromConnections ?? false}
                disabled={privacyMutation.isPending}
                onCheckedChange={(value) => {
                  privacyMutation.mutate({
                    allowInvitesOnlyFromConnections: value,
                  });
                }}
              />
              <QuickToggle
                label={playerT("dashboard.privacy.follow_requests.label")}
                description={playerT("dashboard.privacy.follow_requests.description")}
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
                {commonT("account.sections.notifications")}
              </p>
              <QuickToggle
                label={playerT("dashboard.notifications.game_reminders.label")}
                description={playerT(
                  "dashboard.notifications.game_reminders.description",
                )}
                checked={notificationPreferences.gameReminders}
                disabled={notificationMutation.isPending}
                onCheckedChange={(value) => {
                  notificationMutation.mutate({ gameReminders: value });
                }}
              />
              <QuickToggle
                label={playerT("dashboard.notifications.review_reminders.label")}
                description={playerT(
                  "dashboard.notifications.review_reminders.description",
                )}
                checked={notificationPreferences.reviewReminders}
                disabled={notificationMutation.isPending}
                onCheckedChange={(value) => {
                  notificationMutation.mutate({ reviewReminders: value });
                }}
              />
            </div>
            <Separator />
            <div className="grid gap-2">
              <Button
                asChild
                variant="outline"
                className="w-full justify-center gap-2 text-center"
              >
                <Link
                  to="/player/profile"
                  onClick={() => {
                    posthog.capture("player_dashboard_action_selected", {
                      action: "profile",
                    });
                  }}
                >
                  <Users className="h-4 w-4" />{" "}
                  {playerT("dashboard.actions.edit_profile")}
                </Link>
              </Button>
              <Button asChild className="w-full justify-center gap-2 text-center">
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
                    ? playerT("dashboard.actions.manage_plan")
                    : playerT("dashboard.actions.start_membership")}
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-muted/40 bg-muted/20 text-foreground hover:bg-muted/30 w-full justify-center gap-2 text-center"
              >
                <Link
                  to="/search"
                  onClick={() => {
                    posthog.capture("player_dashboard_action_selected", {
                      action: "discover-games",
                    });
                  }}
                >
                  <Calendar className="h-4 w-4" />{" "}
                  {playerT("dashboard.actions.find_games")}
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
                {playerT("dashboard.ui.upcoming.title")}
              </p>
              <CardTitle className="text-foreground text-xl font-semibold">
                {nextGame ? nextGame.name : playerT("dashboard.upcoming_games.no_games")}
              </CardTitle>
            </div>
            <Badge variant="outline" className="border-muted text-xs font-medium">
              {nextGame
                ? formatTimeDistance(new Date(nextGame.dateTime))
                : playerT("dashboard.upcoming_games.stay_available")}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {nextGame ? (
              <div className="space-y-3">
                <p className="text-muted-foreground text-sm">
                  {formatDateAndTime(nextGame.dateTime)} · {nextGame.location.address}
                </p>
                <Button asChild>
                  <Link to={`/player/games/${nextGame.id}`}>
                    {playerT("dashboard.actions.open_session_briefing")}
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-muted-foreground text-sm">
                  {playerT("dashboard.ui.flexible_calendar")}
                </p>
                <Button
                  asChild
                  variant="outline"
                  className="border-muted/40 bg-muted/20 text-foreground hover:bg-muted/30"
                >
                  <Link to="/search">{playerT("dashboard.ui.discover_sessions")}</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="border-muted-foreground/20">
          <CardHeader>
            <CardTitle className="text-foreground text-base font-semibold">
              {playerT("dashboard.ui.relationship_health.title")}
            </CardTitle>
            <CardDescription>
              {playerT("dashboard.ui.relationship_health.subtitle")}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-muted-foreground text-xs tracking-widest uppercase">
                {playerT("dashboard.ui.membership_label")}
              </p>
              <p className="text-foreground mt-1 text-lg font-semibold">
                {membershipLabel}
              </p>
              <p className="text-muted-foreground text-sm">{membershipDetail}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs tracking-widest uppercase">
                {playerT("dashboard.ui.pending_reviews_label")}
              </p>
              <p className="text-foreground mt-1 text-lg font-semibold">
                {pendingReviewsCount}
              </p>
              <p className="text-muted-foreground text-sm">
                {pendingReviewsCount === 0
                  ? playerT("dashboard.pending_reviews.all_caught_up")
                  : playerT("dashboard.pending_reviews.share_stories")}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs tracking-widest uppercase">
                {playerT("dashboard.ui.teams_label")}
              </p>
              <p className="text-foreground mt-1 text-lg font-semibold">{teamCount}</p>
              <p className="text-muted-foreground text-sm">
                {teamCount === 0
                  ? playerT("dashboard.teams.join_crew")
                  : playerT("dashboard.teams.active_teams")}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs tracking-widest uppercase">
                {playerT("dashboard.ui.upcoming_events_label")}
              </p>
              <p className="text-foreground mt-1 text-lg font-semibold">
                {upcomingEvents.length}
              </p>
              <p className="text-muted-foreground text-sm">
                {upcomingEvents.length === 0
                  ? playerT("dashboard.teams.watch_calendar")
                  : playerT("dashboard.teams.opportunities_waiting")}
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="border-muted-foreground/20">
          <CardHeader>
            <CardTitle className="text-foreground text-base font-semibold">
              {playerT("dashboard.ui.campaign_commitments.title")}
            </CardTitle>
            <CardDescription>
              {playerT("dashboard.ui.campaign_commitments.subtitle")}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <StatPill
              label={playerT("dashboard.stats.organizer")}
              value={campaignsSummary.owned}
              icon={<ScrollText className="h-4 w-4" />}
            />
            <StatPill
              label={playerT("dashboard.stats.player")}
              value={campaignsSummary.member}
              icon={<Users className="h-4 w-4" />}
            />
            <StatPill
              label={playerT("dashboard.stats.invites")}
              value={campaignsSummary.pendingInvites}
              icon={<Calendar className="h-4 w-4" />}
            />
          </CardContent>
        </Card>
        <Card className="border-muted-foreground/20">
          <CardHeader>
            <CardTitle className="text-foreground text-base font-semibold">
              {playerT("dashboard.ui.game_roster.title")}
            </CardTitle>
            <CardDescription>
              {playerT("dashboard.ui.game_roster.subtitle")}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <StatPill
              label={playerT("dashboard.stats.organizer")}
              value={gamesSummary.owned}
              icon={<Swords className="h-4 w-4" />}
            />
            <StatPill
              label={playerT("dashboard.stats.player")}
              value={gamesSummary.member}
              icon={<Users className="h-4 w-4" />}
            />
            <StatPill
              label={playerT("dashboard.stats.invites")}
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
                {playerT("dashboard.ui.events_exploring.title")}
              </CardTitle>
              <CardDescription>
                {playerT("dashboard.ui.events_exploring.subtitle")}
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
                {playerT("dashboard.ui.see_all_events")}
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingEvents.length === 0 ? (
              <EmptyState message={playerT("dashboard.empty_states.no_events")} />
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
                {playerT("dashboard.ui.connections_radar.title")}
              </CardTitle>
              <CardDescription>
                {playerT("dashboard.ui.connections_radar.subtitle")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {topTeams.length === 0 ? (
                <EmptyState message={playerT("dashboard.empty_states.no_teams")} />
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
                            ? playerT("dashboard.teams_section.you_lead")
                            : `Role: ${team.role}`}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs font-semibold">
                        {playerT("dashboard.ui.members_count", {
                          count: team.memberCount,
                        })}
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
                  {playerT("dashboard.ui.manage_teams")}
                </Link>
              </Button>
              {showSpotlight ? (
                <div className="border-primary/40 bg-primary/5 rounded-lg border px-3 py-3 text-sm">
                  <p className="text-primary font-medium">
                    {playerT("dashboard.ui.beta_preview.title")}
                  </p>
                  <p className="text-muted-foreground">
                    {playerT("dashboard.ui.beta_preview.description")}
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>
          <Card className="border-muted-foreground/20">
            <CardHeader>
              <CardTitle className="text-foreground text-base font-semibold">
                {playerT("dashboard.ui.focus_spotlight.title")}
              </CardTitle>
              <CardDescription>
                {playerT("dashboard.ui.focus_spotlight.subtitle")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {showSpotlight ? (
                <div className="space-y-3">
                  <p className="text-foreground text-sm font-medium">
                    {playerT("dashboard.ui.calendar_sync.title")}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {playerT("dashboard.ui.calendar_sync.description")}
                  </p>
                  <Button className="w-full">
                    {playerT("dashboard.ui.calendar_sync.join_pilot")}
                  </Button>
                </div>
              ) : (
                <EmptyState
                  message={playerT("dashboard.empty_states.experiment_loading")}
                />
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
