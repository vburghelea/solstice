import { createServerFn } from "@tanstack/react-start";
import { zod$ } from "~/lib/server/fn-utils";
import {
  acceptPolicySchema,
  applyPrivacyErasureSchema,
  createPolicyDocumentSchema,
  createPrivacyRequestSchema,
  generatePrivacyExportSchema,
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

export const createPolicyDocument = createServerFn({ method: "POST" })
  .inputValidator(zod$(createPolicyDocumentSchema))
  .handler(async ({ data }) => {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.id) return null;

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
    const sessionUser = await getSessionUser();
    if (!sessionUser?.id) return null;

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
    const sessionUser = await getSessionUser();
    if (!sessionUser?.id) return null;

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
    const sessionUser = await getSessionUser();
    if (!sessionUser?.id) return null;

    const { requireAdmin } = await import("~/lib/auth/utils/admin-check");
    await requireAdmin(sessionUser.id);

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
      .select()
      .from(account)
      .where(eq(account.userId, request.userId));
    const sessions = await db
      .select()
      .from(session)
      .where(eq(session.userId, request.userId));
    const twoFactorRows = await db
      .select()
      .from(twoFactor)
      .where(eq(twoFactor.userId, request.userId));
    const verifications = await db
      .select()
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
      accounts,
      sessions,
      twoFactor: twoFactorRows,
      verifications,
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
    const { getArtifactsBucketName, getS3Client } =
      await import("~/lib/storage/artifacts");

    const bucket = await getArtifactsBucketName();
    const storageKey = `privacy/exports/${request.userId}/${request.id}.json`;
    const client = await getS3Client();

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: storageKey,
        Body: JSON.stringify(exportPayload, null, 2),
        ContentType: "application/json",
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
        resultNotes: "Export generated and stored in SIN artifacts bucket.",
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
        metadata: { storageKey },
      });
    }

    return updated ?? null;
  });

export const applyPrivacyErasure = createServerFn({ method: "POST" })
  .inputValidator(zod$(applyPrivacyErasureSchema))
  .handler(async ({ data }) => {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.id) return null;

    const { requireAdmin } = await import("~/lib/auth/utils/admin-check");
    await requireAdmin(sessionUser.id);

    const { getDb } = await import("~/db/server-helpers");
    const {
      account,
      accountLocks,
      delegatedAccess,
      formSubmissionVersions,
      formSubmissions,
      notifications,
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
    const { eq, inArray, or } = await import("drizzle-orm");

    const db = await getDb();
    const [request] = await db
      .select()
      .from(privacyRequests)
      .where(eq(privacyRequests.id, data.requestId))
      .limit(1);

    if (!request) return null;

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
    if (filesToErase.length) {
      const { deleteFormSubmissionFiles } =
        await import("~/lib/privacy/submission-files");
      const result = await deleteFormSubmissionFiles({ items: filesToErase });
      erasedFilesAttempted = result.attempted;
      erasedFilesDeleted = result.deleted;
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
      if (filesToErase.length) {
        await tx.delete(submissionFiles).where(
          inArray(
            submissionFiles.id,
            filesToErase.map((row) => row.id),
          ),
        );
      }

      await tx
        .update(reportingSubmissions)
        .set({ submittedBy: null })
        .where(eq(reportingSubmissions.submittedBy, request.userId));
      await tx
        .update(reportingSubmissionHistory)
        .set({ actorId: null })
        .where(eq(reportingSubmissionHistory.actorId, request.userId));

      await tx
        .update(privacyRequests)
        .set({
          status: "completed",
          processedBy: sessionUser.id,
          processedAt: new Date(),
          resultNotes:
            (data.reason ?? "User data anonymized per DSAR request.") +
            ` Removed ${erasedFilesDeleted}/${erasedFilesAttempted} file artifact(s) from object storage.`,
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
      },
    });

    return { success: true };
  });
