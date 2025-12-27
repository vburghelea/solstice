# 4b.md Review and Implementation Plan

## Scope

- Source doc: `docs/sin-rfp/5.2-pro-review-output/4b.md`
- Areas: audit logging, privacy/DSAR, notifications/email, retention

## Review of 4b.md vs current codebase

1. Audit log immutability not enforced at DB level

- Status: Partially confirmed.
- Evidence: DB trigger exists (`src/db/migrations/0010_audit_immutable.sql`) to block UPDATE/DELETE, but there is no privilege revocation in code/config and `src/db/schema/audit.schema.ts` does not encode immutability.

2. Hash chain can break due to clock skew + ordering by occurredAt

- Status: Confirmed.
- Evidence: `logAuditEntry` selects previous hash by `orderBy(desc(auditLogs.occurredAt))` and writes `occurredAt: new Date()`; verification orders by `occurredAt` (`src/lib/audit/index.ts`).

3. Hash chain can fork under concurrency (non-atomic prevHash selection)

- Status: Confirmed.
- Evidence: `logAuditEntry` reads the latest hash and inserts without a transaction/lock (`src/lib/audit/index.ts`).

4. Hash payload omits occurredAt/createdAt

- Status: Confirmed.
- Evidence: `payload` used for `entryHash` excludes timestamps and `id` (`src/lib/audit/index.ts`).

5. actorIp may be invalid for inet column

- Status: Confirmed.
- Evidence: `resolveRequestContext` uses raw `x-forwarded-for` header without parsing/validation (`src/lib/audit/index.ts`).

6. PII hashing/redaction is shallow; nested objects can leak

- Status: Confirmed.
- Evidence: `createAuditDiff` only diffs top-level keys and does not emit dotted paths (`src/lib/audit/index.ts`).

7. Metadata is not sanitized before hashing/storing

- Status: Confirmed.
- Evidence: `logAuditEntry` stores `metadata: input.metadata ?? {}` without sanitization (`src/lib/audit/index.ts`).

8. Double-sanitization can double-hash values

- Status: Confirmed.
- Evidence: `createAuditDiff` returns sanitized diffs, and `logAuditEntry` calls `sanitizeChanges` again; callers pass the sanitized diff into `logAdminAction` (`src/lib/audit/index.ts`, `src/features/forms/forms.mutations.ts`, `src/features/organizations/organizations.mutations.ts`).

9. Audit UI date filtering likely fails schema validation

- Status: Confirmed.
- Evidence: `listAuditLogsSchema` expects `z.iso.datetime()` while the UI uses `<Input type="date">` (YYYY-MM-DD) (`src/features/audit/audit.schemas.ts`, `src/features/audit/components/audit-log-table.tsx`).

10. Missing admin authorization on privacy admin mutations

- Status: Confirmed for `createPolicyDocument`, `updatePrivacyRequest`, `upsertRetentionPolicy`.
- Evidence: Only feature flag + session check, no `requireAdmin` (`src/features/privacy/privacy.mutations.ts`).

11. getLatestPolicyDocument can return unpublished/future policies

- Status: Confirmed.
- Evidence: Query orders by `effectiveDate` only, no `publishedAt` or effective-date filter (`src/features/privacy/privacy.queries.ts`).

12. DSAR export likely includes secrets/tokens from auth tables

- Status: Confirmed.
- Evidence: Export payload includes full `account`, `session`, `twoFactor`, and `verification` rows (`src/features/privacy/privacy.mutations.ts`).

13. DSAR handlers do not validate request type/status

- Status: Confirmed.
- Evidence: `generatePrivacyExport` and `applyPrivacyErasure` operate on any request without type/status gating (`src/features/privacy/privacy.mutations.ts`).

14. DSAR correction type exists but no workflow

- Status: Confirmed.
- Evidence: `correction` is selectable in UI and in schema, but there is no request details capture or admin handling beyond status changes (`src/features/privacy/components/privacy-dashboard.tsx`, `src/features/privacy/privacy.schemas.ts`, `src/features/privacy/components/privacy-admin-panel.tsx`).

15. DSAR export stored to S3 without explicit encryption/retention controls

- Status: Confirmed.
- Evidence: `PutObjectCommand` lacks SSE-KMS or retention tags (`src/features/privacy/privacy.mutations.ts`).

16. DSAR download endpoint doesn't enforce "completed" state or log access

- Status: Confirmed.
- Evidence: `getPrivacyExportDownloadUrl` signs any `resultUrl` and does not log an audit event (`src/features/privacy/privacy.queries.ts`).

17. DSAR erasure does not remove DSAR export artifacts

- Status: Confirmed.
- Evidence: `applyPrivacyErasure` deletes submission files but does not delete `privacy/exports/...` objects (`src/features/privacy/privacy.mutations.ts`).

18. DSAR erasure leaves user-linked preference data behind

- Status: Confirmed.
- Evidence: `notificationPreferences` are not removed in `applyPrivacyErasure` (`src/features/privacy/privacy.mutations.ts`).

19. File erasure path can drop DB rows even if S3 deletion fails

- Status: Partially confirmed.
- Evidence: `deleteFormSubmissionFiles` throws on S3 errors by default, but `applyPrivacyErasure` does not reconcile `deleted < attempted` and still deletes DB rows when it proceeds (`src/lib/privacy/submission-files.ts`, `src/features/privacy/privacy.mutations.ts`).

20. Retention enforcement/archival/purge not present

- Status: Partially confirmed.
- Evidence: A retention cron exists (`src/cron/enforce-retention.ts`, `src/lib/privacy/retention.ts`, `sst.config.ts`), but it only purges selected tables and does not archive to Glacier/Object Lock or handle DSAR export artifacts.

21. Legal hold capability not modeled as required

- Status: Confirmed.
- Evidence: Only a boolean `legalHold` exists on retention policies; no per-record/legal hold table or logic (`src/db/schema/privacy.schema.ts`, `src/lib/privacy/retention.ts`).

22. Any authenticated user can create arbitrary notifications (and spoof audit actor)

- Status: Confirmed.
- Evidence: `createNotification` has no session check and logs `actorUserId` from `data.userId` (`src/features/notifications/notifications.mutations.ts`).

23. Missing admin checks for notification admin endpoints

- Status: Confirmed.
- Evidence: `createNotificationTemplate` and `scheduleNotification` require session only; no `requireAdmin` (`src/features/notifications/notifications.mutations.ts`).

24. Notification dispatch/digest audit entries attribute the actor incorrectly

- Status: Confirmed.
- Evidence: `NOTIFICATION_DISPATCH` and `NOTIFICATION_DIGEST_SENT` set `actorUserId` to recipient user ID (`src/lib/notifications/send.ts`, `src/lib/notifications/digest.ts`).

25. Email idempotency breaks when in-app is disabled

- Status: Confirmed.
- Evidence: Email idempotency relies on `notifications.metadata.emailSentAt`, which is only set when an in-app notification is written (`src/lib/notifications/send.ts`).

26. Scheduled notifications don't support org/role broadcasts

- Status: Confirmed.
- Evidence: `processScheduledNotifications` throws when `job.userId` is null (`src/lib/notifications/scheduler.ts`).

27. SendGrid email path still exists

- Status: Confirmed.
- Evidence: `src/lib/email/sendgrid.ts` is used in membership/team workflows; no production guard beyond `SENDGRID_API_KEY` presence.

## Implementation plan

### Track A -- Audit log integrity and PII handling

1. Make immutability explicit.

- Keep the trigger migration and add DB role grants/revocations so the app role cannot UPDATE/DELETE `audit_logs`.
- Add a migration test (or a verification script) that asserts UPDATE/DELETE fails in non-superuser roles.

2. Stabilize hash chain ordering and timestamps.

- Use DB-time for `occurredAt` (omit app-supplied timestamp) and rely on a deterministic order like `createdAt, id` for both `prevHash` selection and verification.
- Add a secondary sort to eliminate ambiguous ordering (`orderBy(createdAt, id)` everywhere).

3. Prevent concurrent chain forks.

- Wrap `logAuditEntry` in a transaction and take a `pg_advisory_xact_lock` (global or per-org chain).
- Alternative: maintain a chain-head row/table with `SELECT ... FOR UPDATE`.

4. Strengthen the hash payload.

- Include `occurredAt` (and ideally `id`) in the hashed payload.
- If `id` is included, generate it in code (UUID) before hashing so the value is stable.

5. Normalize actor IPs.

- Parse `x-forwarded-for` and validate with `net.isIP`; fall back to `x-real-ip` or null.
- Store a single IP in `inet` and discard invalid values.

6. Fix nested PII handling.

- Replace `createAuditDiff` with a deep diff that emits dotted paths (e.g., `emergencyContact.phone`).
- Apply `sanitizeChanges` to nested keys and add tests for nested PII and token redaction.

7. Sanitize metadata.

- Add `sanitizeMetadata` to redact `token|secret|password|mfaSecret` keys and optional allowlists per action.
- Apply before hashing and storing.

8. Remove double-sanitization.

- Make `createAuditDiff` return raw diffs and only sanitize in `logAuditEntry`, or mark sanitized diffs and skip re-sanitization.

9. Fix audit date filtering.

- Option A: accept date-only strings in `listAuditLogsSchema`.
- Option B: convert `YYYY-MM-DD` to ISO datetimes in the UI before calling the server fn.

### Track B -- Privacy/DSAR authorization and workflow

1. Require admin (and step-up) for admin mutations.

- Add `requireAdmin` to `createPolicyDocument`, `updatePrivacyRequest`, and `upsertRetentionPolicy`.
- Consider `requireRecentAuth` for policy/retention changes and DSAR exports.

2. Gate policy visibility.

- Filter `getLatestPolicyDocument` to `publishedAt IS NOT NULL` and `effectiveDate <= today`.

3. Enforce DSAR request type/status transitions.

- `generatePrivacyExport`: only `type in (access, export)` and `status in (pending, processing)`.
- `applyPrivacyErasure`: only `type = erasure` and `status in (pending, processing)`.
- Reject re-processing completed/rejected requests.

4. Redact secrets in export payloads.

- Build explicit DTOs for `account`, `session`, `twoFactor`, and `verification` tables.
- Exclude tokens/secrets and sensitive hashes; consider omitting sessions entirely or reducing to metadata.

5. Harden DSAR export storage.

- Set `ServerSideEncryption: "aws:kms"` and `SSEKMSKeyId` in `PutObjectCommand`.
- Add object tags/metadata for retention tracking (e.g., `dsar=true`, `expiresAt=...`).
- Consider dedicated bucket/prefix with Object Lock policy enforced in infra.

6. Log and gate DSAR downloads.

- Require `request.status === "completed"` before signing.
- Add audit log `PRIVACY_EXPORT_DOWNLOAD` with actor + requestId.
- Require step-up for admins accessing another user's export.

7. Make erasure complete and reliable.

- Delete DSAR export objects under `privacy/exports/${userId}/`.
- Delete `notificationPreferences` (and audit the removal).
- If `deleted < attempted`, mark files as `pending_delete` and retry via a job.

8. Implement correction workflow.

- Extend `privacy_requests` with `details` JSON or a dedicated `privacy_request_corrections` table.
- Capture correction details in the user request UI and expose admin review/apply actions.
- Audit correction actions with before/after diffs.

### Track C -- Retention and legal holds

1. Expand retention enforcement.

- Add retention for DSAR export objects and other artifacts.
- Implement audit log archival to S3 Glacier + Object Lock; log archive/purge actions.

2. Add legal hold modeling.

- Introduce `legal_holds` with scope (`user|org|record`) and reason.
- Update retention enforcement to skip held records and respect release events.

3. Observability.

- Emit audit/metrics for retention runs and failures; add CloudWatch alarms for cron errors.

### Track D -- Notifications and email integrity

1. Lock down notification creation.

- Require session in `createNotification` or move it to a server-only/internal function.
- Set audit `actorUserId` from the authenticated user or `null` for system actions.

2. Require admin for templates/scheduling.

- Add `requireAdmin` to `createNotificationTemplate` and `scheduleNotification`.
- Force `isSystem = false` for non-admin callers.

3. Correct audit actor for dispatch/digest.

- Use `actorUserId: null` (system) or pass an explicit initiator through the dispatch pipeline.
- Keep recipient in `targetId`/metadata instead of `actorUserId`.

4. Fix email idempotency without in-app notifications.

- Add a `notification_dispatches` table or always write a minimal dispatch record to track `emailSentAt`.

5. Support org/role broadcasts.

- In `processScheduledNotifications`, resolve recipients by org membership and `roleFilter` when `userId` is null.
- Enqueue per-user notifications with stable ids and retry-safe behavior.

6. Enforce SES-only in SIN production.

- Add an explicit allowlist flag to enable SendGrid in non-prod only.
- Document and validate the data residency posture in deployment config.

### Testing and verification

- Unit tests: deep diff + redaction, metadata sanitization, hash chain ordering and concurrency locks.
- Integration tests: DSAR request type/status gating, export redaction, download audit logs, erasure cleanup.
- Notification tests: admin gating, audit actor correctness, email idempotency without in-app.
- Retention tests: cron applies policies, legal holds prevent purge, DSAR exports removed on erasure.

## Open questions

1. Should audit hash chains be global, per-org, or per-tenant (affects locking strategy)?
2. What retention window should DSAR exports follow, and should they be user-accessible directly?
3. Is SendGrid needed for non-SIN tenants, or can it be removed entirely?
