import { createServerOnlyFn } from "@tanstack/react-start";
import { asc, desc } from "drizzle-orm";
import { getRequestContext } from "~/lib/server/request-context";
import { resolveRequestId } from "~/lib/server/request-id";
import type { JsonRecord, JsonValue } from "~/shared/lib/json";

export type AuditActionCategory = "AUTH" | "ADMIN" | "DATA" | "EXPORT" | "SECURITY";

export interface AuditEntryInput {
  action: string;
  actionCategory?: AuditActionCategory;
  actorUserId?: string | null;
  actorOrgId?: string | null;
  actorIp?: string | null;
  actorUserAgent?: string | null;
  targetType?: string | null;
  targetId?: string | null;
  targetOrgId?: string | null;
  changes?: Record<string, { old?: JsonValue; new?: JsonValue }> | null;
  metadata?: JsonRecord;
  requestId?: string;
}

const HASH_FIELDS = ["dateOfBirth", "phone", "emergencyContact.phone"];
const REDACT_FIELDS = ["password", "secret", "token", "mfaSecret"];

const shouldRedact = (field: string) =>
  REDACT_FIELDS.some(
    (redacted) => field === redacted || field.startsWith(`${redacted}.`),
  );

const shouldHash = (field: string) =>
  HASH_FIELDS.some((hashed) => field === hashed || field.startsWith(`${hashed}.`));

const stableStringify = (value: unknown): string => {
  if (value === null || value === undefined) {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => `"${key}":${stableStringify(val)}`);
    return `{${entries.join(",")}}`;
  }

  return JSON.stringify(value);
};

const hashValue = async (value: unknown): Promise<string> => {
  const { createHash } = await import("crypto");
  return createHash("sha256").update(stableStringify(value)).digest("hex");
};

const toJsonValue = (value: unknown): JsonValue => {
  if (value === undefined) return null;
  if (typeof value === "bigint") return value.toString();
  if (typeof value === "symbol") return value.toString();
  if (typeof value === "function") return null;

  try {
    return JSON.parse(JSON.stringify(value)) as JsonValue;
  } catch {
    return String(value);
  }
};

const sanitizeValue = async (field: string, value: unknown): Promise<JsonValue> => {
  if (shouldRedact(field)) {
    return "[REDACTED]";
  }

  if (shouldHash(field)) {
    return await hashValue(value);
  }

  return toJsonValue(value);
};

const sanitizeChanges = async (
  changes?: Record<string, { old?: unknown; new?: unknown }> | null,
) => {
  if (!changes) return null;

  const entries = await Promise.all(
    Object.entries(changes).map(async ([field, change]) => {
      return [
        field,
        {
          old: await sanitizeValue(field, change.old),
          new: await sanitizeValue(field, change.new),
        },
      ] as const;
    }),
  );

  return Object.fromEntries(entries) as Record<
    string,
    { old?: JsonValue; new?: JsonValue }
  >;
};

export const createAuditDiff = async (
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
) => {
  const changes: Record<string, { old?: JsonValue; new?: JsonValue }> = {};
  const beforeData = before ?? {};
  const afterData = after ?? {};
  const keys = new Set([...Object.keys(beforeData), ...Object.keys(afterData)]);

  for (const key of keys) {
    const oldValue = beforeData[key];
    const newValue = afterData[key];
    const isSame =
      oldValue === newValue || stableStringify(oldValue) === stableStringify(newValue);

    if (!isSame) {
      changes[key] = { old: toJsonValue(oldValue), new: toJsonValue(newValue) };
    }
  }

  return sanitizeChanges(changes);
};

const inferCategory = (action: string): AuditActionCategory => {
  const [prefix] = action.split(".");
  if (!prefix) return "DATA";
  const normalized = prefix.toUpperCase() as AuditActionCategory;
  return ["AUTH", "ADMIN", "DATA", "EXPORT", "SECURITY"].includes(normalized)
    ? normalized
    : "DATA";
};

const resolveRequestContext = () => {
  const context = getRequestContext();
  const headers = context?.headers;
  const actorIp = headers?.get("x-forwarded-for") ?? headers?.get("x-real-ip") ?? null;
  const actorUserAgent = headers?.get("user-agent") ?? null;

  return {
    headers,
    requestId: context?.requestId ?? null,
    actorIp,
    actorUserAgent,
  };
};

export const logAuditEntry = createServerOnlyFn(async (input: AuditEntryInput) => {
  const { getDb } = await import("~/db/server-helpers");
  const { auditLogs } = await import("~/db/schema");

  const db = await getDb();
  const requestContext = resolveRequestContext();
  const requestId =
    input.requestId ??
    requestContext.requestId ??
    resolveRequestId(requestContext.headers);
  const actorIp = input.actorIp ?? requestContext.actorIp ?? null;
  const actorUserAgent = input.actorUserAgent ?? requestContext.actorUserAgent ?? null;

  const [previous] = await db
    .select({ entryHash: auditLogs.entryHash })
    .from(auditLogs)
    .orderBy(desc(auditLogs.occurredAt))
    .limit(1);

  const prevHash = previous?.entryHash ?? null;
  const sanitizedChanges = await sanitizeChanges(input.changes ?? null);

  const payload = {
    action: input.action,
    actionCategory: input.actionCategory ?? inferCategory(input.action),
    actorUserId: input.actorUserId ?? null,
    actorOrgId: input.actorOrgId ?? null,
    actorIp,
    actorUserAgent,
    targetType: input.targetType ?? null,
    targetId: input.targetId ?? null,
    targetOrgId: input.targetOrgId ?? null,
    changes: sanitizedChanges,
    metadata: input.metadata ?? {},
    requestId,
    prevHash,
  };

  const entryHash = await hashValue(payload);

  await db.insert(auditLogs).values({
    occurredAt: new Date(),
    actorUserId: payload.actorUserId,
    actorOrgId: payload.actorOrgId,
    actorIp: payload.actorIp ?? undefined,
    actorUserAgent: payload.actorUserAgent ?? undefined,
    action: payload.action,
    actionCategory: payload.actionCategory,
    targetType: payload.targetType,
    targetId: payload.targetId,
    targetOrgId: payload.targetOrgId ?? null,
    changes: payload.changes ?? undefined,
    metadata: payload.metadata,
    requestId,
    prevHash: payload.prevHash ?? undefined,
    entryHash,
  });
});

export const logAuthEvent = async (params: Omit<AuditEntryInput, "actionCategory">) =>
  logAuditEntry({
    ...params,
    actionCategory: "AUTH",
  });

export const logAdminAction = async (params: Omit<AuditEntryInput, "actionCategory">) =>
  logAuditEntry({
    ...params,
    actionCategory: "ADMIN",
  });

export const logDataChange = async (params: Omit<AuditEntryInput, "actionCategory">) =>
  logAuditEntry({
    ...params,
    actionCategory: "DATA",
  });

export const logExportEvent = async (params: Omit<AuditEntryInput, "actionCategory">) =>
  logAuditEntry({
    ...params,
    actionCategory: "EXPORT",
  });

export const logSecurityEvent = async (params: Omit<AuditEntryInput, "actionCategory">) =>
  logAuditEntry({
    ...params,
    actionCategory: "SECURITY",
  });

export const verifyAuditHashChain = createServerOnlyFn(async () => {
  const { getDb } = await import("~/db/server-helpers");
  const { auditLogs } = await import("~/db/schema");

  const db = await getDb();
  const rows = await db
    .select({
      id: auditLogs.id,
      entryHash: auditLogs.entryHash,
      prevHash: auditLogs.prevHash,
      action: auditLogs.action,
      actionCategory: auditLogs.actionCategory,
      actorUserId: auditLogs.actorUserId,
      actorOrgId: auditLogs.actorOrgId,
      actorIp: auditLogs.actorIp,
      actorUserAgent: auditLogs.actorUserAgent,
      targetType: auditLogs.targetType,
      targetId: auditLogs.targetId,
      targetOrgId: auditLogs.targetOrgId,
      changes: auditLogs.changes,
      metadata: auditLogs.metadata,
      requestId: auditLogs.requestId,
      occurredAt: auditLogs.occurredAt,
    })
    .from(auditLogs)
    .orderBy(asc(auditLogs.occurredAt));

  const invalidIds: string[] = [];
  let previousHash: string | null = null;

  for (const row of rows) {
    const payload = {
      action: row.action,
      actionCategory: row.actionCategory as AuditActionCategory,
      actorUserId: row.actorUserId,
      actorOrgId: row.actorOrgId,
      actorIp: row.actorIp,
      actorUserAgent: row.actorUserAgent,
      targetType: row.targetType,
      targetId: row.targetId,
      targetOrgId: row.targetOrgId,
      changes: row.changes ?? null,
      metadata: row.metadata ?? {},
      requestId: row.requestId,
      prevHash: previousHash,
    };

    const expectedHash = await hashValue(payload);
    if (row.prevHash !== previousHash || row.entryHash !== expectedHash) {
      invalidIds.push(row.id);
    }

    previousHash = row.entryHash;
  }

  return { valid: invalidIds.length === 0, invalidIds };
});
