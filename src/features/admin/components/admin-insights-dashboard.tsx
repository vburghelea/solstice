import { format, formatDistanceToNow } from "date-fns";
import {
  ActivitySquareIcon,
  AlertTriangleIcon,
  ArrowUpRight,
  CheckCircle2Icon,
  ClockIcon,
  ShieldAlertIcon,
} from "lucide-react";
import { useMemo } from "react";

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

function PersonaImpactRow({ impact }: { impact: PersonaImpact }) {
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
            ? "Steady"
            : impact.direction === "up"
              ? "Trending up"
              : "Needs attention"}
        </span>
      </div>
    </div>
  );
}

function IncidentRow({ incident }: { incident: AdminIncident }) {
  const duration = incident.durationMinutes
    ? `${incident.durationMinutes} min`
    : incident.finishedAt
      ? "< 1 min"
      : "In progress";
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
            <span>HTTP {incident.httpStatus}</span>
          </>
        ) : null}
        {incident.finishedAt ? (
          <>
            <span aria-hidden>•</span>
            <span>
              Resolved{" "}
              {formatDistanceToNow(new Date(incident.finishedAt), { addSuffix: true })}
            </span>
          </>
        ) : null}
      </div>
    </div>
  );
}

function AlertRow({ alert }: { alert: AdminAlert }) {
  return (
    <div className={cn("token-stack-xs rounded-lg border p-3", alertTone[alert.status])}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-body-sm font-semibold">{alert.name}</p>
        <Badge variant="outline" className="bg-background/20 border-transparent">
          {alert.enabled ? "Active" : "Paused"}
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
              Triggered{" "}
              {formatDistanceToNow(new Date(alert.lastTriggeredAt), { addSuffix: true })}
            </span>
          </>
        ) : (
          <>
            <span aria-hidden>•</span>
            <span>Awaiting first trigger</span>
          </>
        )}
      </div>
    </div>
  );
}

export function AdminInsightsDashboard() {
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
            <CardTitle className="text-heading-sm">Unable to load insights</CardTitle>
          </div>
          <CardDescription className="text-body-sm text-destructive">
            {error?.message ?? "We couldn't reach the governance analytics service."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => refetch()} variant="secondary">
            Retry
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
            Updated {formatDistanceToNow(data.generatedAt, { addSuffix: true })}
          </p>
          <h2 className="text-heading-sm text-foreground font-semibold">
            Governance performance (last {data.windowDays} days)
          </h2>
        </div>
        <Button onClick={() => refetch()} variant="outline" disabled={isRefetching}>
          {isRefetching ? "Refreshing…" : "Refresh data"}
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
            <CardTitle className="text-heading-sm">Incident timeline</CardTitle>
            <CardDescription className="text-body-sm text-muted-strong">
              Automated crawlers and manual escalations surfaced these events for review.
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
                  No incidents in this window
                </p>
                <p className="text-body-sm text-muted-strong">
                  Uptime has held steady. Keep proactive alerts armed as safeguards.
                </p>
              </div>
            ) : (
              <div className="token-stack-sm">
                {data.incidents.map((incident) => (
                  <IncidentRow key={incident.id} incident={incident} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="bg-surface-elevated border-subtle">
          <CardHeader className="token-stack-sm">
            <CardTitle className="text-heading-sm">Live alerting</CardTitle>
            <CardDescription className="text-body-sm text-muted-strong">
              Channel routing and thresholds designed for the admin governance guardrails.
            </CardDescription>
          </CardHeader>
          <CardContent className="token-stack-sm">
            {data.alerts.map((alert) => (
              <AlertRow key={alert.id} alert={alert} />
            ))}
          </CardContent>
        </Card>
      </div>
      <Card className="bg-surface-elevated border-subtle">
        <CardHeader className="token-stack-sm">
          <CardTitle className="text-heading-sm">Persona impact pulse</CardTitle>
          <CardDescription className="text-body-sm text-muted-strong">
            Cross-role snapshots highlight how governance decisions ripple through the
            platform.
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
                    ? "Momentum building"
                    : firstPersona.direction === "down"
                      ? "Requires intervention"
                      : "Holding steady"}
                </span>
              </div>
            </div>
          ) : null}
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {otherPersonas.map((impact) => (
              <PersonaImpactRow key={impact.personaId} impact={impact} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
