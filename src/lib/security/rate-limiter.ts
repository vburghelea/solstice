import { createServerOnlyFn } from "@tanstack/react-start";
import { recordRateLimitMetric } from "~/lib/observability/metrics";
import { buildRedisKey, hashString } from "~/lib/redis/keys";
import { securityConfig } from "./config";

export type RateLimitBucket =
  | "auth"
  | "api"
  | "export"
  | "join_request"
  | "invite_link"
  | "admin";

type RateLimitConfig = {
  windowMs: number;
  max: number;
};

export type RateLimitDecision = {
  allowed: boolean;
  retryAfterMs: number;
  remaining: number;
  limit: number;
  windowMs: number;
  key: string;
  ipHash: string;
};

type RateLimitRequest = {
  bucket: RateLimitBucket;
  route: string;
  headers?: Headers;
  userId?: string | null;
  ipAddress?: string | null;
};

const RATE_LIMITS: Record<RateLimitBucket, RateLimitConfig> = {
  auth: {
    windowMs: securityConfig.rateLimit.auth.windowMs,
    max: securityConfig.rateLimit.auth.max,
  },
  api: {
    windowMs: securityConfig.rateLimit.api.windowMs,
    max: securityConfig.rateLimit.api.max,
  },
  export: {
    windowMs: 5 * 60 * 1000,
    max: 10,
  },
  join_request: {
    windowMs: 60 * 60 * 1000,
    max: 5,
  },
  invite_link: {
    windowMs: 10 * 60 * 1000,
    max: 20,
  },
  admin: {
    windowMs: 60 * 1000,
    max: 30,
  },
};

const getRedisClient = createServerOnlyFn(async () => {
  const { getRedis } = await import("~/lib/redis/client");
  return getRedis({ required: false });
});

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

const resolveIpAddress = async (
  inputIp: string | null | undefined,
  headers: Headers,
): Promise<string> => {
  const { isIP } = await import("node:net");
  if (inputIp) {
    const normalized = normalizeIpCandidate(inputIp, isIP);
    if (normalized) return normalized;
  }

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
    const normalized = normalizeIpCandidate(realIp, isIP);
    if (normalized) return normalized;
  }

  return "0.0.0.0";
};

const resolveHeaders = async (headers?: Headers): Promise<Headers> => {
  if (headers) return headers;
  try {
    const { getRequest } = await import("@tanstack/react-start/server");
    return getRequest().headers;
  } catch {
    return new Headers();
  }
};

const normalizeRouteKey = (route: string) => {
  const trimmed = route.trim().replace(/^\/+/, "").replace(/\/+$/, "");
  return trimmed.replace(/[^a-zA-Z0-9:_-]+/g, ":") || "root";
};

const buildRateLimitKey = async (params: {
  bucket: RateLimitBucket;
  route: string;
  ipHash: string;
  userId?: string | null;
}) => {
  const routeKey = normalizeRouteKey(params.route);
  const userKey = params.userId ?? "anon";
  return buildRedisKey("rate", params.bucket, routeKey, params.ipHash, userKey);
};

const SLIDING_WINDOW_LUA = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local windowMs = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])

redis.call('ZREMRANGEBYSCORE', key, 0, now - windowMs)
local count = redis.call('ZCARD', key)

if count >= limit then
  local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
  local retryAfter = 0
  if oldest[2] then
    retryAfter = windowMs - (now - tonumber(oldest[2]))
  end
  return {0, retryAfter, 0}
end

local seqKey = key .. ':seq'
local seq = redis.call('INCR', seqKey)
redis.call('ZADD', key, now, now .. '-' .. seq)
redis.call('PEXPIRE', key, windowMs)
redis.call('PEXPIRE', seqKey, windowMs)
return {1, 0, limit - (count + 1)}
`;

const memoryBuckets = new Map<string, number[]>();

const checkRateLimitInMemory = (params: {
  key: string;
  config: RateLimitConfig;
  now: number;
}): RateLimitDecision => {
  const { key, config, now } = params;
  const windowStart = now - config.windowMs;
  const existing = memoryBuckets.get(key) ?? [];
  const next = existing.filter((timestamp) => timestamp > windowStart);

  if (next.length >= config.max) {
    const oldest = next[0] ?? now;
    return {
      allowed: false,
      retryAfterMs: Math.max(0, config.windowMs - (now - oldest)),
      remaining: 0,
      limit: config.max,
      windowMs: config.windowMs,
      key,
      ipHash: key,
    };
  }

  next.push(now);
  memoryBuckets.set(key, next);
  return {
    allowed: true,
    retryAfterMs: 0,
    remaining: Math.max(config.max - next.length, 0),
    limit: config.max,
    windowMs: config.windowMs,
    key,
    ipHash: key,
  };
};

const recordRateLimitEvent = async (params: {
  bucket: RateLimitBucket;
  route: string;
  userId?: string | null;
  ipHash: string;
  retryAfterMs: number;
  limit: number;
  windowMs: number;
  headers: Headers;
}) => {
  const { recordSecurityEvent } = await import("~/lib/security/events");

  await recordSecurityEvent({
    userId: params.userId ?? null,
    eventType: "rate_limit_exceeded",
    headers: params.headers,
    metadata: {
      bucket: params.bucket,
      route: params.route,
      ipHash: params.ipHash,
      retryAfterMs: params.retryAfterMs,
      limit: params.limit,
      windowMs: params.windowMs,
    },
  });
};

const recordRedisUnavailable = async (params: {
  bucket: RateLimitBucket;
  route: string;
  userId?: string | null;
  ipHash: string;
  headers: Headers;
  error?: unknown;
}) => {
  const { recordSecurityEvent } = await import("~/lib/security/events");
  const errorMessage = params.error instanceof Error ? params.error.message : null;

  await recordSecurityEvent({
    userId: params.userId ?? null,
    eventType: "rate_limit_unavailable",
    headers: params.headers,
    metadata: {
      bucket: params.bucket,
      route: params.route,
      ipHash: params.ipHash,
      ...(errorMessage ? { error: errorMessage } : {}),
    },
  });
};

export const checkRateLimit = async (
  params: RateLimitRequest,
): Promise<RateLimitDecision> => {
  const config = RATE_LIMITS[params.bucket];
  const headers = await resolveHeaders(params.headers);
  const ipAddress = await resolveIpAddress(params.ipAddress, headers);
  const ipHash = hashString(ipAddress);
  const key = await buildRateLimitKey({
    bucket: params.bucket,
    route: params.route,
    ipHash,
    userId: params.userId ?? null,
  });

  const now = Date.now();
  const { getRedisConfig } = await import("~/lib/redis/client");
  const redisConfig = await getRedisConfig();
  const redis = await getRedisClient();

  let decision: RateLimitDecision;
  let shouldRecordLimitEvent = true;
  if (redis) {
    try {
      const result = (await redis.eval(SLIDING_WINDOW_LUA, {
        keys: [key],
        arguments: [String(now), String(config.windowMs), String(config.max)],
      })) as [number, number, number];

      const allowed = result?.[0] === 1;
      const retryAfterMs = result?.[1] ?? 0;
      const remaining = result?.[2] ?? 0;

      decision = {
        allowed,
        retryAfterMs,
        remaining,
        limit: config.max,
        windowMs: config.windowMs,
        key,
        ipHash,
      };
    } catch (error) {
      if (redisConfig.enabled || redisConfig.required) {
        await recordRedisUnavailable({
          bucket: params.bucket,
          route: params.route,
          userId: params.userId ?? null,
          ipHash,
          headers,
          error,
        });
      }

      if (redisConfig.required) {
        decision = {
          allowed: false,
          retryAfterMs: config.windowMs,
          remaining: 0,
          limit: config.max,
          windowMs: config.windowMs,
          key,
          ipHash,
        };
        shouldRecordLimitEvent = false;
      } else {
        decision = checkRateLimitInMemory({ key, config, now });
        decision.ipHash = ipHash;
      }
    }
  } else {
    if (redisConfig.enabled || redisConfig.required) {
      await recordRedisUnavailable({
        bucket: params.bucket,
        route: params.route,
        userId: params.userId ?? null,
        ipHash,
        headers,
        error: redisConfig.enabled ? new Error("Redis unavailable") : undefined,
      });
    }

    if (redisConfig.required) {
      decision = {
        allowed: false,
        retryAfterMs: config.windowMs,
        remaining: 0,
        limit: config.max,
        windowMs: config.windowMs,
        key,
        ipHash,
      };
      shouldRecordLimitEvent = false;
    } else {
      decision = checkRateLimitInMemory({ key, config, now });
      decision.ipHash = ipHash;
    }
  }

  if (!decision.allowed) {
    await recordRateLimitMetric({ bucket: params.bucket });
  }

  if (!decision.allowed && shouldRecordLimitEvent) {
    await recordRateLimitEvent({
      bucket: params.bucket,
      route: params.route,
      userId: params.userId ?? null,
      ipHash,
      retryAfterMs: decision.retryAfterMs,
      limit: decision.limit,
      windowMs: decision.windowMs,
      headers,
    });
  }

  return decision;
};

export const enforceRateLimit = async (params: RateLimitRequest) => {
  const decision = await checkRateLimit(params);

  if (!decision.allowed) {
    try {
      const { setResponseHeader, setResponseStatus } =
        await import("@tanstack/react-start/server");
      setResponseStatus(429);
      setResponseHeader("Retry-After", String(Math.ceil(decision.retryAfterMs / 1000)));
    } catch {
      // Response helpers unavailable outside request context.
    }

    const { rateLimited } = await import("~/lib/server/errors");
    throw rateLimited("Too many requests. Please try again later.", {
      bucket: params.bucket,
      retryAfterMs: decision.retryAfterMs,
    });
  }

  return decision;
};
