import { CalendarClockIcon, ClipboardListIcon, HeartPulseIcon } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { LocalizedButtonLink } from "~/components/ui/LocalizedLink";
import type { CampaignListItem } from "~/features/campaigns/campaigns.types";
import type { GameListItem } from "~/features/games/games.types";
import { useGmTranslation } from "~/hooks/useTypedTranslation";
import type { SupportedLanguage } from "~/lib/i18n/config";
import { differenceInHours, formatDistanceToNowLocalized } from "~/lib/i18n/utils";
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
  const { t, currentLanguage } = useGmTranslation();
  const columns = buildColumns(
    completedSessions,
    upcomingSessions,
    activeCampaigns,
    t,
    currentLanguage,
  );

  return (
    <div className="space-y-10">
      <section className="border-border/70 relative overflow-hidden rounded-3xl border bg-[radial-gradient(circle_at_top,_rgba(22,27,45,0.95),_rgba(8,10,18,0.98))] p-6 text-white sm:p-10">
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <Badge className="bg-white/10 text-white">{t("feedback_triage.badge")}</Badge>
            <h1 className="text-3xl font-semibold sm:text-4xl">
              {t("feedback_triage.title")}
            </h1>
            <p className="max-w-2xl text-sm text-white/75 sm:text-base">
              {t("feedback_triage.subtitle")}
            </p>
            <div className="flex flex-wrap gap-3 text-xs tracking-wide text-white/60 uppercase">
              <span className="inline-flex items-center gap-2">
                <ClipboardListIcon className="size-4" />{" "}
                {t("feedback_triage.stats.debriefs_queued")}
              </span>
              <span className="inline-flex items-center gap-2">
                <HeartPulseIcon className="size-4" />{" "}
                {t("feedback_triage.stats.safety_checkpoints")}
              </span>
              <span className="inline-flex items-center gap-2">
                <CalendarClockIcon className="size-4" />{" "}
                {t("feedback_triage.stats.upcoming_nudges")}
              </span>
            </div>
          </div>
          <LocalizedButtonLink
            to="/gm"
            translationKey="game_management.back_to_studio"
            translationNamespace="navigation"
            fallbackText={t("feedback_triage.back_to_studio")}
            variant="secondary"
            className="text-primary bg-white hover:bg-white/90"
          />
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
                column.tasks.map((task) => <TriageCard key={task.id} task={task} t={t} />)
              )}
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}

type TriageTaskAction =
  | { to: "/gm/games/$gameId"; params: { gameId: string } }
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
  t: ReturnType<typeof useGmTranslation>["t"],
  currentLanguage: SupportedLanguage,
): TriageColumn[] {
  const now = new Date();

  const followUps: TriageTask[] = completedSessions.slice(0, 8).map((session) => {
    const completedAt = new Date(session.updatedAt ?? session.dateTime);
    const hoursSince = Math.max(0, differenceInHours(now, completedAt));
    const severity = hoursSince > 72 ? "critical" : hoursSince > 24 ? "caution" : "info";

    return {
      id: `completed-${session.id}`,
      title: session.name,
      detail: t("feedback_triage.tasks.collect_surveys", {
        count: session.participantCount,
      }),
      dueLabel: t("feedback_triage.tasks.completed_prefix", {
        time: formatDistanceToNowLocalized(completedAt, currentLanguage, {
          addSuffix: true,
        }),
      }),
      severity,
      actionLabel: t("feedback_triage.actions.open_recap"),
      action: {
        to: "/gm/games/$gameId",
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
        ? t("feedback_triage.tasks.capture_boundaries")
        : t("feedback_triage.tasks.boundaries_documented"),
      missingTool
        ? t("feedback_triage.tasks.confirm_safety_tool")
        : t("feedback_triage.tasks.safety_tooling_confirmed"),
    ];

    return {
      id: `campaign-${campaign.id}`,
      title: `${campaign.name} ${t("feedback_triage.tasks.safety_sweep_suffix")}`,
      detail: detailParts.join(" "),
      dueLabel: t("feedback_triage.tasks.updated_prefix", {
        time: formatDistanceToNowLocalized(updatedAt, currentLanguage, {
          addSuffix: true,
        }),
      }),
      severity,
      actionLabel: t("feedback_triage.actions.open_campaign"),
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
    const distanceLabel = formatDistanceToNowLocalized(sessionStart, currentLanguage, {
      addSuffix: true,
    });
    const dueLabel =
      hoursUntil <= 0
        ? t("feedback_triage.tasks.started_prefix", { time: distanceLabel })
        : t("feedback_triage.tasks.starts_prefix", { time: distanceLabel });

    return {
      id: `upcoming-${session.id}`,
      title: `${session.name} ${t("feedback_triage.tasks.prep_checklist_suffix")}`,
      detail: t("feedback_triage.tasks.prep_checklist_detail", {
        time: formatDateAndTime(session.dateTime),
      }),
      dueLabel,
      severity,
      actionLabel: t("feedback_triage.actions.session_details"),
      action: {
        to: "/gm/games/$gameId",
        params: { gameId: session.id },
      },
    } satisfies TriageTask;
  });

  return [
    {
      key: "follow-ups",
      title: t("feedback_triage.columns.debriefs.title"),
      description: t("feedback_triage.columns.debriefs.description"),
      tasks: followUps,
      empty: {
        title: t("feedback_triage.columns.debriefs.empty.title"),
        description: t("feedback_triage.columns.debriefs.empty.description"),
      },
    },
    {
      key: "safety",
      title: t("feedback_triage.columns.safety_checkin.title"),
      description: t("feedback_triage.columns.safety_checkin.description"),
      tasks: safetyTasks,
      empty: {
        title: t("feedback_triage.columns.safety_checkin.empty.title"),
        description: t("feedback_triage.columns.safety_checkin.empty.description"),
      },
    },
    {
      key: "upcoming",
      title: t("feedback_triage.columns.upcoming_nudges.title"),
      description: t("feedback_triage.columns.upcoming_nudges.description"),
      tasks: upcomingPrep,
      empty: {
        title: t("feedback_triage.columns.upcoming_nudges.empty.title"),
        description: t("feedback_triage.columns.upcoming_nudges.empty.description"),
      },
    },
  ];
}

function TriageCard({
  task,
  t,
}: {
  task: TriageTask;
  t: ReturnType<typeof useGmTranslation>["t"];
}) {
  return (
    <article
      className={cn(
        "border-border/60 bg-muted/40 flex flex-col gap-3 rounded-3xl border p-5",
        severityTone(task.severity, t).background,
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
            severityTone(task.severity, t).badge,
          )}
        >
          {severityTone(task.severity, t).label}
        </Badge>
      </div>
      <div className="text-muted-foreground flex flex-wrap items-center justify-between gap-3 text-xs">
        <span>{task.dueLabel}</span>
        <LocalizedButtonLink
          {...task.action}
          translationKey="game_management.view_session_details"
          translationNamespace="navigation"
          fallbackText={task.actionLabel}
          variant="ghost"
          size="sm"
          className="px-0 text-xs font-medium"
          ariaLabelTranslationKey="game_management.view_session_details_aria"
        />
      </div>
    </article>
  );
}

function severityTone(
  severity: TriageTask["severity"],
  t: ReturnType<typeof useGmTranslation>["t"],
) {
  switch (severity) {
    case "critical":
      return {
        label: t("feedback_triage.severity.overdue"),
        badge: "bg-red-600 text-white",
        background: "bg-red-500/5",
      } as const;
    case "caution":
      return {
        label: t("feedback_triage.severity.attention"),
        badge: "bg-amber-500 text-black",
        background: "bg-amber-500/10",
      } as const;
    default:
      return {
        label: t("feedback_triage.severity.on_track"),
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
