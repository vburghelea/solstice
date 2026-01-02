<taskname="BI Platform Evaluation"/>

# BI Platform Evaluation Prompt

You are evaluating the Solstice BI feature for viaSport's Strength in Numbers (SIN)
system. This is a governed data explorer + reporting tool and a fully featured BI
platform intended to be competitive with Tableau/PowerBI. Use the docs and code
excerpts below.

## Goals

- Verify SIN requirements coverage for analytics, governance, audit, dashboards, and accessibility.
- Cross-check upgrade plan + worklog claims against the implementation.
- Identify gaps, risks, regressions (security, data leakage, performance, UX).
- Provide prioritized recommendations.

## Expected Output

1. Executive assessment (readiness + positioning fit).
2. Requirements coverage table (Req ID -> status + evidence).
3. Gaps/risks (P0/P1/P2) with evidence.
4. Plan/worklog alignment (done vs missing; mismatches).
5. Recommendations (short-term, medium-term).
6. Open questions/assumptions.

## SIN requirements addendum (relevant excerpts)

From `docs/sin-rfp/source/VIASPORT-PROVIDED-system-requirements-addendum.md`:

- DM-AGG-003 Data Governance & Access Control: enforce role-based data access and provide
  secure database access with data cataloging/indexing.
  - Acceptance: users can only access data based on permission.
- RP-AGG-003 Reporting Flow & Support: automated reminders, track resubmissions, and
  visualize data via dashboards.
  - Acceptance: users are reminded, track changes, and view data in a dashboard format.
- RP-AGG-005 Self-Service Analytics & Data Export: authorized users build ad-hoc charts,
  pivots, and export CSV/Excel/JSON; export respects field-level access rules.
  - Acceptance: user builds a custom chart and exports underlying dataset to CSVs with
    field-level access rules honored.
- SEC-AGG-004 Audit Trail & Data Lineage: immutable audit log with filtering/export and
  tamper-evident hashing.
- UI-AGG-002 Personalized Dashboard: role-based dashboards.
- UI-AGG-003 Responsive and Inclusive Design: responsive UI with accessibility support.
- UI-AGG-005 Content Navigation & Interaction: robust search and filtering.

## Upgrade plan (relevant excerpts)

From `src/features/bi/docs/UPGRADE-PLAN-bi-platform.md`:

- Positioning: "Governed Data Explorer + Reporting + Full BI Platform" (competitive
  with Tableau/PowerBI).
- Decisions: SQL pushdown for pivots, per-dataset dashboard filters, keep
  echarts-for-react with ChartWrapper abstraction.
- Workstreams 0-6: Correctness, Performance, Semantic Layer, Fast Feedback, Chart Config,
  Dashboards, Hardening.
- Definition of Done: < 5 min to first chart; dashboards performant; exports honor ACLs
  and are audited; data definitions visible; global admins can access; 8-12 widgets
  performant.

## Worklog (relevant excerpts)

From `src/features/bi/docs/WORKLOG-bi-upgrade.md`:

- All workstreams marked complete, tests run (`pnpm check-types`, `pnpm lint`,
  `pnpm test src/features/bi`).
- UI verification via Playwright for Explore + Catalog.
- Post-review fixes (2026-01-02, 1:53pm) include:
  - Masked dimensions compile to constants in SQL pushdown.
  - Time-grain derived fields for date/datetime.
  - Guardrail caps enforce error instead of silent truncation.
  - Concurrency slots for pivot queries; SQL fallback scoped to missing-view errors.
  - Filter value suggestions endpoint + dashboard filter typeahead.
  - Pivot cache LRU eviction + dataset-indexed invalidation.
  - Multi-measure stability via measure IDs; strict TS cleanups.

## Old assessment (relevant excerpts)

From `src/features/bi/docs/ASSESSMENT-bi-ux-product-review.md`:

- Executive summary: governed data access layer; target is full BI parity, current
  ~30-35 percent.
- Strengths: clean UI, governance/ACL, SQL workbench, schema browser, query history.
- Weaknesses: limited feedback loop, dead-end empty states, limited interactivity,
  weak dashboards/filters.
- Positioning recommendation: "Governed Data Explorer + Reporting + Full BI Platform",
  with current gaps called out.

## Recent changes to validate

- Field value suggestions endpoint: org-scoped, ACL/masking-aware, top values via SQL.
- Filter widget typeahead: search, top values list, manual entry fallback.
- Pivot cache: LRU eviction, max entries, periodic sweep, dataset invalidation.
- Measure IDs: stable IDs for multi-measure across save/edit flows.
- Time-grain derived fields: omit undefined optional fields, typed derived column selection.

## Code excerpts (important parts only)

Note: Ellipses (`...`) indicate omitted lines for brevity.

### Schemas + widget config

```ts
// src/features/bi/bi.schemas.ts
export const filterSchema = z.object({
  field: z.string().min(1),
  datasetId: z.string().optional(),
  operator: filterOperatorSchema,
  value: filterValueSchema.optional(),
  label: z.string().optional(),
});

export const fieldValueSuggestionsSchema = z.object({
  datasetId: z.string().min(1),
  fieldId: z.string().min(1),
  organizationId: z.uuid().optional(),
  search: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(25),
  filters: z.array(filterSchema).default([]),
});

export const pivotMeasureSchema = z.object({
  id: z.string().min(1).optional(),
  field: z.string().min(1).nullable().optional(),
  metricId: z.string().min(1).optional(),
  aggregation: aggregationTypeSchema,
  label: z.string().optional(),
});

export const pivotQuerySchema = z.object({
  datasetId: z.string().min(1),
  organizationId: z.uuid().optional(),
  rows: z.array(z.string()).default([]),
  columns: z.array(z.string()).default([]),
  measures: z.array(pivotMeasureSchema).min(1),
  filters: z.array(filterSchema).default([]),
  limit: z.number().int().min(1).max(10000).default(1000),
});
```

```ts
// src/features/bi/bi.types.ts
export interface WidgetConfig {
  title?: string;
  subtitle?: string;
  chartType?: ChartType;
  chartOptions?: ChartOptions;
  query?: PivotQuery;
  kpiField?: string;
  kpiAggregation?: AggregationType;
  kpiFormat?: FormatOptions;
  textContent?: string;
  textFormat?: "plain" | "markdown";
  filterDatasetId?: string;
  filterField?: string;
  filterType?: "select" | "date_range" | "search";
  filterOperator?: FilterOperator;
}
```

### Field value suggestions (server)

```ts
// src/features/bi/bi.queries.ts
export const getFieldValueSuggestions = createServerFn({ method: "GET" })
  .middleware(getAuthMiddleware())
  .inputValidator(fieldValueSuggestionsSchema.parse)
  .handler(async ({ data, context }) => {
    await assertFeatureEnabled("sin_analytics");
    const user = requireUser(context);
    const dataset = getDataset(data.datasetId);
    ...
    const scopedFilters = (data.filters ?? []).filter(
      (filter) => !filter.datasetId || filter.datasetId === dataset.id,
    );
    const scopedOrganizationId = ensureOrgScope(...).scopedOrganizationId ?? null;

    const queryContext: QueryContext = { ... };
    const accessibleFields = filterAccessibleFields(dataset.fields, queryContext);
    const targetField = accessibleFields.find((field) => field.id === data.fieldId);
    if (!targetField || !targetField.allowFilter || targetField.dataType === "json") {
      return { values: [] };
    }

    const fieldsToMask = getFieldsToMask(accessibleFields, queryContext);
    if (fieldsToMask.includes(targetField.id)) return { values: [] };

    const allowedFilters = buildAllowedFilters(dataset);
    const normalizedFilters = ...normalizeFilter...

    if (dataset.requiresOrgScope && scopedOrganizationId) {
      normalizedFilters.push({
        field: dataset.orgScopeColumn ?? "organizationId",
        operator: "eq",
        value: scopedOrganizationId,
      });
    }

    const fieldExpr = buildFieldExpression(dataset, targetField.id);
    const whereConditions = normalizedFilters.map((filter) =>
      buildFilterExpression(filter, dataset),
    );
    if (search) {
      whereConditions.push(
        sql`CAST(${fieldExpr} AS TEXT) ILIKE ${sql.param(`%${search}%`)}`,
      );
    }

    const MAX_SUGGESTIONS = 50;
    const limit = Math.min(data.limit ?? 25, MAX_SUGGESTIONS);

    return tx.execute(sql`
      SELECT ${fieldExpr} AS value, COUNT(*) AS count
      FROM ${sql.raw(`${viewName} AS ${baseAlias}`)}
      ${whereClause}
      GROUP BY ${fieldExpr}
      ORDER BY count DESC
      LIMIT ${sql.param(limit)}
    `);
  });
```

### Filter widget suggestions UI

```tsx
// src/features/bi/components/dashboard/FilterWidget.tsx
const suggestionQuery = useQuery({
  queryKey: [
    "bi-field-suggestions",
    datasetId,
    fieldId,
    debouncedSearch,
    suggestionFilters,
  ],
  queryFn: () =>
    getFieldValueSuggestions({
      data: {
        datasetId: datasetId ?? "",
        fieldId,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        filters: suggestionFilters,
        limit: 25,
      },
    }),
  enabled:
    filterType === "select" &&
    Boolean(fieldId) &&
    Boolean(datasetId) &&
    enumValues.length === 0 &&
    !disabled,
  staleTime: 60_000,
});

...
<div className="space-y-2 rounded-md border bg-muted/20 p-2">
  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
    Top values
  </p>
  {suggestionValues.map((entry) => (
    <label key={String(entry.value)} className="flex items-center gap-2 text-sm">
      <Checkbox ... />
      <span>{formatDimensionValue(entry.value, field)}</span>
      <span className="ml-auto text-[11px] text-muted-foreground">
        {entry.count}
      </span>
    </label>
  ))}
</div>
<Label className="text-xs" htmlFor={valuesInputId}>
  Other values (comma-separated)
</Label>
<Input ... onChange={(event) => updateValue(event.target.value.split(",") ...)} />
```

### Filter widget uses global filters as context

```tsx
// src/features/bi/components/dashboard/DashboardWidget.tsx
{widget.widgetType === "filter" ? (
  <FilterWidget
    config={config}
    {...(filterField ? { field: filterField } : {})}
    value={filterValue}
    filters={globalFilters}
    onChange={(next) =>
      onFilterChange?.(next, {
        field: filterFieldId ?? "",
        ...(filterDatasetId ? { datasetId: filterDatasetId } : {}),
      })
    }
    disabled={editable}
  />
) : ...}
```

### Pivot cache (LRU + dataset invalidation)

```ts
// src/features/bi/cache/pivot-cache.ts
const CACHE_TTL_MS = 60_000;
const MAX_ENTRIES = 200;
const SWEEP_INTERVAL_MS = 60_000;
const pivotCache = new Map<string, PivotCacheEntry>();
const datasetIndex = new Map<string, Set<string>>();

const touchEntry = (key: string, entry: PivotCacheEntry) => {
  entry.lastAccessedAt = Date.now();
  pivotCache.delete(key);
  pivotCache.set(key, entry);
};

const enforceMaxEntries = () => {
  while (pivotCache.size > MAX_ENTRIES) {
    const oldestKey = pivotCache.keys().next().value as string | undefined;
    if (!oldestKey) return;
    removeEntry(oldestKey);
  }
};

export const setPivotCache = (
  key: string,
  value: { datasetId: string; pivot: PivotResult; rowCount: number },
  ttlMs: number = CACHE_TTL_MS,
) => {
  ...
  const keys = datasetIndex.get(value.datasetId) ?? new Set<string>();
  keys.add(key);
  datasetIndex.set(value.datasetId, keys);
  pruneCache();
};
```

```ts
// src/features/bi/bi.queries.ts
setPivotCache(cacheKey, {
  datasetId: dataset.id,
  pivot: pivotResult,
  rowCount: rowsReturned,
});
```

### Measure IDs preserved across save/edit

```ts
// src/features/bi/utils/measure-utils.ts
export const createMeasureId = (seed?: string) => {
  if (seed) return `metric:${seed}`;
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return fallbackId();
};

export const ensureMeasureId = (
  measure: PivotMeasure,
): PivotMeasure & { id: string } => ({
  ...measure,
  id: measure.id ?? createMeasureId(measure.metricId),
});
```

```tsx
// src/features/bi/components/pivot-builder/SaveToDashboardDialog.tsx
const query = {
  datasetId,
  rows,
  columns,
  measures: measures.map((m) => ({
    ...(m.id ? { id: m.id } : {}),
    field: m.field as string | null,
    aggregation: m.aggregation,
    ...(m.metricId ? { metricId: m.metricId } : {}),
    ...(m.label ? { label: m.label } : {}),
  })),
  filters,
  limit: 1000,
};
```

```tsx
// src/features/bi/components/dashboard/EditWidgetDialog.tsx
const normalizedMeasures = (q?.measures ?? []).map((m) => {
  const normalized = ensureMeasureId({
    id: m.id,
    field: m.field ?? null,
    aggregation: m.aggregation,
    ...(m.metricId ? { metricId: m.metricId } : {}),
    ...(m.label ? { label: m.label } : {}),
  });
  return {
    id: normalized.id,
    field: normalized.field ?? null,
    aggregation: normalized.aggregation,
    ...(normalized.metricId ? { metricId: normalized.metricId } : {}),
    ...(normalized.label ? { label: normalized.label } : {}),
  };
});
```

### Time-grain derived fields + typed selection

```ts
// src/features/bi/semantic/datasets.config.ts
const buildTimeGrainFields = (field: DatasetField): DatasetField[] => {
  if (!field.allowGroupBy) return [];
  return timeGrainsForField(field).map((grain) => ({
    id: `${field.id}${capitalize(grain)}`,
    name: `${field.name} (${capitalize(grain)})`,
    description: `${field.description ?? field.name} grouped by ${grain}.`,
    sourceColumn: field.sourceColumn,
    dataType: "date",
    formatType: "date",
    allowGroupBy: true,
    allowFilter: false,
    allowSort: true,
    allowAggregate: false,
    derivedFrom: field.id,
    timeGrain: grain,
    ...(field.piiClassification ? { piiClassification: field.piiClassification } : {}),
    ...(field.requiredPermission ? { requiredPermission: field.requiredPermission } : {}),
  }));
};
```

```ts
// src/features/bi/bi.data.ts
const attachDerivedColumns = <T extends Record<string, unknown>>(columnMap: T) => {
  const resolved = { ...columnMap } as Record<string, T[keyof T]>;
  for (const field of dataset?.fields ?? []) {
    if (!field.derivedFrom) continue;
    if (field.derivedFrom in columnMap) {
      resolved[field.id] = columnMap[field.derivedFrom] as T[keyof T];
    }
  }
  return resolved;
};

type ColumnValue = (typeof columnMap)[keyof typeof columnMap];
const resolvedColumns = attachDerivedColumns(columnMap) as Record<string, ColumnValue>;
const selection = Object.fromEntries(
  params.columns.map((column) => [column, resolvedColumns[column]]),
) as Record<string, ColumnValue>;
```

### SQL pushdown, guardrails, and governance

```ts
// src/features/bi/engine/pivot-sql-compiler.ts
const rowDimensions = params.rowFields.map((fieldId, index) => ({
  fieldId,
  alias: `r${index}`,
  column: resolveFieldColumn(params.dataset, fieldId),
  isMasked: maskedFieldIds.has(fieldId),
}));

for (const dimension of [...rowDimensions, ...columnDimensions]) {
  const expression = dimension.isMasked
    ? sql.param("***")
    : buildFieldExpression(params.dataset, dimension.fieldId);
  selectChunks.push(
    sql`${expression} AS ${sql.raw(quoteIdentifier(dimension.alias))}`,
  );
}

const groupByExpressions = [...rowDimensions, ...columnDimensions]
  .filter((dim) => !dim.isMasked)
  .map((dim) => buildFieldExpression(params.dataset, dim.fieldId));
```

```ts
// src/features/bi/governance/query-guardrails.ts
export const QUERY_GUARDRAILS = {
  statementTimeoutMs: 30000,
  maxRowsUi: 10000,
  maxRowsExport: 100000,
  maxEstimatedCost: 100000,
  maxConcurrentPerUser: 2,
  maxConcurrentPerOrg: 5,
  maxPivotRows: 500,
  maxPivotColumns: 50,
  maxPivotCells: 25000,
} as const;

export const assertPivotCardinality = (rowCount: number, columnCount: number) => {
  if (rowCount > QUERY_GUARDRAILS.maxPivotRows) {
    throw new Error("Too many row categories; add filters or fewer dimensions.");
  }
  if (columnCount > QUERY_GUARDRAILS.maxPivotColumns) {
    throw new Error("Too many column categories; add filters or fewer dimensions.");
  }
  if (rowCount * columnCount > QUERY_GUARDRAILS.maxPivotCells) {
    throw new Error("Too many categories; add filters or fewer dimensions.");
  }
};
```

```ts
// src/features/bi/governance/field-acl.ts
export function checkFieldAccess(
  field: DatasetField,
  context: QueryContext,
  isExport: boolean = false,
): FieldAccessResult {
  ...
  if (isPii && (!canViewPii || (isExport && !context.hasRecentAuth))) {
    return { canAccess: true, isPii: true, shouldMask: true, reason: "PII field masked" };
  }
  return { canAccess: true, isPii, shouldMask: false, reason: "Field access granted" };
}
```

```ts
// src/features/bi/governance/audit-logger.ts
export async function logQuery(params: LogQueryParams): Promise<string> {
  ...
  const queryHash = await computeQueryHash(
    sqlQuery ?? pivotQuery ?? `${queryType}:${datasetId ?? "unknown"}`,
  );
  const entry: Omit<BiQueryLogEntry, "checksum"> = { ... };
  const checksum = await computeChecksum(entry, previous?.checksum ?? null, getAuthSecret());
  ...
}
```

```ts
// src/features/bi/governance/export-controls.ts
export const assertExportAllowed = (context: QueryContext) => {
  if (!hasPermission) {
    throw new Error("Analytics export permission required");
  }
  if (!context.hasRecentAuth) {
    throw new Error("Step-up authentication required for export");
  }
};
```

```ts
// src/features/bi/bi.sql-executor.ts
const parsed = parseAndValidateSql(sqlText);
if (!parsed.isValid) throw new Error(parsed.errors.join(" "));

const rewritten = rewriteSqlTables(stripTrailingSemicolons(sqlText), tableMapping);
const rewrittenParsed = parseAndValidateSql(rewritten.sql);
if (!rewrittenParsed.isValid) throw new Error(rewrittenParsed.errors.join(" "));

const limitedSqlText = buildLimitedQuery(rewritten.sql, maxRows);
const query = buildParameterizedSql(limitedSqlText, parameters);

await tx.execute(sql.raw("SET LOCAL ROLE bi_readonly"));
await tx.execute(sql.raw(`SET LOCAL app.org_id = ${formatSettingValue(...)}`));
await tx.execute(sql.raw(`SET LOCAL app.is_global_admin = ${formatSettingValue(...)}`));
await tx.execute(sql.raw(`SET LOCAL statement_timeout = ${formatSettingValue(...)}`));
```

### Public exports for suggestions

```ts
// src/features/bi/index.ts
export {
  fieldValueSuggestionsSchema,
  ...
} from "./bi.schemas";

export {
  getFieldValueSuggestions,
  ...
} from "./bi.queries";
```

## Included code excerpt files

- src/features/bi/bi.schemas.ts
- src/features/bi/bi.types.ts
- src/features/bi/bi.queries.ts
- src/features/bi/cache/pivot-cache.ts
- src/features/bi/components/dashboard/FilterWidget.tsx
- src/features/bi/components/dashboard/DashboardWidget.tsx
- src/features/bi/components/dashboard/EditWidgetDialog.tsx
- src/features/bi/components/pivot-builder/SaveToDashboardDialog.tsx
- src/features/bi/utils/measure-utils.ts
- src/features/bi/bi.data.ts
- src/features/bi/semantic/datasets.config.ts
- src/features/bi/index.ts
- src/features/bi/engine/pivot-sql-compiler.ts
- src/features/bi/governance/query-guardrails.ts
- src/features/bi/governance/field-acl.ts
- src/features/bi/governance/audit-logger.ts
- src/features/bi/governance/export-controls.ts
- src/features/bi/bi.sql-executor.ts

## BI code files omitted (not excerpted)

- src/features/bi/**fixtures**/filter-fixtures.json
- src/features/bi/**fixtures**/pivot-golden-masters.json
- src/features/bi/**fixtures**/sql-test-cases.json
- src/features/bi/**tests**/bi.integration.test.ts
- src/features/bi/**tests**/sql-executor.test.ts
- src/features/bi/bi.mutations.ts
- src/features/bi/bi.telemetry.ts
- src/features/bi/bi.utils.ts
- src/features/bi/components/chart-config/ControlPanel.tsx
- src/features/bi/components/chart-config/panels.ts
- src/features/bi/components/chart-config/types.ts
- src/features/bi/components/charts/BarChart.tsx
- src/features/bi/components/charts/ChartContainer.tsx
- src/features/bi/components/charts/ChartWrapper.tsx
- src/features/bi/components/charts/KpiCard.tsx
- src/features/bi/components/charts/LineChart.tsx
- src/features/bi/components/charts/PieChart.tsx
- src/features/bi/components/charts/pivot-chart.ts
- src/features/bi/components/dashboard/AddWidgetModal.tsx
- src/features/bi/components/dashboard/DashboardCanvas.tsx
- src/features/bi/components/dashboard/DashboardExportDialog.tsx
- src/features/bi/components/dashboard/DashboardFilters.tsx
- src/features/bi/components/dashboard/DashboardShareDialog.tsx
- src/features/bi/components/dashboard/WidgetToolbar.tsx
- src/features/bi/components/dashboard/dashboard-utils.ts
- src/features/bi/components/filters/DateFilter.tsx
- src/features/bi/components/filters/EnumFilter.tsx
- src/features/bi/components/filters/FilterBuilder.tsx
- src/features/bi/components/filters/FilterGroup.tsx
- src/features/bi/components/filters/NumericFilter.tsx
- src/features/bi/components/pivot-builder/DropZone.tsx
- src/features/bi/components/pivot-builder/FieldPalette.tsx
- src/features/bi/components/pivot-builder/FilterPanel.tsx
- src/features/bi/components/pivot-builder/MeasureConfig.tsx
- src/features/bi/components/pivot-builder/PivotBuilder.tsx
- src/features/bi/components/pivot-builder/PivotPreview.tsx
- src/features/bi/components/pivot-table/PivotHeader.tsx
- src/features/bi/components/pivot-table/PivotRow.tsx
- src/features/bi/components/pivot-table/PivotTable.tsx
- src/features/bi/components/pivot-table/TotalsRow.tsx
- src/features/bi/components/sql-workbench/QueryHistory.tsx
- src/features/bi/components/sql-workbench/ResultsTable.tsx
- src/features/bi/components/sql-workbench/SchemaBrowser.tsx
- src/features/bi/components/sql-workbench/SqlEditor.tsx
- src/features/bi/components/sql-workbench/SqlWorkbench.tsx
- src/features/bi/engine/**tests**/aggregations.property.test.ts
- src/features/bi/engine/**tests**/aggregations.test.ts
- src/features/bi/engine/**tests**/filters.test.ts
- src/features/bi/engine/**tests**/pivot-aggregator.golden.test.ts
- src/features/bi/engine/**tests**/pivot-aggregator.test.ts
- src/features/bi/engine/**tests**/pivot-sql-compiler.test.ts
- src/features/bi/engine/**tests**/query-builder.test.ts
- src/features/bi/engine/**tests**/sorting.test.ts
- src/features/bi/engine/**tests**/sql-parser.test.ts
- src/features/bi/engine/**tests**/sql-rewriter.test.ts
- src/features/bi/engine/aggregations.ts
- src/features/bi/engine/filters.ts
- src/features/bi/engine/index.ts
- src/features/bi/engine/pivot-aggregator.ts
- src/features/bi/engine/query-builder.ts
- src/features/bi/engine/sorting.ts
- src/features/bi/engine/sql-parser.ts
- src/features/bi/engine/sql-rewriter.ts
- src/features/bi/governance/**tests**/field-acl.test.ts
- src/features/bi/governance/**tests**/org-scoping.test.ts
- src/features/bi/governance/**tests**/query-guardrails.test.ts
- src/features/bi/governance/index.ts
- src/features/bi/governance/org-scoping.ts
- src/features/bi/governance/pii-masking.ts
- src/features/bi/governance/query-audit.ts
- src/features/bi/hooks/use-dashboard.ts
- src/features/bi/semantic/calculated-fields.ts
- src/features/bi/semantic/field-metadata.ts
- src/features/bi/semantic/index.ts
- src/features/bi/semantic/metrics.config.ts
- src/features/bi/templates/dashboard-templates.ts
- src/features/bi/utils/**tests**/chart-suggestion.test.ts
- src/features/bi/utils/**tests**/query-cost.test.ts
- src/features/bi/utils/chart-suggestion.ts
- src/features/bi/utils/chart-values.ts
- src/features/bi/utils/color-schemes.ts
- src/features/bi/utils/formatting.ts
- src/features/bi/utils/query-cost.ts
