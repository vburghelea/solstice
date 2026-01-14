import { env } from "~/lib/env.server";
import { resolveBedrockModelId } from "./adapters/bedrock.types";
import type { AiProvider } from "./ai.types";

type ModelPricing = {
  inputPer1M: number;
  outputPer1M: number;
};

type PricingConfig = Record<AiProvider, Record<string, ModelPricing>>;
type PricingOverrides = Partial<Record<AiProvider, Record<string, ModelPricing>>>;

const DEFAULT_MODEL_PRICING: PricingConfig = {
  bedrock: {
    "anthropic.claude-3-sonnet-20240229-v1:0": { inputPer1M: 3, outputPer1M: 15 },
    "anthropic.claude-3-haiku-20240307-v1:0": { inputPer1M: 0.25, outputPer1M: 1.25 },
    "anthropic.claude-opus-4-5-20251101-v1:0": { inputPer1M: 15, outputPer1M: 75 },
  },
};

let cachedPricing: PricingConfig | null = null;

const mergePricingOverrides = (overrides?: PricingOverrides) => {
  if (!overrides) return DEFAULT_MODEL_PRICING;

  return {
    bedrock: {
      ...DEFAULT_MODEL_PRICING.bedrock,
      ...overrides.bedrock,
    },
  };
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

const resolveModelForPricing = (provider: AiProvider, model: string) =>
  provider === "bedrock" ? resolveBedrockModelId(model) : model;

export const estimateCostUsdMicros = (params: {
  provider: AiProvider;
  model: string;
  inputTokens?: number | null;
  outputTokens?: number | null;
}) => {
  const { provider, model, inputTokens, outputTokens } = params;
  if (inputTokens == null || outputTokens == null) return null;

  const resolvedModel = resolveModelForPricing(provider, model);
  const pricing = getPricingConfig()[provider]?.[resolvedModel];
  if (!pricing) return null;

  const costUsd =
    (inputTokens / 1_000_000) * pricing.inputPer1M +
    (outputTokens / 1_000_000) * pricing.outputPer1M;

  return Math.round(costUsd * 1_000_000);
};
