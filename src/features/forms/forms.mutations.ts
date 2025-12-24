import { createServerFn } from "@tanstack/react-start";
import { forbidden, notFound, unauthorized } from "~/lib/server/errors";
import { zod$ } from "~/lib/server/fn-utils";
import type { JsonRecord, JsonValue } from "~/shared/lib/json";
import {
  createFormSchema,
  createFormUploadSchema,
  publishFormSchema,
  reviewFormSubmissionSchema,
  submitFormSchema,
  updateFormSchema,
  updateFormSubmissionSchema,
  type FormDefinition,
} from "./forms.schemas";
import {
  getFileConfigForField,
  sanitizePayload,
  validateFileUpload,
  validateFormPayload,
} from "./forms.utils";

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

const requireOrgAccess = async (
  userId: string,
  organizationId: string | null | undefined,
  options?: { roles?: Array<"owner" | "admin" | "reporter" | "viewer" | "member"> },
) => {
  if (!organizationId) {
    const { PermissionService } = await import("~/features/roles/permission.service");
    const isAdmin = await PermissionService.isGlobalAdmin(userId);
    if (!isAdmin) {
      throw forbidden("Organization access required");
    }
    return null;
  }

  const { requireOrganizationMembership } = await import("~/lib/auth/guards/org-guard");
  return requireOrganizationMembership({ userId, organizationId }, options);
};

const loadFormWithAccess = async (
  formId: string,
  userId: string,
  options?: { roles?: Array<"owner" | "admin" | "reporter" | "viewer" | "member"> },
) => {
  const { getDb } = await import("~/db/server-helpers");
  const { forms } = await import("~/db/schema");
  const { eq } = await import("drizzle-orm");

  const db = await getDb();
  const [form] = await db.select().from(forms).where(eq(forms.id, formId)).limit(1);

  if (!form) {
    throw notFound("Form not found");
  }

  await requireOrgAccess(userId, form.organizationId, options);
  return form;
};

type FilePayload = {
  storageKey: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  checksum?: string | null;
};

const isFilePayload = (value: JsonValue): value is FilePayload => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, JsonValue>;
  return (
    typeof record["storageKey"] === "string" &&
    typeof record["fileName"] === "string" &&
    typeof record["mimeType"] === "string" &&
    typeof record["sizeBytes"] === "number"
  );
};

const buildSubmissionFiles = (
  definition: FormDefinition,
  payload: JsonRecord,
  submissionId: string,
  actorUserId: string,
) => {
  return definition.fields
    .filter((field) => field.type === "file")
    .map((field) => {
      const value = payload[field.key];
      if (!isFilePayload(value)) return null;
      return {
        submissionId,
        fieldKey: field.key,
        fileName: value.fileName,
        mimeType: value.mimeType,
        sizeBytes: Number(value.sizeBytes),
        checksum: typeof value.checksum === "string" ? value.checksum : "",
        storageKey: value.storageKey,
        uploadedBy: actorUserId,
      };
    })
    .filter((value): value is NonNullable<typeof value> => Boolean(value));
};

const insertSubmissionFiles = async (
  definition: FormDefinition,
  payload: JsonRecord,
  submissionId: string,
  actorUserId: string,
) => {
  const files = buildSubmissionFiles(definition, payload, submissionId, actorUserId);
  if (files.length === 0) return;

  const { getDb } = await import("~/db/server-helpers");
  const { submissionFiles } = await import("~/db/schema");
  const { eq } = await import("drizzle-orm");
  const db = await getDb();

  const existing = await db
    .select({ storageKey: submissionFiles.storageKey })
    .from(submissionFiles)
    .where(eq(submissionFiles.submissionId, submissionId));
  const existingKeys = new Set(existing.map((row) => row.storageKey));
  const toInsert = files.filter((file) => !existingKeys.has(file.storageKey));

  if (toInsert.length > 0) {
    await db.insert(submissionFiles).values(toInsert);
  }
};

export const createForm = createServerFn({ method: "POST" })
  .inputValidator(zod$(createFormSchema))
  .handler(async ({ data }) => {
    const { getDb } = await import("~/db/server-helpers");
    const { forms } = await import("~/db/schema");
    const actorUserId = await requireSessionUserId();
    const { ORG_ADMIN_ROLES } = await import("~/lib/auth/guards/org-guard");
    await requireOrgAccess(actorUserId, data.organizationId ?? null, {
      roles: ORG_ADMIN_ROLES,
    });

    const db = await getDb();
    const [created] = await db
      .insert(forms)
      .values({
        organizationId: data.organizationId ?? null,
        name: data.name,
        slug: data.slug,
        description: data.description ?? null,
        createdBy: actorUserId,
      })
      .returning();

    if (created) {
      const { logDataChange } = await import("~/lib/audit");
      await logDataChange({
        action: "FORM_CREATE",
        actorUserId,
        targetType: "form",
        targetId: created.id,
        targetOrgId: created.organizationId ?? null,
      });
    }

    return created ?? null;
  });

export const updateForm = createServerFn({ method: "POST" })
  .inputValidator(zod$(updateFormSchema))
  .handler(async ({ data }) => {
    const { getDb } = await import("~/db/server-helpers");
    const { forms } = await import("~/db/schema");
    const { eq } = await import("drizzle-orm");
    const actorUserId = await requireSessionUserId();
    const { ORG_ADMIN_ROLES } = await import("~/lib/auth/guards/org-guard");
    const existing = await loadFormWithAccess(data.formId, actorUserId, {
      roles: ORG_ADMIN_ROLES,
    });

    const db = await getDb();
    const [updated] = await db
      .update(forms)
      .set({
        name: data.data.name,
        slug: data.data.slug,
        description: data.data.description ?? null,
      })
      .where(eq(forms.id, data.formId))
      .returning();

    if (updated) {
      const { createAuditDiff, logAdminAction } = await import("~/lib/audit");
      const changes = await createAuditDiff(
        {
          name: existing.name,
          slug: existing.slug,
          description: existing.description,
        },
        {
          name: updated.name,
          slug: updated.slug,
          description: updated.description,
        },
      );
      await logAdminAction({
        action: "FORM_UPDATE",
        actorUserId,
        targetType: "form",
        targetId: updated.id,
        targetOrgId: updated.organizationId ?? null,
        changes,
      });
    }

    return updated ?? null;
  });

export const publishForm = createServerFn({ method: "POST" })
  .inputValidator(zod$(publishFormSchema))
  .handler(async ({ data }) => {
    const { getDb } = await import("~/db/server-helpers");
    const { formVersions, forms } = await import("~/db/schema");
    const { desc, eq } = await import("drizzle-orm");
    const actorUserId = await requireSessionUserId();
    const { ORG_ADMIN_ROLES } = await import("~/lib/auth/guards/org-guard");
    const form = await loadFormWithAccess(data.formId, actorUserId, {
      roles: ORG_ADMIN_ROLES,
    });

    const db = await getDb();
    const [latest] = await db
      .select({ versionNumber: formVersions.versionNumber })
      .from(formVersions)
      .where(eq(formVersions.formId, data.formId))
      .orderBy(desc(formVersions.versionNumber))
      .limit(1);

    const versionNumber = (latest?.versionNumber ?? 0) + 1;
    const [created] = await db
      .insert(formVersions)
      .values({
        formId: data.formId,
        versionNumber,
        definition: data.definition,
        publishedAt: new Date(),
        publishedBy: actorUserId,
      })
      .returning();

    await db.update(forms).set({ status: "published" }).where(eq(forms.id, data.formId));

    if (created) {
      const { logAdminAction } = await import("~/lib/audit");
      await logAdminAction({
        action: "FORM_PUBLISH",
        actorUserId,
        targetType: "form",
        targetId: created.formId,
        targetOrgId: form.organizationId ?? null,
        metadata: { versionNumber },
      });
    }

    return created ?? null;
  });

export const submitForm = createServerFn({ method: "POST" })
  .inputValidator(zod$(submitFormSchema))
  .handler(async ({ data }) => {
    const { getDb } = await import("~/db/server-helpers");
    const { forms, formSubmissionVersions, formSubmissions, formVersions } =
      await import("~/db/schema");
    const { desc, eq } = await import("drizzle-orm");
    const actorUserId = await requireSessionUserId();

    const db = await getDb();
    const [form] = await db
      .select()
      .from(forms)
      .where(eq(forms.id, data.formId))
      .limit(1);
    if (!form) {
      throw notFound("Form not found");
    }

    if (
      form.organizationId &&
      data.organizationId &&
      form.organizationId !== data.organizationId
    ) {
      throw forbidden("Organization mismatch for submission");
    }

    const organizationId = form.organizationId ?? data.organizationId ?? null;
    if (!organizationId) {
      throw forbidden("Organization is required for submissions");
    }

    await requireOrgAccess(actorUserId, organizationId);

    const [latestVersion] = await db
      .select()
      .from(formVersions)
      .where(eq(formVersions.formId, data.formId))
      .orderBy(desc(formVersions.versionNumber))
      .limit(1);

    if (!latestVersion) {
      return { error: "Form has no published versions." };
    }

    const definition = latestVersion.definition as FormDefinition;
    const sanitizedPayload = await sanitizePayload(definition, data.payload);
    const validation = validateFormPayload(definition, sanitizedPayload);

    const [submission] = await db
      .insert(formSubmissions)
      .values({
        formId: data.formId,
        formVersionId: latestVersion.id,
        organizationId,
        submitterId: actorUserId,
        status: data.status ?? "draft",
        payload: sanitizedPayload,
        completenessScore: validation.completenessScore,
        missingFields: validation.missingFields,
        validationErrors: validation.validationErrors,
        submittedAt: data.status === "submitted" ? new Date() : null,
        importJobId: data.importJobId ?? null,
      })
      .returning();

    if (!submission) {
      return { error: "Failed to save submission." };
    }

    await db.insert(formSubmissionVersions).values({
      submissionId: submission.id,
      versionNumber: 1,
      payloadSnapshot: sanitizedPayload,
      changedBy: actorUserId,
      changeReason: data.changeReason ?? null,
    });

    await insertSubmissionFiles(definition, sanitizedPayload, submission.id, actorUserId);

    const { logDataChange } = await import("~/lib/audit");
    await logDataChange({
      action: "FORM_SUBMISSION_CREATE",
      actorUserId,
      targetType: "form_submission",
      targetId: submission.id,
      targetOrgId: submission.organizationId,
    });

    return submission;
  });

export const createFormUpload = createServerFn({ method: "POST" })
  .inputValidator(zod$(createFormUploadSchema))
  .handler(async ({ data }) => {
    const actorUserId = await requireSessionUserId();
    const form = await loadFormWithAccess(data.formId, actorUserId);

    // Load form version to get field definition for validation
    const { getDb } = await import("~/db/server-helpers");
    const { formVersions } = await import("~/db/schema");
    const { desc, eq } = await import("drizzle-orm");
    const { badRequest } = await import("~/lib/server/errors");

    const db = await getDb();
    const [latestVersion] = await db
      .select()
      .from(formVersions)
      .where(eq(formVersions.formId, data.formId))
      .orderBy(desc(formVersions.versionNumber))
      .limit(1);

    // Validate file against field configuration if form has a published version
    if (latestVersion) {
      const definition = latestVersion.definition as FormDefinition;
      const config = getFileConfigForField(definition, data.fieldKey);
      const validation = validateFileUpload(
        {
          fileName: data.fileName,
          mimeType: data.mimeType,
          size: data.sizeBytes,
        },
        config,
      );

      if (!validation.valid) {
        throw badRequest(validation.error ?? "File validation failed");
      }
    }

    const { createId } = await import("@paralleldrive/cuid2");
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
    const { getArtifactsBucketName, getS3Client } =
      await import("~/lib/storage/artifacts");

    const safeFileName = data.fileName.replace(/[^a-zA-Z0-9_.-]/g, "_");
    const storageKey = `forms/${form.id}/${createId()}-${safeFileName}`;
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
      action: "FORM_UPLOAD_INIT",
      actorUserId,
      targetType: "form",
      targetId: form.id,
      targetOrgId: form.organizationId ?? null,
      metadata: {
        fieldKey: data.fieldKey,
        fileName: data.fileName,
        mimeType: data.mimeType,
        sizeBytes: data.sizeBytes,
        storageKey,
      },
    });

    return { uploadUrl, storageKey };
  });

export const updateFormSubmission = createServerFn({ method: "POST" })
  .inputValidator(zod$(updateFormSubmissionSchema))
  .handler(async ({ data }) => {
    const actorUserId = await requireSessionUserId();
    const { getDb } = await import("~/db/server-helpers");
    const { formSubmissionVersions, formSubmissions, formVersions } =
      await import("~/db/schema");
    const { desc, eq } = await import("drizzle-orm");

    const db = await getDb();
    const [submission] = await db
      .select()
      .from(formSubmissions)
      .where(eq(formSubmissions.id, data.submissionId))
      .limit(1);

    if (!submission) {
      throw notFound("Submission not found");
    }

    await requireOrgAccess(actorUserId, submission.organizationId);

    const [version] = await db
      .select()
      .from(formVersions)
      .where(eq(formVersions.id, submission.formVersionId))
      .limit(1);

    if (!version) {
      throw notFound("Form version not found");
    }

    const definition = version.definition as FormDefinition;
    const sanitizedPayload = await sanitizePayload(definition, data.payload);
    const validation = validateFormPayload(definition, sanitizedPayload);
    const nextStatus = data.status ?? submission.status;

    const [updated] = await db
      .update(formSubmissions)
      .set({
        payload: sanitizedPayload,
        completenessScore: validation.completenessScore,
        missingFields: validation.missingFields,
        validationErrors: validation.validationErrors,
        status: nextStatus,
        submittedAt: nextStatus === "submitted" ? new Date() : submission.submittedAt,
        updatedAt: new Date(),
      })
      .where(eq(formSubmissions.id, data.submissionId))
      .returning();

    if (!updated) {
      return null;
    }

    const [latestVersion] = await db
      .select({ versionNumber: formSubmissionVersions.versionNumber })
      .from(formSubmissionVersions)
      .where(eq(formSubmissionVersions.submissionId, updated.id))
      .orderBy(desc(formSubmissionVersions.versionNumber))
      .limit(1);

    await db.insert(formSubmissionVersions).values({
      submissionId: updated.id,
      versionNumber: (latestVersion?.versionNumber ?? 0) + 1,
      payloadSnapshot: sanitizedPayload,
      changedBy: actorUserId,
      changeReason: data.changeReason ?? null,
    });

    await insertSubmissionFiles(definition, sanitizedPayload, updated.id, actorUserId);

    const { logDataChange } = await import("~/lib/audit");
    await logDataChange({
      action: "FORM_SUBMISSION_UPDATE",
      actorUserId,
      targetType: "form_submission",
      targetId: updated.id,
      targetOrgId: updated.organizationId,
    });

    return updated;
  });

export const reviewFormSubmission = createServerFn({ method: "POST" })
  .inputValidator(zod$(reviewFormSubmissionSchema))
  .handler(async ({ data }) => {
    const actorUserId = await requireSessionUserId();
    const { getDb } = await import("~/db/server-helpers");
    const { formSubmissions } = await import("~/db/schema");
    const { eq } = await import("drizzle-orm");
    const { ORG_ADMIN_ROLES } = await import("~/lib/auth/guards/org-guard");

    const db = await getDb();
    const [submission] = await db
      .select()
      .from(formSubmissions)
      .where(eq(formSubmissions.id, data.submissionId))
      .limit(1);

    if (!submission) {
      throw notFound("Submission not found");
    }

    await requireOrgAccess(actorUserId, submission.organizationId, {
      roles: ORG_ADMIN_ROLES,
    });

    const [updated] = await db
      .update(formSubmissions)
      .set({
        status: data.status,
        reviewedBy: actorUserId,
        reviewedAt: new Date(),
        reviewNotes: data.reviewNotes ?? null,
      })
      .where(eq(formSubmissions.id, data.submissionId))
      .returning();

    if (updated) {
      const { logAdminAction } = await import("~/lib/audit");
      await logAdminAction({
        action: "FORM_SUBMISSION_REVIEW",
        actorUserId,
        targetType: "form_submission",
        targetId: updated.id,
        targetOrgId: updated.organizationId,
        metadata: { status: updated.status },
      });
    }

    return updated ?? null;
  });
