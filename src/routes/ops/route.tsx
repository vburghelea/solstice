import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, CalendarDays, Home, Inbox, KanbanSquare } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import {
  RoleWorkspaceLayout,
  type RoleWorkspaceNavItem,
} from "~/features/layouts/role-workspace-layout";
import { useOpsEventsData } from "~/features/ops/components/use-ops-events-data";
import { resolvePersonaResolution } from "~/features/roles/persona.server";
import type { PersonaResolution } from "~/features/roles/persona.types";
import { RoleSwitcherProvider } from "~/features/roles/role-switcher-context";
import { requireAuthAndProfile } from "~/lib/auth/guards/route-guards";
import { WORKSPACE_FEATURE_FLAGS } from "~/lib/feature-flag-keys";
import { useFeatureFlag } from "~/lib/feature-flags";
import { formatDateAndTime } from "~/shared/lib/datetime";

const BASE_OPS_NAVIGATION: RoleWorkspaceNavItem[] = [
  {
    label: "Overview",
    to: "/ops",
    icon: Home,
    exact: true,
    description:
      "Watch approvals, staffing, and logistics rollups in one mission control.",
  },
  {
    label: "Events",
    to: "/ops/events",
    icon: CalendarDays,
    description: "Review approvals, logistics, and marketing health for each event.",
  },
  {
    label: "Shared inbox",
    to: "/ops/inbox",
    icon: Inbox,
    description: "Respond to event updates and venue coordination threads together.",
  },
  {
    label: "Collaboration",
    to: "/ops/collaboration",
    icon: KanbanSquare,
    description: "Track assignments and workflow handoffs across the ops team.",
  },
];

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
  const { resolution } = Route.useLoaderData() as { resolution: PersonaResolution };
  const loadResolution = useServerFn(resolvePersonaResolution);
  const { user } = Route.useRouteContext();
  const showSharedInbox = useFeatureFlag(WORKSPACE_FEATURE_FLAGS.sharedInbox);
  const showCollaboration = useFeatureFlag(WORKSPACE_FEATURE_FLAGS.collaboration);

  const navigationItems = useMemo(() => {
    return BASE_OPS_NAVIGATION.filter((item) => {
      if (item.to === "/ops/inbox") {
        return showSharedInbox;
      }

      if (item.to === "/ops/collaboration") {
        return showCollaboration;
      }

      return true;
    });
  }, [showCollaboration, showSharedInbox]);

  const workspaceSubtitle = user?.name ? `Welcome back, ${user.name}` : "Welcome back";
  const workspaceLabel = user?.name ? `${user.name}` : "Operations";

  return (
    <RoleSwitcherProvider
      initialResolution={resolution}
      onSwitch={async (personaId) =>
        loadResolution({ data: { preferredPersonaId: personaId, forceRefresh: true } })
      }
    >
      <RoleWorkspaceLayout
        title="Operations workspace"
        description="Monitor approvals, logistics, and staffing signals in real time so every event stays on track."
        navItems={navigationItems}
        fallbackLabel="Operations"
        subtitle={workspaceSubtitle}
        workspaceLabel={workspaceLabel}
        headerSlot={<OpsWorkspaceSummary />}
      />
    </RoleSwitcherProvider>
  );
}

function OpsWorkspaceSummary() {
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
          <CardTitle className="text-sm font-medium">Approvals queue</CardTitle>
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
                Review submissions
              </Link>
            </>
          ) : (
            <span>All submissions are reviewed</span>
          )}
        </CardContent>
      </Card>

      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium">Pipeline focus</CardTitle>
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
                  Open ops detail
                </Link>
              </span>
            ) : (
              <span>No confirmed events in the pipeline</span>
            )}
          </span>
        </CardContent>
      </Card>

      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium">Attention signals</CardTitle>
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
            <span>All live events are trending green</span>
          ) : (
            <span>No active alerts</span>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
