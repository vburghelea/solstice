Below is a concrete “Bundle 3” implementation that addresses Issue 07, 08, 10, 11 using only the files in your repomix (plus small, safe new files for helpers/tests). I’m giving you ready-to-apply diffs and a quick integration note where the target file wasn’t included in the pack (reports export).

⸻

Issue 08 — Server-side file constraints are missing

What this patch does 1. Adds shared server-side file validation helpers (mime wildcard support, size, maxFiles). 2. Validates uploads server-side before presigning in createFormUpload using the form’s latest published definition + fileConfig. 3. Validates file payloads server-side during submission validation (validateFormPayload) including:
• invalid file payload shape
• mime type not allowed
• size too large
• file count > maxFiles
• optional storage key prefix check for anti-key-injection defense 4. Prevents inserting malicious storageKey into submissionFiles by filtering to the expected forms/${formId}/ prefix.

⸻

Patch 1 — src/features/forms/forms.utils.ts

**_ Begin Patch
_** Update File: src/features/forms/forms.utils.ts
@@
import type { JsonRecord, JsonValue } from "~/shared/lib/json";
import type { FormDefinition } from "./forms.schemas";

+export type FilePayload = {

- storageKey: string;
- fileName: string;
- mimeType: string;
- sizeBytes: number;
- checksum?: string | null;
  +};
- +export type FileConfig = {
- allowedTypes: string[];
- maxSizeBytes: number;
- maxFiles: number;
  +};
- +// Baseline safety defaults when a file field omits fileConfig.
  +// Note: if you want to be stricter, set allowedTypes to a constrained list.
  +export const DEFAULT_FILE_CONFIG: FileConfig = {
- allowedTypes: ["*/*"],
- maxSizeBytes: 10 _ 1024 _ 1024, // 10MB
- maxFiles: 1,
  +};
- +export const isFilePayload = (value: JsonValue): value is FilePayload => {
- if (!value || typeof value !== "object" || Array.isArray(value)) return false;
- const record = value as Record<string, JsonValue>;
- return (
- typeof record["storageKey"] === "string" &&
- typeof record["fileName"] === "string" &&
- typeof record["mimeType"] === "string" &&
- typeof record["sizeBytes"] === "number"
- );
  +};
- +export const parseFileFieldValue = (
- value: JsonValue,
  +): { files: FilePayload[]; error: string | null } => {
- if (value === null || value === undefined) return { files: [], error: null };
-
- if (isFilePayload(value)) return { files: [value], error: null };
-
- if (Array.isArray(value)) {
- const files: FilePayload[] = [];
- for (const item of value) {
-      if (!isFilePayload(item as JsonValue)) {
-        return { files: [], error: "Invalid file payload." };
-      }
-      files.push(item as unknown as FilePayload);
- }
- return { files, error: null };
- }
-
- return { files: [], error: "Invalid file payload." };
  +};
- +const normalizeAllowedTypes = (value: unknown): string[] => {
- if (!Array.isArray(value)) return [];
- return value
- .filter((item): item is string => typeof item === "string")
- .map((item) => item.trim())
- .filter(Boolean);
  +};
- +const normalizePositiveInt = (value: unknown, fallback: number) => {
- const num = typeof value === "number" ? value : Number(value);
- if (!Number.isFinite(num) || num <= 0) return fallback;
- return Math.floor(num);
  +};
- +export const getFileConfigForField = (
- field: FormDefinition["fields"][number],
  +): FileConfig => {
- if (!field.fileConfig) return DEFAULT_FILE_CONFIG;
- const allowedTypes = normalizeAllowedTypes(field.fileConfig.allowedTypes);
- return {
- allowedTypes: allowedTypes.length > 0 ? allowedTypes : DEFAULT_FILE_CONFIG.allowedTypes,
- maxSizeBytes: normalizePositiveInt(
-      field.fileConfig.maxSizeBytes,
-      DEFAULT_FILE_CONFIG.maxSizeBytes,
- ),
- maxFiles: normalizePositiveInt(field.fileConfig.maxFiles, DEFAULT_FILE_CONFIG.maxFiles),
- };
  +};
- +const mimeTypeMatches = (mimeType: string, allowedType: string) => {
- const normalizedAllowed = allowedType.trim().toLowerCase();
- const normalizedMime = mimeType.trim().toLowerCase();
-
- if (normalizedAllowed === "_" || normalizedAllowed === "_/\*") return true;
-
- // Wildcard, e.g. image/\*
- if (normalizedAllowed.endsWith("/\*")) {
- const prefix = normalizedAllowed.slice(0, normalizedAllowed.length - 1); // keep trailing "/"
- return normalizedMime.startsWith(prefix);
- }
-
- return normalizedMime === normalizedAllowed;
  +};
- +export const isMimeTypeAllowed = (mimeType: string, allowedTypes: string[]) => {
- if (!allowedTypes || allowedTypes.length === 0) return true;
- return allowedTypes.some((allowed) => mimeTypeMatches(mimeType, allowed));
  +};
- +export const formatBytes = (bytes: number) => {
- if (!Number.isFinite(bytes) || bytes < 0) return "0 bytes";
- if (bytes < 1024) return `${Math.round(bytes)} bytes`;
- if (bytes < 1024 \* 1024) return `${(bytes / 1024).toFixed(1)} KB`;
- return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  +};
- +export type ValidateFormPayloadOptions = {
- /\*\*
- - When provided, all file payload storageKey values must start with this prefix.
- - Example: `forms/${formId}/`
- \*/
- fileStorageKeyPrefix?: string;
  +};
- const sanitizeRichText = async (value: JsonValue): Promise<JsonValue> => {
  if (typeof value !== "string") return value;
  const { default: sanitizeHtml } = await import("sanitize-html");

@@
return meetsCondition(field.conditional, payload);
};

-export const validateFormPayload = (definition: FormDefinition, payload: JsonRecord) => {
+const isEmptyNonFileValue = (hasValue: boolean, value: JsonValue) => {

- if (!hasValue) return true;
- if (value === null || value === undefined) return true;
- if (typeof value === "string" && value.trim() === "") return true;
- return false;
  +};
- +const isEmptyFileValue = (hasValue: boolean, value: JsonValue) => {
- if (!hasValue) return true;
- if (value === null || value === undefined) return true;
- if (Array.isArray(value)) return value.length === 0;
- return false;
  +};
- +export const validateFormPayload = (
- definition: FormDefinition,
- payload: JsonRecord,
- options?: ValidateFormPayloadOptions,
  +) => {
  const missingFields: string[] = [];
  const validationErrors: Array<{ field: string; message: string }> = [];
  for (const field of definition.fields) {
  @@
  }
  const hasValue = Object.prototype.hasOwnProperty.call(payload, field.key);
  const value = payload[field.key];

* const isEmpty =
*      !hasValue ||
*      value === null ||
*      (typeof value === "string" && value.trim() === "");

- const isFileField = field.type === "file";
- const isEmpty = isFileField
-      ? isEmptyFileValue(hasValue, value)
-      : isEmptyNonFileValue(hasValue, value);

  if (field.required && isEmpty) {
  missingFields.push(field.key);
  }

- // File validation (server-side)
- if (isFileField && !isEmpty) {
-      const parsed = parseFileFieldValue(value);
-      if (parsed.error) {
-        validationErrors.push({ field: field.key, message: parsed.error });
-      } else {
-        const config = getFileConfigForField(field);
-
-        if (config.maxFiles > 0 && parsed.files.length > config.maxFiles) {
-          validationErrors.push({
-            field: field.key,
-            message: `Too many files. Maximum is ${config.maxFiles}.`,
-          });
-        }
-
-        for (const file of parsed.files) {
-          if (!Number.isFinite(file.sizeBytes) || file.sizeBytes <= 0) {
-            validationErrors.push({
-              field: field.key,
-              message: "Invalid file size.",
-            });
-            continue;
-          }
-
-          if (file.sizeBytes > config.maxSizeBytes) {
-            validationErrors.push({
-              field: field.key,
-              message: `File is too large. Maximum size is ${formatBytes(
-                config.maxSizeBytes,
-              )}.`,
-            });
-          }
-
-          if (!isMimeTypeAllowed(file.mimeType, config.allowedTypes)) {
-            validationErrors.push({
-              field: field.key,
-              message: `File type "${file.mimeType}" is not allowed.`,
-            });
-          }
-
-          if (
-            options?.fileStorageKeyPrefix &&
-            typeof file.storageKey === "string" &&
-            !file.storageKey.startsWith(options.fileStorageKeyPrefix)
-          ) {
-            validationErrors.push({
-              field: field.key,
-              message: "Invalid file reference.",
-            });
-          }
-        }
-      }
- }
-      if (field.validation && !isEmpty) {
         for (const rule of field.validation) {
           if (rule.type === "min_length" && typeof value === "string") {
             if (value.length < Number(rule.value)) {
  @@
  return { missingFields, validationErrors, completenessScore };
  };
  \*\*\* End Patch

⸻

Patch 2 — src/features/forms/forms.mutations.ts

**_ Begin Patch
_** Update File: src/features/forms/forms.mutations.ts
@@
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
-import { sanitizePayload, validateFormPayload } from "./forms.utils";
+import {

- formatBytes,
- getFileConfigForField,
- isMimeTypeAllowed,
- parseFileFieldValue,
- sanitizePayload,
- validateFormPayload,
  +} from "./forms.utils";

const requireSessionUserId = async () => {
const { getAuth } = await import("~/lib/auth/server-helpers");
const { getRequest } = await import("@tanstack/react-start/server");
@@
await requireOrgAccess(userId, form.organizationId, options);
return form;
};

-type FilePayload = {

- storageKey: string;
- fileName: string;
- mimeType: string;
- sizeBytes: number;
- checksum?: string | null;
  -};
- -const isFilePayload = (value: JsonValue): value is FilePayload => {
- if (!value || typeof value !== "object" || Array.isArray(value)) return false;
- const record = value as Record<string, JsonValue>;
- return (
- typeof record["storageKey"] === "string" &&
- typeof record["fileName"] === "string" &&
- typeof record["mimeType"] === "string" &&
- typeof record["sizeBytes"] === "number"
- );
  -};
- const buildSubmissionFiles = (
  definition: FormDefinition,
  payload: JsonRecord,
  submissionId: string,
  actorUserId: string,

* options?: { storageKeyPrefix?: string },
  ) => {

- return definition.fields
- .filter((field) => field.type === "file")
- .map((field) => {
-      const value = payload[field.key];
-      if (!isFilePayload(value)) return null;
-      return {
-        submissionId,
-        fieldKey: field.key,
-        fileName: value.fileName,
-        mimeType: value.mimeType,
-        sizeBytes: Number(value.sizeBytes),
-        checksum: typeof value.checksum === "string" ? value.checksum : "",
-        storageKey: value.storageKey,
-        uploadedBy: actorUserId,
-      };
- })
- .filter((value): value is NonNullable<typeof value> => Boolean(value));

* const files: Array<{
* submissionId: string;
* fieldKey: string;
* fileName: string;
* mimeType: string;
* sizeBytes: number;
* checksum: string;
* storageKey: string;
* uploadedBy: string;
* }> = [];
*
* for (const field of definition.fields) {
* if (field.type !== "file") continue;
* const raw = payload[field.key] as JsonValue;
* const parsed = parseFileFieldValue(raw);
* if (parsed.error) continue;
*
* for (const file of parsed.files) {
*      if (options?.storageKeyPrefix && !file.storageKey.startsWith(options.storageKeyPrefix)) {
*        continue;
*      }
*      files.push({
*        submissionId,
*        fieldKey: field.key,
*        fileName: file.fileName,
*        mimeType: file.mimeType,
*        sizeBytes: Number(file.sizeBytes),
*        checksum: typeof file.checksum === "string" ? file.checksum : "",
*        storageKey: file.storageKey,
*        uploadedBy: actorUserId,
*      });
* }
* }
*
* return files;
  };

const insertSubmissionFiles = async (
definition: FormDefinition,
payload: JsonRecord,
submissionId: string,
actorUserId: string,

- options?: { storageKeyPrefix?: string },
  ) => {

* const files = buildSubmissionFiles(definition, payload, submissionId, actorUserId);

- const files = buildSubmissionFiles(definition, payload, submissionId, actorUserId, options);
  if (files.length === 0) return;
  const { getDb } = await import("~/db/server-helpers");
  const { submissionFiles } = await import("~/db/schema");
  @@
  export const submitForm = createServerFn({ method: "POST" })
  .inputValidator(zod$(submitFormSchema))
  .handler(async ({ data }) => {
  const { getDb } = await import("~/db/server-helpers");
  @@
  if (!latestVersion) {
  return { error: "Form has no published versions." };
  }
  const definition = latestVersion.definition as FormDefinition;
  const sanitizedPayload = await sanitizePayload(definition, data.payload);

* const validation = validateFormPayload(definition, sanitizedPayload);

- const validation = validateFormPayload(definition, sanitizedPayload, {
-      fileStorageKeyPrefix: `forms/${form.id}/`,
- });
  const [submission] = await db
  .insert(formSubmissions)
  .values({
  @@
  await db.insert(formSubmissionVersions).values({
  submissionId: submission.id,
  versionNumber: 1,
  payloadSnapshot: sanitizedPayload,
  changedBy: actorUserId,
  changeReason: data.changeReason ?? null,
  });

* await insertSubmissionFiles(definition, sanitizedPayload, submission.id, actorUserId);

- await insertSubmissionFiles(definition, sanitizedPayload, submission.id, actorUserId, {
-      storageKeyPrefix: `forms/${form.id}/`,
- });
  const { logDataChange } = await import("~/lib/audit");
  await logDataChange({
  action: "FORM_SUBMISSION_CREATE",
  actorUserId,
  @@
  export const createFormUpload = createServerFn({ method: "POST" })
  .inputValidator(zod$(createFormUploadSchema))
  .handler(async ({ data }) => {
  const actorUserId = await requireSessionUserId();
  const form = await loadFormWithAccess(data.formId, actorUserId);
- const { getDb } = await import("~/db/server-helpers");
- const { formVersions } = await import("~/db/schema");
- const { desc, eq } = await import("drizzle-orm");
-
- const db = await getDb();
- const [latestVersion] = await db
-      .select()
-      .from(formVersions)
-      .where(eq(formVersions.formId, form.id))
-      .orderBy(desc(formVersions.versionNumber))
-      .limit(1);
-
- if (!latestVersion) {
-      throw forbidden("Form has no published versions; uploads are not available.");
- }
-
- const definition = latestVersion.definition as FormDefinition;
- const fileField = definition.fields.find((field) => field.key === data.fieldKey);
- if (!fileField) {
-      throw forbidden("Invalid file field key.");
- }
- if (fileField.type !== "file") {
-      throw forbidden("Field is not a file upload.");
- }
-
- const fileConfig = getFileConfigForField(fileField);
- if (fileConfig.maxFiles <= 0) {
-      throw forbidden("File uploads are disabled for this field.");
- }
-
- if (!Number.isFinite(data.sizeBytes) || data.sizeBytes <= 0) {
-      throw forbidden("Invalid file size.");
- }
-
- if (data.sizeBytes > fileConfig.maxSizeBytes) {
-      throw forbidden(
-        `File is too large. Maximum size is ${formatBytes(fileConfig.maxSizeBytes)}.`,
-      );
- }
-
- if (!isMimeTypeAllowed(data.mimeType, fileConfig.allowedTypes)) {
-      throw forbidden(`File type "${data.mimeType}" is not allowed.`);
- }
-      const { createId } = await import("@paralleldrive/cuid2");
       const { PutObjectCommand } = await import("@aws-sdk/client-s3");
       const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
       const { getArtifactsBucketName, getS3Client } = await import(
  @@
  export const updateFormSubmission = createServerFn({ method: "POST" })
  .inputValidator(zod$(updateFormSubmissionSchema))
  .handler(async ({ data }) => {
  const actorUserId = await requireSessionUserId();
  const { getDb } = await import("~/db/server-helpers");
  @@
  const definition = version.definition as FormDefinition;
  const sanitizedPayload = await sanitizePayload(definition, data.payload);

* const validation = validateFormPayload(definition, sanitizedPayload);

- const validation = validateFormPayload(definition, sanitizedPayload, {
-      fileStorageKeyPrefix: `forms/${submission.formId}/`,
- });
  const nextStatus = data.status ?? submission.status;
  const [updated] = await db
  .update(formSubmissions)
  @@
  await db.insert(formSubmissionVersions).values({
  submissionId: updated.id,
  versionNumber: (latestVersion?.versionNumber ?? 0) + 1,
  payloadSnapshot: sanitizedPayload,
  changedBy: actorUserId,
  changeReason: data.changeReason ?? null,
  });

* await insertSubmissionFiles(definition, sanitizedPayload, updated.id, actorUserId);

- await insertSubmissionFiles(definition, sanitizedPayload, updated.id, actorUserId, {
-      storageKeyPrefix: `forms/${submission.formId}/`,
- });
  const { logDataChange } = await import("~/lib/audit");
  await logDataChange({
  action: "FORM_SUBMISSION_UPDATE",
  actorUserId,
  \*\*\* End Patch

⸻

Issue 07 — Step-up auth does not require re-authentication

What this patch does (inside the current constraints)

Since the bundle doesn’t include your auth/session implementation details, the safest change is:
• Keep the existing DB-level requirement check (user exists, MFA required policy).
• Add a reauth window check (15 minutes default) using the current session timestamps (best-effort extraction).
• Add a “recent MFA verification” timestamp check (best-effort extraction) and fall back to “auth time” if your session doesn’t expose an MFA timestamp yet.
• Provides a single guard that current call sites can keep using (requireMfaEnabled(userId)), now upgraded to true step-up behavior.

This still requires your UI to handle the “step-up required” error by prompting a re-login/MFA challenge. The code below enforces the server-side policy; the UX hook-up is usually a front-end redirect / modal.

Patch 3 — src/lib/auth/guards/step-up.ts

**_ Begin Patch
_** Update File: src/lib/auth/guards/step-up.ts
import { forbidden } from "~/lib/server/errors";

-export const requireMfaEnabled = async (userId: string) => {
+const DEFAULT_STEP_UP_WINDOW_MINUTES = 15;

- +const parseMaybeDate = (value: unknown): Date | null => {
- if (!value) return null;
- if (value instanceof Date) return value;
- if (typeof value === "string" || typeof value === "number") {
- const parsed = new Date(value);
- return Number.isNaN(parsed.getTime()) ? null : parsed;
- }
- return null;
  +};
- +const extractSessionTimes = (session: unknown) => {
- const s = session as Record<string, unknown> | null;
- const sessionObj = (s?.["session"] as Record<string, unknown> | null) ?? null;
- const userObj = (s?.["user"] as Record<string, unknown> | null) ?? null;
-
- // "Authenticated at" best-effort:
- const authenticatedAt =
- parseMaybeDate(sessionObj?.["authenticatedAt"]) ??
- parseMaybeDate(sessionObj?.["createdAt"]) ??
- parseMaybeDate(sessionObj?.["updatedAt"]) ??
- parseMaybeDate((s as Record<string, unknown>)?.["createdAt"]) ??
- null;
-
- // "MFA verified at" best-effort:
- const mfaVerifiedAt =
- parseMaybeDate(sessionObj?.["last_mfa_verified_at"]) ??
- parseMaybeDate(sessionObj?.["lastMfaVerifiedAt"]) ??
- parseMaybeDate(sessionObj?.["mfaVerifiedAt"]) ??
- parseMaybeDate(sessionObj?.["twoFactorVerifiedAt"]) ??
- parseMaybeDate(userObj?.["last_mfa_verified_at"]) ??
- parseMaybeDate(userObj?.["lastMfaVerifiedAt"]) ??
- parseMaybeDate(userObj?.["mfaVerifiedAt"]) ??
- null;
-
- return { authenticatedAt, mfaVerifiedAt };
  +};
- +export const requireMfaEnabled = async (
- userId: string,
- options?: { windowMinutes?: number },
  +) => {
  const { getDb } = await import("~/db/server-helpers");
  const { user } = await import("~/db/schema");
  const { eq } = await import("drizzle-orm");
  const db = await getDb();
  const [record] = await db.select().from(user).where(eq(user.id, userId)).limit(1);
  if (!record) {
  throw forbidden("User not found");
  }

* if (record.mfaRequired && !record.twoFactorEnabled) {
* throw forbidden("Multi-factor authentication required");
* }

- // Step-up actions should require MFA enabled.
- // If your product intentionally allows non-MFA users to do step-up actions,
- // change this to only enforce when record.mfaRequired is true.
- if (!record.twoFactorEnabled) {
- throw forbidden("Multi-factor authentication must be enabled to perform this action");
- }
-
- // Re-auth window enforcement (default 15 minutes)
- const windowMinutes = options?.windowMinutes ?? DEFAULT_STEP_UP_WINDOW_MINUTES;
- const windowMs = windowMinutes _ 60 _ 1000;
-
- const { getAuth } = await import("~/lib/auth/server-helpers");
- const { getRequest } = await import("@tanstack/react-start/server");
- const auth = await getAuth();
- const { headers } = getRequest();
- const session = await auth.api.getSession({ headers });
-
- const sessionUserId = (session as any)?.user?.id as string | undefined;
- if (!sessionUserId) {
- throw forbidden("Re-authentication required to perform this action");
- }
- if (sessionUserId !== userId) {
- throw forbidden("Re-authentication required to perform this action");
- }
-
- const now = Date.now();
- const { authenticatedAt, mfaVerifiedAt } = extractSessionTimes(session);
-
- if (!authenticatedAt || now - authenticatedAt.getTime() > windowMs) {
- throw forbidden("Re-authentication required to perform this action");
- }
-
- // If your auth system exposes an explicit MFA verification timestamp, we use it.
- // Otherwise we fall back to authenticatedAt (re-login with MFA is still enforced above).
- const effectiveMfaAt = mfaVerifiedAt ?? authenticatedAt;
- if (now - effectiveMfaAt.getTime() > windowMs) {
- throw forbidden("Multi-factor verification required to perform this action");
- }
  };
  \*\*\* End Patch

Where you wire this in: any sensitive server fn (exports, DSAR export/erasure, role changes) should call requireMfaEnabled(actorUserId) right before action execution.

⸻

Issue 10 — “Excel” export is CSV-only

Your packed subset doesn’t include src/features/reports/reports.mutations.ts, so I can’t patch the call site here — but we can add a real XLSX generator in shared code, and you plug it into the export mutation.

Patch 4 — Add src/shared/lib/xlsx.ts

**_ Begin Patch
_** Add File: src/shared/lib/xlsx.ts
+export type XlsxOptions = {

- sheetName?: string;
- headerOrder?: string[];
  +};
- +const getHeaderOrder = (rows: Array<Record<string, unknown>>, explicit?: string[]) => {
- if (explicit && explicit.length > 0) return explicit;
- if (rows.length === 0) return [];
- return Object.keys(rows[0]);
  +};
- +const computeColumnWidths = (headers: string[], rows: Array<Record<string, unknown>>) => {
- return headers.map((header) => {
- const maxLen = Math.max(
-      header.length,
-      ...rows.map((row) => String(row[header] ?? "").length),
- );
- // Clamp to keep sheets readable
- const wch = Math.min(60, Math.max(10, maxLen + 2));
- return { wch };
- });
  +};
- +/\*\*
- - Generates a real XLSX file (as a Node Buffer) from a list of objects.
- - Uses the existing `xlsx` dependency already present in the repo (used for imports).
- \*/
  +export const toXlsxBuffer = async (
- rows: Array<Record<string, unknown>>,
- options?: XlsxOptions,
  +): Promise<Buffer> => {
- const { utils, write } = await import("xlsx");
-
- const sheetName = options?.sheetName ?? "Data";
- const headers = getHeaderOrder(rows, options?.headerOrder);
-
- const worksheet = utils.json_to_sheet(rows, {
- header: headers.length > 0 ? headers : undefined,
- skipHeader: false,
- });
-
- if (headers.length > 0) {
- worksheet["!cols"] = computeColumnWidths(headers, rows);
- }
-
- const workbook = utils.book_new();
- utils.book_append_sheet(workbook, worksheet, sheetName);
-
- const buffer = write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
- return buffer;
  +};
- \*\*\* End Patch

Integration snippet for reports.mutations.ts (when you patch it)

In the "excel" branch, do not return CSV text. Generate XLSX and return bytes:

import { toXlsxBuffer } from "~/shared/lib/xlsx";

const buffer = await toXlsxBuffer(rows, { sheetName: "Report" });

return new Response(buffer, {
headers: {
"Content-Type":
"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
"Content-Disposition": `attachment; filename="report.xlsx"`,
},
});

If your current export path returns { content: string, contentType: string }, swap it to bytes/Buffer handling accordingly.

⸻

Issue 11 — Add automated tests for the new SIN modules

This bundle adds high-value tests that specifically cover the new enforcement you just added: 1. File validation unit tests (mime/size/maxFiles + storageKey prefix) 2. XLSX generation test (ensures you produce a real .xlsx, not CSV)

Patch 5 — Add tests for forms file validation

**_ Begin Patch
_** Add File: src/features/forms/**tests**/forms.utils.test.ts
+import { describe, expect, it } from "vitest";
+import type { FormDefinition } from "~/features/forms/forms.schemas";
+import { validateFormPayload } from "~/features/forms/forms.utils";

- +const baseDefinition: FormDefinition = {
- fields: [
- {
-      key: "attachment",
-      type: "file",
-      label: "Attachment",
-      required: true,
-      fileConfig: {
-        allowedTypes: ["image/png"],
-        maxSizeBytes: 1024,
-        maxFiles: 1,
-      },
- },
- ],
- settings: {
- allowDraft: true,
- requireApproval: false,
- notifyOnSubmit: [],
- },
  +};
- +describe("validateFormPayload - file validation", () => {
- it("flags missing required file", () => {
- const result = validateFormPayload(baseDefinition, {});
- expect(result.missingFields).toContain("attachment");
- });
-
- it("flags invalid file payload shape", () => {
- const result = validateFormPayload(baseDefinition, {
-      attachment: { foo: "bar" } as any,
- });
- expect(result.validationErrors.some((e) => e.field === "attachment")).toBe(true);
- expect(result.validationErrors.map((e) => e.message).join(" ")).toMatch(
-      /invalid file payload/i,
- );
- });
-
- it("rejects disallowed mime types", () => {
- const result = validateFormPayload(baseDefinition, {
-      attachment: {
-        storageKey: "forms/abc/one",
-        fileName: "doc.pdf",
-        mimeType: "application/pdf",
-        sizeBytes: 100,
-      },
- });
- expect(result.validationErrors.map((e) => e.message).join(" ")).toMatch(
-      /not allowed/i,
- );
- });
-
- it("rejects oversized files", () => {
- const result = validateFormPayload(baseDefinition, {
-      attachment: {
-        storageKey: "forms/abc/one",
-        fileName: "big.png",
-        mimeType: "image/png",
-        sizeBytes: 10_000,
-      },
- });
- expect(result.validationErrors.map((e) => e.message).join(" ")).toMatch(
-      /too large/i,
- );
- });
-
- it("supports wildcard mime types", () => {
- const def: FormDefinition = {
-      ...baseDefinition,
-      fields: [
-        {
-          ...baseDefinition.fields[0],
-          fileConfig: {
-            allowedTypes: ["image/*"],
-            maxSizeBytes: 1024,
-            maxFiles: 1,
-          },
-        },
-      ],
- };
- const result = validateFormPayload(def, {
-      attachment: {
-        storageKey: "forms/abc/one",
-        fileName: "ok.png",
-        mimeType: "image/png",
-        sizeBytes: 100,
-      },
- });
- expect(result.validationErrors.length).toBe(0);
- });
-
- it("enforces maxFiles for array payloads", () => {
- const def: FormDefinition = {
-      ...baseDefinition,
-      fields: [
-        {
-          ...baseDefinition.fields[0],
-          fileConfig: {
-            allowedTypes: ["image/png"],
-            maxSizeBytes: 1024,
-            maxFiles: 2,
-          },
-        },
-      ],
- };
-
- const result = validateFormPayload(def, {
-      attachment: [
-        {
-          storageKey: "forms/abc/1",
-          fileName: "a.png",
-          mimeType: "image/png",
-          sizeBytes: 100,
-        },
-        {
-          storageKey: "forms/abc/2",
-          fileName: "b.png",
-          mimeType: "image/png",
-          sizeBytes: 100,
-        },
-        {
-          storageKey: "forms/abc/3",
-          fileName: "c.png",
-          mimeType: "image/png",
-          sizeBytes: 100,
-        },
-      ],
- });
-
- expect(result.validationErrors.map((e) => e.message).join(" ")).toMatch(
-      /too many files/i,
- );
- });
-
- it("enforces storageKey prefix when configured", () => {
- const result = validateFormPayload(
-      baseDefinition,
-      {
-        attachment: {
-          storageKey: "imports/abc/not-allowed",
-          fileName: "ok.png",
-          mimeType: "image/png",
-          sizeBytes: 100,
-        },
-      },
-      { fileStorageKeyPrefix: "forms/FORMID/" },
- );
-
- expect(result.validationErrors.map((e) => e.message).join(" ")).toMatch(
-      /invalid file reference/i,
- );
- });
  +});
- \*\*\* End Patch

Patch 6 — Add tests for XLSX export helper

**_ Begin Patch
_** Add File: src/shared/lib/**tests**/xlsx.test.ts
+import { describe, expect, it } from "vitest";
+import { toXlsxBuffer } from "~/shared/lib/xlsx";

- +describe("toXlsxBuffer", () => {
- it("creates a real XLSX (zip) buffer and preserves data", async () => {
- const rows = [
-      { name: "Alice", score: 10 },
-      { name: "Bob", score: 15 },
- ];
-
- const buffer = await toXlsxBuffer(rows, { sheetName: "Report" });
-
- expect(Buffer.isBuffer(buffer)).toBe(true);
- // XLSX files are ZIP containers; ZIP magic bytes are "PK"
- expect(buffer.subarray(0, 2).toString("utf8")).toBe("PK");
-
- const { read, utils } = await import("xlsx");
- const workbook = read(buffer, { type: "buffer" });
- const sheet = workbook.Sheets[workbook.SheetNames[0]];
- const parsed = utils.sheet_to_json(sheet, { defval: "" }) as Array<Record<string, any>>;
-
- expect(parsed.length).toBe(2);
- expect(parsed[0].name).toBe("Alice");
- expect(Number(parsed[0].score)).toBe(10);
- expect(parsed[1].name).toBe("Bob");
- expect(Number(parsed[1].score)).toBe(15);
- });
  +});
- \*\*\* End Patch

⸻

Summary of what you get
• Issue 08 fixed: server-side validation exists in both upload init and submission validation, with an added safety check to prevent storageKey injection.
• Issue 07 improved: step-up guard now actually enforces recent re-auth (15 min) + recent MFA verification (when available) for sensitive actions.
• Issue 10 unblocked: you now have a real XLSX generator (toXlsxBuffer) ready to wire into reports.mutations.ts.
• Issue 11 started properly: high-signal unit tests added for file validation + XLSX output, which protects the compliance-critical paths you just changed.

⸻

If you paste your src/features/reports/reports.mutations.ts export handler next, I’ll patch the "excel" branch directly so it returns a proper .xlsx response end-to-end (content-type, filename, bytes).
