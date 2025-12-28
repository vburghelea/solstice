# Stream L Context Summary (Production readiness and infra)

## Sources consulted

- `docs/sin-rfp/5.2-pro-review-output/consolidated-backlog.md`
- `docs/sin-rfp/decisions/ADR-2025-12-26-d0-17-import-batch-runtime.md`
- `docs/sin-rfp/phase-0/import-batch-worker.md`
- `docs/sin-rfp/phase-0/backup-dr-plan.md`
- `docs/sin-rfp/phase-0/audit-retention-policy.md`
- `docs/sin-rfp/phase-0/architecture-reference.md`
- `docs/sin-rfp/SIN-IMPLEMENTATION-TECHNICAL-DEBT.md`
- `docs/sin-rfp/worklogs/stream-h.md` (audit archival follow-ups)

## Stream L scope (from consolidated backlog)

- L1: Add ECS batch import infra in `sst.config.ts` (task definition + trigger).
- L2: Verify notifications queue outputs, DLQ, and alarms; document in
  `docs/sin-rfp/SIN-IMPLEMENTATION-TECHNICAL-DEBT.md`.
- L3: Verify SES deliverability (SPF/DKIM/DMARC) and update technical debt doc.
- L4: Run backup/restore drill; add `docs/sin-rfp/backup-restore-test-results.md`.
- L5: Implement audit archival to Glacier/Object Lock or update Phase 0 docs
  with delivery timeline (coordinate with Stream H9).

## Key decisions and requirements

- D0.17 (ADR-2025-12-26-d0-17): Use ECS Fargate for the batch import runtime.
- Batch import worker spec (`phase-0/import-batch-worker.md`):
  - ECS task definition: 2 vCPU, 4 GB memory, 50 GB ephemeral storage, awsvpc.
  - Runtime env: `SST_STAGE`, `SIN_ARTIFACTS_BUCKET`, optional
    `SIN_IMPORT_ACTOR_USER_ID`.
  - Secrets: database + auth secrets sourced from Secrets Manager/SST.
  - TODOs: ECS wiring in `sst.config.ts`, EventBridge/SQS trigger, logging.
- Backup/DR plan (`phase-0/backup-dr-plan.md`):
  - RPO 1 hour, RTO 4 hours, 35-day RDS retention.
  - Quarterly restore drills with documented evidence.
- Audit retention policy (`phase-0/audit-retention-policy.md`):
  - Audit logs retained 7 years with Glacier + Object Lock immutability.
  - Implementation status: archival/Object Lock pending Stream L.
- Stream H follow-ups (`worklogs/stream-h.md`):
  - Audit archive records are written to S3 in DEEP_ARCHIVE storage class.
  - Object Lock/WORM requires infra changes in `sst.config.ts`.

## Current infra snapshot

- `sst.config.ts` already defines:
  - `SinArtifacts` bucket, notifications queue + DLQ, cron workers.
  - CloudWatch alarms for Lambda and RDS (no SQS alarms yet).
- Technical debt doc tracks outstanding items:
  - SQS production wiring + DLQ alarms.
  - SES domain verification + SPF/DKIM/DMARC.
  - Audit log archival with WORM storage.

## Dependencies

- Stream H9 completed code-side archival logic but flagged infra gaps.
- Stream L must document infra outputs/secrets and provide evidence for
  deliverability + backup/restore.
