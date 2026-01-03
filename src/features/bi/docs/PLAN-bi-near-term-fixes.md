# BI Near-Term Fixes Plan

## Goals

- Enforce SQL workbench prerequisites at runtime and fail closed when missing.
- Apply export guardrails to pivot and new SQL exports.
- Add SQL workbench export with step-up auth, permissions, and audit logging.
- Preserve typed filter values and align in-memory filter semantics with SQL.
- Make pivot cache keys deterministic with `undefined` inputs.
- Reduce UX risk for masked dimensions and heavy suggestion queries.
- Resolve chart cleanup warnings in the BI chart wrapper.

## Scope

- SQL workbench gate checks (views, role, grants, security barrier).
- Export paths (pivot and SQL workbench).
- Filter widget typing and manual input validation.
- In-memory filter matching behavior.
- Pivot cache key serialization.
- Filter suggestion strategy metadata + UI gating.
- Masked dimension display for pivot headers/rows.
- Chart cleanup stability (ECharts wrapper).

## Detailed Plan

1. Add SQL workbench gate helper.
   - Validate curated views exist and are `security_barrier`.
   - Validate `bi_readonly` role exists and has SELECT on views.
   - Validate `bi_readonly` has no privileges on base tables.
   - Smoke test `SET LOCAL ROLE bi_readonly` and view query.
   - Cache results with short TTL to avoid repeated metadata checks.
2. Wire gate into SQL workbench entry points.
   - Call gate from `getSqlSchema`.
   - Call gate inside SQL execution path to protect all queries.
3. Add SQL workbench export server function.
   - Require `analytics.sql` + `analytics.export` and step-up auth.
   - Execute SQL with `maxRowsExport + 1`, fail if exceeded.
   - Export CSV/XLSX/JSON with consistent mime types.
   - Log BI export + audit log; update export history if useful.
4. Apply export guardrails to pivot export.
   - Limit dataset load to `maxRowsExport + 1`, error on overflow.
5. Fix filter typing and semantics.
   - Preserve typed suggestion values (number/boolean).
   - Parse manual input to typed values, show validation error.
   - Align in-memory `contains/starts_with/ends_with` with SQL `ILIKE`.
6. Harden pivot cache key serialization.
   - Encode `undefined` deterministically to avoid malformed cache keys.
7. Add suggestion strategy controls.
   - Default high-cardinality fields to `require_search`.
   - Gate suggestions in UI and server when filters/search are required.
8. Improve masked dimension UX.
   - Render masked values as "Masked" with a tooltip for clarity.
9. Stabilize chart cleanup.
   - Provide explicit ECharts instance to avoid cleanup warnings.

## Verification Plan

- SQL workbench:
  - Missing `bi_v_*` views blocks schema and query calls with a clear error.
  - Normal path passes and queries execute under `bi_readonly` role.
- Exports:
  - Pivot export errors on > `maxRowsExport`.
  - SQL export returns expected file with correct encoding.
  - Audit log includes BI.EXPORT entries for SQL export.
- Filters:
  - Numeric/boolean select filters preserve types in requests.
  - Manual input shows error for invalid values.
  - In-memory filtering matches SQL for case-insensitive operators.
- Cache:
  - Cache keys remain stable with `undefined` fields in queries.

## Worklog

- 2026-01-02: Plan created; starting near-term fixes.
- 2026-01-02: Added SQL workbench gate, SQL export flow, export guardrails, typed
  filter inputs, case-insensitive in-memory string operators, and cache key fix.
- 2026-01-02: Added suggestion gating defaults + UI hints, masked dimension
  formatting in pivots, and explicit ECharts injection to stop cleanup warnings.
