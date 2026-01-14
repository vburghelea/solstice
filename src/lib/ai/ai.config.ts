import { env } from "~/lib/env.server";
import { getTenantKey } from "~/tenant/tenant-env";
import type { TenantKey } from "~/tenant/tenant.types";
import type { AiModelDefaults, AiProvider, AiQuotaConfig } from "./ai.types";

type AiProviderConfig = {
  provider: AiProvider;
  region?: string;
  timeoutMs: number;
  maxRetries: number;
};

const DEFAULT_TEXT_MODELS: Record<AiProvider, string> = {
  bedrock: "claude-opus",
};

const DEFAULT_TIMEOUT_MS = 20_000;
const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_DAILY_WINDOW_MS = 24 * 60 * 60 * 1000;
const DEFAULT_EMBED_MODEL = "cohere.embed-v4:0";

const DEFAULT_QUOTAS: Record<TenantKey, AiQuotaConfig> = {
  qc: {
    requestsPerMinute: 10,
    requestsPerDay: 100,
    tokensPerDay: 100_000,
    dailyWindowMs: DEFAULT_DAILY_WINDOW_MS,
  },
  viasport: {
    requestsPerMinute: 20,
    requestsPerDay: 200,
    tokensPerDay: 200_000,
    dailyWindowMs: DEFAULT_DAILY_WINDOW_MS,
  },
};

const resolveTextModel = (provider: AiProvider, model?: string) =>
  model ?? DEFAULT_TEXT_MODELS[provider];

export const getAiTextDefaults = (): AiModelDefaults => {
  const provider: AiProvider = "bedrock";
  const defaults: AiModelDefaults = {
    provider,
    model: resolveTextModel(provider, env.AI_TEXT_MODEL),
  };

  if (env.AI_TEMPERATURE != null) {
    defaults.temperature = env.AI_TEMPERATURE;
  }
  if (env.AI_TOP_P != null) {
    defaults.topP = env.AI_TOP_P;
  }
  if (env.AI_MAX_TOKENS != null) {
    defaults.maxTokens = env.AI_MAX_TOKENS;
  }

  return defaults;
};

export const getAiTextProviderConfig = (): AiProviderConfig => {
  const timeoutMs = env.AI_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS;
  const maxRetries = env.AI_MAX_RETRIES ?? DEFAULT_MAX_RETRIES;

  return {
    provider: "bedrock",
    region: env.AWS_REGION ?? "ca-central-1",
    timeoutMs,
    maxRetries,
  };
};

export const getAiEmbedConfig = (): AiProviderConfig & { model: string } => {
  return {
    provider: "bedrock",
    region: env.AWS_REGION ?? "ca-central-1",
    timeoutMs: env.AI_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS,
    maxRetries: env.AI_MAX_RETRIES ?? DEFAULT_MAX_RETRIES,
    model: env.AI_EMBED_MODEL ?? DEFAULT_EMBED_MODEL,
  };
};

export const getAiQuotaConfig = (): AiQuotaConfig => {
  const tenantKey = getTenantKey();
  const defaults = DEFAULT_QUOTAS[tenantKey];

  return {
    ...defaults,
    requestsPerMinute: env.AI_QUOTA_REQUESTS_PER_MIN ?? defaults.requestsPerMinute,
    requestsPerDay: env.AI_QUOTA_REQUESTS_PER_DAY ?? defaults.requestsPerDay,
    tokensPerDay: env.AI_QUOTA_TOKENS_PER_DAY ?? defaults.tokensPerDay,
  };
};
