import { createServerOnlyFn } from "@tanstack/react-start";

type RetentionResult = {
  dataType: string;
  status: "purged" | "skipped";
  reason?: string;
  deletedCount?: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;

// ISSUE 05 FIX: Audit logs must never be deleted - hash chain immutability depends on it
const IMMUTABLE_TYPES = new Set(["audit_logs", "audit_log", "auditlog", "audit"]);

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
