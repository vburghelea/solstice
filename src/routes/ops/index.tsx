import { createFileRoute } from "@tanstack/react-router";

import {
  PersonaComingSoon,
  PersonaWorkspacePlaceholder,
  type PersonaWorkspaceMilestone,
} from "~/features/layouts/persona-namespace-layout";

const OPS_MILESTONES: PersonaWorkspaceMilestone[] = [
  {
    title: "Real-time operations overview",
    description: [
      "Registration funnels, staffing counts, and marketing attribution",
      "assemble into a single mission control for Priya.",
    ].join(" "),
  },
  {
    title: "Collaborative task queue",
    description: [
      "Assignments with due dates and audit trails keep marketing,",
      "logistics, and on-site staff moving in sync.",
    ].join(" "),
  },
  {
    title: "Role-scoped visibility",
    description: [
      "Permission filters and graceful denials ensure sensitive data",
      "only appears for authorized coordinators.",
    ].join(" "),
  },
];

export const Route = createFileRoute("/ops/")({
  component: OpsLanding,
});

function OpsLanding() {
  return (
    <div className="space-y-8">
      <PersonaWorkspacePlaceholder
        personaLabel="Operations"
        title="An orchestration studio is in flight"
        description={[
          "We're crafting operations tooling that keeps event health, staffing,",
          "and marketing context one tap away.",
        ].join(" ")}
        milestones={OPS_MILESTONES}
      />
      <PersonaComingSoon
        personaLabel="Operations"
        featureFlag="persona-coming-soon-ops"
        title="Guide the event operations control center"
        description={[
          "Tell us which dashboards, alerts, and collaboration loops",
          "will keep live events humming.",
        ].join(" ")}
        feedbackPrompt="What should the operations workspace make effortless?"
        suggestionPlaceholder="Outline the metrics, automations, or handoffs that would streamline event execution."
      />
    </div>
  );
}
