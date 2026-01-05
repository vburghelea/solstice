import type { ParseResult } from "papaparse";
import type { FormDefinition } from "~/features/forms/forms.schemas";
import type { JsonRecord, JsonValue } from "~/shared/lib/json";

export const parseCsvFile = async (file: File): Promise<JsonRecord[]> => {
  const Papa = await import("papaparse");
  return new Promise<JsonRecord[]>((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result: ParseResult<JsonRecord>) => resolve(result.data as JsonRecord[]),
      error: (error: Error) => reject(error),
    });
  });
};

export const parseExcelFile = async (file: File): Promise<JsonRecord[]> => {
  const { read, utils } = await import("xlsx");
  const buffer =
    typeof file.arrayBuffer === "function"
      ? await file.arrayBuffer()
      : await new Response(file).arrayBuffer();
  const data = new Uint8Array(buffer);
  const workbook = read(data, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return utils.sheet_to_json(sheet, { defval: "" }) as JsonRecord[];
};

export const parseImportFile = async (file: File) => {
  const lowerName = file.name.toLowerCase();
  if (lowerName.endsWith(".csv")) {
    return { type: "csv" as const, rows: await parseCsvFile(file) };
  }
  if (lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls")) {
    return { type: "excel" as const, rows: await parseExcelFile(file) };
  }
  throw new Error("Unsupported file type. Please upload CSV or Excel.");
};

export type ImportFieldLookup = Map<string, FormDefinition["fields"][number]>;

export type ImportParseError = {
  fieldKey: string | null;
  errorType: string;
  message: string;
  rawValue: string | null;
};

const isEmptyValue = (value: JsonValue) =>
  value === null ||
  value === undefined ||
  (typeof value === "string" && value.trim() === "");

const parseBooleanValue = (value: JsonValue) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "yes", "y", "1"].includes(normalized)) return true;
    if (["false", "no", "n", "0"].includes(normalized)) return false;
  }
  return null;
};

const parseNumberValue = (value: JsonValue) => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const normalized = value.replace(/,/g, "").trim();
    if (!normalized) return null;
    const parsed = Number(normalized);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return null;
};

const toStringValue = (value: JsonValue) => {
  if (typeof value === "string") return value.trim();
  if (value === null || value === undefined) return "";
  return String(value);
};

const parseFilePayloadRecord = (rawValue: JsonValue) => {
  if (typeof rawValue === "object" && rawValue !== null && !Array.isArray(rawValue)) {
    return { record: rawValue as JsonRecord, isArray: false };
  }

  if (Array.isArray(rawValue)) {
    return { record: null, isArray: true };
  }

  if (typeof rawValue === "string") {
    const trimmed = rawValue.trim();
    if (!trimmed) return { record: null, isArray: false };
    if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
      return { record: null, isArray: false };
    }
    try {
      const parsed = JSON.parse(trimmed) as JsonValue;
      if (Array.isArray(parsed)) {
        return { record: null, isArray: true };
      }
      if (typeof parsed === "object" && parsed !== null) {
        return { record: parsed as JsonRecord, isArray: false };
      }
      return { record: null, isArray: false };
    } catch {
      return { record: null, isArray: false };
    }
  }

  return { record: null, isArray: false };
};

const parseFileImportValue = (rawValue: JsonValue) => {
  const { record, isArray } = parseFilePayloadRecord(rawValue);
  if (isArray) {
    return {
      payload: null,
      error: {
        errorType: "multi_file_not_supported",
        message: "Multiple files are not supported. Provide a single file object.",
        rawValue: toStringValue(rawValue),
      },
    };
  }

  if (!record) {
    return {
      payload: null,
      error: {
        errorType: "invalid_file_payload",
        message:
          "File fields require JSON with fileName, mimeType, sizeBytes, and storageKey or signedUrl.",
        rawValue: toStringValue(rawValue),
      },
    };
  }

  const fileName =
    typeof record["fileName"] === "string" ? record["fileName"].trim() : null;
  const mimeType =
    typeof record["mimeType"] === "string" ? record["mimeType"].trim() : null;
  const sizeBytes = parseNumberValue(record["sizeBytes"] ?? record["size"]);
  const storageKey =
    typeof record["storageKey"] === "string" ? record["storageKey"].trim() : null;
  const artifactKey =
    typeof record["artifactKey"] === "string" ? record["artifactKey"].trim() : null;
  const signedUrl =
    typeof record["signedUrl"] === "string" ? record["signedUrl"].trim() : null;
  const url = typeof record["url"] === "string" ? record["url"].trim() : null;
  const checksum =
    typeof record["checksum"] === "string" ? record["checksum"].trim() : null;

  if (!fileName || !mimeType || sizeBytes === null) {
    return {
      payload: null,
      error: {
        errorType: "invalid_file_payload",
        message: "File payload must include fileName, mimeType, and sizeBytes.",
        rawValue: toStringValue(rawValue),
      },
    };
  }

  if (!storageKey && !artifactKey && !signedUrl && !url) {
    return {
      payload: null,
      error: {
        errorType: "missing_file_reference",
        message: "File payload must include storageKey, artifactKey, or signedUrl.",
        rawValue: toStringValue(rawValue),
      },
    };
  }

  const payload: JsonRecord = {
    fileName,
    mimeType,
    sizeBytes,
    ...(storageKey ? { storageKey } : {}),
    ...(artifactKey ? { artifactKey } : {}),
    ...(signedUrl || url ? { signedUrl: signedUrl ?? url } : {}),
    ...(checksum ? { checksum } : {}),
  };

  return { payload, error: null };
};

export const buildImportFieldLookup = (definition: FormDefinition): ImportFieldLookup =>
  new Map(definition.fields.map((field) => [field.key, field]));

export const getMappedFileFields = (
  mapping: Record<string, string>,
  fieldLookup: ImportFieldLookup,
) => {
  const fileFields = new Set<string>();
  for (const fieldKey of Object.values(mapping)) {
    if (!fieldKey) continue;
    const field = fieldLookup.get(fieldKey);
    if (field?.type === "file") {
      fileFields.add(field.key);
    }
  }
  return Array.from(fileFields);
};

export const parseImportRow = (
  row: JsonRecord,
  mapping: Record<string, string>,
  fieldLookup: ImportFieldLookup,
) => {
  const payload: JsonRecord = {};
  const parseErrors: ImportParseError[] = [];

  for (const [header, fieldKey] of Object.entries(mapping)) {
    if (!fieldKey) continue;
    const field = fieldLookup.get(fieldKey);
    if (!field) {
      parseErrors.push({
        fieldKey,
        errorType: "unknown_field",
        message: "Mapped field is not in the form definition",
        rawValue: null,
      });
      continue;
    }

    const rawValue = row[header] as JsonValue;
    if (isEmptyValue(rawValue)) continue;

    if (field.type === "number") {
      const parsed = parseNumberValue(rawValue);
      if (parsed === null) {
        parseErrors.push({
          fieldKey: field.key,
          errorType: "invalid_number",
          message: "Invalid number value",
          rawValue: toStringValue(rawValue),
        });
        continue;
      }
      payload[field.key] = parsed;
      continue;
    }

    if (field.type === "checkbox") {
      const parsed = parseBooleanValue(rawValue);
      if (parsed === null) {
        parseErrors.push({
          fieldKey: field.key,
          errorType: "invalid_boolean",
          message: "Invalid boolean value",
          rawValue: toStringValue(rawValue),
        });
        continue;
      }
      payload[field.key] = parsed;
      continue;
    }

    if (field.type === "multiselect") {
      if (Array.isArray(rawValue)) {
        payload[field.key] = rawValue.map((entry) => toStringValue(entry));
        continue;
      }
      if (typeof rawValue === "string") {
        const values = rawValue
          .split(",")
          .map((entry) => entry.trim())
          .filter(Boolean);
        payload[field.key] = values;
        continue;
      }
      parseErrors.push({
        fieldKey: field.key,
        errorType: "invalid_multiselect",
        message: "Invalid multi-select value",
        rawValue: toStringValue(rawValue),
      });
      continue;
    }

    if (field.type === "date") {
      if (rawValue instanceof Date) {
        payload[field.key] = rawValue.toISOString().slice(0, 10);
        continue;
      }
      if (typeof rawValue === "string") {
        payload[field.key] = rawValue.trim();
        continue;
      }
      parseErrors.push({
        fieldKey: field.key,
        errorType: "invalid_date",
        message: "Invalid date value",
        rawValue: toStringValue(rawValue),
      });
      continue;
    }

    if (field.type === "file") {
      const { payload: filePayload, error } = parseFileImportValue(rawValue);
      if (error) {
        parseErrors.push({ fieldKey: field.key, ...error });
        continue;
      }
      if (filePayload) {
        payload[field.key] = filePayload;
      }
      continue;
    }

    payload[field.key] = rawValue;
  }

  return { payload, parseErrors };
};
