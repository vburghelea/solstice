import { createServerOnlyFn } from "@tanstack/react-start";

export const REDIS_TTLS = {
  pivotCacheSeconds: 5 * 60,
  pivotIndexSeconds: 10 * 60,
  sqlWorkbenchGateSeconds: 5 * 60,
  permissionSeconds: 2 * 60,
  orgAccessSeconds: 2 * 60,
  orgListSeconds: 2 * 60,
} as const;

const resolveRedisPrefix = createServerOnlyFn(async () => {
  const { getRedisConfig } = await import("~/lib/redis/client");
  const config = await getRedisConfig();
  return config.prefix;
});

let cachedPrefix: string | null = null;

export const getRedisPrefix = async () => {
  if (cachedPrefix) return cachedPrefix;
  cachedPrefix = await resolveRedisPrefix();
  return cachedPrefix;
};

const normalizeKeyParts = (parts: Array<string | number | null | undefined>) =>
  parts
    .flat()
    .filter((part) => part !== null && part !== undefined && part !== "")
    .map((part) => String(part));

export const buildRedisKey = async (
  ...parts: Array<string | number | null | undefined>
) => {
  const prefix = await getRedisPrefix();
  return [prefix, ...normalizeKeyParts(parts)].join(":");
};

export const hashString = (value: string) => {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
};
