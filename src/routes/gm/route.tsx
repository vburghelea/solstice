import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { differenceInHours } from "date-fns";
import {
  ClipboardList,
  Gamepad2,
  Home,
  Inbox,
  LayoutDashboard,
  ScrollText,
  Users2,
} from "lucide-react";
import type { ReactNode } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { listCampaignsWithCount } from "~/features/campaigns/campaigns.queries";
import { listGamesWithCount } from "~/features/games/games.queries";
import { listGmB2bPipeline } from "~/features/gm/gm.queries";
import {
  RoleWorkspaceLayout,
  type RoleWorkspaceNavItem,
} from "~/features/layouts/role-workspace-layout";
import { resolvePersonaResolution } from "~/features/roles/persona.server";
import type { PersonaResolution } from "~/features/roles/persona.types";
import { RoleSwitcherProvider } from "~/features/roles/role-switcher-context";
import { requireAuthAndProfile } from "~/lib/auth/guards/route-guards";
import { formatDateAndTime } from "~/shared/lib/datetime";

const GM_NAVIGATION: RoleWorkspaceNavItem[] = [
  {
    label: "Overview",
    to: "/gm",
    icon: Home,
    exact: true,
    description:
      "Review prep cues, live feedback, and the B2B pipeline from one command center.",
  },
  {
    label: "Campaigns",
    to: "/gm/campaigns",
    icon: ScrollText,
    description: "Manage story arcs, dossiers, and campaign health in one place.",
  },
  {
    label: "Games",
    to: "/gm/games",
    icon: Gamepad2,
    description: "Schedule, update, and debrief the sessions on your runway.",
  },
  {
    label: "Dashboard",
    to: "/gm/dashboard",
    icon: LayoutDashboard,
    description: "Track upcoming sessions, campaign momentum, and follow-up workstreams.",
  },
  {
    label: "Feedback triage",
    to: "/gm/feedback",
    icon: ClipboardList,
    description: "Work through debriefs, safety rituals, and upcoming prep checklists.",
  },
  {
    label: "Shared inbox",
    to: "/gm/inbox",
    icon: Inbox,
    description: "Coordinate narrative updates and announcements with operations.",
  },
  {
    label: "Collaboration",
    to: "/gm/collaboration",
    icon: Users2,
    description: "Partner with ops and platform teams on bespoke opportunities.",
  },
];

type GamesQueryResult = Awaited<ReturnType<typeof listGamesWithCount>>;
type GamesQuerySuccess = Extract<GamesQueryResult, { success: true }>;
type CampaignsQueryResult = Awaited<ReturnType<typeof listCampaignsWithCount>>;
type CampaignsQuerySuccess = Extract<CampaignsQueryResult, { success: true }>;
type PipelineQueryResult = Awaited<ReturnType<typeof listGmB2bPipeline>>;
type PipelineQuerySuccess = Extract<PipelineQueryResult, { success: true }>;

export const Route = createFileRoute("/gm")({
  beforeLoad: async ({ context, location }) => {
    requireAuthAndProfile({ user: context.user, location });
  },
  loader: async () => {
    const resolution = await resolvePersonaResolution({ data: {} });
    return { resolution };
  },
  component: GameMasterNamespaceShell,
});

function GameMasterNamespaceShell() {
  const { resolution } = Route.useLoaderData() as { resolution: PersonaResolution };
  const loadResolution = useServerFn(resolvePersonaResolution);
  const { user } = Route.useRouteContext();

  const workspaceSubtitle = user?.name ? `Welcome back, ${user.name}` : "Welcome back";
  const workspaceLabel = user?.name ? `${user.name}` : "Game Master";

  return (
    <RoleSwitcherProvider
      initialResolution={resolution}
      onSwitch={async (personaId) =>
        loadResolution({ data: { preferredPersonaId: personaId, forceRefresh: true } })
      }
    >
      <RoleWorkspaceLayout
        title="Game Master workspace"
        description="Coordinate campaigns, sessions, and bespoke threads tailored to your tables."
        navItems={GM_NAVIGATION}
        fallbackLabel="Game Master"
        subtitle={workspaceSubtitle}
        workspaceLabel={workspaceLabel}
        headerSlot={<GameMasterWorkspaceSummary />}
      />
    </RoleSwitcherProvider>
  );
}

function GameMasterWorkspaceSummary() {
  const toError = (error: unknown): Error | null => {
    if (!error) {
      return null;
    }
    return error instanceof Error ? error : new Error(String(error));
  };

  const upcomingSessionsQuery = useQuery<GamesQuerySuccess>({
    queryKey: ["gm", "workspace", "scheduledGames"],
    queryFn: async () => {
      const result = await listGamesWithCount({
        data: {
          filters: { status: "scheduled" },
          page: 1,
          pageSize: 4,
        },
      });

      if (!result.success) {
        const message =
          ("errors" in result && result.errors?.[0]?.message) ||
          "Failed to load upcoming sessions";
        throw new Error(message);
      }

      return result;
    },
    staleTime: 5 * 60 * 1000,
  });

  const campaignsQuery = useQuery<CampaignsQuerySuccess>({
    queryKey: ["gm", "workspace", "campaigns"],
    queryFn: async () => {
      const result = await listCampaignsWithCount({
        data: {
          filters: { status: "active" },
          page: 1,
          pageSize: 4,
        },
      });

      if (!result.success) {
        const message =
          ("errors" in result && result.errors?.[0]?.message) ||
          "Failed to load active campaigns";
        throw new Error(message);
      }

      return result;
    },
    staleTime: 5 * 60 * 1000,
  });

  const pipelineQuery = useQuery<PipelineQuerySuccess>({
    queryKey: ["gm", "workspace", "pipeline"],
    queryFn: async () => {
      const result = await listGmB2bPipeline();

      if (!result.success) {
        const message =
          ("errors" in result && result.errors?.[0]?.message) ||
          "Failed to load pipeline summary";
        throw new Error(message);
      }

      return result;
    },
    staleTime: 5 * 60 * 1000,
  });

  const nextSession = upcomingSessionsQuery.data?.data.items[0] ?? null;
  const upcomingSessionsCount = upcomingSessionsQuery.data?.data.totalCount ?? 0;

  const highlightedCampaign = campaignsQuery.data?.data.items[0] ?? null;
  const activeCampaignsCount = campaignsQuery.data?.data.totalCount ?? 0;
  const highlightedCampaignSystem =
    highlightedCampaign?.gameSystem?.name ?? "Custom system";

  const pipelineSnapshot = pipelineQuery.data?.data ?? null;
  const pipelineOpportunities = pipelineSnapshot?.opportunities ?? [];
  const opportunitiesNeedingAttention = pipelineOpportunities.filter((opportunity) => {
    const followUpDueAt = new Date(opportunity.followUpDueAt);
    const hoursUntilFollowUp = differenceInHours(followUpDueAt, new Date());
    const followUpSoon = hoursUntilFollowUp <= 48;
    const followUpOverdue = hoursUntilFollowUp < 0;
    const hasEscalation = opportunity.escalationHooks.some(
      (hook) => hook.status !== "idle",
    );
    const needsHealthCheck = opportunity.health !== "on_track";
    return followUpSoon || followUpOverdue || hasEscalation || needsHealthCheck;
  }).length;
  const activeEscalations = pipelineOpportunities.reduce((count, opportunity) => {
    const escalations = opportunity.escalationHooks.filter(
      (hook) => hook.status !== "idle",
    ).length;
    return count + escalations;
  }, 0);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <SummaryCard
        title="Upcoming sessions"
        isLoading={upcomingSessionsQuery.isLoading}
        error={toError(upcomingSessionsQuery.error)}
        value={upcomingSessionsCount}
        description={
          nextSession
            ? `Next: ${nextSession.name} • ${formatDateAndTime(nextSession.dateTime)}`
            : "No sessions scheduled"
        }
        cta={
          <Link to="/gm/games" className="text-primary text-xs font-medium">
            Manage sessions
          </Link>
        }
      />
      <SummaryCard
        title="Active campaigns"
        isLoading={campaignsQuery.isLoading}
        error={toError(campaignsQuery.error)}
        value={activeCampaignsCount}
        description={
          highlightedCampaign
            ? `${highlightedCampaign.name} • ${highlightedCampaignSystem}`
            : "Draft your next arc to fill the roster"
        }
        cta={
          highlightedCampaign ? (
            <Link
              to="/gm/campaigns/$campaignId"
              params={{ campaignId: highlightedCampaign.id }}
              className="text-primary text-xs font-medium"
            >
              View workspace
            </Link>
          ) : undefined
        }
      />
      <SummaryCard
        title="Pipeline attention"
        isLoading={pipelineQuery.isLoading}
        error={toError(pipelineQuery.error)}
        value={opportunitiesNeedingAttention}
        description={
          pipelineSnapshot
            ? `${activeEscalations} escalation${activeEscalations === 1 ? "" : "s"} live • ${pipelineOpportunities.length} total threads`
            : "Log a corporate opportunity to begin tracking"
        }
        cta={
          pipelineSnapshot ? (
            <Link to="/gm/dashboard" className="text-primary text-xs font-medium">
              Review pipeline
            </Link>
          ) : undefined
        }
      />
    </div>
  );
}

interface SummaryCardProps {
  title: string;
  isLoading: boolean;
  error: Error | null;
  value: number;
  description: string;
  cta?: ReactNode;
}

function SummaryCard({
  title,
  isLoading,
  error,
  value,
  description,
  cta,
}: SummaryCardProps) {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-muted-foreground flex flex-col gap-2 text-sm">
        {isLoading ? (
          <Skeleton className="h-4 w-32" />
        ) : error ? (
          <span>{error.message}</span>
        ) : (
          <>
            <span className="text-foreground text-xl font-semibold">{value}</span>
            <span>{description}</span>
            {cta ?? null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
