import { createServerFn } from "@tanstack/react-start";
import type { FormDefinition } from "~/features/forms/forms.schemas";
import { sanitizePayload, validateFormPayload } from "~/features/forms/forms.utils";
import { forbidden, notFound, unauthorized } from "~/lib/server/errors";
import { zod$ } from "~/lib/server/fn-utils";
import type { JsonRecord } from "~/shared/lib/json";
import {
  createImportJobSchema,
  createImportUploadSchema,
  createMappingTemplateSchema,
  deleteMappingTemplateSchema,
  rollbackImportJobSchema,
  runBatchImportSchema,
  runInteractiveImportSchema,
  updateImportJobStatusSchema,
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
  const { requireOrganizationMembership } = await import("~/lib/auth/guards/org-guard");
  return requireOrganizationMembership({ userId, organizationId });
};

export const createImportJob = createServerFn({ method: "POST" })
  .inputValidator(zod$(createImportJobSchema))
  .handler(async ({ data }) => {
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

    return updated ?? null;
  });

export const createMappingTemplate = createServerFn({ method: "POST" })
  .inputValidator(zod$(createMappingTemplateSchema))
  .handler(async ({ data }) => {
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
        mappings: data.mappings,
        createdBy: actorUserId,
      })
      .returning();

    return created ?? null;
  });

export const updateMappingTemplate = createServerFn({ method: "POST" })
  .inputValidator(zod$(updateMappingTemplateSchema))
  .handler(async ({ data }) => {
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
        mappings: data.data.mappings ?? existing.mappings,
      })
      .where(eq(importMappingTemplates.id, data.templateId))
      .returning();

    return updated ?? null;
  });

export const deleteMappingTemplate = createServerFn({ method: "POST" })
  .inputValidator(zod$(deleteMappingTemplateSchema))
  .handler(async ({ data }) => {
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
    return { success: true };
  });

export const createImportUpload = createServerFn({ method: "POST" })
  .inputValidator(zod$(createImportUploadSchema))
  .handler(async ({ data }) => {
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
    const actorUserId = await requireSessionUserId();
    const { getDb } = await import("~/db/server-helpers");
    const {
      formSubmissionVersions,
      formSubmissions,
      formVersions,
      importJobErrors,
      importJobs,
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

    await requireOrgAccess(actorUserId, job.organizationId);

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
    const fieldLookup = new Map(definition.fields.map((field) => [field.key, field]));

    const mapping = data.mapping as Record<string, string>;
    const errors: Array<{
      rowNumber: number;
      fieldKey: string | null;
      errorType: string;
      errorMessage: string;
      rawValue: string | null;
    }> = [];

    let inserted = 0;

    for (const [rowIndex, row] of data.rows.entries()) {
      const payload: JsonRecord = {};

      Object.entries(mapping).forEach(([sourceColumn, targetFieldKey]) => {
        if (!targetFieldKey) return;
        const field = fieldLookup.get(targetFieldKey);
        const rawValue = (row as JsonRecord)[sourceColumn];
        if (!field) return;

        if (field.type === "number") {
          payload[targetFieldKey] = rawValue === "" ? null : Number(rawValue);
          return;
        }

        if (field.type === "checkbox") {
          const normalized = String(rawValue).toLowerCase();
          payload[targetFieldKey] = ["true", "1", "yes", "y"].includes(normalized);
          return;
        }

        if (field.type === "multiselect") {
          payload[targetFieldKey] =
            typeof rawValue === "string" ? rawValue.split(",").map((v) => v.trim()) : [];
          return;
        }

        payload[targetFieldKey] = rawValue ?? null;
      });

      const sanitizedPayload = await sanitizePayload(definition, payload);
      const validation = validateFormPayload(definition, sanitizedPayload);

      if (validation.validationErrors.length > 0 || validation.missingFields.length > 0) {
        validation.validationErrors.forEach((error) => {
          errors.push({
            rowNumber: rowIndex + 1,
            fieldKey: error.field,
            errorType: "validation",
            errorMessage: error.message,
            rawValue: String(payload[error.field] ?? ""),
          });
        });
        validation.missingFields.forEach((fieldKey) => {
          errors.push({
            rowNumber: rowIndex + 1,
            fieldKey,
            errorType: "required",
            errorMessage: "Missing required field",
            rawValue: String(payload[fieldKey] ?? ""),
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
      processed: data.rows.length,
      inserted,
      failed: errors.length,
    };

    await db
      .update(importJobs)
      .set({
        status: "completed",
        stats,
        errorSummary: errors.length > 0 ? { errors: errors.length } : {},
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

    return { success: true, stats, errorCount: errors.length };
  });

export const runBatchImport = createServerFn({ method: "POST" })
  .inputValidator(zod$(runBatchImportSchema))
  .handler(async ({ data }) => {
    const actorUserId = await requireSessionUserId();
    const { runBatchImportJob } = await import("~/lib/imports/batch-runner");

    return runBatchImportJob({ jobId: data.jobId, actorUserId });
  });

export const rollbackImportJob = createServerFn({ method: "POST" })
  .inputValidator(zod$(rollbackImportJobSchema))
  .handler(async ({ data }) => {
    const actorUserId = await requireSessionUserId();
    const { getDb } = await import("~/db/server-helpers");
    const { formSubmissions, importJobs } = await import("~/db/schema");
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

    const deleted = await db
      .delete(formSubmissions)
      .where(eq(formSubmissions.importJobId, job.id))
      .returning();

    await db
      .update(importJobs)
      .set({
        status: "rolled_back",
        canRollback: false,
        completedAt: new Date(),
      })
      .where(eq(importJobs.id, job.id));

    const { logAdminAction } = await import("~/lib/audit");
    await logAdminAction({
      action: "IMPORT_JOB_ROLLBACK",
      actorUserId,
      targetType: "import_job",
      targetId: job.id,
      targetOrgId: job.organizationId,
      metadata: {
        deletedCount: deleted.length,
        reason: data.reason ?? null,
      },
    });

    return { success: true, deletedCount: deleted.length };
  });
