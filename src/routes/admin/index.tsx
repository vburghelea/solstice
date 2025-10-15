import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRightIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "lucide-react";
import { SafeLink as Link } from "~/components/ui/SafeLink";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { AdminInsightsDashboard } from "~/features/admin/components/admin-insights-dashboard";
import { useAdminInsights } from "~/features/admin/insights/admin-insights.queries";

export const Route = createFileRoute("/admin/")({
  component: AdminOverviewRoute,
});

function AdminOverviewRoute() {
  return <AdminOverview />;
}

function OverviewSkeleton() {
  const quickCards = ["quick-1", "quick-2"];
  return (
    <div className="token-stack-lg">
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-4 w-72" />
      <div className="token-gap-md grid gap-4 md:grid-cols-2">
        {quickCards.map((key) => (
          <Card key={key} className="bg-surface-elevated border-subtle">
            <CardHeader className="token-stack-sm">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-full" />
            </CardHeader>
            <CardContent className="token-stack-sm">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-3 w-40" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Skeleton className="h-[320px] w-full" />
    </div>
  );
}

function AdminOverview() {
  const { data, isLoading } = useAdminInsights({ windowDays: 14 });

  if (isLoading && !data) {
    return <OverviewSkeleton />;
  }

  const kpis = data?.kpis.slice(0, 2) ?? [];

  return (
    <div className="token-stack-xl">
      <div className="token-stack-xs">
        <h2 className="text-heading-sm text-foreground font-semibold">
          Platform governance cockpit
        </h2>
        <p className="text-body-sm text-muted-strong">
          The Admin workspace surfaces live insights, role coverage, and rollout controls
          tailored to the stewardship remit.
        </p>
      </div>
      <div className="token-gap-md grid gap-4 md:grid-cols-2">
        {kpis.map((kpi) => (
          <Card key={kpi.id} className="bg-surface-elevated border-subtle">
            <CardHeader className="token-stack-xs">
              <CardTitle className="text-heading-xs">{kpi.label}</CardTitle>
              <CardDescription className="text-body-sm text-muted-strong">
                {kpi.supportingCopy}
              </CardDescription>
            </CardHeader>
            <CardContent className="token-stack-xs">
              <span className="text-heading-lg font-semibold">
                {kpi.id === "governance-uptime"
                  ? `${kpi.value.toFixed(2)}%`
                  : kpi.value.toLocaleString()}
              </span>
              <Link
                to="/admin/insights"
                className="text-body-sm text-primary inline-flex items-center gap-2"
              >
                Open insights
                <ArrowRightIcon className="size-4" aria-hidden />
              </Link>
            </CardContent>
          </Card>
        ))}
        <Card className="bg-surface-elevated border-subtle">
          <CardHeader className="token-stack-xs">
            <CardTitle className="text-heading-xs">User governance</CardTitle>
            <CardDescription className="text-body-sm text-muted-strong">
              Review memberships, enforce MFA, and audit high-sensitivity roles in one
              pane of glass.
            </CardDescription>
          </CardHeader>
          <CardContent className="token-stack-xs">
            <div className="text-body-sm text-muted-foreground flex items-center gap-2">
              <UsersIcon className="size-4" aria-hidden />
              <span>Launch the directory for detailed controls.</span>
            </div>
            <Link
              to="/admin/users"
              className="text-body-sm text-primary inline-flex items-center gap-2"
            >
              Open user governance
              <ArrowRightIcon className="size-4" aria-hidden />
            </Link>
          </CardContent>
        </Card>
        <Card className="bg-surface-elevated border-subtle">
          <CardHeader className="token-stack-xs">
            <CardTitle className="text-heading-xs">Feature rollouts</CardTitle>
            <CardDescription className="text-body-sm text-muted-strong">
              Toggle persona previews and beta pathways to coordinate phased releases with
              confidence.
            </CardDescription>
          </CardHeader>
          <CardContent className="token-stack-xs">
            <div className="text-body-sm text-muted-foreground flex items-center gap-2">
              <ShieldCheckIcon className="size-4" aria-hidden />
              <span>Drive safe experimentation without redeploying.</span>
            </div>
            <Link
              to="/admin/feature-flags"
              className="text-body-sm text-primary inline-flex items-center gap-2"
            >
              Manage feature flags
              <ArrowRightIcon className="size-4" aria-hidden />
            </Link>
          </CardContent>
        </Card>
        <Card className="bg-surface-elevated border-subtle">
          <CardHeader className="token-stack-xs">
            <CardTitle className="text-heading-xs">Security posture</CardTitle>
            <CardDescription className="text-body-sm text-muted-strong">
              Review incidents, guardrails, and audit logs tailored for the admins'
              stewardship remit.
            </CardDescription>
          </CardHeader>
          <CardContent className="token-stack-xs">
            <div className="text-body-sm text-muted-foreground flex items-center gap-2">
              <ShieldAlertIcon className="size-4" aria-hidden />
              <span>Confirm safeguards before adjusting privileged access.</span>
            </div>
            <Link
              to="/admin/security"
              className="text-body-sm text-primary inline-flex items-center gap-2"
            >
              Open security center
              <ArrowRightIcon className="size-4" aria-hidden />
            </Link>
          </CardContent>
        </Card>
      </div>
      <div className="token-stack-sm">
        <Card className="bg-surface-elevated border-subtle">
          <CardHeader className="token-stack-xs">
            <CardTitle className="text-heading-xs">Live insights preview</CardTitle>
            <CardDescription className="text-body-sm text-muted-strong">
              Streamlined metrics keep admins oriented before diving into the full
              console.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AdminInsightsDashboard />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
