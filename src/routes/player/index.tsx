import { createFileRoute } from "@tanstack/react-router";

import {
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
    <PersonaWorkspacePlaceholder
      personaLabel="Player"
      title="A connected hub for play is underway"
      description={[
        "We're shaping a player dashboard that keeps sessions, social ties,",
        "and privacy controls close at hand.",
      ].join(" ")}
      milestones={PLAYER_MILESTONES}
    />
  );
}
