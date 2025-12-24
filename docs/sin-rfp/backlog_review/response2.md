Below is a concrete, “drop-in” implementation plan (with patches) for Issues 05, 06, 09 using the files you included.

I’m making the smallest set of changes that:
• preserves audit log immutability (hash chain stays verifiable),
• ensures DSAR/retention actually remove S3 upload artifacts (not just DB rows),
• replaces the notification SQS + SES stubs with real implementations (plus sane retry/idempotency).

⸻

Issue 05 — Retention deletes audit logs, breaking immutability (HIGH)

What changes
• Retention job will never delete audit_logs (even if a retention policy exists).
• applyRetentionPolicies() returns skipped: immutable_audit_log for that data type.

Patch: src/lib/privacy/retention.ts (full replacement)

This also includes Issue 06 fixes (S3 cleanup) because they belong in the same job.

import { createServerOnlyFn } from "@tanstack/react-start";

type RetentionResult = {
dataType: string;
status: "purged" | "skipped";
reason?: string;
deletedCount?: number;
};

const DAY*MS = 24 * 60 \_ 60 \* 1000;

const IMMUTABLE_TYPES = new Set([
"audit_logs",
"audit_log",
"auditlog",
"audit",
]);

export const applyRetentionPolicies = createServerOnlyFn(async () => {
const { getDb } = await import("~/db/server-helpers");
const {
formSubmissionVersions,
formSubmissions,
importJobErrors,
importJobs,
notifications,
privacyRequests,
retentionPolicies,
securityEvents,
submissionFiles,
} = await import("~/db/schema");
const { inArray, lt } = await import("drizzle-orm");

const db = await getDb();
const policies = await db.select().from(retentionPolicies);
const results: RetentionResult[] = [];

for (const policy of policies) {
const dataType = policy.dataType.trim().toLowerCase();

    // ISSUE 05 FIX: Never purge audit logs; hash-chain immutability depends on it.
    if (IMMUTABLE_TYPES.has(dataType)) {
      results.push({
        dataType,
        status: "skipped",
        reason: "immutable_audit_log",
      });
      continue;
    }

    if (policy.legalHold) {
      results.push({ dataType, status: "skipped", reason: "legal_hold" });
      continue;
    }

    // NOTE: allow purgeAfterDays=0 (immediate) by checking null/undefined explicitly
    if (policy.purgeAfterDays === null || policy.purgeAfterDays === undefined) {
      results.push({ dataType, status: "skipped", reason: "no_purge_policy" });
      continue;
    }

    const cutoff = new Date(Date.now() - policy.purgeAfterDays * DAY_MS);
    let deletedCount = 0;

    try {
      switch (dataType) {
        // ISSUE 06 FIX (part 1): If we purge submissions, we must delete their S3 files first.
        case "form_submissions":
        case "submissions": {
          const batchSize = 200;

          while (true) {
            const submissionBatch = await db
              .select({ id: formSubmissions.id })
              .from(formSubmissions)
              .where(lt(formSubmissions.createdAt, cutoff))
              .limit(batchSize);

            if (submissionBatch.length === 0) break;

            const submissionIds = submissionBatch.map((row) => row.id);

            // Delete associated submission_files S3 objects BEFORE DB deletion
            const fileRows = await db
              .select()
              .from(submissionFiles)
              .where(inArray(submissionFiles.submissionId, submissionIds));

            if (fileRows.length) {
              const { deleteFormSubmissionFiles } = await import(
                "~/lib/privacy/submission-files"
              );
              await deleteFormSubmissionFiles({ items: fileRows });
            }

            // Delete file rows explicitly (don't rely on cascades, they skip S3 cleanup)
            await db
              .delete(submissionFiles)
              .where(inArray(submissionFiles.submissionId, submissionIds));

            const deleted = await db
              .delete(formSubmissions)
              .where(inArray(formSubmissions.id, submissionIds))
              .returning({ id: formSubmissions.id });

            if (deleted.length === 0) {
              throw new Error(
                "Retention purge made no progress deleting form_submissions; aborting to avoid infinite loop.",
              );
            }

            deletedCount += deleted.length;
          }

          break;
        }

        case "form_submission_versions": {
          const deleted = await db
            .delete(formSubmissionVersions)
            .where(lt(formSubmissionVersions.createdAt, cutoff))
            .returning({ id: formSubmissionVersions.id });
          deletedCount = deleted.length;
          break;
        }

        // ISSUE 06 FIX (part 2): Purging submission_files must delete S3 objects too.
        case "submission_files": {
          const batchSize = 500;

          while (true) {
            const fileBatch = await db
              .select()
              .from(submissionFiles)
              .where(lt(submissionFiles.createdAt, cutoff))
              .limit(batchSize);

            if (fileBatch.length === 0) break;

            const { deleteFormSubmissionFiles } = await import(
              "~/lib/privacy/submission-files"
            );
            await deleteFormSubmissionFiles({ items: fileBatch });

            const ids = fileBatch.map((row) => row.id);

            const deleted = await db
              .delete(submissionFiles)
              .where(inArray(submissionFiles.id, ids))
              .returning({ id: submissionFiles.id });

            if (deleted.length === 0) {
              throw new Error(
                "Retention purge made no progress deleting submission_files; aborting to avoid infinite loop.",
              );
            }

            deletedCount += deleted.length;
          }

          break;
        }

        case "notifications": {
          const deleted = await db
            .delete(notifications)
            .where(lt(notifications.createdAt, cutoff))
            .returning({ id: notifications.id });
          deletedCount = deleted.length;
          break;
        }

        case "security_events": {
          const deleted = await db
            .delete(securityEvents)
            .where(lt(securityEvents.createdAt, cutoff))
            .returning({ id: securityEvents.id });
          deletedCount = deleted.length;
          break;
        }

        case "import_jobs": {
          const deleted = await db
            .delete(importJobs)
            .where(lt(importJobs.createdAt, cutoff))
            .returning({ id: importJobs.id });
          deletedCount = deleted.length;
          break;
        }

        case "import_job_errors": {
          const deleted = await db
            .delete(importJobErrors)
            .where(lt(importJobErrors.createdAt, cutoff))
            .returning({ id: importJobErrors.id });
          deletedCount = deleted.length;
          break;
        }

        case "privacy_requests": {
          const deleted = await db
            .delete(privacyRequests)
            .where(lt(privacyRequests.createdAt, cutoff))
            .returning({ id: privacyRequests.id });
          deletedCount = deleted.length;
          break;
        }

        default:
          results.push({
            dataType,
            status: "skipped",
            reason: "unsupported_data_type",
          });
          continue;
      }

      results.push({ dataType, status: "purged", deletedCount });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      results.push({ dataType, status: "skipped", reason: message });
    }

}

return { status: "completed", results };
});

export const runRetentionJob = applyRetentionPolicies;

⸻

Issue 06 — DSAR erasure and retention don’t remove S3 artifacts (HIGH)

What changes 1. Add a shared S3 deletion helper that can accept submission file rows or strings and delete objects in batches (up to 1000 per request). 2. Update DSAR erasure to:
• discover relevant submission file rows,
• delete their S3 objects first (so we don’t orphan artifacts),
• then delete the submissionFiles DB rows (so we don’t keep file metadata).

New file: src/lib/privacy/submission-files.ts

import { createServerOnlyFn } from "@tanstack/react-start";

type DeleteResult = {
attempted: number;
deleted: number;
errors: Array<{ bucket: string; key: string; code?: string; message?: string }>;
};

type SubmissionFileS3Like = {
bucket?: string | null;
key?: string | null;

// common patterns we might already have in the table
storageKey?: string | null;
s3Key?: string | null;
url?: string | null;
location?: string | null;
};

const normalizeKey = (value: string) => value.trim().replace(/^\/+/, "");

const parseS3Pointer = (value: string): { bucket: string; key: string } | null => {
const trimmed = value.trim();

if (trimmed.startsWith("s3://")) {
const rest = trimmed.slice("s3://".length);
const [bucket, ...keyParts] = rest.split("/");
const key = keyParts.join("/");
if (!bucket || !key) return null;
return { bucket, key };
}

if (trimmed.startsWith("arn:aws:s3:::")) {
const rest = trimmed.slice("arn:aws:s3:::".length);
const [bucket, ...keyParts] = rest.split("/");
const key = keyParts.join("/");
if (!bucket || !key) return null;
return { bucket, key };
}

return null;
};

const getString = (value: unknown) =>
typeof value === "string" && value.trim().length ? value.trim() : null;

const resolveS3Ref = (
item: unknown,
defaultBucket: string,
): { bucket: string; key: string } | null => {
if (typeof item === "string") {
const parsed = parseS3Pointer(item);
if (parsed) return parsed;

    const key = normalizeKey(item);
    return key ? { bucket: defaultBucket, key } : null;

}

if (!item || typeof item !== "object") return null;
const obj = item as SubmissionFileS3Like;

const bucket = getString(obj.bucket) ?? defaultBucket;

const directKey = getString(obj.key);
if (directKey) {
const key = normalizeKey(directKey);
return key ? { bucket, key } : null;
}

const candidate =
getString(obj.storageKey) ??
getString(obj.s3Key) ??
getString(obj.url) ??
getString(obj.location);

if (!candidate) return null;

const parsed = parseS3Pointer(candidate);
if (parsed) return parsed;

const key = normalizeKey(candidate);
return key ? { bucket, key } : null;
};

export const deleteFormSubmissionFiles = createServerOnlyFn(
async (params: {
items: unknown[];
defaultBucket?: string;
throwOnErrors?: boolean;
}): Promise<DeleteResult> => {
const { DeleteObjectsCommand } = await import("@aws-sdk/client-s3");
const { getArtifactsBucketName, getS3Client } = await import("~/lib/storage/artifacts");

    const defaultBucket = params.defaultBucket ?? (await getArtifactsBucketName());
    const throwOnErrors = params.throwOnErrors ?? true;

    const refs = params.items
      .map((item) => resolveS3Ref(item, defaultBucket))
      .filter(Boolean) as Array<{ bucket: string; key: string }>;

    if (refs.length === 0) return { attempted: 0, deleted: 0, errors: [] };

    // de-dupe + group by bucket
    const grouped = new Map<string, Set<string>>();
    for (const ref of refs) {
      if (!grouped.has(ref.bucket)) grouped.set(ref.bucket, new Set());
      grouped.get(ref.bucket)!.add(ref.key);
    }

    const client = await getS3Client();

    let deleted = 0;
    const errors: DeleteResult["errors"] = [];

    for (const [bucket, keySet] of grouped.entries()) {
      const keys = Array.from(keySet);
      const batchSize = 1000;

      for (let i = 0; i < keys.length; i += batchSize) {
        const batch = keys.slice(i, i + batchSize);

        const resp = await client.send(
          new DeleteObjectsCommand({
            Bucket: bucket,
            Delete: { Objects: batch.map((Key) => ({ Key })), Quiet: true },
          }),
        );

        deleted += resp.Deleted?.length ?? 0;

        for (const err of resp.Errors ?? []) {
          if (!err.Key) continue;
          errors.push({ bucket, key: err.Key, code: err.Code, message: err.Message });
        }
      }
    }

    if (errors.length && throwOnErrors) {
      const example = errors[0]!;
      throw new Error(
        `Failed to delete ${errors.length} S3 object(s) (e.g., s3://${example.bucket}/${example.key} ${example.code ?? ""})`,
      );
    }

    return { attempted: refs.length, deleted, errors };

},
);

Important assumption: your submissionFiles rows contain either a usable S3 pointer (s3://bucket/key) or an object key string.
If your upload bucket is not SIN_ARTIFACTS_BUCKET, pass defaultBucket or update the helper to use your uploads bucket env var.

⸻

Patch: DSAR erasure — src/features/privacy/privacy.mutations.ts (replace only applyPrivacyErasure)

This version deletes S3 artifacts before it detaches relationships / deletes rows, which avoids the “we anonymized the DB and can’t find the S3 keys anymore” failure mode.

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

- const { eq } = await import("drizzle-orm");

* const { eq, inArray, or } = await import("drizzle-orm");

  const db = await getDb();
  const [request] = await db
  .select()
  .from(privacyRequests)
  .where(eq(privacyRequests.id, data.requestId))
  .limit(1);

  if (!request) return null;

* // Mark request as processing early (so UI/admin can see it in-flight)
* await db
*      .update(privacyRequests)
*      .set({
*        status: "processing",
*        processedBy: sessionUser.id,
*        processedAt: new Date(),
*        resultNotes:
*          "Processing erasure request (deleting stored artifacts and anonymizing user record).",
*      })
*      .where(eq(privacyRequests.id, data.requestId));

  const [userRecord] = await db
  .select({ email: user.email })
  .from(user)
  .where(eq(user.id, request.userId))
  .limit(1);

  const anonymizedEmail = `deleted+${request.userId}@example.invalid`;

* // ISSUE 06 FIX: Find submission files tied to this user and delete S3 objects first.
* const userSubmissions = await db
*      .select({ id: formSubmissions.id })
*      .from(formSubmissions)
*      .where(eq(formSubmissions.submitterId, request.userId));
* const submissionIds = userSubmissions.map((row) => row.id);
*
* const fileConditions = [eq(submissionFiles.uploadedBy, request.userId)];
* if (submissionIds.length) {
*      fileConditions.push(inArray(submissionFiles.submissionId, submissionIds));
* }
*
* const fileWhere =
*      fileConditions.length === 1 ? fileConditions[0] : or(...fileConditions);
*
* const filesToErase = await db.select().from(submissionFiles).where(fileWhere);
*
* let erasedFilesAttempted = 0;
* let erasedFilesDeleted = 0;
* if (filesToErase.length) {
*      const { deleteFormSubmissionFiles } = await import("~/lib/privacy/submission-files");
*      const result = await deleteFormSubmissionFiles({ items: filesToErase });
*      erasedFilesAttempted = result.attempted;
*      erasedFilesDeleted = result.deleted;
* }

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
  await tx.delete(userPolicyAcceptances).where(eq(userPolicyAcceptances.userId, request.userId));
  await tx.delete(notifications).where(eq(notifications.userId, request.userId));
  await tx.delete(accountLocks).where(eq(accountLocks.userId, request.userId));
  await tx.update(securityEvents).set({ userId: null }).where(eq(securityEvents.userId, request.userId));

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

-      await tx
-        .update(submissionFiles)
-        .set({ uploadedBy: null })
-        .where(eq(submissionFiles.uploadedBy, request.userId));

*      // Files are deleted from S3, so remove their DB rows to avoid dangling pointers / metadata retention
*      if (filesToErase.length) {
*        await tx
*          .delete(submissionFiles)
*          .where(inArray(submissionFiles.id, filesToErase.map((row) => row.id)));
*      }

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

-          resultNotes: data.reason ?? "User data anonymized per DSAR request.",

*          resultNotes:
*            (data.reason ?? "User data anonymized per DSAR request.") +
*            ` Removed ${erasedFilesDeleted}/${erasedFilesAttempted} file artifact(s) from object storage.`,
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

*        erasedFilesAttempted,
*        erasedFilesDeleted,
       },

  });

  return { success: true };
  });

⸻

Issue 09 — Notification queue and email delivery are stubbed (MEDIUM)

What changes
• enqueueNotification() now:
• generates a stable notificationId (UUID),
• enqueues to SQS when SIN_NOTIFICATIONS_QUEUE_URL is configured,
• falls back to direct send when it’s not configured (dev-friendly).
• sendNotification() now:
• writes an in-app notification idempotently (via stable notificationId),
• sends email via SES for emailFrequency === "immediate",
• includes a small retry loop for SES transient failures,
• marks emailSentAt in notification metadata to avoid double-sends on retries.

Patch: src/lib/notifications/queue.ts (full replacement)

import { createServerOnlyFn } from "@tanstack/react-start";
import { sendNotification, type NotificationDispatch } from "./send";

type EnqueueResult =
| { mode: "direct"; inApp: boolean; email: boolean; notificationId: string }
| { mode: "sqs"; queued: true; messageId: string | null; notificationId: string };

export const enqueueNotification = createServerOnlyFn(
async (payload: NotificationDispatch): Promise<EnqueueResult> => {
const { randomUUID } = await import("crypto");

    const notificationId = payload.notificationId ?? randomUUID();
    const enriched: NotificationDispatch = {
      ...payload,
      notificationId,
      metadata: {
        ...(payload.metadata ?? {}),
        notificationId,
      },
    };

    const queueUrl = process.env["SIN_NOTIFICATIONS_QUEUE_URL"];
    if (!queueUrl) {
      const result = await sendNotification(enriched);
      return { mode: "direct", ...result, notificationId };
    }

    const region = process.env["AWS_REGION"] ?? "ca-central-1";
    const { SQSClient, SendMessageCommand } = await import("@aws-sdk/client-sqs");

    const client = new SQSClient({ region });
    const body = JSON.stringify(enriched);

    const isFifo = queueUrl.endsWith(".fifo");
    const input: Record<string, unknown> = {
      QueueUrl: queueUrl,
      MessageBody: body,
    };

    if (isFifo) {
      // Required for FIFO
      input["MessageGroupId"] = enriched.userId;
      // Deterministic dedupe id => suppress duplicates within SQS FIFO dedupe window
      input["MessageDeduplicationId"] = notificationId;
    }

    const resp = await client.send(new SendMessageCommand(input as any));
    return { mode: "sqs", queued: true, messageId: resp.MessageId ?? null, notificationId };

},
);

Patch: src/lib/notifications/send.ts (full replacement)

import { createServerOnlyFn } from "@tanstack/react-start";
import type { JsonRecord } from "~/shared/lib/json";

export type NotificationDispatch = {
// stable id for idempotency across retries
notificationId?: string;

userId: string;
organizationId?: string | null;
type: string;
category: string;
title: string;
body: string;
link?: string | null;
metadata?: JsonRecord;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isRetryableSesError = (error: unknown) => {
const err = error as any;
const code = err?.name ?? err?.Code ?? null;
const status = err?.$metadata?.httpStatusCode ?? null;

return (
code === "ThrottlingException" ||
code === "ServiceUnavailableException" ||
code === "TooManyRequestsException" ||
(typeof status === "number" && status >= 500)
);
};

const buildEmailText = (payload: NotificationDispatch) => {
const lines = [payload.body];
if (payload.link) {
lines.push("", `Open: ${payload.link}`);
}
return lines.join("\n");
};

const sendEmailWithRetry = async (params: {
to: string;
subject: string;
bodyText: string;
}) => {
const from = process.env["SIN_NOTIFICATIONS_FROM_EMAIL"];
if (!from) {
throw new Error("SIN_NOTIFICATIONS_FROM_EMAIL is not configured.");
}

const replyTo = process.env["SIN_NOTIFICATIONS_REPLY_TO_EMAIL"] ?? null;
const region = process.env["AWS_REGION"] ?? "ca-central-1";
const { SESClient, SendEmailCommand } = await import("@aws-sdk/client-ses");

const client = new SESClient({ region });

const maxAttempts = 3;
for (let attempt = 1; attempt <= maxAttempts; attempt++) {
try {
return await client.send(
new SendEmailCommand({
Source: from,
Destination: { ToAddresses: [params.to] },
ReplyToAddresses: replyTo ? [replyTo] : undefined,
Message: {
Subject: { Data: params.subject },
Body: { Text: { Data: params.bodyText } },
},
}),
);
} catch (error) {
if (attempt === maxAttempts || !isRetryableSesError(error)) {
throw error;
}
const backoffMs = Math.min(10_000, 250 \* 2 \*\* (attempt - 1));
await sleep(backoffMs);
}
}

throw new Error("SES send failed after retries.");
};

export const sendNotification = createServerOnlyFn(async (payload: NotificationDispatch) => {
const { randomUUID } = await import("crypto");
const notificationId = payload.notificationId ?? randomUUID();

const { getDb } = await import("~/db/server-helpers");
const { notificationPreferences, notifications, user } = await import("~/db/schema");
const { and, eq } = await import("drizzle-orm");

const db = await getDb();

const [preference] = await db
.select()
.from(notificationPreferences)
.where(
and(
eq(notificationPreferences.userId, payload.userId),
eq(notificationPreferences.category, payload.category),
),
)
.limit(1);

const allowInApp = preference?.channelInApp ?? true;
const emailFrequency = preference?.emailFrequency ?? "immediate";
const emailEnabled = (preference?.channelEmail ?? true) && emailFrequency !== "never";
const sendImmediateEmail = emailEnabled && emailFrequency === "immediate";

let existingMetadata: JsonRecord | null = null;

// In-app insert is idempotent when notificationId is stable
if (allowInApp) {
await db
.insert(notifications)
.values({
id: notificationId,
userId: payload.userId,
organizationId: payload.organizationId ?? null,
type: payload.type,
category: payload.category,
title: payload.title,
body: payload.body,
link: payload.link ?? null,
metadata: payload.metadata ?? {},
})
.onConflictDoNothing();

    const [existing] = await db
      .select({ metadata: notifications.metadata })
      .from(notifications)
      .where(eq(notifications.id, notificationId))
      .limit(1);

    existingMetadata = existing?.metadata ?? null;

}

// Email idempotency: if we recorded emailSentAt, do not re-send on retries
const alreadyEmailSent =
!!existingMetadata && typeof existingMetadata["emailSentAt"] === "string";

let emailSent = false;
let emailMessageId: string | null = null;

if (sendImmediateEmail) {
const [recipient] = await db
.select({ email: user.email })
.from(user)
.where(eq(user.id, payload.userId))
.limit(1);

    const to = recipient?.email ?? null;
    const isAnonymized = !!to && to.toLowerCase().endsWith("@example.invalid");

    if (to && !isAnonymized && !alreadyEmailSent) {
      const resp = await sendEmailWithRetry({
        to,
        subject: payload.title,
        bodyText: buildEmailText(payload),
      });

      emailSent = true;
      emailMessageId = (resp as any)?.MessageId ?? null;

      if (allowInApp) {
        const nextMetadata: JsonRecord = {
          ...(existingMetadata ?? {}),
          ...(payload.metadata ?? {}),
          emailSentAt: new Date().toISOString(),
          ...(emailMessageId ? { emailMessageId } : {}),
        };

        await db
          .update(notifications)
          .set({ metadata: nextMetadata })
          .where(eq(notifications.id, notificationId));
      }
    } else if (alreadyEmailSent) {
      emailSent = true;
    }

}

const { logDataChange } = await import("~/lib/audit");
await logDataChange({
action: "NOTIFICATION_DISPATCH",
actorUserId: payload.userId,
actorOrgId: payload.organizationId ?? null,
targetType: "notification",
targetId: allowInApp ? notificationId : undefined,
targetOrgId: payload.organizationId ?? null,
metadata: {
notificationId,
category: payload.category,
type: payload.type,
channels: { inApp: allowInApp, email: emailEnabled },
delivered: { email: emailSent },
emailFrequency,
},
});

return { inApp: allowInApp, email: emailSent };
});

Patch: src/lib/notifications/scheduler.ts (small but important idempotency change)

Make scheduled notifications use a stable notificationId (so retries don’t duplicate).

       const variables = job.variables ?? {};
       await enqueueNotification({

-        notificationId: job.id,
         userId: job.userId,
         organizationId: job.organizationId ?? null,
         type: job.templateKey,
         category: template.category,
         title: applyTemplate(template.subject, variables),
         body: applyTemplate(template.bodyTemplate, variables),
-        metadata: {
-          scheduledNotificationId: job.id,
-          templateKey: job.templateKey,
-        },
       });

⸻

Infra/env you’ll need (minimal)

You’ll want these environment variables:
• S3
• SIN_ARTIFACTS_BUCKET (already used)
• If uploads are in a different bucket, either:
• pass defaultBucket when calling deleteFormSubmissionFiles, or
• add and use something like SIN_UPLOADS_BUCKET in the helper.
• SQS
• SIN_NOTIFICATIONS_QUEUE_URL
• Create a DLQ and configure the main queue’s redrive policy (this is infra, not code).
• SES
• SIN_NOTIFICATIONS_FROM_EMAIL (verified identity/domain in SES)
• optional SIN_NOTIFICATIONS_REPLY_TO_EMAIL

Also ensure packages exist:
• @aws-sdk/client-sqs
• @aws-sdk/client-ses

⸻

Quick verification checklist 1. Audit hash chain
• Run verifyAuditHashChain() before/after a retention run.
• It should remain valid: true now that audit_logs are never purged. 2. DSAR erasure
• Create a DSAR erasure request for a user with uploaded files.
• Confirm:
• S3 objects are deleted
• submission_files rows for those files are deleted
• user PII is anonymized
• privacy request ends completed 3. Notifications
• With no SIN_NOTIFICATIONS_QUEUE_URL, everything works “old style” (direct).
• With queue URL set:
• events enqueue to SQS
• your worker/consumer must call sendNotification() per message
• retries won’t duplicate in-app notifications due to stable notificationId

If you want, paste your submissionFiles table schema (the actual columns used to store the S3 key/url), and I’ll tighten deleteFormSubmissionFiles() to use the exact field names instead of the current “supports multiple shapes” approach.
