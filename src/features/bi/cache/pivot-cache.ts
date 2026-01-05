import { createServerOnlyFn } from "@tanstack/react-start";
import type { PivotQuery, PivotResult } from "../bi.schemas";
import { recordPivotCacheMetric } from "~/lib/observability/metrics";
import { REDIS_TTLS, buildRedisKey, hashString } from "~/lib/redis/keys";

type PivotCacheEntry = {
  pivot: PivotResult;
  rowCount: number;
  createdAt: number;
  expiresAt: number;
  datasetId: string;
  lastAccessedAt: number;
};

const CACHE_TTL_MS = REDIS_TTLS.pivotCacheSeconds * 1000;
const MAX_ENTRIES = 200;
const SWEEP_INTERVAL_MS = 60_000;
const pivotCache = new Map<string, PivotCacheEntry>();
const datasetIndex = new Map<string, Set<string>>();

const getRedisClient = createServerOnlyFn(async () => {
  const { getRedis } = await import("~/lib/redis/client");
  return getRedis({ required: false });
});

const stableStringify = (value: unknown): string => {
  if (value === undefined) {
    return JSON.stringify("__undefined__");
  }
  if (value === null) {
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

const buildPivotIndexKey = (datasetId: string) => `bi:pivot:index:${datasetId}`;

export const buildPivotCacheKey = (params: {
  userId: string;
  organizationId: string | null;
  datasetId: string;
  query: PivotQuery;
}) => {
  const payload = stableStringify({
    userId: params.userId,
    organizationId: params.organizationId ?? null,
    datasetId: params.datasetId,
    query: params.query,
  });
  const queryHash = hashString(payload);
  const orgKey = params.organizationId ?? "global";
  return `bi:pivot:${orgKey}:${params.userId}:${params.datasetId}:${queryHash}`;
};

const removeEntry = (key: string) => {
  const entry = pivotCache.get(key);
  if (!entry) return;
  pivotCache.delete(key);
  const keys = datasetIndex.get(entry.datasetId);
  if (keys) {
    keys.delete(key);
    if (keys.size === 0) {
      datasetIndex.delete(entry.datasetId);
    }
  }
};

const touchEntry = (key: string, entry: PivotCacheEntry) => {
  entry.lastAccessedAt = Date.now();
  pivotCache.delete(key);
  pivotCache.set(key, entry);
};

const sweepExpired = () => {
  const now = Date.now();
  for (const [key, entry] of pivotCache.entries()) {
    if (entry.expiresAt <= now) {
      removeEntry(key);
    }
  }
};

const enforceMaxEntries = () => {
  while (pivotCache.size > MAX_ENTRIES) {
    const oldestKey = pivotCache.keys().next().value as string | undefined;
    if (!oldestKey) return;
    removeEntry(oldestKey);
  }
};

const pruneCache = () => {
  sweepExpired();
  enforceMaxEntries();
};

if (typeof window === "undefined") {
  const interval = setInterval(() => {
    pruneCache();
  }, SWEEP_INTERVAL_MS);
  if (typeof interval.unref === "function") {
    interval.unref();
  }
}

const getPivotCacheMemory = (key: string): PivotCacheEntry | null => {
  const entry = pivotCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    removeEntry(key);
    return null;
  }
  touchEntry(key, entry);
  return entry;
};

export const getPivotCache = async (key: string): Promise<PivotCacheEntry | null> => {
  const redis = await getRedisClient();
  if (!redis) {
    const entry = getPivotCacheMemory(key);
    await recordPivotCacheMetric({ hit: Boolean(entry), source: "memory" });
    return entry;
  }

  const redisKey = await buildRedisKey(key);
  const cached = await redis.get(redisKey);
  if (!cached) {
    await recordPivotCacheMetric({ hit: false, source: "redis" });
    return null;
  }

  const parsed = JSON.parse(cached) as PivotCacheEntry;
  if (Date.now() > parsed.expiresAt) {
    await redis.del(redisKey);
    await recordPivotCacheMetric({ hit: false, source: "redis" });
    return null;
  }
  await recordPivotCacheMetric({ hit: true, source: "redis" });
  return parsed;
};

export const setPivotCache = async (
  key: string,
  value: { datasetId: string; pivot: PivotResult; rowCount: number },
  ttlMs: number = CACHE_TTL_MS,
) => {
  const now = Date.now();
  const entry: PivotCacheEntry = {
    pivot: value.pivot,
    rowCount: value.rowCount,
    createdAt: now,
    expiresAt: now + ttlMs,
    datasetId: value.datasetId,
    lastAccessedAt: now,
  };

  const redis = await getRedisClient();
  if (redis) {
    const redisKey = await buildRedisKey(key);
    const indexKey = await buildRedisKey(buildPivotIndexKey(value.datasetId));
    const payload = JSON.stringify(entry);

    await redis
      .multi()
      .set(redisKey, payload, { PX: ttlMs })
      .sAdd(indexKey, redisKey)
      .expire(indexKey, REDIS_TTLS.pivotIndexSeconds)
      .exec();
    return;
  }

  if (pivotCache.has(key)) {
    removeEntry(key);
  }
  pivotCache.set(key, entry);
  const keys = datasetIndex.get(value.datasetId) ?? new Set<string>();
  keys.add(key);
  datasetIndex.set(value.datasetId, keys);
  pruneCache();
};

export const invalidatePivotCache = async (datasetId?: string) => {
  if (!datasetId) {
    pivotCache.clear();
    datasetIndex.clear();
    return;
  }

  const redis = await getRedisClient();
  if (redis) {
    const indexKey = await buildRedisKey(buildPivotIndexKey(datasetId));
    const members = await redis.sMembers(indexKey);
    if (members.length > 0) {
      await redis.del(members);
    }
    await redis.del(indexKey);
    return;
  }

  const keys = datasetIndex.get(datasetId);
  if (!keys) return;
  for (const key of Array.from(keys)) {
    removeEntry(key);
  }
};
