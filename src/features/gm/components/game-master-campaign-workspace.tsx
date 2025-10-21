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
import { LocalizedButtonLink } from "~/components/ui/LocalizedLink";
import type { CampaignWithDetails } from "~/features/campaigns/campaigns.types";
import { GameShowcaseCard } from "~/features/games/components/GameListItemView";
import type { GameListItem } from "~/features/games/games.types";
import { useGmTranslation } from "~/hooks/useTypedTranslation";
import { formatDistanceToNowLocalized } from "~/lib/i18n/utils";
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
  const { t, currentLanguage } = useGmTranslation();
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
              <Badge className="bg-white/15 text-white">
                {t("campaign_workspace.badge.campaign_studio")}
              </Badge>
              <h1 className="text-3xl font-semibold sm:text-4xl">{campaign.name}</h1>
              <p className="max-w-3xl text-base text-white/80 sm:text-lg">
                {t("campaign_workspace.description")}
              </p>
              <div className="flex flex-wrap gap-3 text-sm text-white/80">
                <MetaPill icon={<MapPinIcon className="size-3.5" />}>
                  {campaign.location?.address ??
                    t("campaign_workspace.location.remote_tbd")}
                </MetaPill>
                <MetaPill icon={<CalendarCheck2Icon className="size-3.5" />}>
                  {campaign.recurrence ??
                    t("campaign_workspace.recurrence.custom_cadence")}
                </MetaPill>
                <MetaPill icon={<Users2Icon className="size-3.5" />}>
                  {t("campaign_workspace.active_players", {
                    count: activePlayers.length,
                  })}
                </MetaPill>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:items-end">
              <Badge variant="outline" className="border-white/40 bg-white/10 text-white">
                {campaign.status}
              </Badge>
              <div className="flex flex-wrap gap-2 sm:justify-end">
                <LocalizedButtonLink
                  to="/gm/campaigns/$campaignId"
                  params={{ campaignId: campaign.id }}
                  translationKey="game_management.open_legacy_view"
                  translationNamespace="navigation"
                  fallbackText={t("actions.open_legacy_view")}
                  variant="secondary"
                  className="bg-white/15 text-white hover:bg-white/25"
                  size="sm"
                >
                  {t("actions.open_legacy_view")}
                </LocalizedButtonLink>
                <LocalizedButtonLink
                  to="/gm/games/create"
                  search={{ campaignId: campaign.id }}
                  translationKey="game_management.schedule_session"
                  translationNamespace="navigation"
                  fallbackText={t("actions.schedule_session")}
                  variant="secondary"
                  size="sm"
                  className="text-primary bg-white"
                >
                  {t("actions.schedule_session")}
                </LocalizedButtonLink>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile
              label={t("campaign_workspace.sessions.next_session")}
              value={
                nextSession
                  ? formatDateAndTime(nextSession.dateTime)
                  : t("campaign_workspace.sessions.not_scheduled")
              }
              assistive={
                nextSession
                  ? nextSession.name
                  : t("campaign_workspace.sessions.add_gathering")
              }
            />
            <StatTile
              label={t("campaign_workspace.sessions.last_debrief")}
              value={
                lastCompleted
                  ? formatDistanceToNowLocalized(
                      new Date(lastCompleted.updatedAt ?? lastCompleted.dateTime),
                      currentLanguage,
                      {
                        addSuffix: true,
                      },
                    )
                  : t("campaign_workspace.sessions.awaiting_first_session")
              }
              assistive={
                lastCompleted
                  ? lastCompleted.name
                  : t("campaign_workspace.sessions.run_session")
              }
            />
            <StatTile
              label={t("campaign_workspace.details.active_roster")}
              value={`${activePlayers.length}`}
              assistive={`+${pendingInvites.length} invite${pendingInvites.length === 1 ? "" : "s"}`}
            />
            <StatTile
              label={t("campaign_workspace.details.system")}
              value={campaign.gameSystem?.name ?? t("campaign_workspace.details.custom")}
              assistive={t("campaign_workspace.details.story_engine_focus")}
            />
          </div>
        </div>
        <div className="absolute inset-0 rounded-3xl border border-white/15" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[2fr,1fr]">
        <Card className="border-muted-foreground/10 bg-muted/20 backdrop-blur">
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl">
                {t("campaign_workspace.narrative_brief.title")}
              </CardTitle>
              <p className="text-muted-foreground text-sm">
                {t("campaign_workspace.sections.narrative_brief.subtitle")}
              </p>
            </div>
            <LocalizedButtonLink
              to="/gm/campaigns/$campaignId"
              params={{ campaignId: campaign.id }}
              translationKey="campaigns.edit_campaign"
              translationNamespace="navigation"
              fallbackText={t("actions.edit_details")}
              variant="outline"
              size="sm"
            >
              {t("actions.edit_details")}
            </LocalizedButtonLink>
          </CardHeader>
          <CardContent className="space-y-6 text-sm leading-relaxed">
            <section className="space-y-2">
              <h3 className="text-foreground text-base font-semibold">
                {t("campaign_workspace.narrative_brief.campaign_pitch")}
              </h3>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {campaign.description}
              </p>
            </section>

            <div className="grid gap-4 md:grid-cols-2">
              <StoryNote
                title={t("campaign_workspace.expectations.tone_difficulty")}
                body={
                  campaign.campaignExpectations?.difficulty ??
                  t("campaign_workspace.expectations.challenge_scope_placeholder")
                }
              />
              <StoryNote
                title={t("campaign_workspace.expectations.session_cadence")}
                body={
                  campaign.campaignExpectations?.campaignLength ??
                  t("campaign_workspace.expectations.arc_length_placeholder")
                }
              />
              <StoryNote
                title={t("campaign_workspace.expectations.character_creation")}
                body={
                  campaign.characterCreationOutcome ??
                  campaign.sessionZeroData?.characterCreation?.contextIntegration ??
                  t("campaign_workspace.expectations.character_creation_placeholder")
                }
              />
              <StoryNote
                title={t("campaign_workspace.expectations.house_rules")}
                body={
                  campaign.campaignExpectations?.houseRules ??
                  t("campaign_workspace.expectations.house_rules_placeholder")
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">
              {t("campaign_workspace.sections.safety_consent.title")}
            </CardTitle>
            <p className="text-muted-foreground text-sm">
              {t("campaign_workspace.sections.safety_consent.subtitle")}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <SafetyRulesView safetyRules={campaign.safetyRules} />
            <div className="bg-muted flex flex-col gap-3 rounded-2xl p-4 text-sm">
              <div className="flex items-center gap-2">
                <ShieldCheckIcon className="text-primary size-4" />
                <span className="font-medium">
                  {t("campaign_workspace.narrative_brief.session_zero_checkpoints")}
                </span>
              </div>
              <ul className="text-muted-foreground list-disc space-y-1 pl-5">
                <li>
                  {campaign.sessionZeroData?.safetyTools?.playerBoundariesConsent
                    ? t("campaign_workspace.safety.player_boundaries_captured")
                    : t("campaign_workspace.safety.document_boundaries")}
                </li>
                <li>
                  {campaign.sessionZeroData?.tableExpectations?.playerAbsences
                    ? t("campaign_workspace.safety.attendance_policy_shared")
                    : t("campaign_workspace.safety.clarify_absences")}
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[3fr,2fr]">
        <Card className="lg:col-span-1">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">
              {t("campaign_workspace.session_pipeline.title")}
            </CardTitle>
            <p className="text-muted-foreground text-sm">
              {t("campaign_workspace.sections.session_pipeline.subtitle")}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-foreground text-base font-semibold">
                {t("campaign_workspace.session_pipeline.upcoming")}
              </h3>
              {upcomingSessions.length === 0 ? (
                <EmptyState
                  title={t("campaign_workspace.empty_states.no_sessions_scheduled.title")}
                  description={t(
                    "campaign_workspace.empty_states.no_sessions_scheduled.description",
                  )}
                  actionHref="/gm/games/create"
                  actionLabel={t(
                    "campaign_workspace.empty_states.no_sessions_scheduled.action_label",
                  )}
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
              <h3 className="text-foreground text-base font-semibold">
                {t("campaign_workspace.session_pipeline.recent_wraps")}
              </h3>
              {completedSessions.length === 0 ? (
                <EmptyState
                  title={t("campaign_workspace.empty_states.no_completed_sessions.title")}
                  description={t(
                    "campaign_workspace.empty_states.no_completed_sessions.description",
                  )}
                  actionHref="/gm/games"
                  actionLabel={t(
                    "campaign_workspace.empty_states.no_completed_sessions.action_label",
                  )}
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
            <CardTitle className="text-2xl">
              {t("campaign_workspace.player_dossiers.title")}
            </CardTitle>
            <p className="text-muted-foreground text-sm">
              {t("campaign_workspace.sections.player_dossiers.subtitle")}
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
                  {t("campaign_workspace.pending_invites.count", {
                    count: pendingInvites.length,
                  })}
                </p>
                <p className="text-muted-foreground text-sm">
                  {t("campaign_workspace.pending_invites.reminder")}
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
      <LocalizedButtonLink
        to={actionHref}
        variant="outline"
        size="sm"
        translationKey="campaigns.view_session_recap"
        translationNamespace="navigation"
        fallbackText={actionLabel}
      >
        {actionLabel}
      </LocalizedButtonLink>
    </div>
  );
}

interface SessionSummaryChipProps {
  session: GameListItem;
}

function SessionSummaryChip({ session }: SessionSummaryChipProps) {
  const { t, currentLanguage } = useGmTranslation();
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
        {formatDateAndTime(session.dateTime)} •{" "}
        {t("campaign_workspace.session_card.attendees", {
          count: session.participantCount,
        })}
      </p>
      <p className="text-muted-foreground text-xs">
        {t("campaign_workspace.session_card.last_updated", {
          time: formatDistanceToNowLocalized(new Date(completedAt), currentLanguage, {
            addSuffix: true,
          }),
        })}
      </p>
      <Button asChild variant="ghost" size="sm" className="self-start px-0 text-xs">
        <LocalizedButtonLink
          to="/gm/games/$gameId"
          params={{ gameId: session.id }}
          translationKey="campaigns.view_session_recap"
          translationNamespace="navigation"
          fallbackText={t("campaign_workspace.session_card.review_recap")}
          variant="ghost"
          size="sm"
          className="self-start px-0 text-xs"
        >
          {t("campaign_workspace.session_card.review_recap")}
        </LocalizedButtonLink>
      </Button>
    </div>
  );
}

interface PlayerChipProps {
  participant: CampaignWithDetails["participants"][number];
}

function PlayerChip({ participant }: PlayerChipProps) {
  const { t } = useGmTranslation();
  const statusCopy =
    participant.status === "approved"
      ? t("campaign_workspace.participants.ready")
      : participant.status;
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
        {participant.user?.name ??
          participant.user?.email ??
          t("campaign_workspace.participants.unnamed_player")}
      </span>
      <Badge variant="secondary" className="rounded-full text-[0.65rem] capitalize">
        {statusCopy}
      </Badge>
    </div>
  );
}
