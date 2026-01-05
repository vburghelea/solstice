import { createServerOnlyFn } from "@tanstack/react-start";
import type { FormDefinition } from "~/features/forms/forms.schemas";
import { sanitizePayload, validateFormPayload } from "~/features/forms/forms.utils";
import { buildImportFieldLookup, parseImportRow } from "~/features/imports/imports.utils";
import {
  buildSubmissionFilesForImport,
  normalizeImportFileFields,
} from "~/lib/imports/file-field-utils";

export const runBatchImportJob = createServerOnlyFn(
  async (params: { jobId: string; actorUserId?: string | null }) => {
    const { forbidden, notFound, unauthorized } = await import("~/lib/server/errors");
    const { getDb } = await import("~/db/server-helpers");
    const {
      formSubmissionVersions,
      formSubmissions,
      formVersions,
      importJobs,
      importMappingTemplates,
      submissionFiles,
    } = await import("~/db/schema");
    const { desc, eq } = await import("drizzle-orm");

    const db = await getDb();
    const [job] = await db
      .select()
      .from(importJobs)
      .where(eq(importJobs.id, params.jobId))
      .limit(1);

    if (!job) {
      throw notFound("Import job not found");
    }

    const actorUserId = params.actorUserId ?? job.createdBy ?? null;
    if (!actorUserId) {
      throw unauthorized("Import job missing actor user");
    }

    const { requireOrganizationAccess } = await import("~/lib/auth/guards/org-guard");
    await requireOrganizationAccess({
      userId: actorUserId,
      organizationId: job.organizationId,
    });

    if (job.lane !== "batch") {
      throw forbidden("Batch import requires lane 2 job.");
    }

    if (!job.targetFormId || !job.mappingTemplateId) {
      throw forbidden("Batch import requires a target form and mapping template.");
    }

    const [template] = await db
      .select()
      .from(importMappingTemplates)
      .where(eq(importMappingTemplates.id, job.mappingTemplateId))
      .limit(1);

    if (!template) {
      throw notFound("Mapping template not found");
    }

    const [latestVersion] = await db
      .select()
      .from(formVersions)
      .where(eq(formVersions.formId, job.targetFormId))
      .orderBy(desc(formVersions.versionNumber))
      .limit(1);

    if (!latestVersion) {
      throw notFound("Form has no published versions");
    }

    const mapping = template.mappings as Record<string, string>;
    const definition = latestVersion.definition as FormDefinition;
    const fieldLookup = buildImportFieldLookup(definition);

    const { loadImportFile } = await import("~/lib/imports/file-utils");
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    const { getArtifactsBucketName, getS3Client } =
      await import("~/lib/storage/artifacts");

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

    await db
      .update(importJobs)
      .set({ status: "importing", startedAt: new Date() })
      .where(eq(importJobs.id, job.id));

    const bucket = await getArtifactsBucketName();
    const client = await getS3Client();
    const storageKeyPrefix = `forms/${job.targetFormId}/`;

    const errors: Array<{
      rowNumber: number;
      fieldKey: string | null;
      errorType: string;
      errorMessage: string;
      rawValue: string | null;
    }> = [];

    const startIndex = job.progressCheckpoint ?? 0;
    const chunkSize = 1000;
    let inserted = 0;
    let processed = startIndex;
    const failedRows = new Set<number>();

    for (let i = startIndex; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);

      for (const [index, row] of chunk.entries()) {
        const { payload, parseErrors } = parseImportRow(row, mapping, fieldLookup);
        const { payload: normalizedPayload, parseErrors: fileRefErrors } =
          normalizeImportFileFields({
            definition,
            payload,
            artifactsBucket: bucket,
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
          const rowNumber = i + index + 1;
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
            formId: job.targetFormId,
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
            changeReason: "batch_import",
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

      processed = Math.min(rows.length, i + chunk.length);
      await db
        .update(importJobs)
        .set({
          progressCheckpoint: processed,
          stats: {
            rows_total: rows.length,
            rows_processed: processed,
            rows_succeeded: inserted,
            rows_failed: failedRows.size,
            error_count: errors.length,
          },
        })
        .where(eq(importJobs.id, job.id));
    }

    let errorReportKey: string | null = null;
    if (errors.length > 0) {
      const { toCsv } = await import("~/shared/lib/csv");
      const csv = toCsv(
        errors.map((error) => ({
          rowNumber: error.rowNumber,
          fieldKey: error.fieldKey ?? "",
          errorType: error.errorType,
          errorMessage: error.errorMessage,
          rawValue: error.rawValue ?? "",
        })),
      );

      errorReportKey = `imports/${job.id}/errors.csv`;
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: errorReportKey,
          Body: csv,
          ContentType: "text/csv",
        }),
      );
    }

    await db
      .update(importJobs)
      .set({
        status: "completed",
        errorReportKey,
        errorSummary:
          errors.length > 0
            ? { errorCount: errors.length, failedRows: failedRows.size }
            : {},
        stats: {
          rows_total: rows.length,
          rows_processed: rows.length,
          rows_succeeded: inserted,
          rows_failed: failedRows.size,
          error_count: errors.length,
        },
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
      metadata: {
        rowsTotal: rows.length,
        rowsSucceeded: inserted,
        rowsFailed: failedRows.size,
        errorCount: errors.length,
        errorReportKey,
      },
    });

    return {
      success: true,
      stats: {
        processed: rows.length,
        inserted,
        failed: failedRows.size,
        failedRows: failedRows.size,
        errorCount: errors.length,
      },
      errorReportKey,
    };
  },
);
