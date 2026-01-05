# Update Notes

## 2026-01-04 13:41 PST

- Load-test headroom: The 20.1M-row sin-perf run shows 6.73% 429 rate limiting and auth p95 ~250ms, so the “no price adjustments for data volume growth/headroom” claim should note rate-limit tuning and provisioned concurrency for higher concurrency loads. Evidence: `performance/reports/20260102-sin-perf-summary.md`, `performance/load-tests/api-load.js`, `sst.config.ts`.
- DR drill cadence: The cost section promises quarterly DR drills, but current evidence is sin-dev-only restore drills/tests; wording should clarify production cadence vs dev evidence. Evidence: `docs/sin-rfp/review-plans/evidence/DR-DRILL-sin-dev-20251230.md`, `docs/sin-rfp/review-plans/backup-restore-test-results.md`, `sst.config.ts`.
- Operations portal add-on scope: Events/teams/membership are implemented for QC but feature-gated off for viaSport, so the add-on should call out tenant enablement and any payments/registration dependencies. Evidence: `src/tenant/tenants/qc.ts`, `src/tenant/tenants/viasport.ts`, `src/features/events/events.mutations.ts`, `src/features/teams/teams.mutations.ts`.
- Prototype value-add size: “20,000+ lines” understates current scope (~92k TS/TSX lines in `src/`); update the figure or remove the hard number while keeping the tested-code claim. Evidence: `src/`, `vitest.config.ts`, `src/features/bi/__tests__/bi.integration.test.ts`.
- Hosting/infra cost drivers: Add or clarify ongoing costs for SQS-backed notification processing and ECS Fargate import batch jobs beyond core Lambda/RDS spend. Evidence: `sst.config.ts`, `src/cron/notification-worker.ts`, `src/workers/import-batch.ts`.
