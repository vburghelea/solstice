import type { QueryContext } from "../bi.types";
import type { QueryIntent } from "./nl-query.schemas";
import { translateIntentToPivotQuery } from "./intent-translator";
import { validateCatalogSelection } from "./query-validator";
import { buildNlCatalog, type SemanticCatalog } from "./semantic-layer";

export type ExecuteQueryIntentParams = {
  context: unknown;
  userId: string;
  organizationId?: string | null;
  queryContext?: QueryContext;
  catalog?: SemanticCatalog;
};

export const executeQueryIntent = async (
  intent: QueryIntent,
  params: ExecuteQueryIntentParams,
) => {
  const queryContext =
    params.queryContext ??
    (
      await (
        await import("../governance/query-context")
      ).buildQueryContext({
        context: params.context,
        userId: params.userId,
      })
    ).queryContext;

  const catalog = params.catalog ?? buildNlCatalog(queryContext);
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

  const pivotQuery = translateIntentToPivotQuery(
    intent,
    catalog,
    params.organizationId ?? queryContext.organizationId,
  );

  const { executePivotQueryInternal } = await import("~/features/bi/engine/pivot-runner");
  const result = await executePivotQueryInternal({
    query: pivotQuery,
    context: params.context,
    userId: params.userId,
    source: "nl_query",
  });

  return {
    pivot: result.pivot,
    rowCount: result.rowCount,
    executionTimeMs: result.executionTimeMs,
    queryContext,
    catalog,
  };
};
