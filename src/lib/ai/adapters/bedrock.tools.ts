import type {
  ConverseCommandInput,
  ConverseResponse,
  Tool as BedrockTool,
  ToolConfiguration,
} from "@aws-sdk/client-bedrock-runtime";
import { convertSchemaToJsonSchema, type JSONSchema, type Tool } from "@tanstack/ai";
import type { BedrockToolSchema } from "./bedrock.types";

type BedrockDocumentType = NonNullable<
  ConverseCommandInput["additionalModelRequestFields"]
>;

const EMPTY_INPUT_SCHEMA: BedrockToolSchema = {
  type: "object",
  properties: {},
  required: [],
};

export const STRUCTURED_OUTPUT_TOOL_NAME = "structured_output";

const resolveToolSchema = (schema?: Tool["inputSchema"]) =>
  (convertSchemaToJsonSchema(schema) as BedrockToolSchema | undefined) ??
  EMPTY_INPUT_SCHEMA;

const buildToolSpec = (tool: Tool): BedrockTool => ({
  toolSpec: {
    name: tool.name,
    description: tool.description,
    inputSchema: {
      json: resolveToolSchema(tool.inputSchema) as BedrockDocumentType,
    },
  },
});

export const convertToolsToBedrockConfig = (
  tools?: Tool[],
): ToolConfiguration | undefined => {
  if (!tools || tools.length === 0) return undefined;

  return {
    tools: tools.map(buildToolSpec),
  };
};

export const buildStructuredOutputToolConfig = (
  outputSchema: JSONSchema,
): ToolConfiguration => ({
  tools: [
    {
      toolSpec: {
        name: STRUCTURED_OUTPUT_TOOL_NAME,
        description: "Return data that matches the structured output schema exactly.",
        inputSchema: { json: outputSchema as BedrockDocumentType },
      },
    },
  ],
  toolChoice: {
    tool: { name: STRUCTURED_OUTPUT_TOOL_NAME },
  },
});

export const extractStructuredOutputFromResponse = (response: ConverseResponse) => {
  const message = response.output?.message;
  const content = message?.content ?? [];
  const toolUseBlock = content.find(
    (block) => "toolUse" in block && block.toolUse?.name === STRUCTURED_OUTPUT_TOOL_NAME,
  );

  if (toolUseBlock && "toolUse" in toolUseBlock && toolUseBlock.toolUse) {
    const input = toolUseBlock.toolUse.input ?? {};
    return {
      data: input,
      rawText: JSON.stringify(input),
    };
  }

  const rawText = content
    .map((block) => ("text" in block ? (block.text ?? "") : ""))
    .join("");
  if (!rawText) {
    throw new Error("Structured output missing from Bedrock response.");
  }

  try {
    return {
      data: JSON.parse(rawText),
      rawText,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const preview = rawText.slice(0, 200);
    const suffix = rawText.length > 200 ? "..." : "";
    throw new Error(
      `Failed to parse structured output as JSON (${message}). ` +
        `Content: ${preview}${suffix}`,
    );
  }
};
