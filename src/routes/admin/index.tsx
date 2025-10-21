import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRightIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "lucide-react";
import { LocalizedLink } from "~/components/ui/LocalizedLink";

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
import { useAdminTranslation } from "~/hooks/useTypedTranslation";

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
  const { t } = useAdminTranslation();
  const { data, isLoading } = useAdminInsights({ windowDays: 14 });

  if (isLoading && !data) {
    return <OverviewSkeleton />;
  }

  const kpis = data?.kpis.slice(0, 2) ?? [];

  return (
    <div className="token-stack-xl">
      <div className="token-stack-xs">
        <h2 className="text-heading-sm text-foreground font-semibold">
          {t("overview.title")}
        </h2>
        <p className="text-body-sm text-muted-strong">{t("overview.subtitle")}</p>
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
              <LocalizedLink
                to="/admin/insights"
                className="text-body-sm text-primary inline-flex items-center gap-2"
                translationKey="admin.insights"
                translationNamespace="navigation"
              >
                Open insights
                <ArrowRightIcon className="size-4" aria-hidden />
              </LocalizedLink>
            </CardContent>
          </Card>
        ))}
        <Card className="bg-surface-elevated border-subtle">
          <CardHeader className="token-stack-xs">
            <CardTitle className="text-heading-xs">
              {t("overview.cards.user_governance.title")}
            </CardTitle>
            <CardDescription className="text-body-sm text-muted-strong">
              {t("overview.cards.user_governance.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="token-stack-xs">
            <div className="text-body-sm text-muted-foreground flex items-center gap-2">
              <UsersIcon className="size-4" aria-hidden />
              <span>{t("overview.cards.user_governance.description_detail")}</span>
            </div>
            <LocalizedLink
              to="/admin/users"
              className="text-body-sm text-primary inline-flex items-center gap-2"
              translationKey="admin.user_management"
              translationNamespace="navigation"
            >
              {t("overview.cards.user_governance.link_text")}
              <ArrowRightIcon className="size-4" aria-hidden />
            </LocalizedLink>
          </CardContent>
        </Card>
        <Card className="bg-surface-elevated border-subtle">
          <CardHeader className="token-stack-xs">
            <CardTitle className="text-heading-xs">
              {t("overview.cards.feature_rollouts.title")}
            </CardTitle>
            <CardDescription className="text-body-sm text-muted-strong">
              {t("overview.cards.feature_rollouts.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="token-stack-xs">
            <div className="text-body-sm text-muted-foreground flex items-center gap-2">
              <ShieldCheckIcon className="size-4" aria-hidden />
              <span>{t("overview.cards.feature_rollouts.description_detail")}</span>
            </div>
            <LocalizedLink
              to="/admin/feature-flags"
              className="text-body-sm text-primary inline-flex items-center gap-2"
              translationKey="admin.feature_flags"
              translationNamespace="navigation"
            >
              {t("overview.cards.feature_rollouts.link_text")}
              <ArrowRightIcon className="size-4" aria-hidden />
            </LocalizedLink>
          </CardContent>
        </Card>
        <Card className="bg-surface-elevated border-subtle">
          <CardHeader className="token-stack-xs">
            <CardTitle className="text-heading-xs">
              {t("overview.cards.security_posture.title")}
            </CardTitle>
            <CardDescription className="text-body-sm text-muted-strong">
              {t("overview.cards.security_posture.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="token-stack-xs">
            <div className="text-body-sm text-muted-foreground flex items-center gap-2">
              <ShieldAlertIcon className="size-4" aria-hidden />
              <span>{t("overview.cards.security_posture.description_detail")}</span>
            </div>
            <LocalizedLink
              to="/admin/security"
              className="text-body-sm text-primary inline-flex items-center gap-2"
              translationKey="admin.security"
              translationNamespace="navigation"
            >
              {t("overview.cards.security_posture.link_text")}
              <ArrowRightIcon className="size-4" aria-hidden />
            </LocalizedLink>
          </CardContent>
        </Card>
      </div>
      <div className="token-stack-sm">
        <Card className="bg-surface-elevated border-subtle">
          <CardHeader className="token-stack-xs">
            <CardTitle className="text-heading-xs">
              {t("overview.cards.live_insights_preview.title")}
            </CardTitle>
            <CardDescription className="text-body-sm text-muted-strong">
              {t("overview.cards.live_insights_preview.description")}
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
