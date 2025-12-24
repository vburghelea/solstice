# SIN Implementation Technical Debt & Decisions

This document tracks technical debt, design decisions, and follow-up items discovered during the SIN v2 backlog implementation (Issues 01-11).

## Implementation Date

- Started: 2025-12-23
- Completed: 2025-12-24
- Status: Deployed to dev
- Dev URL: https://d151to0xpdboo8.cloudfront.net

---

## Design Decisions

### 1. Organization Context Header Pattern

**Decision:** Use `x-organization-id` header for org-scoped admin views (audit logs, security events, reports).

**Rationale:**

- Consistent with existing patterns in codebase
- Allows global admins to operate without org context
- Client already has org context in most admin views

**Follow-up needed:**

- [ ] Ensure all admin UI components send this header
- [ ] Document header requirement in API docs

### 2. Audit Log Immutability

**Decision:** Never delete audit logs from retention jobs; skip with `reason: "immutable_audit_log"`.

**Rationale:**

- Hash chain integrity depends on all logs existing
- WORM storage/Glacier archival would be better long-term but this stops data loss immediately

**Technical Debt:**

- [ ] Implement proper WORM storage or Glacier archival for old audit logs
- [ ] Add audit log archival to S3 Glacier after X years
- [ ] Consider audit log compression/aggregation for storage efficiency

### 3. Notification Queue Fallback

**Decision:** Queue falls back to direct send when `SIN_NOTIFICATIONS_QUEUE_URL` is not set.

**Rationale:**

- Dev-friendly: works without SQS in local development
- Production uses SQS for reliability and rate limiting

**Follow-up needed:**

- [ ] Set up SQS queue in production
- [ ] Configure dead-letter queue for failed notifications
- [ ] Add CloudWatch alarms for DLQ depth

### 4. Email Configuration

**Decision:** Using `austinwallacetech@gmail.com` as initial FROM address.

**Technical Debt:**

- [ ] Set up proper SES domain verification for `@quadball.ca`
- [ ] Configure SPF/DKIM/DMARC for deliverability
- [ ] Switch to production email domain

### 5. Step-Up Auth Session Extraction

**Decision:** Best-effort extraction of session timestamps with multiple fallback property names.

**Rationale:**

- Better Auth session structure varies by version/config
- Fallback approach handles common patterns

**Verified (2025-12-23):**

- Session table has `createdAt` field which we use as authentication time
- User table has `mfaRequired` and `twoFactorEnabled` for MFA state
- No dedicated `lastMfaVerifiedAt` field exists in current schema

**Technical Debt:**

- [x] Verify actual Better Auth session structure - DONE (uses `createdAt`)
- [ ] Add `lastMfaVerifiedAt` column to session table for precise MFA tracking
- [ ] Consider using Better Auth's built-in re-auth flow if available

---

## Technical Debt Items

### High Priority

1. **SQS Consumer Worker**
   - Need Lambda/worker to process notification queue
   - Should handle retries, DLQ routing
   - Status: Implemented; wired to SQS in `sst.config.ts` with DLQ + batch settings

2. **Step-Up Auth UI Handler**
   - UI needs to handle "Re-authentication required" errors
   - Should show MFA re-verification modal
   - Status: Implemented (global re-auth dialog + MFA step-up prompt)

3. **Integration Tests for Permission Checks**
   - Issue 11 only adds unit tests for file validation
   - Need E2E tests for auth guards on audit/security/reporting endpoints
   - Status: Added initial E2E coverage (SIN admin access, report export, file upload validation)

### Medium Priority

4. **Org Context Middleware**
   - Consider creating middleware that extracts org context once
   - Would reduce repeated header parsing in each endpoint
   - Status: Deferred

5. **Field-Level ACL Configuration**
   - Current sensitive fields list is hard-coded
   - Should be configurable per-org or per-report
   - Status: Deferred

6. **Batch Export Performance**
   - Large exports could timeout
   - Consider streaming or async export with download link
   - Status: Deferred

### Low Priority

7. **Notification Templates**
   - Email templates are plain text
   - Should add HTML templates with branding
   - Status: Deferred

8. **Rate Limiting on Exports**
   - No rate limiting on export endpoints beyond MFA
   - Could be abused for data exfiltration
   - Status: Deferred

---

## Environment Variables Added

```bash
# Required for notifications
SIN_NOTIFICATIONS_QUEUE_URL=  # SQS queue URL (set via SST queue output)
SIN_NOTIFICATIONS_FROM_EMAIL= # set via SST secret: SinNotificationsFromEmail
SIN_NOTIFICATIONS_REPLY_TO_EMAIL= # set via SST secret: SinNotificationsReplyToEmail

# Already existing (used by S3 cleanup)
# SIN_ARTIFACTS_BUCKET - set via SST
```

---

## Dependencies Added

```bash
pnpm add @aws-sdk/client-sqs @aws-sdk/client-ses
```

---

## Files Modified

### Response 1 (Access Control)

- `src/features/audit/audit.queries.ts` - Added auth + org scoping
- `src/features/security/security.queries.ts` - Added auth + org scoping
- `src/features/reporting/reporting.mutations.ts` - Added permission checks
- `src/features/reports/reports.mutations.ts` - Added org scoping + permission-based ACL

### Response 2 (Privacy/Notifications)

- `src/lib/privacy/retention.ts` - Added audit log immutability + S3 cleanup
- `src/features/privacy/privacy.mutations.ts` - Added S3 cleanup to DSAR erasure
- `src/lib/privacy/submission-files.ts` - NEW: S3 deletion helper
- `src/lib/notifications/queue.ts` - Replaced with SQS integration
- `src/lib/notifications/send.ts` - Replaced with SES integration
- `src/lib/notifications/scheduler.ts` - Added idempotency

### Response 3 (Forms/Testing)

- `src/features/forms/forms.utils.ts` - Added file validation helpers
- `src/features/forms/forms.mutations.ts` - Added server-side file validation
- `src/lib/auth/guards/step-up.ts` - Added re-auth window check
- `src/shared/lib/xlsx.ts` - NEW: XLSX generation helper
- `src/features/forms/__tests__/forms.utils.test.ts` - NEW: File validation tests
- `src/shared/lib/__tests__/xlsx.test.ts` - NEW: XLSX tests

### Infrastructure

- `src/cron/notification-worker.ts` - NEW: SQS consumer (if not using Lambda)
- `sst.config.ts` - Added SIN notification queue + DLQ + subscriber wiring

---

## Testing Notes

### Manual Testing Checklist

- [ ] Audit logs: Non-admin gets 403, org admin sees only their org
- [ ] Security events: Self-access works, cross-user requires org context
- [ ] Reporting: Only global admin can create cycles/tasks
- [ ] Report export: Org scoping enforced, sensitive fields redacted
- [ ] DSAR erasure: S3 files deleted before DB anonymization
- [ ] Notifications: Email sent via SES (check inbox)
- [ ] File upload: Server rejects oversized/wrong-type files

### E2E Tests Needed

- [x] `sin-admin-access.auth.spec.ts` - Admin guard for SIN dashboard
- [x] `report-export.auth.spec.ts` - Export download flow (admin)
- [x] `file-upload-validation.auth.spec.ts` - Upload rejection on invalid mime type
- [ ] `audit-access.auth.spec.ts` - Endpoint-level permission checks on audit APIs
- [ ] `security-access.auth.spec.ts` - Endpoint-level permission checks on security APIs

---

## Rollback Plan

If issues arise:

1. Revert the specific file changes
2. The changes are additive (add guards) so reverting removes protection
3. No database migrations in this change
4. No breaking API changes (just added auth requirements)

---

## Post-Implementation Checklist

- [x] All patches applied and tested
- [x] Dependencies installed (`@aws-sdk/client-sqs`, `@aws-sdk/client-ses`, `@types/aws-lambda`)
- [ ] Environment variables configured in SST (added to `sst.config.ts`; secrets still need values)
- [ ] SQS queue created (configured in `sst.config.ts`; deploy pending)
- [ ] SES email verified
- [x] Deployed to dev (https://d151to0xpdboo8.cloudfront.net)
- [x] Basic testing passed (homepage, login page load)
- [ ] Manual testing of new features
- [ ] E2E tests passing
- [x] Documentation updated
