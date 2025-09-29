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

const PLAYER_PILLARS: PersonaPillarItem[] = [
  {
    title: "Unified dashboard",
    description: [
      "Sessions, invitations, and campaign teasers surface together",
      "so Leo always knows what's next.",
    ].join(" "),
  },
  {
    title: "Privacy-first quick actions",
    description: [
      "Inline controls for status, notifications, and preferences",
      "reinforce trust across devices.",
    ].join(" "),
  },
  {
    title: "Community insights",
    description: [
      "Trending campaigns, friend activity, and tailored recommendations",
      "keep discovery effortless.",
    ].join(" "),
  },
  {
    title: "Mobile continuity",
    description: [
      "State persistence and responsive layouts ensure the experience",
      "travels smoothly from phone to desktop.",
    ].join(" "),
  },
];

export const Route = createFileRoute("/player")({
  loader: async () => {
    const resolution = await resolvePersonaResolution({ data: {} });
    return { resolution };
  },
  component: PlayerNamespaceShell,
});

function PlayerNamespaceShell() {
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
          eyebrow: "Player workspace",
          title: "Give Leo a connected command center",
          description: [
            "We're consolidating play scheduling, invitations, and social cues",
            "into a single, mobile-first dashboard.",
          ].join(" "),
          supportingText: [
            "Switch personas any time to compare how downstream tooling",
            "will adapt for each audience.",
          ].join(" "),
        }}
        annotation={<PersonaNamespacePillars items={PLAYER_PILLARS} />}
        fallback={<PersonaNamespaceFallback label="Player" />}
      />
    </RoleSwitcherProvider>
  );
}
