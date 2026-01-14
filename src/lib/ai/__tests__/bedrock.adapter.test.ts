import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
import type {
  ConverseResponse,
  ConverseStreamOutput,
} from "@aws-sdk/client-bedrock-runtime";
import type { JSONSchema, Tool } from "@tanstack/ai";
import { describe, expect, it } from "vitest";
import { createBedrockStreamParser } from "../adapters/bedrock.adapter";
import {
  STRUCTURED_OUTPUT_TOOL_NAME,
  buildStructuredOutputToolConfig,
  convertToolsToBedrockConfig,
  extractStructuredOutputFromResponse,
} from "../adapters/bedrock.tools";
import { resolveBedrockModelId } from "../adapters/bedrock.types";

const shouldRunLive = process.env["BEDROCK_LIVE_TESTS"] === "true";
const describeLive = shouldRunLive ? describe : describe.skip;

describe("bedrock adapter", () => {
  it("resolves model aliases", () => {
    expect(resolveBedrockModelId("claude-sonnet")).toBe(
      "anthropic.claude-sonnet-4-5-20250929-v1:0",
    );
    expect(resolveBedrockModelId("custom.model")).toBe("custom.model");
  });

  it("converts tools to Bedrock tool config", () => {
    const tool: Tool = {
      name: "lookup_dataset",
      description: "Lookup dataset metadata by key.",
      inputSchema: {
        type: "object",
        properties: {
          datasetKey: { type: "string" },
        },
        required: ["datasetKey"],
      },
    };

    const config = convertToolsToBedrockConfig([tool]);

    expect(config?.tools).toHaveLength(1);
    expect(config?.tools?.[0]?.toolSpec?.name).toBe("lookup_dataset");
    expect(config?.tools?.[0]?.toolSpec?.description).toBe(
      "Lookup dataset metadata by key.",
    );
    const schema = config?.tools?.[0]?.toolSpec?.inputSchema?.json;
    if (!schema || typeof schema !== "object" || Array.isArray(schema)) {
      throw new Error("Expected tool schema object.");
    }
    expect(schema["type"]).toBe("object");
  });

  it("forces structured output tool choice", () => {
    const schema: JSONSchema = {
      type: "object",
      properties: {
        answer: { type: "string" },
      },
      required: ["answer"],
    };

    const config = buildStructuredOutputToolConfig(schema);

    expect(config.tools?.[0]?.toolSpec?.name).toBe(STRUCTURED_OUTPUT_TOOL_NAME);
    expect(config.toolChoice?.tool?.name).toBe(STRUCTURED_OUTPUT_TOOL_NAME);
  });

  it("extracts structured output from tool use", () => {
    const response = {
      output: {
        message: {
          role: "assistant",
          content: [
            {
              toolUse: {
                toolUseId: "tool-1",
                name: STRUCTURED_OUTPUT_TOOL_NAME,
                input: { answer: "42" },
              },
            },
          ],
        },
      },
      stopReason: undefined,
      usage: undefined,
      metrics: undefined,
    } satisfies ConverseResponse;

    const result = extractStructuredOutputFromResponse(response);

    expect(result.data).toEqual({ answer: "42" });
    expect(result.rawText).toBe(JSON.stringify({ answer: "42" }));
  });

  it("extracts structured output from text fallback", () => {
    const payload = { answer: "yes" };
    const response = {
      output: {
        message: {
          role: "assistant",
          content: [{ text: JSON.stringify(payload) }],
        },
      },
      stopReason: undefined,
      usage: undefined,
      metrics: undefined,
    } satisfies ConverseResponse;

    const result = extractStructuredOutputFromResponse(response);

    expect(result.data).toEqual(payload);
    expect(result.rawText).toBe(JSON.stringify(payload));
  });

  it("maps stream text deltas and usage", () => {
    const parser = createBedrockStreamParser({
      model: "claude-sonnet",
      generateId: () => "chunk-1",
    });

    const metadataEvent = {
      metadata: {
        usage: { inputTokens: 4, outputTokens: 6, totalTokens: 10 },
        metrics: { latencyMs: 12 },
      },
    } satisfies ConverseStreamOutput;

    const deltaEvent = {
      contentBlockDelta: {
        delta: { text: "Hello" },
        contentBlockIndex: 0,
      },
    } satisfies ConverseStreamOutput;

    const stopEvent = {
      messageStop: {
        stopReason: "end_turn",
      },
    } satisfies ConverseStreamOutput;

    expect(parser.handleEvent(metadataEvent)).toEqual([]);

    const contentChunks = parser.handleEvent(deltaEvent);
    expect(contentChunks).toHaveLength(1);
    expect(contentChunks[0]).toMatchObject({
      type: "content",
      delta: "Hello",
      content: "Hello",
      role: "assistant",
    });

    const doneChunks = parser.handleEvent(stopEvent);
    expect(doneChunks).toHaveLength(1);
    expect(doneChunks[0]).toMatchObject({
      type: "done",
      finishReason: "stop",
      usage: { promptTokens: 4, completionTokens: 6, totalTokens: 10 },
    });
  });

  it("maps tool calls and results", () => {
    const parser = createBedrockStreamParser({
      model: "claude-sonnet",
      generateId: () => "chunk-2",
    });

    const toolStartEvent = {
      contentBlockStart: {
        start: {
          toolUse: {
            toolUseId: "tool-123",
            name: "lookup_dataset",
          },
        },
        contentBlockIndex: 1,
      },
    } satisfies ConverseStreamOutput;

    const toolDeltaEvent = {
      contentBlockDelta: {
        delta: { toolUse: { input: '{"dataset":"events"}' } },
        contentBlockIndex: 1,
      },
    } satisfies ConverseStreamOutput;

    const toolResultStartEvent = {
      contentBlockStart: {
        start: {
          toolResult: {
            toolUseId: "tool-123",
          },
        },
        contentBlockIndex: 2,
      },
    } satisfies ConverseStreamOutput;

    const toolResultDeltaEvent = {
      contentBlockDelta: {
        delta: { toolResult: [{ text: "ok" }] },
        contentBlockIndex: 2,
      },
    } satisfies ConverseStreamOutput;

    expect(parser.handleEvent(toolStartEvent)).toEqual([]);

    const toolCallChunks = parser.handleEvent(toolDeltaEvent);
    expect(toolCallChunks).toHaveLength(1);
    expect(toolCallChunks[0]).toMatchObject({
      type: "tool_call",
      index: 0,
      toolCall: {
        id: "tool-123",
        type: "function",
        function: {
          name: "lookup_dataset",
          arguments: '{"dataset":"events"}',
        },
      },
    });

    expect(parser.handleEvent(toolResultStartEvent)).toEqual([]);

    const toolResultChunks = parser.handleEvent(toolResultDeltaEvent);
    expect(toolResultChunks).toHaveLength(1);
    expect(toolResultChunks[0]).toMatchObject({
      type: "tool_result",
      toolCallId: "tool-123",
      content: "ok",
    });
  });
});

describeLive("bedrock adapter live", () => {
  it("runs a live Bedrock request", async () => {
    const client = new BedrockRuntimeClient({
      region: process.env["AWS_REGION"] ?? "ca-central-1",
    });

    const response = await client.send(
      new ConverseCommand({
        modelId: resolveBedrockModelId("claude-sonnet"),
        messages: [
          {
            role: "user",
            content: [{ text: "Respond with a single word." }],
          },
        ],
        inferenceConfig: {
          maxTokens: 32,
          temperature: 0,
        },
      }),
    );

    const content = response.output?.message?.content ?? [];
    const text = content
      .map((block) => ("text" in block ? (block.text ?? "") : ""))
      .join("");
    expect(text.length).toBeGreaterThan(0);
  });
});
