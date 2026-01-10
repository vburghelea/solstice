import { createServerOnlyFn } from "@tanstack/react-start";
import { sql } from "drizzle-orm";
import { getDb } from "~/db/server-helpers";
import { REDIS_TTLS, buildRedisKey, hashString } from "~/lib/redis/keys";
import { internalError } from "~/lib/server/errors";
import { DATASETS } from "../semantic";
import { QUERY_GUARDRAILS } from "./query-guardrails";
import { assertSafeIdentifier, quoteIdentifier } from "../engine/sql-identifiers";
import { formatSetLocalValue } from "./set-local";

const CACHE_TTL_MS = REDIS_TTLS.sqlWorkbenchGateSeconds * 1000;

type GateCache = {
  ok: boolean;
  checkedAt: number;
  message?: string;
  key?: string;
};

let cachedGate: GateCache | null = null;

const getRedisClient = createServerOnlyFn(async () => {
  const { getRedis } = await import("~/lib/redis/client");
  return getRedis({ required: false });
});

const normalizeRows = <T>(result: unknown): T[] => {
  if (Array.isArray(result)) return result as T[];
  if (result && typeof result === "object") {
    const rows = (result as { rows?: T[] }).rows;
    if (Array.isArray(rows)) return rows;
  }
  return [];
};

const buildGateCacheKey = (params: {
  datasetIds: string[];
  organizationId: string | null;
  isGlobalAdmin: boolean;
}) => {
  const datasetKey = hashString(params.datasetIds.join("|"));
  const orgKey = params.organizationId ?? "global";
  return `bi:sql-gate:${datasetKey}:${orgKey}:${params.isGlobalAdmin ? "admin" : "user"}`;
};

export const assertSqlWorkbenchReady = async (params: {
  organizationId: string | null;
  isGlobalAdmin: boolean;
  datasetIds?: string[];
}) => {
  const now = Date.now();
  const datasetIds = (params.datasetIds ?? Object.keys(DATASETS)).slice().sort();
  const cacheKey = buildGateCacheKey({
    datasetIds,
    organizationId: params.organizationId,
    isGlobalAdmin: params.isGlobalAdmin,
  });

  const redis = await getRedisClient();
  if (redis) {
    const redisKey = await buildRedisKey(cacheKey);
    const cached = await redis.get(redisKey);
    if (cached) {
      const entry = JSON.parse(cached) as GateCache;
      if (entry.ok) return;
      throw internalError(
        entry.message ?? "SQL Workbench is not configured. Contact support.",
      );
    }
  } else if (
    cachedGate &&
    cachedGate.key === cacheKey &&
    now - cachedGate.checkedAt < CACHE_TTL_MS
  ) {
    if (cachedGate.ok) return;
    throw internalError(
      cachedGate.message ?? "SQL Workbench is not configured. Contact support.",
    );
  }

  const datasets = datasetIds
    .map((id) => DATASETS[id])
    .filter((dataset): dataset is NonNullable<typeof dataset> => Boolean(dataset));
  const viewNames = datasets.map((dataset) => `bi_v_${dataset.id}`);
  const baseTables = datasets.map((dataset) => dataset.baseTable);
  const issues: string[] = [];

  const db = await getDb();

  const roleRows = normalizeRows<{ exists: number }>(
    await db.execute(sql`SELECT 1 as exists FROM pg_roles WHERE rolname = 'bi_readonly'`),
  );
  if (roleRows.length === 0) {
    issues.push("missing role bi_readonly");
  }

  if (viewNames.length > 0) {
    const viewChunks = viewNames.map((viewName) => sql`${viewName}`);
    const viewRows = normalizeRows<{ table_name: string }>(
      await db.execute(sql`
        SELECT table_name
        FROM information_schema.views
        WHERE table_schema = 'public'
          AND table_name IN (${sql.join(viewChunks, sql`, `)})
      `),
    );
    const viewSet = new Set(viewRows.map((row) => row.table_name));
    const missingViews = viewNames.filter((viewName) => !viewSet.has(viewName));
    if (missingViews.length > 0) {
      issues.push(`missing views: ${missingViews.join(", ")}`);
    }

    const relRows = normalizeRows<{ relname: string; reloptions: string[] | null }>(
      await db.execute(sql`
        SELECT relname, reloptions
        FROM pg_class
        WHERE relname IN (${sql.join(viewChunks, sql`, `)})
          AND relkind = 'v'
      `),
    );
    const relOptions = new Map(relRows.map((row) => [row.relname, row.reloptions ?? []]));
    const missingBarrier = viewNames.filter((viewName) => {
      const options = relOptions.get(viewName) ?? [];
      return !options.some((entry) => String(entry).includes("security_barrier=true"));
    });
    if (missingBarrier.length > 0) {
      issues.push(`missing security_barrier: ${missingBarrier.join(", ")}`);
    }

    const privilegeRows = normalizeRows<{
      table_name: string;
      privilege_type: string;
    }>(
      await db.execute(sql`
        SELECT table_name, privilege_type
        FROM information_schema.table_privileges
        WHERE grantee = 'bi_readonly'
          AND table_schema = 'public'
          AND table_name IN (${sql.join(viewChunks, sql`, `)})
      `),
    );
    const selectGrants = new Set(
      privilegeRows
        .filter((row) => row.privilege_type === "SELECT")
        .map((row) => row.table_name),
    );
    const missingSelect = viewNames.filter((viewName) => !selectGrants.has(viewName));
    if (missingSelect.length > 0) {
      issues.push(`missing SELECT grants: ${missingSelect.join(", ")}`);
    }
  }

  if (baseTables.length > 0) {
    const baseChunks = baseTables.map((tableName) => sql`${tableName}`);
    const basePrivilegeRows = normalizeRows<{
      table_name: string;
      privilege_type: string;
    }>(
      await db.execute(sql`
        SELECT table_name, privilege_type
        FROM information_schema.table_privileges
        WHERE grantee = 'bi_readonly'
          AND table_schema = 'public'
          AND table_name IN (${sql.join(baseChunks, sql`, `)})
      `),
    );
    if (basePrivilegeRows.length > 0) {
      const baseTablesGranted = Array.from(
        new Set(basePrivilegeRows.map((row) => row.table_name)),
      );
      issues.push(`unexpected base table grants: ${baseTablesGranted.join(", ")}`);
    }
  }

  const sampleView = viewNames[0];
  if (sampleView) {
    try {
      await db.transaction(async (tx) => {
        await tx.execute(sql.raw("SET LOCAL ROLE bi_readonly"));
        await tx.execute(
          sql.raw(
            `SET LOCAL app.org_id = ${formatSetLocalValue(params.organizationId ?? "")}`,
          ),
        );
        await tx.execute(
          sql.raw(
            `SET LOCAL app.is_global_admin = ${formatSetLocalValue(params.isGlobalAdmin)}`,
          ),
        );
        await tx.execute(
          sql.raw(
            `SET LOCAL statement_timeout = ${formatSetLocalValue(
              QUERY_GUARDRAILS.statementTimeoutMs,
            )}`,
          ),
        );
        const safeSampleView = quoteIdentifier(assertSafeIdentifier(sampleView, "view"));
        await tx.execute(sql.raw(`SELECT 1 FROM ${safeSampleView} LIMIT 1`));
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown error";
      issues.push(`bi_readonly role check failed: ${message}`);
    }
  }

  const entry: GateCache =
    issues.length > 0
      ? {
          ok: false,
          checkedAt: now,
          message: `SQL Workbench is not configured (${issues.join("; ")}).`,
          key: cacheKey,
        }
      : { ok: true, checkedAt: now, key: cacheKey };

  if (redis) {
    const redisKey = await buildRedisKey(cacheKey);
    await redis.set(redisKey, JSON.stringify(entry), {
      EX: REDIS_TTLS.sqlWorkbenchGateSeconds,
    });
  } else {
    cachedGate = entry;
  }

  if (!entry.ok) {
    throw internalError(
      entry.message ?? "SQL Workbench is not configured. Contact support.",
    );
  }
};

export const resetSqlWorkbenchGateCache = () => {
  cachedGate = null;
};
