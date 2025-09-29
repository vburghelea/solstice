import { Link } from "@tanstack/react-router";
import {
  CalendarCheck2Icon,
  ListChecksIcon,
  PenSquareIcon,
  SparklesIcon,
  Users2Icon,
} from "lucide-react";
import { useMemo, type ReactNode } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import type { CampaignListItem } from "~/features/campaigns/campaigns.types";
import { GameShowcaseCard } from "~/features/games/components/GameListItemView";
import type { GameListItem } from "~/features/games/games.types";
import { formatDateAndTime } from "~/shared/lib/datetime";
import { cn } from "~/shared/lib/utils";
import { List } from "~/shared/ui/list";

interface GameMasterDashboardProps {
  scheduledGames: GameListItem[];
  scheduledGamesTotal: number;
  campaigns: CampaignListItem[];
  campaignsTotal: number;
}

interface FeedbackFollowUpItem {
  id: string;
  title: string;
  description: string;
  scheduledFor: string;
  actionLabel: string;
  actionHref: string;
}

export function GameMasterDashboard({
  scheduledGames,
  scheduledGamesTotal,
  campaigns,
  campaignsTotal,
}: GameMasterDashboardProps) {
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
        ? (campaignLookup.get(game.campaignId) ?? "Standalone session")
        : "Standalone session";
      const sessionLabel = formatDateAndTime(game.dateTime);
      const isCampaignSession = campaignName !== "Standalone session";

      return {
        id: game.id,
        title: isCampaignSession ? `${campaignName} debrief` : `${game.name} recap`,
        description: isCampaignSession
          ? `Collect safety check-ins and narrative beats from ${game.participantCount} players.`
          : `Capture highlights and player energy while the story is fresh.`,
        scheduledFor: sessionLabel,
        actionLabel: isCampaignSession ? "Open campaign" : "Session notes",
        actionHref: isCampaignSession
          ? "/dashboard/campaigns/" + game.campaignId
          : "/dashboard/games/" + game.id,
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
                Orchestrate campaigns with cinematic clarity
              </h1>
              <p className="max-w-2xl text-base text-white/80 sm:text-lg">
                Alex’s studio brings campaign prep, session pacing, and follow-up rituals
                into a single flow. Prioritize the stories that need attention next.
              </p>
            </div>
            <Button
              asChild
              variant="secondary"
              className="bg-white/10 text-white hover:bg-white/20"
            >
              <Link to="/dashboard/campaigns/create">Plan new campaign</Link>
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricTile
              icon={<CalendarCheck2Icon className="size-5" />}
              label="Upcoming sessions"
              value={scheduledGamesTotal}
              assistive="Next 30 days"
            />
            <MetricTile
              icon={<SparklesIcon className="size-5" />}
              label="Active campaigns"
              value={campaignsTotal}
              assistive="Ready for spotlight"
            />
            <MetricTile
              icon={<Users2Icon className="size-5" />}
              label="Players engaged"
              value={engagedPlayers}
              assistive="Across scheduled sessions"
            />
            <MetricTile
              icon={<PenSquareIcon className="size-5" />}
              label="Campaign-linked sessions"
              value={campaignAnchoredSessions}
              assistive="Anchored to story arcs"
            />
          </div>
        </div>
        <div className="absolute inset-0 rounded-3xl border border-white/10" />
      </section>

      <section className="grid gap-10 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-2xl">Session runway</CardTitle>
              <p className="text-muted-foreground text-sm">
                Keep your next gatherings sharp with staging cues, visibility, and player
                load.
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/dashboard/games">Open session manager</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {scheduledGames.length === 0 ? (
              <EmptyState
                icon={<CalendarCheck2Icon className="size-10" />}
                title="No sessions on deck"
                description="Schedule a new gathering or convert a campaign beat into a live session to keep momentum."
                actionLabel="Schedule session"
                actionHref="/dashboard/games/create"
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
            <CardTitle className="text-2xl">Campaign pulse</CardTitle>
            <p className="text-muted-foreground text-sm">
              Spot arcs that need outreach, recruitment, or spotlight moments.
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            {campaigns.length === 0 ? (
              <EmptyState
                icon={<SparklesIcon className="size-10" />}
                title="No active campaigns yet"
                description="Draft your next narrative arc or revive a past favorite to give Alex a fresh stage."
                actionLabel="Start a campaign"
                actionHref="/dashboard/campaigns/create"
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
                          {campaign.participantCount} participants • Updated{" "}
                          {formatDateAndTime(campaign.updatedAt)}
                        </p>
                      </div>
                      <Button asChild variant="ghost" size="sm" className="shrink-0">
                        <Link
                          to="/dashboard/campaigns/$campaignId"
                          params={{ campaignId: campaign.id }}
                        >
                          Review
                        </Link>
                      </Button>
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
            <CardTitle className="text-2xl">Feedback follow-up queue</CardTitle>
            <p className="text-muted-foreground text-sm">
              Keep safety tools and post-session reflections flowing for every table.
            </p>
          </div>
          <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs">
            {feedbackFollowUps.length} upcoming touchpoints
          </Badge>
        </CardHeader>
        <CardContent>
          {feedbackFollowUps.length === 0 ? (
            <EmptyState
              icon={<ListChecksIcon className="size-10" />}
              title="No follow-ups queued"
              description="Once you host a session, we’ll surface the debrief, survey, and escalation tasks here."
              actionLabel="Browse session archive"
              actionHref="/dashboard/games"
            />
          ) : (
            <List className="space-y-3">
              {feedbackFollowUps.map((followUp) => (
                <List.Item
                  key={followUp.id}
                  className="border-border/60 bg-muted/20 flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{followUp.title}</p>
                    <p className="text-muted-foreground text-sm">
                      {followUp.description}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Session: {followUp.scheduledFor}
                    </p>
                  </div>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="self-start sm:self-auto"
                  >
                    <Link to={followUp.actionHref}>{followUp.actionLabel}</Link>
                  </Button>
                </List.Item>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
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
      <Button asChild variant="outline" size="sm">
        <Link to={actionHref}>{actionLabel}</Link>
      </Button>
    </div>
  );
}
