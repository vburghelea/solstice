import { createServerOnlyFn } from "@tanstack/react-start";
import type { JsonRecord } from "~/shared/lib/json";
import { enqueueNotification } from "./queue";

type OrganizationMemberRole = "owner" | "admin" | "reporter" | "viewer" | "member";

const ORGANIZATION_MEMBER_ROLES: OrganizationMemberRole[] = [
  "owner",
  "admin",
  "reporter",
  "viewer",
  "member",
];

const applyTemplate = (template: string, variables: JsonRecord) =>
  template.replace(/{{\s*([^}]+)\s*}}/g, (_match, key) => {
    const value = variables[key.trim()];
    return value === undefined || value === null ? "" : String(value);
  });

const parseRoleFilter = (roleFilter?: string | null) =>
  (roleFilter ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

const buildStableNotificationId = async (jobId: string, userId: string) => {
  const { createHash } = await import("crypto");
  const hash = createHash("sha256").update(`${jobId}:${userId}`).digest("hex");
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(
    12,
    16,
  )}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
};

export const scheduleNotification = createServerOnlyFn(
  async (params: {
    templateKey: string;
    userId?: string | null;
    organizationId?: string | null;
    roleFilter?: string | null;
    scheduledFor: Date;
    variables?: JsonRecord;
  }) => {
    const { getDb } = await import("~/db/server-helpers");
    const { scheduledNotifications } = await import("~/db/schema");
    const db = await getDb();

    const [created] = await db
      .insert(scheduledNotifications)
      .values({
        templateKey: params.templateKey,
        userId: params.userId ?? null,
        organizationId: params.organizationId ?? null,
        roleFilter: params.roleFilter ?? null,
        scheduledFor: params.scheduledFor,
        variables: params.variables ?? {},
      })
      .returning();

    return created ?? null;
  },
);

export const processScheduledNotifications = createServerOnlyFn(async () => {
  const { getDb } = await import("~/db/server-helpers");
  const { notificationTemplates, organizationMembers, scheduledNotifications } =
    await import("~/db/schema");
  const { and, eq, inArray, isNull, lte } = await import("drizzle-orm");

  const db = await getDb();
  const now = new Date();

  const pending = await db
    .select()
    .from(scheduledNotifications)
    .where(
      and(
        isNull(scheduledNotifications.sentAt),
        isNull(scheduledNotifications.failedAt),
        lte(scheduledNotifications.scheduledFor, now),
      ),
    )
    .limit(100);

  for (const job of pending) {
    try {
      const [template] = await db
        .select()
        .from(notificationTemplates)
        .where(eq(notificationTemplates.key, job.templateKey))
        .limit(1);

      if (!template) {
        throw new Error("Template not found");
      }

      const roleFilters = parseRoleFilter(job.roleFilter).filter(
        (role): role is OrganizationMemberRole =>
          ORGANIZATION_MEMBER_ROLES.includes(role as OrganizationMemberRole),
      );

      if (!job.userId && !job.organizationId && roleFilters.length === 0) {
        throw new Error(
          "Scheduled notifications without userId require an organization or role.",
        );
      }

      const recipients = job.userId
        ? [job.userId]
        : (
            await db
              .select({ userId: organizationMembers.userId })
              .from(organizationMembers)
              .where(
                and(
                  eq(organizationMembers.status, "active"),
                  ...(job.organizationId
                    ? [eq(organizationMembers.organizationId, job.organizationId)]
                    : []),
                  ...(roleFilters.length > 0
                    ? [inArray(organizationMembers.role, roleFilters)]
                    : []),
                ),
              )
              .groupBy(organizationMembers.userId)
          ).map((member) => member.userId);

      if (recipients.length === 0) {
        throw new Error("No recipients found for scheduled notification.");
      }

      const variables = job.variables ?? {};
      const basePayload = {
        organizationId: job.organizationId ?? null,
        type: job.templateKey,
        category: template.category,
        title: applyTemplate(template.subject, variables),
        body: applyTemplate(template.bodyTemplate, variables),
        metadata: {
          scheduledNotificationId: job.id,
          templateKey: job.templateKey,
        },
      };

      const results = await Promise.allSettled(
        recipients.map(async (userId) => {
          const notificationId = job.userId
            ? job.id
            : await buildStableNotificationId(job.id, userId);
          await enqueueNotification({
            ...basePayload,
            notificationId,
            userId,
          });
        }),
      );

      const failures = results.filter((result) => result.status === "rejected");
      if (failures.length > 0) {
        failures.forEach((failure) => {
          console.error("Scheduled notification recipient failed", {
            jobId: job.id,
            error:
              failure.status === "rejected"
                ? failure.reason instanceof Error
                  ? failure.reason.message
                  : String(failure.reason)
                : "Unknown error",
          });
        });

        throw new Error(
          `Failed to enqueue ${failures.length} of ${recipients.length} notifications`,
        );
      }

      await db
        .update(scheduledNotifications)
        .set({ sentAt: new Date() })
        .where(eq(scheduledNotifications.id, job.id));
    } catch (error) {
      console.error("Failed to process scheduled notification", error);
      const nextRetry = job.retryCount + 1;
      const maxRetries = 3;
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      if (nextRetry <= maxRetries) {
        const backoffMinutes = Math.min(60, 5 * 2 ** job.retryCount);
        await db
          .update(scheduledNotifications)
          .set({
            scheduledFor: new Date(Date.now() + backoffMinutes * 60 * 1000),
            errorMessage,
            retryCount: nextRetry,
          })
          .where(eq(scheduledNotifications.id, job.id));
      } else {
        await db
          .update(scheduledNotifications)
          .set({
            failedAt: new Date(),
            errorMessage,
            retryCount: nextRetry,
          })
          .where(eq(scheduledNotifications.id, job.id));
      }
    }
  }

  return { processed: pending.length };
});
