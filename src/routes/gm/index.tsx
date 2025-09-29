import { createFileRoute } from "@tanstack/react-router";

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
      "so Alex can focus on storytelling, not tab juggling.",
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
