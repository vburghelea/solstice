import { redirect } from "@tanstack/react-router";
import type { User } from "~/lib/auth/types";
import { isAdminClient } from "~/lib/auth/utils/admin-check";

interface RoleGuardOptions {
  user: User | null;
  requiredRoles?: string[];
  teamId?: string;
  eventId?: string;
  redirectTo?: string;
}

function hasClientAccess({
  user,
  requiredRoles,
  teamId,
  eventId,
}: {
  user: User;
  requiredRoles: string[];
  teamId?: string;
  eventId?: string;
}): boolean {
  return requiredRoles.some((roleName) => {
    if (roleName === "Platform Admin" || roleName === "Games Admin") {
      return isAdminClient(user);
    }

    return (
      user.roles?.some((assignment) => {
        if (assignment.role.name !== roleName) {
          return false;
        }

        if (roleName === "Team Admin" && teamId) {
          return assignment.teamId === teamId;
        }

        if (roleName === "Event Admin" && eventId) {
          return assignment.eventId === eventId;
        }

        if (roleName === "Team Admin" || roleName === "Event Admin") {
          return true;
        }

        return !assignment.teamId && !assignment.eventId;
      }) ?? false
    );
  });
}

export async function requireRole({
  user,
  requiredRoles,
  teamId,
  eventId,
  redirectTo = "/dashboard",
}: RoleGuardOptions) {
  if (!user) {
    throw redirect({ to: "/auth/login" } as never);
  }

  if (!requiredRoles || requiredRoles.length === 0) {
    return;
  }

  if (typeof window !== "undefined") {
    const clientAccessArgs: Parameters<typeof hasClientAccess>[0] = {
      user,
      requiredRoles,
      ...(teamId !== undefined ? { teamId } : {}),
      ...(eventId !== undefined ? { eventId } : {}),
    };

    if (!hasClientAccess(clientAccessArgs)) {
      throw redirect({ to: redirectTo } as never);
    }
    return;
  }

  const { PermissionService } = await import("~/features/roles/permission.service");

  let hasAccess = false;

  for (const roleName of requiredRoles) {
    if (roleName === "Platform Admin" || roleName === "Games Admin") {
      hasAccess = await PermissionService.isGlobalAdmin(user.id);
    } else if (roleName === "Team Admin" && teamId) {
      hasAccess = await PermissionService.canManageTeam(user.id, teamId);
    } else if (roleName === "Event Admin" && eventId) {
      hasAccess = await PermissionService.canManageEvent(user.id, eventId);
    } else if (user.roles) {
      hasAccess = user.roles.some((assignment) => assignment.role.name === roleName);
    }

    if (hasAccess) {
      break;
    }
  }

  if (!hasAccess) {
    throw redirect({ to: redirectTo } as never);
  }
}

export async function requireGlobalAdmin(user: User | null, redirectTo = "/dashboard") {
  if (!user) {
    throw redirect({ to: "/auth/login" } as never);
  }

  if (typeof window !== "undefined") {
    if (!isAdminClient(user)) {
      throw redirect({ to: redirectTo } as never);
    }
    return;
  }

  const { PermissionService } = await import("~/features/roles/permission.service");
  const isAdmin = await PermissionService.isGlobalAdmin(user.id);
  if (!isAdmin) {
    throw redirect({ to: redirectTo } as never);
  }
}
