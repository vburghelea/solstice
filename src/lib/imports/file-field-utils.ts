import type { FormDefinition } from "~/features/forms/forms.schemas";
import { parseFileFieldValue } from "~/features/forms/forms.utils";
import type { ImportParseError } from "~/features/imports/imports.utils";
import type { JsonRecord, JsonValue } from "~/shared/lib/json";

const getRecord = (value: JsonValue): Record<string, JsonValue> | null => {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, JsonValue>;
  }
  return null;
};

const getStringValue = (record: Record<string, JsonValue>, key: string) => {
  const value = record[key];
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  return null;
};

const extractStorageKeyFromSignedUrl = (signedUrl: string, bucket: string) => {
  try {
    const parsed = new URL(signedUrl);
    const host = parsed.hostname.toLowerCase();
    const path = decodeURIComponent(parsed.pathname.replace(/^\/+/, ""));
    const bucketHost = bucket.toLowerCase();

    if (host.startsWith(`${bucketHost}.`)) {
      return path || null;
    }

    if (host === "s3.amazonaws.com" || host.startsWith("s3.") || host.startsWith("s3-")) {
      const [bucketFromPath, ...rest] = path.split("/");
      if (bucketFromPath?.toLowerCase() === bucketHost) {
        return rest.join("/") || null;
      }
    }
  } catch {
    return null;
  }

  return null;
};

export const normalizeImportFileFields = (params: {
  definition: FormDefinition;
  payload: JsonRecord;
  artifactsBucket: string;
}) => {
  const normalizedPayload: JsonRecord = { ...params.payload };
  const parseErrors: ImportParseError[] = [];

  for (const field of params.definition.fields) {
    if (field.type !== "file") continue;
    if (!(field.key in normalizedPayload)) continue;

    const value = normalizedPayload[field.key];
    const record = getRecord(value);
    if (!record) {
      parseErrors.push({
        fieldKey: field.key,
        errorType: "invalid_file_payload",
        message: "File payload must be a JSON object.",
        rawValue: value ? String(value) : null,
      });
      continue;
    }

    const storageKey = getStringValue(record, "storageKey");
    const artifactKey = getStringValue(record, "artifactKey");
    const signedUrl =
      getStringValue(record, "signedUrl") ?? getStringValue(record, "url");

    let resolvedStorageKey = storageKey ?? artifactKey;
    if (!resolvedStorageKey && signedUrl) {
      resolvedStorageKey = extractStorageKeyFromSignedUrl(
        signedUrl,
        params.artifactsBucket,
      );
      if (!resolvedStorageKey) {
        parseErrors.push({
          fieldKey: field.key,
          errorType: "invalid_file_reference",
          message: "Signed URL must reference the artifacts bucket.",
          rawValue: signedUrl,
        });
        continue;
      }
    }

    if (!resolvedStorageKey) {
      parseErrors.push({
        fieldKey: field.key,
        errorType: "missing_file_reference",
        message: "File payload must include storageKey, artifactKey, or signedUrl.",
        rawValue: null,
      });
      continue;
    }

    const fileName =
      typeof record["fileName"] === "string" ? record["fileName"].trim() : undefined;
    const mimeType =
      typeof record["mimeType"] === "string" ? record["mimeType"].trim() : undefined;
    const sizeBytesRaw =
      typeof record["sizeBytes"] === "number"
        ? record["sizeBytes"]
        : typeof record["size"] === "number"
          ? record["size"]
          : undefined;
    const sizeBytes =
      typeof sizeBytesRaw === "number" && Number.isFinite(sizeBytesRaw)
        ? sizeBytesRaw
        : undefined;
    const checksum = getStringValue(record, "checksum");

    normalizedPayload[field.key] = {
      ...(fileName ? { fileName } : {}),
      ...(mimeType ? { mimeType } : {}),
      ...(sizeBytes !== undefined ? { sizeBytes } : {}),
      storageKey: resolvedStorageKey,
      ...(checksum ? { checksum } : {}),
    };
  }

  return { payload: normalizedPayload, parseErrors };
};

export const buildSubmissionFilesForImport = (params: {
  definition: FormDefinition;
  payload: JsonRecord;
  submissionId: string;
  actorUserId: string;
}) => {
  const files: Array<{
    submissionId: string;
    fieldKey: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    checksum: string;
    storageKey: string;
    uploadedBy: string;
  }> = [];

  for (const field of params.definition.fields) {
    if (field.type !== "file") continue;
    const rawValue = params.payload[field.key];
    const parsedFiles = parseFileFieldValue(rawValue);
    if (parsedFiles.length === 0) continue;

    const record = getRecord(rawValue);
    const checksum =
      record && typeof record["checksum"] === "string" ? record["checksum"] : "";

    for (const file of parsedFiles) {
      if (!file.storageKey) continue;
      files.push({
        submissionId: params.submissionId,
        fieldKey: field.key,
        fileName: file.fileName,
        mimeType: file.mimeType,
        sizeBytes: Number(file.size),
        checksum,
        storageKey: file.storageKey,
        uploadedBy: params.actorUserId,
      });
    }
  }

  return files;
};
