import { createFileRoute } from "@tanstack/react-router";
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
import { useMemo } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { LocalizedLink } from "~/components/ui/LocalizedLink";
import { Skeleton } from "~/components/ui/skeleton";
import { useAdminInsights } from "~/features/admin/insights/admin-insights.queries";
import { RoleWorkspaceLayout } from "~/features/layouts/role-workspace-layout";
import { resolvePersonaResolution } from "~/features/roles/persona.server";
import type { PersonaResolution } from "~/features/roles/persona.types";
import { RoleSwitcherProvider } from "~/features/roles/role-switcher-context";
import { useNavigationTranslation } from "~/hooks/useTypedTranslation";
import { requireAuthAndProfile } from "~/lib/auth/guards/route-guards";
import { WORKSPACE_FEATURE_FLAGS } from "~/lib/feature-flag-keys";
import { useFeatureFlag } from "~/lib/feature-flags";

function AdminNamespaceShell() {
  const { t } = useNavigationTranslation();
  const { resolution } = Route.useLoaderData() as { resolution: PersonaResolution };
  const loadResolution = useServerFn(resolvePersonaResolution);
  const { user } = Route.useRouteContext();
  const showSharedInbox = useFeatureFlag(WORKSPACE_FEATURE_FLAGS.sharedInbox);
  const showCollaboration = useFeatureFlag(WORKSPACE_FEATURE_FLAGS.collaboration);

  const baseAdminNavigation = useMemo(
    () => [
      {
        label: t("workspaces.admin.nav.overview.label"),
        to: "/admin",
        icon: Home,
        exact: true,
        description: t("workspaces.admin.nav.overview.description"),
      },
      {
        label: t("workspaces.admin.nav.analytics.label"),
        to: "/admin/insights",
        icon: LineChart,
        description: t("workspaces.admin.nav.analytics.description"),
      },
      {
        label: t("workspaces.admin.nav.systems.label"),
        to: "/admin/systems",
        icon: Layers,
        description: t("workspaces.admin.nav.systems.description"),
      },
      {
        label: t("workspaces.admin.nav.users.label"),
        to: "/admin/users",
        icon: Users,
        inMobileNav: false,
        description: t("workspaces.admin.nav.users.description"),
      },
      {
        label: t("workspaces.admin.nav.audit_logs.label"),
        to: "/admin/security",
        icon: Shield,
        inMobileNav: false,
        description: t("workspaces.admin.nav.audit_logs.description"),
      },
      {
        label: t("workspaces.admin.nav.settings.label"),
        to: "/admin/feature-flags",
        icon: Flag,
        inMobileNav: false,
        description: t("workspaces.admin.nav.settings.description"),
      },
      {
        label: t("workspaces.admin.nav.overview.label"),
        to: "/admin/inbox",
        icon: Inbox,
        description: t("workspaces.admin.nav.overview.description"),
      },
      {
        label: t("workspaces.admin.nav.overview.label"),
        to: "/admin/collaboration",
        icon: Workflow,
        description: t("workspaces.admin.nav.overview.description"),
      },
      {
        label: t("workspaces.admin.nav.events.label"),
        to: "/admin/events-review",
        icon: AlertCircle,
        inMobileNav: false,
        description: t("workspaces.admin.nav.events.description"),
      },
    ],
    [t],
  );

  const navigationItems = useMemo(() => {
    return baseAdminNavigation.filter((item) => {
      if (item.to === "/admin/inbox") {
        return showSharedInbox;
      }

      if (item.to === "/admin/collaboration") {
        return showCollaboration;
      }

      return true;
    });
  }, [baseAdminNavigation, showCollaboration, showSharedInbox]);

  const workspaceSubtitle = user?.name
    ? t("workspaces.admin.welcome_back", { name: user.name })
    : t("workspaces.admin.welcome_back_generic");
  const workspaceLabel = user?.name ? user.name : t("workspaces.admin.fallback_label");

  return (
    <RoleSwitcherProvider
      initialResolution={resolution}
      onSwitch={async (personaId) =>
        loadResolution({ data: { preferredPersonaId: personaId, forceRefresh: true } })
      }
    >
      <RoleWorkspaceLayout
        title={t("workspaces.admin.title")}
        description={t("workspaces.admin.description")}
        navItems={navigationItems}
        fallbackLabel={t("workspaces.admin.fallback_label")}
        subtitle={workspaceSubtitle}
        workspaceLabel={workspaceLabel}
        headerSlot={<AdminWorkspaceSummary />}
      ></RoleWorkspaceLayout>
    </RoleSwitcherProvider>
  );
}

export const Route = createFileRoute("/admin")({
  beforeLoad: async ({ context, location }) => {
    requireAuthAndProfile({ user: context.user, location, language: context.language });
  },
  loader: async () => {
    const resolution = await resolvePersonaResolution({ data: {} });
    return { resolution };
  },
  component: AdminNamespaceShell,
});

function AdminWorkspaceSummary() {
  const { t } = useNavigationTranslation();
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
          <CardTitle className="text-sm font-medium">
            {t("workspaces.admin.summary.system_health")}
          </CardTitle>
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
            <span>
              {error ? error.message : t("workspaces.admin.summary.user_metrics")}
            </span>
          )}
          <LocalizedLink
            to="/admin/insights"
            translationKey="workspace.analytics_dashboard"
            translationNamespace="navigation"
            className="text-primary text-xs font-medium"
          >
            {t("workspaces.admin.summary.analytics")}
          </LocalizedLink>
        </CardContent>
      </Card>

      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium">
            {t("workspaces.admin.summary.platform_stats")}
          </CardTitle>
          <AlertCircle className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent className="text-muted-foreground flex flex-col gap-2 text-sm">
          {isLoading ? (
            <Skeleton className="h-4 w-32" />
          ) : activeAlerts.length > 0 ? (
            <>
              <span className="text-foreground font-medium">{activeAlerts[0].name}</span>
              <span>{activeAlerts[0].threshold}</span>
              <LocalizedLink
                to="/admin/security"
                translationKey="workspace.security_oversight"
                translationNamespace="navigation"
                className="text-primary text-xs font-medium"
              >
                {t("workspaces.admin.summary.recent_activity")}
              </LocalizedLink>
            </>
          ) : (
            <span>{t("workspaces.admin.summary.system_health")}</span>
          )}
        </CardContent>
      </Card>

      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium">
            {t("workspaces.admin.summary.user_metrics")}
          </CardTitle>
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
            <span>{t("workspaces.admin.summary.platform_stats")}</span>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
