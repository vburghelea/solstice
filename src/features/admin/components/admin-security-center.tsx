import { format, formatDistanceToNow } from "date-fns";
import {
  AlertCircleIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  ClipboardListIcon,
  CloudOffIcon,
  Loader2Icon,
  RefreshCwIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  ShieldOffIcon,
  SirenIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
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
import { Textarea } from "~/components/ui/textarea";
import { useAdminTranslation } from "~/hooks/useTypedTranslation";
import { cn } from "~/shared/lib/utils";

import {
  useAdminSecurityPosture,
  useUpdateAdminSecurityControl,
  type AdminSecurityControl,
  type AdminSecurityEvent,
  type AdminSecurityIncident,
  type AdminSecurityRecommendation,
} from "../security/admin-security.queries";

interface PendingControl {
  control: AdminSecurityControl;
  nextEnabled: boolean;
}

const impactTone: Record<AdminSecurityControl["impact"], string> = {
  critical: "bg-destructive/10 text-destructive border-destructive/20",
  high: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  medium: "bg-primary/10 text-primary border-primary/20",
};

const incidentTone: Record<AdminSecurityIncident["severity"], string> = {
  high: "border-destructive/20 bg-destructive/5",
  medium: "border-amber-500/20 bg-amber-500/10",
  low: "border-primary/20 bg-primary/10",
};

const statusTone: Record<AdminSecurityIncident["status"], string> = {
  investigating: "text-amber-600",
  mitigated: "text-primary",
  resolved: "text-emerald-600",
};

const recommendationTone: Record<AdminSecurityRecommendation["status"], string> = {
  open: "bg-muted text-muted-foreground border-transparent",
  "in-progress": "bg-primary/10 text-primary border-primary/20",
  complete: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
};

const channelTone: Record<AdminSecurityEvent["channel"], string> = {
  manual: "bg-primary/10 text-primary border-primary/20",
  automation: "bg-sky-500/10 text-sky-600 border-sky-500/20",
  system: "bg-muted text-muted-foreground border-transparent",
};

const riskTone: Record<AdminSecurityEvent["riskLevel"], string> = {
  high: "text-destructive",
  medium: "text-amber-600",
  low: "text-emerald-600",
};

function SecuritySkeleton() {
  return (
    <div className="token-stack-lg">
      <Card className="bg-surface-elevated border-subtle">
        <CardHeader className="token-stack-sm">
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-80" />
        </CardHeader>
        <CardContent className="token-stack-sm">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-4 w-56" />
        </CardContent>
      </Card>
      <Card className="bg-surface-elevated border-subtle">
        <CardHeader className="token-stack-sm">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="token-stack-md grid gap-4 md:grid-cols-2">
          {[0, 1, 2, 3].map((item) => (
            <div
              key={item}
              className="border-muted-foreground/30 rounded-xl border border-dashed p-4"
            >
              <Skeleton className="h-5 w-40" />
              <Skeleton className="mt-2 h-4 w-full" />
              <Skeleton className="mt-4 h-9 w-32" />
            </div>
          ))}
        </CardContent>
      </Card>
      <div className="token-gap-md grid gap-4 lg:grid-cols-2">
        {[0, 1, 2].map((key) => (
          <Card key={key} className="bg-surface-elevated border-subtle">
            <CardHeader className="token-stack-sm">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-72" />
            </CardHeader>
            <CardContent className="token-stack-sm">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function formatTimestamp(value: Date) {
  return `${format(value, "PPpp")} (${formatDistanceToNow(value, { addSuffix: true })})`;
}

export function AdminSecurityCenter() {
  const { t } = useAdminTranslation();
  const [pendingControl, setPendingControl] = useState<PendingControl | null>(null);
  const [reason, setReason] = useState("");
  const windowDays = 30;
  const { data, isLoading, refetch, isFetching } = useAdminSecurityPosture({
    windowDays,
  });
  const updateControl = useUpdateAdminSecurityControl(windowDays);

  if (isLoading && !data) {
    return <SecuritySkeleton />;
  }

  if (!data) {
    return (
      <Alert variant="destructive" role="alert">
        <AlertCircleIcon aria-hidden className="size-5" />
        <AlertTitle>
          {t("security_center.hardcoded_strings.unable_to_load_security_posture")}
        </AlertTitle>
        <AlertDescription>
          {t(
            "security_center.hardcoded_strings.could_not_retrieve_governance_safeguards",
          )}
        </AlertDescription>
      </Alert>
    );
  }

  const summary = data.summary;
  const controls = [...data.controls].sort((a, b) => {
    const impactScore = { critical: 0, high: 1, medium: 2 } as const;
    return impactScore[a.impact] - impactScore[b.impact];
  });

  const incidents = data.incidents;
  const activeIncidents = incidents.filter((incident) => incident.status !== "resolved");
  const eventLog = data.eventLog.slice(0, 6);

  function openConfirmation(control: AdminSecurityControl, nextEnabled: boolean) {
    setReason("");
    setPendingControl({ control, nextEnabled });
  }

  async function handleConfirm() {
    if (!pendingControl) return;
    try {
      await updateControl.mutateAsync({
        controlId: pendingControl.control.id,
        enabled: pendingControl.nextEnabled,
        reason: reason.trim(),
      });
      toast.success(
        `${pendingControl.nextEnabled ? t("security_center.hardcoded_strings.enabled") : t("security_center.hardcoded_strings.disabled")} ${pendingControl.control.label}`,
      );
      setPendingControl(null);
      setReason("");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : t("security_center.messages.unable_to_update_control");
      toast.error(message);
    }
  }

  const isReasonValid = reason.trim().length >= 12;
  const dialogLabel = pendingControl?.nextEnabled
    ? t("security_center.actions.enable_safeguard")
    : t("security_center.actions.disable_safeguard");
  const ControlIcon = summary.status === "stable" ? ShieldCheckIcon : ShieldAlertIcon;

  return (
    <div className="token-stack-xl">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="token-stack-xs">
          <p className="text-body-xs text-muted-foreground tracking-wide uppercase">
            {t("security_center.title")}
          </p>
          <h1 className="text-heading-sm text-foreground font-semibold">
            {t("security_center.subtitle")}
          </h1>
          <p className="text-body-sm text-muted-strong max-w-2xl">
            {t("security_center.description")}
          </p>
        </div>
        <Button
          variant="outline"
          className="self-start"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          {isFetching ? (
            <Loader2Icon className="mr-2 size-4 animate-spin" />
          ) : (
            <RefreshCwIcon className="mr-2 size-4" />
          )}
          {t("security_center.actions.refresh_snapshot")}
        </Button>
      </header>

      <Card className="bg-surface-elevated border-subtle">
        <CardHeader className="token-stack-sm">
          <CardTitle className="text-heading-xs flex items-center gap-2">
            <ControlIcon aria-hidden className="size-5" />
            {summary.status === "stable"
              ? t("security_center.status.stable_governance_posture")
              : t("security_center.status.heightened_monitoring")}
          </CardTitle>
          <CardDescription className="text-body-sm text-muted-strong">
            {summary.narrative}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="token-stack-xs">
            <span className="text-display-sm font-semibold">{summary.score}</span>
            <p className="text-body-xs text-muted-foreground">
              Score calculated across identity, infrastructure, and audit pillars.
            </p>
          </div>
          <div className="token-stack-xs">
            <div className="text-body-sm flex items-center gap-2">
              <ArrowRightIcon aria-hidden className="text-muted-foreground size-4" />
              <span>
                {summary.direction === "up"
                  ? t("security_center.status.improving")
                  : summary.direction === "down"
                    ? t("security_center.status.declining")
                    : t("security_center.status.flat")}{" "}
                by <strong>{summary.change.toFixed(1)}%</strong> over the last{" "}
                {data.windowDays} days
              </span>
            </div>
            <p className="text-body-xs text-muted-foreground">
              Last reviewed{" "}
              {formatDistanceToNow(summary.lastUpdatedAt, { addSuffix: true })}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-surface-elevated border-subtle">
        <CardHeader className="token-stack-sm">
          <CardTitle className="text-heading-xs">
            {t("security_center.sections.critical_safeguards.title")}
          </CardTitle>
          <CardDescription className="text-body-sm text-muted-strong">
            {t("security_center.sections.critical_safeguards.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="token-stack-md">
          <div className="token-gap-md grid gap-4 lg:grid-cols-2">
            {controls.map((control) => {
              const isEnabled = control.enabled;
              const badgeTone = impactTone[control.impact];
              const ActionIcon = isEnabled ? ShieldOffIcon : ShieldCheckIcon;
              return (
                <div
                  key={control.id}
                  className="border-muted-foreground/30 bg-surface-elevated/60 rounded-xl border border-dashed p-4"
                >
                  <div className="token-stack-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className={cn("border", badgeTone)}>
                        {control.impact.toUpperCase()}
                      </Badge>
                      <h3 className="text-body-md text-foreground font-semibold">
                        {control.label}
                      </h3>
                    </div>
                    <p className="text-body-sm text-muted-strong">
                      {control.description}
                    </p>
                    <p className="text-body-xs text-muted-foreground">
                      Last reviewed{" "}
                      {formatDistanceToNow(control.lastReviewedAt, { addSuffix: true })}{" "}
                      by {control.lastUpdatedBy}. Next review in{" "}
                      {control.reviewIntervalDays} days.
                    </p>
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge
                        variant="secondary"
                        className="bg-muted text-muted-foreground"
                      >
                        {control.category}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-body-xs border-transparent",
                          isEnabled
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-destructive/10 text-destructive",
                        )}
                      >
                        {isEnabled
                          ? t("security_center.status.enforced")
                          : t("security_center.status.disabled")}
                      </Badge>
                    </div>
                    <Button
                      variant={isEnabled ? "outline" : "default"}
                      className="mt-2 inline-flex items-center gap-2"
                      disabled={
                        updateControl.isPending &&
                        pendingControl?.control.id === control.id
                      }
                      onClick={() => openConfirmation(control, !isEnabled)}
                    >
                      <ActionIcon aria-hidden className="size-4" />
                      {isEnabled
                        ? t("security_center.controls.disable_control")
                        : t("security_center.controls.enable_control")}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="token-gap-md grid gap-4 lg:grid-cols-2">
        <Card className="bg-surface-elevated border-subtle">
          <CardHeader className="token-stack-sm">
            <CardTitle className="text-heading-xs flex items-center gap-2">
              <SirenIcon aria-hidden className="text-destructive size-5" />{" "}
              {t("security_center.sections.active_incidents.title")}
            </CardTitle>
            <CardDescription className="text-body-sm text-muted-strong">
              {t("security_center.sections.active_incidents.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="token-stack-sm">
            {activeIncidents.length === 0 ? (
              <Alert className="border-emerald-500/40 bg-emerald-500/10">
                <CheckCircle2Icon aria-hidden className="size-5 text-emerald-600" />
                <AlertTitle>
                  {t("security_center.status_indicators.all_clear")}
                </AlertTitle>
                <AlertDescription>
                  {t("security_center.status_indicators.no_unresolved_incidents")}
                </AlertDescription>
              </Alert>
            ) : (
              <div className="token-stack-sm">
                {activeIncidents.map((incident) => (
                  <div
                    key={incident.id}
                    className={cn(
                      "rounded-xl border p-4",
                      incidentTone[incident.severity],
                    )}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="token-stack-xs">
                        <div className="text-body-sm flex items-center gap-2 font-semibold">
                          <span>{incident.title}</span>
                          <Badge
                            variant="outline"
                            className={cn("border", incidentTone[incident.severity])}
                          >
                            {incident.severity.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-body-xs text-muted-foreground">
                          {incident.personaImpact}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "text-body-xs font-semibold",
                          statusTone[incident.status],
                        )}
                      >
                        {incident.status === "investigating"
                          ? t("security_center.status_indicators.investigating")
                          : incident.status === "mitigated"
                            ? t("security_center.status_indicators.mitigated")
                            : t("security_center.status_indicators.resolved")}
                      </span>
                    </div>
                    <p className="text-body-sm text-muted-strong mt-2">
                      {incident.summary}
                    </p>
                    <p className="text-body-xs text-muted-foreground mt-2">
                      Detected{" "}
                      {formatDistanceToNow(incident.detectedAt, { addSuffix: true })}
                      {incident.resolvedAt
                        ? ` • Resolved ${formatDistanceToNow(incident.resolvedAt, { addSuffix: true })}`
                        : ""}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-surface-elevated border-subtle">
          <CardHeader className="token-stack-sm">
            <CardTitle className="text-heading-xs flex items-center gap-2">
              <ClipboardListIcon aria-hidden className="size-5" />{" "}
              {t("security_center.sections.compliance_checklist.title")}
            </CardTitle>
            <CardDescription className="text-body-sm text-muted-strong">
              {t("security_center.sections.compliance_checklist.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="token-stack-sm">
            {data.recommendations.map((recommendation) => (
              <div
                key={recommendation.id}
                className="border-muted-foreground/20 bg-surface-elevated/60 rounded-xl border p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="token-stack-xs">
                    <h3 className="text-body-md text-foreground font-semibold">
                      {recommendation.title}
                    </h3>
                    <p className="text-body-sm text-muted-strong">
                      {recommendation.detail}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn("border", recommendationTone[recommendation.status])}
                  >
                    {recommendation.status}
                  </Badge>
                </div>
                <div className="text-body-xs text-muted-foreground mt-3 flex flex-wrap items-center gap-3">
                  <span>
                    {t("security_center.labels.effort", {
                      effort: recommendation.effort,
                    })}
                  </span>
                  <span>
                    {t("security_center.labels.persona_impact")}:{" "}
                    {recommendation.personaImpact}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-surface-elevated border-subtle">
        <CardHeader className="token-stack-sm">
          <CardTitle className="text-heading-xs flex items-center gap-2">
            <ShieldAlertIcon aria-hidden className="size-5" />{" "}
            {t("security_center.sections.privileged_action_log.title")}
          </CardTitle>
          <CardDescription className="text-body-sm text-muted-strong">
            {t("security_center.sections.privileged_action_log.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="token-stack-sm">
          <div className="token-stack-sm">
            {eventLog.length === 0 ? (
              <div className="border-muted-foreground/30 rounded-xl border border-dashed p-6 text-center">
                <CloudOffIcon
                  aria-hidden
                  className="text-muted-foreground mx-auto mb-2 size-6"
                />
                <p className="text-body-sm text-muted-foreground">
                  {t("security_center.messages.no_recent_privileged_changes")}
                </p>
              </div>
            ) : (
              eventLog.map((event) => (
                <div
                  key={event.id}
                  className="border-muted-foreground/20 bg-surface-elevated/60 flex flex-col gap-2 rounded-xl border p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="token-stack-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn("border", channelTone[event.channel])}
                      >
                        {event.channel}
                      </Badge>
                      <span className="text-body-sm text-foreground font-semibold">
                        {event.action}
                      </span>
                    </div>
                    <p className="text-body-xs text-muted-strong">{event.context}</p>
                    <p className="text-body-xs text-muted-foreground">
                      {formatTimestamp(event.timestamp)}
                    </p>
                  </div>
                  <div className="token-stack-xs items-end">
                    <span className="text-body-xs text-muted-foreground">
                      {t("security_center.labels.actor")}
                    </span>
                    <span className="text-body-sm font-semibold">{event.actor}</span>
                    <span
                      className={cn(
                        "text-body-xs font-semibold",
                        riskTone[event.riskLevel],
                      )}
                    >
                      {event.riskLevel.toUpperCase()}{" "}
                      {t("security_center.labels.risk_level")}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog
        open={Boolean(pendingControl)}
        onOpenChange={(open) => !open && setPendingControl(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialogLabel}</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingControl?.nextEnabled
                ? t("security_center.dialog.confirm_enable_safeguard")
                : t("security_center.dialog.confirm_disable_control")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="token-stack-sm">
            <p className="text-body-sm text-muted-strong">
              {t("security_center.dialog.provide_context")}
            </p>
            <Textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              minLength={12}
              rows={4}
              placeholder={t("security_center.dialog.document_why_change_necessary")}
            />
            {!isReasonValid ? (
              <p className="text-body-xs text-destructive">
                {t("security_center.dialog.validation.min_12_characters")}
              </p>
            ) : null}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingControl(null)}>
              {t("security_center.actions.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={!isReasonValid || updateControl.isPending}
              onClick={handleConfirm}
            >
              {updateControl.isPending ? (
                <Loader2Icon aria-hidden className="mr-2 size-4 animate-spin" />
              ) : (
                <ShieldAlertIcon aria-hidden className="mr-2 size-4" />
              )}
              {t("security_center.actions.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
