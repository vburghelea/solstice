import { Link, createFileRoute } from "@tanstack/react-router";
import { SparklesIcon } from "lucide-react";

import { Button } from "~/components/ui/button";
import {
  PersonaComingSoon,
  PersonaWorkspacePlaceholder,
  type PersonaWorkspaceMilestone,
} from "~/features/layouts/persona-namespace-layout";

const GM_MILESTONES: PersonaWorkspaceMilestone[] = [
  {
    title: "Unified campaign dashboards",
    description: [
      "Session prep, asset management, and scheduling co-exist",
      "so Story Guides can focus on storytelling, not tab juggling.",
    ].join(" "),
  },
  {
    title: "Feedback and safety triage",
    description: [
      "Post-session surveys, safety tool logs, and follow-up tasks",
      "stay centralized for confident action.",
    ].join(" "),
  },
  {
    title: "Bespoke pipeline visibility",
    description: [
      "Opportunity stages and assignments align Game Masters",
      "with operations and platform administrators.",
    ].join(" "),
  },
];

export const Route = createFileRoute("/gm/")({
  component: GameMasterLanding,
});

function GameMasterLanding() {
  return (
    <div className="space-y-8">
      <div className="border-border/70 bg-muted/30 flex flex-col gap-4 rounded-3xl border p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="bg-primary/10 text-primary inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
            <SparklesIcon className="size-5" />
          </span>
          <div className="space-y-1">
            <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
              Phase 4 studio rollout
            </p>
            <h2 className="text-foreground text-xl font-semibold sm:text-2xl">
              Explore the Game Master dashboard and triage board
            </h2>
            <p className="text-muted-foreground text-sm">
              The campaign workspace and feedback triage board now layer on top of the
              dashboard so Story Guides can prep, run, and debrief without switching
              personas.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 self-start sm:self-center">
          <Button asChild size="sm">
            <Link to="/gm/dashboard">Open dashboard</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/gm/feedback">Open feedback triage</Link>
          </Button>
        </div>
      </div>
      <PersonaWorkspacePlaceholder
        personaLabel="Game Master"
        title="A narrative studio is taking shape"
        description={[
          "We're building tooling that keeps campaign prep, feedback,",
          "and bespoke opportunities stitched together.",
        ].join(" ")}
        milestones={GM_MILESTONES}
      />
      <PersonaComingSoon
        personaLabel="Game Master"
        featureFlag="persona-coming-soon-gm"
        title="Help us choreograph the GM studio"
        description={[
          "Share the planning views, asset systems, and safety loops",
          "that keep your campaigns thriving.",
        ].join(" ")}
        feedbackPrompt="What should the GM workspace spotlight first?"
        suggestionPlaceholder="List the prep rituals, live session cues, or follow-up tasks you need in one place."
      />
    </div>
  );
}
