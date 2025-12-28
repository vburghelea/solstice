import { createServerOnlyFn } from "@tanstack/react-start";

type RetentionResult = {
  dataType: string;
  status: "purged" | "skipped" | "archived" | "partial";
  reason?: string;
  deletedCount?: number;
  archivedCount?: number;
  errors?: string[];
};

const DAY_MS = 24 * 60 * 60 * 1000;
const AUDIT_ARCHIVE_BATCH_SIZE = 1000;

// ISSUE 05 FIX: Audit logs must never be deleted - hash chain immutability depends on it
const IMMUTABLE_TYPES = new Set(["audit_logs", "audit_log", "auditlog", "audit"]);

export const applyRetentionPolicies = createServerOnlyFn(async () => {
  const { getDb } = await import("~/db/server-helpers");
  const {
    auditLogArchives,
    auditLogs,
    formSubmissionVersions,
    formSubmissions,
    importJobErrors,
    importJobs,
    legalHolds,
    notifications,
    privacyRequests,
    retentionPolicies,
    securityEvents,
    submissionFiles,
  } = await import("~/db/schema");
  const { and, asc, desc, eq, gt, inArray, isNull, lt, not } =
    await import("drizzle-orm");

  const db = await getDb();
  const policies = await db.select().from(retentionPolicies);
  const activeHolds = await db
    .select()
    .from(legalHolds)
    .where(isNull(legalHolds.releasedAt));
  const results: RetentionResult[] = [];

  const normalizedHolds = activeHolds.map((hold) => ({
    ...hold,
    dataType: hold.dataType ? hold.dataType.trim().toLowerCase() : null,
  }));

  const resolveHoldSets = (dataType: string) => {
    const scoped = normalizedHolds.filter(
      (hold) => !hold.dataType || hold.dataType === dataType,
    );

    return {
      recordIds: new Set(
        scoped.filter((hold) => hold.scopeType === "record").map((hold) => hold.scopeId),
      ),
      userIds: new Set(
        scoped.filter((hold) => hold.scopeType === "user").map((hold) => hold.scopeId),
      ),
      orgIds: new Set(
        scoped
          .filter((hold) => hold.scopeType === "organization")
          .map((hold) => hold.scopeId),
      ),
    };
  };

  const archiveAuditLogs = async (cutoff: Date) => {
    const [lastArchive] = await db
      .select()
      .from(auditLogArchives)
      .orderBy(desc(auditLogArchives.toOccurredAt))
      .limit(1);

    const startAfter = lastArchive?.toOccurredAt ?? new Date(0);

    const batch = await db
      .select()
      .from(auditLogs)
      .where(and(gt(auditLogs.occurredAt, startAfter), lt(auditLogs.occurredAt, cutoff)))
      .orderBy(asc(auditLogs.occurredAt), asc(auditLogs.id))
      .limit(AUDIT_ARCHIVE_BATCH_SIZE);

    if (batch.length === 0) {
      return { archivedCount: 0, reason: "no_eligible_rows" };
    }

    const rangeStart = batch[0]!.occurredAt;
    const rangeEnd = batch[batch.length - 1]!.occurredAt;

    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    const { env } = await import("~/lib/env.server");
    const { getArtifactsBucketName, getS3Client } =
      await import("~/lib/storage/artifacts");

    const bucket = await getArtifactsBucketName();
    const client = await getS3Client();
    const kmsKeyId = env.SIN_ARTIFACTS_KMS_KEY_ID;

    const formatKeyTime = (value: Date) => value.toISOString().replace(/[:.]/g, "-");

    const storageKey = `audit/archives/${formatKeyTime(
      rangeStart,
    )}_${formatKeyTime(rangeEnd)}.json`;
    const tagging = new URLSearchParams({
      archive: "true",
      from: rangeStart.toISOString(),
      to: rangeEnd.toISOString(),
      count: String(batch.length),
    }).toString();

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: storageKey,
        Body: JSON.stringify(batch, null, 2),
        ContentType: "application/json",
        ServerSideEncryption: "aws:kms",
        ...(kmsKeyId ? { SSEKMSKeyId: kmsKeyId } : {}),
        StorageClass: "DEEP_ARCHIVE",
        Tagging: tagging,
        Metadata: {
          archive: "true",
          "from-occurred-at": rangeStart.toISOString(),
          "to-occurred-at": rangeEnd.toISOString(),
          "row-count": String(batch.length),
        },
      }),
    );

    await db.insert(auditLogArchives).values({
      fromOccurredAt: rangeStart,
      toOccurredAt: rangeEnd,
      objectKey: storageKey,
      bucket,
      rowCount: batch.length,
      storageClass: "DEEP_ARCHIVE",
      archivedAt: new Date(),
    });

    return {
      archivedCount: batch.length,
      storageKey,
      rangeStart,
      rangeEnd,
    };
  };

  for (const policy of policies) {
    const dataType = policy.dataType.trim().toLowerCase();

    // ISSUE 05 FIX: Never purge audit logs; hash-chain immutability depends on it.
    if (IMMUTABLE_TYPES.has(dataType)) {
      if (policy.archiveAfterDays === null || policy.archiveAfterDays === undefined) {
        results.push({
          dataType,
          status: "skipped",
          reason: "immutable_audit_log",
        });
        continue;
      }

      try {
        const cutoff = new Date(Date.now() - policy.archiveAfterDays * DAY_MS);
        const archiveResult = await archiveAuditLogs(cutoff);

        results.push({
          dataType,
          status: archiveResult.archivedCount > 0 ? "archived" : "skipped",
          archivedCount: archiveResult.archivedCount,
          ...(archiveResult.reason ? { reason: archiveResult.reason } : {}),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        results.push({ dataType, status: "skipped", reason: message });
      }
      continue;
    }

    if (policy.legalHold) {
      results.push({ dataType, status: "skipped", reason: "legal_hold" });
      continue;
    }

    const holdSets = resolveHoldSets(dataType);
    const heldRecordIds = Array.from(holdSets.recordIds);
    const heldUserIds = Array.from(holdSets.userIds);
    const heldOrgIds = Array.from(holdSets.orgIds);

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
            const submissionConditions = [lt(formSubmissions.createdAt, cutoff)];
            if (heldRecordIds.length) {
              submissionConditions.push(not(inArray(formSubmissions.id, heldRecordIds)));
            }
            if (heldUserIds.length) {
              submissionConditions.push(
                not(inArray(formSubmissions.submitterId, heldUserIds)),
              );
            }
            if (heldOrgIds.length) {
              submissionConditions.push(
                not(inArray(formSubmissions.organizationId, heldOrgIds)),
              );
            }

            const submissionBatch = await db
              .select({ id: formSubmissions.id })
              .from(formSubmissions)
              .where(and(...submissionConditions))
              .limit(batchSize);

            if (submissionBatch.length === 0) break;

            const submissionIds = submissionBatch.map((row) => row.id);

            // Delete associated submission_files S3 objects BEFORE DB deletion
            const fileRows = await db
              .select()
              .from(submissionFiles)
              .where(inArray(submissionFiles.submissionId, submissionIds));

            if (fileRows.length) {
              const { deleteFormSubmissionFiles } =
                await import("~/lib/privacy/submission-files");
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
          const versionConditions = [lt(formSubmissionVersions.createdAt, cutoff)];
          if (heldRecordIds.length) {
            versionConditions.push(
              not(inArray(formSubmissionVersions.id, heldRecordIds)),
            );
          }
          if (heldUserIds.length) {
            versionConditions.push(
              not(inArray(formSubmissionVersions.changedBy, heldUserIds)),
            );
          }

          const deleted = await db
            .delete(formSubmissionVersions)
            .where(and(...versionConditions))
            .returning({ id: formSubmissionVersions.id });
          deletedCount = deleted.length;
          break;
        }

        // ISSUE 06 FIX (part 2): Purging submission_files must delete S3 objects too.
        case "submission_files": {
          const batchSize = 500;

          while (true) {
            const fileConditions = [lt(submissionFiles.createdAt, cutoff)];
            if (heldRecordIds.length) {
              fileConditions.push(not(inArray(submissionFiles.id, heldRecordIds)));
            }
            if (heldUserIds.length) {
              fileConditions.push(not(inArray(submissionFiles.uploadedBy, heldUserIds)));
            }

            const fileBatch = await db
              .select()
              .from(submissionFiles)
              .where(and(...fileConditions))
              .limit(batchSize);

            if (fileBatch.length === 0) break;

            const { deleteFormSubmissionFiles } =
              await import("~/lib/privacy/submission-files");
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
          const notificationConditions = [lt(notifications.createdAt, cutoff)];
          if (heldRecordIds.length) {
            notificationConditions.push(not(inArray(notifications.id, heldRecordIds)));
          }
          if (heldUserIds.length) {
            notificationConditions.push(not(inArray(notifications.userId, heldUserIds)));
          }
          if (heldOrgIds.length) {
            notificationConditions.push(
              not(inArray(notifications.organizationId, heldOrgIds)),
            );
          }

          const deleted = await db
            .delete(notifications)
            .where(and(...notificationConditions))
            .returning({ id: notifications.id });
          deletedCount = deleted.length;
          break;
        }

        case "security_events": {
          const securityConditions = [lt(securityEvents.createdAt, cutoff)];
          if (heldRecordIds.length) {
            securityConditions.push(not(inArray(securityEvents.id, heldRecordIds)));
          }
          if (heldUserIds.length) {
            securityConditions.push(not(inArray(securityEvents.userId, heldUserIds)));
          }

          const deleted = await db
            .delete(securityEvents)
            .where(and(...securityConditions))
            .returning({ id: securityEvents.id });
          deletedCount = deleted.length;
          break;
        }

        case "import_jobs": {
          const importJobConditions = [lt(importJobs.createdAt, cutoff)];
          if (heldRecordIds.length) {
            importJobConditions.push(not(inArray(importJobs.id, heldRecordIds)));
          }
          if (heldOrgIds.length) {
            importJobConditions.push(not(inArray(importJobs.organizationId, heldOrgIds)));
          }
          if (heldUserIds.length) {
            importJobConditions.push(not(inArray(importJobs.createdBy, heldUserIds)));
          }

          const deleted = await db
            .delete(importJobs)
            .where(and(...importJobConditions))
            .returning({ id: importJobs.id });
          deletedCount = deleted.length;
          break;
        }

        case "import_job_errors": {
          if (heldOrgIds.length || heldUserIds.length) {
            const jobConditions = [lt(importJobs.createdAt, cutoff)];
            if (heldOrgIds.length) {
              jobConditions.push(not(inArray(importJobs.organizationId, heldOrgIds)));
            }
            if (heldUserIds.length) {
              jobConditions.push(not(inArray(importJobs.createdBy, heldUserIds)));
            }

            const eligibleJobs = await db
              .select({ id: importJobs.id })
              .from(importJobs)
              .where(and(...jobConditions));
            const jobIds = eligibleJobs.map((row) => row.id);

            if (jobIds.length === 0) {
              deletedCount = 0;
              break;
            }

            const errorConditions = [
              lt(importJobErrors.createdAt, cutoff),
              inArray(importJobErrors.jobId, jobIds),
            ];
            if (heldRecordIds.length) {
              errorConditions.push(not(inArray(importJobErrors.id, heldRecordIds)));
            }

            const deleted = await db
              .delete(importJobErrors)
              .where(and(...errorConditions))
              .returning({ id: importJobErrors.id });
            deletedCount = deleted.length;
            break;
          }

          const errorConditions = [lt(importJobErrors.createdAt, cutoff)];
          if (heldRecordIds.length) {
            errorConditions.push(not(inArray(importJobErrors.id, heldRecordIds)));
          }

          const deleted = await db
            .delete(importJobErrors)
            .where(and(...errorConditions))
            .returning({ id: importJobErrors.id });
          deletedCount = deleted.length;
          break;
        }

        case "privacy_requests": {
          const privacyConditions = [lt(privacyRequests.createdAt, cutoff)];
          if (heldRecordIds.length) {
            privacyConditions.push(not(inArray(privacyRequests.id, heldRecordIds)));
          }
          if (heldUserIds.length) {
            privacyConditions.push(not(inArray(privacyRequests.userId, heldUserIds)));
          }

          const deleted = await db
            .delete(privacyRequests)
            .where(and(...privacyConditions))
            .returning({ id: privacyRequests.id });
          deletedCount = deleted.length;
          break;
        }

        case "dsar_exports":
        case "privacy_exports": {
          const expiredRequests = await db
            .select({
              id: privacyRequests.id,
              userId: privacyRequests.userId,
              resultUrl: privacyRequests.resultUrl,
            })
            .from(privacyRequests)
            .where(
              and(
                eq(privacyRequests.status, "completed"),
                not(isNull(privacyRequests.resultUrl)),
                not(isNull(privacyRequests.resultExpiresAt)),
                lt(privacyRequests.resultExpiresAt, new Date()),
              ),
            );

          if (expiredRequests.length === 0) {
            deletedCount = 0;
            break;
          }

          const deletableRequests = expiredRequests.filter((request) => {
            if (heldRecordIds.length && heldRecordIds.includes(request.id)) return false;
            if (heldUserIds.length && heldUserIds.includes(request.userId)) return false;
            return true;
          });

          if (deletableRequests.length === 0) {
            results.push({
              dataType,
              status: "skipped",
              reason: "legal_hold",
            });
            continue;
          }

          const { DeleteObjectsCommand } = await import("@aws-sdk/client-s3");
          const { getArtifactsBucketName, getS3Client } =
            await import("~/lib/storage/artifacts");

          const bucket = await getArtifactsBucketName();
          const client = await getS3Client();
          const objectRefs = new Map<string, { bucket: string; key: string }>();

          for (const request of deletableRequests) {
            if (!request.resultUrl) continue;

            if (request.resultUrl.startsWith("s3://")) {
              const [bucketName, ...keyParts] = request.resultUrl
                .replace("s3://", "")
                .split("/");
              const key = keyParts.join("/");
              if (bucketName && key) {
                objectRefs.set(request.id, { bucket: bucketName, key });
              }
            } else {
              const key = request.resultUrl.trim().replace(/^\/+/, "");
              if (key) {
                objectRefs.set(request.id, { bucket, key });
              }
            }
          }

          const refs = Array.from(objectRefs.values());
          const deletionErrors: Array<{ bucket: string; key: string; message?: string }> =
            [];
          let deletedObjects = 0;

          if (refs.length) {
            const grouped = new Map<string, Set<string>>();
            for (const ref of refs) {
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
                deletedObjects += response.Deleted?.length ?? 0;
                for (const err of response.Errors ?? []) {
                  if (!err.Key) continue;
                  deletionErrors.push({
                    bucket: targetBucket,
                    key: err.Key,
                    ...(err.Message ? { message: err.Message } : {}),
                  });
                }
              }
            }
          }

          if (refs.length) {
            const failedKeys = new Set(
              deletionErrors.map((err) => `${err.bucket}:${err.key}`),
            );
            const clearedRequestIds = Array.from(objectRefs.entries())
              .filter((entry) => {
                const ref = entry[1];
                return !failedKeys.has(`${ref.bucket}:${ref.key}`);
              })
              .map(([requestId]) => requestId);

            if (clearedRequestIds.length) {
              await db
                .update(privacyRequests)
                .set({
                  resultUrl: null,
                  resultExpiresAt: null,
                })
                .where(inArray(privacyRequests.id, clearedRequestIds));
            }
          }

          deletedCount = deletedObjects;
          if (
            deletionErrors.length ||
            deletableRequests.length !== expiredRequests.length
          ) {
            results.push({
              dataType,
              status: "partial",
              deletedCount,
              reason: deletionErrors.length > 0 ? "export_deletion_errors" : "legal_hold",
            });
            continue;
          }

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

  const summary = results.map((result) => ({
    dataType: result.dataType,
    status: result.status,
    deletedCount: result.deletedCount ?? 0,
    archivedCount: result.archivedCount ?? 0,
    reason: result.reason ?? null,
  }));

  if (summary.length) {
    console.info("[retention] completed", summary);

    try {
      const { logAdminAction } = await import("~/lib/audit");
      await logAdminAction({
        action: "RETENTION_RUN",
        actorUserId: null,
        targetType: "retention_job",
        metadata: { results: summary },
      });
    } catch (error) {
      console.error(
        "[retention] failed to log retention run",
        error instanceof Error ? error.message : error,
      );
    }
  }

  return { status: "completed", results };
});

export const runRetentionJob = applyRetentionPolicies;
