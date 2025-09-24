import { createServerOnlyFn } from "@tanstack/react-start";
import type { AuthUser } from "~/lib/auth/types";

const GLOBAL_ADMIN_ROLE_NAMES = ["Solstice Admin", "Quadball Canada Admin"];

const getPermissionService = createServerOnlyFn(async () => {
  const { PermissionService } = await import("~/features/roles/permission.service");
  return PermissionService;
});

function hasGlobalAdminRole(user: AuthUser): boolean {
  if (!user?.roles || user.roles.length === 0) {
    return false;
  }

  return user.roles.some(({ role }) => GLOBAL_ADMIN_ROLE_NAMES.includes(role.name));
}

export async function isAdmin(userId: string | undefined | null): Promise<boolean> {
  if (!userId) return false;
  const PermissionService = await getPermissionService();
  return PermissionService.isGlobalAdmin(userId);
}

export async function requireAdmin(userId: string | undefined | null): Promise<void> {
  if (!(await isAdmin(userId))) {
    throw new Error("Unauthorized: Admin access required");
  }
}

export function isAdminClient(user: AuthUser): boolean {
  return hasGlobalAdminRole(user);
}

export { GLOBAL_ADMIN_ROLE_NAMES };
