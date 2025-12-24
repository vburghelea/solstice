Below are concrete, drop‑in fixes for Issues 01–04 (all CRITICAL) using the patterns you called out (org-guard, PermissionService, org scoping via x-organization-id, and server-side checks inside createServerFn handlers).

I’m giving you unified diffs per file so you can apply them directly.

⸻

Issue 01 — Audit log access not restricted (CRITICAL)

What this patch does
• Requires an authenticated session.
• Allows global admins to view all logs (optionally filtered by org).
• Allows org admins (owner/admin) to view logs only for orgs they admin (scoped to targetOrgId or to all of their admin orgs).
• Export uses the same guarded query.

Patch: src/features/audit/audit.queries.ts

diff --git a/src/features/audit/audit.queries.ts b/src/features/audit/audit.queries.ts
--- a/src/features/audit/audit.queries.ts
+++ b/src/features/audit/audit.queries.ts
@@
import { createServerFn } from "@tanstack/react-start";
import { zod$ } from "~/lib/server/fn-utils";
import type { AuditLog } from "~/db/schema";
import { listAuditLogsSchema } from "./audit.schemas";

+const getSessionUserId = async () => {

- const { getAuth } = await import("~/lib/auth/server-helpers");
- const { getRequest } = await import("@tanstack/react-start/server");
- const auth = await getAuth();
- const { headers } = getRequest();
- const session = await auth.api.getSession({ headers });
- return session?.user?.id ?? null;
  +};
- export const listAuditLogs = createServerFn({ method: "GET" })
  .inputValidator(zod$(listAuditLogsSchema))
  .handler(async ({ data }): Promise<AuditLog[]> => {

* const { getDb } = await import("~/db/server-helpers");
* const { auditLogs } = await import("~/db/schema");
* const { and, desc, eq, gte, lte } = await import("drizzle-orm");

- const userId = await getSessionUserId();
- const { unauthorized, forbidden } = await import("~/lib/server/errors");
- if (!userId) {
-      throw unauthorized("User not authenticated");
- }
-
- const { PermissionService } = await import("~/features/roles/permission.service");
- const isGlobalAdmin = await PermissionService.isGlobalAdmin(userId);
-
- const { getDb } = await import("~/db/server-helpers");
- const { auditLogs, organizationMembers } = await import("~/db/schema");
- const { and, desc, eq, gte, inArray, lte } = await import("drizzle-orm");
- const { ORG_ADMIN_ROLES } = await import("~/lib/auth/guards/org-guard");

  const db = await getDb();
  const conditions = [];

- // ------------------------------------------------------------
- // Access control + tenancy scoping (DM-AGG-003, SEC-AGG-004)
- // ------------------------------------------------------------
- if (!isGlobalAdmin) {
-      // Org admins can only access audit logs for orgs they admin
-      const adminMemberships = await db
-        .select({ organizationId: organizationMembers.organizationId })
-        .from(organizationMembers)
-        .where(
-          and(
-            eq(organizationMembers.userId, userId),
-            eq(organizationMembers.status, "active"),
-            inArray(organizationMembers.role, ORG_ADMIN_ROLES),
-          ),
-        );
-
-      const allowedOrgIds = adminMemberships.map((row) => row.organizationId);
-      if (allowedOrgIds.length === 0) {
-        throw forbidden("Admin access required");
-      }
-
-      if (data.targetOrgId) {
-        if (!allowedOrgIds.includes(data.targetOrgId)) {
-          throw forbidden("Insufficient organization role");
-        }
-        conditions.push(eq(auditLogs.targetOrgId, data.targetOrgId));
-      } else {
-        conditions.push(inArray(auditLogs.targetOrgId, allowedOrgIds));
-      }
- } else if (data.targetOrgId) {
-      // Global admins may optionally scope to an org
-      conditions.push(eq(auditLogs.targetOrgId, data.targetOrgId));
- }
-     if (data.actorUserId) {
        conditions.push(eq(auditLogs.actorUserId, data.actorUserId));
      }

* if (data.targetOrgId) {
*      conditions.push(eq(auditLogs.targetOrgId, data.targetOrgId));
* }
*     if (data.actionCategory) {
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
  const logs = await listAuditLogs({ data });
  const { toCsv } = await import("~/shared/lib/csv");
  return toCsv(logs as Array<Record<string, unknown>>);
  });

⸻

Issue 02 — Security events & account locks not restricted (CRITICAL)

What this patch does
• Requires authentication for all three endpoints.
• Global admins can list all.
• Non-global users:
• Can read their own security events / lock status without org context.
• Can read other users’ events/lock status only if:
• Request includes x-organization-id
• They are org admin in that org
• The target user is a member of that org
• Can list events/locks for an org only as org admin (scoped by org members).

Patch: src/features/security/security.queries.ts

diff --git a/src/features/security/security.queries.ts b/src/features/security/security.queries.ts
--- a/src/features/security/security.queries.ts
+++ b/src/features/security/security.queries.ts
@@
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { zod$ } from "~/lib/server/fn-utils";
import { accountLockStatusSchema } from "./security.schemas";

+const getSessionUserId = async () => {

- const { getAuth } = await import("~/lib/auth/server-helpers");
- const { getRequest } = await import("@tanstack/react-start/server");
- const auth = await getAuth();
- const { headers } = getRequest();
- const session = await auth.api.getSession({ headers });
- return session?.user?.id ?? null;
  +};
- const listSecurityEventsSchema = z
  .object({
  userId: z.string().optional(),
  })
  .nullish()
  .transform((value) => value ?? {});

  export const listSecurityEvents = createServerFn({ method: "GET" })
  .inputValidator(zod$(listSecurityEventsSchema))
  .handler(async ({ data }) => {

- const sessionUserId = await getSessionUserId();
- const { unauthorized, forbidden } = await import("~/lib/server/errors");
- if (!sessionUserId) {
-      throw unauthorized("User not authenticated");
- }
-
- const { PermissionService } = await import("~/features/roles/permission.service");
- const isGlobalAdmin = await PermissionService.isGlobalAdmin(sessionUserId);
-
- const { getRequest } = await import("@tanstack/react-start/server");
- const organizationId = getRequest().headers.get("x-organization-id");
-     const { getDb } = await import("~/db/server-helpers");

* const { securityEvents } = await import("~/db/schema");
* const { desc, eq } = await import("drizzle-orm");

- const { organizationMembers, securityEvents } = await import("~/db/schema");
- const { and, desc, eq, inArray } = await import("drizzle-orm");

  const db = await getDb();

* if (data.userId) {

-
- // If requesting a specific user's events:
- if (data.userId) {
-      // self-access OK
-      if (data.userId !== sessionUserId && !isGlobalAdmin) {
-        if (!organizationId) {
-          throw forbidden("Organization context required");
-        }
-
-        const { requireOrganizationMembership, ORG_ADMIN_ROLES } = await import(
-          "~/lib/auth/guards/org-guard"
-        );
-        // requester must be org admin
-        await requireOrganizationMembership(
-          { userId: sessionUserId, organizationId },
-          { roles: ORG_ADMIN_ROLES },
-        );
-        // target must be member of same org
-        await requireOrganizationMembership({ userId: data.userId, organizationId });
-      }
-       return db
          .select()
          .from(securityEvents)
          .where(eq(securityEvents.userId, data.userId))
          .orderBy(desc(securityEvents.createdAt));
      }

* return db.select().from(securityEvents).orderBy(desc(securityEvents.createdAt));

- // Listing across users:
- if (isGlobalAdmin) {
-      return db.select().from(securityEvents).orderBy(desc(securityEvents.createdAt));
- }
-
- // Org-scoped list requires org context + org admin
- if (!organizationId) {
-      throw forbidden("Organization context required");
- }
-
- const { requireOrganizationMembership, ORG_ADMIN_ROLES } = await import(
-      "~/lib/auth/guards/org-guard"
- );
- await requireOrganizationMembership(
-      { userId: sessionUserId, organizationId },
-      { roles: ORG_ADMIN_ROLES },
- );
-
- const memberRows = await db
-      .select({ userId: organizationMembers.userId })
-      .from(organizationMembers)
-      .where(
-        and(
-          eq(organizationMembers.organizationId, organizationId),
-          eq(organizationMembers.status, "active"),
-        ),
-      );
- const memberUserIds = memberRows.map((row) => row.userId);
- if (memberUserIds.length === 0) return [];
-
- return db
-      .select()
-      .from(securityEvents)
-      .where(inArray(securityEvents.userId, memberUserIds))
-      .orderBy(desc(securityEvents.createdAt));
  });

export const listAccountLocks = createServerFn({ method: "GET" }).handler(async () => {

- const sessionUserId = await getSessionUserId();
- const { unauthorized, forbidden } = await import("~/lib/server/errors");
- if (!sessionUserId) {
- throw unauthorized("User not authenticated");
- }
-
- const { PermissionService } = await import("~/features/roles/permission.service");
- const isGlobalAdmin = await PermissionService.isGlobalAdmin(sessionUserId);
- const { getDb } = await import("~/db/server-helpers");

* const { accountLocks } = await import("~/db/schema");
* const { desc } = await import("drizzle-orm");

- const { accountLocks, organizationMembers } = await import("~/db/schema");
- const { and, desc, eq, inArray } = await import("drizzle-orm");

  const db = await getDb();

* return db.select().from(accountLocks).orderBy(desc(accountLocks.lockedAt));

- if (isGlobalAdmin) {
- return db.select().from(accountLocks).orderBy(desc(accountLocks.lockedAt));
- }
-
- const { getRequest } = await import("@tanstack/react-start/server");
- const organizationId = getRequest().headers.get("x-organization-id");
- if (!organizationId) {
- throw forbidden("Organization context required");
- }
-
- const { requireOrganizationMembership, ORG_ADMIN_ROLES } = await import(
- "~/lib/auth/guards/org-guard"
- );
- await requireOrganizationMembership(
- { userId: sessionUserId, organizationId },
- { roles: ORG_ADMIN_ROLES },
- );
-
- const memberRows = await db
- .select({ userId: organizationMembers.userId })
- .from(organizationMembers)
- .where(
-      and(
-        eq(organizationMembers.organizationId, organizationId),
-        eq(organizationMembers.status, "active"),
-      ),
- );
- const memberUserIds = memberRows.map((row) => row.userId);
- if (memberUserIds.length === 0) return [];
-
- return db
- .select()
- .from(accountLocks)
- .where(inArray(accountLocks.userId, memberUserIds))
- .orderBy(desc(accountLocks.lockedAt));
  });

export const getAccountLockStatus = createServerFn({ method: "GET" })
.inputValidator(zod$(accountLockStatusSchema))
.handler(async ({ data }) => {

- const sessionUserId = await getSessionUserId();
- const { unauthorized, forbidden } = await import("~/lib/server/errors");
- if (!sessionUserId) {
-      throw unauthorized("User not authenticated");
- }
-
- if (data.userId !== sessionUserId) {
-      const { PermissionService } = await import("~/features/roles/permission.service");
-      const isGlobalAdmin = await PermissionService.isGlobalAdmin(sessionUserId);
-
-      if (!isGlobalAdmin) {
-        const { getRequest } = await import("@tanstack/react-start/server");
-        const organizationId = getRequest().headers.get("x-organization-id");
-        if (!organizationId) {
-          throw forbidden("Organization context required");
-        }
-
-        const { requireOrganizationMembership, ORG_ADMIN_ROLES } = await import(
-          "~/lib/auth/guards/org-guard"
-        );
-        await requireOrganizationMembership(
-          { userId: sessionUserId, organizationId },
-          { roles: ORG_ADMIN_ROLES },
-        );
-        await requireOrganizationMembership({ userId: data.userId, organizationId });
-      }
- }
-     const { isAccountLocked } = await import("~/lib/security/lockout");
      return isAccountLocked(data.userId);
  });

⸻

Issue 03 — Reporting mutations don’t enforce permissions (CRITICAL)

What this patch does
• createReportingCycle + createReportingTask:
• Require authenticated session
• Require global admin
• Require MFA enabled (consistent with other sensitive actions you already gate)
• updateReportingSubmission:
• Requires authenticated session
• Loads submission first, then enforces:
• Global admin: allowed
• Otherwise must be an active member of the submission’s org, with:
• owner/admin for review/admin statuses (under_review, changes_requested, approved, overdue)
• owner/admin/reporter for submitter statuses (not_started, in_progress, submitted)

Patch: src/features/reporting/reporting.mutations.ts

diff --git a/src/features/reporting/reporting.mutations.ts b/src/features/reporting/reporting.mutations.ts
--- a/src/features/reporting/reporting.mutations.ts
+++ b/src/features/reporting/reporting.mutations.ts
@@
import { createServerFn } from "@tanstack/react-start";
import { zod$ } from "~/lib/server/fn-utils";
import {
createReportingCycleSchema,
createReportingTaskSchema,
updateReportingSubmissionSchema,
} from "./reporting.schemas";

const getSessionUserId = async () => {
const { getAuth } = await import("~/lib/auth/server-helpers");
const { getRequest } = await import("@tanstack/react-start/server");
const auth = await getAuth();
const { headers } = getRequest();
const session = await auth.api.getSession({ headers });
return session?.user?.id ?? null;
};

+const requireSessionUserId = async () => {

- const userId = await getSessionUserId();
- const { unauthorized } = await import("~/lib/server/errors");
- if (!userId) {
- throw unauthorized("User not authenticated");
- }
- return userId;
  +};
- +const requireGlobalAdmin = async (userId: string) => {
- const { forbidden } = await import("~/lib/server/errors");
- const { PermissionService } = await import("~/features/roles/permission.service");
- const isAdmin = await PermissionService.isGlobalAdmin(userId);
- if (!isAdmin) {
- throw forbidden("Global admin access required");
- }
  +};
- export const createReportingCycle = createServerFn({ method: "POST" })
  .inputValidator(zod$(createReportingCycleSchema))
  .handler(async ({ data }) => {

* const actorUserId = (await getSessionUserId()) ?? "system";

- const actorUserId = await requireSessionUserId();
- await requireGlobalAdmin(actorUserId);
-
- const { requireMfaEnabled } = await import("~/lib/auth/guards/step-up");
- await requireMfaEnabled(actorUserId);
-      const { getDb } = await import("~/db/server-helpers");
       const { reportingCycles } = await import("~/db/schema");

       const db = await getDb();
       const [created] = await db

  @@
  export const createReportingTask = createServerFn({ method: "POST" })
  .inputValidator(zod$(createReportingTaskSchema))
  .handler(async ({ data }) => {

* const actorUserId = (await getSessionUserId()) ?? "system";

- const actorUserId = await requireSessionUserId();
- await requireGlobalAdmin(actorUserId);
-
- const { requireMfaEnabled } = await import("~/lib/auth/guards/step-up");
- await requireMfaEnabled(actorUserId);
-      const { getDb } = await import("~/db/server-helpers");
       const {
         notificationTemplates,
         organizationMembers,
         organizations,
         reportingSubmissions,
         reportingTasks,
       } = await import("~/db/schema");
       const { and, eq, inArray } = await import("drizzle-orm");
  @@
  export const updateReportingSubmission = createServerFn({ method: "POST" })
  .inputValidator(zod$(updateReportingSubmissionSchema))
  .handler(async ({ data }) => {

* const actorUserId = (await getSessionUserId()) ?? "system";

- const actorUserId = await requireSessionUserId();
  const { getDb } = await import("~/db/server-helpers");
  const { reportingSubmissionHistory, reportingSubmissions } = await import(
  "~/db/schema"
  );

* const { eq } = await import("drizzle-orm");

- const { eq } = await import("drizzle-orm");

  const db = await getDb();

-
- // Load submission first so we can enforce org-scoped authorization
- const [existing] = await db
-      .select({
-        id: reportingSubmissions.id,
-        organizationId: reportingSubmissions.organizationId,
-      })
-      .from(reportingSubmissions)
-      .where(eq(reportingSubmissions.id, data.submissionId))
-      .limit(1);
-
- if (!existing) {
-      return null;
- }
-
- const { PermissionService } = await import("~/features/roles/permission.service");
- const isGlobalAdmin = await PermissionService.isGlobalAdmin(actorUserId);
-
- if (!isGlobalAdmin) {
-      const { requireOrganizationMembership, ORG_ADMIN_ROLES } = await import(
-        "~/lib/auth/guards/org-guard"
-      );
-
-      const reviewStatuses = new Set([
-        "under_review",
-        "changes_requested",
-        "approved",
-        "rejected",
-      ]);
-      const adminOnlyStatuses = new Set(["overdue", ...reviewStatuses]);
-
-      if (adminOnlyStatuses.has(data.status)) {
-        await requireOrganizationMembership(
-          { userId: actorUserId, organizationId: existing.organizationId },
-          { roles: ORG_ADMIN_ROLES },
-        );
-      } else {
-        await requireOrganizationMembership(
-          { userId: actorUserId, organizationId: existing.organizationId },
-          { roles: ["owner", "admin", "reporter"] },
-        );
-      }
- }
-      const isReviewStatus = ["under_review", "changes_requested", "approved", "rejected"].includes(
         data.status,
       );
       const isSubmitStatus = data.status === "submitted";

       const [updated] = await db
         .update(reportingSubmissions)

  @@
  })
  .where(eq(reportingSubmissions.id, data.submissionId))
  .returning();

Note: rejected is still included in the mutation logic even though it isn’t in the reportingSubmissionStatusSchema. If you want this perfectly consistent, either (a) remove rejected from the sets above, or (b) add it to the enum/schema + DB enum. I left it to match your existing intent.

⸻

Issue 04 — Report exports ignore org scoping + hard-coded field access (CRITICAL)

What this patch does
• Enforces org-based row filtering for non-global users:
• Requires x-organization-id (or a verified filters.organizationId) to scope export
• Requires org membership
• Loads only rows for that org (for known sources)
• Replaces hard-coded role-name field access with a permission + org-role based ACL:
• Global admin OR permissions["*"] OR permissions["pii.read"] OR org role owner/admin → can see sensitive fields
• Otherwise sensitive fields are redacted ("\*\*\*")

Patch: src/features/reports/reports.mutations.ts

diff --git a/src/features/reports/reports.mutations.ts b/src/features/reports/reports.mutations.ts
--- a/src/features/reports/reports.mutations.ts
+++ b/src/features/reports/reports.mutations.ts
@@
import { createServerFn } from "@tanstack/react-start";
import { zod$ } from "~/lib/server/fn-utils";
import {
createSavedReportSchema,
deleteSavedReportSchema,
exportReportSchema,
updateSavedReportSchema,
} from "./reports.schemas";

-type FieldAccessPolicy = {

- field: string;
- requiredRoles: string[];
- redactForRoles?: string[];
  -};
- -const GLOBAL_ADMIN_ROLE_NAMES = ["Solstice Admin", "Quadball Canada Admin"];
  const SENSITIVE_FIELDS = [
  "email",
  "phone",
  "dateOfBirth",
  "emergencyContact",
  "emergencyContactPhone",
  "emergencyContactEmail",
  ];
  -const applyFieldAccess = (
- rows: Array<Record<string, unknown>>,
- userRoles: string[],
- policy: FieldAccessPolicy[],
  -) => {
- return rows.map((row) => {
- const next: Record<string, unknown> = {};
- for (const [key, value] of Object.entries(row)) {
-      const fieldPolicy = policy.find((entry) => entry.field === key);
-      if (!fieldPolicy) {
-        next[key] = value;
-        continue;
-      }
-
-      if (fieldPolicy.requiredRoles.length > 0) {
-        const hasRole = fieldPolicy.requiredRoles.some((role) => userRoles.includes(role));
-        if (!hasRole) continue;
-      }
-
-      if (fieldPolicy.redactForRoles?.some((role) => userRoles.includes(role))) {
-        next[key] = "***";
-        continue;
-      }
-
-      next[key] = value;
- }
- return next;
- });
  -};
- -const buildFieldPolicy = (rows: Array<Record<string, unknown>>): FieldAccessPolicy[] => {
- const fields = new Set<string>();
- rows.forEach((row) => {
- Object.keys(row).forEach((key) => fields.add(key));
- });
-
- return Array.from(fields).flatMap((field) => {
- if (SENSITIVE_FIELDS.includes(field)) {
-      return [{ field, requiredRoles: GLOBAL_ADMIN_ROLE_NAMES }];
- }
- return [];
- });
  -};
  +const extractPermissionSet = (

* roleAssignments: Array<{ role?: { permissions?: Record<string, boolean> } }>,
  +) => {
* const permissions = new Set<string>();
* for (const assignment of roleAssignments) {
* const perms = assignment.role?.permissions ?? {};
* for (const [key, value] of Object.entries(perms)) {
*      if (value) permissions.add(key);
* }
* }
* return permissions;
  +};
* +const canViewSensitiveFields = ({
* isGlobalAdmin,
* orgRole,
* permissions,
  +}: {
* isGlobalAdmin: boolean;
* orgRole: string | null;
* permissions: Set<string>;
  +}) => {
* if (isGlobalAdmin) return true;
* if (permissions.has("\*")) return true;
* if (permissions.has("pii.read") || permissions.has("pii:read") || permissions.has("data.pii.read")) {
* return true;
* }
*
* // Default: org owners/admins can view sensitive fields _within their org scope_
* if (orgRole && ["owner", "admin"].includes(orgRole)) return true;
*
* return false;
  +};
* +const applyFieldLevelAcl = (
* rows: Array<Record<string, unknown>>,
* opts: { canViewSensitiveFields: boolean },
  +) => {
* if (opts.canViewSensitiveFields) return rows;
* return rows.map((row) => {
* const next = { ...row };
* for (const field of SENSITIVE_FIELDS) {
*      if (Object.prototype.hasOwnProperty.call(next, field)) {
*        next[field] = "***";
*      }
* }
* return next;
* });
  +};

const getSessionUser = async () => {
const { getAuth } = await import("~/lib/auth/server-helpers");
const { getRequest } = await import("@tanstack/react-start/server");
const auth = await getAuth();
const { headers } = getRequest();
const session = await auth.api.getSession({ headers });
return session?.user ?? null;
};

-const loadReportData = async (dataSource: string) => {
+const loadReportData = async ({

- dataSource,
- organizationId,
- isGlobalAdmin,
  +}: {
- dataSource: string;
- organizationId: string | null;
- isGlobalAdmin: boolean;
  +}) => {
  const { getDb } = await import("~/db/server-helpers");
  const { organizations, reportingSubmissions, formSubmissions } = await import("~/db/schema");
- const { eq } = await import("drizzle-orm");

  const db = await getDb();
  if (dataSource === "organizations") {

* return db.select().from(organizations);

- if (isGlobalAdmin && !organizationId) return db.select().from(organizations);
- if (!organizationId) return [];
- return db.select().from(organizations).where(eq(organizations.id, organizationId));
  }

if (dataSource === "reporting_submissions") {

- return db.select().from(reportingSubmissions);

* if (isGlobalAdmin && !organizationId) return db.select().from(reportingSubmissions);
* if (!organizationId) return [];
* return db
*      .select()
*      .from(reportingSubmissions)
*      .where(eq(reportingSubmissions.organizationId, organizationId));

  }

  if (dataSource === "form_submissions") {

- return db.select().from(formSubmissions);

* if (isGlobalAdmin && !organizationId) return db.select().from(formSubmissions);
* if (!organizationId) return [];
* // Assumes formSubmissions has an organizationId column (common in this codebase).
* return db.select().from(formSubmissions).where(eq(formSubmissions.organizationId, organizationId));
  }

return [];
};
@@
export const exportReport = createServerFn({ method: "POST" })
.inputValidator(zod$(exportReportSchema))
.handler(async ({ data }) => {
const sessionUser = await getSessionUser();
if (!sessionUser?.id) return null;

     const { requireMfaEnabled } = await import("~/lib/auth/guards/step-up");
     await requireMfaEnabled(sessionUser.id);

     const { toCsv } = await import("~/shared/lib/csv");
     const { exportHistory } = await import("~/db/schema");
     const { getDb } = await import("~/db/server-helpers");
     const { PermissionService } = await import("~/features/roles/permission.service");
     const db = await getDb();

- const rows = await loadReportData(data.dataSource);
- const userRoleList = await PermissionService.getUserRoles(sessionUser.id);
- const userRoles = userRoleList.map((role) => role.role.name);
- const policy = buildFieldPolicy(rows as Array<Record<string, unknown>>);
- const filteredRows = applyFieldAccess(
-      rows as Array<Record<string, unknown>>,
-      userRoles,
-      policy,
- );

* const { forbidden } = await import("~/lib/server/errors");
* const isGlobalAdmin = await PermissionService.isGlobalAdmin(sessionUser.id);
*
* const { getRequest } = await import("@tanstack/react-start/server");
* const request = getRequest();
* const orgIdFromHeader = request.headers.get("x-organization-id");
* const orgIdFromFilters =
*      typeof (data.filters as any)?.organizationId === "string"
*        ? ((data.filters as any).organizationId as string)
*        : null;
* const scopedOrganizationId = orgIdFromHeader ?? orgIdFromFilters ?? null;
*
* let orgRole: string | null = null;
* if (!isGlobalAdmin) {
*      if (!scopedOrganizationId) {
*        throw forbidden("Organization context required");
*      }
*
*      const { requireOrganizationMembership } = await import("~/lib/auth/guards/org-guard");
*      const membership = await requireOrganizationMembership({
*        userId: sessionUser.id,
*        organizationId: scopedOrganizationId,
*      });
*      orgRole = membership.role;
* }
*
* const roleAssignments = await PermissionService.getUserRoles(sessionUser.id);
* const permissions = extractPermissionSet(roleAssignments as any);
* const canViewPii = canViewSensitiveFields({
*      isGlobalAdmin,
*      orgRole,
*      permissions,
* });
*
* const rows = await loadReportData({
*      dataSource: data.dataSource,
*      organizationId: scopedOrganizationId,
*      isGlobalAdmin,
* });
*
* const filteredRows = applyFieldLevelAcl(rows as Array<Record<string, unknown>>, {
*      canViewSensitiveFields: canViewPii,
* });

  const exportPayload =
  data.exportType === "csv" || data.exportType === "excel"
  ? toCsv(filteredRows)
  : JSON.stringify(filteredRows);

  await db.insert(exportHistory).values({
  userId: sessionUser.id,

-      organizationId: null,

*      organizationId: scopedOrganizationId,
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

-      metadata: { type: data.exportType, rows: filteredRows.length },

*      metadata: {
*        type: data.exportType,
*        rows: filteredRows.length,
*        organizationId: scopedOrganizationId,
*        dataSource: data.dataSource,
*      },

  });

  return { data: exportPayload };
  });

⸻

Operational notes you’ll want to align with the UI

These changes assume:
• The client sends x-organization-id for org-scoped admin views (audit/security/reports exports).
• If you already use the orgContextMiddleware, you’re likely already setting this header for org-context routes.

If you have any calls that don’t have org context (e.g., global admin dashboards), those still work because global admins are not required to provide the header.

⸻

Quick sanity checklist (what to test right away) 1. Audit logs
• Non-auth: 401/redirect behavior (depending on your error handling)
• Org admin with x-organization-id: can list/export only their org’s logs
• Non-admin org member: forbidden
• Global admin: can list/export everything (and optionally filter by org) 2. Security
• Regular user: can list their own events (by passing userId=sessionUserId)
• Org admin: can view another user’s events only when both are in same org context
• listAccountLocks: global admin sees all; org admin sees only locks of members in their org when header present 3. Reporting
• create cycle/task: only global admin + MFA-required users must have MFA enabled
• update submission:
• reporter can submit (submitted)
• org admin can review (under_review, approved, etc.)
• cross-org updates blocked 4. Report export
• Non-global user without x-organization-id: forbidden
• Non-global user with org header: only org rows exported
• Sensitive fields are redacted unless global admin / wildcard permission / org admin

⸻

If you want, paste the forms schema (src/db/schema/forms.schema.ts) and I can tighten the form_submissions scoping to be 100% correct (i.e., no assumptions about column names) and also extend row filtering to respect report filters safely without reintroducing tenant leaks.
