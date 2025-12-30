# Stream H Context Summary (Privacy, DSAR, retention)

## Sources consulted

- `docs/sin-rfp/archive/superseded/5.2-pro-review-output/consolidated-backlog.md` (Stream H tasks)
- `docs/sin-rfp/archive/superseded/5.2-pro-review-output/4b-implementation.md` (privacy/DSAR + retention findings)
- `docs/sin-rfp/archive/superseded/5.2-pro-review-output/6-implementation.md` (step-up usage gaps)
- `docs/sin-rfp/archive/superseded/5.2-pro-review-output/d0-decision-analysis.md` (D0.13 retention guidance)
- `docs/sin-rfp/decisions/ADR-2025-12-26-d0-13-dsar-export-retention.md`
- `docs/sin-rfp/phase-0/audit-retention-policy.md`

## D0 decisions applied

- **D0.13 (DSAR export retention)**: retain DSAR exports for **14 days** with
  auto-delete and explicit tagging. Exports are user-accessible within the
  window; admins need step-up when accessing another user’s export.

## Privacy/DSAR findings (4b-implementation, Track B)

- **Missing admin + step-up checks** on privacy admin mutations (policy create,
  retention policy updates, request updates) and DSAR actions. Requires
  `requireAdmin` + `requireRecentAuth`.
- **Policy gating**: `getLatestPolicyDocument` returns unpublished/future
  policies; must filter to `publishedAt IS NOT NULL` and `effectiveDate <= today`.
- **DSAR export secrets**: export payload includes `account`, `session`,
  `twoFactor`, `verification` rows with tokens, secrets, and codes. Replace with
  explicit DTOs that exclude sensitive fields.
- **Request type/status enforcement**: `generatePrivacyExport` and
  `applyPrivacyErasure` operate on any request. Must enforce correct
  type/status transitions and block re-processing completed/rejected requests.
- **Export storage hardening**: DSAR exports are written to S3 without explicit
  SSE-KMS or retention tags/metadata. Add SSE-KMS + tagging/metadata for expiry.
- **Download gating + audit**: export download doesn’t enforce `completed`
  status or log access. Add status checks + audit log event, and require step-up
  for admins downloading other users’ exports.
- **Erasure completeness**: erasure doesn’t delete DSAR export objects or
  notification preferences, and file deletion can partially fail without
  reconciliation. Add cleanup + partial delete handling.
- **Correction workflow**: `correction` request type exists but has no details
  capture or admin apply flow with audit diffs.

## Retention + legal hold findings (4b-implementation, Track C)

- Retention cron exists but **does not handle DSAR exports**, **does not archive
  audit logs to Glacier/Object Lock**, and **does not provide observability**.
- **Legal hold** is a boolean on retention policy only; missing per-scope legal
  holds. Policy requires record/user/org-level holds that prevent purges until
  released.

## Audit retention policy requirements (phase-0)

- **Audit logs**: 7 years, immutable, archived to S3 Glacier with Object Lock.
- **Retention enforcement**: purge only after retention expiry and log archive/
  purge actions.
- **Legal holds**: applies to record/user/org scope; held records are exempt.

## Implementation reminders

- Use `requireRecentAuth` for DSAR/admin actions (Stream A dependency complete).
- Use audit logging from `~/lib/audit` for DSAR downloads, correction apply,
  retention actions.
- Server-only imports must remain inside handlers or use `serverOnly()`.
