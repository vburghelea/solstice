import type { AnyTextAdapter } from "@tanstack/ai";
import { getAiTextDefaults, getAiTextProviderConfig } from "./ai.config";

const adapterCache = new Map<string, AnyTextAdapter>();

export const getTextAdapter = async (modelOverride?: string): Promise<AnyTextAdapter> => {
  const defaults = getAiTextDefaults();
  const providerConfig = getAiTextProviderConfig();
  const model = modelOverride ?? defaults.model;
  const cacheKey = `${providerConfig.provider}:${model}:${providerConfig.baseUrl ?? ""}`;

  const cached = adapterCache.get(cacheKey);
  if (cached) return cached;

  if (providerConfig.provider === "openai") {
    const { createOpenaiChat } = await import("@tanstack/ai-openai");
    const options =
      providerConfig.baseUrl || providerConfig.organization
        ? {
            ...(providerConfig.baseUrl ? { baseURL: providerConfig.baseUrl } : {}),
            ...(providerConfig.organization
              ? { organization: providerConfig.organization }
              : {}),
          }
        : undefined;

    const adapter = createOpenaiChat(
      model as Parameters<typeof createOpenaiChat>[0],
      providerConfig.apiKey,
      options,
    );
    adapterCache.set(cacheKey, adapter);
    return adapter;
  }

  const { createAnthropicChat } = await import("@tanstack/ai-anthropic");
  const adapter = createAnthropicChat(
    model as Parameters<typeof createAnthropicChat>[0],
    providerConfig.apiKey,
  );
  adapterCache.set(cacheKey, adapter);
  return adapter;
};
