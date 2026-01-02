# BI Report Builder Guide

Step-by-step guide for building reports in Explore and publishing dashboards.

## 1) Choose a Dataset

1. Go to `/dashboard/analytics/explore`.
2. Select a dataset in the Data Source dropdown.
3. Review field descriptions and PII labels if needed.

Tip: If you are unsure which dataset to use, check the Data Catalog first.

## 2) Build a Pivot

1. Drag fields into Rows and Columns.
2. Add at least one Measure (Count, Sum, Avg, etc).
3. Use Metrics when available for standardized definitions.

If the query is heavy, auto-run pauses. Click Run Query to confirm.

## 3) Pick a Chart

1. Use chart suggestions to choose a suitable visualization.
2. Toggle table/chart view.
3. Use the chart control panel to adjust colors, legends, and labels.

## 4) Add Filters

1. Add filters in the Filters panel to narrow results.
2. Use date filters to limit ranges.
3. Avoid high-cardinality fields when possible.

Filters are scoped to the dataset. Global filters on dashboards only apply to
matching datasets.

## 5) Save to Dashboard

1. Click "Save to Dashboard."
2. Provide a widget title and description.
3. Select the target dashboard or create a new one.

## 6) Build a Dashboard

1. Use templates for common reporting needs.
2. Add chart, pivot, KPI, text, and filter widgets.
3. Configure global filters at the top of the dashboard.

## 7) Export Data

1. Click Export in Explore or Dashboard widgets.
2. Confirm step-up authentication if prompted.
3. Choose CSV, Excel, or JSON.

Exports are logged in the Audit Log (BI.EXPORT).

## Troubleshooting

- No data? Clear filters and re-run the query.
- Guardrail errors? Reduce rows/columns or add filters.
- Export blocked? Confirm `analytics.export` permission.
