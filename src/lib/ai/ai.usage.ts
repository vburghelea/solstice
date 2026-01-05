import { AsyncRateLimiter } from "@tanstack/pacer";
import { createServerOnlyFn } from "@tanstack/react-start";
import { and, eq, gte, sql } from "drizzle-orm";
import type { JsonRecord } from "~/shared/lib/json";
import { getAiQuotaConfig } from "./ai.config";
import type { AiProvider, AiUsageOperation, AiUsageStatus } from "./ai.types";

type AiUsageLogInput = {
  operation?: AiUsageOperation;
  status?: AiUsageStatus;
  provider: AiProvider;
  model: string;
  templateId?: string | null;
  promptVersionId?: string | null;
  organizationId?: string | null;
  userId?: string | null;
  requestId?: string | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
  totalTokens?: number | null;
  latencyMs?: number | null;
  costUsdMicros?: number | null;
  errorMessage?: string | null;
  metadata?: JsonRecord;
};

const rateLimiters = new Map<string, AsyncRateLimiter<() => Promise<boolean>>>();

const getRateLimiter = (key: string, limit: number, windowMs: number) => {
  const existing = rateLimiters.get(key);
  if (existing) {
    existing.setOptions({ limit, window: windowMs, windowType: "sliding" });
    return existing;
  }

  const limiter = new AsyncRateLimiter(async () => true, {
    limit,
    window: windowMs,
    windowType: "sliding",
  });
  rateLimiters.set(key, limiter);
  return limiter;
};

export const assertAiQuota = createServerOnlyFn(
  async (params: { userId?: string | null; organizationId?: string | null }) => {
    const { assertFeatureEnabled } = await import("~/tenant/feature-gates");
    await assertFeatureEnabled("sin_ai");

    const quota = getAiQuotaConfig();
    const limiterKey = params.userId ?? params.organizationId ?? "system";
    const limiter = getRateLimiter(limiterKey, quota.requestsPerMinute, 60 * 1000);

    const allowed = await limiter.maybeExecute();
    if (!allowed) {
      const { badRequest } = await import("~/lib/server/errors");
      throw badRequest("AI rate limit exceeded. Please try again shortly.");
    }

    const filterKey = params.userId ?? params.organizationId;
    if (!filterKey) return;

    const { getDb } = await import("~/db/server-helpers");
    const { aiUsageLogs } = await import("~/db/schema");

    const db = await getDb();
    const windowStart = new Date(Date.now() - quota.dailyWindowMs);

    const whereClause = and(
      eq(aiUsageLogs.status, "success"),
      gte(aiUsageLogs.createdAt, windowStart),
      params.userId
        ? eq(aiUsageLogs.userId, params.userId)
        : eq(aiUsageLogs.organizationId, params.organizationId!),
    );

    const [row] = await db
      .select({
        requestCount: sql<number>`count(*)::int`,
        totalTokens: sql<number>`coalesce(sum(${aiUsageLogs.totalTokens}), 0)::int`,
      })
      .from(aiUsageLogs)
      .where(whereClause);

    if ((row?.requestCount ?? 0) >= quota.requestsPerDay) {
      const { forbidden } = await import("~/lib/server/errors");
      throw forbidden("Daily AI request quota reached.");
    }

    if ((row?.totalTokens ?? 0) >= quota.tokensPerDay) {
      const { forbidden } = await import("~/lib/server/errors");
      throw forbidden("Daily AI token quota reached.");
    }
  },
);

export const logAiUsage = createServerOnlyFn(async (input: AiUsageLogInput) => {
  const { getDb } = await import("~/db/server-helpers");
  const { aiUsageLogs } = await import("~/db/schema");

  const db = await getDb();
  await db.insert(aiUsageLogs).values({
    operation: input.operation ?? "text",
    status: input.status ?? "success",
    provider: input.provider,
    model: input.model,
    templateId: input.templateId ?? null,
    promptVersionId: input.promptVersionId ?? null,
    organizationId: input.organizationId ?? null,
    userId: input.userId ?? null,
    requestId: input.requestId ?? null,
    inputTokens: input.inputTokens ?? null,
    outputTokens: input.outputTokens ?? null,
    totalTokens: input.totalTokens ?? null,
    latencyMs: input.latencyMs ?? null,
    costUsdMicros: input.costUsdMicros ?? null,
    errorMessage: input.errorMessage ?? null,
    metadata: input.metadata ?? {},
  });
});
