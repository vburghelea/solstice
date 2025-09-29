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

const ADMIN_PILLARS: PersonaPillarItem[] = [
  {
    title: "Governance insights",
    description: [
      "System KPIs, incident timelines, and alerts help Jordan",
      "steward compliance and reliability.",
    ].join(" "),
  },
  {
    title: "Role and feature management",
    description: [
      "Bulk assignments, audit trails, and feature flag rollouts",
      "keep permissions and launches coordinated.",
    ].join(" "),
  },
  {
    title: "Cross-persona alignment",
    description: [
      "Shared dashboards link visitor conversion, player retention,",
      "and event performance into one story.",
    ].join(" "),
  },
  {
    title: "Exportable reporting",
    description: [
      "Compliance-ready exports and scheduling streamline",
      "external reviews and partner updates.",
    ].join(" "),
  },
];

export const Route = createFileRoute("/admin")({
  loader: async () => {
    const resolution = await resolvePersonaResolution({ data: {} });
    return { resolution };
  },
  component: AdminNamespaceShell,
});

function AdminNamespaceShell() {
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
          eyebrow: "Platform administration workspace",
          title: "Deliver Jordan a governance console",
          description: [
            "We're assembling oversight tooling that unifies compliance,",
            "permissions, and cross-persona health metrics.",
          ].join(" "),
          supportingText: [
            "Switch personas to contrast how visitor, player, operations,",
            "and GM journeys intersect with platform stewardship.",
          ].join(" "),
        }}
        annotation={<PersonaNamespacePillars items={ADMIN_PILLARS} />}
        fallback={<PersonaNamespaceFallback label="Platform admin" />}
      />
    </RoleSwitcherProvider>
  );
}
