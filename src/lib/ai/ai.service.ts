import { chat, type SchemaInput, type StreamChunk } from "@tanstack/ai";
import { createServerOnlyFn } from "@tanstack/react-start";
import type { JsonRecord } from "~/shared/lib/json";
import { estimateCostUsdMicros } from "./ai.costs";
import {
  getAiEmbedConfig,
  getAiTextDefaults,
  getAiTextProviderConfig,
} from "./ai.config";
import { getTextAdapter } from "./ai.registry";
import { assertAiQuota, logAiUsage } from "./ai.usage";
import { renderPrompt, type PromptVariables } from "./prompt-renderer";
import { resolvePromptVersion } from "./prompt-registry";

type AiTextRequest = {
  promptKey?: string;
  promptVersionId?: string;
  prompt?: {
    systemPrompt?: string | null;
    userPrompt: string;
    model?: string;
    temperature?: number | null;
    topP?: number | null;
    maxTokens?: number | null;
    modelOptions?: JsonRecord;
    variables?: string[];
  };
  variables?: PromptVariables;
  strictVariables?: boolean;
  userId?: string | null;
  organizationId?: string | null;
  requestId?: string | null;
  metadata?: JsonRecord;
  model?: string;
  temperature?: number | null;
  topP?: number | null;
  maxTokens?: number | null;
  modelOptions?: JsonRecord;
};

type AiStructuredRequest<TSchema extends SchemaInput> = AiTextRequest & {
  outputSchema: TSchema;
};

type TokenUsage = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
};

const resolveRequestId = async (explicit?: string | null) => {
  if (explicit) return explicit;

  try {
    const { getRequest } = await import("@tanstack/react-start/server");
    const { resolveRequestId } = await import("~/lib/server/request-id");
    return resolveRequestId(getRequest().headers);
  } catch {
    return globalThis.crypto.randomUUID();
  }
};

const createTimeoutController = (timeoutMs: number) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  return { controller, timeout };
};

const buildQuotaParams = (input: {
  userId?: string | null;
  organizationId?: string | null;
}) => {
  const params: { userId?: string | null; organizationId?: string | null } = {};
  if (input.userId !== undefined) {
    params.userId = input.userId;
  }
  if (input.organizationId !== undefined) {
    params.organizationId = input.organizationId;
  }
  return params;
};

const consumeStream = async (
  stream: AsyncIterable<StreamChunk>,
): Promise<{ text: string; usage: TokenUsage | null }> => {
  let text = "";
  let usage: TokenUsage | null = null;

  for await (const chunk of stream) {
    if (chunk.type === "content") {
      text += chunk.delta;
    }

    if (chunk.type === "done") {
      if (chunk.usage) {
        usage = {
          promptTokens: chunk.usage.promptTokens,
          completionTokens: chunk.usage.completionTokens,
          totalTokens: chunk.usage.totalTokens,
        };
      }
    }

    if (chunk.type === "error") {
      throw new Error(chunk.error?.message ?? "AI stream error");
    }
  }

  return { text, usage };
};

const runWithRetries = async <T>(
  maxRetries: number,
  task: (attempt: number) => Promise<T>,
) => {
  let lastError: unknown = null;
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      return await task(attempt);
    } catch (error) {
      lastError = error;
      if (attempt === maxRetries) throw error;
    }
  }
  throw lastError ?? new Error("AI request failed.");
};

const safeLogAiUsage = async (payload: Parameters<typeof logAiUsage>[0]) => {
  try {
    await logAiUsage(payload);
  } catch (error) {
    console.error("[AI] Usage log failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

const resolvePromptConfig = async (input: AiTextRequest) => {
  if (input.prompt) {
    return {
      templateId: null,
      promptVersionId: null,
      systemPrompt: input.prompt.systemPrompt ?? null,
      userPrompt: input.prompt.userPrompt,
      model: input.prompt.model ?? null,
      temperature: input.prompt.temperature ?? null,
      topP: input.prompt.topP ?? null,
      maxTokens: input.prompt.maxTokens ?? null,
      modelOptions: input.prompt.modelOptions ?? {},
    };
  }

  const resolutionInput: { promptKey?: string; promptVersionId?: string } = {};
  if (input.promptKey !== undefined) {
    resolutionInput.promptKey = input.promptKey;
  }
  if (input.promptVersionId !== undefined) {
    resolutionInput.promptVersionId = input.promptVersionId;
  }

  const resolved = await resolvePromptVersion(resolutionInput);

  if (!resolved) {
    const { notFound } = await import("~/lib/server/errors");
    throw notFound("AI prompt template not found.");
  }

  return {
    templateId: resolved.template.id,
    promptVersionId: resolved.version.id,
    systemPrompt: resolved.version.systemPrompt,
    userPrompt: resolved.version.userPrompt,
    model: resolved.version.model,
    temperature: resolved.version.temperature,
    topP: resolved.version.topP,
    maxTokens: resolved.version.maxTokens,
    modelOptions: resolved.version.modelOptions,
  };
};

export const runAiText = createServerOnlyFn(async (input: AiTextRequest) => {
  await assertAiQuota(buildQuotaParams(input));

  const defaults = getAiTextDefaults();
  const providerConfig = getAiTextProviderConfig();
  const promptConfig = await resolvePromptConfig(input);
  const variables = input.variables ?? {};
  const strictVariables = input.strictVariables ?? true;

  const systemPrompt = promptConfig.systemPrompt
    ? renderPrompt(promptConfig.systemPrompt, variables, {
        strict: strictVariables,
      }).text
    : null;
  const userPrompt = renderPrompt(promptConfig.userPrompt, variables, {
    strict: strictVariables,
  }).text;

  const model = input.model ?? promptConfig.model ?? defaults.model;
  const temperature =
    input.temperature ?? promptConfig.temperature ?? defaults.temperature;
  const topP = input.topP ?? promptConfig.topP ?? defaults.topP;
  const maxTokens = input.maxTokens ?? promptConfig.maxTokens ?? defaults.maxTokens;
  const modelOptions = {
    ...promptConfig.modelOptions,
    ...input.modelOptions,
  };
  const metadata: JsonRecord = input.metadata ?? {};

  const requestId = await resolveRequestId(input.requestId);
  const start = Date.now();

  let usage: TokenUsage | null = null;
  let text = "";

  try {
    text = await runWithRetries(providerConfig.maxRetries, async () => {
      const adapter = await getTextAdapter(model);
      const { controller, timeout } = createTimeoutController(providerConfig.timeoutMs);
      try {
        const stream = chat({
          adapter,
          messages: [{ role: "user", content: userPrompt }],
          systemPrompts: systemPrompt ? [systemPrompt] : undefined,
          temperature: temperature ?? undefined,
          topP: topP ?? undefined,
          maxTokens: maxTokens ?? undefined,
          modelOptions: Object.keys(modelOptions).length ? modelOptions : undefined,
          abortController: controller,
        });

        const result = await consumeStream(stream);
        usage = result.usage;
        return result.text;
      } finally {
        clearTimeout(timeout);
      }
    });

    const latencyMs = Date.now() - start;
    // Normalize usage typing for downstream logging/cost estimation.
    const usageTokens = usage as unknown as {
      promptTokens?: number;
      completionTokens?: number;
      totalTokens?: number;
    } | null;
    const costUsdMicros = estimateCostUsdMicros({
      provider: providerConfig.provider,
      model,
      inputTokens: usageTokens?.promptTokens ?? null,
      outputTokens: usageTokens?.completionTokens ?? null,
    });

    await safeLogAiUsage({
      operation: "text",
      status: "success",
      provider: providerConfig.provider,
      model,
      templateId: promptConfig.templateId,
      promptVersionId: promptConfig.promptVersionId,
      organizationId: input.organizationId ?? null,
      userId: input.userId ?? null,
      requestId,
      inputTokens: usageTokens?.promptTokens ?? null,
      outputTokens: usageTokens?.completionTokens ?? null,
      totalTokens: usageTokens?.totalTokens ?? null,
      latencyMs,
      costUsdMicros,
      metadata,
    });

    return { text, usage, latencyMs };
  } catch (error) {
    const latencyMs = Date.now() - start;
    await safeLogAiUsage({
      operation: "text",
      status: "error",
      provider: providerConfig.provider,
      model,
      templateId: promptConfig.templateId,
      promptVersionId: promptConfig.promptVersionId,
      organizationId: input.organizationId ?? null,
      userId: input.userId ?? null,
      requestId,
      latencyMs,
      errorMessage: error instanceof Error ? error.message : "Unknown AI error",
      metadata,
    });

    throw error;
  }
});

export const runAiStructured = createServerOnlyFn(
  async <TSchema extends SchemaInput>(input: AiStructuredRequest<TSchema>) => {
    await assertAiQuota(buildQuotaParams(input));

    const defaults = getAiTextDefaults();
    const providerConfig = getAiTextProviderConfig();
    const promptConfig = await resolvePromptConfig(input);
    const variables = input.variables ?? {};
    const strictVariables = input.strictVariables ?? true;

    const systemPrompt = promptConfig.systemPrompt
      ? renderPrompt(promptConfig.systemPrompt, variables, {
          strict: strictVariables,
        }).text
      : null;
    const userPrompt = renderPrompt(promptConfig.userPrompt, variables, {
      strict: strictVariables,
    }).text;

    const model = input.model ?? promptConfig.model ?? defaults.model;
    const temperature =
      input.temperature ?? promptConfig.temperature ?? defaults.temperature;
    const topP = input.topP ?? promptConfig.topP ?? defaults.topP;
    const maxTokens = input.maxTokens ?? promptConfig.maxTokens ?? defaults.maxTokens;
    const modelOptions = {
      ...promptConfig.modelOptions,
      ...input.modelOptions,
    };
    const metadata: JsonRecord = input.metadata ?? {};

    const requestId = await resolveRequestId(input.requestId);
    const start = Date.now();

    try {
      const result = await runWithRetries(providerConfig.maxRetries, async () => {
        const adapter = await getTextAdapter(model);
        const { controller, timeout } = createTimeoutController(providerConfig.timeoutMs);
        try {
          return await chat({
            adapter,
            messages: [{ role: "user", content: userPrompt }],
            systemPrompts: systemPrompt ? [systemPrompt] : undefined,
            temperature: temperature ?? undefined,
            topP: topP ?? undefined,
            maxTokens: maxTokens ?? undefined,
            modelOptions: Object.keys(modelOptions).length ? modelOptions : undefined,
            outputSchema: input.outputSchema,
            abortController: controller,
          });
        } finally {
          clearTimeout(timeout);
        }
      });

      const latencyMs = Date.now() - start;
      await safeLogAiUsage({
        operation: "structured",
        status: "success",
        provider: providerConfig.provider,
        model,
        templateId: promptConfig.templateId,
        promptVersionId: promptConfig.promptVersionId,
        organizationId: input.organizationId ?? null,
        userId: input.userId ?? null,
        requestId,
        latencyMs,
        metadata,
      });

      return { result, latencyMs };
    } catch (error) {
      const latencyMs = Date.now() - start;
      await safeLogAiUsage({
        operation: "structured",
        status: "error",
        provider: providerConfig.provider,
        model,
        templateId: promptConfig.templateId,
        promptVersionId: promptConfig.promptVersionId,
        organizationId: input.organizationId ?? null,
        userId: input.userId ?? null,
        requestId,
        latencyMs,
        errorMessage: error instanceof Error ? error.message : "Unknown AI error",
        metadata,
      });

      throw error;
    }
  },
);

export const runAiEmbedding = createServerOnlyFn(
  async (input: {
    text: string | string[];
    userId?: string | null;
    organizationId?: string | null;
    requestId?: string | null;
    metadata?: JsonRecord;
  }) => {
    await assertAiQuota(buildQuotaParams(input));

    const config = getAiEmbedConfig();
    const requestId = await resolveRequestId(input.requestId);
    const start = Date.now();
    const metadata: JsonRecord = input.metadata ?? {};

    const runEmbed = async () => {
      const { controller, timeout } = createTimeoutController(config.timeoutMs);
      try {
        const response = await fetch(
          `${config.baseUrl ?? "https://api.openai.com/v1"}/embeddings`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${config.apiKey}`,
              ...(config.organization
                ? { "OpenAI-Organization": config.organization }
                : {}),
            },
            body: JSON.stringify({
              model: config.model,
              input: input.text,
            }),
            signal: controller.signal,
          },
        );

        const payload = (await response.json()) as {
          data?: Array<{ embedding: number[] }>;
          usage?: { prompt_tokens?: number; total_tokens?: number };
          error?: { message?: string };
        };

        if (!response.ok) {
          throw new Error(payload.error?.message ?? "OpenAI embedding request failed.");
        }

        return {
          embeddings: payload.data?.map((item) => item.embedding) ?? [],
          usage: payload.usage,
        };
      } finally {
        clearTimeout(timeout);
      }
    };

    try {
      const result = await runWithRetries(config.maxRetries, runEmbed);
      const latencyMs = Date.now() - start;

      await safeLogAiUsage({
        operation: "embedding",
        status: "success",
        provider: config.provider,
        model: config.model,
        organizationId: input.organizationId ?? null,
        userId: input.userId ?? null,
        requestId,
        inputTokens: result.usage?.prompt_tokens ?? null,
        totalTokens: result.usage?.total_tokens ?? null,
        latencyMs,
        metadata,
      });

      return {
        embeddings: result.embeddings,
        usage: result.usage,
        latencyMs,
      };
    } catch (error) {
      const latencyMs = Date.now() - start;
      await safeLogAiUsage({
        operation: "embedding",
        status: "error",
        provider: config.provider,
        model: config.model,
        organizationId: input.organizationId ?? null,
        userId: input.userId ?? null,
        requestId,
        latencyMs,
        errorMessage: error instanceof Error ? error.message : "Unknown AI error",
        metadata,
      });

      throw error;
    }
  },
);
