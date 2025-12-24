import { createServerOnlyFn } from "@tanstack/react-start";
import type { FormDefinition } from "~/features/forms/forms.schemas";
import { sanitizePayload, validateFormPayload } from "~/features/forms/forms.utils";
import type { JsonRecord } from "~/shared/lib/json";

const streamToBuffer = async (body: unknown) => {
  if (!body) return Buffer.alloc(0);
  if (body instanceof Uint8Array) return Buffer.from(body);
  if (body instanceof ArrayBuffer) return Buffer.from(body);
  if (typeof body === "object" && "transformToByteArray" in (body as object)) {
    const byteArray = await (
      body as { transformToByteArray: () => Promise<Uint8Array> }
    ).transformToByteArray();
    return Buffer.from(byteArray);
  }
  if (typeof body === "object" && "pipe" in (body as object)) {
    const stream = body as NodeJS.ReadableStream;
    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      stream.on("end", () => resolve(Buffer.concat(chunks)));
      stream.on("error", reject);
    });
  }
  return Buffer.alloc(0);
};

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

    const { requireOrganizationMembership } = await import("~/lib/auth/guards/org-guard");
    await requireOrganizationMembership({
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

    await db
      .update(importJobs)
      .set({ status: "importing" })
      .where(eq(importJobs.id, job.id));

    const { GetObjectCommand, PutObjectCommand } = await import("@aws-sdk/client-s3");
    const { getArtifactsBucketName, getS3Client } =
      await import("~/lib/storage/artifacts");

    const bucket = await getArtifactsBucketName();
    const client = await getS3Client();
    const response = await client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: job.sourceFileKey,
      }),
    );

    const buffer = await streamToBuffer(response.Body);
    const mapping = template.mappings as Record<string, string>;
    const definition = latestVersion.definition as FormDefinition;
    const fieldLookup = new Map(definition.fields.map((field) => [field.key, field]));

    let rows: JsonRecord[] = [];
    if (job.type === "csv") {
      const Papa = await import("papaparse");
      const parsed = Papa.parse(buffer.toString("utf8"), {
        header: true,
        skipEmptyLines: true,
      });
      rows = (parsed.data ?? []) as JsonRecord[];
    } else {
      const { read, utils } = await import("xlsx");
      const workbook = read(buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      rows = utils.sheet_to_json(sheet, { defval: "" }) as JsonRecord[];
    }

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

    for (let i = startIndex; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);

      for (const [index, row] of chunk.entries()) {
        const payload: JsonRecord = {};
        Object.entries(mapping).forEach(([sourceColumn, targetFieldKey]) => {
          if (!targetFieldKey) return;
          const field = fieldLookup.get(targetFieldKey);
          const rawValue = row[sourceColumn];
          if (!field) return;

          if (field.type === "number") {
            payload[targetFieldKey] = rawValue === "" ? null : Number(rawValue);
            return;
          }

          if (field.type === "checkbox") {
            const normalized = String(rawValue ?? "").toLowerCase();
            payload[targetFieldKey] = ["true", "1", "yes", "y"].includes(normalized);
            return;
          }

          if (field.type === "multiselect") {
            payload[targetFieldKey] =
              typeof rawValue === "string"
                ? rawValue.split(",").map((val) => val.trim())
                : [];
            return;
          }

          payload[targetFieldKey] = rawValue ?? null;
        });

        const sanitizedPayload = await sanitizePayload(definition, payload);
        const validation = validateFormPayload(definition, sanitizedPayload);

        if (
          validation.validationErrors.length > 0 ||
          validation.missingFields.length > 0
        ) {
          validation.validationErrors.forEach((error) => {
            errors.push({
              rowNumber: i + index + 1,
              fieldKey: error.field,
              errorType: "validation",
              errorMessage: error.message,
              rawValue: String(payload[error.field] ?? ""),
            });
          });
          validation.missingFields.forEach((fieldKey) => {
            errors.push({
              rowNumber: i + index + 1,
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
            rows_failed: errors.length,
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
        errorSummary: errors.length > 0 ? { errors: errors.length } : {},
        stats: {
          rows_total: rows.length,
          rows_processed: rows.length,
          rows_succeeded: inserted,
          rows_failed: errors.length,
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
        rowsFailed: errors.length,
        errorReportKey,
      },
    });

    return {
      success: true,
      stats: {
        processed: rows.length,
        inserted,
        failed: errors.length,
      },
      errorReportKey,
    };
  },
);
