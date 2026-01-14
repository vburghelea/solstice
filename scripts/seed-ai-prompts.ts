#!/usr/bin/env tsx

import "dotenv/config";

import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/db/schema";
import { aiPromptTemplates, aiPromptVersions } from "../src/db/schema";
import { extractPromptVariables } from "../src/lib/ai/prompt-renderer";

const DEFAULT_SYSTEM_PROMPT =
  "You are a data analyst writing clear summaries for viaSport stakeholders.";
const DEFAULT_USER_PROMPT =
  "Summarize the report metrics below.\n\n" +
  "Metrics:\n{{metrics}}\n\n" +
  "Period: {{period}}\n\n" +
  "Return two short paragraphs and 3-5 bullet highlights.";

const NL_QUERY_SYSTEM_PROMPT = `You are a data query assistant for a sports
organization management platform called Solstice.

Given a user's natural language question about sports data, interpret their
intent and produce a structured query specification.

Available metrics:
{{metrics}}

Available dimensions:
{{dimensions}}

Rules:
1. Always set datasetId using the dataset id shown in brackets in the lists
2. Only use metrics and dimensions from the lists above - never invent new ones
3. Keep metrics/dimensions within the chosen dataset
4. Set confidence (0.0-1.0) based on how clearly the question maps to available data
5. If the question is ambiguous or unclear, set confidence below 0.7
6. Provide a clear explanation of what the query will calculate
7. Prefer simpler interpretations when multiple are valid
8. For time-based questions, use the timeRange field with appropriate presets`;

const NL_QUERY_USER_PROMPT = `User question: "{{question}}"

Interpret this question and return a structured query intent.`;

type PromptPreset = {
  key: string;
  name: string;
  description: string;
  audiences: string[];
  systemPrompt: string;
  userPrompt: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
};

const PROMPT_PRESETS: Record<string, PromptPreset> = {
  "report-summary": {
    key: "report-summary",
    name: "Report Summary",
    description: "Summarize report metrics into a narrative with highlights.",
    audiences: ["board", "operations"],
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    userPrompt: DEFAULT_USER_PROMPT,
    model: "claude-opus",
  },
  "nl-data-query": {
    key: "nl-data-query",
    name: "Natural Language Data Query",
    description: "Interpret natural language into structured BI query intents.",
    audiences: ["analytics", "reporting"],
    systemPrompt: NL_QUERY_SYSTEM_PROMPT,
    userPrompt: NL_QUERY_USER_PROMPT,
    model: "claude-opus",
    temperature: 0.3,
    maxTokens: 1000,
  },
};

const parseCommaList = (value?: string) => {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
};

const parseNumber = (value?: string) => {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const getConnectionString = (): string => {
  const candidates = [
    process.env["DATABASE_URL_UNPOOLED"],
    process.env["DATABASE_UNPOOLED_URL"],
    process.env["NETLIFY_DATABASE_URL_UNPOOLED"],
    process.env["DATABASE_URL"],
    process.env["DATABASE_POOLED_URL"],
    process.env["NETLIFY_DATABASE_URL"],
  ];

  const connectionString = candidates.find(
    (value) => typeof value === "string" && value.length > 0,
  );
  if (!connectionString) {
    throw new Error(
      "No database connection string found. Set DATABASE_URL (or *_UNPOOLED).",
    );
  }

  return connectionString;
};

const buildTemplateInput = () => {
  const presetKey =
    process.env["AI_PROMPT_PRESET"] ?? process.env["AI_PROMPT_KEY"] ?? "report-summary";
  const preset = PROMPT_PRESETS[presetKey] ?? PROMPT_PRESETS["report-summary"];

  const key = process.env["AI_PROMPT_KEY"] ?? preset.key;
  const name = process.env["AI_PROMPT_NAME"] ?? preset.name;
  const description = process.env["AI_PROMPT_DESCRIPTION"] ?? preset.description;
  const audiencesFromEnv = parseCommaList(process.env["AI_PROMPT_AUDIENCES"]);
  const audiences = audiencesFromEnv.length > 0 ? audiencesFromEnv : preset.audiences;
  const organizationId = process.env["AI_PROMPT_ORG_ID"] ?? null;
  const systemPrompt = process.env["AI_PROMPT_SYSTEM_PROMPT"] ?? preset.systemPrompt;
  const userPrompt = process.env["AI_PROMPT_USER_PROMPT"] ?? preset.userPrompt;
  const model =
    process.env["AI_PROMPT_MODEL"] ?? process.env["AI_TEXT_MODEL"] ?? preset.model;
  const temperature =
    parseNumber(process.env["AI_PROMPT_TEMPERATURE"]) ?? preset.temperature;
  const maxTokens = parseNumber(process.env["AI_PROMPT_MAX_TOKENS"]) ?? preset.maxTokens;
  const createdBy = process.env["AI_PROMPT_CREATED_BY"] ?? null;
  const notes = process.env["AI_PROMPT_VERSION_NOTES"] ?? "Seeded via seed-ai-prompts.ts";

  const variables = [
    ...new Set([
      ...extractPromptVariables(systemPrompt),
      ...extractPromptVariables(userPrompt),
    ]),
  ];

  return {
    key,
    name,
    description,
    audiences,
    organizationId,
    systemPrompt,
    userPrompt,
    model,
    temperature,
    maxTokens,
    createdBy,
    notes,
    variables,
  };
};

const seedPrompt = async (
  db: ReturnType<typeof drizzle>,
  input: ReturnType<typeof buildTemplateInput>,
) => {
  const [existing] = await db
    .select({ id: aiPromptTemplates.id })
    .from(aiPromptTemplates)
    .where(eq(aiPromptTemplates.key, input.key))
    .limit(1);

  if (existing) {
    console.log(`✅ Prompt template already exists: ${input.key}`);
    return;
  }

  const [template] = await db
    .insert(aiPromptTemplates)
    .values({
      key: input.key,
      name: input.name,
      description: input.description,
      audiences: input.audiences,
      organizationId: input.organizationId,
      isArchived: false,
      createdBy: input.createdBy,
      updatedBy: input.createdBy,
    })
    .returning();

  const [version] = await db
    .insert(aiPromptVersions)
    .values({
      templateId: template.id,
      version: 1,
      status: "active",
      systemPrompt: input.systemPrompt,
      userPrompt: input.userPrompt,
      model: input.model,
      ...(input.temperature != null ? { temperature: input.temperature } : {}),
      ...(input.maxTokens != null ? { maxTokens: input.maxTokens } : {}),
      variables: input.variables,
      notes: input.notes,
      createdBy: input.createdBy,
    })
    .returning();

  console.log(`✅ Seeded prompt template: ${template.key} (${template.id})`);
  console.log(`✅ Seeded prompt version: v${version.version} (${version.id})`);
};

async function main() {
  console.log("🌱 Seeding AI prompt template...");

  const connectionString = getConnectionString();
  const sql = postgres(connectionString, { max: 1 });
  const db = drizzle(sql, { schema, casing: "snake_case" });

  try {
    const input = buildTemplateInput();
    await seedPrompt(db, input);
  } catch (error) {
    console.error("❌ Failed to seed AI prompts:", error);
    process.exitCode = 1;
  } finally {
    await sql.end({ timeout: 3 });
  }
}

main().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});
