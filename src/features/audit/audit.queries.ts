import { createServerFn } from "@tanstack/react-start";
import type { AuditLog } from "~/db/schema";
import { zod$ } from "~/lib/server/fn-utils";
import { assertFeatureEnabled } from "~/tenant/feature-gates";
import { listAuditLogsSchema } from "./audit.schemas";

const getSessionUserId = async () => {
  const { getAuth } = await import("~/lib/auth/server-helpers");
  const { getRequest } = await import("@tanstack/react-start/server");
  const auth = await getAuth();
  const { headers } = getRequest();
  const session = await auth.api.getSession({ headers });
  return session?.user?.id ?? null;
};

export const listAuditLogs = createServerFn({ method: "GET" })
  .inputValidator(zod$(listAuditLogsSchema))
  .handler(async ({ data }): Promise<AuditLog[]> => {
    await assertFeatureEnabled("sin_admin_audit");
    const userId = await getSessionUserId();
    const { unauthorized, forbidden } = await import("~/lib/server/errors");
    if (!userId) {
      throw unauthorized("User not authenticated");
    }

    const { PermissionService } = await import("~/features/roles/permission.service");
    const isGlobalAdmin = await PermissionService.isGlobalAdmin(userId);

    const { getDb } = await import("~/db/server-helpers");
    const { auditLogs, organizationMembers } = await import("~/db/schema");
    const { and, desc, eq, gte, inArray, lte } = await import("drizzle-orm");
    const { ORG_ADMIN_ROLES } = await import("~/lib/auth/guards/org-guard");

    const db = await getDb();
    const conditions = [];

    // Access control + tenancy scoping (DM-AGG-003, SEC-AGG-004)
    if (!isGlobalAdmin) {
      // Org admins can only access audit logs for orgs they admin
      const adminMemberships = await db
        .select({ organizationId: organizationMembers.organizationId })
        .from(organizationMembers)
        .where(
          and(
            eq(organizationMembers.userId, userId),
            eq(organizationMembers.status, "active"),
            inArray(organizationMembers.role, ORG_ADMIN_ROLES),
          ),
        );

      const allowedOrgIds = adminMemberships.map((row) => row.organizationId);
      if (allowedOrgIds.length === 0) {
        throw forbidden("Admin access required");
      }

      if (data.targetOrgId) {
        if (!allowedOrgIds.includes(data.targetOrgId)) {
          throw forbidden("Insufficient organization role");
        }
        conditions.push(eq(auditLogs.targetOrgId, data.targetOrgId));
      } else {
        conditions.push(inArray(auditLogs.targetOrgId, allowedOrgIds));
      }
    } else if (data.targetOrgId) {
      // Global admins may optionally scope to an org
      conditions.push(eq(auditLogs.targetOrgId, data.targetOrgId));
    }

    if (data.actorUserId) {
      conditions.push(eq(auditLogs.actorUserId, data.actorUserId));
    }

    if (data.actionCategory) {
      conditions.push(eq(auditLogs.actionCategory, data.actionCategory));
    }

    if (data.from) {
      conditions.push(gte(auditLogs.occurredAt, new Date(data.from)));
    }

    if (data.to) {
      conditions.push(lte(auditLogs.occurredAt, new Date(data.to)));
    }

    const rows = await db
      .select()
      .from(auditLogs)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(auditLogs.occurredAt))
      .limit(data.limit ?? 100);

    return rows as AuditLog[];
  });

export const exportAuditLogs = createServerFn({ method: "GET" })
  .inputValidator(zod$(listAuditLogsSchema))
  .handler(async ({ data }): Promise<string> => {
    await assertFeatureEnabled("sin_admin_audit");
    const logs = await listAuditLogs({ data });
    const { toCsv } = await import("~/shared/lib/csv");
    return toCsv(logs as Array<Record<string, unknown>>);
  });

export const verifyAuditHashChain = createServerFn({ method: "GET" }).handler(
  async () => {
    await assertFeatureEnabled("sin_admin_audit");
    const userId = await getSessionUserId();
    const { unauthorized, forbidden } = await import("~/lib/server/errors");
    if (!userId) {
      throw unauthorized("User not authenticated");
    }

    const { PermissionService } = await import("~/features/roles/permission.service");
    const isGlobalAdmin = await PermissionService.isGlobalAdmin(userId);
    if (!isGlobalAdmin) {
      throw forbidden("Global admin access required");
    }

    const { verifyAuditHashChain: verify } = await import("~/lib/audit");
    return verify();
  },
);
