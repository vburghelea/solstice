import { createServerFn } from "@tanstack/react-start";
import { zod$ } from "~/lib/server/fn-utils";
import { assertFeatureEnabled } from "~/tenant/feature-gates";
import {
  createSupportRequestAttachmentSchema,
  createSupportRequestAttachmentUploadSchema,
  createSupportRequestSchema,
  respondSupportRequestSchema,
} from "./support.schemas";
import { supportAttachmentConfig, validateSupportAttachment } from "./support.utils";

const requireSessionUserId = async () => {
  const { getAuth } = await import("~/lib/auth/server-helpers");
  const { getRequest } = await import("@tanstack/react-start/server");
  const auth = await getAuth();
  const { headers } = getRequest();
  const session = await auth.api.getSession({ headers });

  if (!session?.user?.id) {
    const { unauthorized } = await import("~/lib/server/errors");
    throw unauthorized("User not authenticated");
  }

  return session.user.id;
};

export const createSupportRequest = createServerFn({ method: "POST" })
  .inputValidator(zod$(createSupportRequestSchema))
  .handler(async ({ data }) => {
    await assertFeatureEnabled("sin_support");
    const userId = await requireSessionUserId();

    if (data.organizationId) {
      const { requireOrganizationAccess } = await import("~/lib/auth/guards/org-guard");
      await requireOrganizationAccess({ userId, organizationId: data.organizationId });
    }

    const { getDb } = await import("~/db/server-helpers");
    const { supportRequests } = await import("~/db/schema");

    const db = await getDb();
    const [created] = await db
      .insert(supportRequests)
      .values({
        organizationId: data.organizationId ?? null,
        userId,
        subject: data.subject,
        message: data.message,
        category: data.category,
        priority: data.priority,
        status: "open",
      })
      .returning();

    const { logDataChange } = await import("~/lib/audit");
    await logDataChange({
      action: "SUPPORT_REQUEST_CREATE",
      actorUserId: userId,
      targetType: "support_request",
      targetId: created.id,
      targetOrgId: created.organizationId ?? null,
    });

    return created;
  });

export const createSupportRequestAttachmentUpload = createServerFn({ method: "POST" })
  .inputValidator(zod$(createSupportRequestAttachmentUploadSchema))
  .handler(async ({ data }) => {
    await assertFeatureEnabled("sin_support");
    const userId = await requireSessionUserId();

    const { getDb } = await import("~/db/server-helpers");
    const { supportRequestAttachments, supportRequests } = await import("~/db/schema");
    const { count, eq } = await import("drizzle-orm");
    const { badRequest, forbidden, notFound } = await import("~/lib/server/errors");

    const db = await getDb();
    const [request] = await db
      .select()
      .from(supportRequests)
      .where(eq(supportRequests.id, data.requestId))
      .limit(1);

    if (!request) {
      throw notFound("Support request not found");
    }

    const { PermissionService } = await import("~/features/roles/permission.service");
    const isAdmin = await PermissionService.isGlobalAdmin(userId);
    if (!isAdmin && request.userId !== userId) {
      throw forbidden("Support request access denied");
    }

    const validation = validateSupportAttachment({
      fileName: data.fileName,
      mimeType: data.mimeType,
      sizeBytes: data.sizeBytes,
    });

    if (!validation.valid) {
      throw badRequest(validation.error ?? "Invalid attachment");
    }

    const [existingCount] = await db
      .select({ total: count() })
      .from(supportRequestAttachments)
      .where(eq(supportRequestAttachments.requestId, data.requestId));

    const total = existingCount?.total ?? 0;
    if (total >= supportAttachmentConfig.maxFiles) {
      throw badRequest(
        `Too many attachments. Maximum is ${supportAttachmentConfig.maxFiles}.`,
      );
    }

    const { createId } = await import("@paralleldrive/cuid2");
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
    const { getArtifactsBucketName, getS3Client } =
      await import("~/lib/storage/artifacts");

    const safeFileName = data.fileName.replace(/[^a-zA-Z0-9_.-]/g, "_");
    const storageKey = `support/${data.requestId}/${createId()}-${safeFileName}`;
    const bucket = await getArtifactsBucketName();
    const client = await getS3Client();

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: storageKey,
      ContentType: data.mimeType,
      ContentLength: data.sizeBytes,
    });

    const uploadUrl = await getSignedUrl(client, command, { expiresIn: 900 });

    const { logDataChange } = await import("~/lib/audit");
    await logDataChange({
      action: "SUPPORT_ATTACHMENT_UPLOAD_INIT",
      actorUserId: userId,
      targetType: "support_request",
      targetId: request.id,
      targetOrgId: request.organizationId ?? null,
      metadata: {
        fileName: data.fileName,
        mimeType: data.mimeType,
        sizeBytes: data.sizeBytes,
        storageKey,
      },
    });

    return { uploadUrl, storageKey };
  });

export const createSupportRequestAttachment = createServerFn({ method: "POST" })
  .inputValidator(zod$(createSupportRequestAttachmentSchema))
  .handler(async ({ data }) => {
    await assertFeatureEnabled("sin_support");
    const userId = await requireSessionUserId();

    const { getDb } = await import("~/db/server-helpers");
    const { supportRequestAttachments, supportRequests } = await import("~/db/schema");
    const { count, eq } = await import("drizzle-orm");
    const { badRequest, forbidden, notFound } = await import("~/lib/server/errors");

    const db = await getDb();
    const [request] = await db
      .select()
      .from(supportRequests)
      .where(eq(supportRequests.id, data.requestId))
      .limit(1);

    if (!request) {
      throw notFound("Support request not found");
    }

    const { PermissionService } = await import("~/features/roles/permission.service");
    const isAdmin = await PermissionService.isGlobalAdmin(userId);
    if (!isAdmin && request.userId !== userId) {
      throw forbidden("Support request access denied");
    }

    const validation = validateSupportAttachment({
      fileName: data.fileName,
      mimeType: data.mimeType,
      sizeBytes: data.sizeBytes,
    });

    if (!validation.valid) {
      throw badRequest(validation.error ?? "Invalid attachment");
    }

    const [existingCount] = await db
      .select({ total: count() })
      .from(supportRequestAttachments)
      .where(eq(supportRequestAttachments.requestId, data.requestId));

    const total = existingCount?.total ?? 0;
    if (total >= supportAttachmentConfig.maxFiles) {
      throw badRequest(
        `Too many attachments. Maximum is ${supportAttachmentConfig.maxFiles}.`,
      );
    }

    const normalizedKey = data.storageKey.replace(/^\/+/, "");
    const expectedPrefix = `support/${data.requestId}/`;
    if (
      !normalizedKey.startsWith(expectedPrefix) ||
      normalizedKey.includes("..") ||
      normalizedKey.includes("//")
    ) {
      throw badRequest("Invalid attachment storage key.");
    }

    const [created] = await db
      .insert(supportRequestAttachments)
      .values({
        requestId: data.requestId,
        fileName: data.fileName,
        mimeType: data.mimeType,
        sizeBytes: data.sizeBytes,
        storageKey: normalizedKey,
        uploadedBy: userId,
      })
      .returning();

    const { logDataChange } = await import("~/lib/audit");
    await logDataChange({
      action: "SUPPORT_ATTACHMENT_CREATE",
      actorUserId: userId,
      targetType: "support_request_attachment",
      targetId: created?.id ?? null,
      targetOrgId: request.organizationId ?? null,
      metadata: {
        requestId: data.requestId,
        fileName: data.fileName,
        mimeType: data.mimeType,
        sizeBytes: data.sizeBytes,
      },
    });

    return created ?? null;
  });

export const respondSupportRequest = createServerFn({ method: "POST" })
  .inputValidator(zod$(respondSupportRequestSchema))
  .handler(async ({ data }) => {
    await assertFeatureEnabled("sin_support");
    const userId = await requireSessionUserId();

    const { PermissionService } = await import("~/features/roles/permission.service");
    const isAdmin = await PermissionService.isGlobalAdmin(userId);
    const { forbidden, notFound } = await import("~/lib/server/errors");
    if (!isAdmin) {
      throw forbidden("Global admin access required");
    }

    const { getDb } = await import("~/db/server-helpers");
    const { supportRequests } = await import("~/db/schema");
    const { eq } = await import("drizzle-orm");

    const db = await getDb();
    const [existing] = await db
      .select()
      .from(supportRequests)
      .where(eq(supportRequests.id, data.requestId))
      .limit(1);

    if (!existing) {
      throw notFound("Support request not found");
    }

    const nextStatus = data.status ?? existing.status;
    const nextPriority = data.priority ?? existing.priority;
    const nextSlaTargetAt = data.slaTargetAt
      ? new Date(data.slaTargetAt)
      : existing.slaTargetAt;
    const responseChanged =
      typeof data.responseMessage === "string" &&
      data.responseMessage !== existing.responseMessage;
    const statusChanged = nextStatus !== existing.status;

    const [updated] = await db
      .update(supportRequests)
      .set({
        status: nextStatus,
        priority: nextPriority,
        slaTargetAt: nextSlaTargetAt ?? null,
        responseMessage: data.responseMessage ?? existing.responseMessage,
        respondedBy: responseChanged ? userId : existing.respondedBy,
        respondedAt: responseChanged ? new Date() : existing.respondedAt,
      })
      .where(eq(supportRequests.id, data.requestId))
      .returning();

    const { logDataChange } = await import("~/lib/audit");
    await logDataChange({
      action: "SUPPORT_REQUEST_RESPONSE",
      actorUserId: userId,
      targetType: "support_request",
      targetId: updated.id,
      targetOrgId: updated.organizationId ?? null,
    });

    if (statusChanged || responseChanged) {
      const { enqueueNotification } = await import("~/lib/notifications/queue");
      const statusLabel = nextStatus.replace(/_/g, " ");
      const baseSubject = existing.subject || "Support request";
      const title =
        statusChanged && responseChanged
          ? "Support request updated"
          : responseChanged
            ? "Support response received"
            : "Support request status updated";
      const body = responseChanged
        ? `New response on "${baseSubject}".${statusChanged ? ` Status: ${statusLabel}.` : ""}`
        : `Status for "${baseSubject}" is now ${statusLabel}.`;

      await enqueueNotification({
        actorUserId: userId,
        userId: existing.userId,
        organizationId: existing.organizationId ?? null,
        type:
          statusChanged && responseChanged
            ? "support_request_update"
            : responseChanged
              ? "support_request_response"
              : "support_request_status",
        category: "support",
        title,
        body,
        link: "/dashboard/sin/support",
        metadata: {
          requestId: updated.id,
          status: updated.status,
          priority: updated.priority,
        },
      });
    }

    return updated;
  });
