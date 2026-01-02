# BI Training - Support Coordinator

Training plan for support staff to handle analytics questions, templates, and audits.

## Learning Objectives

- Build a report in Explore and publish a dashboard.
- Use templates to reduce manual setup.
- Interpret audit logs for BI exports.
- Troubleshoot common access and data issues.

## Training Agenda (60-90 minutes)

1. Overview (10m)
   - BI personas, permissions, and org context
2. Explore + Reports (20m)
   - Build a pivot and apply filters
   - Use chart suggestions and controls
3. Dashboards (20m)
   - Create from template
   - Add filter widgets and cross-filter
4. Exports + Audit (10m)
   - Step-up auth
   - Audit log review
5. Troubleshooting (10m)
   - Guardrails, no data, permission issues

## Hands-On Exercises

1. Create a pivot with Rows + Columns + Count.
2. Switch chart type and apply a color scheme.
3. Save to a new dashboard and add a filter widget.
4. Apply a filter and verify widgets update.
5. Export the pivot to CSV and confirm audit log entry.

## Knowledge Check

- What permission is required to export data?
- Why would auto-run pause a query?
- How do you confirm an export was logged?

## Reference Links

- `src/features/bi/docs/GUIDE-bi-report-builder.md`
- `src/features/bi/docs/PLAYBOOK-bi-support.md`
- `/dashboard/analytics/audit`
