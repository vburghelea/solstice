import { format } from "date-fns";
import {
  ActivitySquareIcon,
  AlertTriangleIcon,
  ArrowUpRight,
  CheckCircle2Icon,
  ClockIcon,
  ShieldAlertIcon,
} from "lucide-react";
import { useMemo } from "react";
import { SupportedLanguage } from "~/lib/i18n/config";
import { formatDistanceToNowLocalized } from "~/lib/i18n/utils";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { useAdminTranslation } from "~/hooks/useTypedTranslation";
import { cn } from "~/shared/lib/utils";

import {
  useAdminInsights,
  type AdminAlert,
  type AdminIncident,
  type AdminInsightKpi,
  type PersonaImpact,
} from "../insights/admin-insights.queries";

const severityTone: Record<AdminIncident["severity"], string> = {
  info: "text-muted-foreground",
  warning: "text-amber-600",
  error: "text-destructive",
};

const alertTone: Record<AdminAlert["status"], string> = {
  stable: "border-emerald-500/40 bg-emerald-500/5 text-emerald-600",
  degraded: "border-amber-500/40 bg-amber-500/5 text-amber-600",
  critical: "border-destructive/40 bg-destructive/5 text-destructive",
};

function InsightSkeleton() {
  const kpiSkeletons = ["kpi-1", "kpi-2", "kpi-3", "kpi-4"];
  const rowSkeletons = ["row-1", "row-2", "row-3"];
  const timelineSkeletons = ["timeline-1", "timeline-2", "timeline-3", "timeline-4"];
  return (
    <div className="token-gap-lg">
      <div className="token-gap-md grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpiSkeletons.map((key) => (
          <Card key={key} className="bg-surface-elevated border-subtle">
            <CardHeader className="token-stack-xs">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-4 w-full" />
            </CardHeader>
          </Card>
        ))}
      </div>
      <Card className="bg-surface-elevated border-subtle">
        <CardHeader className="token-stack-sm">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-full" />
        </CardHeader>
        <CardContent className="token-stack-sm">
          {rowSkeletons.map((key) => (
            <Skeleton key={key} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
      <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        <Card className="bg-surface-elevated border-subtle">
          <CardHeader className="token-stack-sm">
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent className="token-stack-sm">
            {timelineSkeletons.map((key) => (
              <Skeleton key={key} className="h-14 w-full" />
            ))}
          </CardContent>
        </Card>
        <Card className="bg-surface-elevated border-subtle">
          <CardHeader className="token-stack-sm">
            <Skeleton className="h-5 w-36" />
          </CardHeader>
          <CardContent className="token-stack-sm">
            {timelineSkeletons.map((key) => (
              <Skeleton key={`${key}-alert`} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function formatChange(value: number) {
  if (!Number.isFinite(value) || value === 0) {
    return { label: "0%", tone: "text-muted-foreground" };
  }
  const tone = value > 0 ? "text-emerald-600" : "text-destructive";
  const sign = value > 0 ? "+" : "";
  return { label: `${sign}${value.toFixed(1)}%`, tone };
}

function InsightTile({ kpi }: { kpi: AdminInsightKpi }) {
  const { label, tone } = useMemo(() => formatChange(kpi.change), [kpi.change]);
  return (
    <Card className="bg-surface-elevated border-subtle">
      <CardHeader className="token-stack-xs">
        <CardDescription className="text-body-sm text-muted-strong">
          {kpi.label}
        </CardDescription>
        <div className="token-gap-xs flex items-baseline gap-2">
          <span className="text-heading-md font-semibold">
            {kpi.id === "governance-uptime"
              ? `${kpi.value.toFixed(2)}%`
              : kpi.value.toLocaleString()}
          </span>
          <span className={cn("text-body-sm font-medium", tone)}>{label}</span>
          {kpi.direction !== "flat" ? (
            <ArrowUpRight
              aria-hidden
              className={cn(
                "size-4",
                kpi.direction === "down"
                  ? "text-destructive rotate-135"
                  : "text-emerald-600",
              )}
            />
          ) : null}
        </div>
        <CardDescription className="text-body-sm text-muted-strong">
          {kpi.supportingCopy}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

function PersonaImpactRow({
  impact,
  t,
}: {
  impact: PersonaImpact;
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  const iconMap: Record<PersonaImpact["personaId"], string> = {
    visitor: "🧭",
    player: "🎮",
    ops: "📊",
    gm: "🧙",
    admin: "🛡️",
  };
  const { label, tone } = formatChange(impact.change);
  return (
    <div className="border-border token-gap-sm flex items-start justify-between rounded-lg border p-3">
      <div className="token-stack-xs">
        <span className="text-xl" aria-hidden>
          {iconMap[impact.personaId]}
        </span>
        <p className="text-body-sm text-foreground font-semibold">
          {impact.personaLabel}
        </p>
        <p className="text-body-sm text-muted-strong">{impact.headline}</p>
      </div>
      <div className="token-stack-xs items-end text-right">
        <Badge
          variant="outline"
          className={cn(
            "border-transparent",
            tone === "text-emerald-600"
              ? "bg-emerald-500/10 text-emerald-600"
              : tone === "text-destructive"
                ? "bg-destructive/10 text-destructive"
                : "bg-muted text-muted-foreground",
          )}
        >
          {label}
        </Badge>
        <span className="text-body-xs text-muted-foreground">
          {impact.direction === "flat"
            ? t("insights.status.steady")
            : impact.direction === "up"
              ? t("insights.status.trending_up")
              : t("insights.status.needs_attention")}
        </span>
      </div>
    </div>
  );
}

function IncidentRow({
  incident,
  t,
  currentLanguage,
}: {
  incident: AdminIncident;
  t: (key: string, params?: Record<string, string | number>) => string;
  currentLanguage: SupportedLanguage;
}) {
  const duration = incident.durationMinutes
    ? t("insights.incidents.duration.minutes", { minutes: incident.durationMinutes })
    : incident.finishedAt
      ? t("insights.incidents.duration.less_than_minute")
      : t("insights.incidents.duration.in_progress");
  return (
    <div className="border-border token-gap-sm rounded-lg border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="token-gap-xs flex items-center gap-2">
          <ShieldAlertIcon
            aria-hidden
            className={cn("size-4", severityTone[incident.severity])}
          />
          <p className="text-body-sm text-foreground font-semibold">{incident.source}</p>
        </div>
        <Badge variant="outline" className={severityTone[incident.severity]}>
          {incident.status}
        </Badge>
      </div>
      <p className="text-body-sm text-muted-strong">{incident.description}</p>
      <div className="text-body-xs text-muted-foreground flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1">
          <ClockIcon className="size-3" aria-hidden />
          {format(new Date(incident.startedAt), "PPpp")}
        </span>
        <span aria-hidden>•</span>
        <span>{duration}</span>
        {incident.httpStatus ? (
          <>
            <span aria-hidden>•</span>
            <span>
              {t("insights.incidents.http_status", { status: incident.httpStatus })}
            </span>
          </>
        ) : null}
        {incident.finishedAt ? (
          <>
            <span aria-hidden>•</span>
            <span>
              {t("insights.incidents.resolved", {
                time: formatDistanceToNowLocalized(
                  new Date(incident.finishedAt),
                  currentLanguage,
                  {
                    addSuffix: true,
                  },
                ),
              })}
            </span>
          </>
        ) : null}
      </div>
    </div>
  );
}

function AlertRow({
  alert,
  t,
  currentLanguage,
}: {
  alert: AdminAlert;
  t: (key: string, params?: Record<string, string | number>) => string;
  currentLanguage: SupportedLanguage;
}) {
  return (
    <div className={cn("token-stack-xs rounded-lg border p-3", alertTone[alert.status])}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-body-sm font-semibold">{alert.name}</p>
        <Badge variant="outline" className="bg-background/20 border-transparent">
          {alert.enabled
            ? t("insights.alerts.status.active")
            : t("insights.alerts.status.paused")}
        </Badge>
      </div>
      <p className="text-body-xs opacity-80">{alert.threshold}</p>
      <div className="text-body-xs flex flex-wrap items-center gap-2 opacity-70">
        <span className="flex items-center gap-1">
          <ActivitySquareIcon className="size-3" aria-hidden />
          {alert.channel}
        </span>
        {alert.lastTriggeredAt ? (
          <>
            <span aria-hidden>•</span>
            <span>
              {t("insights.alerts.triggered", {
                time: formatDistanceToNowLocalized(
                  new Date(alert.lastTriggeredAt),
                  currentLanguage,
                  {
                    addSuffix: true,
                  },
                ),
              })}
            </span>
          </>
        ) : (
          <>
            <span aria-hidden>•</span>
            <span>{t("insights.alerts.awaiting_first_trigger")}</span>
          </>
        )}
      </div>
    </div>
  );
}

export function AdminInsightsDashboard() {
  const { t, currentLanguage } = useAdminTranslation();
  const { data, isLoading, isError, error, refetch, isRefetching } = useAdminInsights({
    refetchOnWindowFocus: false,
  });

  if (isLoading || !data) {
    return <InsightSkeleton />;
  }

  if (isError) {
    return (
      <Card className="bg-destructive/5 border-destructive/30">
        <CardHeader className="token-stack-sm">
          <div className="token-gap-xs flex items-center gap-2">
            <AlertTriangleIcon className="text-destructive size-5" aria-hidden />
            <CardTitle className="text-heading-sm">
              {t("insights.errors.unable_to_load")}
            </CardTitle>
          </div>
          <CardDescription className="text-body-sm text-destructive">
            {error?.message ?? t("insights.errors.error_message")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => refetch()} variant="secondary">
            {t("insights.buttons.retry")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const [firstPersona, ...otherPersonas] = data.personaImpacts;

  return (
    <div className="token-gap-xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="token-stack-xs">
          <p className="text-body-xs text-muted-foreground">
            {t("insights.subtitle", {
              time: formatDistanceToNowLocalized(data.generatedAt, currentLanguage, {
                addSuffix: true,
              }),
            })}
          </p>
          <h2 className="text-heading-sm text-foreground font-semibold">
            {t("insights.title", { days: data.windowDays })}
          </h2>
        </div>
        <Button onClick={() => refetch()} variant="outline" disabled={isRefetching}>
          {isRefetching
            ? t("insights.buttons.refreshing")
            : t("insights.buttons.refresh")}
        </Button>
      </div>
      <div className="token-gap-md grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {data.kpis.map((kpi) => (
          <InsightTile key={kpi.id} kpi={kpi} />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        <Card className="bg-surface-elevated border-subtle">
          <CardHeader className="token-stack-sm">
            <CardTitle className="text-heading-sm">
              {t("insights.sections.incident_timeline.title")}
            </CardTitle>
            <CardDescription className="text-body-sm text-muted-strong">
              {t("insights.sections.incident_timeline.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="token-stack-sm">
            {data.incidents.length === 0 ? (
              <div className="token-gap-sm rounded-lg border border-dashed p-6 text-center">
                <CheckCircle2Icon
                  className="mx-auto size-8 text-emerald-500"
                  aria-hidden
                />
                <p className="text-body-sm text-foreground font-semibold">
                  {t("insights.sections.incident_timeline.no_incidents")}
                </p>
                <p className="text-body-sm text-muted-strong">
                  {t("insights.sections.incident_timeline.no_incidents_description")}
                </p>
              </div>
            ) : (
              <div className="token-stack-sm">
                {data.incidents.map((incident) => (
                  <IncidentRow
                    key={incident.id}
                    incident={incident}
                    t={t}
                    currentLanguage={currentLanguage}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="bg-surface-elevated border-subtle">
          <CardHeader className="token-stack-sm">
            <CardTitle className="text-heading-sm">
              {t("insights.sections.live_alerting.title")}
            </CardTitle>
            <CardDescription className="text-body-sm text-muted-strong">
              {t("insights.sections.live_alerting.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="token-stack-sm">
            {data.alerts.map((alert) => (
              <AlertRow
                key={alert.id}
                alert={alert}
                t={t}
                currentLanguage={currentLanguage}
              />
            ))}
          </CardContent>
        </Card>
      </div>
      <Card className="bg-surface-elevated border-subtle">
        <CardHeader className="token-stack-sm">
          <CardTitle className="text-heading-sm">
            {t("insights.sections.persona_impact.title")}
          </CardTitle>
          <CardDescription className="text-body-sm text-muted-strong">
            {t("insights.sections.persona_impact.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="token-gap-md">
          {firstPersona ? (
            <div className="token-gap-sm rounded-xl border border-dashed border-[color:color-mix(in_oklab,var(--primary-soft)_55%,transparent)] bg-[color:color-mix(in_oklab,var(--primary-soft)_20%,var(--surface-default)_80%)] p-4">
              <p className="text-body-sm text-foreground font-semibold">
                {firstPersona.personaLabel}
              </p>
              <p className="text-body-md text-muted-strong">{firstPersona.headline}</p>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {formatChange(firstPersona.change).label}
                </Badge>
                <span className="text-body-xs text-muted-foreground">
                  {firstPersona.direction === "up"
                    ? t("insights.status.momentum_building")
                    : firstPersona.direction === "down"
                      ? t("insights.status.requires_intervention")
                      : t("insights.status.holding_steady")}
                </span>
              </div>
            </div>
          ) : null}
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {otherPersonas.map((impact) => (
              <PersonaImpactRow key={impact.personaId} impact={impact} t={t} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
