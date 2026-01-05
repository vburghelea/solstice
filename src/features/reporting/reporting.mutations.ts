import { createServerFn } from "@tanstack/react-start";
import { zod$ } from "~/lib/server/fn-utils";
import type { JsonRecord } from "~/shared/lib/json";
import { assertFeatureEnabled } from "~/tenant/feature-gates";
import {
  createReportingCycleSchema,
  createReportingTaskSchema,
  updateReportingMetadataSchema,
  updateReportingSubmissionSchema,
} from "./reporting.schemas";
import type { ReportingMetadata } from "./reporting.schemas";

const MAX_REMINDER_DAYS = 365;
const REVIEW_STATUSES = new Set([
  "under_review",
  "changes_requested",
  "approved",
  "rejected",
]);
const SUBMITTED_STATUSES = new Set(["submitted", ...REVIEW_STATUSES]);
const VALID_TRANSITIONS: Record<string, string[]> = {
  not_started: ["in_progress", "overdue"],
  in_progress: ["submitted", "overdue"],
  overdue: ["in_progress", "submitted"],
  submitted: ["under_review"],
  under_review: ["approved", "changes_requested", "rejected"],
  changes_requested: ["in_progress", "submitted"],
  approved: [],
  rejected: [],
};

const normalizeReportingMetadata = (metadata: ReportingMetadata) => ({
  fiscalYearStart: metadata.fiscalYearStart?.trim() || null,
  fiscalYearEnd: metadata.fiscalYearEnd?.trim() || null,
  reportingPeriodStart: metadata.reportingPeriodStart?.trim() || null,
  reportingPeriodEnd: metadata.reportingPeriodEnd?.trim() || null,
  agreementId: metadata.agreementId?.trim() || null,
  agreementName: metadata.agreementName?.trim() || null,
  agreementStart: metadata.agreementStart?.trim() || null,
  agreementEnd: metadata.agreementEnd?.trim() || null,
  nccpStatus: metadata.nccpStatus?.trim() || null,
  nccpNumber: metadata.nccpNumber?.trim() || null,
  primaryContactName: metadata.primaryContactName?.trim() || null,
  primaryContactEmail: metadata.primaryContactEmail?.trim() || null,
  primaryContactPhone: metadata.primaryContactPhone?.trim() || null,
  reportingFrequency: metadata.reportingFrequency?.trim() || null,
});

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
    await assertFeatureEnabled("sin_admin_reporting");
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
    await assertFeatureEnabled("sin_admin_reporting");
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

    const reminderConfig = data.reminderConfig ?? {};
    const daysBeforeRaw = Array.isArray(reminderConfig["days_before"])
      ? reminderConfig["days_before"]
      : Array.isArray(reminderConfig["daysBefore"])
        ? reminderConfig["daysBefore"]
        : [14, 7, 3, 1];
    const daysBefore = Array.from(
      new Set(
        daysBeforeRaw
          .map((value) => Number(value))
          .filter((value) => Number.isFinite(value))
          .map((value) => Math.trunc(value))
          .filter((value) => value > 0 && value <= MAX_REMINDER_DAYS),
      ),
    ).sort((left, right) => right - left);
    const normalizedReminderConfig: Record<string, unknown> = {
      ...(reminderConfig as Record<string, unknown>),
      days_before: daysBefore,
    };
    delete normalizedReminderConfig["daysBefore"];

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
        reminderConfig: normalizedReminderConfig as Record<string, unknown> as JsonRecord,
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

    const { invalidatePivotCache } = await import("~/features/bi/cache/pivot-cache");
    await invalidatePivotCache("reporting_submissions");

    return created ?? null;
  });

export const updateReportingMetadata = createServerFn({ method: "POST" })
  .inputValidator(zod$(updateReportingMetadataSchema))
  .handler(async ({ data }) => {
    await assertFeatureEnabled("sin_reporting");
    const session = await requireSession();
    const actorUserId = session.user.id;

    const { requireOrganizationAccess, ORG_ADMIN_ROLES } =
      await import("~/lib/auth/guards/org-guard");
    await requireOrganizationAccess(
      { userId: actorUserId, organizationId: data.organizationId },
      { roles: ORG_ADMIN_ROLES },
    );

    const { getDb } = await import("~/db/server-helpers");
    const { organizations } = await import("~/db/schema");
    const { eq } = await import("drizzle-orm");
    const { notFound } = await import("~/lib/server/errors");

    const db = await getDb();
    const [existing] = await db
      .select({
        id: organizations.id,
        metadata: organizations.metadata,
      })
      .from(organizations)
      .where(eq(organizations.id, data.organizationId))
      .limit(1);

    if (!existing) {
      throw notFound("Organization not found");
    }

    const existingMetadata =
      typeof existing.metadata === "object" && existing.metadata
        ? (existing.metadata as JsonRecord)
        : {};
    const existingReporting =
      typeof existingMetadata["reporting"] === "object" && existingMetadata["reporting"]
        ? (existingMetadata["reporting"] as JsonRecord)
        : {};

    const normalized = normalizeReportingMetadata(data.metadata);
    const nextMetadata = {
      ...existingMetadata,
      reporting: {
        ...existingReporting,
        ...normalized,
      },
    } satisfies JsonRecord;

    const [updated] = await db
      .update(organizations)
      .set({ metadata: nextMetadata })
      .where(eq(organizations.id, data.organizationId))
      .returning();

    if (updated) {
      const { logDataChange } = await import("~/lib/audit");
      await logDataChange({
        action: "ORG_REPORTING_METADATA_UPDATE",
        actorUserId,
        targetType: "organization",
        targetId: updated.id,
        targetOrgId: updated.id,
        metadata: { organizationId: updated.id },
      });
    }

    return normalized;
  });

export const updateReportingSubmission = createServerFn({ method: "POST" })
  .inputValidator(zod$(updateReportingSubmissionSchema))
  .handler(async ({ data }) => {
    await assertFeatureEnabled("sin_admin_reporting");
    const session = await requireSession();
    const actorUserId = session.user.id;
    const { getDb } = await import("~/db/server-helpers");
    const {
      formSubmissionVersions,
      formSubmissions,
      reportingSubmissionHistory,
      reportingSubmissions,
      reportingTasks,
    } = await import("~/db/schema");
    const { eq } = await import("drizzle-orm");
    const { badRequest } = await import("~/lib/server/errors");

    const db = await getDb();

    // Load submission first so we can enforce org-scoped authorization
    const [existing] = await db
      .select({
        id: reportingSubmissions.id,
        organizationId: reportingSubmissions.organizationId,
        status: reportingSubmissions.status,
        submittedAt: reportingSubmissions.submittedAt,
        submittedBy: reportingSubmissions.submittedBy,
        reviewedAt: reportingSubmissions.reviewedAt,
        reviewedBy: reportingSubmissions.reviewedBy,
        reviewNotes: reportingSubmissions.reviewNotes,
        formSubmissionId: reportingSubmissions.formSubmissionId,
        formId: reportingTasks.formId,
      })
      .from(reportingSubmissions)
      .innerJoin(reportingTasks, eq(reportingSubmissions.taskId, reportingTasks.id))
      .where(eq(reportingSubmissions.id, data.submissionId))
      .limit(1);

    if (!existing) {
      return null;
    }

    const { PermissionService } = await import("~/features/roles/permission.service");
    const isGlobalAdmin = await PermissionService.isGlobalAdmin(actorUserId);

    if (!isGlobalAdmin) {
      const { requireOrganizationAccess, ORG_ADMIN_ROLES } =
        await import("~/lib/auth/guards/org-guard");

      const adminOnlyStatuses = new Set(["overdue", ...REVIEW_STATUSES]);

      if (adminOnlyStatuses.has(data.status)) {
        await requireOrganizationAccess(
          { userId: actorUserId, organizationId: existing.organizationId },
          { roles: ORG_ADMIN_ROLES },
        );
      } else {
        await requireOrganizationAccess(
          { userId: actorUserId, organizationId: existing.organizationId },
          { roles: ["owner", "admin", "reporter"] },
        );
      }
    }

    const isStatusChange = existing.status !== data.status;
    if (isStatusChange) {
      const allowedNext = VALID_TRANSITIONS[existing.status] ?? [];
      if (!allowedNext.includes(data.status)) {
        throw badRequest(
          `Cannot transition from "${existing.status}" to "${data.status}"`,
        );
      }
    }

    if (data.status === "rejected" && isStatusChange && !data.reviewNotes?.trim()) {
      throw badRequest("Rejection reason is required");
    }

    if (data.formSubmissionId) {
      const [submission] = await db
        .select({
          id: formSubmissions.id,
          formId: formSubmissions.formId,
          organizationId: formSubmissions.organizationId,
        })
        .from(formSubmissions)
        .where(eq(formSubmissions.id, data.formSubmissionId))
        .limit(1);

      if (!submission) {
        throw badRequest("Form submission not found");
      }

      if (submission.formId !== existing.formId) {
        throw badRequest("Form submission does not match reporting task form");
      }

      if (submission.organizationId !== existing.organizationId) {
        throw badRequest("Form submission does not belong to submission organization");
      }
    }

    if (data.formSubmissionVersionId) {
      const linkedSubmissionId = data.formSubmissionId ?? existing.formSubmissionId;
      if (!linkedSubmissionId) {
        throw badRequest("Form submission is required for submission version links");
      }

      const [version] = await db
        .select({
          id: formSubmissionVersions.id,
          submissionId: formSubmissionVersions.submissionId,
        })
        .from(formSubmissionVersions)
        .where(eq(formSubmissionVersions.id, data.formSubmissionVersionId))
        .limit(1);

      if (!version) {
        throw badRequest("Form submission version not found");
      }

      if (version.submissionId !== linkedSubmissionId) {
        throw badRequest(
          "Submission version does not belong to the linked form submission",
        );
      }
    }

    const isReviewStatus = REVIEW_STATUSES.has(data.status);
    const shouldKeepSubmitted = SUBMITTED_STATUSES.has(data.status);

    const updates: Record<string, unknown> = {
      status: data.status,
      ...(data.formSubmissionId ? { formSubmissionId: data.formSubmissionId } : {}),
    };

    if (isStatusChange) {
      if (data.status === "submitted") {
        updates["submittedAt"] = new Date();
        updates["submittedBy"] = actorUserId;
      }

      if (!shouldKeepSubmitted) {
        updates["submittedAt"] = null;
        updates["submittedBy"] = null;
      }

      if (isReviewStatus) {
        updates["reviewedBy"] = actorUserId;
        updates["reviewedAt"] = new Date();
        updates["reviewNotes"] = data.reviewNotes ?? null;
      } else {
        updates["reviewedBy"] = null;
        updates["reviewedAt"] = null;
        updates["reviewNotes"] = null;
      }
    } else if (isReviewStatus && data.reviewNotes !== undefined) {
      updates["reviewedBy"] = actorUserId;
      updates["reviewedAt"] = new Date();
      updates["reviewNotes"] = data.reviewNotes ?? null;
    }

    const [updated] = await db
      .update(reportingSubmissions)
      .set(updates)
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

    const { invalidatePivotCache } = await import("~/features/bi/cache/pivot-cache");
    await invalidatePivotCache("reporting_submissions");

    return updated;
  });
