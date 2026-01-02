# BI Support Playbook

Support triage guide for BI reporting, dashboards, and exports.

## Quick Triage Checklist

- Confirm user role: org membership + analytics permissions.
- Confirm organization context (user should be in the right org).
- Check global filters and widget filters.
- Check dataset selection and metric permissions.
- Capture BI query log entry for the failed request.

## Permissions + Access

Key permissions:

- `analytics.view` - view Explore and dashboards.
- `analytics.author` - create/edit dashboards and widgets.
- `analytics.export` - export data (requires step-up auth).
- `pii.read` - view unmasked PII fields.

Org role requirements:

- Analytics access requires org roles: owner/admin/reporter.
- Global admin can access analytics if the feature is enabled.

## Common Issues

### 1) "I see no data"

Checklist:

- Confirm correct organization selected in the header.
- Review global filters for conflicts or mismatched dataset IDs.
- Check widget-specific filters or filter widgets.
- Verify dataset access and metric permission requirements.

Resolution:

- Clear filters to confirm baseline data.
- Re-run query (manual run) and inspect error.
- If metric permissions are missing, request role update.

### 2) "Query fails with guardrails"

Symptoms:

- Error: "Too many categories" or "Query too large."

Resolution:

- Reduce rows/columns in Explore.
- Add filters (date range, status, org) to narrow results.
- If the query is required, log the dataset + filters for escalation.

### 3) "Export fails or prompts repeatedly"

Checklist:

- Export requires step-up auth; user must re-authenticate.
- Confirm user has `analytics.export` permission.
- Check if export includes PII (may be masked).

Resolution:

- Ask the user to re-authenticate and retry.
- Verify audit log entry for BI.EXPORT.
- Escalate if no audit log entry is created.

### 4) "Dashboard is slow"

Checklist:

- Check number of widgets (8-12 can be heavy).
- Check for broad filters or unbounded rows/columns.
- Verify caching behavior with a warm reload.

Resolution:

- Suggest templates or smaller widget sets.
- Narrow filters and avoid high-cardinality dimensions.
- Capture timings from the BI query log.

## Data to Capture for Escalation

- User ID + organization ID.
- Dataset ID + pivot configuration (rows/columns/measures).
- Filters (global + widget).
- BI query log entry (query type, rows returned, execution time).
- Audit log entry (for export issues).
- Screenshots of error messages or guardrail alerts.

## References

- `src/features/bi/docs/GUIDE-bi-report-builder.md`
- `src/features/bi/docs/PERF-bi-dashboard-benchmark.md`
- `/dashboard/analytics/audit` (BI query log + audit log UI)
