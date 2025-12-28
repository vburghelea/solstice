import { createServerFn } from "@tanstack/react-start";
import { zod$ } from "~/lib/server/fn-utils";
import { assertFeatureEnabled } from "~/tenant/feature-gates";
import {
  acceptPolicySchema,
  applyPrivacyCorrectionSchema,
  applyPrivacyErasureSchema,
  createLegalHoldSchema,
  createPolicyDocumentSchema,
  createPrivacyRequestSchema,
  generatePrivacyExportSchema,
  releaseLegalHoldSchema,
  updatePrivacyRequestSchema,
  upsertRetentionPolicySchema,
} from "./privacy.schemas";

const getSessionUser = async () => {
  const { getAuth } = await import("~/lib/auth/server-helpers");
  const { getRequest } = await import("@tanstack/react-start/server");
  const auth = await getAuth();
  const { headers } = getRequest();
  const session = await auth.api.getSession({ headers });
  return session?.user ?? null;
};

const DSAR_EXPORT_RETENTION_DAYS = 14;
const DSAR_EXPORT_RETENTION_MS = DSAR_EXPORT_RETENTION_DAYS * 24 * 60 * 60 * 1000;

const toAccountExport = (row: {
  id: string;
  accountId: string;
  providerId: string;
  userId: string;
  scope: string | null;
  accessTokenExpiresAt: Date | null;
  refreshTokenExpiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) => ({
  id: row.id,
  accountId: row.accountId,
  providerId: row.providerId,
  userId: row.userId,
  scope: row.scope,
  accessTokenExpiresAt: row.accessTokenExpiresAt,
  refreshTokenExpiresAt: row.refreshTokenExpiresAt,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

const toSessionExport = (row: {
  id: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  lastActivityAt: Date | null;
  ipAddress: string | null;
  userAgent: string | null;
}) => ({
  id: row.id,
  userId: row.userId,
  expiresAt: row.expiresAt,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
  lastActivityAt: row.lastActivityAt,
  ipAddress: row.ipAddress,
  userAgent: row.userAgent,
});

const toTwoFactorExport = (row: { id: string; userId: string }) => ({
  id: row.id,
  userId: row.userId,
  enabled: true,
});

const toVerificationExport = (row: {
  id: string;
  identifier: string;
  expiresAt: Date;
  createdAt: Date | null;
  updatedAt: Date | null;
}) => ({
  id: row.id,
  identifier: row.identifier,
  expiresAt: row.expiresAt,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export const createPolicyDocument = createServerFn({ method: "POST" })
  .inputValidator(zod$(createPolicyDocumentSchema))
  .handler(async ({ data }) => {
    await assertFeatureEnabled("sin_admin_privacy");
    const sessionUser = await getSessionUser();
    if (!sessionUser?.id) return null;

    const { requireAdmin } = await import("~/lib/auth/utils/admin-check");
    await requireAdmin(sessionUser.id);

    const { getCurrentSession, requireRecentAuth } =
      await import("~/lib/auth/guards/step-up");
    const session = await getCurrentSession();
    await requireRecentAuth(sessionUser.id, session);

    const { getDb } = await import("~/db/server-helpers");
    const { policyDocuments } = await import("~/db/schema");

    const db = await getDb();
    const [created] = await db
      .insert(policyDocuments)
      .values({
        type: data.type,
        version: data.version,
        contentUrl: data.contentUrl ?? null,
        contentHash: data.contentHash,
        effectiveDate: data.effectiveDate,
        publishedAt: new Date(),
        publishedBy: sessionUser.id,
      })
      .returning();

    if (created) {
      const { logAdminAction } = await import("~/lib/audit");
      await logAdminAction({
        action: "POLICY_CREATE",
        actorUserId: sessionUser.id,
        targetType: "policy_document",
        targetId: created.id,
      });
    }

    return created ?? null;
  });

export const acceptPolicy = createServerFn({ method: "POST" })
  .inputValidator(zod$(acceptPolicySchema))
  .handler(async ({ data }) => {
    await assertFeatureEnabled("security_core");
    const sessionUser = await getSessionUser();
    if (!sessionUser?.id) return null;

    const { getDb } = await import("~/db/server-helpers");
    const { userPolicyAcceptances } = await import("~/db/schema");
    const { getRequest } = await import("@tanstack/react-start/server");

    const request = getRequest();
    const ipAddress =
      request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip");
    const userAgent = request.headers.get("user-agent");

    const db = await getDb();
    const [accepted] = await db
      .insert(userPolicyAcceptances)
      .values({
        userId: sessionUser.id,
        policyId: data.policyId,
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null,
      })
      .returning();

    if (accepted) {
      const { logDataChange } = await import("~/lib/audit");
      await logDataChange({
        action: "POLICY_ACCEPT",
        actorUserId: sessionUser.id,
        targetType: "policy_acceptance",
        targetId: accepted.id,
      });
    }

    return accepted ?? null;
  });

export const createPrivacyRequest = createServerFn({ method: "POST" })
  .inputValidator(zod$(createPrivacyRequestSchema))
  .handler(async ({ data }) => {
    await assertFeatureEnabled("security_core");
    const sessionUser = await getSessionUser();
    if (!sessionUser?.id) return null;

    const { getDb } = await import("~/db/server-helpers");
    const { privacyRequests } = await import("~/db/schema");
    const db = await getDb();

    const [created] = await db
      .insert(privacyRequests)
      .values({
        userId: sessionUser.id,
        type: data.type,
        status: "pending",
        details: data.details ?? null,
      })
      .returning();

    if (created) {
      const { logDataChange } = await import("~/lib/audit");
      await logDataChange({
        action: "PRIVACY_REQUEST_CREATE",
        actorUserId: sessionUser.id,
        targetType: "privacy_request",
        targetId: created.id,
      });
    }

    return created ?? null;
  });

export const updatePrivacyRequest = createServerFn({ method: "POST" })
  .inputValidator(zod$(updatePrivacyRequestSchema))
  .handler(async ({ data }) => {
    await assertFeatureEnabled("sin_admin_privacy");
    const sessionUser = await getSessionUser();
    if (!sessionUser?.id) return null;

    const { requireAdmin } = await import("~/lib/auth/utils/admin-check");
    await requireAdmin(sessionUser.id);

    const { getCurrentSession, requireRecentAuth } =
      await import("~/lib/auth/guards/step-up");
    const session = await getCurrentSession();
    await requireRecentAuth(sessionUser.id, session);

    const { getDb } = await import("~/db/server-helpers");
    const { privacyRequests } = await import("~/db/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();

    const [updated] = await db
      .update(privacyRequests)
      .set({
        status: data.status,
        processedBy: sessionUser.id,
        processedAt: new Date(),
        resultUrl: data.resultUrl ?? null,
        resultNotes: data.resultNotes ?? null,
        rejectionReason: data.rejectionReason ?? null,
      })
      .where(eq(privacyRequests.id, data.requestId))
      .returning();

    if (updated) {
      const { logAdminAction } = await import("~/lib/audit");
      await logAdminAction({
        action: "PRIVACY_REQUEST_UPDATE",
        actorUserId: sessionUser.id,
        targetType: "privacy_request",
        targetId: updated.id,
      });
    }

    return updated ?? null;
  });

export const upsertRetentionPolicy = createServerFn({ method: "POST" })
  .inputValidator(zod$(upsertRetentionPolicySchema))
  .handler(async ({ data }) => {
    await assertFeatureEnabled("sin_admin_privacy");
    const sessionUser = await getSessionUser();
    if (!sessionUser?.id) return null;

    const { requireAdmin } = await import("~/lib/auth/utils/admin-check");
    await requireAdmin(sessionUser.id);

    const { getCurrentSession, requireRecentAuth } =
      await import("~/lib/auth/guards/step-up");
    const session = await getCurrentSession();
    await requireRecentAuth(sessionUser.id, session);

    const { getDb } = await import("~/db/server-helpers");
    const { retentionPolicies } = await import("~/db/schema");
    const { eq } = await import("drizzle-orm");

    const db = await getDb();
    const [existing] = await db
      .select()
      .from(retentionPolicies)
      .where(eq(retentionPolicies.dataType, data.dataType))
      .limit(1);

    if (existing) {
      const [updated] = await db
        .update(retentionPolicies)
        .set({
          retentionDays: data.retentionDays,
          archiveAfterDays: data.archiveAfterDays ?? null,
          purgeAfterDays: data.purgeAfterDays ?? null,
          legalHold: data.legalHold ?? existing.legalHold,
        })
        .where(eq(retentionPolicies.id, existing.id))
        .returning();

      return updated ?? null;
    }

    const [created] = await db
      .insert(retentionPolicies)
      .values({
        dataType: data.dataType,
        retentionDays: data.retentionDays,
        archiveAfterDays: data.archiveAfterDays ?? null,
        purgeAfterDays: data.purgeAfterDays ?? null,
        legalHold: data.legalHold ?? false,
      })
      .returning();

    return created ?? null;
  });

export const generatePrivacyExport = createServerFn({ method: "POST" })
  .inputValidator(zod$(generatePrivacyExportSchema))
  .handler(async ({ data }) => {
    await assertFeatureEnabled("sin_admin_privacy");
    const sessionUser = await getSessionUser();
    if (!sessionUser?.id) return null;

    const { requireAdmin } = await import("~/lib/auth/utils/admin-check");
    await requireAdmin(sessionUser.id);

    const { getCurrentSession, requireRecentAuth } =
      await import("~/lib/auth/guards/step-up");
    const currentSession = await getCurrentSession();
    await requireRecentAuth(sessionUser.id, currentSession);

    const { getDb } = await import("~/db/server-helpers");
    const {
      account,
      auditLogs,
      delegatedAccess,
      formSubmissionVersions,
      formSubmissions,
      notificationPreferences,
      notifications,
      organizationMembers,
      organizations,
      privacyRequests,
      reportingSubmissionHistory,
      reportingSubmissions,
      securityEvents,
      session,
      submissionFiles,
      twoFactor,
      user,
      userPolicyAcceptances,
      userRoles,
      verification,
      roles,
    } = await import("~/db/schema");
    const { and, eq, inArray, or } = await import("drizzle-orm");

    const db = await getDb();
    const [request] = await db
      .select()
      .from(privacyRequests)
      .where(eq(privacyRequests.id, data.requestId))
      .limit(1);

    if (!request) return null;
    const { badRequest } = await import("~/lib/server/errors");

    if (request.type !== "access" && request.type !== "export") {
      throw badRequest("Privacy export is only available for access or export requests.");
    }

    if (request.status === "completed" || request.status === "rejected") {
      throw badRequest("Privacy export has already been finalized for this request.");
    }

    await db
      .update(privacyRequests)
      .set({
        status: "processing",
        processedBy: sessionUser.id,
        processedAt: new Date(),
      })
      .where(eq(privacyRequests.id, data.requestId));

    const [userRecord] = await db
      .select()
      .from(user)
      .where(eq(user.id, request.userId))
      .limit(1);

    if (!userRecord) return null;

    const orgMemberships = await db
      .select()
      .from(organizationMembers)
      .where(eq(organizationMembers.userId, request.userId));
    const orgIds = orgMemberships.map((membership) => membership.organizationId);
    const orgRecords = orgIds.length
      ? await db.select().from(organizations).where(inArray(organizations.id, orgIds))
      : [];

    const delegated = await db
      .select()
      .from(delegatedAccess)
      .where(eq(delegatedAccess.delegateUserId, request.userId));

    const roleAssignments = await db
      .select({
        id: userRoles.id,
        roleId: userRoles.roleId,
        roleName: roles.name,
        teamId: userRoles.teamId,
        eventId: userRoles.eventId,
        assignedBy: userRoles.assignedBy,
        assignedAt: userRoles.assignedAt,
        expiresAt: userRoles.expiresAt,
        notes: userRoles.notes,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, request.userId));

    const submissions = await db
      .select()
      .from(formSubmissions)
      .where(eq(formSubmissions.submitterId, request.userId));
    const submissionIds = submissions.map((submission) => submission.id);
    const submissionVersions = submissionIds.length
      ? await db
          .select()
          .from(formSubmissionVersions)
          .where(inArray(formSubmissionVersions.submissionId, submissionIds))
      : [];
    const submissionFileRows = submissionIds.length
      ? await db
          .select()
          .from(submissionFiles)
          .where(inArray(submissionFiles.submissionId, submissionIds))
      : [];

    const reporting = await db
      .select()
      .from(reportingSubmissions)
      .where(eq(reportingSubmissions.submittedBy, request.userId));
    const reportingIds = reporting.map((item) => item.id);
    const reportingHistory = reportingIds.length
      ? await db
          .select()
          .from(reportingSubmissionHistory)
          .where(inArray(reportingSubmissionHistory.reportingSubmissionId, reportingIds))
      : [];

    const privacyRequestsByUser = await db
      .select()
      .from(privacyRequests)
      .where(eq(privacyRequests.userId, request.userId));
    const policyAcceptances = await db
      .select()
      .from(userPolicyAcceptances)
      .where(eq(userPolicyAcceptances.userId, request.userId));
    const userNotifications = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, request.userId));
    const userPreferences = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, request.userId));
    const security = await db
      .select()
      .from(securityEvents)
      .where(eq(securityEvents.userId, request.userId));

    const audit = await db
      .select()
      .from(auditLogs)
      .where(
        or(
          eq(auditLogs.actorUserId, request.userId),
          and(eq(auditLogs.targetType, "user"), eq(auditLogs.targetId, request.userId)),
        ),
      );

    const accounts = await db
      .select({
        id: account.id,
        accountId: account.accountId,
        providerId: account.providerId,
        userId: account.userId,
        scope: account.scope,
        accessTokenExpiresAt: account.accessTokenExpiresAt,
        refreshTokenExpiresAt: account.refreshTokenExpiresAt,
        createdAt: account.createdAt,
        updatedAt: account.updatedAt,
      })
      .from(account)
      .where(eq(account.userId, request.userId));
    const sessions = await db
      .select({
        id: session.id,
        userId: session.userId,
        expiresAt: session.expiresAt,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        lastActivityAt: session.lastActivityAt,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
      })
      .from(session)
      .where(eq(session.userId, request.userId));
    const twoFactorRows = await db
      .select({ id: twoFactor.id, userId: twoFactor.userId })
      .from(twoFactor)
      .where(eq(twoFactor.userId, request.userId));
    const verifications = await db
      .select({
        id: verification.id,
        identifier: verification.identifier,
        expiresAt: verification.expiresAt,
        createdAt: verification.createdAt,
        updatedAt: verification.updatedAt,
      })
      .from(verification)
      .where(eq(verification.identifier, userRecord.email));

    const exportPayload = {
      generatedAt: new Date().toISOString(),
      requestId: request.id,
      user: userRecord,
      organizations: orgRecords,
      organizationMemberships: orgMemberships,
      delegatedAccess: delegated,
      roleAssignments,
      accounts: accounts.map(toAccountExport),
      sessions: sessions.map(toSessionExport),
      twoFactor: twoFactorRows.map(toTwoFactorExport),
      verifications: verifications.map(toVerificationExport),
      policyAcceptances,
      privacyRequests: privacyRequestsByUser,
      notifications: userNotifications,
      notificationPreferences: userPreferences,
      securityEvents: security,
      auditLogs: audit,
      formSubmissions: submissions,
      formSubmissionVersions: submissionVersions,
      submissionFiles: submissionFileRows,
      reportingSubmissions: reporting,
      reportingSubmissionHistory: reportingHistory,
    };

    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    const { env } = await import("~/lib/env.server");
    const { getArtifactsBucketName, getS3Client } =
      await import("~/lib/storage/artifacts");

    const bucket = await getArtifactsBucketName();
    const storageKey = `privacy/exports/${request.userId}/${request.id}.json`;
    const client = await getS3Client();
    const expiresAt = new Date(Date.now() + DSAR_EXPORT_RETENTION_MS);
    const tagging = new URLSearchParams({
      dsar: "true",
      expiresAt: expiresAt.toISOString(),
      requestId: request.id,
      userId: request.userId,
    }).toString();
    const kmsKeyId = env.SIN_ARTIFACTS_KMS_KEY_ID;

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: storageKey,
        Body: JSON.stringify(exportPayload, null, 2),
        ContentType: "application/json",
        ServerSideEncryption: "aws:kms",
        ...(kmsKeyId ? { SSEKMSKeyId: kmsKeyId } : {}),
        Tagging: tagging,
        Metadata: {
          dsar: "true",
          "expires-at": expiresAt.toISOString(),
          "request-id": request.id,
          "user-id": request.userId,
        },
      }),
    );

    const resultUrl = `s3://${bucket}/${storageKey}`;

    const [updated] = await db
      .update(privacyRequests)
      .set({
        status: "completed",
        processedBy: sessionUser.id,
        processedAt: new Date(),
        resultUrl,
        resultExpiresAt: expiresAt,
        resultNotes: `Export generated and stored in SIN artifacts bucket (expires ${expiresAt.toISOString()}).`,
      })
      .where(eq(privacyRequests.id, data.requestId))
      .returning();

    if (updated) {
      const { logAdminAction } = await import("~/lib/audit");
      await logAdminAction({
        action: "PRIVACY_EXPORT_GENERATE",
        actorUserId: sessionUser.id,
        targetType: "privacy_request",
        targetId: updated.id,
        metadata: { storageKey, expiresAt: expiresAt.toISOString() },
      });
    }

    return updated ?? null;
  });

export const applyPrivacyErasure = createServerFn({ method: "POST" })
  .inputValidator(zod$(applyPrivacyErasureSchema))
  .handler(async ({ data }) => {
    await assertFeatureEnabled("sin_admin_privacy");
    const sessionUser = await getSessionUser();
    if (!sessionUser?.id) return null;

    const { requireAdmin } = await import("~/lib/auth/utils/admin-check");
    await requireAdmin(sessionUser.id);

    const { getCurrentSession, requireRecentAuth } =
      await import("~/lib/auth/guards/step-up");
    const currentSession = await getCurrentSession();
    await requireRecentAuth(sessionUser.id, currentSession);

    const { getDb } = await import("~/db/server-helpers");
    const {
      account,
      accountLocks,
      delegatedAccess,
      formSubmissionVersions,
      formSubmissions,
      notifications,
      notificationPreferences,
      organizationMembers,
      privacyRequests,
      reportingSubmissionHistory,
      reportingSubmissions,
      securityEvents,
      session,
      submissionFiles,
      twoFactor,
      user,
      userPolicyAcceptances,
      userRoles,
      verification,
    } = await import("~/db/schema");
    const { and, eq, inArray, isNull, not, or } = await import("drizzle-orm");

    const db = await getDb();
    const [request] = await db
      .select()
      .from(privacyRequests)
      .where(eq(privacyRequests.id, data.requestId))
      .limit(1);

    if (!request) return null;
    const { badRequest } = await import("~/lib/server/errors");

    if (request.type !== "erasure") {
      throw badRequest("Privacy erasure can only be applied to erasure requests.");
    }

    if (request.status === "completed" || request.status === "rejected") {
      throw badRequest("Privacy erasure has already been finalized for this request.");
    }

    // Mark request as processing early (so UI/admin can see it in-flight)
    await db
      .update(privacyRequests)
      .set({
        status: "processing",
        processedBy: sessionUser.id,
        processedAt: new Date(),
        resultNotes:
          "Processing erasure request (deleting stored artifacts and anonymizing user record).",
      })
      .where(eq(privacyRequests.id, data.requestId));

    const [userRecord] = await db
      .select({ email: user.email })
      .from(user)
      .where(eq(user.id, request.userId))
      .limit(1);

    const anonymizedEmail = `deleted+${request.userId}@example.invalid`;
    const normalizeStorageKey = (value: string | null | undefined) =>
      value ? value.trim().replace(/^\/+/, "") : "";
    let exportDeletion: {
      attempted: number;
      deleted: number;
      errors: Array<{ bucket: string; key: string; code?: string; message?: string }>;
    } = { attempted: 0, deleted: 0, errors: [] };

    try {
      const { DeleteObjectsCommand, ListObjectsV2Command } =
        await import("@aws-sdk/client-s3");
      const { getArtifactsBucketName, getS3Client } =
        await import("~/lib/storage/artifacts");

      const bucket = await getArtifactsBucketName();
      const client = await getS3Client();
      const exportPrefix = `privacy/exports/${request.userId}/`;
      const exportRefs: Array<{ bucket: string; key: string }> = [];

      let continuationToken: string | undefined;
      do {
        const response = await client.send(
          new ListObjectsV2Command({
            Bucket: bucket,
            Prefix: exportPrefix,
            ContinuationToken: continuationToken,
          }),
        );
        for (const item of response.Contents ?? []) {
          if (item.Key) {
            exportRefs.push({ bucket, key: item.Key });
          }
        }
        continuationToken = response.IsTruncated
          ? response.NextContinuationToken
          : undefined;
      } while (continuationToken);

      if (request.resultUrl?.startsWith("s3://")) {
        const [, rest] = request.resultUrl.split("s3://");
        const [bucketName, ...keyParts] = rest.split("/");
        const key = keyParts.join("/");
        if (bucketName && key) {
          const exists = exportRefs.some(
            (ref) => ref.bucket === bucketName && ref.key === key,
          );
          if (!exists) {
            exportRefs.push({ bucket: bucketName, key });
          }
        }
      }

      if (exportRefs.length) {
        const grouped = new Map<string, Set<string>>();
        for (const ref of exportRefs) {
          if (!grouped.has(ref.bucket)) grouped.set(ref.bucket, new Set());
          grouped.get(ref.bucket)!.add(ref.key);
        }

        for (const [targetBucket, keySet] of grouped.entries()) {
          const keys = Array.from(keySet);
          const batchSize = 1000;

          for (let i = 0; i < keys.length; i += batchSize) {
            const batch = keys.slice(i, i + batchSize);
            const response = await client.send(
              new DeleteObjectsCommand({
                Bucket: targetBucket,
                Delete: { Objects: batch.map((Key) => ({ Key })), Quiet: true },
              }),
            );

            exportDeletion.attempted += batch.length;
            exportDeletion.deleted += response.Deleted?.length ?? 0;

            for (const err of response.Errors ?? []) {
              if (!err.Key) continue;
              exportDeletion.errors.push({
                bucket: targetBucket,
                key: err.Key,
                ...(err.Code ? { code: err.Code } : {}),
                ...(err.Message ? { message: err.Message } : {}),
              });
            }
          }
        }
      }
    } catch (error) {
      exportDeletion = {
        attempted: 0,
        deleted: 0,
        errors: [
          {
            bucket: "unknown",
            key: `privacy/exports/${request.userId}/`,
            message: error instanceof Error ? error.message : "Unknown error",
          },
        ],
      };
    }
    const shouldClearExportLinks = exportDeletion.errors.length === 0;

    // ISSUE 06 FIX: Find submission files tied to this user and delete S3 objects first.
    const userSubmissions = await db
      .select({ id: formSubmissions.id })
      .from(formSubmissions)
      .where(eq(formSubmissions.submitterId, request.userId));
    const submissionIds = userSubmissions.map((row) => row.id);

    const fileConditions = [eq(submissionFiles.uploadedBy, request.userId)];
    if (submissionIds.length) {
      fileConditions.push(inArray(submissionFiles.submissionId, submissionIds));
    }

    const fileWhere =
      fileConditions.length === 1 ? fileConditions[0] : or(...fileConditions);

    const filesToErase = fileWhere
      ? await db.select().from(submissionFiles).where(fileWhere)
      : [];

    let erasedFilesAttempted = 0;
    let erasedFilesDeleted = 0;
    let erasedFilesFailed = 0;
    const deletableSubmissionFileIds: string[] = [];
    if (filesToErase.length) {
      const { deleteFormSubmissionFiles } =
        await import("~/lib/privacy/submission-files");
      const result = await deleteFormSubmissionFiles({
        items: filesToErase,
        throwOnErrors: false,
      });
      erasedFilesAttempted = result.attempted;
      erasedFilesDeleted = result.deleted;
      erasedFilesFailed = result.errors.length;

      const failedKeys = new Set(result.errors.map((entry) => entry.key));
      for (const file of filesToErase) {
        const key = normalizeStorageKey(file.storageKey);
        if (key && !failedKeys.has(key)) {
          deletableSubmissionFileIds.push(file.id);
        }
      }
    }

    await db.transaction(async (tx) => {
      await tx
        .update(user)
        .set({
          name: "Deleted User",
          email: anonymizedEmail,
          image: null,
          profileComplete: false,
          dateOfBirth: null,
          emergencyContact: null,
          gender: null,
          pronouns: null,
          phone: null,
          privacySettings: null,
          mfaRequired: false,
          mfaEnrolledAt: null,
          twoFactorEnabled: false,
        })
        .where(eq(user.id, request.userId));

      await tx.delete(account).where(eq(account.userId, request.userId));
      await tx.delete(session).where(eq(session.userId, request.userId));
      await tx.delete(twoFactor).where(eq(twoFactor.userId, request.userId));
      await tx.delete(userRoles).where(eq(userRoles.userId, request.userId));
      await tx
        .delete(userPolicyAcceptances)
        .where(eq(userPolicyAcceptances.userId, request.userId));
      await tx.delete(notifications).where(eq(notifications.userId, request.userId));
      await tx
        .delete(notificationPreferences)
        .where(eq(notificationPreferences.userId, request.userId));
      await tx.delete(accountLocks).where(eq(accountLocks.userId, request.userId));
      await tx
        .update(securityEvents)
        .set({ userId: null })
        .where(eq(securityEvents.userId, request.userId));

      if (userRecord?.email) {
        await tx
          .delete(verification)
          .where(eq(verification.identifier, userRecord.email));
      }

      await tx
        .update(organizationMembers)
        .set({ status: "removed" })
        .where(eq(organizationMembers.userId, request.userId));

      await tx
        .update(delegatedAccess)
        .set({
          revokedAt: new Date(),
          revokedBy: sessionUser.id,
          notes: data.reason ?? "DSAR erasure request",
        })
        .where(eq(delegatedAccess.delegateUserId, request.userId));

      await tx
        .update(formSubmissions)
        .set({ submitterId: null })
        .where(eq(formSubmissions.submitterId, request.userId));
      await tx
        .update(formSubmissionVersions)
        .set({ changedBy: null })
        .where(eq(formSubmissionVersions.changedBy, request.userId));

      // Files are deleted from S3, so remove their DB rows to avoid dangling pointers / metadata retention
      if (deletableSubmissionFileIds.length) {
        await tx
          .delete(submissionFiles)
          .where(inArray(submissionFiles.id, deletableSubmissionFileIds));
      }

      await tx
        .update(reportingSubmissions)
        .set({ submittedBy: null })
        .where(eq(reportingSubmissions.submittedBy, request.userId));
      await tx
        .update(reportingSubmissionHistory)
        .set({ actorId: null })
        .where(eq(reportingSubmissionHistory.actorId, request.userId));

      if (shouldClearExportLinks) {
        await tx
          .update(privacyRequests)
          .set({ resultUrl: null, resultExpiresAt: null })
          .where(
            and(
              eq(privacyRequests.userId, request.userId),
              not(isNull(privacyRequests.resultUrl)),
            ),
          );
      }

      await tx
        .update(privacyRequests)
        .set({
          status: "completed",
          processedBy: sessionUser.id,
          processedAt: new Date(),
          resultUrl: null,
          resultExpiresAt: null,
          resultNotes:
            (data.reason ?? "User data anonymized per DSAR request.") +
            ` Removed ${erasedFilesDeleted}/${erasedFilesAttempted} file artifact(s) from object storage.` +
            ` Removed ${exportDeletion.deleted}/${exportDeletion.attempted} DSAR export object(s).` +
            (erasedFilesFailed > 0 || exportDeletion.errors.length > 0
              ? " Some artifacts could not be removed and require follow-up."
              : ""),
        })
        .where(eq(privacyRequests.id, data.requestId));
    });

    const { logAdminAction } = await import("~/lib/audit");
    await logAdminAction({
      action: "PRIVACY_ERASURE_APPLY",
      actorUserId: sessionUser.id,
      targetType: "privacy_request",
      targetId: request.id,
      metadata: {
        userId: request.userId,
        reason: data.reason ?? null,
        erasedFilesAttempted,
        erasedFilesDeleted,
        erasedFilesFailed,
        exportDeletionAttempted: exportDeletion.attempted,
        exportDeletionDeleted: exportDeletion.deleted,
        exportDeletionErrors: exportDeletion.errors.length,
      },
    });

    return { success: true };
  });

export const applyPrivacyCorrection = createServerFn({ method: "POST" })
  .inputValidator(zod$(applyPrivacyCorrectionSchema))
  .handler(async ({ data }) => {
    await assertFeatureEnabled("sin_admin_privacy");
    const sessionUser = await getSessionUser();
    if (!sessionUser?.id) return null;

    const { requireAdmin } = await import("~/lib/auth/utils/admin-check");
    await requireAdmin(sessionUser.id);

    const { getCurrentSession, requireRecentAuth } =
      await import("~/lib/auth/guards/step-up");
    const currentSession = await getCurrentSession();
    await requireRecentAuth(sessionUser.id, currentSession);

    const { getDb } = await import("~/db/server-helpers");
    const { privacyRequests, user } = await import("~/db/schema");
    const { eq, sql } = await import("drizzle-orm");
    const { badRequest } = await import("~/lib/server/errors");

    const db = await getDb();
    const [request] = await db
      .select()
      .from(privacyRequests)
      .where(eq(privacyRequests.id, data.requestId))
      .limit(1);

    if (!request) return null;

    if (request.type !== "correction") {
      throw badRequest("Privacy correction can only be applied to correction requests.");
    }

    if (request.status === "completed" || request.status === "rejected") {
      throw badRequest("Privacy correction has already been finalized for this request.");
    }

    const [beforeUser] = await db
      .select()
      .from(user)
      .where(eq(user.id, request.userId))
      .limit(1);

    if (!beforeUser) {
      throw badRequest("User not found for privacy correction.");
    }

    const updateData: Record<string, unknown> = {};
    const corrections = data.corrections;

    if (corrections.name && corrections.name.trim()) {
      updateData["name"] = corrections.name.trim();
    }
    if (corrections.email && corrections.email.trim()) {
      updateData["email"] = corrections.email.trim();
    }
    if (corrections.dateOfBirth && corrections.dateOfBirth.trim()) {
      const parsed = new Date(corrections.dateOfBirth);
      if (Number.isNaN(parsed.getTime())) {
        throw badRequest("Invalid date of birth for privacy correction.");
      }
      updateData["dateOfBirth"] = parsed;
    }
    if (corrections.emergencyContact !== undefined) {
      updateData["emergencyContact"] = JSON.stringify(corrections.emergencyContact);
    }
    if (corrections.gender && corrections.gender.trim()) {
      updateData["gender"] = corrections.gender.trim();
    }
    if (corrections.pronouns && corrections.pronouns.trim()) {
      updateData["pronouns"] = corrections.pronouns.trim();
    }
    if (corrections.phone && corrections.phone.trim()) {
      updateData["phone"] = corrections.phone.trim();
    }
    if (corrections.privacySettings !== undefined) {
      updateData["privacySettings"] = JSON.stringify(corrections.privacySettings);
    }

    if (Object.keys(updateData).length === 0) {
      throw badRequest("No corrections provided.");
    }

    const now = new Date();
    updateData["updatedAt"] = now;

    const profileFields = [
      "dateOfBirth",
      "emergencyContact",
      "gender",
      "pronouns",
      "phone",
      "privacySettings",
    ];
    if (profileFields.some((field) => field in updateData)) {
      updateData["profileUpdatedAt"] = now;
      updateData["profileVersion"] = sql`${user.profileVersion} + 1`;
    }

    const { createAuditDiff, logAdminAction } = await import("~/lib/audit");

    const parseJson = <T>(value: string | null): T | null => {
      if (!value) return null;
      try {
        return JSON.parse(value) as T;
      } catch {
        return null;
      }
    };

    const normalizeUser = (record: typeof beforeUser) => ({
      ...record,
      emergencyContact: parseJson(record.emergencyContact),
      privacySettings: parseJson(record.privacySettings),
    });

    const updatedUser = await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(user)
        .set(updateData)
        .where(eq(user.id, request.userId))
        .returning();

      if (!updated) {
        throw badRequest("Failed to apply privacy correction.");
      }

      await tx
        .update(privacyRequests)
        .set({
          status: "completed",
          processedBy: sessionUser.id,
          processedAt: now,
          resultNotes: data.notes ?? "Privacy correction applied.",
        })
        .where(eq(privacyRequests.id, data.requestId));

      return updated;
    });

    const changes = await createAuditDiff(
      normalizeUser(beforeUser),
      normalizeUser(updatedUser),
    );

    await logAdminAction({
      action: "PRIVACY_CORRECTION_APPLY",
      actorUserId: sessionUser.id,
      targetType: "user",
      targetId: request.userId,
      changes,
      metadata: {
        requestId: request.id,
        notes: data.notes ?? null,
      },
    });

    return { success: true };
  });

export const createLegalHold = createServerFn({ method: "POST" })
  .inputValidator(zod$(createLegalHoldSchema))
  .handler(async ({ data }) => {
    await assertFeatureEnabled("sin_admin_privacy");
    const sessionUser = await getSessionUser();
    if (!sessionUser?.id) return null;

    const { requireAdmin } = await import("~/lib/auth/utils/admin-check");
    await requireAdmin(sessionUser.id);

    const { getCurrentSession, requireRecentAuth } =
      await import("~/lib/auth/guards/step-up");
    const currentSession = await getCurrentSession();
    await requireRecentAuth(sessionUser.id, currentSession);

    const { getDb } = await import("~/db/server-helpers");
    const { legalHolds } = await import("~/db/schema");
    const db = await getDb();

    const [created] = await db
      .insert(legalHolds)
      .values({
        scopeType: data.scopeType,
        scopeId: data.scopeId,
        dataType: data.dataType ?? null,
        reason: data.reason,
        appliedBy: sessionUser.id,
        appliedAt: new Date(),
      })
      .returning();

    if (created) {
      const { logAdminAction } = await import("~/lib/audit");
      await logAdminAction({
        action: "LEGAL_HOLD_CREATE",
        actorUserId: sessionUser.id,
        targetType: "legal_hold",
        targetId: created.id,
        metadata: {
          scopeType: created.scopeType,
          scopeId: created.scopeId,
          dataType: created.dataType ?? null,
          reason: created.reason,
        },
      });
    }

    return created ?? null;
  });

export const releaseLegalHold = createServerFn({ method: "POST" })
  .inputValidator(zod$(releaseLegalHoldSchema))
  .handler(async ({ data }) => {
    await assertFeatureEnabled("sin_admin_privacy");
    const sessionUser = await getSessionUser();
    if (!sessionUser?.id) return null;

    const { requireAdmin } = await import("~/lib/auth/utils/admin-check");
    await requireAdmin(sessionUser.id);

    const { getCurrentSession, requireRecentAuth } =
      await import("~/lib/auth/guards/step-up");
    const currentSession = await getCurrentSession();
    await requireRecentAuth(sessionUser.id, currentSession);

    const { getDb } = await import("~/db/server-helpers");
    const { legalHolds } = await import("~/db/schema");
    const { eq } = await import("drizzle-orm");
    const { badRequest } = await import("~/lib/server/errors");

    const db = await getDb();
    const [hold] = await db
      .select()
      .from(legalHolds)
      .where(eq(legalHolds.id, data.holdId))
      .limit(1);

    if (!hold) return null;

    if (hold.releasedAt) {
      throw badRequest("Legal hold is already released.");
    }

    const [updated] = await db
      .update(legalHolds)
      .set({
        releasedBy: sessionUser.id,
        releasedAt: new Date(),
      })
      .where(eq(legalHolds.id, data.holdId))
      .returning();

    if (updated) {
      const { logAdminAction } = await import("~/lib/audit");
      await logAdminAction({
        action: "LEGAL_HOLD_RELEASE",
        actorUserId: sessionUser.id,
        targetType: "legal_hold",
        targetId: updated.id,
        metadata: {
          scopeType: updated.scopeType,
          scopeId: updated.scopeId,
          dataType: updated.dataType ?? null,
          releaseReason: data.reason ?? null,
        },
      });
    }

    return updated ?? null;
  });
