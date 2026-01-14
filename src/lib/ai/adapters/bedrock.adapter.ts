import {
  BedrockRuntimeClient,
  ConverseCommand,
  ConverseStreamCommand,
  type ContentBlock,
  type ConverseCommandInput,
  type ConverseResponse,
  type ConverseStreamOutput,
  type Message,
  type TokenUsage,
} from "@aws-sdk/client-bedrock-runtime";
import type {
  ContentPart,
  DefaultMessageMetadataByModality,
  ModelMessage,
  StreamChunk,
  TextOptions,
} from "@tanstack/ai";
import {
  BaseTextAdapter,
  type StructuredOutputOptions,
  type StructuredOutputResult,
} from "@tanstack/ai/adapters";
import {
  convertToolsToBedrockConfig,
  buildStructuredOutputToolConfig,
  extractStructuredOutputFromResponse,
} from "./bedrock.tools";
import type {
  BedrockAdapterConfig,
  BedrockModelId,
  BedrockProviderOptions,
} from "./bedrock.types";
import { resolveBedrockModelId } from "./bedrock.types";

type BedrockDocumentType = NonNullable<
  ConverseCommandInput["additionalModelRequestFields"]
>;

type BedrockStreamParserOptions = {
  model: string;
  generateId: () => string;
};

type BedrockStreamParser = {
  handleEvent: (event: ConverseStreamOutput) => StreamChunk[];
};

const mapFinishReason = (reason?: string) => {
  switch (reason) {
    case "end_turn":
    case "stop_sequence":
      return "stop";
    case "max_tokens":
    case "model_context_window_exceeded":
      return "length";
    case "content_filtered":
    case "guardrail_intervened":
      return "content_filter";
    case "tool_use":
      return "tool_calls";
    default:
      return null;
  }
};

const mapUsage = (usage?: TokenUsage) => {
  if (!usage) return undefined;
  const promptTokens = usage.inputTokens ?? 0;
  const completionTokens = usage.outputTokens ?? 0;
  const totalTokens = usage.totalTokens ?? promptTokens + completionTokens;
  return { promptTokens, completionTokens, totalTokens };
};

const buildRequestMetadata = (metadata?: Record<string, unknown>) => {
  if (!metadata) return undefined;
  const entries = Object.entries(metadata).filter(
    (entry): entry is [string, string] => typeof entry[1] === "string",
  );
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
};

const buildAdditionalModelFields = (
  modelOptions?: BedrockProviderOptions,
): BedrockDocumentType | undefined => {
  if (!modelOptions || Object.keys(modelOptions).length === 0) return undefined;
  return modelOptions as BedrockDocumentType;
};

const buildRequestOptions = (abortController?: AbortController) =>
  abortController ? { abortSignal: abortController.signal } : undefined;

const normalizeContentParts = (content: ModelMessage["content"]): ContentPart[] => {
  if (!content) return [];
  if (typeof content === "string") {
    return [{ type: "text", content }];
  }
  return content;
};

const convertTextParts = (parts: ContentPart[]): ContentBlock[] => {
  const blocks: ContentBlock[] = [];
  for (const part of parts) {
    if (part.type === "text") {
      blocks.push({ text: part.content });
      continue;
    }
    throw new Error(`Bedrock adapter only supports text content parts.`);
  }
  return blocks;
};

const convertMessages = (messages: Array<ModelMessage>): Message[] => {
  const converted: Message[] = [];

  for (const message of messages) {
    if (message.role === "tool") {
      if (!message.toolCallId) {
        throw new Error("Tool result message missing toolCallId.");
      }
      const content =
        typeof message.content === "string"
          ? message.content
          : JSON.stringify(message.content ?? "");
      converted.push({
        role: "user",
        content: [
          {
            toolResult: {
              toolUseId: message.toolCallId,
              content: [{ text: content }],
            },
          },
        ],
      });
      continue;
    }

    if (message.role === "assistant" && message.toolCalls?.length) {
      const parts = normalizeContentParts(message.content);
      const contentBlocks = convertTextParts(parts);

      for (const toolCall of message.toolCalls) {
        let parsedInput: BedrockDocumentType = {};
        try {
          parsedInput = toolCall.function.arguments
            ? (JSON.parse(toolCall.function.arguments) as BedrockDocumentType)
            : {};
        } catch {
          parsedInput = toolCall.function.arguments ?? "";
        }

        contentBlocks.push({
          toolUse: {
            toolUseId: toolCall.id,
            name: toolCall.function.name,
            input: parsedInput,
          },
        });
      }

      converted.push({
        role: "assistant",
        content: contentBlocks,
      });
      continue;
    }

    const parts = normalizeContentParts(message.content);
    const contentBlocks = convertTextParts(parts);
    if (contentBlocks.length === 0) {
      contentBlocks.push({ text: "" });
    }

    converted.push({
      role: message.role === "assistant" ? "assistant" : "user",
      content: contentBlocks,
    });
  }

  return converted;
};

export const createBedrockStreamParser = (
  options: BedrockStreamParserOptions,
): BedrockStreamParser => {
  const timestamp = Date.now();
  const toolCallsByBlock = new Map<
    number,
    { id: string; name: string; args: string; index: number }
  >();
  const toolResultsByBlock = new Map<number, { id: string; content: string }>();
  let accumulatedContent = "";
  let accumulatedThinking = "";
  let toolIndex = 0;
  let usage: ReturnType<typeof mapUsage> | undefined;

  const buildChunkBase = () => ({
    id: options.generateId(),
    model: options.model,
    timestamp,
  });

  const buildErrorChunk = (message: string, code?: string): StreamChunk => ({
    type: "error",
    ...buildChunkBase(),
    error: {
      message,
      ...(code ? { code } : {}),
    },
  });

  return {
    handleEvent(event: ConverseStreamOutput) {
      if ("metadata" in event && event.metadata) {
        usage = mapUsage(event.metadata.usage);
        return [];
      }

      if ("contentBlockStart" in event && event.contentBlockStart) {
        const start = event.contentBlockStart.start;
        const blockIndex = event.contentBlockStart.contentBlockIndex ?? 0;

        if (start && "toolUse" in start && start.toolUse) {
          toolCallsByBlock.set(blockIndex, {
            id: start.toolUse.toolUseId ?? options.generateId(),
            name: start.toolUse.name ?? "",
            args: "",
            index: toolIndex,
          });
          toolIndex += 1;
        }

        if (start && "toolResult" in start && start.toolResult) {
          toolResultsByBlock.set(blockIndex, {
            id: start.toolResult.toolUseId ?? "",
            content: "",
          });
        }

        return [];
      }

      if ("contentBlockDelta" in event && event.contentBlockDelta) {
        const delta = event.contentBlockDelta.delta;
        const blockIndex = event.contentBlockDelta.contentBlockIndex ?? 0;
        if (!delta) return [];

        if ("text" in delta && typeof delta.text === "string") {
          accumulatedContent += delta.text;
          return [
            {
              type: "content",
              ...buildChunkBase(),
              delta: delta.text,
              content: accumulatedContent,
              role: "assistant",
            },
          ];
        }

        if ("toolUse" in delta && delta.toolUse) {
          const toolEntry = toolCallsByBlock.get(blockIndex);
          if (!toolEntry) return [];

          const input = delta.toolUse.input ?? "";
          toolEntry.args += input;

          return [
            {
              type: "tool_call",
              ...buildChunkBase(),
              index: toolEntry.index,
              toolCall: {
                id: toolEntry.id,
                type: "function",
                function: {
                  name: toolEntry.name,
                  arguments: input,
                },
              },
            },
          ];
        }

        if ("toolResult" in delta && delta.toolResult?.length) {
          const toolResult = toolResultsByBlock.get(blockIndex);
          if (!toolResult) return [];

          const chunks: StreamChunk[] = [];
          for (const item of delta.toolResult) {
            let chunkText = "";
            if ("text" in item && typeof item.text === "string") {
              chunkText = item.text;
            } else if ("json" in item && item.json) {
              chunkText = JSON.stringify(item.json);
            }
            if (!chunkText) continue;
            toolResult.content += chunkText;
            chunks.push({
              type: "tool_result",
              ...buildChunkBase(),
              toolCallId: toolResult.id,
              content: toolResult.content,
            });
          }
          return chunks;
        }

        if ("reasoningContent" in delta && delta.reasoningContent) {
          const reasoning = delta.reasoningContent;
          if ("text" in reasoning && typeof reasoning.text === "string") {
            accumulatedThinking += reasoning.text;
            return [
              {
                type: "thinking",
                ...buildChunkBase(),
                delta: reasoning.text,
                content: accumulatedThinking,
              },
            ];
          }
        }

        return [];
      }

      if ("contentBlockStop" in event && event.contentBlockStop) {
        const blockIndex = event.contentBlockStop.contentBlockIndex ?? 0;
        const toolEntry = toolCallsByBlock.get(blockIndex);
        if (toolEntry && toolEntry.args.length === 0) {
          return [
            {
              type: "tool_call",
              ...buildChunkBase(),
              index: toolEntry.index,
              toolCall: {
                id: toolEntry.id,
                type: "function",
                function: {
                  name: toolEntry.name,
                  arguments: "{}",
                },
              },
            },
          ];
        }
        return [];
      }

      if ("messageStop" in event && event.messageStop) {
        return [
          {
            type: "done",
            ...buildChunkBase(),
            finishReason: mapFinishReason(event.messageStop.stopReason),
            ...(usage ? { usage } : {}),
          },
        ];
      }

      if ("internalServerException" in event && event.internalServerException) {
        return [
          buildErrorChunk(
            event.internalServerException.message ?? "Bedrock internal error",
            "internal_server_exception",
          ),
        ];
      }

      if ("modelStreamErrorException" in event && event.modelStreamErrorException) {
        return [
          buildErrorChunk(
            event.modelStreamErrorException.message ?? "Bedrock stream error",
            "model_stream_error",
          ),
        ];
      }

      if ("validationException" in event && event.validationException) {
        return [
          buildErrorChunk(
            event.validationException.message ?? "Bedrock validation error",
            "validation_exception",
          ),
        ];
      }

      if ("throttlingException" in event && event.throttlingException) {
        return [
          buildErrorChunk(
            event.throttlingException.message ?? "Bedrock throttling",
            "throttling_exception",
          ),
        ];
      }

      if ("serviceUnavailableException" in event && event.serviceUnavailableException) {
        return [
          buildErrorChunk(
            event.serviceUnavailableException.message ?? "Bedrock service unavailable",
            "service_unavailable",
          ),
        ];
      }

      return [];
    },
  };
};

export class BedrockTextAdapter extends BaseTextAdapter<
  BedrockModelId,
  BedrockProviderOptions,
  ["text"],
  DefaultMessageMetadataByModality
> {
  readonly name = "bedrock" as const;
  private client: BedrockRuntimeClient;

  constructor(config: BedrockAdapterConfig, model: BedrockModelId) {
    super({}, model);
    this.client = new BedrockRuntimeClient({
      region: config.region ?? "ca-central-1",
    });
  }

  async *chatStream(
    options: TextOptions<BedrockProviderOptions>,
  ): AsyncIterable<StreamChunk> {
    const response = await this.client.send(
      new ConverseStreamCommand({
        modelId: resolveBedrockModelId(this.model),
        messages: convertMessages(options.messages),
        system: options.systemPrompts?.map((text) => ({ text })),
        inferenceConfig: {
          maxTokens: options.maxTokens,
          temperature: options.temperature,
          topP: options.topP,
        },
        toolConfig: convertToolsToBedrockConfig(options.tools),
        additionalModelRequestFields: buildAdditionalModelFields(options.modelOptions),
        requestMetadata: buildRequestMetadata(options.metadata),
      }),
      buildRequestOptions(options.abortController),
    );

    const parser = createBedrockStreamParser({
      model: this.model,
      generateId: () => this.generateId(),
    });

    for await (const event of response.stream ?? []) {
      const chunks = parser.handleEvent(event);
      for (const chunk of chunks) {
        yield chunk;
      }
    }
  }

  async structuredOutput(
    options: StructuredOutputOptions<BedrockProviderOptions>,
  ): Promise<StructuredOutputResult<unknown>> {
    const { chatOptions, outputSchema } = options;
    const response = await this.client.send(
      new ConverseCommand({
        modelId: resolveBedrockModelId(this.model),
        messages: convertMessages(chatOptions.messages),
        system: chatOptions.systemPrompts?.map((text) => ({ text })),
        inferenceConfig: {
          maxTokens: chatOptions.maxTokens,
          temperature: chatOptions.temperature,
          topP: chatOptions.topP,
        },
        toolConfig: buildStructuredOutputToolConfig(outputSchema),
        additionalModelRequestFields: buildAdditionalModelFields(
          chatOptions.modelOptions,
        ),
        requestMetadata: buildRequestMetadata(chatOptions.metadata),
      }),
      buildRequestOptions(chatOptions.abortController),
    );

    const { data, rawText } = extractStructuredOutputFromResponse(
      response as ConverseResponse,
    );
    return { data, rawText };
  }
}

export const createBedrockChat = (model: BedrockModelId, config: BedrockAdapterConfig) =>
  new BedrockTextAdapter(config, model);
