import { differenceInHours, formatDistanceToNow } from "date-fns";
import { CalendarClockIcon, ClipboardListIcon, HeartPulseIcon } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { SafeLink as Link } from "~/components/ui/SafeLink";
import type { CampaignListItem } from "~/features/campaigns/campaigns.types";
import type { GameListItem } from "~/features/games/games.types";
import { formatDateAndTime } from "~/shared/lib/datetime";
import { cn } from "~/shared/lib/utils";

interface GameMasterFeedbackTriageBoardProps {
  completedSessions: GameListItem[];
  upcomingSessions: GameListItem[];
  activeCampaigns: CampaignListItem[];
}

export function GameMasterFeedbackTriageBoard({
  completedSessions,
  upcomingSessions,
  activeCampaigns,
}: GameMasterFeedbackTriageBoardProps) {
  const columns = buildColumns(completedSessions, upcomingSessions, activeCampaigns);

  return (
    <div className="space-y-10">
      <section className="border-border/70 relative overflow-hidden rounded-3xl border bg-[radial-gradient(circle_at_top,_rgba(22,27,45,0.95),_rgba(8,10,18,0.98))] p-6 text-white sm:p-10">
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <Badge className="bg-white/10 text-white">Feedback triage</Badge>
            <h1 className="text-3xl font-semibold sm:text-4xl">
              Keep every table feeling heard and safe
            </h1>
            <p className="max-w-2xl text-sm text-white/75 sm:text-base">
              Consolidate post-session surveys, safety escalations, and celebration cues
              in one board tuned for the Story Guide’s rituals.
            </p>
            <div className="flex flex-wrap gap-3 text-xs tracking-wide text-white/60 uppercase">
              <span className="inline-flex items-center gap-2">
                <ClipboardListIcon className="size-4" /> Debriefs queued
              </span>
              <span className="inline-flex items-center gap-2">
                <HeartPulseIcon className="size-4" /> Safety checkpoints
              </span>
              <span className="inline-flex items-center gap-2">
                <CalendarClockIcon className="size-4" /> Upcoming nudges
              </span>
            </div>
          </div>
          <Button
            asChild
            variant="secondary"
            className="text-primary bg-white hover:bg-white/90"
          >
            <Link to="/gm/dashboard">Back to studio overview</Link>
          </Button>
        </div>
        <div className="absolute inset-0 rounded-3xl border border-white/15" />
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        {columns.map((column) => (
          <Card key={column.key} className="flex flex-col">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl">{column.title}</CardTitle>
              <p className="text-muted-foreground text-sm">{column.description}</p>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-4">
              {column.tasks.length === 0 ? (
                <EmptyLaneMessage
                  title={column.empty.title}
                  description={column.empty.description}
                />
              ) : (
                column.tasks.map((task) => <TriageCard key={task.id} task={task} />)
              )}
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}

type TriageTaskAction =
  | { to: "/dashboard/games/$gameId"; params: { gameId: string } }
  | { to: "/gm/campaigns/$campaignId"; params: { campaignId: string } };

interface TriageTask {
  id: string;
  title: string;
  detail: string;
  dueLabel: string;
  severity: "info" | "caution" | "critical";
  actionLabel: string;
  action: TriageTaskAction;
}

interface TriageColumn {
  key: string;
  title: string;
  description: string;
  tasks: TriageTask[];
  empty: { title: string; description: string };
}

function buildColumns(
  completedSessions: GameListItem[],
  upcomingSessions: GameListItem[],
  activeCampaigns: CampaignListItem[],
): TriageColumn[] {
  const now = new Date();

  const followUps: TriageTask[] = completedSessions.slice(0, 8).map((session) => {
    const completedAt = new Date(session.updatedAt ?? session.dateTime);
    const hoursSince = Math.max(0, differenceInHours(now, completedAt));
    const severity = hoursSince > 72 ? "critical" : hoursSince > 24 ? "caution" : "info";

    return {
      id: `completed-${session.id}`,
      title: session.name,
      detail: `Collect surveys and safety notes from ${session.participantCount} players to close the loop.`,
      dueLabel: `Completed ${formatDistanceToNow(completedAt, { addSuffix: true })}`,
      severity,
      actionLabel: "Open recap",
      action: {
        to: "/dashboard/games/$gameId",
        params: { gameId: session.id },
      },
    } satisfies TriageTask;
  });

  const safetyTasks: TriageTask[] = activeCampaigns.slice(0, 8).map((campaign) => {
    const updatedAt = new Date(campaign.updatedAt);
    const missingBoundaries =
      !campaign.sessionZeroData?.safetyTools?.playerBoundariesConsent;
    const missingTool = !campaign.sessionZeroData?.safetyTools?.xCardSystem;
    const severity = missingBoundaries ? "critical" : missingTool ? "caution" : "info";

    const detailParts = [
      missingBoundaries
        ? "Capture consent boundaries for the table."
        : "Boundaries documented – review for drift.",
      missingTool
        ? "Confirm the safety tool you’ll facilitate."
        : "Safety tooling confirmed – share reminders pre-session.",
    ];

    return {
      id: `campaign-${campaign.id}`,
      title: `${campaign.name} safety sweep`,
      detail: detailParts.join(" "),
      dueLabel: `Updated ${formatDistanceToNow(updatedAt, { addSuffix: true })}`,
      severity,
      actionLabel: "Open campaign",
      action: {
        to: "/gm/campaigns/$campaignId",
        params: { campaignId: campaign.id },
      },
    } satisfies TriageTask;
  });

  const upcomingPrep: TriageTask[] = upcomingSessions.slice(0, 8).map((session) => {
    const sessionStart = new Date(session.dateTime);
    const hoursUntil = differenceInHours(sessionStart, now);
    const severity = hoursUntil < 6 ? "critical" : hoursUntil < 24 ? "caution" : "info";
    const distanceLabel = formatDistanceToNow(sessionStart, { addSuffix: true });
    const dueLabel =
      hoursUntil <= 0 ? `Started ${distanceLabel}` : `Starts ${distanceLabel}`;

    return {
      id: `upcoming-${session.id}`,
      title: `${session.name} prep checklist`,
      detail: `Double-check spotlights, props, and pre-session surveys before ${formatDateAndTime(session.dateTime)}.`,
      dueLabel,
      severity,
      actionLabel: "Session details",
      action: {
        to: "/dashboard/games/$gameId",
        params: { gameId: session.id },
      },
    } satisfies TriageTask;
  });

  return [
    {
      key: "follow-ups",
      title: "Post-session follow-ups",
      description:
        "Debriefs, surveys, and thank-yous queued after your latest gatherings.",
      tasks: followUps,
      empty: {
        title: "No follow-ups pending",
        description:
          "Run a session and we’ll surface the debrief tasks immediately after.",
      },
    },
    {
      key: "safety",
      title: "Safety & wellbeing",
      description: "Check-ins, boundaries, and escalation notes that deserve attention.",
      tasks: safetyTasks,
      empty: {
        title: "Safety tools all aligned",
        description:
          "Great work! Keep noting boundaries and tools as your tables evolve.",
      },
    },
    {
      key: "upcoming",
      title: "Upcoming touchpoints",
      description:
        "Pre-session nudges and rituals that prime your storytelling for cinematic delivery.",
      tasks: upcomingPrep,
      empty: {
        title: "No upcoming sessions queued",
        description:
          "Schedule your next gathering to unlock prep checklists and reminders.",
      },
    },
  ];
}

function TriageCard({ task }: { task: TriageTask }) {
  return (
    <article
      className={cn(
        "border-border/60 bg-muted/40 flex flex-col gap-3 rounded-3xl border p-5",
        severityTone(task.severity).background,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-foreground text-base font-semibold">{task.title}</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">{task.detail}</p>
        </div>
        <Badge
          className={cn(
            "rounded-full text-[0.65rem] uppercase",
            severityTone(task.severity).badge,
          )}
        >
          {severityTone(task.severity).label}
        </Badge>
      </div>
      <div className="text-muted-foreground flex flex-wrap items-center justify-between gap-3 text-xs">
        <span>{task.dueLabel}</span>
        <Button asChild variant="ghost" size="sm" className="px-0 text-xs font-medium">
          <Link {...task.action}>{task.actionLabel}</Link>
        </Button>
      </div>
    </article>
  );
}

function severityTone(severity: TriageTask["severity"]) {
  switch (severity) {
    case "critical":
      return {
        label: "Overdue",
        badge: "bg-red-600 text-white",
        background: "bg-red-500/5",
      } as const;
    case "caution":
      return {
        label: "Attention",
        badge: "bg-amber-500 text-black",
        background: "bg-amber-500/10",
      } as const;
    default:
      return {
        label: "On track",
        badge: "bg-emerald-500 text-black",
        background: "bg-emerald-500/10",
      } as const;
  }
}

function EmptyLaneMessage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="border-border/60 flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed p-6 text-center text-sm">
      <h3 className="text-foreground font-semibold">{title}</h3>
      <p className="text-muted-foreground text-xs">{description}</p>
    </div>
  );
}
