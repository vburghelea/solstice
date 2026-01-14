import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getAuthMiddleware, requireUser } from "~/lib/server/auth";
import { assertFeatureEnabled } from "~/tenant/feature-gates";
import type { PivotResult } from "~/features/bi/bi.schemas";
import { queryIntentSchema } from "./nl-query.schemas";
import type { SemanticCatalog } from "./semantic-layer";

const nlQueryInputSchema = z.object({
  question: z.string().min(1).max(500),
  organizationId: z.string().uuid().optional(),
  datasetId: z.string().optional(),
});

const formatPivotResults = (
  pivot: PivotResult,
  catalog: SemanticCatalog,
  datasetId: string,
) => {
  const dataset = catalog.datasets.find((entry) => entry.id === datasetId);
  const dimensionLabels = new Map(
    dataset?.dimensions.map((dimension) => [dimension.id, dimension.name]) ?? [],
  );
  const measureLabels = new Map(
    pivot.measures.map((measure) => [measure.key, measure.label]),
  );
  const includeColumnLabels = pivot.columnKeys.length > 1;

  return pivot.rows.map((row) => {
    const record: Record<string, string | number | null> = {};

    for (const [key, value] of Object.entries(row.values)) {
      record[dimensionLabels.get(key) ?? key] = value;
    }

    for (const columnKey of pivot.columnKeys) {
      const cell = row.cells[columnKey.key] ?? {};
      const columnPrefix = includeColumnLabels ? columnKey.label : null;

      for (const [measureKey, value] of Object.entries(cell)) {
        const measureLabel = measureLabels.get(measureKey) ?? measureKey;
        const header = columnPrefix ? `${columnPrefix} ${measureLabel}` : measureLabel;
        record[header] = value ?? null;
      }
    }

    return record;
  });
};

export const interpretNlQuery = createServerFn({ method: "POST" })
  .middleware(getAuthMiddleware())
  .inputValidator(nlQueryInputSchema.parse)
  .handler(async ({ data, context }) => {
    await assertFeatureEnabled("sin_nl_query");
    await assertFeatureEnabled("sin_analytics");
    const user = requireUser(context);

    const { buildQueryContext } = await import("../governance/query-context");
    const { buildCatalogPrompt, buildNlCatalog } = await import("./semantic-layer");
    const { validateCatalogSelection } = await import("./query-validator");
    const { runAiStructured } = await import("~/lib/ai/ai.service");
    const { getAiTextDefaults, getAiTextProviderConfig } =
      await import("~/lib/ai/ai.config");
    const { logNlQueryEvent } = await import("./nl-query-audit");

    const { queryContext } = await buildQueryContext({
      context,
      userId: user.id,
    });

    try {
      const catalog = buildNlCatalog(queryContext);
      const catalogContext = buildCatalogPrompt(catalog);

      const result = await runAiStructured({
        promptKey: "nl-data-query",
        variables: {
          metrics: catalogContext.metrics,
          dimensions: catalogContext.dimensions,
          question: data.question,
        },
        outputSchema: queryIntentSchema,
        userId: user.id,
        organizationId: queryContext.organizationId ?? null,
        metadata: { feature: "nl-query", question: data.question },
      });
      const intent = queryIntentSchema.parse(result.result);

      const validation = validateCatalogSelection(catalog, {
        datasetId: intent.datasetId,
        metrics: intent.metrics,
        dimensions: intent.dimensions,
        filterDimensions: intent.filters.map((filter) => filter.dimensionId),
        sortField: intent.sort?.field ?? null,
      });

      if (!validation.ok) {
        const { badRequest } = await import("~/lib/server/errors");
        throw badRequest(validation.errors.join(" "));
      }

      const providerConfig = getAiTextProviderConfig();
      const defaults = getAiTextDefaults();

      await logNlQueryEvent({
        context: queryContext,
        stage: "interpret",
        question: data.question,
        intent,
        confidence: intent.confidence,
        approved: false,
        provider: providerConfig.provider,
        model: defaults.model,
        latencyMs: result.latencyMs,
      });

      return {
        intent,
        latencyMs: result.latencyMs,
      };
    } catch (error) {
      await logNlQueryEvent({
        context: queryContext,
        stage: "error",
        question: data.question,
        errorMessage: error instanceof Error ? error.message : "NL query failed",
      });
      throw error;
    }
  });

export const executeNlQuery = createServerFn({ method: "POST" })
  .middleware(getAuthMiddleware())
  .inputValidator(
    z.object({
      intent: queryIntentSchema,
      organizationId: z.string().uuid().optional(),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    await assertFeatureEnabled("sin_nl_query");
    await assertFeatureEnabled("sin_analytics");
    const user = requireUser(context);

    const { buildQueryContext } = await import("../governance/query-context");
    const { buildNlCatalog } = await import("./semantic-layer");
    const { executeQueryIntent } = await import("./query-executor");
    const { logNlQueryEvent } = await import("./nl-query-audit");
    const { suggestVisualization } = await import("./visualization-suggester");

    const { queryContext } = await buildQueryContext({
      context,
      userId: user.id,
    });
    const catalog = buildNlCatalog(queryContext);

    try {
      const result = await executeQueryIntent(data.intent, {
        context,
        userId: user.id,
        organizationId: data.organizationId ?? null,
        queryContext,
        catalog,
      });

      const suggestion = suggestVisualization(data.intent, catalog);
      const results = formatPivotResults(result.pivot, catalog, data.intent.datasetId);

      await logNlQueryEvent({
        context: queryContext,
        stage: "execute",
        intent: data.intent,
        confidence: data.intent.confidence,
        approved: true,
        executionTimeMs: result.executionTimeMs,
        rowsReturned: result.rowCount,
      });

      return {
        results,
        rowCount: results.length,
        suggestedVisualization: suggestion,
      };
    } catch (error) {
      await logNlQueryEvent({
        context: queryContext,
        stage: "error",
        intent: data.intent,
        errorMessage: error instanceof Error ? error.message : "NL query failed",
      });
      throw error;
    }
  });
