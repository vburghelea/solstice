# TICKET: PIPA Compliance (BC Personal Information Protection Act)

**Status**: Not Started
**Priority**: P0 (Compliance Blocker)
**Component**: Privacy / Legal
**Date**: 2026-01-10
**Updated**: 2026-01-10
**Author**: Codex (AI Assistant)

---

## Summary

BC PIPA requires explicit duties that go beyond our current privacy policy and DSAR tooling. This ticket adds (a) drop-in policy language, (b) breach notification and privacy officer processes, and (c) specific engineering changes to enforce PIPA timelines, retention minimums, correction propagation, consent withdrawal, and artifact destruction. Production/legal sign-off is required before publishing.

---

## Draft Policy Language (ready to insert into Privacy Policy)

Use the blocks below inside the privacy policy managed via `privacy_policy` documents (admin UI + seeds in `scripts/seed-*.ts`). Replace bracketed fields with final contact info.

**Privacy Officer**  
“We have appointed a Privacy Officer responsible for PIPA compliance. Contact: [Name], [title], [email], [phone], [mailing address]. The Privacy Officer can answer questions, handle access and correction requests, and manage privacy complaints.”

**Purpose of Collection and Use**  
“We collect personal information to create and manage member accounts, administer teams and events, process payments, enforce eligibility rules, deliver communications you request, and meet our legal obligations. We limit collection to what is reasonably necessary for these purposes.”

**Consent and Withdrawal**  
“We rely on your consent where required by law. You may withdraw consent to non-essential uses (e.g., marketing emails, analytics) at any time in your account settings or by contacting the Privacy Officer. Withdrawal does not affect uses required to deliver the service, comply with law, or resolve billing, security, or disciplinary matters.”

**Collection Notice**  
“When we collect personal information, we tell you what we are collecting, why we need it, and how to contact us. Where collection is optional, you can decline or withdraw.”

**Employee/Volunteer Information**  
“For employees, contractors, and volunteers, we collect and use personal information for employment or engagement purposes (e.g., payroll, scheduling, performance, security). We provide notice of these purposes at or before collection.”

**Service Providers and Storage Location**  
“We host data in Canada (AWS ca-central-1). We use service providers (e.g., email delivery, payment processing, analytics) that must protect personal information to standards comparable to PIPA. Some providers may access data from outside Canada; when this occurs, we use contractual and technical safeguards to ensure comparable protection.”

**Access and Correction Rights**  
“You may request access to, or correction of, your personal information. We will respond within 45 days (or notify you if an extension is needed) and will notify applicable third parties of corrections where appropriate.”

**Retention and Disposal**  
“We keep personal information only as long as needed for the purposes described above or as required by law. If information was used to make a decision about you, we keep it for at least one year after the decision. When no longer required, we securely delete or anonymize the data and related artifacts.”

**Security and Breach Notification**  
“We use administrative, technical, and physical safeguards appropriate to the sensitivity of the information. If a breach creates a real risk of significant harm, we will notify the BC Office of the Information and Privacy Commissioner and affected individuals as required by law.”

---

## Engineering / Operational Changes Needed

### 1) Privacy Officer visibility and routing

- Add Privacy Officer contact block to the privacy policy content (`src/features/privacy/privacy.mutations.ts` + seeded documents in `scripts/seed-sin-data.ts`, `scripts/seed-e2e-data.ts`).
- Surface contact info in UI footer/help (e.g., `src/routes/__root.tsx` layout footer or help modal) and in DSAR confirmation emails.

### 2) Breach notification workflow (PIPA ss. 34, 36)

- Create runbook `docs/runbooks/pipa-breach-response.md` with OIPC reporting steps, harm assessment, and timelines.
- Add admin UI panel in `src/routes/dashboard/admin/sin/privacy.tsx` to log incidents (date, risk rating, OIPC report filed yes/no, affected users count, notices sent).
- Persist incident records via `securityEvents` or a new `privacyIncidents` table; ensure audit logging on create/update.

### 3) Access/correction SLA tracking (45 days; ss. 28–31)

- Extend `privacy_requests` schema (`src/db/schema/privacy.schema.ts`) with `dueAt`, `extendedUntil`, `deadlineReason`, and `oipcNotifiedAt` (when ignoring requests per s.37 or extensions per s.31).
- Set `dueAt = requestedAt + 45 days` on creation; update `privacy.mutations.ts` to enforce state transitions and prevent closure past due without an extension reason.
- Add UI badges and filters in admin privacy dashboard (`src/features/privacy/components/privacy-admin-panel.tsx`) for “Due soon/Overdue”; send reminder emails via notifications service.

### 4) Correction propagation to third parties (s.24)

- Add fields to `privacy_requests` (or a child table) to capture downstream recipients and a `correctionNotifiedAt` timestamp.
- Update the correction flow in `privacy.mutations.ts` to require recipient list and to trigger notifications; log proof in audit trail.

### 5) Retention minimums for decisions (s.35)

- Enforce a floor of 365 days for data used to make a decision about an individual (e.g., membership eligibility, discipline, payments). Add validation in retention policy upsert (`privacy.mutations.ts`) and in `applyRetentionPolicies` to skip/flag policies below 365 days for those data types.
- Update any seeded retention policies in `scripts/seed-retention-policies.ts` that are <365 days for decision data.

### 6) Secure disposal of artifacts (s.34–35)

- In DSAR erasure (`src/features/privacy/privacy.mutations.ts`), delete S3 artifacts under `privacy/exports/${userId}/` and any export/download staging buckets before deleting DB rows. Add audit entries for each deletion batch.
- Add tagging + KMS enforcement on DSAR export writes (PutObjectCommand) to ensure encrypted at rest with retention tags.

### 7) Consent and withdrawal controls (ss. 6–9)

- Add granular toggles for non-essential processing (marketing, analytics, research) in profile/privacy settings UI (`src/features/profile` + `privacy.settings` forms) with defaults off where not required.
- Store and honor these flags in notification/analytics services; ensure withdrawal propagates to message queues and third-party suppressions.

### 8) Collection notices at point of capture (s.10)

- Add inline notices to high-volume collection points (registration, team invite accept, form submissions). Update form components in `src/features/forms` to accept a `collectionNotice` prop and render concise purpose + contact info.

### 9) Employee/volunteer PI notices (ss.13, 16, 19)

- Create an employee/volunteer privacy notice document (`docs/policies/employee-privacy-notice.md`) and link it in any staff/volunteer onboarding flows. If staff use the same auth, add a banner or checkbox on first login.

### 10) Service provider and cross-border disclosures

- Update privacy policy to name core processors (SendGrid, Square, any analytics) and specify when data may be accessed outside Canada. Add a short “Questions about storage location” contact line to the policy and to the DSAR confirmation email template.
- Confirm vendor DPAs reflect PIPA and “comparable protection”; store signed copies reference in `docs/vendor/` (not in repo if sensitive, but add pointers).

### 11) Reporting and evidence

- Add a section to `docs/sin-rfp/response/full-proposal-response-combined.md` summarizing PIPA alignment, deadlines, and breach process once implemented.
- Update E2E/privacy integration tests (`src/features/privacy/__tests__/privacy.integration.test.ts`) to cover deadline computation, export deletion, and correction notifications.

---

## Acceptance Criteria

- Privacy policy updated with the draft language (or equivalent counsel-approved text) and published in the admin UI + seeds.
- DB + UI support 45-day DSAR deadlines, extensions, and correction recipient notifications; overdue highlighting and reminders work.
- Retention policies enforce ≥365 days for decision records; retention job skips or logs violations.
- DSAR erasure removes S3 export artifacts and logs deletions; export writes use SSE-KMS and tagging.
- Breach runbook exists; admin UI allows breach/notification logging with audit entries.
- Consent withdrawal toggles exist and propagate to messaging/analytics; collection notices appear at capture points.
- Employee/volunteer notice available and surfaced in onboarding.
- Updated documentation and tests merged and green.

---

## References

- PIPA (BC) https://www.bclaws.gov.bc.ca/civix/document/id/complete/statreg/00_03063_01
- `src/features/privacy/privacy.mutations.ts`, `src/features/privacy/privacy.queries.ts`
- `src/lib/privacy/retention.ts`, `src/cron/enforce-retention.ts`
- `src/db/schema/privacy.schema.ts`
- `scripts/seed-sin-data.ts`, `scripts/seed-e2e-data.ts`, `scripts/seed-retention-policies.ts`
- `docs/sin-rfp/response/full-proposal-response-combined.md`
