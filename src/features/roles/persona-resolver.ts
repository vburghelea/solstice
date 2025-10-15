import {
  type PersonaAccessContext,
  type PersonaAnalyticsConfig,
  type PersonaDefinition,
  type PersonaId,
  type PersonaResolution,
  type PersonaResolutionSource,
  type PersonaState,
} from "~/features/roles/persona.types";

const PERSONA_DEFINITIONS: PersonaDefinition[] = createPersonaDefinitions();

const OPS_ROLE_NAMES = new Set([
  "Event Admin",
  "Platform Admin",
  "Roundup Games Admin",
  "Super Admin",
]);

const GM_ROLE_NAMES = new Set([
  "Game Master",
  "Story Guide",
  "Platform Admin",
  "Roundup Games Admin",
  "Super Admin",
]);

const ADMIN_ROLE_NAMES = new Set([
  "Platform Admin",
  "Roundup Games Admin",
  "Super Admin",
]);

export interface ResolvePersonaOptions {
  preferredPersonaId?: PersonaId | null;
  source?: PersonaResolutionSource;
}

export interface PersonaContextInput {
  isAuthenticated: boolean;
  roleNames: string[];
}

export function getPersonaDefinitions(): PersonaDefinition[] {
  return PERSONA_DEFINITIONS.map((definition) => ({ ...definition }));
}

export function resolvePersonaForContext(
  contextInput: PersonaContextInput,
  options: ResolvePersonaOptions = {},
): PersonaResolution {
  const context = createAccessContext(contextInput);
  const personas = PERSONA_DEFINITIONS.map((definition) => {
    const { access, ...definitionWithoutAccess } = definition;
    const accessResult = access
      ? access(context)
      : { availability: "available" as const };

    const personaState: PersonaState = {
      ...definitionWithoutAccess,
      availability: accessResult.availability,
      ...(typeof accessResult.reason !== "undefined"
        ? { availabilityReason: accessResult.reason }
        : {}),
    };

    return personaState;
  });

  const activePersonaId = selectActivePersona(
    personas,
    options.preferredPersonaId ?? null,
  );

  return {
    activePersonaId,
    personas,
    meta: {
      source: options.source ?? (context.isAuthenticated ? "user" : "guest"),
      resolvedAt: new Date().toISOString(),
      preferredPersonaId: options.preferredPersonaId ?? null,
    },
  } satisfies PersonaResolution;
}

export function getGuestPersonaResolution(): PersonaResolution {
  return resolvePersonaForContext(
    {
      isAuthenticated: false,
      roleNames: [],
    },
    {
      preferredPersonaId: "visitor",
      source: "guest",
    },
  );
}

export function selectActivePersona(
  personas: PersonaState[],
  preferredPersonaId: PersonaId | null,
): PersonaId {
  if (preferredPersonaId) {
    const preferred = personas.find(
      (persona) =>
        persona.id === preferredPersonaId && persona.availability === "available",
    );

    if (preferred) {
      return preferred.id;
    }
  }

  const available = personas
    .filter((persona) => persona.availability === "available")
    .sort((a, b) => b.priority - a.priority);

  if (available.length > 0) {
    return available[0].id;
  }

  return personas[0]?.id ?? "visitor";
}

export function isPersonaAvailable(
  persona: PersonaState,
): persona is PersonaState & { availability: "available" } {
  return persona.availability === "available";
}

function createAccessContext(input: PersonaContextInput): PersonaAccessContext {
  const normalizedRoles = input.roleNames.map((role) => role.trim());
  const roleSet = new Set(normalizedRoles);

  return {
    isAuthenticated: input.isAuthenticated,
    roleNames: normalizedRoles,
    hasRole: (roleName) => roleSet.has(roleName),
    hasAnyRole: (roleNames) => roleNames.some((role) => roleSet.has(role)),
  } satisfies PersonaAccessContext;
}

function createPersonaDefinitions(): PersonaDefinition[] {
  return [
    {
      id: "visitor",
      label: "Visitor",
      shortLabel: "Visit",
      description:
        "Preview public stories, events, and highlights curated for newcomers.",
      namespacePath: "/",
      defaultRedirect: "/",
      priority: 0,
      analytics: buildAnalyticsConfig("visitor"),
    },
    {
      id: "player",
      label: "Player",
      shortLabel: "Play",
      description: "Manage sessions, invitations, and community updates tailored to you.",
      namespacePath: "/player",
      defaultRedirect: "/player",
      priority: 1,
      analytics: buildAnalyticsConfig("player"),
      access: ({ isAuthenticated }) =>
        isAuthenticated
          ? { availability: "available" }
          : {
              availability: "restricted",
              reason: "Sign in to access the player workspace.",
            },
    },
    {
      id: "ops",
      label: "Event Operations",
      shortLabel: "Ops",
      description:
        "Coordinate registrations, staffing, and live event workflows in one view.",
      namespacePath: "/ops",
      defaultRedirect: "/ops",
      priority: 2,
      analytics: buildAnalyticsConfig("ops"),
      access: ({ hasAnyRole }) =>
        hasAnyRole([...OPS_ROLE_NAMES])
          ? { availability: "available" }
          : {
              availability: "restricted",
              reason: "Operations tools unlock when you're assigned an Event Admin role.",
            },
    },
    {
      id: "gm",
      label: "Game Master",
      shortLabel: "GM",
      description: "Plan campaigns, curate assets, and gather feedback from your tables.",
      namespacePath: "/gm",
      defaultRedirect: "/gm",
      priority: 3,
      analytics: buildAnalyticsConfig("gm"),
      access: ({ hasAnyRole }) =>
        hasAnyRole([...GM_ROLE_NAMES])
          ? { availability: "available" }
          : {
              availability: "restricted",
              reason:
                "Request a Game Master assignment to unlock campaign planning tools.",
            },
    },
    {
      id: "admin",
      label: "Platform Admin",
      shortLabel: "Admin",
      description:
        "Govern roles, compliance, and system health across the Roundup platform.",
      namespacePath: "/admin",
      defaultRedirect: "/admin",
      priority: 4,
      analytics: buildAnalyticsConfig("admin"),
      access: ({ hasAnyRole }) =>
        hasAnyRole([...ADMIN_ROLE_NAMES])
          ? { availability: "available" }
          : {
              availability: "restricted",
              reason:
                "Platform administration is limited to authorized compliance stewards.",
            },
    },
  ];
}

function buildAnalyticsConfig(id: PersonaId): PersonaAnalyticsConfig {
  return {
    impressionEvent: `persona.${id}.navigation_impression`,
    switchEvent: `persona.${id}.switch`,
    feedbackEvent: `persona.${id}.coming_soon_feedback`,
  } satisfies PersonaAnalyticsConfig;
}
