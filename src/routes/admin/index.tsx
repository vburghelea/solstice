import { createFileRoute } from "@tanstack/react-router";

import {
  PersonaComingSoon,
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
    <div className="space-y-8">
      <PersonaWorkspacePlaceholder
        personaLabel="Platform admin"
        title="A governance console is on the horizon"
        description={[
          "We're preparing administration surfaces that consolidate",
          "compliance, permissions, and cross-persona telemetry.",
        ].join(" ")}
        milestones={ADMIN_MILESTONES}
      />
      <PersonaComingSoon
        personaLabel="Platform admin"
        featureFlag="persona-coming-soon-admin"
        title="Which governance tools do you need first?"
        description={[
          "Tell us which controls, automations, and audit views unlock",
          "confidence for platform stewardship on day one.",
        ].join(" ")}
        feedbackPrompt="What should the administration console make effortless?"
        suggestionPlaceholder="Share the reports, workflows, or safeguards that would streamline governance."
      />
    </div>
  );
}
