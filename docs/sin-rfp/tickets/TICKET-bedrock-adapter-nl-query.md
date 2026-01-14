# TICKET: AWS Bedrock Adapter + Natural Language Data Query

**Priority:** High
**Effort:** Medium (5-7 dev days)
**Dependencies:** Existing AI foundation layer (`src/lib/ai/`), Analytics/BI infrastructure
**RFP Requirements:** RP-AGG-005 (Self-Service Analytics), AI-enabled insights (desirable)

---

## Summary

Add AWS Bedrock as a TanStack AI provider adapter, then implement Natural Language Data Query as the first feature to validate the integration. Users will ask questions in plain English ("How many athletes registered in 2023 by sport?") and receive structured query results without writing SQL or navigating complex filters.

This ticket delivers two outcomes:

1. **Infrastructure:** Bedrock adapter that slots into the existing AI architecture
2. **Feature:** Working NL query feature that demonstrates Bedrock in production

## Constraints (confirmed)

- Reuse the existing BI semantic catalog and query engine
  (`src/features/bi/semantic`, `src/features/bi/engine/*`, guardrails).
- Bedrock is the only supported provider (no direct OpenAI/Anthropic usage).
- Bedrock region is `ca-central-1` only (no cross-region inference profiles).
- Add a dedicated NL query audit table using the same tamper-evident chain pattern
  as `bi_query_log`.

---

## Part 1: AWS Bedrock Adapter

### Problem Statement

Standardize on AWS Bedrock only and remove direct OpenAI/Anthropic adapters. This:

- Eliminates provider API keys (IAM only)
- Keeps data within AWS (PIPEDA-friendly)
- Consolidates billing with existing AWS infrastructure

AWS Bedrock provides Claude, Titan, Llama, and other models through a unified API with IAM authentication, Canadian region support, and consolidated billing.

### Solution: Custom TanStack AI Bedrock Adapter

Create a `BedrockTextAdapter` that implements TanStack AI's adapter interface, using the AWS SDK's Converse API for model-agnostic streaming.

### Technical Design

#### New Files

| File                                           | Purpose                             |
| ---------------------------------------------- | ----------------------------------- |
| `src/lib/ai/adapters/bedrock.adapter.ts`       | Core Bedrock text adapter           |
| `src/lib/ai/adapters/bedrock.types.ts`         | Type definitions and model metadata |
| `src/lib/ai/adapters/bedrock.tools.ts`         | Tool conversion utilities           |
| `src/lib/ai/__tests__/bedrock.adapter.test.ts` | Unit tests                          |

#### Adapter Implementation

```typescript
// src/lib/ai/adapters/bedrock.adapter.ts
import {
  BedrockRuntimeClient,
  ConverseCommand,
  ConverseStreamCommand,
} from "@aws-sdk/client-bedrock-runtime";
import {
  BaseTextAdapter,
  type DefaultMessageMetadataByModality,
  type StreamChunk,
  type StructuredOutputOptions,
  type StructuredOutputResult,
  type TextOptions,
} from "@tanstack/ai";

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
        modelId: resolveModelId(this.model),
        messages: convertMessages(options.messages),
        system: options.systemPrompts?.map((text) => ({ text })),
        inferenceConfig: {
          maxTokens: options.maxTokens,
          temperature: options.temperature,
          topP: options.topP,
        },
        toolConfig: options.tools ? convertTools(options.tools) : undefined,
      }),
    );

    // Convert Bedrock streaming events to TanStack AI StreamChunk format
    for await (const event of response.stream ?? []) {
      yield* this.convertStreamEvent(event);
    }
  }

  async structuredOutput(
    options: StructuredOutputOptions<BedrockProviderOptions>,
  ): Promise<StructuredOutputResult<unknown>> {
    const { chatOptions, outputSchema } = options;
    const response = await this.client.send(
      new ConverseCommand({
        modelId: resolveModelId(this.model),
        messages: convertMessages(chatOptions.messages),
        system: chatOptions.systemPrompts?.map((text) => ({ text })),
        inferenceConfig: {
          maxTokens: chatOptions.maxTokens,
          temperature: chatOptions.temperature,
          topP: chatOptions.topP,
        },
        toolConfig: buildStructuredOutputTools(outputSchema),
      }),
    );

    const { rawText, data } = extractStructuredOutput(response);
    return { data, rawText };
  }
}

export const createBedrockChat = (
  model: BedrockModelId,
  config: BedrockAdapterConfig,
) => new BedrockTextAdapter(config, model);
```

Note: `@tanstack/ai` uses `adapter.model` as the authoritative model. The adapter
must be constructed with the resolved model alias; do not rely on
`options.model`.

Structured output should force a tool call and parse the tool arguments for JSON
output to reduce parsing failures.

#### Bedrock Stream Event Mapping

| Bedrock Event                     | TanStack AI StreamChunk                                                                                                     | Notes                                    |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `contentBlockStart`               | `{ type: "content", id, model, timestamp, delta: "", content: "" }`                                                         | Start content block                      |
| `contentBlockDelta.delta.text`    | `{ type: "content", id, model, timestamp, delta, content }`                                                                 | Accumulate full content                  |
| `contentBlockStart.toolUse`       | `{ type: "tool_call", id, model, timestamp, index, toolCall: { id, type: "function", function: { name, arguments: "" } } }` | Track tool call index per response       |
| `contentBlockDelta.delta.toolUse` | `{ type: "tool_call", id, model, timestamp, index, toolCall: { ...arguments } }`                                            | Append incremental args                  |
| `messageStop`                     | `{ type: "done", id, model, timestamp, finishReason, usage }`                                                               | Emit once with final usage               |
| `metadata.usage`                  | Stash until `messageStop`                                                                                                   | Map to `promptTokens`/`completionTokens` |

Keep a per-response `id`, `timestamp`, and accumulators for content/tool arguments so
the chunks comply with the `StreamChunk` contract.

#### Model ID Resolution

```typescript
// Bedrock model IDs for Claude
const BEDROCK_MODEL_MAP: Record<string, string> = {
  // Aliases for convenience
  "claude-sonnet": "anthropic.claude-3-sonnet-20240229-v1:0",
  "claude-haiku": "anthropic.claude-3-haiku-20240307-v1:0",
  "claude-opus": "anthropic.claude-opus-4-5-20251101-v1:0",
  // Direct model IDs pass through (must exist in ca-central-1)
};

const resolveModelId = (model: string) => BEDROCK_MODEL_MAP[model] ?? model;
```

Only use model IDs available in `ca-central-1`. Cross-region inference profiles are
out of scope for this ticket. Opus 4.5 and Embed v4 require inference profiles
in `ca-central-1`; set `AI_TEXT_MODEL`/`AI_EMBED_MODEL` to the profile ID/ARN
where needed.

#### Configuration Updates

```typescript
// src/lib/ai/ai.config.ts additions
export type AiProvider = "bedrock";

type AiProviderConfig = {
  provider: AiProvider;
  region?: string;
  timeoutMs: number;
  maxRetries: number;
};

const DEFAULT_TEXT_MODELS: Record<AiProvider, string> = {
  bedrock: "claude-opus",
};

export const getAiTextProviderConfig = (): AiProviderConfig => ({
  provider: "bedrock",
  region: env.AWS_REGION ?? "ca-central-1",
  timeoutMs: env.AI_TIMEOUT_MS ?? 20_000,
  maxRetries: env.AI_MAX_RETRIES ?? 2,
});

export const getAiEmbedConfig = () => ({
  provider: "bedrock",
  region: env.AWS_REGION ?? "ca-central-1",
  timeoutMs: env.AI_TIMEOUT_MS ?? 20_000,
  maxRetries: env.AI_MAX_RETRIES ?? 2,
  model: env.AI_EMBED_MODEL ?? "cohere.embed-v4:0",
});
```

Update `env.server.ts` to expose `AWS_REGION` and `AI_EMBED_MODEL`. Bedrock is
the only provider.

#### Registry Integration

```typescript
// src/lib/ai/ai.registry.ts additions
export async function getTextAdapter(model: string) {
  const config = getAiTextProviderConfig();
  const { createBedrockChat } = await import("./adapters/bedrock.adapter");
  return createBedrockChat(model, { region: config.region });
}
```

### Environment Variables

| Variable         | Required | Default             | Description                                |
| ---------------- | -------- | ------------------- | ------------------------------------------ |
| `AI_TEXT_MODEL`  | No       | `claude-opus`       | Bedrock model alias or model ID            |
| `AI_EMBED_MODEL` | No       | `cohere.embed-v4:0` | Embed v4 model ID or inference profile ARN |
| `AWS_REGION`     | No       | `ca-central-1`      | Bedrock region (Canada only)               |

No API keys needed - Bedrock uses IAM authentication via SST's automatic credential injection.
If Opus 4.5 or Embed v4 requires an inference profile, set `AI_TEXT_MODEL` and
`AI_EMBED_MODEL` to the profile ID/ARN for the target environment.

### Embeddings (Cohere Embed v4)

Use Bedrock `InvokeModel` with Cohere Embed v4 for all embeddings. Default
model ID: `cohere.embed-v4:0`.

Request shape (text only):

```json
{
  "input_type": "search_document",
  "texts": ["Text to embed..."],
  "embedding_types": ["float"],
  "output_dimension": 1024
}
```

Response shape (Bedrock may return either format):

```json
{ "embeddings": [[0.1, 0.2, 0.3]] }
```

```json
{ "embeddings": { "float": [[0.1, 0.2, 0.3]] } }
```

Note: Bedrock Embed v4 does not return token usage in the response. Usage
logging should record token counts as `null`.

### Cost Tracking Updates

```typescript
// src/lib/ai/ai.costs.ts additions
const DEFAULT_MODEL_PRICING: PricingConfig = {
  bedrock: {
    // Bedrock pricing (per 1M tokens, USD)
    // Note: Bedrock pricing may differ slightly from direct API
    "anthropic.claude-3-sonnet-20240229-v1:0": {
      inputPer1M: 3.0,
      outputPer1M: 15.0,
    },
    "anthropic.claude-3-haiku-20240307-v1:0": {
      inputPer1M: 0.25,
      outputPer1M: 1.25,
    },
    "anthropic.claude-opus-4-5-20251101-v1:0": {
      inputPer1M: 15.0,
      outputPer1M: 75.0,
    },
  },
};
```

Ensure `AiProvider` (and usage logging) accepts `bedrock` so pricing can be
resolved.

### IAM Permissions (SST)

Add to `sst.config.ts`:

```typescript
// Lambda permissions for Bedrock
{
  actions: ["bedrock:InvokeModel", "bedrock:InvokeModelWithResponseStream"],
  resources: ["arn:aws:bedrock:ca-central-1::foundation-model/*"],
}
```

Keep the IAM scope to `ca-central-1` only for this ticket.

---

## Part 2: Natural Language Data Query

### Problem Statement

Users need to extract insights from 20M+ historical rows across 60 sport organizations. Currently they must:

- Navigate complex filter UIs
- Understand data model relationships
- Build pivot tables manually
- Know which metrics exist and how to combine them

This creates a barrier for non-technical PSO staff and viaSport admins who need quick answers.

### Solution: "Ask AI" Natural Language Interface

Add an "Ask AI" input to the analytics page where users type questions in plain English. The LLM interprets the question, generates a structured query intent, and the system executes it safely through BI guardrails and org scoping.

### User Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│  1. User types: "How many athletes registered in 2023 by sport?"   │
│  2. System shows query preview:                                     │
│     ┌─────────────────────────────────────────────────────────────┐│
│     │ Query: Count registrations by sport for 2023                ││
│     │ Metrics: registration_count                                 ││
│     │ Dimensions: sport_name                                      ││
│     │ Filters: year = 2023                                        ││
│     │ [✓ Run Query] [Edit] [Cancel]                               ││
│     └─────────────────────────────────────────────────────────────┘│
│  3. User confirms, results displayed with suggested visualization  │
│  4. Option to save as dashboard widget or export                   │
└─────────────────────────────────────────────────────────────────────┘
```

### Technical Design

#### Semantic Layer (Query Catalog)

Reuse the existing BI semantic layer and guardrails to build the catalog that the
LLM can reference. Do not create a parallel catalog.

```typescript
// src/features/bi/nl-query/semantic-layer.ts
import { DATASETS } from "~/features/bi/semantic";
import { filterAccessibleFields } from "~/features/bi/governance";
import type { QueryContext } from "~/features/bi/bi.types";
import { getMetric } from "~/features/bi/semantic/metrics.config";

export interface SemanticMetric {
  id: string;
  name: string;
  description: string;
  aggregation: string;
  field: string;
  datasetId: string;
}

export interface SemanticDimension {
  id: string;
  name: string;
  description: string;
  field: string;
  datasetId: string;
  type: "string" | "number" | "date" | "datetime" | "boolean" | "enum" | "uuid";
  values?: string[];
}

export type SemanticCatalog = {
  datasets: Array<{
    id: string;
    name: string;
    description: string;
    metrics: SemanticMetric[];
    dimensions: SemanticDimension[];
  }>;
};

export const buildNlCatalog = (context: QueryContext): SemanticCatalog => {
  const datasets = Object.values(DATASETS);
  return {
    datasets: datasets.map((dataset) => {
      const fields = filterAccessibleFields(dataset.fields, context);
      const metrics = fields
        .filter((field) => field.allowAggregate)
        .map((field) => {
          const metric = getMetric(field.id);
          return {
            id: field.id,
            name: field.name,
            description: field.description ?? "",
            aggregation: metric?.aggregation ?? "count",
            field: field.sourceColumn,
            datasetId: dataset.id,
          };
        });
      const dimensions = fields
        .filter((field) => field.allowGroupBy && field.dataType !== "json")
        .map((field) => ({
          id: field.id,
          name: field.name,
          description: field.description ?? "",
          field: field.sourceColumn,
          datasetId: dataset.id,
          type: field.dataType,
          values: field.enumValues?.map((entry) => entry.value),
        }));

      return {
        id: dataset.id,
        name: dataset.name,
        description: dataset.description ?? "",
        metrics,
        dimensions,
      };
    }),
  };
};

export const buildCatalogPrompt = (catalog: SemanticCatalog) => {
  const metrics = catalog.datasets
    .flatMap((dataset) =>
      dataset.metrics.map(
        (metric) => `- [${dataset.id}] ${metric.id}: ${metric.description}`,
      ),
    )
    .join("\n");
  const dimensions = catalog.datasets
    .flatMap((dataset) =>
      dataset.dimensions.map(
        (dimension) =>
          `- [${dataset.id}] ${dimension.id}: ${dimension.description}`,
      ),
    )
    .join("\n");

  return { metrics, dimensions };
};
```

Catalog construction must mirror `getAvailableDatasets` and org-role checks so the
LLM only sees datasets and fields the user is allowed to query.

#### Query Intent Schema

```typescript
// src/features/bi/nl-query/nl-query.schemas.ts
import { z } from "zod";

export const queryIntentSchema = z.object({
  datasetId: z.string().min(1).describe("BI dataset id"),
  metrics: z.array(z.string()).min(1).describe("Metric IDs to calculate"),
  dimensions: z.array(z.string()).default([]).describe("Dimension IDs to group by"),
  filters: z
    .array(
      z.object({
        dimensionId: z.string(),
        operator: z.enum([
          "eq",
          "neq",
          "gt",
          "gte",
          "lt",
          "lte",
          "in",
          "contains",
        ]),
        value: z.union([z.string(), z.number(), z.array(z.string())]),
      }),
    )
    .default([])
    .describe("Filter conditions"),
  timeRange: z.object({
    start: z.string().optional(),
    end: z.string().optional(),
    preset: z.enum(["last_7_days", "last_30_days", "last_year", "ytd", "all_time"]).optional(),
  }).optional(),
  limit: z.number().min(1).max(10_000).default(1000),
  sort: z.object({
    field: z.string(),
    direction: z.enum(["asc", "desc"]),
  }).optional(),
  confidence: z.number().min(0).max(1).describe("Model confidence in interpretation"),
  explanation: z.string().describe("Plain language explanation of the query"),
});

export type QueryIntent = z.infer<typeof queryIntentSchema>;
```

Validate `datasetId`, `metrics`, `dimensions`, and `sort.field` against the
runtime catalog before execution (no implicit trust in model output).

#### NL Query Server Function

```typescript
// src/features/bi/nl-query/nl-query.mutations.ts
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getAuthMiddleware, requireUser } from "~/lib/server/auth";
import { assertFeatureEnabled } from "~/tenant/feature-gates";
import { queryIntentSchema } from "./nl-query.schemas";

const nlQueryInputSchema = z.object({
  question: z.string().min(1).max(500),
  organizationId: z.string().uuid().optional(),
  datasetId: z.string().optional(),
});

export const interpretNlQuery = createServerFn({ method: "POST" })
  .middleware(getAuthMiddleware())
  .inputValidator(nlQueryInputSchema.parse)
  .handler(async ({ data, context }) => {
    await assertFeatureEnabled("sin_nl_query");
    await assertFeatureEnabled("sin_analytics");
    const user = requireUser(context);

    const [{ runAiStructured }, { buildNlCatalog, buildCatalogPrompt }] =
      await Promise.all([import("~/lib/ai/ai.service"), import("./semantic-layer")]);
    const { buildQueryContext } = await import("~/features/bi/governance/query-context");
    const queryContext = await buildQueryContext({ context, userId: user.id });

    // Build prompt with semantic catalog context
    const catalogContext = buildCatalogPrompt(buildNlCatalog(queryContext));

    const result = await runAiStructured({
      promptKey: "nl-data-query",
      variables: {
        metrics: catalogContext.metrics,
        dimensions: catalogContext.dimensions,
        question: data.question,
      },
      outputSchema: queryIntentSchema,
      userId: user.id,
      organizationId: queryContext.organizationId ?? undefined,
      metadata: { feature: "nl-query", question: data.question },
    });

    return {
      intent: result.result,
      latencyMs: result.latencyMs,
    };
  });

export const executeNlQuery = createServerFn({ method: "POST" })
  .middleware(getAuthMiddleware())
  .inputValidator(z.object({
    intent: queryIntentSchema,
    organizationId: z.string().uuid().optional(),
  }).parse)
  .handler(async ({ data, context }) => {
    await assertFeatureEnabled("sin_nl_query");
    await assertFeatureEnabled("sin_analytics");
    const user = requireUser(context);

    const { executeQueryIntent } = await import("./query-executor");

    // Execute through BI guardrails (org scoping, role checks, row limits)
    const results = await executeQueryIntent(data.intent, {
      userId: user.id,
      organizationId: data.organizationId,
      context,
    });

    return {
      results,
      rowCount: results.length,
      suggestedVisualization: suggestVisualization(data.intent),
    };
  });
```

Extract a shared `buildQueryContext` helper from existing BI query code so NL query
uses the same org-role checks and permission set construction.

Use `serverOnly()` or dynamic imports for server-only modules (`~/lib/ai`,
`~/db`, permission services) to avoid client bundle pollution.

#### Query Executor (Reuse BI Engine)

```typescript
// src/features/bi/nl-query/query-executor.ts
import type { QueryIntent } from "./nl-query.schemas";
import { validateIntentAgainstCatalog } from "./query-validator";
import { translateIntentToPivotQuery } from "./intent-translator";

export async function executeQueryIntent(
  intent: QueryIntent,
  context: { userId: string; organizationId?: string; context: unknown }
) {
  // Validate all metric/dimension IDs exist in catalog (no injection)
  validateIntentAgainstCatalog(intent);

  // Translate to existing BI pivot/query engine to reuse guardrails + audit log
  const pivotQuery = translateIntentToPivotQuery(intent);
  const { executePivotQueryInternal } = await import(
    "~/features/bi/engine/pivot-runner"
  );
  const results = await executePivotQueryInternal({
    query: pivotQuery,
    context: context.context,
    userId: context.userId,
    organizationId: context.organizationId,
    source: "nl_query",
  });

  return results.rows;
}
```

Do not introduce a new raw SQL builder. NL query must reuse the existing BI SQL
compiler, guardrails, org scoping, and audit logging paths.

Intent validation must enforce dataset membership and field access using the
same permission checks as BI queries.

#### New Files

| File                                                        | Purpose                            |
| ----------------------------------------------------------- | ---------------------------------- |
| `src/features/bi/nl-query/semantic-layer.ts`                | Metric/dimension catalog           |
| `src/features/bi/nl-query/nl-query.schemas.ts`              | Zod schemas for query intent       |
| `src/features/bi/nl-query/nl-query.mutations.ts`            | Server functions                   |
| `src/features/bi/nl-query/query-executor.ts`                | Execute intent via BI engine       |
| `src/features/bi/nl-query/query-validator.ts`               | Intent validation                  |
| `src/features/bi/nl-query/intent-translator.ts`             | Intent → BI query translation      |
| `src/features/bi/nl-query/visualization-suggester.ts`       | Chart type suggestions             |
| `src/features/bi/nl-query/nl-query-audit.ts`                | NL query audit logger              |
| `src/features/bi/governance/query-context.ts`               | Shared BI query context builder    |
| `src/features/bi/engine/pivot-runner.ts`                    | Shared pivot executor for NL query |
| `src/features/bi/nl-query/components/nl-query-input.tsx`    | Search input UI                    |
| `src/features/bi/nl-query/components/query-preview.tsx`     | Preview/confirm dialog             |
| `src/features/bi/nl-query/components/query-results.tsx`     | Results display                    |
| `src/features/bi/nl-query/__tests__/semantic-layer.test.ts` | Catalog tests                      |
| `src/features/bi/nl-query/__tests__/query-executor.test.ts` | Executor tests                     |
| `src/db/migrations/xxxx_bi_nl_query_log.sql`                | NL query audit log table           |

#### Modified Files

| File                                               | Changes                                     |
| -------------------------------------------------- | ------------------------------------------- |
| `src/routes/dashboard/analytics/index.tsx`         | Add NL query input                          |
| `src/features/bi/components/analytics-toolbar.tsx` | Add "Ask AI" button                         |
| `src/tenant/tenants/viasport.ts`                   | Add `sin_nl_query` feature flag             |
| `src/tenant/tenant.types.ts`                       | Add `sin_nl_query` feature key              |
| `src/tenant/tenants/qc.ts`                         | Default `sin_nl_query` to false             |
| `src/db/schema/bi.schema.ts`                       | Add `bi_nl_query_log` table                 |
| `src/features/bi/bi.queries.ts`                    | Extract shared query context + pivot runner |
| `src/lib/env.server.ts`                            | Allow `bedrock` provider + `AWS_REGION`     |
| `src/lib/ai/ai.types.ts`                           | Extend `AiProvider` with `bedrock`          |
| `src/lib/ai/ai.config.ts`                          | Bedrock provider config                     |
| `src/lib/ai/ai.registry.ts`                        | Bedrock adapter wiring                      |
| `src/lib/ai/ai.costs.ts`                           | Bedrock pricing defaults                    |

### UI Components

#### NL Query Input

```tsx
// src/features/bi/nl-query/components/nl-query-input.tsx
export function NlQueryInput({ onQuery }: { onQuery: (intent: QueryIntent) => void }) {
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<QueryIntent | null>(null);

  const handleSubmit = async () => {
    setIsLoading(true);
    const result = await interpretNlQuery({ data: { question } });
    setPreview(result.intent);
    setIsLoading(false);
  };

  return (
    <div className="relative">
      <Input
        placeholder="Ask a question about your data..."
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        className="pr-20"
      />
      <Button
        size="sm"
        onClick={handleSubmit}
        disabled={isLoading || !question.trim()}
        className="absolute right-1 top-1"
      >
        {isLoading ? <Spinner /> : <SparklesIcon />}
        Ask AI
      </Button>

      {preview && (
        <QueryPreviewDialog
          intent={preview}
          onConfirm={() => onQuery(preview)}
          onEdit={() => {/* open editor */}}
          onCancel={() => setPreview(null)}
        />
      )}
    </div>
  );
}
```

#### Query Preview Dialog

```tsx
// src/features/bi/nl-query/components/query-preview.tsx
export function QueryPreviewDialog({ intent, onConfirm, onEdit, onCancel }) {
  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Query Preview</DialogTitle>
          <DialogDescription>
            Review the interpreted query before running
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Interpretation</Label>
            <p className="text-sm text-muted-foreground">{intent.explanation}</p>
          </div>

          <div>
            <Label>Dataset</Label>
            <p className="text-sm">{intent.datasetId}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Metrics</Label>
              <ul className="text-sm">
                {intent.metrics.map((m) => <li key={m}>{m}</li>)}
              </ul>
            </div>
            <div>
              <Label>Group By</Label>
              <ul className="text-sm">
                {intent.dimensions.map((d) => <li key={d}>{d}</li>)}
              </ul>
            </div>
          </div>

          {intent.filters.length > 0 && (
            <div>
              <Label>Filters</Label>
              <ul className="text-sm">
                {intent.filters.map((f, i) => (
                  <li key={i}>{f.dimensionId} {f.operator} {f.value}</li>
                ))}
              </ul>
            </div>
          )}

          <ConfidenceBadge confidence={intent.confidence} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button variant="outline" onClick={onEdit}>Edit</Button>
          <Button onClick={onConfirm}>
            <PlayIcon className="mr-2 h-4 w-4" />
            Run Query
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### Prompt Template

Create a database prompt template for the NL query feature:

```typescript
// scripts/seed-ai-prompts.ts additions
{
  key: "nl-data-query",
  name: "Natural Language Data Query",
  description: "Interprets natural language questions into structured query intents",
  audiences: ["analytics", "reporting"],
  systemPrompt: `You are a data query assistant for a sports organization management platform called Solstice.

Given a user's natural language question about sports data, interpret their intent and produce a structured query specification.

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
8. For time-based questions, use the timeRange field with appropriate presets`,
  userPrompt: `User question: "{{question}}"

Interpret this question and return a structured query intent.`,
  variables: ["metrics", "dimensions", "question"],
  model: "claude-opus",
  temperature: 0.3,
  maxTokens: 1000,
}
```

### Responsible AI Considerations

| Consideration                | Implementation                                              |
| ---------------------------- | ----------------------------------------------------------- |
| **Preview before execution** | User must confirm query intent before running               |
| **No raw SQL**               | Query builder only allows catalog-defined fields            |
| **Org scoping**              | BI guardrails enforce org access and role permissions       |
| **Audit logging**            | Log to `bi_nl_query_log` with tamper-evident checksum chain |
| **Confidence signals**       | Low-confidence interpretations flagged clearly              |
| **Rate limiting**            | AI queries subject to existing quotas                       |
| **No PII in prompts**        | Only schema metadata sent to LLM, not actual data           |

### Security Measures

1. **Semantic catalog whitelist**: Only catalog-defined metrics/dimensions can be queried
2. **Parameterized queries**: Filter values are parameterized, never interpolated
3. **Query timeout**: 30-second timeout prevents runaway queries
4. **Row limit**: Maximum 10,000 rows returned
5. **BI guardrails**: Reuse BI executor with `SET LOCAL ROLE bi_readonly` and
   `app.org_id`/`app.is_global_admin` scoping
6. **Concurrency limits**: Reuse BI concurrency guardrails for NL query execution
7. **No schema exposure**: LLM only sees abstracted metric/dimension names

### NL Query Audit Logging

Create a dedicated `bi_nl_query_log` table that follows the same tamper-evident
chain pattern as `bi_query_log` (see `src/features/bi/governance/audit-logger.ts`).
Log both interpretation and execution events so the chain is complete.

Suggested fields:

- `id`, `user_id`, `organization_id`, `dataset_id`
- `question`, `intent` (jsonb), `confidence`, `approved` (bool)
- `stage` (`interpret` | `execute` | `error`)
- `provider`, `model`, `latency_ms`, `execution_time_ms`, `rows_returned`
- `query_hash`, `previous_log_id`, `checksum`, `created_at`, `error_message`

Implement a `nl-query-audit.ts` logger that mirrors `logQuery` and writes to the
new table with the same HMAC checksum chaining.

---

## Implementation Plan

### Phase 1: Bedrock Adapter (2-3 days)

- [x] Add `@aws-sdk/client-bedrock-runtime` dependency
- [x] Implement `BedrockTextAdapter` class
- [x] Add stream event conversion
- [x] Add tool conversion for structured output
- [x] Restrict AI provider to Bedrock only (remove OpenAI/Anthropic config)
- [x] Add `bedrock` to `AiProvider` types and env schema (`AWS_REGION`, `AI_EMBED_MODEL`)
- [x] Update `ai.config.ts` and `ai.registry.ts` for Bedrock-only wiring
- [x] Add Bedrock pricing to `ai.costs.ts`
- [x] Add Cohere Embed v4 embedding support via Bedrock
- [x] Add IAM permissions to `sst.config.ts`
- [x] Unit tests for adapter (stream + structured output)
- [x] Integration test with live Bedrock call

### Phase 2: Semantic Layer (1 day)

- [x] Build catalog from existing BI semantic configs (`DATASETS`, `metrics.config.ts`)
- [x] Implement catalog validation functions against BI fields + permissions
- [x] Create catalog prompt builder (`metrics`/`dimensions` strings)
- [x] Unit tests for catalog

### Phase 3: NL Query Backend (1-2 days)

- [x] Implement `interpretNlQuery` server function
- [x] Implement `executeNlQuery` server function
- [x] Extract shared BI query context builder + pivot runner for reuse
- [x] Translate intent → pivot query (no raw SQL)
- [x] Add query validation against catalog
- [x] Implement visualization suggester
- [x] Seed NL query prompt template
- [x] Add `bi_nl_query_log` table + audit logger with checksum chain
- [x] Unit tests for query executor

### Phase 4: NL Query UI (1-2 days)

- [x] Create `NlQueryInput` component
- [x] Create `QueryPreviewDialog` component
- [x] Create `QueryResults` component
- [x] Add to analytics page
- [x] Add feature flag `sin_nl_query`
- [x] E2E test for full flow

---

## Rollout Status

- [x] Feature flag enabled for viaSport (sin) tenant only.
- [x] sin-dev deployed with AI text/embedding defaults (Claude Opus + Cohere
      Embed v4).
- [x] sin-uat deployed with AI text/embedding defaults (Claude Opus + Cohere
      Embed v4).
- [ ] sin-prod rollout pending.

---

## Testing Strategy

### Unit Tests

- [ ] Bedrock adapter stream conversion
- [ ] Bedrock structured output parsing
- [x] Semantic catalog builder (BI reuse)
- [x] Query intent validation (dataset/field/sort)
- [x] Intent → pivot translation
- [ ] BI guardrail application (org scoping + limits)
- [ ] NL query audit log checksum chain

### Integration Tests

- [ ] Bedrock adapter with live API (ca-central-1)
- [ ] Full NL query flow (interpret → preview → execute)
- [ ] Query with various filter combinations
- [ ] Error handling for invalid questions
- [ ] NL query audit log entries created

### E2E Tests

- [x] User asks question → sees preview → confirms → sees results
- [x] Low confidence warning displayed
- [ ] Query results match expected visualization
- [ ] Rate limiting applies to NL queries

---

## Success Metrics

| Metric                           | Target                              |
| -------------------------------- | ----------------------------------- |
| Bedrock adapter latency          | <3s for typical query               |
| NL query interpretation accuracy | >80% correct intent                 |
| User confirmation rate           | >70% run without editing            |
| Feature adoption                 | 20% of analytics users try NL query |
| Cost per query                   | <$0.05 average                      |

---

## Risks and Mitigations

| Risk                                                | Mitigation                                                        |
| --------------------------------------------------- | ----------------------------------------------------------------- |
| Bedrock API differences vs upstream models          | Comprehensive adapter tests; live Bedrock smoke tests             |
| Embed v4 inference profile required in ca-central-1 | Configure `AI_EMBED_MODEL` per env                                |
| Incorrect query interpretations                     | Preview/confirm gate; confidence scoring; low-confidence warnings |
| SQL injection via LLM output                        | Strict catalog whitelist; reuse BI SQL compiler; no raw SQL       |
| Query performance on large datasets                 | Row limits; query timeout; BI guardrails + concurrency caps       |
| Cost overruns                                       | Existing quota system; per-tenant limits                          |

---

## Future Enhancements (Phase 2)

- Multi-turn follow-ups ("Now compare to 2022")
- Save query as reusable report
- Auto-generated narrative summary of results
- Query history and favorites
- Suggested questions based on data patterns
- Cross-region inference profiles for lower latency

---

## References

- AWS Bedrock Converse API: https://docs.aws.amazon.com/bedrock/latest/APIReference/API_runtime_ConverseStream.html
- AWS Bedrock Cohere Embed v4 params: https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-embed-v4.html
- AWS What's New (Cohere Embed v4): https://aws.amazon.com/about-aws/whats-new/2025/10/coheres-embed-v4-multimodal-embeddings-bedrock/
- TanStack AI adapter pattern: `~/dev/_libraries/ai/packages/*/src/`
- Existing AI service: `src/lib/ai/ai.service.ts`
- Analytics infrastructure: `src/features/bi/`
- RFP requirements: RP-AGG-005 (Self-Service Analytics)
