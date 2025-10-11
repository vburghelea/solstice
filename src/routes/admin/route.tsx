import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertCircle,
  Flag,
  Home,
  Inbox,
  Layers,
  LineChart,
  Shield,
  Users,
  Workflow,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { useAdminInsights } from "~/features/admin/insights/admin-insights.queries";
import {
  RoleWorkspaceLayout,
  type RoleWorkspaceNavItem,
} from "~/features/layouts/role-workspace-layout";
import { resolvePersonaResolution } from "~/features/roles/persona.server";
import type { PersonaResolution } from "~/features/roles/persona.types";
import { RoleSwitcherProvider } from "~/features/roles/role-switcher-context";
import { requireAuthAndProfile } from "~/lib/auth/guards/route-guards";

const ADMIN_NAVIGATION: RoleWorkspaceNavItem[] = [
  {
    label: "Overview",
    to: "/admin",
    icon: Home,
    exact: true,
    description:
      "Review governance posture, alerts, and organization-wide impacts at a glance.",
  },
  {
    label: "Insights",
    to: "/admin/insights",
    icon: LineChart,
    description: "Audit KPIs, uptime, and membership health across the platform.",
  },
  {
    label: "Systems",
    to: "/admin/systems",
    icon: Layers,
    description: "Curate rulesets, manage crawls, and moderate media.",
  },
  {
    label: "Users",
    to: "/admin/users",
    icon: Users,
    inMobileNav: false,
    description: "Manage roles, MFA enrollment, and compliance exports.",
  },
  {
    label: "Security",
    to: "/admin/security",
    icon: Shield,
    inMobileNav: false,
    description: "Monitor privileged actions, incidents, and security toggles.",
  },
  {
    label: "Feature flags",
    to: "/admin/feature-flags",
    icon: Flag,
    inMobileNav: false,
    description: "Coordinate rollout plans and targeted experiments for your teams.",
  },
  {
    label: "Shared inbox",
    to: "/admin/inbox",
    icon: Inbox,
    description: "Coordinate escalations and platform-wide announcements.",
  },
  {
    label: "Collaboration",
    to: "/admin/collaboration",
    icon: Workflow,
    description: "Work side-by-side with ops and GMs on active initiatives.",
  },
  {
    label: "Event review",
    to: "/admin/events-review",
    icon: AlertCircle,
    inMobileNav: false,
    description: "Approve or escalate upcoming experiences before they go live.",
  },
];

export const Route = createFileRoute("/admin")({
  beforeLoad: async ({ context, location }) => {
    requireAuthAndProfile({ user: context.user, location });
  },
  loader: async () => {
    const resolution = await resolvePersonaResolution({ data: {} });
    return { resolution };
  },
  component: AdminNamespaceShell,
});

function AdminNamespaceShell() {
  const { resolution } = Route.useLoaderData() as { resolution: PersonaResolution };
  const loadResolution = useServerFn(resolvePersonaResolution);
  const { user } = Route.useRouteContext();

  const workspaceSubtitle = user?.name ? `Welcome back, ${user.name}` : "Welcome back";
  const workspaceLabel = user?.name ? `${user.name}` : "Admin";

  return (
    <RoleSwitcherProvider
      initialResolution={resolution}
      onSwitch={async (personaId) =>
        loadResolution({ data: { preferredPersonaId: personaId, forceRefresh: true } })
      }
    >
      <RoleWorkspaceLayout
        title="Administration workspace"
        description="Coordinate governance, permissions, and platform-wide alerts for your organization."
        navItems={ADMIN_NAVIGATION}
        fallbackLabel="Platform admin"
        subtitle={workspaceSubtitle}
        workspaceLabel={workspaceLabel}
        headerSlot={<AdminWorkspaceSummary />}
      ></RoleWorkspaceLayout>
    </RoleSwitcherProvider>
  );
}

function AdminWorkspaceSummary() {
  const { data, isLoading, error } = useAdminInsights({
    staleTime: 60_000,
    retry: false,
  });

  const activeAlerts =
    data?.alerts.filter((alert) => alert.enabled && alert.status !== "stable") ?? [];
  const prioritizedImpact = data?.personaImpacts[0] ?? null;
  const headlineKpi = data?.kpis[0] ?? null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium">Platform health</CardTitle>
          <LineChart className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent className="text-muted-foreground flex flex-col gap-2 text-sm">
          {isLoading ? (
            <Skeleton className="h-4 w-40" />
          ) : headlineKpi ? (
            <>
              <span className="text-foreground text-xl font-semibold">
                {headlineKpi.value}
              </span>
              <span>{headlineKpi.supportingCopy}</span>
            </>
          ) : (
            <span>{error ? error.message : "No KPIs available"}</span>
          )}
          <Link to="/admin/insights" className="text-primary text-xs font-medium">
            View insights
          </Link>
        </CardContent>
      </Card>

      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium">Active alerts</CardTitle>
          <AlertCircle className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent className="text-muted-foreground flex flex-col gap-2 text-sm">
          {isLoading ? (
            <Skeleton className="h-4 w-32" />
          ) : activeAlerts.length > 0 ? (
            <>
              <span className="text-foreground font-medium">{activeAlerts[0].name}</span>
              <span>{activeAlerts[0].threshold}</span>
              <Link to="/admin/security" className="text-primary text-xs font-medium">
                Investigate alert
              </Link>
            </>
          ) : (
            <span>All monitors are stable</span>
          )}
        </CardContent>
      </Card>

      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium">Impact focus</CardTitle>
          <Users className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent className="text-muted-foreground flex flex-col gap-2 text-sm">
          {isLoading ? (
            <Skeleton className="h-4 w-32" />
          ) : prioritizedImpact ? (
            <>
              <span className="text-foreground font-medium">
                {prioritizedImpact.personaLabel}
              </span>
              <span>{prioritizedImpact.headline}</span>
              <span className="text-muted-foreground text-xs tracking-wide uppercase">
                {prioritizedImpact.direction === "up" ? "Trending up" : "Trending down"}
              </span>
            </>
          ) : (
            <span>No major shifts detected</span>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
