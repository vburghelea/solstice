import { redirect } from "@tanstack/react-router";
import { userHasRole } from "~/features/roles/permission.service";
import type { User } from "~/lib/auth/types";
import { isAdminClient } from "~/lib/auth/utils/admin-check";

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
export async function requireRole({
  user,
  requiredRoles,
  teamId,
  eventId,
  redirectTo = "/dashboard",
}: RoleGuardOptions) {
  if (!user) {
    throw redirect({ to: "/auth/login" });
  }

  if (!requiredRoles || requiredRoles.length === 0) {
    return;
  }

  const hasAccess = requiredRoles.some((roleName) => {
    if (roleName === "Team Admin" && teamId) {
      return userHasRole(user, roleName, { teamId });
    }

    if (roleName === "Event Admin" && eventId) {
      return userHasRole(user, roleName, { eventId });
    }

    return userHasRole(user, roleName);
  });

  if (!hasAccess) {
    throw redirect({ to: redirectTo });
  }
}

/**
 * Convenience function for requiring global admin access
 */
export async function requireGlobalAdmin(user: User | null, redirectTo = "/dashboard") {
  if (!user) {
    throw redirect({ to: "/auth/login" });
  }

  if (!isAdminClient(user)) {
    throw redirect({ to: redirectTo });
  }
}
