import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { useMemo, useState } from "react";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { SafeLink as Link } from "~/components/ui/SafeLink";
import { Separator } from "~/components/ui/separator";
import { cn } from "~/shared/lib/utils";

import { getCrossPersonaCollaborationSnapshot } from "~/features/collaboration/collaboration.queries";
import type {
  FeedbackLoopEntry,
  PersonaAlignmentSummary,
} from "~/features/collaboration/types";
import type { PersonaId } from "~/features/inbox/types";

const PERSONA_META: Record<PersonaId, { label: string; accent: string }> = {
  player: { label: "Player", accent: "bg-sky-500/10 text-sky-700 border-sky-500/40" },
  ops: {
    label: "Operations",
    accent: "bg-amber-500/15 text-amber-700 border-amber-500/40",
  },
  gm: {
    label: "Game master",
    accent: "bg-purple-500/10 text-purple-700 border-purple-500/40",
  },
  admin: {
    label: "Platform admin",
    accent: "bg-emerald-500/10 text-emerald-700 border-emerald-500/40",
  },
};

const STATUS_LABEL: Record<FeedbackLoopEntry["backlogStatus"], string> = {
  triaged: "Triaged",
  "in-progress": "In progress",
  shipped: "Shipped",
};

const SENTIMENT_STYLE: Record<FeedbackLoopEntry["sentiment"], string> = {
  positive: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
  neutral: "bg-muted text-muted-foreground border-muted",
  concerned: "bg-destructive/10 text-destructive border-destructive/20",
};

const ALIGNMENT_TONE: Record<PersonaAlignmentSummary["confidence"], string> = {
  rising: "text-emerald-600",
  steady: "text-muted-foreground",
  watch: "text-amber-600",
};

const EMPTY_FEEDBACK_LOOPS: FeedbackLoopEntry[] = [];
const EMPTY_ALIGNMENT: PersonaAlignmentSummary[] = [];

type CrossPersonaCollaborationWorkspaceProps = {
  activePersona: PersonaId;
  userName?: string | null;
};

export function CrossPersonaCollaborationWorkspace(
  props: CrossPersonaCollaborationWorkspaceProps,
) {
  const { activePersona, userName } = props;
  const [personaFilter, setPersonaFilter] = useState<PersonaId | "all">(
    activePersona ?? "all",
  );
  const [selectedReaction, setSelectedReaction] = useState<string | null>(null);
  const {
    data: snapshot,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["collaboration-snapshot", activePersona],
    queryFn: async () => {
      const result = await getCrossPersonaCollaborationSnapshot({
        data: { activePersona },
      });
      if (!result.success || !result.data) {
        const message = result.success
          ? "Failed to load snapshot"
          : (result.errors[0]?.message ?? "Failed to load snapshot");
        throw new Error(message);
      }
      return result.data;
    },
  });

  const feedbackLoops = snapshot?.feedbackLoops ?? EMPTY_FEEDBACK_LOOPS;
  const personaAlignment = snapshot?.personaAlignment ?? EMPTY_ALIGNMENT;

  const filteredFeedbackLoops = useMemo(() => {
    if (personaFilter === "all") {
      return feedbackLoops;
    }
    return feedbackLoops.filter((entry) => entry.persona === personaFilter);
  }, [feedbackLoops, personaFilter]);

  const filteredPersonaAlignment = useMemo(() => {
    if (personaFilter === "all") {
      return personaAlignment;
    }
    return personaAlignment.filter((alignment) => alignment.persona === personaFilter);
  }, [personaAlignment, personaFilter]);

  if (isLoading) {
    return (
      <div className="container mx-auto space-y-6 px-4 py-6 sm:py-8">
        <Card className="flex flex-col items-center gap-3 px-8 py-10 text-center">
          <CardTitle className="text-lg">Loading collaboration insights</CardTitle>
          <CardDescription className="max-w-md">
            Gathering live metrics across player, ops, GM, and admin workspaces.
          </CardDescription>
        </Card>
      </div>
    );
  }

  if (isError || !snapshot) {
    return (
      <div className="container mx-auto space-y-6 px-4 py-6 sm:py-8">
        <Card className="flex flex-col items-center gap-3 px-8 py-10 text-center">
          <CardTitle className="text-lg">Unable to load collaboration data</CardTitle>
          <CardDescription className="max-w-md">
            Please refresh to retry. If the issue persists, contact the platform team.
          </CardDescription>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-8 px-4 py-6 sm:py-8">
      <header className="space-y-4">
        <Badge variant="outline" className="text-xs tracking-wide uppercase">
          Collaboration hub
        </Badge>
        <div className="space-y-2">
          <h1 className="text-foreground text-2xl font-semibold sm:text-3xl">
            Cross-namespace reporting & feedback
          </h1>
          <p className="text-muted-foreground max-w-3xl text-sm sm:text-base">
            {snapshot.summary}
            {userName ? ` — tuned for ${userName}.` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm">
          <span className="text-muted-foreground">
            Updated{" "}
            {formatDistanceToNow(new Date(snapshot.updatedAt), { addSuffix: true })}
          </span>
          <Separator orientation="vertical" className="h-4" />
          <span className="text-muted-foreground">
            Align across personas without leaving your namespace.
          </span>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        <Button
          variant={personaFilter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setPersonaFilter("all")}
        >
          All personas
        </Button>
        {Object.entries(PERSONA_META).map(([id, meta]) => {
          const personaId = id as PersonaId;
          const isActive = personaFilter === personaId;
          return (
            <Button
              key={personaId}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => setPersonaFilter(personaId)}
            >
              {meta.label}
            </Button>
          );
        })}
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold sm:text-xl">Shared reporting metrics</h2>
            <p className="text-muted-foreground text-sm">
              Trace how experiments in one namespace influence outcomes across the others.
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to={`/${activePersona}/inbox`}>Review shared threads</Link>
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {snapshot.metrics.map((metric) => (
            <Card key={metric.id} className="flex flex-col">
              <CardHeader className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base font-semibold">
                    {metric.label}
                  </CardTitle>
                  {metric.delta ? (
                    <Badge variant="secondary" className="text-xs">
                      {metric.delta}
                    </Badge>
                  ) : null}
                </div>
                <div className="text-foreground text-3xl font-semibold">
                  {metric.value}
                </div>
                <CardDescription>{metric.description}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto space-y-2">
                <p className="text-muted-foreground text-xs tracking-wide uppercase">
                  Persona impact
                </p>
                <div className="space-y-2">
                  {metric.personaBreakdown.map((slice) => (
                    <div
                      key={`${metric.id}-${slice.persona}`}
                      className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-xs font-medium",
                            PERSONA_META[slice.persona].accent,
                          )}
                        >
                          {PERSONA_META[slice.persona].label}
                        </span>
                        <span className="text-foreground text-sm font-medium">
                          {slice.value}
                        </span>
                      </div>
                      {slice.delta ? (
                        <span className="text-muted-foreground text-xs">
                          {slice.delta}
                        </span>
                      ) : null}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold sm:text-xl">Persona alignment focus</h2>
            <p className="text-muted-foreground text-sm">
              Surface what each persona is watching and where collaboration needs
              reinforcement.
            </p>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredPersonaAlignment.map((alignment) => (
            <Card key={alignment.persona}>
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        PERSONA_META[alignment.persona].accent,
                      )}
                    >
                      {PERSONA_META[alignment.persona].label}
                    </span>
                    <span
                      className={cn(
                        "text-sm font-semibold",
                        ALIGNMENT_TONE[alignment.confidence],
                      )}
                    >
                      {alignment.confidence === "watch"
                        ? "Needs attention"
                        : `${alignment.confidence} confidence`}
                    </span>
                  </div>
                  <span className="text-muted-foreground text-sm font-medium">
                    Alignment {alignment.alignmentScore}%
                  </span>
                </div>
                <div>
                  <CardTitle className="text-base">{alignment.focus}</CardTitle>
                  <CardDescription>
                    Signals and open questions help the team plan the next experiment.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-muted-foreground text-xs tracking-wide uppercase">
                    Key signals
                  </p>
                  <ul className="mt-2 space-y-2 text-sm">
                    {alignment.keySignals.map((signal) => (
                      <li key={signal} className="bg-muted rounded-md px-3 py-2">
                        {signal}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs tracking-wide uppercase">
                    Open questions
                  </p>
                  <ul className="mt-2 space-y-2 text-sm">
                    {alignment.openQuestions.map((question) => (
                      <li
                        key={question}
                        className="rounded-md border border-dashed px-3 py-2"
                      >
                        {question}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold sm:text-xl">Collaboration rhythms</h2>
            <p className="text-muted-foreground text-sm">
              Rituals that keep personas aligned, linked back to the shared inbox threads
              powering decisions.
            </p>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {snapshot.collaborationRhythms.map((rhythm) => (
            <Card key={rhythm.id} className="flex flex-col">
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      PERSONA_META[rhythm.ownerPersona].accent,
                    )}
                  >
                    {PERSONA_META[rhythm.ownerPersona].label}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {rhythm.cadence}
                  </Badge>
                </div>
                <CardTitle className="text-base">{rhythm.title}</CardTitle>
                <CardDescription>{rhythm.summary}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Next touchpoint</span>
                  <span className="text-foreground font-medium">
                    {format(new Date(rhythm.nextSessionAt), "MMM d, h:mma")}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Status</span>
                  <Badge
                    variant="secondary"
                    className={cn(
                      rhythm.status === "on-track"
                        ? "bg-emerald-500/15 text-emerald-700"
                        : rhythm.status === "at-risk"
                          ? "bg-amber-500/20 text-amber-700"
                          : "bg-destructive/10 text-destructive",
                    )}
                  >
                    {rhythm.status.replace("-", " ")}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-muted-foreground text-xs tracking-wide uppercase">
                    Linked threads
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {rhythm.linkedThreads.map((threadId) => (
                      <Badge key={threadId} variant="secondary" className="text-xs">
                        {threadId.replace("thread-", "")}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold sm:text-xl">Feedback capture loops</h2>
            <p className="text-muted-foreground text-sm">
              Pulse surveys and quick reactions feed directly into the backlog so platform
              stewards can respond fast.
            </p>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredFeedbackLoops.map((entry) => (
            <Card key={entry.id} className="flex flex-col">
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      PERSONA_META[entry.persona].accent,
                    )}
                  >
                    {PERSONA_META[entry.persona].label}
                  </span>
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-xs font-medium",
                      SENTIMENT_STYLE[entry.sentiment],
                    )}
                  >
                    {entry.sentiment === "concerned"
                      ? "Needs follow-up"
                      : entry.sentiment === "neutral"
                        ? "Neutral read"
                        : "Positive momentum"}
                  </span>
                </div>
                <div>
                  <CardTitle className="text-base">{entry.title}</CardTitle>
                  <CardDescription>{entry.prompt}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="mt-auto space-y-4">
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <span className="text-muted-foreground">
                    Participation {entry.participationRate}
                  </span>
                  <Separator orientation="vertical" className="hidden h-4 sm:block" />
                  <span className="text-muted-foreground">
                    Backlog status: {STATUS_LABEL[entry.backlogStatus]}
                  </span>
                  <Separator orientation="vertical" className="hidden h-4 sm:block" />
                  <span className="text-muted-foreground">
                    Updated{" "}
                    {formatDistanceToNow(new Date(entry.lastUpdatedAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                <div className="space-y-2">
                  <p className="text-muted-foreground text-xs tracking-wide uppercase">
                    Highlights
                  </p>
                  <ul className="space-y-2 text-sm">
                    {entry.insights.map((insight) => (
                      <li key={insight} className="bg-muted rounded-md px-3 py-2">
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-3">
                  <p className="text-muted-foreground text-xs tracking-wide uppercase">
                    Quick reactions
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {entry.quickReactions.map((reaction) => {
                      const isSelected =
                        selectedReaction === `${entry.id}-${reaction.id}`;
                      return (
                        <Button
                          key={reaction.id}
                          type="button"
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() =>
                            setSelectedReaction((current) =>
                              current === `${entry.id}-${reaction.id}`
                                ? null
                                : `${entry.id}-${reaction.id}`,
                            )
                          }
                        >
                          <span className="mr-2" aria-hidden>
                            {reaction.emoji}
                          </span>
                          <span>{reaction.label}</span>
                          <span className="bg-background ml-2 rounded-full px-2 text-xs font-semibold">
                            {reaction.count}
                          </span>
                        </Button>
                      );
                    })}
                  </div>
                  {selectedReaction && selectedReaction.startsWith(`${entry.id}-`) ? (
                    <p className="text-muted-foreground text-xs">
                      Reaction saved to the backlog experiment log — Jordan and Priya will
                      see it in the next governance sync.
                    </p>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
