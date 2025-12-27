import { createServerFn } from "@tanstack/react-start";
import { zod$ } from "~/lib/server/fn-utils";
import { assertFeatureEnabled } from "~/tenant/feature-gates";
import {
  createSavedReportSchema,
  deleteSavedReportSchema,
  exportReportSchema,
  updateSavedReportSchema,
} from "./reports.schemas";

const SENSITIVE_FIELDS = [
  "email",
  "phone",
  "dateOfBirth",
  "emergencyContact",
  "emergencyContactPhone",
  "emergencyContactEmail",
];

const extractPermissionSet = (
  roleAssignments: Array<{ role?: { permissions?: Record<string, boolean> } }>,
) => {
  const permissions = new Set<string>();
  for (const assignment of roleAssignments) {
    const perms = assignment.role?.permissions ?? {};
    for (const [key, value] of Object.entries(perms)) {
      if (value) permissions.add(key);
    }
  }
  return permissions;
};

const canViewSensitiveFields = ({
  isGlobalAdmin,
  orgRole,
  permissions,
}: {
  isGlobalAdmin: boolean;
  orgRole: string | null;
  permissions: Set<string>;
}) => {
  if (isGlobalAdmin) return true;
  if (permissions.has("*")) return true;
  if (
    permissions.has("pii.read") ||
    permissions.has("pii:read") ||
    permissions.has("data.pii.read")
  ) {
    return true;
  }

  // Default: org owners/admins can view sensitive fields *within their org scope*
  if (orgRole && ["owner", "admin"].includes(orgRole)) return true;

  return false;
};

const applyFieldLevelAcl = (
  rows: Array<Record<string, unknown>>,
  opts: { canViewSensitiveFields: boolean },
) => {
  if (opts.canViewSensitiveFields) return rows;
  return rows.map((row) => {
    const next = { ...row };
    for (const field of SENSITIVE_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(next, field)) {
        next[field] = "***";
      }
    }
    return next;
  });
};

const getSession = async () => {
  const { getAuth } = await import("~/lib/auth/server-helpers");
  const { getRequest } = await import("@tanstack/react-start/server");
  const auth = await getAuth();
  const { headers } = getRequest();
  const session = await auth.api.getSession({ headers });
  return session ?? null;
};

const getSessionUser = async () => {
  const session = await getSession();
  return session?.user ?? null;
};

const loadReportData = async ({
  dataSource,
  organizationId,
  isGlobalAdmin,
}: {
  dataSource: string;
  organizationId: string | null;
  isGlobalAdmin: boolean;
}) => {
  const { getDb } = await import("~/db/server-helpers");
  const { organizations, reportingSubmissions, formSubmissions } =
    await import("~/db/schema");
  const { eq } = await import("drizzle-orm");

  const db = await getDb();
  if (dataSource === "organizations") {
    if (isGlobalAdmin && !organizationId) return db.select().from(organizations);
    if (!organizationId) return [];
    return db.select().from(organizations).where(eq(organizations.id, organizationId));
  }

  if (dataSource === "reporting_submissions") {
    if (isGlobalAdmin && !organizationId) return db.select().from(reportingSubmissions);
    if (!organizationId) return [];
    return db
      .select()
      .from(reportingSubmissions)
      .where(eq(reportingSubmissions.organizationId, organizationId));
  }

  if (dataSource === "form_submissions") {
    if (isGlobalAdmin && !organizationId) return db.select().from(formSubmissions);
    if (!organizationId) return [];
    return db
      .select()
      .from(formSubmissions)
      .where(eq(formSubmissions.organizationId, organizationId));
  }

  return [];
};

export const createSavedReport = createServerFn({ method: "POST" })
  .inputValidator(zod$(createSavedReportSchema))
  .handler(async ({ data }) => {
    await assertFeatureEnabled("sin_analytics");
    const sessionUser = await getSessionUser();
    if (!sessionUser?.id) return null;

    const { getDb } = await import("~/db/server-helpers");
    const { savedReports } = await import("~/db/schema");

    const db = await getDb();
    const [created] = await db
      .insert(savedReports)
      .values({
        organizationId: data.organizationId ?? null,
        name: data.name,
        description: data.description ?? null,
        dataSource: data.dataSource,
        filters: data.filters ?? {},
        columns: data.columns ?? [],
        sort: data.sort ?? {},
        ownerId: sessionUser.id,
        sharedWith: data.sharedWith ?? [],
        isOrgWide: data.isOrgWide ?? false,
      })
      .returning();

    if (created) {
      const { logDataChange } = await import("~/lib/audit");
      await logDataChange({
        action: "REPORT_SAVE",
        actorUserId: sessionUser.id,
        targetType: "saved_report",
        targetId: created.id,
        targetOrgId: created.organizationId ?? null,
      });
    }

    return created ?? null;
  });

export const updateSavedReport = createServerFn({ method: "POST" })
  .inputValidator(zod$(updateSavedReportSchema))
  .handler(async ({ data }) => {
    await assertFeatureEnabled("sin_analytics");
    const sessionUser = await getSessionUser();
    if (!sessionUser?.id) return null;

    const { getDb } = await import("~/db/server-helpers");
    const { savedReports } = await import("~/db/schema");
    const { eq } = await import("drizzle-orm");

    const db = await getDb();
    const [existing] = await db
      .select()
      .from(savedReports)
      .where(eq(savedReports.id, data.reportId))
      .limit(1);

    if (!existing) return null;

    if (existing.ownerId !== sessionUser.id) {
      const { PermissionService } = await import("~/features/roles/permission.service");
      const isAdmin = await PermissionService.isGlobalAdmin(sessionUser.id);
      if (!isAdmin) return null;
    }

    const [updated] = await db
      .update(savedReports)
      .set({
        organizationId: data.data.organizationId ?? existing.organizationId,
        name: data.data.name ?? existing.name,
        description: data.data.description ?? existing.description,
        dataSource: data.data.dataSource ?? existing.dataSource,
        filters: data.data.filters ?? existing.filters,
        columns: data.data.columns ?? existing.columns,
        sort: data.data.sort ?? existing.sort,
        sharedWith: data.data.sharedWith ?? existing.sharedWith,
        isOrgWide: data.data.isOrgWide ?? existing.isOrgWide,
      })
      .where(eq(savedReports.id, data.reportId))
      .returning();

    if (updated) {
      const { logDataChange } = await import("~/lib/audit");
      await logDataChange({
        action: "REPORT_UPDATE",
        actorUserId: sessionUser.id,
        targetType: "saved_report",
        targetId: updated.id,
        targetOrgId: updated.organizationId ?? null,
      });
    }

    return updated ?? null;
  });

export const deleteSavedReport = createServerFn({ method: "POST" })
  .inputValidator(zod$(deleteSavedReportSchema))
  .handler(async ({ data }) => {
    await assertFeatureEnabled("sin_analytics");
    const sessionUser = await getSessionUser();
    if (!sessionUser?.id) return null;

    const { getDb } = await import("~/db/server-helpers");
    const { savedReports } = await import("~/db/schema");
    const { eq } = await import("drizzle-orm");

    const db = await getDb();
    const [existing] = await db
      .select()
      .from(savedReports)
      .where(eq(savedReports.id, data.reportId))
      .limit(1);

    if (!existing) return null;

    if (existing.ownerId !== sessionUser.id) {
      const { PermissionService } = await import("~/features/roles/permission.service");
      const isAdmin = await PermissionService.isGlobalAdmin(sessionUser.id);
      if (!isAdmin) return null;
    }

    await db.delete(savedReports).where(eq(savedReports.id, data.reportId));

    const { logDataChange } = await import("~/lib/audit");
    await logDataChange({
      action: "REPORT_DELETE",
      actorUserId: sessionUser.id,
      targetType: "saved_report",
      targetId: data.reportId,
      targetOrgId: existing.organizationId ?? null,
    });

    return { success: true };
  });

export const exportReport = createServerFn({ method: "POST" })
  .inputValidator(zod$(exportReportSchema))
  .handler(async ({ data }) => {
    await assertFeatureEnabled("sin_analytics");
    const session = await getSession();
    const sessionUser = session?.user ?? null;
    if (!sessionUser?.id) return null;

    const { requireRecentAuth } = await import("~/lib/auth/guards/step-up");
    await requireRecentAuth(sessionUser.id, session);

    const { toCsv } = await import("~/shared/lib/csv");
    const { exportHistory } = await import("~/db/schema");
    const { getDb } = await import("~/db/server-helpers");
    const { PermissionService } = await import("~/features/roles/permission.service");
    const db = await getDb();

    const { forbidden } = await import("~/lib/server/errors");
    const isGlobalAdmin = await PermissionService.isGlobalAdmin(sessionUser.id);

    const { getRequest } = await import("@tanstack/react-start/server");
    const request = getRequest();
    const orgIdFromHeader = request.headers.get("x-organization-id");
    const filtersRecord = data.filters as Record<string, unknown> | undefined;
    const orgIdValue = filtersRecord?.["organizationId"];
    const orgIdFromFilters = typeof orgIdValue === "string" ? orgIdValue : null;
    const scopedOrganizationId = orgIdFromHeader ?? orgIdFromFilters ?? null;

    let orgRole: string | null = null;
    if (!isGlobalAdmin) {
      if (!scopedOrganizationId) {
        throw forbidden("Organization context required");
      }

      const { requireOrganizationMembership } =
        await import("~/lib/auth/guards/org-guard");
      const membership = await requireOrganizationMembership({
        userId: sessionUser.id,
        organizationId: scopedOrganizationId,
      });
      orgRole = membership.role;
    }

    const roleAssignments = await PermissionService.getUserRoles(sessionUser.id);
    const permissions = extractPermissionSet(
      roleAssignments as Array<{ role?: { permissions?: Record<string, boolean> } }>,
    );
    const canViewPii = canViewSensitiveFields({
      isGlobalAdmin,
      orgRole,
      permissions,
    });

    const rows = await loadReportData({
      dataSource: data.dataSource,
      organizationId: scopedOrganizationId,
      isGlobalAdmin,
    });

    const filteredRows = applyFieldLevelAcl(rows as Array<Record<string, unknown>>, {
      canViewSensitiveFields: canViewPii,
    });

    const exportPayload =
      data.exportType === "csv" || data.exportType === "excel"
        ? toCsv(filteredRows)
        : JSON.stringify(filteredRows);

    await db.insert(exportHistory).values({
      userId: sessionUser.id,
      organizationId: scopedOrganizationId,
      reportId: null,
      exportType: data.exportType,
      dataSource: data.dataSource,
      filtersUsed: data.filters ?? {},
      rowCount: filteredRows.length,
      fileKey: null,
    });

    const { logExportEvent } = await import("~/lib/audit");
    await logExportEvent({
      action: "REPORT_EXPORT",
      actorUserId: sessionUser.id,
      metadata: {
        type: data.exportType,
        rows: filteredRows.length,
        organizationId: scopedOrganizationId,
        dataSource: data.dataSource,
      },
    });

    return { data: exportPayload };
  });
