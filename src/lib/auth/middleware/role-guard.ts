import { redirect } from "@tanstack/react-router";
import type { User } from "~/lib/auth/types";
import { isAdminClient } from "~/lib/auth/utils/admin-check";
import type { SupportedLanguage } from "~/lib/i18n/config";
import { resolveLocalizedPath } from "~/lib/i18n/redirects";

interface RoleGuardOptions {
  user: User | null;
  requiredRoles?: string[];
  teamId?: string;
  eventId?: string;
  redirectTo?: string;
  language?: SupportedLanguage | null | undefined;
  currentPath?: string | undefined;
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
    if (
      roleName === "Platform Admin" ||
      roleName === "Roundup Games Admin" ||
      roleName === "Super Admin"
    ) {
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
  redirectTo = "/player",
  language,
  currentPath,
}: RoleGuardOptions) {
  if (!user) {
    const localizedLoginPath = resolveLocalizedPath({
      targetPath: "/auth/login",
      language,
      currentPath,
    });
    throw redirect({ to: localizedLoginPath } as never);
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
      const localizedRedirect = resolveLocalizedPath({
        targetPath: redirectTo,
        language,
        currentPath,
      });
      throw redirect({ to: localizedRedirect } as never);
    }
    return;
  }

  const { PermissionService } = await import("~/features/roles/permission.service");

  let hasAccess = false;

  for (const roleName of requiredRoles) {
    if (
      roleName === "Platform Admin" ||
      roleName === "Roundup Games Admin" ||
      roleName === "Super Admin"
    ) {
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
    const localizedRedirect = resolveLocalizedPath({
      targetPath: redirectTo,
      language,
      currentPath,
    });
    throw redirect({ to: localizedRedirect } as never);
  }
}

export async function requireGlobalAdmin(
  user: User | null,
  redirectTo = "/player",
  options?: {
    language?: SupportedLanguage | null | undefined;
    currentPath?: string | undefined;
  },
) {
  const { language, currentPath } = options ?? {};

  if (!user) {
    const localizedLoginPath = resolveLocalizedPath({
      targetPath: "/auth/login",
      language,
      currentPath,
    });
    throw redirect({ to: localizedLoginPath } as never);
  }

  if (typeof window !== "undefined") {
    if (!isAdminClient(user)) {
      const localizedRedirect = resolveLocalizedPath({
        targetPath: redirectTo,
        language,
        currentPath,
      });
      throw redirect({ to: localizedRedirect } as never);
    }
    return;
  }

  const { PermissionService } = await import("~/features/roles/permission.service");
  const isAdmin = await PermissionService.isGlobalAdmin(user.id);
  if (!isAdmin) {
    const localizedRedirect = resolveLocalizedPath({
      targetPath: redirectTo,
      language,
      currentPath,
    });
    throw redirect({ to: localizedRedirect } as never);
  }
}
