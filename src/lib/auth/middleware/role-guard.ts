import { redirect } from "@tanstack/react-router";
import { serverOnly } from "@tanstack/react-start";
import type { User } from "~/lib/auth/types";

interface RoleGuardOptions {
  user: User | null;
  requiredRoles?: string[];
  teamId?: string;
  eventId?: string;
  redirectTo?: string;
}

/**
 * Role-based access control guard for routes
 * Use this in route beforeLoad to protect pages based on user roles
 */
export const requireRole = serverOnly(async function requireRole({
  user,
  requiredRoles,
  teamId,
  eventId,
  redirectTo = "/dashboard",
}: RoleGuardOptions) {
  if (!user) {
    throw redirect({ to: "/auth/login" });
  }

  // If no specific roles required, just check authentication
  if (!requiredRoles || requiredRoles.length === 0) {
    return;
  }

  // Import PermissionService dynamically to avoid client-side bundling
  const { PermissionService } = await import("~/features/roles/permission.service");

  // Check if user has any of the required roles
  let hasAccess = false;

  for (const roleName of requiredRoles) {
    if (roleName === "Solstice Admin" || roleName === "Quadball Canada Admin") {
      // Global admin check
      hasAccess = await PermissionService.isGlobalAdmin(user.id);
    } else if (roleName === "Team Admin" && teamId) {
      // Team-specific admin check
      hasAccess = await PermissionService.canManageTeam(user.id, teamId);
    } else if (roleName === "Event Admin" && eventId) {
      // Event-specific admin check
      hasAccess = await PermissionService.canManageEvent(user.id, eventId);
    }

    if (hasAccess) break;
  }

  if (!hasAccess) {
    throw redirect({ to: redirectTo });
  }
});

/**
 * Convenience function for requiring global admin access
 */
export const requireGlobalAdmin = serverOnly(async function requireGlobalAdmin(
  user: User | null,
  redirectTo = "/dashboard",
) {
  if (!user) {
    throw redirect({ to: "/auth/login" });
  }

  // Import PermissionService dynamically to avoid client-side bundling
  const { PermissionService } = await import("~/features/roles/permission.service");
  const isAdmin = await PermissionService.isGlobalAdmin(user.id);
  if (!isAdmin) {
    throw redirect({ to: redirectTo });
  }
});
