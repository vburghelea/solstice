import { createFileRoute } from "@tanstack/react-router";

import {
  PersonaWorkspacePlaceholder,
  type PersonaWorkspaceMilestone,
} from "~/features/layouts/persona-namespace-layout";

const ADMIN_MILESTONES: PersonaWorkspaceMilestone[] = [
  {
    title: "System health insights",
    description: [
      "Uptime, incident history, and alert configuration come together",
      "to give Jordan instant operational clarity.",
    ].join(" "),
  },
  {
    title: "Role management and audit trails",
    description: [
      "Bulk role operations, MFA enforcement, and detailed logs",
      "support confident governance at scale.",
    ].join(" "),
  },
  {
    title: "Feature rollout orchestration",
    description: [
      "Feature flags, impact notes, and reporting tie experiments",
      "back to persona outcomes across the platform.",
    ].join(" "),
  },
];

export const Route = createFileRoute("/admin/")({
  component: AdminLanding,
});

function AdminLanding() {
  return (
    <PersonaWorkspacePlaceholder
      personaLabel="Platform admin"
      title="A governance console is on the horizon"
      description={[
        "We're preparing administration surfaces that consolidate",
        "compliance, permissions, and cross-persona telemetry.",
      ].join(" ")}
      milestones={ADMIN_MILESTONES}
    />
  );
}
