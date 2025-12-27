# SIN Catch-Up Context (for future agent sessions)

## Purpose

This document is a rapid context rebuild for the SIN RFP implementation work in
`/Users/austin/dev/solstice`. It summarizes the required docs to read, repo
structure, current SIN backlog status, and the known constraints. It is meant
for a coding agent to pick up where work left off without re-reading the entire
repo.

---

## Required Reads (in order)

1. `AGENTS.md` (project rules, lint/typecheck requirements, UI components)
2. `CLAUDE.md` (TanStack Start + Better Auth + test + Playwright + server-only
   import rules)
3. `docs/sin-rfp/worklog.md` (this task's hard requirements and history)
4. `docs/sin-rfp/SIN-REQUIREMENTS.md` (source requirements)
5. `docs/sin-rfp/tickets/SIN-IMPLEMENTATION-BACKLOG-V2.md` (the actual backlog)
6. `docs/sin-rfp/phase-0/*` (architecture/compliance context)

If auth work is involved, also read Better Auth docs:
`https://www.better-auth.com/llms.txt` and plugin `2fa` doc.

---

## Hard Session Requirements (from worklog + AGENTS/CLAUDE)

- Update `docs/sin-rfp/worklog.md` frequently (timestamps with minutes/seconds).
- Log questions in worklog and proceed with best judgment (no blocking).
- Attempt every checkbox item in `SIN-IMPLEMENTATION-BACKLOG-V2.md`.
- If blocked on a checkbox item, log it and move to another item.
- Do not return control until every backlog item has been attempted.
- Run `pnpm lint` and `pnpm check-types` before completing a task batch.
- Verify UI flows with Playwright MCP when applicable.
- Deploy to techdev using SST and verify against
  `https://d2vrqpzqxw3hbr.cloudfront.net/dashboard`.
- Assume dev server is running on port 5173; check via
  `curl -s http://localhost:5173/api/health`.

---

## Environment and Tooling

- Current environment: approval policy `never`, sandbox `danger-full-access`.
- Shell: `zsh`, network access enabled.
- Use `rg` for file search.
- Always use shadcn/ui from `~/components/ui/` in new UI.
- Server-only imports must be inside handler() or use `serverOnly`/`createServerOnlyFn`.

---

## SIN Phase-0 Docs (already complete)

- `docs/sin-rfp/phase-0/architecture-reference.md`
- `docs/sin-rfp/phase-0/data-residency.md`
- `docs/sin-rfp/phase-0/security-controls.md`
- `docs/sin-rfp/phase-0/backup-dr-plan.md`
- `docs/sin-rfp/phase-0/audit-retention-policy.md`
- Supporting docs: `data-classification-guide.md`, `migration-strategy.md`,
  `phased-delivery-plan.md`, `import-batch-worker.md`

---

## Current SIN Implementation Summary

### Routes / Admin Surface

- SIN admin hub at `src/routes/dashboard/admin/sin.tsx` with sections for:
  Organizations, Audit, Notifications, Security, Privacy/DSAR, Forms,
  Imports, Reporting, Reports.

### Phase 1: Foundation

- Organizations
  - Schema: `src/db/schema/organizations.schema.ts`
  - Guards: `src/lib/auth/guards/org-guard.ts`, `org-context.ts`
  - Admin UI: `src/features/organizations/components/organization-admin-panel.tsx`

- Audit Logging
  - Schema: `src/db/schema/audit.schema.ts`
  - Library: `src/lib/audit/index.ts` (hash chain, redaction)
  - UI: `src/features/audit/components/audit-log-table.tsx`
  - Export: CSV in `audit.queries.ts`
  - Immutability trigger migration: `src/db/migrations/0010_audit_immutable.sql`
  - Hash chain verify now exposed via server fn + UI button.

- Notifications
  - Schema: `src/db/schema/notifications.schema.ts`
  - Queue: `src/lib/notifications/queue.ts` (SQS + fallback)
  - Send: `src/lib/notifications/send.ts` (SES)
  - Scheduler: `src/lib/notifications/scheduler.ts`
  - UI: bell, preferences, template admin.
  - Cron: `src/cron/process-notifications.ts` (scheduled),
    `src/cron/notification-worker.ts` (SQS consumer)

### Phase 2: Security

- MFA (Better Auth 2FA)
  - UI: `src/features/auth/mfa/mfa-enrollment.tsx` and `mfa-recovery.tsx`
  - Login 2FA challenge in `src/features/auth/components/login.tsx`
  - Step-up dialog: `src/features/auth/step-up.tsx`
  - Server guard: `src/lib/auth/guards/step-up.ts`
  - MFA is enforced for global admins via role assignment logic
    (`src/features/roles/roles.mutations.ts` updates `user.mfaRequired`).
  - MFA enrollment now includes QR rendering (`react-qr-code`) and
    backup code regeneration.

- Security events + lockout
  - Schema: `src/db/schema/security.schema.ts`
  - Event capture: `src/lib/security/events.ts`
  - Detection rules: `src/lib/security/detection.ts`
  - Lockout: `src/lib/security/lockout.ts`
  - Admin UI: `src/features/security/components/security-dashboard.tsx`

### Phase 2: Privacy / DSAR

- Schema: `src/db/schema/privacy.schema.ts`
- Mutations: `src/features/privacy/privacy.mutations.ts`
- Queries: `src/features/privacy/privacy.queries.ts`
- UI: `privacy-dashboard`, `privacy-admin-panel`, `retention-policy-panel`,
  `privacy-acceptance-card`.
- DSAR export generates S3 artifact and signed URL download.
- Erasure + retention delete S3 artifacts (`src/lib/privacy/submission-files.ts`).

### Phase 3: Core SIN

- Forms
  - Schema: `src/db/schema/forms.schema.ts`
  - Logic: `src/features/forms/forms.mutations.ts`, `forms.utils.ts`
  - UI: `form-builder-shell.tsx` (drag/drop palette, conditional fields,
    preview, publish workflow, submissions review)

- Imports
  - Schema: `src/db/schema/imports.schema.ts`
  - Logic: `src/features/imports/imports.mutations.ts` (lane 1 + lane 2)
  - UI: `import-wizard-shell.tsx` (mapping, validation, rollback, history)
  - Lane 2 worker design doc in `docs/sin-rfp/phase-0/import-batch-worker.md`

- Reporting
  - Schema: `src/db/schema/reporting.schema.ts`
  - UI: `reporting-dashboard-shell.tsx` (cycle creation, task assign,
    org dashboard, review workflow)
  - Notifications scheduled via `scheduleNotification` in mutations.

### Phase 4: Analytics & Export

- Schema: `src/db/schema/reports.schema.ts`
- Exports with field-level ACL: `src/features/reports/reports.mutations.ts`
- UI: `report-builder-shell.tsx` (saved reports, export UI).

---

## Important Implementation Notes

- **TanStack Start server-only rule**: only handler() code is server-only.
  All server-only modules must be imported inside handlers or via
  `createServerOnlyFn`/`serverOnly`.

- **Org scoping**: use org guards; default to x-organization-id header where
  applicable for admin pages.
- **Tenancy vision**: two top-level tenants (viaSport, Quadball Canada) with
  distinct branding and separate AWS accounts; each has PSO → club hierarchy.

- **Audit logging**: log diffs, not full payloads; hash/redact sensitive fields.
  Audit logs are immutable; retention skips deleting audit logs.

- **Email PII policy**: emails should not include sensitive PII; allowed:
  first name, org name, summaries, links.

---

## Environment Variables (SIN)

- `SIN_NOTIFICATIONS_QUEUE_URL`
- `SIN_NOTIFICATIONS_FROM_EMAIL`
- `SIN_NOTIFICATIONS_REPLY_TO_EMAIL`
- `SIN_ARTIFACTS_BUCKET`

Also standard app secrets (Better Auth, OAuth, Square) from SST secrets.

---

## Synthetic Legacy Data (Dec 2025)

- Migration artifacts (inventory, quality, mapping, transformation rules) are
  synthesized in `docs/sin-rfp/phase-0/migration-strategy.md`.
- Sample CSV exports live in `docs/sin-rfp/legacy-data-samples/` for import
  wizard testing. Replace with real BCAR/BCSI exports when available.

---

## Known Issues / Blockers Observed

- `.cursor/rules/*` missing from worktree (tracked deletions).
- Vite port conflicts previously forced dev server to 3001; updated
  `vite.config.ts` to prefer 5173.
- SST deploy attempt failed due to SSO token refresh; may need `aws sso login`.
- Drizzle migrations previously required SST links; config now lazily loads SST
  to allow `pnpm db:generate` locally.

---

## Recent Code Changes (high-level)

- Added JSON-safe typing for jsonb fields (`src/shared/lib/json.ts`).
- Added SQS + SES notification integration with retry/backoff.
- Added retention enforcement job and S3 cleanup for DSAR erasure.
- Added file upload validation server-side for forms.
- Added Excel export support (`src/shared/lib/xlsx.ts`).
- Added MFA enrollment UI and step-up dialog.
- Added audit hash chain verification utility and UI button.
- Added QR rendering for MFA using `react-qr-code`.

---

## How to Verify

1. `pnpm lint`
2. `pnpm check-types`
3. Playwright MCP
   - `curl -s http://localhost:5173/api/health`
   - If needed, `mcp__playwright__browser_close`
   - Navigate to `/dashboard/admin/sin` and verify panels
4. SST deploy to techdev
   - `AWS_PROFILE=techdev npx sst deploy --stage sin-dev`

---

## Backlog Status Snapshot (Dec 24, 2025)

- Schemas and core logic are largely implemented for Phase 1-4.
- Remaining gaps are mostly UI polish, digest aggregation, ECS worker entry,
  and E2E tests.
- See `docs/sin-rfp/worklog.md` and `docs/sin-rfp/SIN-IMPLEMENTATION-TECHNICAL-DEBT.md`
  for detailed tracking.

---

## Files to Start With (high signal)

- `docs/sin-rfp/tickets/SIN-IMPLEMENTATION-BACKLOG-V2.md`
- `docs/sin-rfp/worklog.md`
- `src/routes/dashboard/admin/sin.tsx`
- `src/features/organizations/*`
- `src/features/audit/*`
- `src/features/notifications/*`
- `src/features/security/*`
- `src/features/privacy/*`
- `src/features/forms/*`
- `src/features/imports/*`
- `src/features/reporting/*`
- `src/features/reports/*`
- `src/lib/notifications/*`, `src/lib/security/*`, `src/lib/audit/*`
- `sst.config.ts`
