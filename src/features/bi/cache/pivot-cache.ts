import type { PivotResult } from "../bi.schemas";
import type { PivotQuery } from "../bi.schemas";

type PivotCacheEntry = {
  pivot: PivotResult;
  rowCount: number;
  createdAt: number;
  expiresAt: number;
  datasetId: string;
  lastAccessedAt: number;
};

const CACHE_TTL_MS = 60_000;
const MAX_ENTRIES = 200;
const SWEEP_INTERVAL_MS = 60_000;
const pivotCache = new Map<string, PivotCacheEntry>();
const datasetIndex = new Map<string, Set<string>>();

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

export const buildPivotCacheKey = (params: {
  userId: string;
  organizationId: string | null;
  datasetId: string;
  query: PivotQuery;
}) =>
  stableStringify({
    userId: params.userId,
    organizationId: params.organizationId ?? null,
    datasetId: params.datasetId,
    query: params.query,
  });

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

export const getPivotCache = (key: string): PivotCacheEntry | null => {
  const entry = pivotCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    removeEntry(key);
    return null;
  }
  touchEntry(key, entry);
  return entry;
};

export const setPivotCache = (
  key: string,
  value: { datasetId: string; pivot: PivotResult; rowCount: number },
  ttlMs: number = CACHE_TTL_MS,
) => {
  const now = Date.now();
  if (pivotCache.has(key)) {
    removeEntry(key);
  }
  pivotCache.set(key, {
    pivot: value.pivot,
    rowCount: value.rowCount,
    createdAt: now,
    expiresAt: now + ttlMs,
    datasetId: value.datasetId,
    lastAccessedAt: now,
  });
  const keys = datasetIndex.get(value.datasetId) ?? new Set<string>();
  keys.add(key);
  datasetIndex.set(value.datasetId, keys);
  pruneCache();
};

export const invalidatePivotCache = (datasetId?: string) => {
  if (!datasetId) {
    pivotCache.clear();
    datasetIndex.clear();
    return;
  }

  const keys = datasetIndex.get(datasetId);
  if (!keys) return;
  for (const key of Array.from(keys)) {
    removeEntry(key);
  }
};
