import { Link } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import {
  CalendarCheck2Icon,
  MapPinIcon,
  ShieldCheckIcon,
  Users2Icon,
} from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import type { CampaignWithDetails } from "~/features/campaigns/campaigns.types";
import { GameShowcaseCard } from "~/features/games/components/GameListItemView";
import type { GameListItem } from "~/features/games/games.types";
import { SafetyRulesView } from "~/shared/components/SafetyRulesView";
import { formatDateAndTime } from "~/shared/lib/datetime";
import { cn } from "~/shared/lib/utils";

interface GameMasterCampaignWorkspaceProps {
  campaign: CampaignWithDetails;
  upcomingSessions: GameListItem[];
  completedSessions: GameListItem[];
}

export function GameMasterCampaignWorkspace({
  campaign,
  upcomingSessions,
  completedSessions,
}: GameMasterCampaignWorkspaceProps) {
  const nextSession = upcomingSessions[0] ?? null;
  const lastCompleted = completedSessions[0] ?? null;
  const activePlayers = campaign.participants.filter(
    (participant) => participant.status === "approved",
  );
  const pendingInvites = campaign.participants.filter(
    (participant) => participant.status === "pending",
  );

  return (
    <div className="space-y-10">
      <section className="border-border/80 text-foreground relative overflow-hidden rounded-3xl border bg-[radial-gradient(circle_at_top,_rgba(52,35,85,0.85),_rgba(10,9,17,0.95))] text-white shadow-sm">
        <div className="relative z-10 space-y-6 p-6 sm:p-10">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="space-y-3">
              <Badge className="bg-white/15 text-white">Campaign studio</Badge>
              <h1 className="text-3xl font-semibold sm:text-4xl">{campaign.name}</h1>
              <p className="max-w-3xl text-base text-white/80 sm:text-lg">
                Orchestrate Alex’s narrative arc, prep rituals, and player energy from a
                single workspace tailored for the Story Guide.
              </p>
              <div className="flex flex-wrap gap-3 text-sm text-white/80">
                <MetaPill icon={<MapPinIcon className="size-3.5" />}>
                  {campaign.location?.address ?? "Remote / TBD"}
                </MetaPill>
                <MetaPill icon={<CalendarCheck2Icon className="size-3.5" />}>
                  {campaign.recurrence ?? "Custom cadence"}
                </MetaPill>
                <MetaPill icon={<Users2Icon className="size-3.5" />}>
                  {activePlayers.length} active players
                </MetaPill>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:items-end">
              <Badge variant="outline" className="border-white/40 bg-white/10 text-white">
                {campaign.status}
              </Badge>
              <div className="flex flex-wrap gap-2 sm:justify-end">
                <Button
                  asChild
                  variant="secondary"
                  className="bg-white/15 text-white hover:bg-white/25"
                  size="sm"
                >
                  <Link
                    to="/dashboard/campaigns/$campaignId"
                    params={{ campaignId: campaign.id }}
                  >
                    Open legacy view
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="secondary"
                  size="sm"
                  className="text-primary bg-white"
                >
                  <Link to="/dashboard/games/create" search={{ campaignId: campaign.id }}>
                    Schedule session
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile
              label="Next session"
              value={
                nextSession ? formatDateAndTime(nextSession.dateTime) : "Not scheduled"
              }
              assistive={nextSession ? nextSession.name : "Add a gathering"}
            />
            <StatTile
              label="Last debrief"
              value={
                lastCompleted
                  ? formatDistanceToNow(
                      new Date(lastCompleted.updatedAt ?? lastCompleted.dateTime),
                      {
                        addSuffix: true,
                      },
                    )
                  : "Awaiting first session"
              }
              assistive={lastCompleted ? lastCompleted.name : "Run a session"}
            />
            <StatTile
              label="Active roster"
              value={`${activePlayers.length}`}
              assistive={`+${pendingInvites.length} invite${pendingInvites.length === 1 ? "" : "s"}`}
            />
            <StatTile
              label="System"
              value={campaign.gameSystem?.name ?? "Custom"}
              assistive="Story engine in focus"
            />
          </div>
        </div>
        <div className="absolute inset-0 rounded-3xl border border-white/15" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[2fr,1fr]">
        <Card className="border-muted-foreground/10 bg-muted/20 backdrop-blur">
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl">Narrative brief</CardTitle>
              <p className="text-muted-foreground text-sm">
                Keep the campaign spine, table rituals, and prep cues close at hand.
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link
                to="/dashboard/campaigns/$campaignId"
                params={{ campaignId: campaign.id }}
              >
                Edit details
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-6 text-sm leading-relaxed">
            <section className="space-y-2">
              <h3 className="text-foreground text-base font-semibold">Campaign pitch</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {campaign.description}
              </p>
            </section>

            <div className="grid gap-4 md:grid-cols-2">
              <StoryNote
                title="Tone & difficulty"
                body={
                  campaign.campaignExpectations?.difficulty ?? "Set the challenge scope."
                }
              />
              <StoryNote
                title="Session cadence"
                body={
                  campaign.campaignExpectations?.campaignLength ??
                  "Document arc length or seasons."
                }
              />
              <StoryNote
                title="Character creation"
                body={
                  campaign.characterCreationOutcome ??
                  campaign.sessionZeroData?.characterCreation?.contextIntegration ??
                  "Capture how characters tie into the world."
                }
              />
              <StoryNote
                title="House rules"
                body={
                  campaign.campaignExpectations?.houseRules ??
                  "List safety, dice, or homebrew guidance."
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Safety & consent</CardTitle>
            <p className="text-muted-foreground text-sm">
              Align on tools, boundaries, and reminders before and after each session.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <SafetyRulesView safetyRules={campaign.safetyRules} />
            <div className="bg-muted flex flex-col gap-3 rounded-2xl p-4 text-sm">
              <div className="flex items-center gap-2">
                <ShieldCheckIcon className="text-primary size-4" />
                <span className="font-medium">Session zero checkpoints</span>
              </div>
              <ul className="text-muted-foreground list-disc space-y-1 pl-5">
                <li>
                  {campaign.sessionZeroData?.safetyTools?.playerBoundariesConsent
                    ? "Player boundaries captured"
                    : "Document player boundaries and X-card agreements"}
                </li>
                <li>
                  {campaign.sessionZeroData?.tableExpectations?.playerAbsences
                    ? "Attendance policy shared"
                    : "Clarify how to handle absences and tardiness"}
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[3fr,2fr]">
        <Card className="lg:col-span-1">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Session pipeline</CardTitle>
            <p className="text-muted-foreground text-sm">
              Track what’s next and celebrate the story beats you’ve already delivered.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-foreground text-base font-semibold">Upcoming</h3>
              {upcomingSessions.length === 0 ? (
                <EmptyState
                  title="No sessions scheduled"
                  description="Queue the next chapter to keep your players immersed."
                  actionHref="/dashboard/games/create"
                  actionLabel="Plan session"
                />
              ) : (
                <div className="grid gap-4 xl:grid-cols-2">
                  {upcomingSessions.slice(0, 4).map((session) => (
                    <GameShowcaseCard
                      key={session.id}
                      game={session}
                      layout="list"
                      className="h-full"
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-foreground text-base font-semibold">Recent wraps</h3>
              {completedSessions.length === 0 ? (
                <EmptyState
                  title="No completed sessions"
                  description="Once you finish a gathering, we’ll spotlight the debrief tasks here."
                  actionHref="/dashboard/games"
                  actionLabel="View archive"
                />
              ) : (
                <div className="grid gap-4 xl:grid-cols-2">
                  {completedSessions.slice(0, 4).map((session) => (
                    <SessionSummaryChip key={session.id} session={session} />
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Player dossiers</CardTitle>
            <p className="text-muted-foreground text-sm">
              Keep tabs on who’s at the table, their status, and the invitations in
              motion.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {activePlayers.map((participant) => (
                <PlayerChip key={participant.id} participant={participant} />
              ))}
            </div>
            {pendingInvites.length > 0 ? (
              <div className="rounded-2xl bg-amber-500/10 p-4 text-sm">
                <p className="font-medium text-amber-600">
                  {pendingInvites.length} pending invite
                  {pendingInvites.length === 1 ? "" : "s"}
                </p>
                <p className="text-muted-foreground text-sm">
                  Send a personal note or reminder to finalize the roster before the next
                  session.
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

interface MetaPillProps {
  icon: ReactNode;
  children: ReactNode;
}

function MetaPill({ icon, children }: MetaPillProps) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">
      {icon}
      {children}
    </span>
  );
}

interface StatTileProps {
  label: string;
  value: string;
  assistive: string;
}

function StatTile({ label, value, assistive }: StatTileProps) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-white/15 bg-white/5 p-4 text-white">
      <span className="text-xs font-medium tracking-wide text-white/70 uppercase">
        {label}
      </span>
      <span className="text-2xl leading-tight font-semibold">{value}</span>
      <span className="text-xs text-white/60">{assistive}</span>
    </div>
  );
}

interface StoryNoteProps {
  title: string;
  body: string;
}

function StoryNote({ title, body }: StoryNoteProps) {
  return (
    <div className="border-border/60 bg-background/50 rounded-2xl border p-4">
      <p className="text-foreground text-sm font-semibold">{title}</p>
      <p className="text-muted-foreground mt-2 text-sm leading-snug whitespace-pre-wrap">
        {body}
      </p>
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  description: string;
  actionHref: string;
  actionLabel: string;
}

function EmptyState({ title, description, actionHref, actionLabel }: EmptyStateProps) {
  return (
    <div className="border-border/60 flex h-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed p-6 text-center">
      <p className="text-foreground text-sm font-semibold">{title}</p>
      <p className="text-muted-foreground text-xs">{description}</p>
      <Button asChild variant="outline" size="sm">
        <Link to={actionHref}>{actionLabel}</Link>
      </Button>
    </div>
  );
}

interface SessionSummaryChipProps {
  session: GameListItem;
}

function SessionSummaryChip({ session }: SessionSummaryChipProps) {
  const completedAt = session.updatedAt ?? session.dateTime;
  return (
    <div className="border-border/60 bg-muted/40 flex flex-col gap-2 rounded-2xl border p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-foreground font-medium">{session.name}</span>
        <Badge variant="outline" className="text-xs capitalize">
          {session.status}
        </Badge>
      </div>
      <p className="text-muted-foreground text-xs">
        {formatDateAndTime(session.dateTime)} • {session.participantCount} attendees
      </p>
      <p className="text-muted-foreground text-xs">
        Last updated {formatDistanceToNow(new Date(completedAt), { addSuffix: true })}
      </p>
      <Button asChild variant="ghost" size="sm" className="self-start px-0 text-xs">
        <Link to="/dashboard/games/$gameId" params={{ gameId: session.id }}>
          Review recap
        </Link>
      </Button>
    </div>
  );
}

interface PlayerChipProps {
  participant: CampaignWithDetails["participants"][number];
}

function PlayerChip({ participant }: PlayerChipProps) {
  const statusCopy = participant.status === "approved" ? "Ready" : participant.status;
  return (
    <div
      className={cn(
        "border-border/50 bg-background/60 flex items-center gap-2 rounded-full border px-4 py-2 text-sm",
        participant.role === "owner"
          ? "border-primary/50 text-primary"
          : "text-foreground",
      )}
    >
      <span className="font-medium">
        {participant.user?.name ?? participant.user?.email ?? "Unnamed player"}
      </span>
      <Badge variant="secondary" className="rounded-full text-[0.65rem] capitalize">
        {statusCopy}
      </Badge>
    </div>
  );
}
