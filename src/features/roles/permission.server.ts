import { serverOnly } from "@tanstack/react-start";
import { and, eq, inArray } from "drizzle-orm";

import { roles, userRoles } from "~/db/schema";
import {
  getGuestPersonaResolution,
  resolvePersonaForContext,
} from "~/features/roles/persona-resolver";
import type { PersonaId, PersonaResolution } from "~/features/roles/persona.types";

/**
 * Server-side permission service
 * All methods here use database queries and should only be called on the server
 */
export class PermissionService {
  /**
   * Check if a user has global admin permissions
   */
  static isGlobalAdmin = serverOnly(async (userId: string): Promise<boolean> => {
    const { getDb } = await import("~/db/server-helpers");
    const db = await getDb();

    const [row] = await db
      .select()
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(
        and(
          eq(userRoles.userId, userId),
          inArray(roles.name, ["Super Admin", "Roundup Games Admin"]),
        ),
      )
      .limit(1);

    return !!row;
  });

  /**
   * Check if a user can manage a specific team
   */
  static canManageTeam = serverOnly(
    async (userId: string, teamId: string): Promise<boolean> => {
      // Global admins can manage any team
      if (await PermissionService.isGlobalAdmin(userId)) return true;

      const { getDb } = await import("~/db/server-helpers");
      const db = await getDb();

      // Check for team-specific admin role
      const [row] = await db
        .select()
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(
          and(
            eq(userRoles.userId, userId),
            eq(roles.name, "Team Admin"),
            eq(userRoles.teamId, teamId),
          ),
        )
        .limit(1);

      return !!row;
    },
  );

  /**
   * Check if a user can manage a specific event
   */
  static canManageEvent = serverOnly(
    async (userId: string, eventId: string): Promise<boolean> => {
      // Global admins can manage any event
      if (await PermissionService.isGlobalAdmin(userId)) return true;

      const { getDb } = await import("~/db/server-helpers");
      const db = await getDb();

      // Check for event-specific admin role
      const [row] = await db
        .select()
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(
          and(
            eq(userRoles.userId, userId),
            eq(roles.name, "Event Admin"),
            eq(userRoles.eventId, eventId),
          ),
        )
        .limit(1);

      return !!row;
    },
  );

  /**
   * Get all roles for a user including scope information
   */
  static getUserRoles = serverOnly(async (userId: string) => {
    const { getDb } = await import("~/db/server-helpers");
    const db = await getDb();

    const userRolesList = await db
      .select({
        id: userRoles.id,
        userId: userRoles.userId,
        roleId: userRoles.roleId,
        teamId: userRoles.teamId,
        eventId: userRoles.eventId,
        assignedBy: userRoles.assignedBy,
        assignedAt: userRoles.assignedAt,
        expiresAt: userRoles.expiresAt,
        notes: userRoles.notes,
        role: {
          id: roles.id,
          name: roles.name,
          description: roles.description,
          permissions: roles.permissions,
        },
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, userId));

    return userRolesList;
  });

  static resolvePersonaResolution = serverOnly(
    async (
      userId?: string | null,
      options: ResolvePersonaResolutionOptions = {},
    ): Promise<PersonaResolution> => {
      const cacheKey = userId ?? "guest";
      const now = Date.now();
      const cached = personaResolutionCache.get(cacheKey);

      if (cached && !options.forceRefresh && cached.expiresAt > now) {
        if (options.preferredPersonaId) {
          const activePersonaId = selectPersonaFromCache(
            cached.resolution,
            options.preferredPersonaId,
          );

          if (activePersonaId !== cached.resolution.activePersonaId) {
            const updatedResolution: PersonaResolution = {
              ...cached.resolution,
              activePersonaId,
              meta: {
                ...cached.resolution.meta,
                preferredPersonaId: options.preferredPersonaId,
              },
            };

            personaResolutionCache.set(cacheKey, {
              expiresAt: cached.expiresAt,
              resolution: updatedResolution,
            });

            return updatedResolution;
          }
        }

        return cached.resolution;
      }

      if (!userId) {
        const guestResolution = getGuestPersonaResolution();
        personaResolutionCache.set(cacheKey, {
          expiresAt: now + PERSONA_RESOLUTION_TTL_MS,
          resolution: guestResolution,
        });
        return guestResolution;
      }

      const userRolesList = await PermissionService.getUserRoles(userId);
      const roleNames = userRolesList.map(({ role }) => role.name);
      const resolution = resolvePersonaForContext(
        {
          isAuthenticated: true,
          roleNames,
        },
        {
          preferredPersonaId: options.preferredPersonaId ?? null,
        },
      );

      personaResolutionCache.set(cacheKey, {
        expiresAt: now + PERSONA_RESOLUTION_TTL_MS,
        resolution,
      });

      return resolution;
    },
  );
}

interface CachedPersonaResolution {
  expiresAt: number;
  resolution: PersonaResolution;
}

const PERSONA_RESOLUTION_TTL_MS = 60_000;
const personaResolutionCache = new Map<string, CachedPersonaResolution>();

export interface ResolvePersonaResolutionOptions {
  preferredPersonaId?: PersonaId | null;
  forceRefresh?: boolean;
}

function selectPersonaFromCache(
  resolution: PersonaResolution,
  preferredPersonaId: PersonaId,
): PersonaId {
  const preferredPersona = resolution.personas.find(
    (persona) =>
      persona.id === preferredPersonaId && persona.availability === "available",
  );

  if (preferredPersona) {
    return preferredPersona.id;
  }

  return resolution.activePersonaId;
}
