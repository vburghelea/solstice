import { createServerOnlyFn } from "@tanstack/react-start";
import { asc, desc, sql } from "drizzle-orm";
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
  changes?: Record<string, { old?: unknown; new?: unknown }> | null;
  metadata?: JsonRecord;
  requestId?: string;
}

const HASH_FIELDS = ["dateOfBirth", "phone", "emergencyContact.phone"];
const REDACT_FIELDS = ["password", "secret", "token", "mfaSecret"];
const METADATA_REDACT_KEYS = ["token", "secret", "password", "mfasecret"];
const REDACTED_VALUE = "[REDACTED]";
const AUDIT_CHAIN_LOCK_ID = 42;

const isAuditLoggingDisabled = () => {
  const raw =
    process.env["SIN_DISABLE_AUDIT_LOGGING"] ?? process.env["DISABLE_AUDIT_LOGGING"];
  if (!raw) return false;
  return raw === "1" || raw.toLowerCase() === "true";
};

const shouldRedact = (field: string) =>
  REDACT_FIELDS.some(
    (redacted) => field === redacted || field.startsWith(`${redacted}.`),
  );

const shouldHash = (field: string) =>
  HASH_FIELDS.some((hashed) => field === hashed || field.startsWith(`${hashed}.`));

const shouldRedactMetadataKey = (key: string) => {
  const normalized = key.toLowerCase();
  return METADATA_REDACT_KEYS.some((fragment) => normalized.includes(fragment));
};

export const stableStringify = (value: unknown): string => {
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

export const hashValue = async (value: unknown): Promise<string> => {
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

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return false;
  return !(value instanceof Date);
};

const sanitizeValue = async (field: string, value: unknown): Promise<JsonValue> => {
  if (shouldRedact(field)) {
    return REDACTED_VALUE;
  }

  if (shouldHash(field)) {
    return await hashValue(value);
  }

  return toJsonValue(value);
};

export const sanitizeAuditChanges = async (
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

export const sanitizeAuditMetadata = (metadata?: JsonRecord | null): JsonRecord => {
  if (!metadata) return {};

  const sanitize = (value: JsonValue): JsonValue => {
    if (Array.isArray(value)) {
      return value.map((item) => sanitize(item as JsonValue)) as JsonValue;
    }

    if (value && typeof value === "object") {
      const entries = Object.entries(value as Record<string, JsonValue>).map(
        ([key, entryValue]) => {
          if (shouldRedactMetadataKey(key)) {
            return [key, REDACTED_VALUE] as const;
          }

          return [key, sanitize(entryValue)] as const;
        },
      );
      return Object.fromEntries(entries) as JsonValue;
    }

    return value;
  };

  return sanitize(metadata as JsonValue) as JsonRecord;
};

export const createAuditDiff = async (
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
) => {
  const changes: Record<string, { old?: unknown; new?: unknown }> = {};

  const walk = (
    previous: Record<string, unknown>,
    next: Record<string, unknown>,
    prefix: string,
  ) => {
    const keys = new Set([...Object.keys(previous), ...Object.keys(next)]);

    for (const key of keys) {
      const path = prefix ? `${prefix}.${key}` : key;
      const oldValue = previous[key];
      const newValue = next[key];

      if (isPlainObject(oldValue) && isPlainObject(newValue)) {
        walk(oldValue, newValue, path);
        continue;
      }

      const isSame =
        oldValue === newValue || stableStringify(oldValue) === stableStringify(newValue);

      if (!isSame) {
        changes[path] = { old: oldValue, new: newValue };
      }
    }
  };

  walk(before ?? {}, after ?? {}, "");

  return changes;
};

const inferCategory = (action: string): AuditActionCategory => {
  const [prefix] = action.split(".");
  if (!prefix) return "DATA";
  const normalized = prefix.toUpperCase() as AuditActionCategory;
  return ["AUTH", "ADMIN", "DATA", "EXPORT", "SECURITY"].includes(normalized)
    ? normalized
    : "DATA";
};

const normalizeIpCandidate = (candidate: string, isIP: (value: string) => number) => {
  const trimmed = candidate.trim();
  if (!trimmed) return null;
  if (isIP(trimmed)) return trimmed;
  if (trimmed.includes(":") && trimmed.includes(".")) {
    const [withoutPort] = trimmed.split(":");
    if (withoutPort && isIP(withoutPort)) return withoutPort;
  }
  return null;
};

const resolveHeaderIp = async (headers?: Headers | null): Promise<string | null> => {
  if (!headers) return null;
  const { isIP } = await import("node:net");

  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    const candidates = forwardedFor
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
    for (const candidate of candidates) {
      const normalized = normalizeIpCandidate(candidate, isIP);
      if (normalized) return normalized;
    }
  }

  const realIp = headers.get("x-real-ip");
  if (realIp) {
    return normalizeIpCandidate(realIp, isIP);
  }

  return null;
};

const resolveIpAddress = async (value?: string | null): Promise<string | null> => {
  if (!value) return null;
  const { isIP } = await import("node:net");
  return normalizeIpCandidate(value, isIP);
};

const resolveRequestContext = async () => {
  const context = getRequestContext();
  const headers = context?.headers;
  const actorIp = await resolveHeaderIp(headers);
  const actorUserAgent = headers?.get("user-agent") ?? null;

  return {
    headers,
    requestId: context?.requestId ?? null,
    actorIp,
    actorUserAgent,
  };
};

export const logAuditEntry = createServerOnlyFn(async (input: AuditEntryInput) => {
  if (isAuditLoggingDisabled()) {
    return;
  }

  const { getDb } = await import("~/db/server-helpers");
  const { auditLogs } = await import("~/db/schema");
  const { randomUUID } = await import("node:crypto");

  const db = await getDb();
  const requestContext = await resolveRequestContext();
  const requestId =
    input.requestId ??
    requestContext.requestId ??
    resolveRequestId(requestContext.headers);
  const resolvedInputIp = await resolveIpAddress(input.actorIp);
  const actorIp = resolvedInputIp ?? requestContext.actorIp ?? null;
  const actorUserAgent = input.actorUserAgent ?? requestContext.actorUserAgent ?? null;
  const sanitizedChanges = await sanitizeAuditChanges(input.changes ?? null);
  const sanitizedMetadata = sanitizeAuditMetadata(input.metadata ?? {});

  await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(${AUDIT_CHAIN_LOCK_ID})`);

    const [previous] = await tx
      .select({ entryHash: auditLogs.entryHash })
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt), desc(auditLogs.id))
      .limit(1);

    const prevHash = previous?.entryHash ?? null;
    const timeResult = await tx.execute(sql`SELECT current_timestamp as occurred_at`);
    const rows = Array.isArray(timeResult)
      ? timeResult
      : (timeResult as { rows: Array<{ occurred_at: unknown }> }).rows;
    const occurredAtValue = rows?.[0]?.occurred_at ?? new Date();
    const occurredAt =
      occurredAtValue instanceof Date
        ? occurredAtValue
        : new Date(occurredAtValue as string | number);

    const id = randomUUID();
    const payload = {
      id,
      occurredAt,
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
      metadata: sanitizedMetadata,
      requestId,
      prevHash,
    };

    const entryHash = await hashValue(payload);

    await tx.insert(auditLogs).values({
      id,
      occurredAt,
      createdAt: occurredAt,
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
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .orderBy(asc(auditLogs.createdAt), asc(auditLogs.id));

  return verifyAuditHashChainRows(rows);
});

export type AuditHashRow = {
  id: string;
  entryHash: string;
  prevHash: string | null;
  action: string;
  actionCategory: AuditActionCategory | string;
  actorUserId: string | null;
  actorOrgId: string | null;
  actorIp: string | null;
  actorUserAgent: string | null;
  targetType: string | null;
  targetId: string | null;
  targetOrgId: string | null;
  changes: JsonRecord | null;
  metadata: JsonRecord | null;
  requestId: string | null;
  occurredAt: Date;
  createdAt: Date;
};

export const verifyAuditHashChainRows = async (rows: AuditHashRow[]) => {
  const invalidIds: string[] = [];
  let previousHash: string | null = null;

  const buildPayload = (
    row: AuditHashRow,
    prevHash: string | null,
    options: { includeId: boolean; includeOccurredAt: boolean },
  ) => ({
    ...(options.includeId ? { id: row.id } : {}),
    ...(options.includeOccurredAt ? { occurredAt: row.occurredAt } : {}),
    action: row.action,
    actionCategory: row.actionCategory,
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
    prevHash,
  });

  for (const row of rows) {
    const payload = buildPayload(row, previousHash, {
      includeId: true,
      includeOccurredAt: true,
    });
    let expectedHash = await hashValue(payload);

    if (row.prevHash !== previousHash || row.entryHash !== expectedHash) {
      const legacyPayload = buildPayload(row, previousHash, {
        includeId: false,
        includeOccurredAt: false,
      });
      expectedHash = await hashValue(legacyPayload);
    }

    if (row.prevHash !== previousHash || row.entryHash !== expectedHash) {
      invalidIds.push(row.id);
    }

    previousHash = row.entryHash;
  }

  return { valid: invalidIds.length === 0, invalidIds };
};
