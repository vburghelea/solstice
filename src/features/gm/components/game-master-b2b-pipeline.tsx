import {
  AlertTriangleIcon,
  CheckIcon,
  ClockIcon,
  FilterIcon,
  FlagIcon,
  SparklesIcon,
  StickyNoteIcon,
  TargetIcon,
  UsersIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import type {
  GmPipelineHealth,
  GmPipelineOpportunity,
  GmPipelineStage,
} from "~/features/gm/gm.types";
import { useCommonTranslation, useGmTranslation } from "~/hooks/useTypedTranslation";
import type { SupportedLanguage } from "~/lib/i18n/config";
import { cn } from "~/shared/lib/utils";
import { OpportunityCard, getOpportunityFocusMeta } from "./opportunity-card";

interface GameMasterB2bPipelineProps {
  stages: GmPipelineStage[];
  opportunities: GmPipelineOpportunity[];
}

type FocusMode = "mine" | "all";

function createHealthCopy(
  tCommon: (key: string) => string,
): Record<GmPipelineHealth, { label: string; className: string }> {
  return {
    on_track: {
      label: tCommon("b2b_pipeline.health.on_track"),
      className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    },
    attention: {
      label: tCommon("b2b_pipeline.health.needs_attention"),
      className: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    },
    at_risk: {
      label: tCommon("b2b_pipeline.health.at_risk"),
      className: "bg-rose-500/10 text-rose-600 border-rose-500/20",
    },
  };
}

export function GameMasterB2bPipeline({
  stages,
  opportunities,
}: GameMasterB2bPipelineProps) {
  const { t: tGm, currentLanguage } = useGmTranslation();
  const { t: tCommon } = useCommonTranslation();
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
      const matches = focusMode === "all" || isOpportunityInFocus(opportunity, tGm);

      if (matches) {
        entry.filtered.push(opportunity);
      }
    });

    grouped.forEach((entry) => {
      entry.filtered = sortOpportunities(entry.filtered, tGm);
    });

    return grouped;
  }, [focusMode, opportunities, stages, tGm]);

  const summary = useMemo(
    () => buildPipelineSummary(opportunities, tGm),
    [opportunities, tGm],
  );
  const hasNoOpportunities = opportunities.length === 0;

  return (
    <Card>
      <CardHeader className="gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-2xl">{tGm("b2b_pipeline.title")}</CardTitle>
          <p className="text-muted-foreground text-sm">{tGm("b2b_pipeline.subtitle")}</p>
        </div>
        <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs">
          {tGm("b2b_pipeline.active_opportunities", { count: opportunities.length })}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-5">
        {hasNoOpportunities ? null : (
          <div className="border-border/60 bg-muted/30 flex flex-col gap-4 rounded-3xl border p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold">
                  {tGm("b2b_pipeline.focus_cues.title")}
                </p>
                <p className="text-muted-foreground text-xs">
                  {tGm("b2b_pipeline.focus_cues.description")}
                </p>
              </div>
              <FocusToggle
                focusMode={focusMode}
                onChange={setFocusMode}
                tGm={tGm}
                tCommon={tCommon}
              />
            </div>
            <FocusSummary {...summary} tGm={tGm} />
          </div>
        )}
        {hasNoOpportunities ? (
          <div className="border-border/70 bg-muted/40 flex flex-col items-center gap-3 rounded-2xl border border-dashed p-8 text-center">
            <StickyNoteIcon className="text-muted-foreground/80 size-10" />
            <div className="space-y-1">
              <p className="text-foreground text-lg font-semibold">
                {tGm("b2b_pipeline.empty_state.title")}
              </p>
              <p className="text-muted-foreground text-sm">
                {tGm("b2b_pipeline.empty_state.description")}
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <a href="/gm/campaigns/create">
                {tGm("b2b_pipeline.empty_state.action_label")}
              </a>
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
                  tGm={tGm}
                  tCommon={tCommon}
                  currentLanguage={currentLanguage as SupportedLanguage}
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
  tGm: (key: string, options?: Record<string, unknown>) => string;
  tCommon: (key: string, options?: Record<string, unknown>) => string;
  currentLanguage: SupportedLanguage;
}

interface FocusToggleProps {
  focusMode: FocusMode;
  onChange: (mode: FocusMode) => void;
  tGm: (key: string) => string;
  tCommon: (key: string) => string;
}

interface FocusSummaryProps {
  total: number;
  focusThreads: number;
  atRisk: number;
  activeEscalations: number;
  dueSoon: number;
  tGm: (key: string) => string;
}

// This type is imported from opportunity-card.tsx but re-exported here for backward compatibility
export type { OpportunityFocusMeta } from "./opportunity-card";

function FocusToggle({ focusMode, onChange, tGm, tCommon }: FocusToggleProps) {
  const options: Array<{ value: FocusMode; label: string; description: string }> = [
    {
      value: "mine",
      label: tCommon("b2b_pipeline.focus.my_focus"),
      description: tGm("b2b_pipeline.focus_toggle.my_focus_description"),
    },
    {
      value: "all",
      label: tCommon("b2b_pipeline.focus.entire_pipeline"),
      description: tGm("b2b_pipeline.focus_toggle.entire_pipeline_description"),
    },
  ];

  return (
    <div className="border-border/60 bg-background/80 flex flex-col gap-2 rounded-2xl border p-3 text-xs sm:flex-row sm:items-center">
      <div className="text-muted-foreground flex items-center gap-2">
        <FilterIcon className="size-4" />
        <span className="text-[11px] font-semibold tracking-wide uppercase">
          {tGm("b2b_pipeline.focus_toggle.view_label")}
        </span>
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
  tGm,
}: FocusSummaryProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      <SummaryPill
        icon={<SparklesIcon className="size-4" />}
        label={tGm("b2b_pipeline.focus_summary.active_opportunities")}
        value={total}
        assistive={tGm("b2b_pipeline.focus_summary.active_opportunities_assistive")}
      />
      <SummaryPill
        icon={<TargetIcon className="size-4" />}
        label={tGm("b2b_pipeline.focus_summary.my_focus")}
        value={focusThreads}
        assistive={tGm("b2b_pipeline.focus_summary.my_focus_assistive")}
      />
      <SummaryPill
        icon={<AlertTriangleIcon className="size-4" />}
        label={tGm("b2b_pipeline.focus_summary.renewals_at_risk")}
        value={atRisk}
        assistive={tGm("b2b_pipeline.focus_summary.renewals_at_risk_assistive")}
      />
      <SummaryPill
        icon={<FlagIcon className="size-4" />}
        label={tGm("b2b_pipeline.focus_summary.escalations_live")}
        value={activeEscalations}
        assistive={tGm("b2b_pipeline.focus_summary.escalations_live_assistive")}
      />
      <SummaryPill
        icon={<ClockIcon className="size-4" />}
        label={tGm("b2b_pipeline.focus_summary.follow_ups_due")}
        value={dueSoon}
        assistive={tGm("b2b_pipeline.focus_summary.follow_ups_due_assistive")}
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
  tGm,
  tCommon,
  currentLanguage,
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
        <ClockIcon className="size-3.5" />{" "}
        {tGm("b2b_pipeline.stage.respond_within", { hours: serviceLevelHours })}
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
                ? tGm("b2b_pipeline.stage.no_focus_threads")
                : tGm("b2b_pipeline.stage.clear_stage")}
            </p>
          </div>
        ) : (
          opportunities.map((opportunity) => {
            const focusMeta = getOpportunityFocusMeta(opportunity, tGm);
            const healthCopy = createHealthCopy(tCommon);
            return (
              <OpportunityCard
                key={opportunity.id}
                opportunity={opportunity}
                focusMeta={focusMeta}
                healthCopy={healthCopy}
                tGm={tGm}
                tCommon={tCommon}
                currentLanguage={currentLanguage as SupportedLanguage}
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

function buildPipelineSummary(
  opportunities: GmPipelineOpportunity[],
  tGm: (key: string) => string,
): FocusSummaryProps {
  const summary = opportunities.reduce<FocusSummaryProps>(
    (accumulator, opportunity) => {
      accumulator.total += 1;
      const focusMeta = getOpportunityFocusMeta(opportunity, tGm);
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
    {
      total: 0,
      focusThreads: 0,
      atRisk: 0,
      activeEscalations: 0,
      dueSoon: 0,
      tGm,
    },
  );
  return summary;
}

function isOpportunityInFocus(
  opportunity: GmPipelineOpportunity,
  tGm: (key: string) => string,
) {
  return getOpportunityFocusMeta(opportunity, tGm).isFocusCandidate;
}

function sortOpportunities(
  opportunities: GmPipelineOpportunity[],
  tGm: (key: string) => string,
) {
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
    const firstMeta = getOpportunityFocusMeta(first, tGm);
    const secondMeta = getOpportunityFocusMeta(second, tGm);

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
