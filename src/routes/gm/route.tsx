import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

import {
  PersonaNamespaceFallback,
  PersonaNamespaceLayout,
  PersonaNamespacePillars,
  type PersonaPillarItem,
} from "~/features/layouts/persona-namespace-layout";
import { resolvePersonaResolution } from "~/features/roles/persona.server";
import type { PersonaResolution } from "~/features/roles/persona.types";
import { RoleSwitcherProvider } from "~/features/roles/role-switcher-context";

const GM_PILLARS: PersonaPillarItem[] = [
  {
    title: "Campaign studio",
    description: [
      "Narrative assets, player dossiers, and scheduling tools",
      "unify prep flows in one command center.",
    ].join(" "),
  },
  {
    title: "Feedback triage",
    description: [
      "Survey responses, safety notes, and follow-up tasks",
      "organize what needs attention after every session.",
    ].join(" "),
  },
  {
    title: "Bespoke pipeline",
    description: [
      "Stage tracking and handoffs keep premium opportunities",
      "aligned with operations and platform leadership.",
    ].join(" "),
  },
  {
    title: "Offline-friendly notes",
    description: [
      "Conflict-aware syncing protects session prep regardless",
      "of network hiccups or device changes.",
    ].join(" "),
  },
];

export const Route = createFileRoute("/gm")({
  loader: async () => {
    const resolution = await resolvePersonaResolution({ data: {} });
    return { resolution };
  },
  component: GameMasterNamespaceShell,
});

function GameMasterNamespaceShell() {
  const { resolution } = Route.useLoaderData() as { resolution: PersonaResolution };
  const loadResolution = useServerFn(resolvePersonaResolution);

  return (
    <RoleSwitcherProvider
      initialResolution={resolution}
      onSwitch={async (personaId) =>
        loadResolution({ data: { preferredPersonaId: personaId, forceRefresh: true } })
      }
    >
      <PersonaNamespaceLayout
        hero={{
          eyebrow: "Game Master workspace",
          title: "Build Alex a cohesive campaign studio",
          description: [
            "We're crafting a unified hub for prep, feedback, and bespoke",
            "opportunities that scales with Alex's storytelling.",
          ].join(" "),
          supportingText: [
            "Compare personas anytime to verify how responsibilities",
            "and guardrails shift for each role.",
          ].join(" "),
        }}
        annotation={<PersonaNamespacePillars items={GM_PILLARS} />}
        fallback={<PersonaNamespaceFallback label="Game Master" />}
      />
    </RoleSwitcherProvider>
  );
}
