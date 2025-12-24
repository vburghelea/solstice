import { createServerFn } from "@tanstack/react-start";
import { zod$ } from "~/lib/server/fn-utils";
import {
  createReportingCycleSchema,
  createReportingTaskSchema,
  updateReportingSubmissionSchema,
} from "./reporting.schemas";

const getSession = async () => {
  const { getAuth } = await import("~/lib/auth/server-helpers");
  const { getRequest } = await import("@tanstack/react-start/server");
  const auth = await getAuth();
  const { headers } = getRequest();
  const session = await auth.api.getSession({ headers });
  return session ?? null;
};

const requireSession = async () => {
  const session = await getSession();
  const { unauthorized } = await import("~/lib/server/errors");
  if (!session?.user?.id) {
    throw unauthorized("User not authenticated");
  }
  return session;
};

const requireGlobalAdmin = async (userId: string) => {
  const { forbidden } = await import("~/lib/server/errors");
  const { PermissionService } = await import("~/features/roles/permission.service");
  const isAdmin = await PermissionService.isGlobalAdmin(userId);
  if (!isAdmin) {
    throw forbidden("Global admin access required");
  }
};

export const createReportingCycle = createServerFn({ method: "POST" })
  .inputValidator(zod$(createReportingCycleSchema))
  .handler(async ({ data }) => {
    const session = await requireSession();
    const actorUserId = session.user.id;
    await requireGlobalAdmin(actorUserId);

    const { requireRecentAuth } = await import("~/lib/auth/guards/step-up");
    await requireRecentAuth(actorUserId, session);

    const { getDb } = await import("~/db/server-helpers");
    const { reportingCycles } = await import("~/db/schema");

    const db = await getDb();
    const [created] = await db
      .insert(reportingCycles)
      .values({
        name: data.name,
        description: data.description ?? null,
        startDate: data.startDate,
        endDate: data.endDate,
        createdBy: actorUserId,
      })
      .returning();

    if (created) {
      const { logAdminAction } = await import("~/lib/audit");
      await logAdminAction({
        action: "REPORTING_CYCLE_CREATE",
        actorUserId,
        targetType: "reporting_cycle",
        targetId: created.id,
      });
    }

    return created ?? null;
  });

export const createReportingTask = createServerFn({ method: "POST" })
  .inputValidator(zod$(createReportingTaskSchema))
  .handler(async ({ data }) => {
    const session = await requireSession();
    const actorUserId = session.user.id;
    await requireGlobalAdmin(actorUserId);

    const { requireRecentAuth } = await import("~/lib/auth/guards/step-up");
    await requireRecentAuth(actorUserId, session);

    const { getDb } = await import("~/db/server-helpers");
    const {
      notificationTemplates,
      organizationMembers,
      organizations,
      reportingSubmissions,
      reportingTasks,
    } = await import("~/db/schema");
    const { and, eq, inArray } = await import("drizzle-orm");

    const db = await getDb();
    const [created] = await db
      .insert(reportingTasks)
      .values({
        cycleId: data.cycleId,
        formId: data.formId,
        organizationId: data.organizationId ?? null,
        organizationType: data.organizationType ?? null,
        title: data.title,
        description: data.description ?? null,
        dueDate: data.dueDate,
        reminderConfig: data.reminderConfig ?? {},
      })
      .returning();

    if (created) {
      const targetOrgs = data.organizationId
        ? await db
            .select({ id: organizations.id, name: organizations.name })
            .from(organizations)
            .where(eq(organizations.id, data.organizationId))
        : await db
            .select({ id: organizations.id, name: organizations.name })
            .from(organizations)
            .where(
              and(
                eq(organizations.status, "active"),
                ...(data.organizationType
                  ? [eq(organizations.type, data.organizationType)]
                  : []),
              ),
            );

      if (targetOrgs.length > 0) {
        const defaultStatus: (typeof reportingSubmissions.$inferInsert)["status"] =
          "not_started";
        await db.insert(reportingSubmissions).values(
          targetOrgs.map((org) => ({
            taskId: created.id,
            organizationId: org.id,
            status: defaultStatus,
          })),
        );
      }

      const templateKey = "reporting_reminder";
      const [template] = await db
        .select()
        .from(notificationTemplates)
        .where(eq(notificationTemplates.key, templateKey))
        .limit(1);

      if (!template) {
        await db.insert(notificationTemplates).values({
          key: templateKey,
          category: "reporting",
          subject: "Reporting reminder: {{title}} due {{dueDate}}",
          bodyTemplate:
            'Your reporting task "{{title}}" for {{orgName}} is due on {{dueDate}}.',
          isSystem: true,
          createdBy: actorUserId,
        });
      }

      const reminderConfig = data.reminderConfig ?? {};
      const daysBeforeRaw = Array.isArray(reminderConfig["days_before"])
        ? reminderConfig["days_before"]
        : Array.isArray(reminderConfig["daysBefore"])
          ? reminderConfig["daysBefore"]
          : [14, 7, 3, 1];
      const daysBefore = daysBeforeRaw
        .map((value) => Number(value))
        .filter((value) => !Number.isNaN(value));
      const dueDate = new Date(data.dueDate);

      const { scheduleNotification } = await import("~/lib/notifications/scheduler");
      const notifyRoles: Array<"owner" | "admin" | "reporter"> = [
        "owner",
        "admin",
        "reporter",
      ];

      for (const org of targetOrgs) {
        const members = await db
          .select({
            userId: organizationMembers.userId,
            role: organizationMembers.role,
          })
          .from(organizationMembers)
          .where(
            and(
              eq(organizationMembers.organizationId, org.id),
              eq(organizationMembers.status, "active"),
              inArray(organizationMembers.role, notifyRoles),
            ),
          );

        for (const member of members) {
          for (const offset of daysBefore) {
            const scheduledFor = new Date(
              dueDate.getTime() - Number(offset) * 24 * 60 * 60 * 1000,
            );
            if (scheduledFor <= new Date()) continue;

            await scheduleNotification({
              templateKey,
              userId: member.userId,
              organizationId: org.id,
              scheduledFor,
              variables: {
                title: data.title,
                dueDate: dueDate.toDateString(),
                orgName: org.name,
              },
            });
          }
        }
      }

      const { logAdminAction } = await import("~/lib/audit");
      await logAdminAction({
        action: "REPORTING_TASK_CREATE",
        actorUserId,
        targetType: "reporting_task",
        targetId: created.id,
      });
    }

    return created ?? null;
  });

export const updateReportingSubmission = createServerFn({ method: "POST" })
  .inputValidator(zod$(updateReportingSubmissionSchema))
  .handler(async ({ data }) => {
    const session = await requireSession();
    const actorUserId = session.user.id;
    const { getDb } = await import("~/db/server-helpers");
    const { reportingSubmissionHistory, reportingSubmissions } =
      await import("~/db/schema");
    const { eq } = await import("drizzle-orm");

    const db = await getDb();

    // Load submission first so we can enforce org-scoped authorization
    const [existing] = await db
      .select({
        id: reportingSubmissions.id,
        organizationId: reportingSubmissions.organizationId,
      })
      .from(reportingSubmissions)
      .where(eq(reportingSubmissions.id, data.submissionId))
      .limit(1);

    if (!existing) {
      return null;
    }

    const { PermissionService } = await import("~/features/roles/permission.service");
    const isGlobalAdmin = await PermissionService.isGlobalAdmin(actorUserId);

    if (!isGlobalAdmin) {
      const { requireOrganizationMembership, ORG_ADMIN_ROLES } =
        await import("~/lib/auth/guards/org-guard");

      const reviewStatuses = new Set([
        "under_review",
        "changes_requested",
        "approved",
        "rejected",
      ]);
      const adminOnlyStatuses = new Set(["overdue", ...reviewStatuses]);

      if (adminOnlyStatuses.has(data.status)) {
        await requireOrganizationMembership(
          { userId: actorUserId, organizationId: existing.organizationId },
          { roles: ORG_ADMIN_ROLES },
        );
      } else {
        await requireOrganizationMembership(
          { userId: actorUserId, organizationId: existing.organizationId },
          { roles: ["owner", "admin", "reporter"] },
        );
      }
    }

    const isReviewStatus = [
      "under_review",
      "changes_requested",
      "approved",
      "rejected",
    ].includes(data.status);
    const isSubmitStatus = data.status === "submitted";

    const [updated] = await db
      .update(reportingSubmissions)
      .set({
        status: data.status,
        ...(isSubmitStatus ? { submittedAt: new Date(), submittedBy: actorUserId } : {}),
        ...(isReviewStatus
          ? {
              reviewedBy: actorUserId,
              reviewedAt: new Date(),
              reviewNotes: data.reviewNotes ?? null,
            }
          : {}),
        ...(data.formSubmissionId ? { formSubmissionId: data.formSubmissionId } : {}),
      })
      .where(eq(reportingSubmissions.id, data.submissionId))
      .returning();

    if (!updated) {
      return null;
    }

    await db.insert(reportingSubmissionHistory).values({
      reportingSubmissionId: updated.id,
      action: data.status,
      actorId: actorUserId,
      notes: data.reviewNotes ?? null,
      formSubmissionVersionId: data.formSubmissionVersionId ?? null,
    });

    const { logDataChange } = await import("~/lib/audit");
    await logDataChange({
      action: "REPORTING_SUBMISSION_UPDATE",
      actorUserId,
      targetType: "reporting_submission",
      targetId: updated.id,
      targetOrgId: updated.organizationId,
    });

    return updated;
  });
