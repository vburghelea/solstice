import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { zod$ } from "~/lib/server/fn-utils";
import { assertFeatureEnabled } from "~/tenant/feature-gates";
import { reportingSubmissionStatusSchema } from "./reporting.schemas";

const getSessionUserId = async () => {
  const { getAuth } = await import("~/lib/auth/server-helpers");
  const { getRequest } = await import("@tanstack/react-start/server");
  const auth = await getAuth();
  const { headers } = getRequest();
  const session = await auth.api.getSession({ headers });
  return session?.user?.id ?? null;
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

export const listReportingCycles = createServerFn({ method: "GET" }).handler(async () => {
  await assertFeatureEnabled("sin_reporting");
  const { getDb } = await import("~/db/server-helpers");
  const { reportingCycles } = await import("~/db/schema");
  const { desc } = await import("drizzle-orm");

  const db = await getDb();
  return db.select().from(reportingCycles).orderBy(desc(reportingCycles.createdAt));
});

export const listReportingTasks = createServerFn({ method: "GET" })
  .inputValidator(zod$(listReportingTasksSchema))
  .handler(async ({ data }) => {
    await assertFeatureEnabled("sin_reporting");
    const { getDb } = await import("~/db/server-helpers");
    const { reportingTasks } = await import("~/db/schema");
    const { and, eq } = await import("drizzle-orm");

    const db = await getDb();
    const conditions = [];

    if (data.cycleId) {
      conditions.push(eq(reportingTasks.cycleId, data.cycleId));
    }

    if (data.organizationId) {
      const userId = await getSessionUserId();
      if (userId) {
        const { requireOrganizationAccess } = await import("~/lib/auth/guards/org-guard");
        await requireOrganizationAccess({
          userId,
          organizationId: data.organizationId,
        });
      }
      conditions.push(eq(reportingTasks.organizationId, data.organizationId));
    }

    return db
      .select()
      .from(reportingTasks)
      .where(conditions.length ? and(...conditions) : undefined);
  });

export const listReportingSubmissions = createServerFn({ method: "GET" })
  .inputValidator(
    zod$(
      z.object({
        organizationId: z.uuid(),
      }),
    ),
  )
  .handler(async ({ data }) => {
    await assertFeatureEnabled("sin_reporting");
    const { getDb } = await import("~/db/server-helpers");
    const { reportingSubmissions } = await import("~/db/schema");
    const { eq } = await import("drizzle-orm");

    const userId = await getSessionUserId();
    if (userId) {
      const { requireOrganizationAccess } = await import("~/lib/auth/guards/org-guard");
      await requireOrganizationAccess({
        userId,
        organizationId: data.organizationId,
      });
    }

    const db = await getDb();
    return db
      .select()
      .from(reportingSubmissions)
      .where(eq(reportingSubmissions.organizationId, data.organizationId));
  });

export const listReportingOverview = createServerFn({ method: "GET" })
  .inputValidator(zod$(listReportingOverviewSchema))
  .handler(async ({ data }) => {
    await assertFeatureEnabled("sin_reporting");
    const userId = await getSessionUserId();
    if (!userId) return [];

    const { getDb } = await import("~/db/server-helpers");
    const {
      organizationMembers,
      organizations,
      reportingCycles,
      reportingSubmissions,
      reportingTasks,
    } = await import("~/db/schema");
    const { and, eq, inArray } = await import("drizzle-orm");
    const db = await getDb();

    let orgIds: string[] = [];
    const { PermissionService } = await import("~/features/roles/permission.service");
    const isAdmin = await PermissionService.isGlobalAdmin(userId);

    if (data.organizationId) {
      const { requireOrganizationAccess } = await import("~/lib/auth/guards/org-guard");
      await requireOrganizationAccess({
        userId,
        organizationId: data.organizationId,
      });
      orgIds = [data.organizationId];
    } else if (!isAdmin) {
      const memberships = await db
        .select({ organizationId: organizationMembers.organizationId })
        .from(organizationMembers)
        .where(
          and(
            eq(organizationMembers.userId, userId),
            eq(organizationMembers.status, "active"),
          ),
        );

      orgIds = memberships.map((membership) => membership.organizationId);
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
      .where(conditions.length ? and(...conditions) : undefined);
  });

export const listReportingSubmissionHistory = createServerFn({ method: "GET" })
  .inputValidator(zod$(listReportingSubmissionHistorySchema))
  .handler(async ({ data }) => {
    await assertFeatureEnabled("sin_reporting");
    const userId = await getSessionUserId();
    if (!userId) return [];

    const { getDb } = await import("~/db/server-helpers");
    const { organizationMembers, reportingSubmissionHistory, reportingSubmissions } =
      await import("~/db/schema");
    const { and, eq } = await import("drizzle-orm");
    const db = await getDb();

    const [submission] = await db
      .select({
        organizationId: reportingSubmissions.organizationId,
      })
      .from(reportingSubmissions)
      .where(eq(reportingSubmissions.id, data.submissionId))
      .limit(1);

    if (!submission) return [];

    const { PermissionService } = await import("~/features/roles/permission.service");
    const isAdmin = await PermissionService.isGlobalAdmin(userId);
    if (!isAdmin) {
      const [membership] = await db
        .select()
        .from(organizationMembers)
        .where(
          and(
            eq(organizationMembers.userId, userId),
            eq(organizationMembers.organizationId, submission.organizationId),
          ),
        )
        .limit(1);
      if (!membership) return [];
    }

    return db
      .select()
      .from(reportingSubmissionHistory)
      .where(eq(reportingSubmissionHistory.reportingSubmissionId, data.submissionId));
  });
