import type { AnyTextAdapter } from "@tanstack/ai";
import { getAiTextDefaults, getAiTextProviderConfig } from "./ai.config";

const adapterCache = new Map<string, AnyTextAdapter>();

export const getTextAdapter = async (modelOverride?: string): Promise<AnyTextAdapter> => {
  const defaults = getAiTextDefaults();
  const providerConfig = getAiTextProviderConfig();
  const model = modelOverride ?? defaults.model;
  const cacheKey = `${model}:${providerConfig.region ?? ""}`;

  const cached = adapterCache.get(cacheKey);
  if (cached) return cached;

  const { createBedrockChat } = await import("./adapters/bedrock.adapter");
  const bedrockConfig = providerConfig.region ? { region: providerConfig.region } : {};
  const adapter = createBedrockChat(model, bedrockConfig);
  adapterCache.set(cacheKey, adapter);
  return adapter;
};
