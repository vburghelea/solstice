# TICKET: Data Quality Alerts + Notifications

**Status**: ✅ Verified
**Priority**: P2
**Component**: Data Quality / Notifications
**Date**: 2026-01-04
**Verified**: 2026-01-05
**Author**: Codex (AI Assistant)

---

## Summary

Data quality monitoring runs on a schedule and stores summaries, but there are
no alert thresholds or notifications. Add alerting so admins are notified when
missing fields, validation errors, or completeness drop below targets.

---

## Background

`runDataQualityCheck` aggregates submission stats and records a summary in
`dataQualityRuns`, and the dashboard surfaces the latest run. The notifications
system supports queued in-app/email dispatch via SQS but is unused here.

---

## Current Behavior

- Cron invokes `runDataQualityCheck` with no alert logic.
- Dashboard shows totals/by-org only; no alert state or acknowledgement flow.
- Notification categories include `system`, `reporting`, `support`, `security`.

---

## Proposed Scope

1. Define alert thresholds (global defaults + optional org overrides).
2. Add alert evaluation during `runDataQualityCheck`.
3. Enqueue notifications (category `system` or `reporting`) with links to the
   data quality dashboard.
4. Record alert history to avoid duplicate spam (digest or change-only logic).

---

## Status Update

- Implemented alert evaluation during data quality runs with default thresholds:
  missing fields (5%), validation errors (2%), low completeness (10%), and
  minimum submissions (1); completeness cutoff is 80.
- Added per-organization overrides via `organizations.settings.dataQuality.alertThresholds`.
- Persisted alert summaries on `data_quality_runs.summary.alerts` for history.
- Added change-only admin notifications (category `reporting`) when new alert keys
  appear, linking to the data quality dashboard.

## Testing

1. Ensure `sin_data_quality` is enabled and a global admin can access the Data
   Quality dashboard (`/dashboard/admin/sin/data-quality`).
2. (Optional) To force an alert, set per-org thresholds in
   `organizations.settings.dataQuality.alertThresholds` (ex: set rates to `0`
   and `minSubmissions` to `1`) and ensure the org has submissions with missing
   fields/validation errors/completeness < 80.
3. From the dashboard, click **Run checks** (or run the cron) to create a new
   data quality run.
4. Confirm a notification appears for global admins with title "Data quality
   alert" and link to the dashboard. If `SIN_NOTIFICATIONS_QUEUE_URL` is set,
   ensure the notifications processor is running; otherwise it sends directly.
5. Re-run the check without changing data: no new notification should be sent
   unless a new alert condition appears (dedupe by org + metric).

---

## References

- `src/cron/data-quality-monitor.ts`
- `src/features/data-quality/data-quality.monitor.ts`
- `src/features/data-quality/components/data-quality-dashboard.tsx`
- `src/lib/notifications/queue.ts`
- `src/features/notifications/notifications.schemas.ts`

---

## Docs to Update

- `docs/sin-rfp/response/04-system-requirements/data-management-dm-agg/update-notes.md`
- `docs/sin-rfp/response/05-capabilities-experience/update-notes.md`
