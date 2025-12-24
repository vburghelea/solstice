import type { JsonRecord, JsonValue } from "~/shared/lib/json";
import type { FormDefinition } from "./forms.schemas";

const sanitizeRichText = async (value: JsonValue): Promise<JsonValue> => {
  if (typeof value !== "string") return value;
  const { default: sanitizeHtml } = await import("sanitize-html");

  return sanitizeHtml(value, {
    allowedTags: [
      "p",
      "br",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "ul",
      "ol",
      "li",
      "blockquote",
      "a",
      "span",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      span: ["class"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: (tagName: string, attribs: Record<string, string>) => ({
        tagName,
        attribs: {
          ...attribs,
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
    },
  });
};

const meetsCondition = (
  condition: NonNullable<FormDefinition["fields"][number]["conditional"]>,
  payload: JsonRecord,
) => {
  const left = payload[condition.field];
  const right = condition.value;

  if (condition.operator === "equals") {
    return left === right;
  }

  if (condition.operator === "not_equals") {
    return left !== right;
  }

  if (condition.operator === "contains") {
    if (Array.isArray(left)) {
      return left.includes(right as never);
    }
    if (typeof left === "string") {
      return left.includes(String(right));
    }
    return false;
  }

  if (condition.operator === "greater_than") {
    const leftNum = Number(left);
    const rightNum = Number(right);
    if (Number.isNaN(leftNum) || Number.isNaN(rightNum)) {
      return false;
    }
    return leftNum > rightNum;
  }

  return true;
};

const isFieldActive = (
  definition: FormDefinition,
  fieldKey: string,
  payload: JsonRecord,
) => {
  const field = definition.fields.find((item) => item.key === fieldKey);
  if (!field?.conditional) return true;
  return meetsCondition(field.conditional, payload);
};

export const validateFormPayload = (definition: FormDefinition, payload: JsonRecord) => {
  const missingFields: string[] = [];
  const validationErrors: Array<{ field: string; message: string }> = [];

  for (const field of definition.fields) {
    if (field.conditional && !isFieldActive(definition, field.key, payload)) {
      continue;
    }

    const hasValue = Object.prototype.hasOwnProperty.call(payload, field.key);
    const value = payload[field.key];
    const isEmpty =
      !hasValue || value === null || (typeof value === "string" && value.trim() === "");

    if (field.required && isEmpty) {
      missingFields.push(field.key);
    }

    if (field.validation && !isEmpty) {
      for (const rule of field.validation) {
        if (rule.type === "min_length" && typeof value === "string") {
          if (value.length < Number(rule.value)) {
            validationErrors.push({ field: field.key, message: rule.message });
          }
        }

        if (rule.type === "max_length" && typeof value === "string") {
          if (value.length > Number(rule.value)) {
            validationErrors.push({ field: field.key, message: rule.message });
          }
        }

        if (rule.type === "min" && typeof value === "number") {
          if (value < Number(rule.value)) {
            validationErrors.push({ field: field.key, message: rule.message });
          }
        }

        if (rule.type === "max" && typeof value === "number") {
          if (value > Number(rule.value)) {
            validationErrors.push({ field: field.key, message: rule.message });
          }
        }

        if (rule.type === "pattern" && typeof value === "string") {
          const regex = new RegExp(String(rule.value));
          if (!regex.test(value)) {
            validationErrors.push({ field: field.key, message: rule.message });
          }
        }
      }
    }
  }

  const totalFields = definition.fields.length || 1;
  const completenessScore = Math.max(
    0,
    Math.round(100 - (missingFields.length / totalFields) * 100),
  );

  return { missingFields, validationErrors, completenessScore };
};

export const sanitizePayload = async (
  definition: FormDefinition,
  payload: JsonRecord,
) => {
  const sanitized: JsonRecord = { ...payload };
  for (const field of definition.fields) {
    if (field.type === "rich_text" && field.key in payload) {
      sanitized[field.key] = await sanitizeRichText(payload[field.key]);
    }
  }
  return sanitized;
};

// ============================================================================
// FILE VALIDATION HELPERS (Issue 08 - Server-side file constraints)
// ============================================================================

/**
 * Represents a file upload payload from the client
 */
export type FilePayload = {
  fileName: string;
  mimeType: string;
  size: number;
  storageKey?: string;
};

/**
 * File configuration from form field definition
 */
export type FileConfig = {
  allowedTypes?: string[];
  maxSizeBytes?: number;
  maxFiles?: number;
};

/**
 * Default file config if not specified in form definition
 */
const DEFAULT_FILE_CONFIG: FileConfig = {
  allowedTypes: [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  maxSizeBytes: 10 * 1024 * 1024, // 10MB
  maxFiles: 5,
};

/**
 * Parse a file field value from the payload
 */
export const parseFileFieldValue = (value: JsonValue): FilePayload[] => {
  if (!value) return [];

  // Single file object
  if (typeof value === "object" && !Array.isArray(value) && value !== null) {
    const obj = value as Record<string, JsonValue>;
    const fileName = obj["fileName"];
    const mimeType = obj["mimeType"];
    const size = obj["size"];
    const storageKey = obj["storageKey"];
    if (typeof fileName === "string" && typeof mimeType === "string") {
      return [
        {
          fileName,
          mimeType,
          size: typeof size === "number" ? size : 0,
          ...(typeof storageKey === "string" ? { storageKey } : {}),
        },
      ];
    }
    return [];
  }

  // Array of file objects
  if (Array.isArray(value)) {
    return value
      .filter(
        (item): item is Record<string, JsonValue> =>
          typeof item === "object" && item !== null && !Array.isArray(item),
      )
      .filter((item) => {
        const fn = item["fileName"];
        const mt = item["mimeType"];
        return typeof fn === "string" && typeof mt === "string";
      })
      .map((item) => {
        const fn = item["fileName"] as string;
        const mt = item["mimeType"] as string;
        const sz = item["size"];
        const sk = item["storageKey"];
        return {
          fileName: fn,
          mimeType: mt,
          size: typeof sz === "number" ? sz : 0,
          ...(typeof sk === "string" ? { storageKey: sk } : {}),
        };
      });
  }

  return [];
};

/**
 * Get the file config for a specific field from the form definition
 */
export const getFileConfigForField = (
  definition: FormDefinition,
  fieldKey: string,
): FileConfig => {
  const field = definition.fields.find((f) => f.key === fieldKey);
  if (!field || field.type !== "file") {
    return DEFAULT_FILE_CONFIG;
  }

  const fileConfig = field.fileConfig;
  if (!fileConfig) {
    return DEFAULT_FILE_CONFIG;
  }

  return {
    allowedTypes: fileConfig.allowedTypes ?? DEFAULT_FILE_CONFIG.allowedTypes,
    maxSizeBytes: fileConfig.maxSizeBytes ?? DEFAULT_FILE_CONFIG.maxSizeBytes,
    maxFiles: fileConfig.maxFiles ?? DEFAULT_FILE_CONFIG.maxFiles,
  };
};

/**
 * Check if a mime type is allowed by the file config
 */
export const isMimeTypeAllowed = (mimeType: string, allowedTypes?: string[]): boolean => {
  if (!allowedTypes || allowedTypes.length === 0) return true;

  const normalizedMime = mimeType.toLowerCase().trim();

  for (const allowed of allowedTypes) {
    const normalizedAllowed = allowed.toLowerCase().trim();

    // Exact match
    if (normalizedMime === normalizedAllowed) return true;

    // Wildcard match (e.g., "image/*")
    if (normalizedAllowed.endsWith("/*")) {
      const category = normalizedAllowed.slice(0, -2);
      if (normalizedMime.startsWith(category + "/")) return true;
    }
  }

  return false;
};

/**
 * Validate a file upload against the form field's configuration
 */
export const validateFileUpload = (
  file: FilePayload,
  config: FileConfig,
): { valid: boolean; error?: string } => {
  // Validate mime type
  if (!isMimeTypeAllowed(file.mimeType, config.allowedTypes)) {
    return {
      valid: false,
      error: `File type "${file.mimeType}" is not allowed. Allowed types: ${config.allowedTypes?.join(", ")}`,
    };
  }

  // Validate file size
  if (config.maxSizeBytes && file.size > config.maxSizeBytes) {
    const maxMB = Math.round(config.maxSizeBytes / (1024 * 1024));
    const fileMB = Math.round((file.size / (1024 * 1024)) * 10) / 10;
    return {
      valid: false,
      error: `File size (${fileMB}MB) exceeds maximum allowed size (${maxMB}MB)`,
    };
  }

  return { valid: true };
};

/**
 * Validate all files for a file field against the form configuration
 */
export const validateFileField = (
  definition: FormDefinition,
  fieldKey: string,
  files: FilePayload[],
): { valid: boolean; errors: string[] } => {
  const config = getFileConfigForField(definition, fieldKey);
  const errors: string[] = [];

  // Check max files limit
  if (config.maxFiles && files.length > config.maxFiles) {
    errors.push(`Too many files (${files.length}). Maximum allowed: ${config.maxFiles}`);
  }

  // Validate each file
  for (const file of files) {
    const result = validateFileUpload(file, config);
    if (!result.valid && result.error) {
      errors.push(`${file.fileName}: ${result.error}`);
    }
  }

  return { valid: errors.length === 0, errors };
};

/**
 * Validate storage key prefix to prevent path traversal attacks
 */
export const isValidStorageKeyPrefix = (
  storageKey: string,
  expectedPrefix: string,
): boolean => {
  if (!storageKey || !expectedPrefix) return false;

  // Normalize and check prefix
  const normalizedKey = storageKey.replace(/^\/+/, "").toLowerCase();
  const normalizedPrefix = expectedPrefix.replace(/^\/+/, "").toLowerCase();

  // Check it starts with expected prefix
  if (!normalizedKey.startsWith(normalizedPrefix)) return false;

  // Check for path traversal attempts
  if (normalizedKey.includes("..")) return false;
  if (normalizedKey.includes("//")) return false;

  return true;
};
