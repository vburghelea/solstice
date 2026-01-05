# BI Performance Test Checklist

Use this checklist to validate dashboard performance, guardrails, and export speed before
release. Capture results in the log table below and attach screenshots of key metrics.

## Setup

- Environment: `sin-dev` (seeded data).
- Account: `viasport-staff@example.com` (full analytics access).
- Ensure SST dev tunnel is running and data is loaded.
- Pivot cache uses Redis (shared 5-minute TTL). Cache hits are logged in BI query logs.
- Disable browser extensions and close other heavy tabs.
- Run each scenario twice: cold (first load) and warm (second load).

## Instrumentation

- Chrome DevTools:
  - Network tab: filter by `executePivotBatch` and `executePivotQuery`.
  - Performance tab: record initial dashboard load.
  - Disable cache for the cold run, enable cache for warm run.
- BI Query Log:
  - Visit `/dashboard/analytics/audit` and use the BI query log tab.
  - Capture row counts and execution time per query.

## Scenario 1: Dashboard with 8-12 widgets

1. Create a new dashboard from a template.
2. Duplicate widgets until you have 8-12 (mix chart, pivot, KPI).
3. Save, reload, and record the `executePivotBatch` response time.
4. Apply a simple global filter and record the filter response time.

Expected:

- Cold load: < 3s to first render.
- Warm load: < 1.5s to first render.
- Filter response: < 1.5s.

## Scenario 2: Worst-case filters

1. Remove all filters (broad query).
2. Apply a single narrow filter (e.g., status = approved).
3. Apply 2-3 filters across different widgets/datasets.
4. Record guardrail errors, if any.

Expected:

- Broad queries trigger guardrails with clear UI errors.
- Narrow filters return results without timeouts.

## Scenario 3: Cardinality caps (Explore)

1. In Explore, set rows + columns to exceed guardrails:
   - Rows: status + submittedAt
   - Columns: organizationId
2. Run the query and capture error text + timings.

Expected:

- "Too many categories" error appears without server timeout.
- UI remains responsive after failure.

## Scenario 4: Cache effectiveness

1. Load a dashboard with 6-8 widgets.
2. Reload the page immediately (warm cache).
3. Compare query counts in the BI query log.

Expected:

- Warm reload shows fewer new query log entries.
- Batch request time drops on warm load.

## Scenario 5: Export path

1. Export a large pivot (CSV).
2. Record time to download and check audit log entry.

Expected:

- Export completes under 10s.
- Audit log entry includes format + PII metadata.

## Results Log

| Scenario               | Cold Time | Warm Time | Query Count | Errors | Notes |
| ---------------------- | --------- | --------- | ----------- | ------ | ----- |
| 1: 8-12 widgets        |           |           |             |        |       |
| 2: Worst-case filters  |           |           |             |        |       |
| 3: Cardinality caps    |           |           |             |        |       |
| 4: Cache effectiveness |           |           |             |        |       |
| 5: Export path         |           |           |             |        |       |

## Follow-ups

- If any scenario fails, capture DevTools screenshots and copy the BI query log rows.
- File an issue with the scenario details and attach the Results Log.
