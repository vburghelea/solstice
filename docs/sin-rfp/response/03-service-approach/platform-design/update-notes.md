# Platform Design Update Notes

## 2026-01-04 13:40 PST

- The AWS services list omits several deployed components (VPC with NAT/bastion,
  RDS Proxy, ECS/Fargate import worker, SQS DLQ, CloudWatch alarms/dashboard).
  Consider adding these to reflect the actual infra footprint. Evidence:
  `sst.config.ts`, `src/workers/import-batch.ts`, `docker/import-batch.Dockerfile`.
- S3 storage is a single `SinArtifacts` bucket with Object Lock + lifecycle to
  Glacier, used for forms uploads, templates, imports, DSAR exports, and audit
  archives. The current wording only mentions documents/imports/audit archives.
  Consider updating the storage description to match the real prefixes.
  Evidence: `sst.config.ts`, `src/features/forms/forms.mutations.ts`,
  `src/features/templates/templates.mutations.ts`,
  `src/features/imports/imports.mutations.ts`,
  `src/features/privacy/privacy.mutations.ts`, `src/lib/privacy/retention.ts`.
- KMS usage is explicit for DSAR exports and audit archives (SSE-KMS), but
  regular uploads do not set SSE-KMS in code and rely on bucket defaults. The
  KMS service bullet should reflect this scoped usage. Evidence:
  `src/features/privacy/privacy.mutations.ts`, `src/lib/privacy/retention.ts`,
  `src/features/forms/forms.mutations.ts`, `src/features/imports/imports.mutations.ts`,
  `src/features/templates/templates.mutations.ts`, `src/lib/env.server.ts`.
- CloudTrail/GuardDuty/Secrets Manager with rotation are listed but not defined
  in SST config; secrets are declared via `sst.Secret` without rotation config.
  If these are account-level controls, call that out explicitly or add infra
  setup. Evidence: `sst.config.ts`.
- The workflow section claims automatic deploys to sin-dev and E2E gating.
  Actual CI runs lint/type/test/build only, and pre-commit runs lint-staged,
  type checks, and unit tests. No deploy step or E2E gate is wired in. Update
  the workflow text or add pipeline steps. Evidence: `.github/workflows/ci.yml`,
  `.husky/pre-commit`, `package.json`.
- The deployment step says `sst deploy` updates database schema; migrations are
  separate commands (`pnpm db:migrate` or `pnpm db push`). Either update the
  deployment description or add a deploy hook. Evidence: `package.json`,
  `scripts/reset-db.sh`, `.github/workflows/ci.yml`.
