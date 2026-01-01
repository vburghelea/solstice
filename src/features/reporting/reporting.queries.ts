import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getAuthMiddleware, requireUser } from "~/lib/server/auth";
import { zod$ } from "~/lib/server/fn-utils";
import { assertFeatureEnabled } from "~/tenant/feature-gates";
import { reportingSubmissionStatusSchema } from "./reporting.schemas";

const resolveAccessibleOrgScope = async (userId: string) => {
  const { listAccessibleOrganizationsForUser } =
    await import("~/features/organizations/organizations.access");
  const accessibleOrganizations = await listAccessibleOrganizationsForUser(userId);
  const orgIds = accessibleOrganizations.map((org) => org.id);
  const orgTypes = [
    ...new Set(accessibleOrganizations.map((org) => org.type).filter(Boolean)),
  ];
  return { orgIds, orgTypes };
};

const listReportingTasksSchema = z
  .object({
    cycleId: z.uuid().optional(),
    organizationId: z.uuid().optional(),
  })
  .nullish()
  .transform((value) => value ?? {});

const listReportingOverviewSchema = z
  .object({
    organizationId: z.uuid().optional(),
    status: reportingSubmissionStatusSchema.optional(),
  })
  .nullish()
  .transform((value) => value ?? {});

const listReportingSubmissionHistorySchema = z.object({
  submissionId: z.uuid(),
});

export const listReportingCycles = createServerFn({ method: "GET" })
  .middleware(getAuthMiddleware())
  .handler(async ({ context }) => {
    await assertFeatureEnabled("sin_reporting");
    const user = requireUser(context);

    const { PermissionService } = await import("~/features/roles/permission.service");
    const isAdmin = await PermissionService.isGlobalAdmin(user.id);
    const { getDb } = await import("~/db/server-helpers");
    const { reportingCycles, reportingTasks } = await import("~/db/schema");
    const { and, desc, inArray, isNull, or } = await import("drizzle-orm");

    const db = await getDb();
    if (isAdmin) {
      return db.select().from(reportingCycles).orderBy(desc(reportingCycles.createdAt));
    }

    const { orgIds, orgTypes } = await resolveAccessibleOrgScope(user.id);
    const taskConditions = [];
    if (orgIds.length > 0) {
      taskConditions.push(inArray(reportingTasks.organizationId, orgIds));
    }
    if (orgTypes.length > 0) {
      taskConditions.push(
        and(
          isNull(reportingTasks.organizationId),
          inArray(reportingTasks.organizationType, orgTypes),
        ),
      );
    }

    if (taskConditions.length === 0) {
      return [];
    }

    const tasks = await db
      .select({ cycleId: reportingTasks.cycleId })
      .from(reportingTasks)
      .where(taskConditions.length === 1 ? taskConditions[0] : or(...taskConditions));

    const cycleIds = [...new Set(tasks.map((task) => task.cycleId))];
    if (cycleIds.length === 0) {
      return [];
    }

    return db
      .select()
      .from(reportingCycles)
      .where(inArray(reportingCycles.id, cycleIds))
      .orderBy(desc(reportingCycles.createdAt));
  });

export const listReportingTasks = createServerFn({ method: "GET" })
  .middleware(getAuthMiddleware())
  .inputValidator(zod$(listReportingTasksSchema))
  .handler(async ({ data, context }) => {
    await assertFeatureEnabled("sin_reporting");
    const user = requireUser(context);
    const { getDb } = await import("~/db/server-helpers");
    const { reportingTasks } = await import("~/db/schema");
    const { and, eq, inArray, isNull, or } = await import("drizzle-orm");
    const { PermissionService } = await import("~/features/roles/permission.service");

    const db = await getDb();
    const conditions = [];
    const isAdmin = await PermissionService.isGlobalAdmin(user.id);

    if (data.cycleId) {
      conditions.push(eq(reportingTasks.cycleId, data.cycleId));
    }

    if (data.organizationId) {
      const { requireOrganizationAccess } = await import("~/lib/auth/guards/org-guard");
      await requireOrganizationAccess({
        userId: user.id,
        organizationId: data.organizationId,
      });
      conditions.push(eq(reportingTasks.organizationId, data.organizationId));
    } else if (!isAdmin) {
      const { orgIds, orgTypes } = await resolveAccessibleOrgScope(user.id);
      const orgConditions = [];
      if (orgIds.length > 0) {
        orgConditions.push(inArray(reportingTasks.organizationId, orgIds));
      }
      if (orgTypes.length > 0) {
        orgConditions.push(
          and(
            isNull(reportingTasks.organizationId),
            inArray(reportingTasks.organizationType, orgTypes),
          ),
        );
      }
      if (orgConditions.length === 0) {
        return [];
      }
      conditions.push(
        orgConditions.length === 1 ? orgConditions[0] : or(...orgConditions),
      );
    }

    return db
      .select()
      .from(reportingTasks)
      .where(conditions.length ? and(...conditions) : undefined);
  });

export const listReportingSubmissions = createServerFn({ method: "GET" })
  .middleware(getAuthMiddleware())
  .inputValidator(
    zod$(
      z.object({
        organizationId: z.uuid(),
      }),
    ),
  )
  .handler(async ({ data, context }) => {
    await assertFeatureEnabled("sin_reporting");
    const user = requireUser(context);
    const { getDb } = await import("~/db/server-helpers");
    const { reportingSubmissions } = await import("~/db/schema");
    const { eq } = await import("drizzle-orm");

    const { requireOrganizationAccess } = await import("~/lib/auth/guards/org-guard");
    await requireOrganizationAccess({
      userId: user.id,
      organizationId: data.organizationId,
    });

    const db = await getDb();
    return db
      .select()
      .from(reportingSubmissions)
      .where(eq(reportingSubmissions.organizationId, data.organizationId));
  });

export const listReportingOverview = createServerFn({ method: "GET" })
  .middleware(getAuthMiddleware())
  .inputValidator(zod$(listReportingOverviewSchema))
  .handler(async ({ data, context }) => {
    await assertFeatureEnabled("sin_reporting");
    const user = requireUser(context);

    const { getDb } = await import("~/db/server-helpers");
    const { organizations, reportingCycles, reportingSubmissions, reportingTasks } =
      await import("~/db/schema");
    const { and, asc, eq, inArray } = await import("drizzle-orm");
    const db = await getDb();

    let orgIds: string[] = [];
    const { PermissionService } = await import("~/features/roles/permission.service");
    const isAdmin = await PermissionService.isGlobalAdmin(user.id);

    if (data.organizationId) {
      const { requireOrganizationAccess } = await import("~/lib/auth/guards/org-guard");
      await requireOrganizationAccess({
        userId: user.id,
        organizationId: data.organizationId,
      });
      orgIds = [data.organizationId];
    } else if (!isAdmin) {
      const { orgIds: accessibleOrgIds } = await resolveAccessibleOrgScope(user.id);
      orgIds = accessibleOrgIds;
      if (orgIds.length === 0) return [];
    }

    const conditions = [];
    if (orgIds.length > 0) {
      conditions.push(inArray(reportingSubmissions.organizationId, orgIds));
    }
    if (data.status) {
      conditions.push(eq(reportingSubmissions.status, data.status));
    }

    return db
      .select({
        submissionId: reportingSubmissions.id,
        status: reportingSubmissions.status,
        submittedAt: reportingSubmissions.submittedAt,
        dueDate: reportingTasks.dueDate,
        taskTitle: reportingTasks.title,
        taskId: reportingTasks.id,
        cycleId: reportingCycles.id,
        cycleName: reportingCycles.name,
        organizationId: organizations.id,
        organizationName: organizations.name,
        formId: reportingTasks.formId,
        formSubmissionId: reportingSubmissions.formSubmissionId,
      })
      .from(reportingSubmissions)
      .innerJoin(reportingTasks, eq(reportingSubmissions.taskId, reportingTasks.id))
      .innerJoin(reportingCycles, eq(reportingTasks.cycleId, reportingCycles.id))
      .innerJoin(organizations, eq(reportingSubmissions.organizationId, organizations.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(asc(reportingTasks.dueDate), asc(organizations.name));
  });

export const listReportingSubmissionHistory = createServerFn({ method: "GET" })
  .middleware(getAuthMiddleware())
  .inputValidator(zod$(listReportingSubmissionHistorySchema))
  .handler(async ({ data, context }) => {
    await assertFeatureEnabled("sin_reporting");
    const user = requireUser(context);

    const { getDb } = await import("~/db/server-helpers");
    const { reportingSubmissionHistory, reportingSubmissions } =
      await import("~/db/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();

    const [submission] = await db
      .select({
        organizationId: reportingSubmissions.organizationId,
      })
      .from(reportingSubmissions)
      .where(eq(reportingSubmissions.id, data.submissionId))
      .limit(1);

    if (!submission) return [];

    const { requireOrganizationAccess } = await import("~/lib/auth/guards/org-guard");
    await requireOrganizationAccess({
      userId: user.id,
      organizationId: submission.organizationId,
    });

    return db
      .select()
      .from(reportingSubmissionHistory)
      .where(eq(reportingSubmissionHistory.reportingSubmissionId, data.submissionId));
  });
