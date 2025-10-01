import { useMutation, useQueryClient } from "@tanstack/react-query";
import { differenceInHours, format, formatDistanceToNowStrict } from "date-fns";
import {
  AlertTriangleIcon,
  ArrowUpRightIcon,
  CalendarClockIcon,
  CheckIcon,
  ClockIcon,
  FilterIcon,
  FlagIcon,
  Loader2Icon,
  SparklesIcon,
  StickyNoteIcon,
  TargetIcon,
  UserPlusIcon,
  UsersIcon,
  WifiOffIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";

import { Avatar } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { Textarea } from "~/components/ui/textarea";
import { updateGmPipelineNote } from "~/features/gm/gm.queries";
import type {
  GmPipelineHealth,
  GmPipelineNote,
  GmPipelineOpportunity,
  GmPipelineSnapshot,
  GmPipelineStage,
} from "~/features/gm/gm.types";
import { useLocalStorage } from "~/shared/hooks/useLocalStorage";
import { useOnlineStatus } from "~/shared/hooks/useOnlineStatus";
import { cn } from "~/shared/lib/utils";
import type { OperationResult } from "~/shared/types/common";

interface GameMasterB2bPipelineProps {
  stages: GmPipelineStage[];
  opportunities: GmPipelineOpportunity[];
}

type FocusMode = "mine" | "all";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const healthCopy: Record<GmPipelineHealth, { label: string; className: string }> = {
  on_track: {
    label: "On track",
    className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  },
  attention: {
    label: "Needs attention",
    className: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  },
  at_risk: {
    label: "At risk",
    className: "bg-rose-500/10 text-rose-600 border-rose-500/20",
  },
};

export function GameMasterB2bPipeline({
  stages,
  opportunities,
}: GameMasterB2bPipelineProps) {
  const [focusMode, setFocusMode] = useState<FocusMode>("mine");
  const stageBuckets = useMemo(() => {
    const grouped = new Map<
      string,
      { filtered: GmPipelineOpportunity[]; total: number }
    >();
    stages.forEach((stage) => {
      grouped.set(stage.id, { filtered: [], total: 0 });
    });

    opportunities.forEach((opportunity) => {
      const entry = grouped.get(opportunity.stageId);
      if (!entry) {
        return;
      }

      entry.total += 1;
      const matches = focusMode === "all" || isOpportunityInFocus(opportunity);

      if (matches) {
        entry.filtered.push(opportunity);
      }
    });

    grouped.forEach((entry) => {
      entry.filtered = sortOpportunities(entry.filtered);
    });

    return grouped;
  }, [focusMode, opportunities, stages]);

  const summary = useMemo(() => buildPipelineSummary(opportunities), [opportunities]);
  const hasNoOpportunities = opportunities.length === 0;

  return (
    <Card>
      <CardHeader className="gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-2xl">B2B collaboration pipeline</CardTitle>
          <p className="text-muted-foreground text-sm">
            Follow every corporate opportunity with clear handoffs, story-guide cues, and
            escalation hooks tied to platform oversight.
          </p>
        </div>
        <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs">
          {opportunities.length} active opportunities
        </Badge>
      </CardHeader>
      <CardContent className="space-y-5">
        {hasNoOpportunities ? null : (
          <div className="border-border/60 bg-muted/30 flex flex-col gap-4 rounded-3xl border p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold">Focus cues tuned for you</p>
                <p className="text-muted-foreground text-xs">
                  Highlight urgent narrative threads, live escalations, and renewals at
                  risk without losing sight of the broader pipeline.
                </p>
              </div>
              <FocusToggle focusMode={focusMode} onChange={setFocusMode} />
            </div>
            <FocusSummary {...summary} />
          </div>
        )}
        {hasNoOpportunities ? (
          <div className="border-border/70 bg-muted/40 flex flex-col items-center gap-3 rounded-2xl border border-dashed p-8 text-center">
            <StickyNoteIcon className="text-muted-foreground/80 size-10" />
            <div className="space-y-1">
              <p className="text-foreground text-lg font-semibold">
                No active B2B threads yet
              </p>
              <p className="text-muted-foreground text-sm">
                As soon as an opportunity is logged, stages, assignments, and escalation
                hooks will appear here.
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <a href="/dashboard/campaigns/create">Plan corporate pilot</a>
            </Button>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {stages.map((stage) => {
              const entry = stageBuckets.get(stage.id);
              const items = entry?.filtered ?? [];
              const total = entry?.total ?? 0;
              return (
                <StageColumn
                  key={stage.id}
                  stage={stage}
                  opportunities={items}
                  totalOpportunities={total}
                  focusMode={focusMode}
                />
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface StageColumnProps {
  stage: GmPipelineStage;
  opportunities: GmPipelineOpportunity[];
  totalOpportunities: number;
  focusMode: FocusMode;
}

interface FocusToggleProps {
  focusMode: FocusMode;
  onChange: (mode: FocusMode) => void;
}

interface FocusSummaryProps {
  total: number;
  focusThreads: number;
  atRisk: number;
  activeEscalations: number;
  dueSoon: number;
}

function FocusToggle({ focusMode, onChange }: FocusToggleProps) {
  const options: Array<{ value: FocusMode; label: string; description: string }> = [
    {
      value: "mine",
      label: "My focus",
      description: "Urgent, escalated, or at-risk threads assigned to you.",
    },
    {
      value: "all",
      label: "Entire pipeline",
      description: "View every in-flight opportunity across teams.",
    },
  ];

  return (
    <div className="border-border/60 bg-background/80 flex flex-col gap-2 rounded-2xl border p-3 text-xs sm:flex-row sm:items-center">
      <div className="text-muted-foreground flex items-center gap-2">
        <FilterIcon className="size-4" />
        <span className="text-[11px] font-semibold tracking-wide uppercase">View</span>
      </div>
      <div className="flex flex-1 gap-2">
        {options.map((option) => {
          const isActive = option.value === focusMode;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              aria-pressed={isActive}
              className={cn(
                "focus-visible:ring-primary flex-1 rounded-xl border px-3 py-2 text-left transition focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none",
                isActive
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              <span className="text-[11px] font-semibold tracking-wide uppercase">
                {option.label}
              </span>
              <span className="text-muted-foreground block text-[11px] leading-relaxed">
                {option.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FocusSummary({
  total,
  focusThreads,
  atRisk,
  activeEscalations,
  dueSoon,
}: FocusSummaryProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      <SummaryPill
        icon={<SparklesIcon className="size-4" />}
        label="Active opportunities"
        value={total}
        assistive="Across every stage"
      />
      <SummaryPill
        icon={<TargetIcon className="size-4" />}
        label="My focus"
        value={focusThreads}
        assistive="Urgent & assigned to you"
      />
      <SummaryPill
        icon={<AlertTriangleIcon className="size-4" />}
        label="Renewals at risk"
        value={atRisk}
        assistive="Needs save plans"
      />
      <SummaryPill
        icon={<FlagIcon className="size-4" />}
        label="Escalations live"
        value={activeEscalations}
        assistive="Monitoring or triggered"
      />
      <SummaryPill
        icon={<ClockIcon className="size-4" />}
        label="Follow-ups due"
        value={dueSoon}
        assistive="Within 48 hours"
      />
    </div>
  );
}

interface SummaryPillProps {
  icon: ReactNode;
  label: string;
  value: number;
  assistive: string;
}

function SummaryPill({ icon, label, value, assistive }: SummaryPillProps) {
  return (
    <div className="border-border/60 bg-background/70 flex flex-col gap-1 rounded-2xl border p-3 text-xs">
      <div className="text-muted-foreground flex items-center gap-2">
        {icon}
        <span className="font-semibold tracking-wide uppercase">{label}</span>
      </div>
      <span className="text-foreground text-2xl font-semibold">{value}</span>
      <span className="text-muted-foreground text-[11px]">{assistive}</span>
    </div>
  );
}

function StageColumn({
  stage,
  opportunities,
  totalOpportunities,
  focusMode,
}: StageColumnProps) {
  const serviceLevelHours = Math.round(stage.serviceLevelMinutes / 60);
  const isFocusFiltered = focusMode !== "all";
  const badgeCopy = isFocusFiltered
    ? `${opportunities.length} of ${totalOpportunities}`
    : `${opportunities.length}`;

  return (
    <div className="border-border/60 bg-muted/20 min-w-[300px] flex-1 rounded-3xl border p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            {stage.label}
          </p>
          <p className="text-foreground text-sm leading-relaxed font-medium">
            {stage.description}
          </p>
        </div>
        <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
          {badgeCopy}
        </Badge>
      </div>
      <p className="text-muted-foreground mt-3 flex items-center gap-2 text-[11px] tracking-wide uppercase">
        <ClockIcon className="size-3.5" /> Respond within {serviceLevelHours} hrs
      </p>
      <div className="text-muted-foreground mt-2 space-y-1 text-xs">
        {stage.exitCriteria.map((criteria) => (
          <div key={criteria} className="flex items-start gap-2">
            <CheckIcon className="text-muted-foreground/70 mt-[2px] size-3.5" />
            <span>{criteria}</span>
          </div>
        ))}
      </div>
      <Separator className="my-4" />
      <div className="space-y-3">
        {opportunities.length === 0 ? (
          <div className="border-border/50 bg-background/70 flex flex-col items-center gap-2 rounded-2xl border border-dashed p-5 text-center text-sm">
            <UsersIcon className="text-muted-foreground/80 size-8" />
            <p className="text-muted-foreground">
              {isFocusFiltered && totalOpportunities > 0
                ? "No urgent focus threads in this stage."
                : "Stage is clear. Stay ready for the next narrative handshake."}
            </p>
          </div>
        ) : (
          opportunities.map((opportunity) => {
            const focusMeta = getOpportunityFocusMeta(opportunity);
            return (
              <OpportunityCard
                key={opportunity.id}
                opportunity={opportunity}
                focusMeta={focusMeta}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

interface OpportunityFocusMeta {
  isAssignedToStoryGuide: boolean;
  hasActiveEscalation: boolean;
  followUpStatus: "overdue" | "dueSoon" | "scheduled";
  followUpCopy: string;
  highlightTone: "critical" | "warning" | "info" | null;
  highlightLabel: string | null;
  highlightClassName: string;
  isFocusCandidate: boolean;
}

function buildPipelineSummary(opportunities: GmPipelineOpportunity[]): FocusSummaryProps {
  return opportunities.reduce<FocusSummaryProps>(
    (accumulator, opportunity) => {
      accumulator.total += 1;
      const focusMeta = getOpportunityFocusMeta(opportunity);
      if (focusMeta.isFocusCandidate) {
        accumulator.focusThreads += 1;
      }
      if (opportunity.health === "at_risk") {
        accumulator.atRisk += 1;
      }
      if (focusMeta.hasActiveEscalation) {
        accumulator.activeEscalations += 1;
      }
      if (focusMeta.followUpStatus !== "scheduled") {
        accumulator.dueSoon += 1;
      }
      return accumulator;
    },
    { total: 0, focusThreads: 0, atRisk: 0, activeEscalations: 0, dueSoon: 0 },
  );
}

function isOpportunityInFocus(opportunity: GmPipelineOpportunity) {
  return getOpportunityFocusMeta(opportunity).isFocusCandidate;
}

function sortOpportunities(opportunities: GmPipelineOpportunity[]) {
  const priorityOrder = (meta: OpportunityFocusMeta) => {
    if (meta.highlightTone === "critical") {
      return 0;
    }
    if (meta.highlightTone === "warning") {
      return 1;
    }
    if (meta.highlightTone === "info") {
      return 2;
    }
    if (meta.followUpStatus !== "scheduled") {
      return 3;
    }
    return 4;
  };

  return [...opportunities].sort((first, second) => {
    const firstMeta = getOpportunityFocusMeta(first);
    const secondMeta = getOpportunityFocusMeta(second);

    const priorityDelta = priorityOrder(firstMeta) - priorityOrder(secondMeta);
    if (priorityDelta !== 0) {
      return priorityDelta;
    }

    const followUpDelta =
      new Date(first.followUpDueAt).getTime() - new Date(second.followUpDueAt).getTime();
    if (followUpDelta !== 0) {
      return followUpDelta;
    }

    return first.organization.localeCompare(second.organization);
  });
}

function getOpportunityFocusMeta(
  opportunity: GmPipelineOpportunity,
): OpportunityFocusMeta {
  const now = new Date();
  const followUpDue = new Date(opportunity.followUpDueAt);
  const hoursUntilFollowUp = differenceInHours(followUpDue, now);
  const followUpStatus =
    hoursUntilFollowUp < 0
      ? "overdue"
      : hoursUntilFollowUp <= 48
        ? "dueSoon"
        : "scheduled";
  const hasActiveEscalation = opportunity.escalationHooks.some(
    (hook) => hook.status !== "idle",
  );
  const isAssignedToStoryGuide = opportunity.assignments.some(
    (assignment) => assignment.role === "story_guide",
  );
  const isAtRisk = opportunity.health === "at_risk";
  const needsAttention = opportunity.health === "attention";

  let highlightTone: OpportunityFocusMeta["highlightTone"] = null;
  let highlightLabel: string | null = null;
  let highlightClassName = "bg-muted text-muted-foreground";

  if (isAtRisk) {
    highlightTone = "critical";
    highlightLabel = "Renewal at risk";
    highlightClassName = "border border-rose-500/30 bg-rose-500/10 text-rose-600";
  } else if (hasActiveEscalation) {
    highlightTone = "warning";
    highlightLabel = "Escalation active";
    highlightClassName = "border border-amber-500/30 bg-amber-500/10 text-amber-600";
  } else if (followUpStatus === "overdue") {
    highlightTone = "warning";
    highlightLabel = "Follow-up overdue";
    highlightClassName = "border border-amber-500/30 bg-amber-500/10 text-amber-600";
  } else if (followUpStatus === "dueSoon") {
    highlightTone = "info";
    highlightLabel = "Follow-up due within 48h";
    highlightClassName = "border border-indigo-500/30 bg-indigo-500/10 text-indigo-600";
  } else if (needsAttention) {
    highlightTone = "info";
    highlightLabel = "Momentum check";
    highlightClassName = "border border-indigo-500/30 bg-indigo-500/10 text-indigo-600";
  }

  const isFocusCandidate =
    isAssignedToStoryGuide &&
    (isAtRisk || hasActiveEscalation || followUpStatus !== "scheduled" || needsAttention);

  const followUpCopy =
    followUpStatus === "overdue"
      ? "Overdue — reconnect now"
      : followUpStatus === "dueSoon"
        ? "Due within 48 hours"
        : "On cadence";

  return {
    isAssignedToStoryGuide,
    hasActiveEscalation,
    followUpStatus,
    followUpCopy,
    highlightTone,
    highlightLabel,
    highlightClassName,
    isFocusCandidate,
  };
}

function getOpportunityHighlightClass(meta: OpportunityFocusMeta) {
  if (!meta.isFocusCandidate) {
    return "";
  }

  switch (meta.highlightTone) {
    case "critical":
      return "border-rose-500/60 shadow-[0_0_0_1px_rgba(244,63,94,0.25)]";
    case "warning":
      return "border-amber-500/50 shadow-[0_0_0_1px_rgba(245,158,11,0.25)]";
    case "info":
      return "border-indigo-500/50 shadow-[0_0_0_1px_rgba(99,102,241,0.2)]";
    default:
      return "border-primary/40";
  }
}

interface OpportunityCardProps {
  opportunity: GmPipelineOpportunity;
  focusMeta: OpportunityFocusMeta;
}

function OpportunityCard({ opportunity, focusMeta }: OpportunityCardProps) {
  const health = healthCopy[opportunity.health];
  const followUpDue = new Date(opportunity.followUpDueAt);
  const stageDuration = formatDistanceToNowStrict(new Date(opportunity.stageEnteredAt), {
    addSuffix: false,
  });
  const lastInteractionDistance = formatDistanceToNowStrict(
    new Date(opportunity.lastInteractionAt),
    { addSuffix: true },
  );

  return (
    <div
      className={cn(
        "border-border/60 bg-background/70 flex flex-col gap-3 rounded-2xl border p-4 shadow-sm",
        getOpportunityHighlightClass(focusMeta),
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-foreground text-base font-semibold">
              {opportunity.organization}
            </p>
            <Badge
              variant="outline"
              className={cn("border px-2 py-0.5 text-xs", health.className)}
            >
              {health.label}
            </Badge>
          </div>
          {focusMeta.highlightLabel ? (
            <Badge
              className={cn(
                "w-fit rounded-full text-[10px] uppercase",
                focusMeta.highlightClassName,
              )}
            >
              <SparklesIcon className="mr-1 size-3" /> {focusMeta.highlightLabel}
            </Badge>
          ) : null}
          <p className="text-muted-foreground text-xs">
            {opportunity.location ?? "Location TBD"}
          </p>
          <div className="text-muted-foreground text-xs">
            <span className="font-medium">Point of contact:</span>{" "}
            {opportunity.pointOfContact}
            {opportunity.contactTitle ? ` — ${opportunity.contactTitle}` : ""}
          </div>
        </div>
        <div className="text-muted-foreground text-right text-xs">
          <p>{currencyFormatter.format(opportunity.potentialValue)}</p>
          <p>Entered stage {stageDuration} ago</p>
          <p>Last touch {lastInteractionDistance}</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <div className="bg-primary/5 rounded-2xl p-3 text-xs">
            <p className="text-primary font-medium tracking-wide uppercase">Next step</p>
            <p className="text-foreground mt-1 text-sm leading-relaxed">
              {opportunity.nextStep}
            </p>
            <p
              className={cn(
                "mt-2 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
                focusMeta.followUpStatus === "overdue"
                  ? "border-rose-500/40 bg-rose-500/10 text-rose-600"
                  : focusMeta.followUpStatus === "dueSoon"
                    ? "border-amber-500/40 bg-amber-500/10 text-amber-600"
                    : "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
              )}
            >
              <ClockIcon className="size-3" />
              {focusMeta.followUpStatus === "overdue"
                ? "Follow-up overdue"
                : focusMeta.followUpStatus === "dueSoon"
                  ? "Follow-up due soon"
                  : "Follow-up due"}{" "}
              {format(followUpDue, "MMM d, h:mmaaa")}
            </p>
          </div>
          <div className="bg-muted/60 rounded-2xl p-3 text-xs">
            <p className="text-muted-foreground font-medium tracking-wide uppercase">
              Services in scope
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {opportunity.services.map((service) => (
                <Badge
                  key={service}
                  variant="outline"
                  className="rounded-full text-[11px]"
                >
                  {service}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <AssignmentList assignments={opportunity.assignments} />
          <EscalationList escalationHooks={opportunity.escalationHooks} />
        </div>
      </div>

      <div className="bg-muted/40 rounded-2xl px-3 py-2 text-xs">
        <div className="text-muted-foreground flex flex-wrap items-center gap-3">
          <CalendarClockIcon className="size-4" />
          <span>
            Follow-up cadence: {focusMeta.followUpCopy} (
            {format(followUpDue, "MMM d, h:mmaaa")})
          </span>
        </div>
      </div>

      {opportunity.linkedCampaignName ? (
        <div className="bg-muted/40 text-muted-foreground rounded-2xl px-3 py-2 text-xs">
          <ArrowUpRightIcon className="text-primary mr-2 inline size-4 align-middle" />
          Linked to {opportunity.linkedCampaignName}
        </div>
      ) : null}

      <PipelineNoteEditor opportunity={opportunity} />
    </div>
  );
}

interface AssignmentListProps {
  assignments: GmPipelineOpportunity["assignments"];
}

function AssignmentList({ assignments }: AssignmentListProps) {
  const primaryStoryGuide = assignments.find(
    (assignment) => assignment.role === "story_guide",
  );
  return (
    <div className="border-border/60 bg-background/80 rounded-2xl border p-3 text-xs">
      <p className="text-muted-foreground font-medium tracking-wide uppercase">
        Assigned partners
      </p>
      <div className="mt-3 flex flex-wrap gap-3">
        {assignments.map((assignment) => (
          <div key={assignment.id} className="flex items-center gap-2">
            <Avatar
              name={assignment.name}
              email={assignment.email ?? null}
              className="border-border/60 size-9 border"
              fallbackClassName={cn(
                "text-xs font-semibold uppercase text-white",
                assignment.avatarColor ?? "bg-muted",
              )}
            />
            <div className="space-y-0.5">
              <p className="text-foreground text-sm leading-tight font-medium">
                {assignment.name}
              </p>
              <Badge
                variant="outline"
                className="rounded-full text-[10px] tracking-wider uppercase"
              >
                {assignment.role === "story_guide" &&
                primaryStoryGuide?.id === assignment.id
                  ? "Story guide (you)"
                  : assignment.role.replace("_", " ")}
              </Badge>
            </div>
          </div>
        ))}
      </div>
      <div className="border-border/60 text-muted-foreground mt-3 inline-flex items-center gap-1 rounded-full border border-dashed px-2 py-0.5 text-[11px]">
        <UserPlusIcon className="size-3.5" /> Loop additional specialists via Platform
        Admin
      </div>
    </div>
  );
}

interface EscalationListProps {
  escalationHooks: GmPipelineOpportunity["escalationHooks"];
}

function EscalationList({ escalationHooks }: EscalationListProps) {
  if (escalationHooks.length === 0) {
    return (
      <div className="border-border/60 bg-background/80 text-muted-foreground rounded-2xl border p-3 text-xs">
        <p className="font-medium tracking-wide uppercase">Escalation hooks</p>
        <p className="mt-2 text-sm">No escalation hooks configured yet.</p>
      </div>
    );
  }

  return (
    <div className="border-border/60 bg-background/80 rounded-2xl border p-3 text-xs">
      <p className="text-muted-foreground font-medium tracking-wide uppercase">
        Escalation hooks
      </p>
      <div className="mt-2 space-y-2">
        {escalationHooks.map((hook) => {
          const isActive = hook.status !== "idle";
          return (
            <div
              key={hook.id}
              className={cn(
                "rounded-xl border p-3",
                hook.status === "triggered"
                  ? "border-rose-500/40 bg-rose-500/10"
                  : hook.status === "monitoring"
                    ? "border-amber-500/40 bg-amber-500/10"
                    : "border-border/60 bg-background/80",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-foreground text-sm font-semibold">{hook.title}</p>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    {hook.description}
                  </p>
                </div>
                {isActive ? (
                  <Badge
                    variant="outline"
                    className="rounded-full border-white/30 text-[10px] tracking-wider uppercase"
                  >
                    {hook.status === "triggered" ? "Triggered" : "Monitoring"}
                  </Badge>
                ) : null}
              </div>
              {isActive ? (
                <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                  <FlagIcon className="size-3.5" /> Escalate via{" "}
                  {hook.escalateToRole.replace("_", " ")}
                  {hook.requiresResponseBy ? (
                    <span className="border-border/50 inline-flex items-center gap-1 rounded-full border px-2 py-0.5">
                      <ClockIcon className="size-3" /> Resolve by{" "}
                      {format(new Date(hook.requiresResponseBy), "MMM d, h:mmaaa")}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface PipelineNoteEditorProps {
  opportunity: GmPipelineOpportunity;
}

type SyncState = "synced" | "pending" | "syncing" | "offline" | "error" | "conflict";

function PipelineNoteEditor({ opportunity }: PipelineNoteEditorProps) {
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();
  const serverNote = opportunity.note;
  const [draft, setDraft] = useLocalStorage<string>(
    `gm-b2b-note-${serverNote.id}`,
    serverNote.content,
  );
  const [syncState, dispatchSyncState] = useReducer(
    (_: SyncState, action: SyncState) => action,
    "synced",
  );
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [conflictNote, setConflictNote] = useState<GmPipelineNote | null>(null);
  const lastServerUpdateRef = useRef(serverNote.updatedAt);

  useEffect(() => {
    if (serverNote.updatedAt === lastServerUpdateRef.current) {
      return;
    }
    lastServerUpdateRef.current = serverNote.updatedAt;
    if (!conflictNote) {
      setDraft((current) =>
        current === serverNote.content ? current : serverNote.content,
      );
      const nextState: SyncState = isOnline ? "synced" : "offline";
      if (syncState !== nextState) {
        dispatchSyncState(nextState);
      }
    }
  }, [
    conflictNote,
    dispatchSyncState,
    isOnline,
    serverNote.content,
    serverNote.updatedAt,
    setDraft,
    syncState,
  ]);

  const mutation = useMutation({
    mutationFn: async (content: { value: string; lastSyncedAt: string | null }) =>
      updateGmPipelineNote({
        data: {
          opportunityId: opportunity.id,
          noteId: opportunity.note.id,
          content: content.value,
          lastSyncedAt: content.lastSyncedAt,
        },
      }),
    onSuccess: (result) => {
      if (!result.success) {
        dispatchSyncState("error");
        return;
      }

      const outcome = result.data.outcome;
      const updatedNote = result.data.note;

      if (outcome === "conflict") {
        setConflictNote(updatedNote);
        dispatchSyncState("conflict");
        setAutoSyncEnabled(false);
        return;
      }

      setConflictNote(null);
      dispatchSyncState("synced");
      setAutoSyncEnabled(true);
      setDraft(updatedNote.content);
      queryClient.setQueryData<OperationResult<GmPipelineSnapshot>>(
        ["gm", "dashboard", "pipeline"],
        (previous) => {
          if (!previous || !previous.success) {
            return previous;
          }

          return {
            ...previous,
            data: {
              ...previous.data,
              opportunities: previous.data.opportunities.map((item) =>
                item.id === opportunity.id ? { ...item, note: updatedNote } : item,
              ),
            },
          };
        },
      );
    },
    onError: () => {
      dispatchSyncState("error");
      setAutoSyncEnabled(false);
    },
  });
  const mutateNote = mutation.mutate;

  useEffect(() => {
    if (!autoSyncEnabled) {
      return;
    }

    const trimmedDraft = draft.trim();
    const trimmedSynced = serverNote.content.trim();

    if (trimmedDraft === trimmedSynced) {
      const nextState: SyncState = isOnline ? "synced" : "offline";
      if (syncState !== nextState) {
        dispatchSyncState(nextState);
      }
      return;
    }

    if (!isOnline) {
      if (syncState !== "offline") {
        dispatchSyncState("offline");
      }
      return;
    }

    if (syncState !== "pending") {
      dispatchSyncState("pending");
    }
    const handle = window.setTimeout(() => {
      dispatchSyncState("syncing");
      mutateNote({ value: draft, lastSyncedAt: serverNote.updatedAt });
    }, 900);

    return () => window.clearTimeout(handle);
  }, [
    autoSyncEnabled,
    draft,
    isOnline,
    mutateNote,
    serverNote.content,
    serverNote.updatedAt,
    syncState,
  ]);

  const retrySync = () => {
    if (!isOnline) {
      return;
    }
    setAutoSyncEnabled(true);
    dispatchSyncState("syncing");
    mutateNote({
      value: draft,
      lastSyncedAt: conflictNote?.updatedAt ?? serverNote.updatedAt,
    });
  };

  const acceptServerVersion = () => {
    if (!conflictNote) {
      return;
    }
    setDraft(conflictNote.content);
    setConflictNote(null);
    setAutoSyncEnabled(true);
    lastServerUpdateRef.current = conflictNote.updatedAt;
    dispatchSyncState("synced");
  };

  const syncCopy = getSyncCopy(syncState, isOnline);

  return (
    <div className="border-border/60 bg-muted/30 rounded-2xl border border-dashed p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold">Studio note</p>
        <div className={cn(syncCopy.className, "inline-flex items-center gap-2 text-xs")}>
          {syncCopy.icon}
          <span>{syncCopy.label}</span>
        </div>
      </div>
      <Textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        className="border-border/50 bg-background/80 mt-3 min-h-[120px] resize-y rounded-xl border text-sm"
        placeholder="Capture decision cues, safety context, or production blockers."
      />
      <div className="text-muted-foreground mt-3 flex flex-wrap items-center justify-between gap-3 text-[11px]">
        <span>
          Last updated by {serverNote.updatedBy.name} on{" "}
          {format(new Date(serverNote.updatedAt), "MMM d, yyyy h:mmaaa")}
        </span>
        {syncState === "conflict" ? (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-[11px]"
              onClick={acceptServerVersion}
            >
              Accept platform update
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-[11px]"
              onClick={retrySync}
              disabled={!isOnline}
            >
              Overwrite with my note
            </Button>
          </div>
        ) : null}
        {syncState === "error" ? (
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3 text-[11px]"
            onClick={retrySync}
            disabled={!isOnline}
          >
            Retry sync
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function getSyncCopy(state: SyncState, isOnline: boolean) {
  switch (state) {
    case "synced":
      return {
        label: "Synced",
        icon: <CheckIcon className="size-3" />,
        className: "text-emerald-600",
      };
    case "pending":
      return {
        label: "Pending sync",
        icon: <ClockIcon className="size-3" />,
        className: "text-amber-600",
      };
    case "syncing":
      return {
        label: "Syncing…",
        icon: <Loader2Icon className="size-3 animate-spin" />,
        className: "text-primary",
      };
    case "offline":
      return {
        label: isOnline ? "Ready to sync" : "Offline — saved locally",
        icon: <WifiOffIcon className="size-3" />,
        className: "text-muted-foreground",
      };
    case "error":
      return {
        label: "Sync failed",
        icon: <AlertTriangleIcon className="size-3" />,
        className: "text-rose-600",
      };
    case "conflict":
      return {
        label: "Conflict detected",
        icon: <AlertTriangleIcon className="size-3" />,
        className: "text-amber-600",
      };
    default:
      return {
        label: "",
        icon: null,
        className: "text-muted-foreground",
      };
  }
}
