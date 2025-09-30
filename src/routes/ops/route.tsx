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

const OPS_PILLARS: PersonaPillarItem[] = [
  {
    title: "Operations overview",
    description: [
      "Real-time registration, staffing, and marketing signals",
      "help Priya keep every event on track.",
    ].join(" "),
  },
  {
    title: "Task orchestration",
    description: [
      "Assignments, checklists, and automations coordinate handoffs",
      "across marketing and logistics.",
    ].join(" "),
  },
  {
    title: "Scoped permissions",
    description: [
      "Role-aware filters ensure managers only see the events",
      "and actions they're cleared to manage.",
    ].join(" "),
  },
  {
    title: "Export-ready data",
    description: [
      "On-demand CSV and calendar exports share the latest plans",
      "with partners and on-site staff.",
    ].join(" "),
  },
];

const OPS_NAVIGATION: PersonaNamespaceNavItem[] = [
  {
    label: "Overview",
    to: "/ops",
    exact: true,
  },
  {
    label: "Shared inbox",
    description: "Approvals & escalations",
    to: "/ops/inbox",
  },
  {
    label: "Collaboration",
    description: "Mission control sync",
    to: "/ops/collaboration",
  },
];

export const Route = createFileRoute("/ops")({
  loader: async () => {
    const resolution = await resolvePersonaResolution({ data: {} });
    return { resolution };
  },
  component: OpsNamespaceShell,
});

function OpsNamespaceShell() {
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
          eyebrow: "Event operations workspace",
          title: "Equip Priya with live operational context",
          description: [
            "We're shaping dashboards and workflows that surface registrations,",
            "staffing, and marketing health in one place.",
          ].join(" "),
          supportingText: [
            "Use the persona switcher to preview how admin, GM, and visitor",
            "perspectives contrast with operations tooling.",
          ].join(" "),
        }}
        annotation={<PersonaNamespacePillars items={OPS_PILLARS} />}
        fallback={<PersonaNamespaceFallback label="Operations" />}
        navigation={OPS_NAVIGATION}
      />
    </RoleSwitcherProvider>
  );
}
