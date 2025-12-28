import { createServerOnlyFn } from "@tanstack/react-start";
import type { AuthUser } from "~/lib/auth/types";
import { forbidden, unauthorized } from "~/lib/server/errors";
import { getTenantConfig } from "~/tenant";

const GLOBAL_ADMIN_ROLE_NAMES = getTenantConfig().admin.globalRoleNames;

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
  if (!userId) {
    throw unauthorized("Admin access required");
  }

  if (!(await isAdmin(userId))) {
    throw unauthorized("Admin access required");
  }

  const { getDb } = await import("~/db/server-helpers");
  const { user } = await import("~/db/schema");
  const { eq } = await import("drizzle-orm");
  const db = await getDb();
  const [record] = await db
    .select({ mfaRequired: user.mfaRequired, twoFactorEnabled: user.twoFactorEnabled })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (!record) {
    throw unauthorized("Admin access required");
  }

  if (record.mfaRequired && !record.twoFactorEnabled) {
    throw forbidden("Multi-factor authentication required", { reason: "MFA_REQUIRED" });
  }
}

export function isAdminClient(user: AuthUser): boolean {
  return hasGlobalAdminRole(user);
}

export { GLOBAL_ADMIN_ROLE_NAMES };
