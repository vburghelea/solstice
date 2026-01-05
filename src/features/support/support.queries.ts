import { createServerFn } from "@tanstack/react-start";
import { getAuthMiddleware, requireUser } from "~/lib/server/auth";
import { zod$ } from "~/lib/server/fn-utils";
import { assertFeatureEnabled } from "~/tenant/feature-gates";
import {
  getSupportRequestAttachmentDownloadSchema,
  listSupportRequestsSchema,
} from "./support.schemas";

export const listMySupportRequests = createServerFn({ method: "GET" })
  .middleware(getAuthMiddleware())
  .inputValidator(zod$(listSupportRequestsSchema))
  .handler(async ({ data, context }) => {
    await assertFeatureEnabled("sin_support");
    const user = requireUser(context);
    const { getDb } = await import("~/db/server-helpers");
    const { supportRequestAttachments, supportRequests } = await import("~/db/schema");
    const { and, asc, desc, eq, inArray } = await import("drizzle-orm");

    const db = await getDb();
    const conditions = [eq(supportRequests.userId, user.id)];

    if (data.organizationId) {
      conditions.push(eq(supportRequests.organizationId, data.organizationId));
    }

    if (data.status) {
      conditions.push(eq(supportRequests.status, data.status));
    }

    const requests = await db
      .select()
      .from(supportRequests)
      .where(and(...conditions))
      .orderBy(desc(supportRequests.createdAt));

    if (requests.length === 0) {
      return requests;
    }

    const attachmentRows = await db
      .select({
        id: supportRequestAttachments.id,
        requestId: supportRequestAttachments.requestId,
        fileName: supportRequestAttachments.fileName,
        mimeType: supportRequestAttachments.mimeType,
        sizeBytes: supportRequestAttachments.sizeBytes,
        createdAt: supportRequestAttachments.createdAt,
      })
      .from(supportRequestAttachments)
      .where(
        inArray(
          supportRequestAttachments.requestId,
          requests.map((request) => request.id),
        ),
      )
      .orderBy(asc(supportRequestAttachments.createdAt));

    const attachmentsByRequest = new Map<
      string,
      Array<(typeof attachmentRows)[number]>
    >();
    for (const attachment of attachmentRows) {
      const list = attachmentsByRequest.get(attachment.requestId) ?? [];
      list.push(attachment);
      attachmentsByRequest.set(attachment.requestId, list);
    }

    return requests.map((request) => ({
      ...request,
      attachments: attachmentsByRequest.get(request.id) ?? [],
    }));
  });

export const listSupportRequestsAdmin = createServerFn({ method: "GET" })
  .middleware(getAuthMiddleware())
  .inputValidator(zod$(listSupportRequestsSchema))
  .handler(async ({ data, context }) => {
    await assertFeatureEnabled("sin_support");
    const user = requireUser(context);

    const { PermissionService } = await import("~/features/roles/permission.service");
    const isAdmin = await PermissionService.isGlobalAdmin(user.id);
    const { forbidden } = await import("~/lib/server/errors");
    if (!isAdmin) {
      throw forbidden("Global admin access required");
    }

    const { getDb } = await import("~/db/server-helpers");
    const { supportRequestAttachments, supportRequests } = await import("~/db/schema");
    const { and, asc, desc, eq, ilike, inArray, or } = await import("drizzle-orm");

    const db = await getDb();
    const conditions = [];

    if (data.organizationId) {
      conditions.push(eq(supportRequests.organizationId, data.organizationId));
    }

    if (data.status) {
      conditions.push(eq(supportRequests.status, data.status));
    }

    if (data.search) {
      const term = `%${data.search}%`;
      conditions.push(
        or(ilike(supportRequests.subject, term), ilike(supportRequests.message, term)),
      );
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const requests = await db
      .select()
      .from(supportRequests)
      .where(where)
      .orderBy(desc(supportRequests.createdAt));

    if (requests.length === 0) {
      return requests;
    }

    const attachmentRows = await db
      .select({
        id: supportRequestAttachments.id,
        requestId: supportRequestAttachments.requestId,
        fileName: supportRequestAttachments.fileName,
        mimeType: supportRequestAttachments.mimeType,
        sizeBytes: supportRequestAttachments.sizeBytes,
        createdAt: supportRequestAttachments.createdAt,
      })
      .from(supportRequestAttachments)
      .where(
        inArray(
          supportRequestAttachments.requestId,
          requests.map((request) => request.id),
        ),
      )
      .orderBy(asc(supportRequestAttachments.createdAt));

    const attachmentsByRequest = new Map<
      string,
      Array<(typeof attachmentRows)[number]>
    >();
    for (const attachment of attachmentRows) {
      const list = attachmentsByRequest.get(attachment.requestId) ?? [];
      list.push(attachment);
      attachmentsByRequest.set(attachment.requestId, list);
    }

    return requests.map((request) => ({
      ...request,
      attachments: attachmentsByRequest.get(request.id) ?? [],
    }));
  });

export const getSupportRequestAttachmentDownloadUrl = createServerFn({ method: "GET" })
  .middleware(getAuthMiddleware())
  .inputValidator(zod$(getSupportRequestAttachmentDownloadSchema))
  .handler(async ({ data, context }) => {
    await assertFeatureEnabled("sin_support");
    const user = requireUser(context);
    const { getDb } = await import("~/db/server-helpers");
    const { supportRequestAttachments, supportRequests } = await import("~/db/schema");
    const { eq } = await import("drizzle-orm");
    const { forbidden } = await import("~/lib/server/errors");

    const db = await getDb();
    const [record] = await db
      .select({
        attachmentId: supportRequestAttachments.id,
        storageKey: supportRequestAttachments.storageKey,
        fileName: supportRequestAttachments.fileName,
        mimeType: supportRequestAttachments.mimeType,
        requestId: supportRequests.id,
        requestUserId: supportRequests.userId,
        organizationId: supportRequests.organizationId,
      })
      .from(supportRequestAttachments)
      .innerJoin(
        supportRequests,
        eq(supportRequestAttachments.requestId, supportRequests.id),
      )
      .where(eq(supportRequestAttachments.id, data.attachmentId))
      .limit(1);

    if (!record) {
      return null;
    }

    const { PermissionService } = await import("~/features/roles/permission.service");
    const isAdmin = await PermissionService.isGlobalAdmin(user.id);
    if (!isAdmin && record.requestUserId !== user.id) {
      throw forbidden("Support request access denied");
    }

    const { GetObjectCommand } = await import("@aws-sdk/client-s3");
    const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
    const { getArtifactsBucketName, getS3Client } =
      await import("~/lib/storage/artifacts");

    const bucket = await getArtifactsBucketName();
    const client = await getS3Client();
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: record.storageKey,
      ResponseContentDisposition: `attachment; filename="${record.fileName}"`,
      ResponseContentType: record.mimeType ?? undefined,
    });

    const url = await getSignedUrl(client, command, { expiresIn: 900 });

    const { logDataChange } = await import("~/lib/audit");
    await logDataChange({
      action: "SUPPORT_ATTACHMENT_DOWNLOAD_URL_ISSUED",
      actorUserId: user.id,
      targetType: "support_request_attachment",
      targetId: record.attachmentId,
      targetOrgId: record.organizationId ?? null,
      metadata: {
        requestId: record.requestId,
        fileName: record.fileName,
      },
    });

    return { url, fileName: record.fileName };
  });
