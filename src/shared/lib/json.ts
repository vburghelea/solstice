import { z } from "zod";

export type JsonPrimitive = string | number | boolean | null | undefined;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
export type JsonRecord = Record<string, JsonValue>;

const BLOCKED_RECORD_KEYS = new Set(["__proto__", "constructor", "prototype"]);

export const sanitizeJsonRecord = (record: JsonRecord): JsonRecord => {
  const sanitized: JsonRecord = Object.create(null);
  for (const [key, value] of Object.entries(record)) {
    if (BLOCKED_RECORD_KEYS.has(key)) continue;
    sanitized[key] = value;
  }
  return sanitized;
};

export const sanitizeJsonRecords = (records: JsonRecord[]): JsonRecord[] =>
  records.map((record) => sanitizeJsonRecord(record));

export const jsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.undefined(),
    z.array(jsonValueSchema),
    z.record(z.string(), jsonValueSchema),
  ]),
);

export const jsonRecordSchema: z.ZodType<JsonRecord> = z.record(
  z.string(),
  jsonValueSchema,
);
