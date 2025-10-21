import {
  CalendarCheck2Icon,
  ListChecksIcon,
  PenSquareIcon,
  SparklesIcon,
  Users2Icon,
} from "lucide-react";
import { useMemo, type ReactNode } from "react";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { LocalizedButtonLink } from "~/components/ui/LocalizedLink";
import type { CampaignListItem } from "~/features/campaigns/campaigns.types";
import { GameShowcaseCard } from "~/features/games/components/GameListItemView";
import type { GameListItem } from "~/features/games/games.types";
import { GameMasterB2bPipeline } from "~/features/gm/components/game-master-b2b-pipeline";
import type { GmPipelineOpportunity, GmPipelineStage } from "~/features/gm/gm.types";
import { useGmTranslation } from "~/hooks/useTypedTranslation";
import { formatDateAndTime } from "~/shared/lib/datetime";
import { cn } from "~/shared/lib/utils";
import { List } from "~/shared/ui/list";

interface GameMasterDashboardProps {
  scheduledGames: GameListItem[];
  scheduledGamesTotal: number;
  campaigns: CampaignListItem[];
  campaignsTotal: number;
  pipelineStages: GmPipelineStage[];
  pipelineOpportunities: GmPipelineOpportunity[];
}

type FeedbackFollowUpAction =
  | { to: "/gm/campaigns/$campaignId"; params: { campaignId: string } }
  | { to: "/gm/games/$gameId"; params: { gameId: string } };

interface FeedbackFollowUpItem {
  id: string;
  title: string;
  description: string;
  scheduledFor: string;
  actionLabel: string;
  action: FeedbackFollowUpAction;
}

export function GameMasterDashboard({
  scheduledGames,
  scheduledGamesTotal,
  campaigns,
  campaignsTotal,
  pipelineStages,
  pipelineOpportunities,
}: GameMasterDashboardProps) {
  const { t } = useGmTranslation();

  const engagedPlayers = scheduledGames.reduce(
    (total, game) => total + (game.participantCount ?? 0),
    0,
  );
  const campaignAnchoredSessions = scheduledGames.filter(
    (game) => !!game.campaignId,
  ).length;
  const campaignLookup = useMemo(() => {
    return new Map(campaigns.map((campaign) => [campaign.id, campaign.name]));
  }, [campaigns]);

  const feedbackFollowUps: FeedbackFollowUpItem[] = scheduledGames
    .slice(0, 6)
    .map((game) => {
      const campaignName = game.campaignId
        ? (campaignLookup.get(game.campaignId) ?? t("session_types.standalone"))
        : t("session_types.standalone");
      const sessionLabel = formatDateAndTime(game.dateTime);
      const isCampaignSession = Boolean(game.campaignId);

      return {
        id: game.id,
        title: isCampaignSession
          ? t("labels.debrief", { name: campaignName })
          : t("labels.recap", { name: game.name }),
        description: isCampaignSession
          ? t("labels.collect_safety", { count: game.participantCount })
          : t("labels.capture_highlights"),
        scheduledFor: sessionLabel,
        actionLabel: isCampaignSession
          ? t("actions.open_studio")
          : t("actions.session_notes"),
        action: game.campaignId
          ? {
              to: "/gm/campaigns/$campaignId",
              params: { campaignId: game.campaignId },
            }
          : {
              to: "/gm/games/$gameId",
              params: { gameId: game.id },
            },
      } satisfies FeedbackFollowUpItem;
    });

  return (
    <div className="space-y-12">
      <section className="border-border/70 text-foreground relative overflow-hidden rounded-3xl border bg-[radial-gradient(circle_at_top,_rgba(76,64,107,0.65),_rgba(14,13,26,0.95))] shadow-sm">
        <div className="relative z-10 space-y-6 p-6 sm:p-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-2">
              <Badge className="bg-white/20 text-white">GM Studio Beta</Badge>
              <h1 className="text-3xl font-semibold text-balance text-white sm:text-4xl">
                {t("dashboard.title")}
              </h1>
              <p className="max-w-2xl text-base text-white/80 sm:text-lg">
                {t("dashboard.subtitle")}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <LocalizedButtonLink
                to="/gm/campaigns/create"
                translationKey="game_management.create_campaign"
                translationNamespace="navigation"
                fallbackText={t("actions.start_campaign")}
                variant="secondary"
                className="bg-white/10 text-white hover:bg-white/20"
              >
                {t("actions.start_campaign")}
              </LocalizedButtonLink>
              <LocalizedButtonLink
                to="/gm/feedback"
                translationKey="game_management.open_triage_board"
                translationNamespace="navigation"
                fallbackText={t("actions.open_triage_board")}
                variant="secondary"
                className="bg-white/10 text-white hover:bg-white/25"
              >
                {t("actions.open_triage_board")}
              </LocalizedButtonLink>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricTile
              icon={<CalendarCheck2Icon className="size-5" />}
              label={t("stats.upcoming_sessions")}
              value={scheduledGamesTotal}
              assistive={t("stats.upcoming_sessions_assistive")}
            />
            <MetricTile
              icon={<SparklesIcon className="size-5" />}
              label={t("stats.active_campaigns")}
              value={campaignsTotal}
              assistive={t("stats.active_campaigns_assistive")}
            />
            <MetricTile
              icon={<Users2Icon className="size-5" />}
              label={t("stats.players_engaged")}
              value={engagedPlayers}
              assistive={t("stats.players_engaged_assistive")}
            />
            <MetricTile
              icon={<PenSquareIcon className="size-5" />}
              label={t("stats.campaign_linked_sessions")}
              value={campaignAnchoredSessions}
              assistive={t("stats.campaign_linked_sessions_assistive")}
            />
          </div>
        </div>
        <div className="absolute inset-0 rounded-3xl border border-white/10" />
      </section>

      <section className="grid gap-10 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-2xl">
                {t("sections.session_runway.title")}
              </CardTitle>
              <p className="text-muted-foreground text-sm">
                {t("sections.session_runway.description")}
              </p>
            </div>
            <LocalizedButtonLink
              to="/gm/games"
              translationKey="game_management.open_session_manager"
              translationNamespace="navigation"
              fallbackText={t("actions.open_session_manager")}
              variant="outline"
              size="sm"
            >
              {t("actions.open_session_manager")}
            </LocalizedButtonLink>
          </CardHeader>
          <CardContent className="space-y-6">
            {scheduledGames.length === 0 ? (
              <EmptyState
                icon={<CalendarCheck2Icon className="size-10" />}
                title={t("empty_states.no_sessions.title")}
                description={t("empty_states.no_sessions.description")}
                actionLabel={t("empty_states.no_sessions.action_label")}
                actionHref="/gm/games/create"
              />
            ) : (
              <div className="grid gap-4 xl:grid-cols-2">
                {scheduledGames.map((game) => (
                  <GameShowcaseCard
                    key={game.id}
                    game={game}
                    layout="list"
                    className="h-full"
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-col gap-2">
            <CardTitle className="text-2xl">
              {t("sections.campaign_pulse.title")}
            </CardTitle>
            <p className="text-muted-foreground text-sm">
              {t("sections.campaign_pulse.description")}
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            {campaigns.length === 0 ? (
              <EmptyState
                icon={<SparklesIcon className="size-10" />}
                title={t("empty_states.no_campaigns.title")}
                description={t("empty_states.no_campaigns.description")}
                actionLabel={t("empty_states.no_campaigns.action_label")}
                actionHref="/gm/campaigns/create"
              />
            ) : (
              <List className="space-y-3">
                {campaigns.map((campaign) => (
                  <List.Item
                    key={campaign.id}
                    className="border-border/70 bg-muted/30 rounded-2xl border p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-medium">{campaign.name}</span>
                          <Badge
                            variant="outline"
                            className="rounded-full text-xs capitalize"
                          >
                            {campaign.status}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-sm">
                          {campaign.gameSystem.name} • {campaign.recurrence}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {t("labels.participants", { count: campaign.participantCount })}{" "}
                          •{" "}
                          {t("labels.updated", {
                            date: formatDateAndTime(campaign.updatedAt),
                          })}
                        </p>
                      </div>
                      <LocalizedButtonLink
                        to="/gm/campaigns/$campaignId"
                        params={{ campaignId: campaign.id }}
                        translationKey="campaigns.open_campaign_studio"
                        translationNamespace="navigation"
                        fallbackText={t("actions.open_studio")}
                        variant="ghost"
                        size="sm"
                        className="shrink-0"
                      >
                        {t("actions.open_studio")}
                      </LocalizedButtonLink>
                    </div>
                  </List.Item>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-2xl">
              {t("dashboard.feedback_queue_title")}
            </CardTitle>
            <p className="text-muted-foreground text-sm">
              {t("dashboard.feedback_queue_description")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs">
              {t("badges.upcoming_touchpoints", { count: feedbackFollowUps.length })}
            </Badge>
            <LocalizedButtonLink
              to="/gm/feedback"
              translationKey="game_management.open_triage_board"
              translationNamespace="navigation"
              fallbackText={t("actions.open_triage_board")}
              variant="outline"
              size="sm"
              className="hidden sm:inline-flex"
            >
              {t("actions.open_triage_board")}
            </LocalizedButtonLink>
          </div>
        </CardHeader>
        <CardContent>
          {feedbackFollowUps.length === 0 ? (
            <EmptyState
              icon={<ListChecksIcon className="size-10" />}
              title={t("empty_states.no_followups.title")}
              description={t("empty_states.no_followups.description")}
              actionLabel={t("empty_states.no_followups.action_label")}
              actionHref="/gm/games"
            />
          ) : (
            <List className="space-y-3">
              {feedbackFollowUps.map((followUp) => (
                <List.Item
                  key={followUp.id}
                  className={cn(
                    "border-border/60 bg-muted/20 flex flex-col gap-3 rounded-2xl border p-4",
                    "sm:flex-row sm:items-center sm:justify-between",
                  )}
                >
                  <div className="space-y-1">
                    <p className="font-medium">{followUp.title}</p>
                    <p className="text-muted-foreground text-sm">
                      {followUp.description}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {t("labels.session")} {followUp.scheduledFor}
                    </p>
                  </div>
                  <LocalizedButtonLink
                    {...followUp.action}
                    translationKey="navigation.view_details"
                    translationNamespace="common"
                    fallbackText={followUp.actionLabel}
                    variant="outline"
                    size="sm"
                    className="self-start sm:self-auto"
                  >
                    {followUp.actionLabel}
                  </LocalizedButtonLink>
                </List.Item>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      <GameMasterB2bPipeline
        stages={pipelineStages}
        opportunities={pipelineOpportunities}
      />
    </div>
  );
}

interface MetricTileProps {
  icon: ReactNode;
  label: string;
  value: number;
  assistive: string;
}

function MetricTile({ icon, label, value, assistive }: MetricTileProps) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-white/20 bg-white/5 p-4 text-white backdrop-blur">
      <div className="flex items-center gap-2 text-sm text-white/70">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-3xl font-semibold">{value}</div>
      <span className="text-xs tracking-wide text-white/60 uppercase">{assistive}</span>
    </div>
  );
}

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
  className?: string;
}

function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "text-muted-foreground flex flex-col items-center gap-3 rounded-2xl border border-dashed p-8 text-center",
        className,
      )}
    >
      <div className="text-primary/80">{icon}</div>
      <div className="space-y-1">
        <h3 className="text-foreground text-lg font-semibold">{title}</h3>
        <p className="text-sm">{description}</p>
      </div>
      <LocalizedButtonLink
        to={actionHref}
        translationKey="common.take_action"
        translationNamespace="navigation"
        fallbackText={actionLabel}
        variant="outline"
        size="sm"
      >
        {actionLabel}
      </LocalizedButtonLink>
    </div>
  );
}
