import { createFileRoute } from "@tanstack/react-router";

import {
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
    <PersonaWorkspacePlaceholder
      personaLabel="Operations"
      title="An orchestration studio is in flight"
      description={[
        "We're crafting operations tooling that keeps event health, staffing,",
        "and marketing context one tap away.",
      ].join(" ")}
      milestones={OPS_MILESTONES}
    />
  );
}
