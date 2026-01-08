import { createServerFn } from "@tanstack/react-start";
import type { FormDefinition } from "~/features/forms/forms.schemas";
import { sanitizePayload, validateFormPayload } from "~/features/forms/forms.utils";
import { buildImportFieldLookup, parseImportRow } from "~/features/imports/imports.utils";
import {
  buildSubmissionFilesForImport,
  normalizeImportFileFields,
} from "~/lib/imports/file-field-utils";
import { badRequest, forbidden, notFound, unauthorized } from "~/lib/server/errors";
import { zod$ } from "~/lib/server/fn-utils";
import { assertFeatureEnabled } from "~/tenant/feature-gates";
import {
  createImportJobSchema,
  createImportUploadSchema,
  createImportTemplateSchema,
  createMappingTemplateSchema,
  deleteImportTemplateSchema,
  deleteMappingTemplateSchema,
  downloadFormTemplateSchema,
  downloadImportTemplateSchema,
  rollbackImportJobSchema,
  runBatchImportSchema,
  runInteractiveImportSchema,
  updateImportJobSourceFileSchema,
  updateImportJobStatusSchema,
  updateImportTemplateSchema,
  updateMappingTemplateSchema,
} from "./imports.schemas";

const requireSessionUserId = async () => {
  const { getAuth } = await import("~/lib/auth/server-helpers");
  const { getRequest } = await import("@tanstack/react-start/server");
  const auth = await getAuth();
  const { headers } = getRequest();
  const session = await auth.api.getSession({ headers });

  if (!session?.user?.id) {
    throw unauthorized("User not authenticated");
  }

  return session.user.id;
};

const requireOrgAccess = async (userId: string, organizationId: string) => {
  const { requireOrganizationAccess } = await import("~/lib/auth/guards/org-guard");
  return requireOrganizationAccess({ userId, organizationId });
};

export const createImportJob = createServerFn({ method: "POST" })
  .inputValidator(zod$(createImportJobSchema))
  .handler(async ({ data }) => {
    await assertFeatureEnabled("sin_admin_imports");
    const actorUserId = await requireSessionUserId();
    await requireOrgAccess(actorUserId, data.organizationId);
    const { getDb } = await import("~/db/server-helpers");
    const { importJobs } = await import("~/db/schema");

    const db = await getDb();
    const [created] = await db
      .insert(importJobs)
      .values({
        organizationId: data.organizationId,
        type: data.type,
        lane: data.lane,
        sourceFileKey: data.sourceFileKey,
        sourceFileHash: data.sourceFileHash,
        sourceRowCount: data.sourceRowCount ?? null,
        targetFormId: data.targetFormId ?? null,
        mappingTemplateId: data.mappingTemplateId ?? null,
        rollbackBefore: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdBy: actorUserId,
      })
      .returning();

    if (created) {
      const { logDataChange } = await import("~/lib/audit");
      await logDataChange({
        action: "IMPORT_JOB_CREATE",
        actorUserId,
        targetType: "import_job",
        targetId: created.id,
        targetOrgId: created.organizationId,
      });
    }

    return created ?? null;
  });

export const updateImportJobStatus = createServerFn({ method: "POST" })
  .inputValidator(zod$(updateImportJobStatusSchema))
  .handler(async ({ data }) => {
    await assertFeatureEnabled("sin_admin_imports");
    const actorUserId = await requireSessionUserId();
    const { getDb } = await import("~/db/server-helpers");
    const { importJobs } = await import("~/db/schema");
    const { eq } = await import("drizzle-orm");

    const db = await getDb();
    const [existing] = await db
      .select({ organizationId: importJobs.organizationId })
      .from(importJobs)
      .where(eq(importJobs.id, data.jobId))
      .limit(1);

    if (!existing) {
      throw notFound("Import job not found");
    }

    await requireOrgAccess(actorUserId, existing.organizationId);

    const [updated] = await db
      .update(importJobs)
      .set({
        status: data.status,
        stats: data.stats ?? {},
        errorSummary: data.errorSummary ?? {},
      })
      .where(eq(importJobs.id, data.jobId))
      .returning();

    if (updated) {
      const { logDataChange } = await import("~/lib/audit");
      await logDataChange({
        action: "IMPORT_JOB_STATUS_UPDATE",
        actorUserId,
        targetType: "import_job",
        targetId: updated.id,
        targetOrgId: updated.organizationId,
        metadata: {
          status: data.status,
        },
      });
    }

    return updated ?? null;
  });

export const createMappingTemplate = createServerFn({ method: "POST" })
  .inputValidator(zod$(createMappingTemplateSchema))
  .handler(async ({ data }) => {
    await assertFeatureEnabled("sin_admin_imports");
    const actorUserId = await requireSessionUserId();
    if (data.organizationId) {
      await requireOrgAccess(actorUserId, data.organizationId);
    } else {
      const { PermissionService } = await import("~/features/roles/permission.service");
      const isAdmin = await PermissionService.isGlobalAdmin(actorUserId);
      if (!isAdmin) {
        throw forbidden("Global admin access required");
      }
    }
    const { getDb } = await import("~/db/server-helpers");
    const { importMappingTemplates } = await import("~/db/schema");

    const db = await getDb();
    const [created] = await db
      .insert(importMappingTemplates)
      .values({
        organizationId: data.organizationId ?? null,
        name: data.name,
        description: data.description ?? null,
        targetFormId: data.targetFormId ?? null,
        targetFormVersionId: data.targetFormVersionId ?? null,
        mappings: data.mappings,
        createdBy: actorUserId,
      })
      .returning();

    if (created) {
      const { logDataChange } = await import("~/lib/audit");
      await logDataChange({
        action: "IMPORT_MAPPING_TEMPLATE_CREATE",
        actorUserId,
        targetType: "import_mapping_template",
        targetId: created.id,
        targetOrgId: created.organizationId ?? null,
      });
    }

    return created ?? null;
  });

export const updateMappingTemplate = createServerFn({ method: "POST" })
  .inputValidator(zod$(updateMappingTemplateSchema))
  .handler(async ({ data }) => {
    await assertFeatureEnabled("sin_admin_imports");
    const actorUserId = await requireSessionUserId();
    const { getDb } = await import("~/db/server-helpers");
    const { importMappingTemplates } = await import("~/db/schema");
    const { eq } = await import("drizzle-orm");

    const db = await getDb();
    const [existing] = await db
      .select()
      .from(importMappingTemplates)
      .where(eq(importMappingTemplates.id, data.templateId))
      .limit(1);

    if (!existing) {
      throw notFound("Mapping template not found");
    }

    if (existing.organizationId) {
      await requireOrgAccess(actorUserId, existing.organizationId);
    } else {
      const { PermissionService } = await import("~/features/roles/permission.service");
      const isAdmin = await PermissionService.isGlobalAdmin(actorUserId);
      if (!isAdmin) {
        throw forbidden("Global admin access required");
      }
    }

    const [updated] = await db
      .update(importMappingTemplates)
      .set({
        name: data.data.name ?? existing.name,
        description: data.data.description ?? existing.description,
        targetFormId: data.data.targetFormId ?? existing.targetFormId,
        targetFormVersionId:
          data.data.targetFormVersionId ?? existing.targetFormVersionId,
        mappings: data.data.mappings ?? existing.mappings,
      })
      .where(eq(importMappingTemplates.id, data.templateId))
      .returning();

    if (updated) {
      const { logDataChange } = await import("~/lib/audit");
      await logDataChange({
        action: "IMPORT_MAPPING_TEMPLATE_UPDATE",
        actorUserId,
        targetType: "import_mapping_template",
        targetId: updated.id,
        targetOrgId: updated.organizationId ?? null,
      });
    }

    return updated ?? null;
  });

export const deleteMappingTemplate = createServerFn({ method: "POST" })
  .inputValidator(zod$(deleteMappingTemplateSchema))
  .handler(async ({ data }) => {
    await assertFeatureEnabled("sin_admin_imports");
    const actorUserId = await requireSessionUserId();
    const { getDb } = await import("~/db/server-helpers");
    const { importMappingTemplates } = await import("~/db/schema");
    const { eq } = await import("drizzle-orm");

    const db = await getDb();
    const [existing] = await db
      .select()
      .from(importMappingTemplates)
      .where(eq(importMappingTemplates.id, data.templateId))
      .limit(1);

    if (!existing) {
      throw notFound("Mapping template not found");
    }

    if (existing.organizationId) {
      await requireOrgAccess(actorUserId, existing.organizationId);
    } else {
      const { PermissionService } = await import("~/features/roles/permission.service");
      const isAdmin = await PermissionService.isGlobalAdmin(actorUserId);
      if (!isAdmin) {
        throw forbidden("Global admin access required");
      }
    }

    await db
      .delete(importMappingTemplates)
      .where(eq(importMappingTemplates.id, data.templateId));

    const { logDataChange } = await import("~/lib/audit");
    await logDataChange({
      action: "IMPORT_MAPPING_TEMPLATE_DELETE",
      actorUserId,
      targetType: "import_mapping_template",
      targetId: existing.id,
      targetOrgId: existing.organizationId ?? null,
    });

    return { success: true };
  });

export const createImportTemplate = createServerFn({ method: "POST" })
  .inputValidator(zod$(createImportTemplateSchema))
  .handler(async ({ data }) => {
    await assertFeatureEnabled("sin_admin_imports");
    const actorUserId = await requireSessionUserId();
    if (data.organizationId) {
      await requireOrgAccess(actorUserId, data.organizationId);
    } else {
      const { PermissionService } = await import("~/features/roles/permission.service");
      const isAdmin = await PermissionService.isGlobalAdmin(actorUserId);
      if (!isAdmin) {
        throw forbidden("Global admin access required");
      }
    }
    const { getDb } = await import("~/db/server-helpers");
    const { importTemplates } = await import("~/db/schema");

    const db = await getDb();
    const [created] = await db
      .insert(importTemplates)
      .values({
        organizationId: data.organizationId ?? null,
        formId: data.formId,
        formVersionId: data.formVersionId,
        name: data.name,
        description: data.description ?? null,
        columns: data.columns,
        defaults: data.defaults ?? {},
        createdBy: actorUserId,
      })
      .returning();

    if (created) {
      const { logDataChange } = await import("~/lib/audit");
      await logDataChange({
        action: "IMPORT_TEMPLATE_CREATE",
        actorUserId,
        targetType: "import_template",
        targetId: created.id,
        targetOrgId: created.organizationId ?? null,
      });
    }

    return created ?? null;
  });

export const updateImportTemplate = createServerFn({ method: "POST" })
  .inputValidator(zod$(updateImportTemplateSchema))
  .handler(async ({ data }) => {
    await assertFeatureEnabled("sin_admin_imports");
    const actorUserId = await requireSessionUserId();
    const { getDb } = await import("~/db/server-helpers");
    const { importTemplates } = await import("~/db/schema");
    const { eq } = await import("drizzle-orm");

    const db = await getDb();
    const [existing] = await db
      .select()
      .from(importTemplates)
      .where(eq(importTemplates.id, data.templateId))
      .limit(1);

    if (!existing) {
      throw notFound("Import template not found");
    }

    if (existing.organizationId) {
      await requireOrgAccess(actorUserId, existing.organizationId);
    } else {
      const { PermissionService } = await import("~/features/roles/permission.service");
      const isAdmin = await PermissionService.isGlobalAdmin(actorUserId);
      if (!isAdmin) {
        throw forbidden("Global admin access required");
      }
    }

    const [updated] = await db
      .update(importTemplates)
      .set({
        organizationId: data.data.organizationId ?? existing.organizationId,
        formId: data.data.formId ?? existing.formId,
        formVersionId: data.data.formVersionId ?? existing.formVersionId,
        name: data.data.name ?? existing.name,
        description: data.data.description ?? existing.description,
        columns: data.data.columns ?? existing.columns,
        defaults: data.data.defaults ?? existing.defaults,
      })
      .where(eq(importTemplates.id, data.templateId))
      .returning();

    if (updated) {
      const { logDataChange } = await import("~/lib/audit");
      await logDataChange({
        action: "IMPORT_TEMPLATE_UPDATE",
        actorUserId,
        targetType: "import_template",
        targetId: updated.id,
        targetOrgId: updated.organizationId ?? null,
      });
    }

    return updated ?? null;
  });

export const deleteImportTemplate = createServerFn({ method: "POST" })
  .inputValidator(zod$(deleteImportTemplateSchema))
  .handler(async ({ data }) => {
    await assertFeatureEnabled("sin_admin_imports");
    const actorUserId = await requireSessionUserId();
    const { getDb } = await import("~/db/server-helpers");
    const { importTemplates } = await import("~/db/schema");
    const { eq } = await import("drizzle-orm");

    const db = await getDb();
    const [existing] = await db
      .select()
      .from(importTemplates)
      .where(eq(importTemplates.id, data.templateId))
      .limit(1);

    if (!existing) {
      throw notFound("Import template not found");
    }

    if (existing.organizationId) {
      await requireOrgAccess(actorUserId, existing.organizationId);
    } else {
      const { PermissionService } = await import("~/features/roles/permission.service");
      const isAdmin = await PermissionService.isGlobalAdmin(actorUserId);
      if (!isAdmin) {
        throw forbidden("Global admin access required");
      }
    }

    await db.delete(importTemplates).where(eq(importTemplates.id, data.templateId));

    const { logDataChange } = await import("~/lib/audit");
    await logDataChange({
      action: "IMPORT_TEMPLATE_DELETE",
      actorUserId,
      targetType: "import_template",
      targetId: existing.id,
      targetOrgId: existing.organizationId ?? null,
    });

    return { success: true };
  });

export const updateImportJobSourceFile = createServerFn({ method: "POST" })
  .inputValidator(zod$(updateImportJobSourceFileSchema))
  .handler(async ({ data }) => {
    await assertFeatureEnabled("sin_admin_imports");
    const actorUserId = await requireSessionUserId();
    const { getDb } = await import("~/db/server-helpers");
    const { importJobs } = await import("~/db/schema");
    const { eq } = await import("drizzle-orm");

    const db = await getDb();
    const [existing] = await db
      .select()
      .from(importJobs)
      .where(eq(importJobs.id, data.jobId))
      .limit(1);

    if (!existing) {
      throw notFound("Import job not found");
    }

    await requireOrgAccess(actorUserId, existing.organizationId);

    const [updated] = await db
      .update(importJobs)
      .set({
        sourceFileKey: data.sourceFileKey,
        sourceFileHash: data.sourceFileHash,
        sourceRowCount: data.sourceRowCount ?? existing.sourceRowCount,
      })
      .where(eq(importJobs.id, data.jobId))
      .returning();

    if (updated) {
      const { logDataChange } = await import("~/lib/audit");
      await logDataChange({
        action: "IMPORT_JOB_SOURCE_UPDATE",
        actorUserId,
        targetType: "import_job",
        targetId: updated.id,
        targetOrgId: updated.organizationId,
        metadata: {
          previousSourceFileKey: existing.sourceFileKey,
          nextSourceFileKey: updated.sourceFileKey,
          changeSummary: data.changeSummary ?? null,
        },
      });
    }

    return updated ?? null;
  });

export const downloadFormTemplate = createServerFn({ method: "POST" })
  .inputValidator(zod$(downloadFormTemplateSchema))
  .handler(async ({ data }) => {
    await assertFeatureEnabled("sin_admin_imports");
    const actorUserId = await requireSessionUserId();
    const { getDb } = await import("~/db/server-helpers");
    const { forms, formVersions } = await import("~/db/schema");
    const { desc, eq } = await import("drizzle-orm");

    const db = await getDb();
    const [form] = await db
      .select({ organizationId: forms.organizationId, name: forms.name })
      .from(forms)
      .where(eq(forms.id, data.formId))
      .limit(1);

    if (!form) {
      throw notFound("Form not found");
    }

    if (form.organizationId) {
      await requireOrgAccess(actorUserId, form.organizationId);
    } else {
      const { PermissionService } = await import("~/features/roles/permission.service");
      const isAdmin = await PermissionService.isGlobalAdmin(actorUserId);
      if (!isAdmin) {
        throw forbidden("Global admin access required");
      }
    }

    const [latestVersion] = await db
      .select()
      .from(formVersions)
      .where(eq(formVersions.formId, data.formId))
      .orderBy(desc(formVersions.versionNumber))
      .limit(1);

    if (!latestVersion) {
      throw notFound("Form has no published versions");
    }

    const { createId } = await import("@paralleldrive/cuid2");
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
    const { getArtifactsBucketName, getS3Client } =
      await import("~/lib/storage/artifacts");
    const { generateTemplateBuffer, getTemplateFileName } =
      await import("~/features/imports/template-generator");

    const buffer = await generateTemplateBuffer({
      definition: latestVersion.definition as FormDefinition,
      format: data.format,
      options: data.options,
    });

    const fileName = getTemplateFileName(form.name, data.format);
    const storageKey = `imports/templates/${data.formId}/${createId()}-${fileName}`;
    const bucket = await getArtifactsBucketName();
    const client = await getS3Client();

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: storageKey,
        Body: buffer,
        ContentType:
          data.format === "csv"
            ? "text/csv"
            : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
    );

    const { GetObjectCommand } = await import("@aws-sdk/client-s3");
    const downloadCommand = new GetObjectCommand({
      Bucket: bucket,
      Key: storageKey,
      ResponseContentDisposition: `attachment; filename="${fileName}"`,
    });
    const downloadUrl = await getSignedUrl(client, downloadCommand, {
      expiresIn: 900,
    });

    return { downloadUrl, fileName };
  });

export const downloadImportTemplate = createServerFn({ method: "POST" })
  .inputValidator(zod$(downloadImportTemplateSchema))
  .handler(async ({ data }) => {
    await assertFeatureEnabled("sin_admin_imports");
    const actorUserId = await requireSessionUserId();
    const { getDb } = await import("~/db/server-helpers");
    const { importTemplates, forms, formVersions } = await import("~/db/schema");
    const { eq } = await import("drizzle-orm");

    const db = await getDb();
    const [template] = await db
      .select()
      .from(importTemplates)
      .where(eq(importTemplates.id, data.templateId))
      .limit(1);

    if (!template) {
      throw notFound("Import template not found");
    }

    if (template.organizationId) {
      await requireOrgAccess(actorUserId, template.organizationId);
    } else {
      const { PermissionService } = await import("~/features/roles/permission.service");
      const isAdmin = await PermissionService.isGlobalAdmin(actorUserId);
      if (!isAdmin) {
        throw forbidden("Global admin access required");
      }
    }

    const [form] = await db
      .select({ name: forms.name })
      .from(forms)
      .where(eq(forms.id, template.formId))
      .limit(1);

    if (!form) {
      throw notFound("Form not found");
    }

    const [version] = await db
      .select()
      .from(formVersions)
      .where(eq(formVersions.id, template.formVersionId))
      .limit(1);

    if (!version) {
      throw notFound("Form version not found");
    }

    const { createId } = await import("@paralleldrive/cuid2");
    const { PutObjectCommand, GetObjectCommand } = await import("@aws-sdk/client-s3");
    const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
    const { getArtifactsBucketName, getS3Client } =
      await import("~/lib/storage/artifacts");
    const { generateTemplateBuffer, getTemplateFileName } =
      await import("~/features/imports/template-generator");

    const buffer = await generateTemplateBuffer({
      definition: version.definition as FormDefinition,
      format: data.format,
      columns: template.columns as Record<string, unknown>,
      defaults: template.defaults as Record<string, unknown>,
      options: {
        includeDescriptions: true,
        includeExamples: true,
        includeDataValidation: data.format === "xlsx",
        includeMetadataMarkers: true,
      },
    });

    const fileName = getTemplateFileName(form.name, data.format);
    const storageKey = `imports/templates/${template.id}/${createId()}-${fileName}`;
    const bucket = await getArtifactsBucketName();
    const client = await getS3Client();

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: storageKey,
        Body: buffer,
        ContentType:
          data.format === "csv"
            ? "text/csv"
            : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
    );

    const downloadCommand = new GetObjectCommand({
      Bucket: bucket,
      Key: storageKey,
      ResponseContentDisposition: `attachment; filename="${fileName}"`,
    });
    const downloadUrl = await getSignedUrl(client, downloadCommand, {
      expiresIn: 900,
    });

    return { downloadUrl, fileName };
  });

export const createImportUpload = createServerFn({ method: "POST" })
  .inputValidator(zod$(createImportUploadSchema))
  .handler(async ({ data }) => {
    await assertFeatureEnabled("sin_admin_imports");
    const actorUserId = await requireSessionUserId();
    await requireOrgAccess(actorUserId, data.organizationId);

    const { createId } = await import("@paralleldrive/cuid2");
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
    const { getArtifactsBucketName, getS3Client } =
      await import("~/lib/storage/artifacts");

    const safeFileName = data.fileName.replace(/[^a-zA-Z0-9_.-]/g, "_");
    const storageKey = `imports/${data.organizationId}/${createId()}-${safeFileName}`;
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
      action: "IMPORT_UPLOAD_INIT",
      actorUserId,
      targetType: "import_job",
      targetOrgId: data.organizationId,
      metadata: { storageKey, fileName: data.fileName },
    });

    return { uploadUrl, storageKey };
  });

export const runInteractiveImport = createServerFn({ method: "POST" })
  .inputValidator(zod$(runInteractiveImportSchema))
  .handler(async ({ data }) => {
    await assertFeatureEnabled("sin_admin_imports");
    const actorUserId = await requireSessionUserId();
    const { getDb } = await import("~/db/server-helpers");
    const {
      formSubmissionVersions,
      formSubmissions,
      forms,
      formVersions,
      importJobErrors,
      importJobs,
      submissionFiles,
    } = await import("~/db/schema");
    const { desc, eq } = await import("drizzle-orm");

    const db = await getDb();
    const [job] = await db
      .select()
      .from(importJobs)
      .where(eq(importJobs.id, data.jobId))
      .limit(1);

    if (!job) {
      throw notFound("Import job not found");
    }

    if (job.lane !== "interactive") {
      throw badRequest("Interactive import requires a lane 1 job.");
    }

    await requireOrgAccess(actorUserId, job.organizationId);

    if (job.targetFormId && job.targetFormId !== data.formId) {
      throw badRequest("Import job target form does not match.");
    }

    const [form] = await db
      .select({ organizationId: forms.organizationId })
      .from(forms)
      .where(eq(forms.id, data.formId))
      .limit(1);

    if (!form) {
      throw notFound("Form not found");
    }

    if (!form.organizationId || form.organizationId !== job.organizationId) {
      throw forbidden("Import job organization does not match form.");
    }

    const [latestVersion] = await db
      .select()
      .from(formVersions)
      .where(eq(formVersions.formId, data.formId))
      .orderBy(desc(formVersions.versionNumber))
      .limit(1);

    if (!latestVersion) {
      throw notFound("Form has no published versions");
    }

    const definition = latestVersion.definition as FormDefinition;
    const fieldLookup = buildImportFieldLookup(definition);
    const storageKeyPrefix = `forms/${data.formId}/`;
    const { getArtifactsBucketName } = await import("~/lib/storage/artifacts");
    const artifactsBucket = await getArtifactsBucketName();

    const mapping = data.mapping as Record<string, string>;

    if (!job.targetFormId) {
      await db
        .update(importJobs)
        .set({ targetFormId: data.formId })
        .where(eq(importJobs.id, job.id));
    }

    const { loadImportFile } = await import("~/lib/imports/file-utils");
    const { rows, hash } = await loadImportFile(
      job.sourceFileKey,
      job.type as "csv" | "excel",
    );

    if (hash !== job.sourceFileHash) {
      await db
        .update(importJobs)
        .set({
          status: "failed",
          errorSummary: { reason: "source_file_hash_mismatch" },
          completedAt: new Date(),
        })
        .where(eq(importJobs.id, job.id));
      throw forbidden("Import source file hash mismatch.");
    }
    const errors: Array<{
      rowNumber: number;
      fieldKey: string | null;
      errorType: string;
      errorMessage: string;
      rawValue: string | null;
    }> = [];

    let inserted = 0;
    const failedRows = new Set<number>();

    for (const [rowIndex, row] of rows.entries()) {
      const { payload, parseErrors } = parseImportRow(row, mapping, fieldLookup);
      const { payload: normalizedPayload, parseErrors: fileRefErrors } =
        normalizeImportFileFields({
          definition,
          payload,
          artifactsBucket,
        });
      const sanitizedPayload = await sanitizePayload(definition, normalizedPayload);
      const validation = validateFormPayload(definition, sanitizedPayload, {
        storageKeyPrefix,
      });
      const rowParseErrors = [...parseErrors, ...fileRefErrors];

      const parseErrorFields = new Set(rowParseErrors.map((error) => error.fieldKey));
      const validationErrors = validation.validationErrors.filter(
        (error) => !parseErrorFields.has(error.field),
      );
      const missingFields = validation.missingFields.filter(
        (fieldKey) => !parseErrorFields.has(fieldKey),
      );

      if (
        rowParseErrors.length > 0 ||
        validationErrors.length > 0 ||
        missingFields.length > 0
      ) {
        const rowNumber = rowIndex + 1;
        failedRows.add(rowNumber);

        rowParseErrors.forEach((error) => {
          errors.push({
            rowNumber,
            fieldKey: error.fieldKey,
            errorType: error.errorType,
            errorMessage: error.message,
            rawValue: error.rawValue,
          });
        });
        validationErrors.forEach((error) => {
          errors.push({
            rowNumber,
            fieldKey: error.field,
            errorType: "validation",
            errorMessage: error.message,
            rawValue: String(normalizedPayload[error.field] ?? ""),
          });
        });
        missingFields.forEach((fieldKey) => {
          errors.push({
            rowNumber,
            fieldKey,
            errorType: "required",
            errorMessage: "Missing required field",
            rawValue: String(normalizedPayload[fieldKey] ?? ""),
          });
        });
        continue;
      }

      const [submission] = await db
        .insert(formSubmissions)
        .values({
          formId: data.formId,
          formVersionId: latestVersion.id,
          organizationId: job.organizationId,
          submitterId: actorUserId,
          status: "submitted",
          payload: sanitizedPayload,
          completenessScore: validation.completenessScore,
          missingFields: validation.missingFields,
          validationErrors: validation.validationErrors,
          submittedAt: new Date(),
          importJobId: job.id,
        })
        .returning();

      if (submission) {
        inserted += 1;
        await db.insert(formSubmissionVersions).values({
          submissionId: submission.id,
          versionNumber: 1,
          payloadSnapshot: sanitizedPayload,
          changedBy: actorUserId,
          changeReason: "import",
        });

        const submissionFilesToInsert = buildSubmissionFilesForImport({
          definition,
          payload: sanitizedPayload,
          submissionId: submission.id,
          actorUserId,
        });
        if (submissionFilesToInsert.length > 0) {
          await db.insert(submissionFiles).values(submissionFilesToInsert);
        }
      }
    }

    if (errors.length > 0) {
      await db.insert(importJobErrors).values(
        errors.map((error) => ({
          jobId: job.id,
          rowNumber: error.rowNumber,
          fieldKey: error.fieldKey,
          errorType: error.errorType,
          errorMessage: error.errorMessage,
          rawValue: error.rawValue,
        })),
      );
    }

    const stats = {
      processed: rows.length,
      inserted,
      failed: failedRows.size,
      failedRows: failedRows.size,
      errorCount: errors.length,
    };

    await db
      .update(importJobs)
      .set({
        status: "completed",
        stats,
        errorSummary:
          errors.length > 0
            ? { errorCount: errors.length, failedRows: failedRows.size }
            : {},
        completedAt: new Date(),
      })
      .where(eq(importJobs.id, job.id));

    const { logDataChange } = await import("~/lib/audit");
    await logDataChange({
      action: "IMPORT_JOB_COMPLETE",
      actorUserId,
      targetType: "import_job",
      targetId: job.id,
      targetOrgId: job.organizationId,
      metadata: stats,
    });

    return {
      success: true,
      stats,
      errorCount: errors.length,
      failedRows: failedRows.size,
    };
  });

export const runBatchImport = createServerFn({ method: "POST" })
  .inputValidator(zod$(runBatchImportSchema))
  .handler(async ({ data }) => {
    await assertFeatureEnabled("sin_admin_imports");
    const actorUserId = await requireSessionUserId();
    const { Resource } = await import("sst");

    type ImportTaskResource = {
      cluster: string;
      taskDefinition: string;
      subnets: string[];
      securityGroups: string[];
      assignPublicIp: boolean;
      containers: string[];
    };

    const resources = Resource as unknown as Record<string, unknown>;
    const importTask = resources["SinImportBatchTask"] as ImportTaskResource | undefined;

    if (!importTask?.taskDefinition) {
      const { runBatchImportJob } = await import("~/lib/imports/batch-runner");
      return runBatchImportJob({ jobId: data.jobId, actorUserId });
    }

    const { task } = await import("sst/aws/task");
    const runResult = await task.run(importTask, {
      SIN_IMPORT_JOB_ID: data.jobId,
      SIN_IMPORT_ACTOR_USER_ID: actorUserId,
    });

    return { success: true, taskArn: runResult.arn };
  });

export const rollbackImportJob = createServerFn({ method: "POST" })
  .inputValidator(zod$(rollbackImportJobSchema))
  .handler(async ({ data }) => {
    await assertFeatureEnabled("sin_admin_imports");
    const actorUserId = await requireSessionUserId();
    const { getDb } = await import("~/db/server-helpers");
    const { formSubmissions, importJobErrors, importJobs } = await import("~/db/schema");
    const { eq } = await import("drizzle-orm");

    const db = await getDb();
    const [job] = await db
      .select()
      .from(importJobs)
      .where(eq(importJobs.id, data.jobId))
      .limit(1);

    if (!job) {
      throw notFound("Import job not found");
    }

    await requireOrgAccess(actorUserId, job.organizationId);

    if (job.canRollback === false) {
      throw forbidden("Rollback is disabled for this import.");
    }

    if (job.rollbackBefore && job.rollbackBefore < new Date()) {
      throw forbidden("Rollback window has expired.");
    }

    let deletedCount = 0;
    await db.transaction(async (tx) => {
      const deleted = await tx
        .delete(formSubmissions)
        .where(eq(formSubmissions.importJobId, job.id))
        .returning();

      deletedCount = deleted.length;

      await tx
        .update(importJobErrors)
        .set({ rawValue: null })
        .where(eq(importJobErrors.jobId, job.id));

      await tx
        .update(importJobs)
        .set({
          status: "rolled_back",
          canRollback: false,
          completedAt: new Date(),
        })
        .where(eq(importJobs.id, job.id));
    });

    const { logAdminAction } = await import("~/lib/audit");
    await logAdminAction({
      action: "IMPORT_JOB_ROLLBACK",
      actorUserId,
      targetType: "import_job",
      targetId: job.id,
      targetOrgId: job.organizationId,
      metadata: {
        deletedCount,
        reason: data.reason ?? null,
        rawValuesSanitized: true,
      },
    });

    return { success: true, deletedCount };
  });
