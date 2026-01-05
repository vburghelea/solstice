import { env } from "~/lib/env.server";
import { getTenantKey } from "~/tenant/tenant-env";
import type { TenantKey } from "~/tenant/tenant.types";
import type { AiModelDefaults, AiProvider, AiQuotaConfig } from "./ai.types";

type AiProviderConfig = {
  provider: AiProvider;
  apiKey: string;
  baseUrl?: string;
  organization?: string;
  timeoutMs: number;
  maxRetries: number;
};

const DEFAULT_TEXT_MODELS: Record<AiProvider, string> = {
  openai: "gpt-4o",
  anthropic: "claude-sonnet-4-5",
};

const DEFAULT_TIMEOUT_MS = 20_000;
const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_DAILY_WINDOW_MS = 24 * 60 * 60 * 1000;

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

const resolveProvider = (): AiProvider => {
  if (env.AI_TEXT_PROVIDER) return env.AI_TEXT_PROVIDER;
  if (env.OPENAI_API_KEY) return "openai";
  if (env.ANTHROPIC_API_KEY) return "anthropic";
  return "openai";
};

const resolveTextModel = (provider: AiProvider, model?: string) =>
  model ?? DEFAULT_TEXT_MODELS[provider];

export const getAiTextDefaults = (): AiModelDefaults => {
  const provider = resolveProvider();
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
  const defaults = getAiTextDefaults();
  const timeoutMs = env.AI_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS;
  const maxRetries = env.AI_MAX_RETRIES ?? DEFAULT_MAX_RETRIES;

  if (defaults.provider === "openai") {
    const apiKey = env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is required for OpenAI provider.");
    }
    const config: AiProviderConfig = {
      provider: "openai",
      apiKey,
      timeoutMs,
      maxRetries,
    };

    if (env.OPENAI_BASE_URL) {
      config.baseUrl = env.OPENAI_BASE_URL;
    }
    if (env.OPENAI_ORG_ID) {
      config.organization = env.OPENAI_ORG_ID;
    }

    return config;
  }

  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is required for Anthropic provider.");
  }

  const config: AiProviderConfig = {
    provider: "anthropic",
    apiKey,
    timeoutMs,
    maxRetries,
  };

  if (env.ANTHROPIC_BASE_URL) {
    config.baseUrl = env.ANTHROPIC_BASE_URL;
  }

  return config;
};

export const getAiEmbedConfig = (): AiProviderConfig & { model: string } => {
  const provider = env.AI_EMBED_PROVIDER ?? resolveProvider();
  if (provider !== "openai") {
    throw new Error("Only OpenAI embeddings are supported right now.");
  }

  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required for embeddings.");
  }

  const config: AiProviderConfig & { model: string } = {
    provider: "openai",
    apiKey,
    timeoutMs: env.AI_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS,
    maxRetries: env.AI_MAX_RETRIES ?? DEFAULT_MAX_RETRIES,
    model: env.AI_EMBED_MODEL ?? "text-embedding-3-large",
  };

  if (env.OPENAI_BASE_URL) {
    config.baseUrl = env.OPENAI_BASE_URL;
  }
  if (env.OPENAI_ORG_ID) {
    config.organization = env.OPENAI_ORG_ID;
  }

  return config;
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
