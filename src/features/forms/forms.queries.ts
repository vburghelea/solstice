import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { forbidden, notFound, unauthorized } from "~/lib/server/errors";
import { zod$ } from "~/lib/server/fn-utils";
import {
  getSubmissionFileDownloadSchema,
  listSubmissionFilesSchema,
} from "./forms.schemas";

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
  return requireOrganizationMembership({ userId, organizationId });
};

const getFormSchema = z.object({
  formId: z.uuid(),
});

const listFormsSchema = z
  .object({
    organizationId: z.uuid().optional(),
  })
  .nullish()
  .transform((value) => value ?? {});

const listFormSubmissionsSchema = z.object({
  formId: z.uuid(),
});

const listSubmissionVersionsSchema = z.object({
  submissionId: z.uuid(),
});

export const getForm = createServerFn({ method: "GET" })
  .inputValidator(zod$(getFormSchema))
  .handler(async ({ data }) => {
    const userId = await requireSessionUserId();
    const { getDb } = await import("~/db/server-helpers");
    const { forms } = await import("~/db/schema");
    const { eq } = await import("drizzle-orm");

    const db = await getDb();
    const [form] = await db
      .select()
      .from(forms)
      .where(eq(forms.id, data.formId))
      .limit(1);

    if (form) {
      await requireOrgAccess(userId, form.organizationId);
    }

    return form ?? null;
  });

export const listForms = createServerFn({ method: "GET" })
  .inputValidator(zod$(listFormsSchema))
  .handler(async ({ data }) => {
    const userId = await requireSessionUserId();
    const { getDb } = await import("~/db/server-helpers");
    const { forms, organizationMembers } = await import("~/db/schema");
    const { and, eq, inArray, isNull, or } = await import("drizzle-orm");

    const db = await getDb();
    if (data.organizationId) {
      await requireOrgAccess(userId, data.organizationId);
      return db.select().from(forms).where(eq(forms.organizationId, data.organizationId));
    }

    const memberships = await db
      .select({ organizationId: organizationMembers.organizationId })
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.userId, userId),
          eq(organizationMembers.status, "active"),
        ),
      );

    const orgIds = memberships.map((membership) => membership.organizationId);
    const { PermissionService } = await import("~/features/roles/permission.service");
    const isAdmin = await PermissionService.isGlobalAdmin(userId);

    const conditions = [];
    if (orgIds.length > 0) {
      conditions.push(inArray(forms.organizationId, orgIds));
    }

    if (isAdmin) {
      conditions.push(isNull(forms.organizationId));
    }

    if (conditions.length === 0) return [];

    return db
      .select()
      .from(forms)
      .where(conditions.length === 1 ? conditions[0] : or(...conditions));
  });

export const getLatestFormVersion = createServerFn({ method: "GET" })
  .inputValidator(zod$(getFormSchema))
  .handler(async ({ data }) => {
    const userId = await requireSessionUserId();
    const { getDb } = await import("~/db/server-helpers");
    const { forms, formVersions } = await import("~/db/schema");
    const { desc, eq } = await import("drizzle-orm");

    const db = await getDb();
    const [form] = await db
      .select()
      .from(forms)
      .where(eq(forms.id, data.formId))
      .limit(1);
    if (!form) {
      return null;
    }
    await requireOrgAccess(userId, form.organizationId);

    const [version] = await db
      .select()
      .from(formVersions)
      .where(eq(formVersions.formId, data.formId))
      .orderBy(desc(formVersions.versionNumber))
      .limit(1);

    return version ?? null;
  });

export const listFormSubmissions = createServerFn({ method: "GET" })
  .inputValidator(zod$(listFormSubmissionsSchema))
  .handler(async ({ data }) => {
    const userId = await requireSessionUserId();
    const { getDb } = await import("~/db/server-helpers");
    const { forms, formSubmissions } = await import("~/db/schema");
    const { desc, eq } = await import("drizzle-orm");

    const db = await getDb();
    const [form] = await db
      .select()
      .from(forms)
      .where(eq(forms.id, data.formId))
      .limit(1);
    if (!form) {
      throw notFound("Form not found");
    }
    await requireOrgAccess(userId, form.organizationId);

    return db
      .select()
      .from(formSubmissions)
      .where(eq(formSubmissions.formId, data.formId))
      .orderBy(desc(formSubmissions.createdAt));
  });

export const listFormSubmissionVersions = createServerFn({ method: "GET" })
  .inputValidator(zod$(listSubmissionVersionsSchema))
  .handler(async ({ data }) => {
    const userId = await requireSessionUserId();
    const { getDb } = await import("~/db/server-helpers");
    const { formSubmissionVersions, formSubmissions } = await import("~/db/schema");
    const { desc, eq } = await import("drizzle-orm");

    const db = await getDb();
    const [submission] = await db
      .select({ organizationId: formSubmissions.organizationId })
      .from(formSubmissions)
      .where(eq(formSubmissions.id, data.submissionId))
      .limit(1);

    if (!submission) {
      return [];
    }

    await requireOrgAccess(userId, submission.organizationId);

    return db
      .select()
      .from(formSubmissionVersions)
      .where(eq(formSubmissionVersions.submissionId, data.submissionId))
      .orderBy(desc(formSubmissionVersions.versionNumber));
  });

export const listSubmissionFiles = createServerFn({ method: "GET" })
  .inputValidator(zod$(listSubmissionFilesSchema))
  .handler(async ({ data }) => {
    const userId = await requireSessionUserId();
    const { getDb } = await import("~/db/server-helpers");
    const { formSubmissions, submissionFiles } = await import("~/db/schema");
    const { eq } = await import("drizzle-orm");

    const db = await getDb();
    const [submission] = await db
      .select({ organizationId: formSubmissions.organizationId })
      .from(formSubmissions)
      .where(eq(formSubmissions.id, data.submissionId))
      .limit(1);

    if (!submission) {
      return [];
    }

    await requireOrgAccess(userId, submission.organizationId);

    return db
      .select()
      .from(submissionFiles)
      .where(eq(submissionFiles.submissionId, data.submissionId));
  });

export const getSubmissionFileDownloadUrl = createServerFn({ method: "GET" })
  .inputValidator(zod$(getSubmissionFileDownloadSchema))
  .handler(async ({ data }) => {
    const userId = await requireSessionUserId();
    const { getDb } = await import("~/db/server-helpers");
    const { formSubmissions, submissionFiles } = await import("~/db/schema");
    const { eq } = await import("drizzle-orm");

    const db = await getDb();
    const [record] = await db
      .select({
        storageKey: submissionFiles.storageKey,
        fileName: submissionFiles.fileName,
        mimeType: submissionFiles.mimeType,
        organizationId: formSubmissions.organizationId,
      })
      .from(submissionFiles)
      .innerJoin(formSubmissions, eq(submissionFiles.submissionId, formSubmissions.id))
      .where(eq(submissionFiles.id, data.submissionFileId))
      .limit(1);

    if (!record) {
      return null;
    }

    await requireOrgAccess(userId, record.organizationId);

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
    return { url, fileName: record.fileName };
  });
