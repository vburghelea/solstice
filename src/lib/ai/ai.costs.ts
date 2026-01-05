import { env } from "~/lib/env.server";
import type { AiProvider } from "./ai.types";

type ModelPricing = {
  inputPer1M: number;
  outputPer1M: number;
};

type PricingConfig = Record<AiProvider, Record<string, ModelPricing>>;
type PricingOverrides = Partial<Record<AiProvider, Record<string, ModelPricing>>>;

const DEFAULT_MODEL_PRICING: PricingConfig = {
  openai: {
    "gpt-4o": { inputPer1M: 2.5, outputPer1M: 10 },
    "gpt-4o-mini": { inputPer1M: 0.15, outputPer1M: 0.6 },
  },
  anthropic: {
    "claude-opus-4-5": { inputPer1M: 15, outputPer1M: 75 },
    "claude-sonnet-4-5": { inputPer1M: 3, outputPer1M: 15 },
    "claude-haiku-4-5": { inputPer1M: 1, outputPer1M: 5 },
  },
};

let cachedPricing: PricingConfig | null = null;

const mergePricingOverrides = (overrides?: PricingOverrides) => {
  if (!overrides) return DEFAULT_MODEL_PRICING;

  return (["openai", "anthropic"] as AiProvider[]).reduce<PricingConfig>(
    (acc, provider) => {
      acc[provider] = {
        ...DEFAULT_MODEL_PRICING[provider],
        ...overrides[provider],
      };
      return acc;
    },
    { openai: {}, anthropic: {} },
  );
};

const getPricingConfig = (): PricingConfig => {
  if (cachedPricing) return cachedPricing;

  if (!env.AI_MODEL_PRICING_JSON) {
    cachedPricing = DEFAULT_MODEL_PRICING;
    return cachedPricing;
  }

  let parsed: PricingOverrides;
  try {
    parsed = JSON.parse(env.AI_MODEL_PRICING_JSON) as PricingOverrides;
  } catch (error) {
    throw new Error(
      `AI_MODEL_PRICING_JSON must be valid JSON: ${
        error instanceof Error ? error.message : "Invalid JSON"
      }`,
    );
  }

  cachedPricing = mergePricingOverrides(parsed);
  return cachedPricing;
};

export const estimateCostUsdMicros = (params: {
  provider: AiProvider;
  model: string;
  inputTokens?: number | null;
  outputTokens?: number | null;
}) => {
  const { provider, model, inputTokens, outputTokens } = params;
  if (inputTokens == null || outputTokens == null) return null;

  const pricing = getPricingConfig()[provider]?.[model];
  if (!pricing) return null;

  const costUsd =
    (inputTokens / 1_000_000) * pricing.inputPer1M +
    (outputTokens / 1_000_000) * pricing.outputPer1M;

  return Math.round(costUsd * 1_000_000);
};
