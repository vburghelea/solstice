import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNowStrict } from "date-fns";
import {
  AlertTriangleIcon,
  CheckIcon,
  ClockIcon,
  FlagIcon,
  Loader2Icon,
  SparklesIcon,
  UserPlusIcon,
  WifiOffIcon,
} from "lucide-react";
import { useEffect, useReducer, useRef, useState } from "react";

import { Avatar } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { updateGmPipelineNote } from "~/features/gm/gm.queries";
import type {
  GmPipelineHealth,
  GmPipelineNote,
  GmPipelineOpportunity,
} from "~/features/gm/gm.types";
import { useLocalStorage } from "~/shared/hooks/useLocalStorage";
import { useOnlineStatus } from "~/shared/hooks/useOnlineStatus";
import { cn } from "~/shared/lib/utils";
import type { OperationResult } from "~/shared/types/common";

// Types
export interface OpportunityFocusMeta {
  isAssignedToStoryGuide: boolean;
  hasActiveEscalation: boolean;
  followUpStatus: "overdue" | "dueSoon" | "scheduled";
  followUpCopy: string;
  highlightTone: "critical" | "warning" | "info" | null;
  highlightLabel: string | null;
  highlightClassName: string;
  isFocusCandidate: boolean;
}

export interface OpportunityCardProps {
  opportunity: GmPipelineOpportunity;
  focusMeta: OpportunityFocusMeta;
  healthCopy: Record<GmPipelineHealth, { label: string; className: string }>;
  tGm: (key: string, options?: Record<string, unknown>) => string;
  tCommon: (key: string, options?: Record<string, unknown>) => string;
}

interface AssignmentListProps {
  assignments: GmPipelineOpportunity["assignments"];
  tGm: (key: string, options?: Record<string, unknown>) => string;
}

interface EscalationListProps {
  escalationHooks: GmPipelineOpportunity["escalationHooks"];
  tGm: (key: string, options?: Record<string, unknown>) => string;
}

interface PipelineNoteEditorProps {
  opportunity: GmPipelineOpportunity;
  tGm: (key: string, options?: Record<string, unknown>) => string;
}

type SyncState = "synced" | "pending" | "syncing" | "offline" | "error" | "conflict";

// Helper functions
export function getOpportunityFocusMeta(
  opportunity: GmPipelineOpportunity,
  tGm: (key: string, options?: Record<string, unknown>) => string,
): OpportunityFocusMeta {
  const now = new Date();
  const followUpDue = new Date(opportunity.followUpDueAt);
  const hoursUntilFollowUp = (followUpDue.getTime() - now.getTime()) / (1000 * 60 * 60);
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
    highlightLabel = "renewal_at_risk";
    highlightClassName = "border border-rose-500/30 bg-rose-500/10 text-rose-600";
  } else if (hasActiveEscalation) {
    highlightTone = "warning";
    highlightLabel = "escalation_active";
    highlightClassName = "border border-amber-500/30 bg-amber-500/10 text-amber-600";
  } else if (followUpStatus === "overdue") {
    highlightTone = "warning";
    highlightLabel = "follow_up_overdue";
    highlightClassName = "border border-amber-500/30 bg-amber-500/10 text-amber-600";
  } else if (followUpStatus === "dueSoon") {
    highlightTone = "info";
    highlightLabel = "follow_up_due_48h";
    highlightClassName = "border border-indigo-500/30 bg-indigo-500/10 text-indigo-600";
  } else if (needsAttention) {
    highlightTone = "info";
    highlightLabel = "momentum_check";
    highlightClassName = "border border-indigo-500/30 bg-indigo-500/10 text-indigo-600";
  }

  const isFocusCandidate =
    isAssignedToStoryGuide &&
    (isAtRisk || hasActiveEscalation || followUpStatus !== "scheduled" || needsAttention);

  const followUpCopy = tGm(`b2b_pipeline.opportunity.follow_up_status.${followUpStatus}`);

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

export function getOpportunityHighlightClass(meta: OpportunityFocusMeta) {
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

// Main OpportunityCard Component
export function OpportunityCard({
  opportunity,
  focusMeta,
  healthCopy,
  tGm,
  tCommon,
}: OpportunityCardProps) {
  const stageDuration = formatDistanceToNowStrict(new Date(opportunity.stageEnteredAt), {
    addSuffix: false,
  });
  const lastInteractionDistance = opportunity.lastInteractionAt
    ? formatDistanceToNowStrict(new Date(opportunity.lastInteractionAt), {
        addSuffix: false,
      })
    : null;

  return (
    <div
      className={cn(
        "border-border/60 bg-card rounded-2xl border p-4 text-xs shadow-sm transition-shadow hover:shadow-md",
        getOpportunityHighlightClass(focusMeta),
      )}
    >
      {/* Organization header with health badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-foreground text-sm leading-tight font-semibold">
            {opportunity.organization}
          </h3>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                "rounded-full text-[10px]",
                healthCopy[opportunity.health].className,
              )}
            >
              {healthCopy[opportunity.health].label}
            </Badge>
            {focusMeta.highlightLabel ? (
              <Badge
                variant="outline"
                className={cn("rounded-full text-[10px]", focusMeta.highlightClassName)}
              >
                <SparklesIcon className="mr-1 size-3" />
                {tCommon(`b2b_pipeline.highlight_labels.${focusMeta.highlightLabel}`)}
              </Badge>
            ) : null}
          </div>
        </div>
        <div className="text-muted-foreground text-right text-[11px]">
          <p>
            {tGm("b2b_pipeline.opportunity.entered_stage_ago", {
              duration: stageDuration,
            })}
          </p>
          {lastInteractionDistance && (
            <p>
              {tGm("b2b_pipeline.opportunity.last_touch", {
                duration: lastInteractionDistance,
              })}
            </p>
          )}
        </div>
      </div>

      {/* Location and contact information */}
      <div className="text-muted-foreground mt-3 space-y-1 text-[11px] leading-relaxed">
        <p>{opportunity.location ?? tGm("b2b_pipeline.opportunity.location_tbd")}</p>
        {opportunity.pointOfContact ? (
          <p>
            <span className="font-medium">
              {tGm("b2b_pipeline.opportunity.point_of_contact")}
            </span>{" "}
            {opportunity.pointOfContact}
            {opportunity.contactTitle ? ` — ${opportunity.contactTitle}` : ""}
          </p>
        ) : null}
      </div>

      {/* Follow-up status */}
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-primary font-medium tracking-wide uppercase">
          {tGm("b2b_pipeline.opportunity.next_step")}
        </p>
        <div className="flex items-center gap-2">
          <Badge
            variant={focusMeta.followUpStatus === "overdue" ? "destructive" : "secondary"}
            className="rounded-full text-[10px]"
          >
            {focusMeta.followUpStatus === "overdue"
              ? tGm("b2b_pipeline.opportunity.follow_up_due")
              : focusMeta.followUpStatus === "dueSoon"
                ? tGm("b2b_pipeline.opportunity.follow_up_due_soon")
                : tGm("b2b_pipeline.opportunity.follow_up_scheduled")}
          </Badge>
          <span className="text-muted-foreground text-[11px]">
            {focusMeta.followUpCopy}
          </span>
        </div>
      </div>

      {/* Services section */}
      {opportunity.services && opportunity.services.length > 0 ? (
        <div className="mt-3">
          <p className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
            {tGm("b2b_pipeline.opportunity.services_in_scope")}
          </p>
          <div className="text-muted-foreground mt-1 flex flex-wrap gap-1 text-[11px]">
            {opportunity.services.map((service) => (
              <Badge
                key={`${opportunity.id}-service-${service.replace(/\s+/g, "-")}`}
                variant="outline"
                className="border-border/40 bg-background/80 rounded px-2 py-0.5 text-[10px]"
              >
                {service}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      {/* Linked campaign information */}
      {opportunity.linkedCampaignName ? (
        <div className="text-muted-foreground mt-3 text-[11px]">
          <span className="font-medium">
            {tGm("b2b_pipeline.opportunity.linked_to", {
              name: opportunity.linkedCampaignName,
            })}
          </span>
        </div>
      ) : null}

      {/* Assignment list */}
      {opportunity.assignments && opportunity.assignments.length > 0 ? (
        <div className="mt-3">
          <AssignmentList assignments={opportunity.assignments} tGm={tGm} />
        </div>
      ) : null}

      {/* Escalation hooks */}
      {opportunity.escalationHooks && opportunity.escalationHooks.length > 0 ? (
        <div className="mt-3">
          <EscalationList escalationHooks={opportunity.escalationHooks} tGm={tGm} />
        </div>
      ) : null}

      {/* Studio note */}
      <div className="mt-3">
        <PipelineNoteEditor opportunity={opportunity} tGm={tGm} />
      </div>
    </div>
  );
}

// AssignmentList Component
function AssignmentList({ assignments, tGm }: AssignmentListProps) {
  const primaryStoryGuide = assignments.find(
    (assignment) => assignment.role === "story_guide",
  );
  return (
    <div className="border-border/60 bg-background/80 rounded-2xl border p-3 text-xs">
      <p className="text-muted-foreground font-medium tracking-wide uppercase">
        {tGm("b2b_pipeline.opportunity.assigned_partners")}
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
                  ? tGm("b2b_pipeline.assignment_roles.story_guide_you")
                  : assignment.role.replace("_", " ")}
              </Badge>
            </div>
          </div>
        ))}
      </div>
      <div className="border-border/60 text-muted-foreground mt-3 inline-flex items-center gap-1 rounded-full border border-dashed px-2 py-0.5 text-[11px]">
        <UserPlusIcon className="size-3.5" />{" "}
        {tGm("b2b_pipeline.opportunity.loop_specialists")}
      </div>
    </div>
  );
}

// EscalationList Component
function EscalationList({ escalationHooks, tGm }: EscalationListProps) {
  if (escalationHooks.length === 0) {
    return (
      <div className="border-border/60 bg-background/80 text-muted-foreground rounded-2xl border p-3 text-xs">
        <p className="font-medium tracking-wide uppercase">
          {tGm("b2b_pipeline.opportunity.escalation_hooks")}
        </p>
        <p className="mt-2 text-sm">
          {tGm("b2b_pipeline.opportunity.no_escalation_hooks")}
        </p>
      </div>
    );
  }

  return (
    <div className="border-border/60 bg-background/80 rounded-2xl border p-3 text-xs">
      <p className="text-muted-foreground font-medium tracking-wide uppercase">
        {tGm("b2b_pipeline.opportunity.escalation_hooks")}
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
                    {tGm(`b2b_pipeline.escalation.${hook.status}`)}
                  </Badge>
                ) : null}
              </div>
              {isActive ? (
                <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                  <FlagIcon className="size-3.5" />{" "}
                  {tGm("b2b_pipeline.escalation.escalate_via", {
                    role: hook.escalateToRole.replace("_", " "),
                  })}
                  {hook.requiresResponseBy ? (
                    <span className="border-border/50 inline-flex items-center gap-1 rounded-full border px-2 py-0.5">
                      <ClockIcon className="size-3" />{" "}
                      {tGm("b2b_pipeline.escalation.resolve_by", {
                        date: format(new Date(hook.requiresResponseBy), "MMM d, h:mmaaa"),
                      })}
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

// PipelineNoteEditor Component
function PipelineNoteEditor({ opportunity, tGm }: PipelineNoteEditorProps) {
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
      queryClient.setQueryData<
        OperationResult<{ opportunities: GmPipelineOpportunity[] }>
      >(["gm", "dashboard", "pipeline"], (previous) => {
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
      });
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

  const syncCopy = getSyncCopy(syncState, isOnline, tGm);

  return (
    <div className="border-border/60 bg-muted/30 rounded-2xl border border-dashed p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold">
          {tGm("b2b_pipeline.opportunity.studio_note")}
        </p>
        <div className={cn(syncCopy.className, "inline-flex items-center gap-2 text-xs")}>
          {syncCopy.icon}
          <span>{syncCopy.label}</span>
        </div>
      </div>
      <Textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        className="border-border/50 bg-background/80 mt-3 min-h-[120px] resize-y rounded-xl border text-sm"
        placeholder={tGm("b2b_pipeline.opportunity.studio_note_placeholder")}
      />
      <div className="text-muted-foreground mt-3 flex flex-wrap items-center justify-between gap-3 text-[11px]">
        <span>
          {tGm("b2b_pipeline.note_sync.last_updated_by", {
            name: serverNote.updatedBy.name,
            date: format(new Date(serverNote.updatedAt), "MMM d, yyyy h:mmaaa"),
          })}
        </span>
        {syncState === "conflict" ? (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-[11px]"
              onClick={acceptServerVersion}
            >
              {tGm("b2b_pipeline.note_sync.accept_platform_update")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-[11px]"
              onClick={retrySync}
              disabled={!isOnline}
            >
              {tGm("b2b_pipeline.note_sync.overwrite_with_note")}
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
            {tGm("b2b_pipeline.note_sync.retry_sync")}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function getSyncCopy(state: SyncState, isOnline: boolean, tGm: (key: string) => string) {
  switch (state) {
    case "synced":
      return {
        label: tGm("b2b_pipeline.note_sync.synced"),
        icon: <CheckIcon className="size-3" />,
        className: "text-emerald-600",
      };
    case "pending":
      return {
        label: tGm("b2b_pipeline.note_sync.pending_sync"),
        icon: <ClockIcon className="size-3" />,
        className: "text-amber-600",
      };
    case "syncing":
      return {
        label: tGm("b2b_pipeline.note_sync.syncing"),
        icon: <Loader2Icon className="size-3 animate-spin" />,
        className: "text-primary",
      };
    case "offline":
      return {
        label: isOnline
          ? tGm("b2b_pipeline.note_sync.ready_to_sync")
          : tGm("b2b_pipeline.note_sync.offline"),
        icon: <WifiOffIcon className="size-3" />,
        className: "text-muted-foreground",
      };
    case "error":
      return {
        label: tGm("b2b_pipeline.note_sync.sync_failed"),
        icon: <AlertTriangleIcon className="size-3" />,
        className: "text-rose-600",
      };
    case "conflict":
      return {
        label: tGm("b2b_pipeline.note_sync.conflict_detected"),
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
