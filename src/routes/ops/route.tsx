import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, CalendarDays, Home, Inbox, KanbanSquare } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { RoleWorkspaceLayout } from "~/features/layouts/role-workspace-layout";
import { useOpsEventsData } from "~/features/ops/components/use-ops-events-data";
import { resolvePersonaResolution } from "~/features/roles/persona.server";
import type { PersonaResolution } from "~/features/roles/persona.types";
import { RoleSwitcherProvider } from "~/features/roles/role-switcher-context";
import { useNavigationTranslation } from "~/hooks/useTypedTranslation";
import { requireAuthAndProfile } from "~/lib/auth/guards/route-guards";
import { WORKSPACE_FEATURE_FLAGS } from "~/lib/feature-flag-keys";
import { useFeatureFlag } from "~/lib/feature-flags";
import { formatDateAndTime } from "~/shared/lib/datetime";

export const Route = createFileRoute("/ops")({
  beforeLoad: async ({ context, location }) => {
    requireAuthAndProfile({ user: context.user, location });
  },
  loader: async () => {
    const resolution = await resolvePersonaResolution({ data: {} });
    return { resolution };
  },
  component: OpsNamespaceShell,
});

function OpsNamespaceShell() {
  const { t } = useNavigationTranslation();
  const { resolution } = Route.useLoaderData() as { resolution: PersonaResolution };
  const loadResolution = useServerFn(resolvePersonaResolution);
  const { user } = Route.useRouteContext();
  const showSharedInbox = useFeatureFlag(WORKSPACE_FEATURE_FLAGS.sharedInbox);
  const showCollaboration = useFeatureFlag(WORKSPACE_FEATURE_FLAGS.collaboration);

  const baseOpsNavigation = useMemo(
    () => [
      {
        label: t("workspaces.ops.nav.overview.label"),
        to: "/ops",
        icon: Home,
        exact: true,
        description: t("workspaces.ops.nav.overview.description"),
      },
      {
        label: t("workspaces.ops.nav.events.label"),
        to: "/ops/events",
        icon: CalendarDays,
        description: t("workspaces.ops.nav.events.description"),
      },
      {
        label: t("workspaces.ops.nav.reports.label"),
        to: "/ops/inbox",
        icon: Inbox,
        description: t("workspaces.ops.nav.reports.description"),
      },
      {
        label: t("workspaces.ops.nav.reports.label"),
        to: "/ops/collaboration",
        icon: KanbanSquare,
        description: t("workspaces.ops.nav.reports.description"),
      },
    ],
    [t],
  );

  const navigationItems = useMemo(() => {
    return baseOpsNavigation.filter((item) => {
      if (item.to === "/ops/inbox") {
        return showSharedInbox;
      }

      if (item.to === "/ops/collaboration") {
        return showCollaboration;
      }

      return true;
    });
  }, [baseOpsNavigation, showCollaboration, showSharedInbox]);

  const workspaceSubtitle = user?.name
    ? t("workspaces.ops.welcome_back", { name: user.name })
    : t("workspaces.ops.welcome_back_generic");
  const workspaceLabel = user?.name ? user.name : t("workspaces.ops.fallback_label");

  return (
    <RoleSwitcherProvider
      initialResolution={resolution}
      onSwitch={async (personaId) =>
        loadResolution({ data: { preferredPersonaId: personaId, forceRefresh: true } })
      }
    >
      <RoleWorkspaceLayout
        title={t("workspaces.ops.title")}
        description={t("workspaces.ops.description")}
        navItems={navigationItems}
        fallbackLabel={t("workspaces.ops.fallback_label")}
        subtitle={workspaceSubtitle}
        workspaceLabel={workspaceLabel}
        headerSlot={<OpsWorkspaceSummary />}
      />
    </RoleSwitcherProvider>
  );
}

function OpsWorkspaceSummary() {
  const { t } = useNavigationTranslation();
  const { pendingList, pipelineList, attentionItems, liveEvents, isLoading } =
    useOpsEventsData();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    if (!isHydrated) {
      // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
      setIsHydrated(true);
    }
  }, [isHydrated]); // isHydrated only changes once, safe for hydration detection

  const nextPipelineEvent = useMemo(() => pipelineList[0] ?? null, [pipelineList]);
  const criticalAttention = useMemo(
    () =>
      attentionItems.find((item) => item.severity === "critical") ??
      attentionItems[0] ??
      null,
    [attentionItems],
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium">
            {t("workspaces.ops.summary.pending_tasks")}
          </CardTitle>
          <span className="text-muted-foreground text-xs font-semibold">
            {pendingList.length}
          </span>
        </CardHeader>
        <CardContent className="text-muted-foreground flex flex-col gap-2 text-sm">
          {!isHydrated || isLoading ? (
            <Skeleton className="h-4 w-32" />
          ) : pendingList.length > 0 ? (
            <>
              <span className="text-foreground font-medium">{pendingList[0].name}</span>
              <span>{formatDateAndTime(pendingList[0].startDate)}</span>
              <Link
                to="/admin/events-review"
                className="text-primary text-xs font-medium"
              >
                {t("workspaces.ops.summary.upcoming_events")}
              </Link>
            </>
          ) : (
            <span>{t("workspaces.ops.summary.staff_on_duty")}</span>
          )}
        </CardContent>
      </Card>

      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium">
            {t("workspaces.ops.summary.venue_utilization")}
          </CardTitle>
          <span className="text-muted-foreground text-xs font-semibold">
            {pipelineList.length}
          </span>
        </CardHeader>
        <CardContent className="text-muted-foreground flex flex-col gap-2 text-sm">
          <span>
            {!isHydrated || isLoading ? (
              <Skeleton className="h-4 w-36" />
            ) : nextPipelineEvent ? (
              <span className="inline-block">
                <span className="text-foreground block font-medium">
                  {nextPipelineEvent.name}
                </span>
                <span className="block">
                  {formatDateAndTime(nextPipelineEvent.startDate)}
                </span>
                <span className="block">{nextPipelineEvent.city ?? "Location TBD"}</span>
                <Link
                  from="/ops"
                  to="/ops/events/$eventId"
                  params={{ eventId: nextPipelineEvent.id }}
                  className="text-primary text-xs font-medium"
                >
                  {t("workspaces.ops.summary.staff_on_duty")}
                </Link>
              </span>
            ) : (
              <span>{t("workspaces.ops.summary.venue_utilization")}</span>
            )}
          </span>
        </CardContent>
      </Card>

      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium">
            {t("workspaces.ops.summary.staff_on_duty")}
          </CardTitle>
          <AlertTriangle className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent className="text-muted-foreground flex flex-col gap-2 text-sm">
          {!isHydrated || isLoading ? (
            <Skeleton className="h-4 w-40" />
          ) : criticalAttention ? (
            <>
              <span className="text-foreground font-medium">
                {criticalAttention.message}
              </span>
              <span className="text-muted-foreground text-xs tracking-wide uppercase">
                {criticalAttention.severity === "critical"
                  ? "Requires immediate action"
                  : "Monitor"}
              </span>
              <span>{formatDateAndTime(criticalAttention.startDate)}</span>
            </>
          ) : liveEvents.length > 0 ? (
            <span>{t("workspaces.ops.summary.venue_utilization")}</span>
          ) : (
            <span>{t("workspaces.ops.summary.pending_tasks")}</span>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
