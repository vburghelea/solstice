# Update Notes

## Verified 2026-01-05

Features implemented on 2026-01-04 verified in `sin-dev`:

- ✅ Data quality alerting with per-org threshold overrides and admin notifications (dashboard link included)
- ✅ Import file field support with JSON payload validation and submission file metadata persistence
- ✅ Batch worker entrypoint executes end-to-end (ECS task `SinImportBatchTask:40` deployed)

Test environment: `AWS_PROFILE=techdev npx sst dev --stage sin-dev --mode mono`

---

## 2026-01-04 16:25 -0800

- Data quality automation now evaluates alert thresholds (with per-org overrides) and
  notifies global admins on new issues, linking directly to the data quality dashboard
  (`src/features/data-quality/data-quality.monitor.ts`,
  `src/features/data-quality/data-quality.alerts.ts`).

## 2026-01-04 15:59 -0800

- Import tooling now supports file field mappings when rows provide JSON file
  payloads (fileName, mimeType, sizeBytes, storageKey/signedUrl); batch/interactive
  imports validate file constraints and persist submission file metadata.
  Evidence: `src/features/imports/components/import-wizard-shell.tsx`,
  `src/features/imports/imports.utils.ts`,
  `src/features/imports/imports.mutations.ts`,
  `src/lib/imports/batch-runner.ts`, `src/lib/imports/file-field-utils.ts`.

## 2026-01-04 13:44 -0800

- Codebase size is ~92k TS/TSX lines in `src/`; update the "20,000+ lines" metric to reflect current scale (`src/`).
- Automation infra wording: notifications queue is standard SQS (FIFO/dedup only if `.fifo`), SES sending has no bounce-handling pipeline, and digest emails are implemented (`sst.config.ts`, `src/lib/notifications/queue.ts`, `src/lib/notifications/send.ts`, `src/lib/notifications/digest.ts`, `src/cron/process-notifications.ts`).
- Import tooling supports CSV/Excel mapping/preview/rollback with batch checkpointing, but file field imports are explicitly blocked; call out the limitation (`src/features/imports/components/import-wizard-shell.tsx`, `src/features/imports/imports.mutations.ts`, `src/lib/imports/batch-runner.ts`).
- Data quality automation stores daily summaries and powers the dashboard, but no alert notifications are emitted yet; describe it as monitoring/reporting unless alerts are added (`src/cron/data-quality-monitor.ts`, `src/features/data-quality/data-quality.monitor.ts`, `src/features/data-quality/components/data-quality-dashboard.tsx`).
- Load test evidence shows 0 server (5xx) errors but ~6.7% 429 rate-limit responses; clarify "zero errors" as "zero 5xx" and mention rate limiting (`performance/reports/20260102-sin-perf-summary.md`).
- Consider highlighting governance capability: exports require step-up auth and enforce PII masking/field ACLs (`src/features/bi/bi.mutations.ts`, `src/features/bi/governance/field-acl.ts`, `src/features/reports/reports.mutations.ts`).
