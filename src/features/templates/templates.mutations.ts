import { createServerFn } from "@tanstack/react-start";
import { zod$ } from "~/lib/server/fn-utils";
import { assertFeatureEnabled } from "~/tenant/feature-gates";
import {
  createTemplateSchema,
  createTemplateUploadSchema,
  deleteTemplateSchema,
  getTemplateDownloadSchema,
  getTemplatePreviewSchema,
  updateTemplateSchema,
} from "./templates.schemas";

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

const requireTemplateAccess = async (userId: string, organizationId?: string | null) => {
  if (!organizationId) {
    const { PermissionService } = await import("~/features/roles/permission.service");
    const isAdmin = await PermissionService.isGlobalAdmin(userId);
    if (!isAdmin) {
      const { forbidden } = await import("~/lib/server/errors");
      throw forbidden("Global admin access required");
    }
    return null;
  }

  const { ORG_ADMIN_ROLES, requireOrganizationAccess } =
    await import("~/lib/auth/guards/org-guard");
  return requireOrganizationAccess(
    { userId, organizationId },
    { roles: ORG_ADMIN_ROLES },
  );
};

export const createTemplateUpload = createServerFn({ method: "POST" })
  .inputValidator(zod$(createTemplateUploadSchema))
  .handler(async ({ data }) => {
    await assertFeatureEnabled("sin_templates");
    const actorUserId = await requireSessionUserId();
    await requireTemplateAccess(actorUserId, data.organizationId ?? null);

    const { createId } = await import("@paralleldrive/cuid2");
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
    const { getArtifactsBucketName, getS3Client } =
      await import("~/lib/storage/artifacts");

    const safeFileName = data.fileName.replace(/[^a-zA-Z0-9_.-]/g, "_");
    const scope = data.organizationId ?? "global";
    const context = data.context ?? "general";
    const storageKey = `templates/${scope}/${context}/${createId()}-${safeFileName}`;
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
      action: "TEMPLATE_UPLOAD_INIT",
      actorUserId,
      targetType: "template",
      targetOrgId: data.organizationId ?? null,
      metadata: { storageKey, fileName: data.fileName },
    });

    return { uploadUrl, storageKey };
  });

export const createTemplate = createServerFn({ method: "POST" })
  .inputValidator(zod$(createTemplateSchema))
  .handler(async ({ data }) => {
    await assertFeatureEnabled("sin_templates");
    const actorUserId = await requireSessionUserId();
    await requireTemplateAccess(actorUserId, data.organizationId ?? null);

    const { getDb } = await import("~/db/server-helpers");
    const { templates } = await import("~/db/schema");

    const db = await getDb();
    const [created] = await db
      .insert(templates)
      .values({
        organizationId: data.organizationId ?? null,
        name: data.name,
        description: data.description ?? null,
        context: data.context,
        tags: data.tags ?? [],
        storageKey: data.storageKey,
        fileName: data.fileName,
        mimeType: data.mimeType,
        sizeBytes: data.sizeBytes,
        createdBy: actorUserId,
        updatedBy: actorUserId,
      })
      .returning();

    const { logDataChange } = await import("~/lib/audit");
    await logDataChange({
      action: "TEMPLATE_CREATE",
      actorUserId,
      targetType: "template",
      targetId: created.id,
      targetOrgId: created.organizationId ?? null,
    });

    return created;
  });

export const updateTemplate = createServerFn({ method: "POST" })
  .inputValidator(zod$(updateTemplateSchema))
  .handler(async ({ data }) => {
    await assertFeatureEnabled("sin_templates");
    const actorUserId = await requireSessionUserId();

    const { getDb } = await import("~/db/server-helpers");
    const { templates } = await import("~/db/schema");
    const { eq } = await import("drizzle-orm");
    const { notFound } = await import("~/lib/server/errors");

    const db = await getDb();
    const [existing] = await db
      .select()
      .from(templates)
      .where(eq(templates.id, data.templateId))
      .limit(1);

    if (!existing) {
      throw notFound("Template not found");
    }

    await requireTemplateAccess(actorUserId, existing.organizationId ?? null);

    const [updated] = await db
      .update(templates)
      .set({
        ...data.data,
        tags: data.data.tags ?? existing.tags ?? [],
        updatedBy: actorUserId,
      })
      .where(eq(templates.id, data.templateId))
      .returning();

    const { logDataChange } = await import("~/lib/audit");
    await logDataChange({
      action: "TEMPLATE_UPDATE",
      actorUserId,
      targetType: "template",
      targetId: updated.id,
      targetOrgId: updated.organizationId ?? null,
    });

    return updated;
  });

export const deleteTemplate = createServerFn({ method: "POST" })
  .inputValidator(zod$(deleteTemplateSchema))
  .handler(async ({ data }) => {
    await assertFeatureEnabled("sin_templates");
    const actorUserId = await requireSessionUserId();

    const { getDb } = await import("~/db/server-helpers");
    const { templates } = await import("~/db/schema");
    const { eq } = await import("drizzle-orm");
    const { notFound } = await import("~/lib/server/errors");

    const db = await getDb();
    const [existing] = await db
      .select()
      .from(templates)
      .where(eq(templates.id, data.templateId))
      .limit(1);

    if (!existing) {
      throw notFound("Template not found");
    }

    await requireTemplateAccess(actorUserId, existing.organizationId ?? null);

    await db
      .update(templates)
      .set({ isArchived: true, updatedBy: actorUserId })
      .where(eq(templates.id, data.templateId));

    const { logDataChange } = await import("~/lib/audit");
    await logDataChange({
      action: "TEMPLATE_ARCHIVE",
      actorUserId,
      targetType: "template",
      targetId: existing.id,
      targetOrgId: existing.organizationId ?? null,
    });

    return { success: true };
  });

export const getTemplateDownloadUrl = createServerFn({ method: "POST" })
  .inputValidator(zod$(getTemplateDownloadSchema))
  .handler(async ({ data }) => {
    await assertFeatureEnabled("sin_templates");
    const userId = await requireSessionUserId();

    const { getDb } = await import("~/db/server-helpers");
    const { templates } = await import("~/db/schema");
    const { eq } = await import("drizzle-orm");
    const { notFound } = await import("~/lib/server/errors");

    const db = await getDb();
    const [template] = await db
      .select()
      .from(templates)
      .where(eq(templates.id, data.templateId))
      .limit(1);

    if (!template) {
      throw notFound("Template not found");
    }

    if (template.organizationId) {
      const { requireOrganizationAccess } = await import("~/lib/auth/guards/org-guard");
      await requireOrganizationAccess({
        userId,
        organizationId: template.organizationId,
      });
    }

    const { GetObjectCommand } = await import("@aws-sdk/client-s3");
    const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
    const { getArtifactsBucketName, getS3Client } =
      await import("~/lib/storage/artifacts");

    const bucket = await getArtifactsBucketName();
    const client = await getS3Client();

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: template.storageKey,
      ResponseContentDisposition: `attachment; filename="${template.fileName}"`,
    });

    const downloadUrl = await getSignedUrl(client, command, { expiresIn: 900 });

    return {
      downloadUrl,
      fileName: template.fileName,
      mimeType: template.mimeType,
      sizeBytes: template.sizeBytes,
    };
  });

export const getTemplatePreviewUrl = createServerFn({ method: "POST" })
  .inputValidator(zod$(getTemplatePreviewSchema))
  .handler(async ({ data }) => {
    await assertFeatureEnabled("sin_templates");
    const userId = await requireSessionUserId();

    const { getDb } = await import("~/db/server-helpers");
    const { templates } = await import("~/db/schema");
    const { eq } = await import("drizzle-orm");
    const { notFound } = await import("~/lib/server/errors");

    const db = await getDb();
    const [template] = await db
      .select()
      .from(templates)
      .where(eq(templates.id, data.templateId))
      .limit(1);

    if (!template) {
      throw notFound("Template not found");
    }

    if (template.organizationId) {
      const { requireOrganizationAccess } = await import("~/lib/auth/guards/org-guard");
      await requireOrganizationAccess({
        userId,
        organizationId: template.organizationId,
      });
    }

    const { GetObjectCommand } = await import("@aws-sdk/client-s3");
    const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
    const { getArtifactsBucketName, getS3Client } =
      await import("~/lib/storage/artifacts");

    const bucket = await getArtifactsBucketName();
    const client = await getS3Client();

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: template.storageKey,
      ResponseContentDisposition: `inline; filename="${template.fileName}"`,
      ResponseContentType: template.mimeType,
    });

    const previewUrl = await getSignedUrl(client, command, { expiresIn: 900 });

    return {
      previewUrl,
      fileName: template.fileName,
      mimeType: template.mimeType,
      sizeBytes: template.sizeBytes,
    };
  });
