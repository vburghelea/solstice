import { createFileRoute } from "@tanstack/react-router";

import {
  PersonaComingSoon,
  PersonaWorkspacePlaceholder,
  type PersonaWorkspaceMilestone,
} from "~/features/layouts/persona-namespace-layout";

const PLAYER_MILESTONES: PersonaWorkspaceMilestone[] = [
  {
    title: "Personalized dashboard tiles",
    description: [
      "Upcoming sessions, pending invites, and recommendations surface",
      "together with glanceable status indicators.",
    ].join(" "),
  },
  {
    title: "Privacy and preference quick actions",
    description: [
      "Inline toggles help Leo manage visibility, notifications, and",
      "safety controls without navigating deep settings.",
    ].join(" "),
  },
  {
    title: "Community-driven discovery",
    description: [
      "Social signals and curated highlights offer gentle nudges",
      "toward campaigns and teams worth exploring next.",
    ].join(" "),
  },
];

export const Route = createFileRoute("/player/")({
  component: PlayerLanding,
});

function PlayerLanding() {
  return (
    <div className="space-y-8">
      <PersonaWorkspacePlaceholder
        personaLabel="Player"
        title="A connected hub for play is underway"
        description={[
          "We're shaping a player dashboard that keeps sessions, social ties,",
          "and privacy controls close at hand.",
        ].join(" ")}
        milestones={PLAYER_MILESTONES}
      />
      <PersonaComingSoon
        personaLabel="Player"
        featureFlag="persona-coming-soon-player"
        title="Design the player command center with us"
        description={[
          "Tell us which updates, shortcuts, or community signals",
          "you want to see the moment you log in.",
        ].join(" ")}
        feedbackPrompt="What should the player dashboard unlock on day one?"
        suggestionPlaceholder="Share the stats, reminders, or quick actions that keep your games organized."
      />
    </div>
  );
}
