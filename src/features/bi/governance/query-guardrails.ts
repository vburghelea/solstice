/**
 * SQL Workbench Guardrails
 *
 * Enforces query limits (timeout, row limits, cost, concurrency) for SQL workbench.
 */

import { createServerOnlyFn } from "@tanstack/react-start";
import { buildRedisKey } from "~/lib/redis/keys";

export const QUERY_GUARDRAILS = {
  statementTimeoutMs: 30000,
  maxRowsUi: 10000,
  maxRowsExport: 100000,
  maxEstimatedCost: 100000,
  maxConcurrentPerUser: 2,
  maxConcurrentPerOrg: 5,
  maxPivotRows: 500,
  maxPivotColumns: 50,
  maxPivotCells: 25000,
} as const;

const CONCURRENCY_TTL_BUFFER_MS = 10_000;
const CONCURRENCY_TTL_MS =
  QUERY_GUARDRAILS.statementTimeoutMs + CONCURRENCY_TTL_BUFFER_MS;

const getRedisClient = createServerOnlyFn(async () => {
  const { getRedis } = await import("~/lib/redis/client");
  return getRedis({ required: false });
});

const ACQUIRE_CONCURRENCY_LUA = `
local userKey = KEYS[1]
local orgKey = KEYS[2]
local userLimit = tonumber(ARGV[1])
local orgLimit = tonumber(ARGV[2])
local ttlMs = tonumber(ARGV[3])

local userCount = redis.call('INCR', userKey)
if userCount == 1 then
  redis.call('PEXPIRE', userKey, ttlMs)
end
if userCount > userLimit then
  redis.call('DECR', userKey)
  return 1
end

if orgKey ~= '' then
  local orgCount = redis.call('INCR', orgKey)
  if orgCount == 1 then
    redis.call('PEXPIRE', orgKey, ttlMs)
  end
  if orgCount > orgLimit then
    redis.call('DECR', orgKey)
    redis.call('DECR', userKey)
    return 2
  end
end

return 0
`;

const RELEASE_CONCURRENCY_LUA = `
local userKey = KEYS[1]
local orgKey = KEYS[2]

if redis.call('EXISTS', userKey) == 1 then
  local userCount = redis.call('DECR', userKey)
  if userCount <= 0 then
    redis.call('DEL', userKey)
  end
end

if orgKey ~= '' and redis.call('EXISTS', orgKey) == 1 then
  local orgCount = redis.call('DECR', orgKey)
  if orgCount <= 0 then
    redis.call('DEL', orgKey)
  end
end

return 0
`;

const inflightByUser = new Map<string, number>();
const inflightByOrg = new Map<string, number>();

const bump = (map: Map<string, number>, key: string) => {
  const next = (map.get(key) ?? 0) + 1;
  map.set(key, next);
  return next;
};

const drop = (map: Map<string, number>, key: string) => {
  const next = (map.get(key) ?? 1) - 1;
  if (next <= 0) {
    map.delete(key);
  } else {
    map.set(key, next);
  }
};

const acquireWithMemory = (userId: string, organizationId: string | null) => {
  const userCount = bump(inflightByUser, userId);
  if (userCount > QUERY_GUARDRAILS.maxConcurrentPerUser) {
    drop(inflightByUser, userId);
    throw new Error("Too many concurrent SQL queries for this user");
  }

  if (organizationId) {
    const orgCount = bump(inflightByOrg, organizationId);
    if (orgCount > QUERY_GUARDRAILS.maxConcurrentPerOrg) {
      drop(inflightByUser, userId);
      drop(inflightByOrg, organizationId);
      throw new Error("Too many concurrent SQL queries for this organization");
    }
  }

  return () => {
    drop(inflightByUser, userId);
    if (organizationId) {
      drop(inflightByOrg, organizationId);
    }
  };
};

export const acquireConcurrencySlot = async (
  userId: string,
  organizationId: string | null,
): Promise<() => Promise<void>> => {
  const redis = await getRedisClient();

  if (!redis) {
    const release = acquireWithMemory(userId, organizationId);
    return async () => {
      release();
    };
  }

  const userKey = await buildRedisKey("bi:concurrency:user", userId);
  const orgKey = organizationId
    ? await buildRedisKey("bi:concurrency:org", organizationId)
    : "";

  try {
    const result = (await redis.eval(ACQUIRE_CONCURRENCY_LUA, {
      keys: [userKey, orgKey],
      arguments: [
        String(QUERY_GUARDRAILS.maxConcurrentPerUser),
        String(QUERY_GUARDRAILS.maxConcurrentPerOrg),
        String(CONCURRENCY_TTL_MS),
      ],
    })) as number;

    if (result === 1) {
      throw new Error("Too many concurrent SQL queries for this user");
    }
    if (result === 2) {
      throw new Error("Too many concurrent SQL queries for this organization");
    }
  } catch (error) {
    const { getRedisConfig } = await import("~/lib/redis/client");
    const config = await getRedisConfig();
    if (config.required) {
      throw error;
    }

    const release = acquireWithMemory(userId, organizationId);
    return async () => {
      release();
    };
  }

  return async () => {
    await redis.eval(RELEASE_CONCURRENCY_LUA, {
      keys: [userKey, orgKey],
      arguments: [],
    });
  };
};

export const stripTrailingSemicolons = (sqlText: string) => sqlText.replace(/;\s*$/, "");

export const buildLimitedQuery = (sqlText: string, maxRows: number) =>
  `SELECT * FROM (${stripTrailingSemicolons(sqlText)}) AS bi_limit_subquery ` +
  `LIMIT ${maxRows}`;

export const assertPivotCardinality = (rowCount: number, columnCount: number) => {
  if (rowCount > QUERY_GUARDRAILS.maxPivotRows) {
    throw new Error("Too many row categories; add filters or fewer dimensions.");
  }
  if (columnCount > QUERY_GUARDRAILS.maxPivotColumns) {
    throw new Error("Too many column categories; add filters or fewer dimensions.");
  }
  if (rowCount * columnCount > QUERY_GUARDRAILS.maxPivotCells) {
    throw new Error("Too many categories; add filters or fewer dimensions.");
  }
};

const escapeLiteral = (value: string) => `'${value.replace(/'/g, "''")}'`;

export const inlineParameters = (
  sqlText: string,
  parameters: Record<string, unknown>,
): string => {
  return sqlText.replace(/\{\{([a-zA-Z_][\w]*)\}\}/g, (_, name) => {
    if (!(name in parameters)) {
      throw new Error(`Missing SQL parameter: ${name}`);
    }

    const value = parameters[name];
    if (value === null || value === undefined) return "NULL";
    if (typeof value === "number" && Number.isFinite(value)) return value.toString();
    if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
    if (value instanceof Date) return escapeLiteral(value.toISOString());
    if (Array.isArray(value)) {
      const values = value.map((entry) =>
        inlineParameters("{{value}}", { value: entry }),
      );
      return `ARRAY[${values.join(", ")}]`;
    }
    return escapeLiteral(String(value));
  });
};
