import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

import {
  PersonaNamespaceFallback,
  PersonaNamespaceLayout,
  PersonaNamespacePillars,
  type PersonaNamespaceNavItem,
  type PersonaPillarItem,
} from "~/features/layouts/persona-namespace-layout";
import { resolvePersonaResolution } from "~/features/roles/persona.server";
import type { PersonaResolution } from "~/features/roles/persona.types";
import { RoleSwitcherProvider } from "~/features/roles/role-switcher-context";

const VISITOR_PILLARS: PersonaPillarItem[] = [
  {
    title: "Storytelling spotlight",
    description: [
      "Guided narratives and highlights that help visitors feel",
      "the Roundup tone before joining.",
    ].join(" "),
  },
  {
    title: "Effortless RSVP",
    description: [
      "Low-friction interest capture so newcomers can raise a hand",
      "without needing an account first.",
    ].join(" "),
  },
  {
    title: "Trust-building clarity",
    description: [
      "Transparent expectations, safety signals, and clear CTAs",
      "that convert curiosity into confidence.",
    ].join(" "),
  },
  {
    title: "Mobile-ready navigation",
    description: [
      "Touch-friendly structure that keeps Maya oriented",
      "on tablets and phones.",
    ].join(" "),
  },
];

const VISITOR_NAVIGATION: PersonaNamespaceNavItem[] = [
  {
    label: "Overview",
    to: "/visit",
    exact: true,
  },
  {
    label: "Shared inbox",
    description: "Preview Maya's player handoffs",
    to: "/visit/inbox",
  },
  {
    label: "Collaboration",
    description: "Cross-persona reporting",
    to: "/visit/collaboration",
  },
];

export const Route = createFileRoute("/visit")({
  loader: async () => {
    const resolution = await resolvePersonaResolution({ data: {} });
    return { resolution };
  },
  component: VisitorNamespaceShell,
});

function VisitorNamespaceShell() {
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
          eyebrow: "Visitor workspace",
          title: "Preview Roundup as a curious explorer",
          description: [
            "Follow a narrative-driven tour through events, community stories,",
            "and calls-to-action designed for first impressions.",
          ].join(" "),
          supportingText: [
            "Persona switching stays available as we continue building",
            "each workspace. Use it to compare perspectives in seconds.",
          ].join(" "),
        }}
        annotation={<PersonaNamespacePillars items={VISITOR_PILLARS} />}
        fallback={<PersonaNamespaceFallback label="Visitor" />}
        navigation={VISITOR_NAVIGATION}
      />
    </RoleSwitcherProvider>
  );
}
