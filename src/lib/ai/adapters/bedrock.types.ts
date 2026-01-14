import type { JSONSchema } from "@tanstack/ai";

export const BEDROCK_MODEL_MAP = {
  // Direct model IDs in ca-central-1 for Canadian data residency (PIPEDA compliance)
  // Note: Cross-region profiles (us.* or global.*) would route data to US regions
  "claude-sonnet": "anthropic.claude-sonnet-4-5-20250929-v1:0",
  "claude-haiku": "anthropic.claude-haiku-4-5-20251001-v1:0",
  "claude-opus": "anthropic.claude-opus-4-5-20251101-v1:0",
} as const;

export type BedrockModelAlias = keyof typeof BEDROCK_MODEL_MAP;
export type BedrockModelId = BedrockModelAlias | (string & {});

export type BedrockAdapterConfig = {
  region?: string;
};

export type BedrockProviderOptions = Record<string, unknown>;

export type BedrockStructuredOutput = {
  data: unknown;
  rawText: string;
};

export type BedrockToolSchema = JSONSchema & {
  type?: string;
  properties?: Record<string, unknown>;
  required?: string[];
};

export const resolveBedrockModelId = (model: string) =>
  BEDROCK_MODEL_MAP[model as BedrockModelAlias] ?? model;
