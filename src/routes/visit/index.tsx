import { createFileRoute } from "@tanstack/react-router";

import {
  PersonaComingSoon,
  PersonaWorkspacePlaceholder,
  type PersonaWorkspaceMilestone,
} from "~/features/layouts/persona-namespace-layout";

const VISITOR_MILESTONES: PersonaWorkspaceMilestone[] = [
  {
    title: "Story-driven landing journey",
    description: [
      "Curated hero panels, community spotlights, and narrative timelines",
      "guide visitors through what makes Roundup special.",
    ].join(" "),
  },
  {
    title: "Lightweight RSVP handoffs",
    description: [
      "Quick interest forms and event previews capture intent",
      "without forcing immediate account creation.",
    ].join(" "),
  },
  {
    title: "Conversion-ready CTAs",
    description: [
      "Contextual prompts nudge visitors toward registration",
      "once they're ready to take the next step.",
    ].join(" "),
  },
];

export const Route = createFileRoute("/visit/")({
  component: VisitorLanding,
});

function VisitorLanding() {
  return (
    <div className="space-y-8">
      <PersonaWorkspacePlaceholder
        personaLabel="Visitor"
        title="Public storytelling coming into focus"
        description={[
          "We're shaping a guided visitor experience that showcases events,",
          "community highlights, and next steps with clarity.",
        ].join(" ")}
        milestones={VISITOR_MILESTONES}
      />
      <PersonaComingSoon
        personaLabel="Visitor"
        featureFlag="persona-coming-soon-visitor"
        title="Tell us what earns your first RSVP"
        description={[
          "Help us prioritize the stories, signals, and invitations",
          "that convert curiosity into participation.",
        ].join(" ")}
        feedbackPrompt="What should the visitor journey showcase first?"
        suggestionPlaceholder="Describe the proof points, testimonials, or CTAs that would inspire you to sign up."
      />
    </div>
  );
}
