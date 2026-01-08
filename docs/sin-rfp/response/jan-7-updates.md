# Jan 7 Updates

This document captures the updates I recommend based on the proposal response
and the Round 2 comment set. Each item notes the owner or dependency needed to
resolve it (you, repo verification, collaborators, viaSport), and whether it is
purely a doc change or requires code/infra work.

## Legend

- Doc-only: Update text in the proposal response.
- Code/Infra: Requires implementation or environment changes.
- Evidence: Run/collect results to back claims.

## Summary of Priorities

1. Resolve explicit comment items from Round 2.
2. Clear all placeholders/TBDs or replace with scheduled dates.
3. Ensure any new claims (Backup Vault Lock, DR drills, retention durations)
   are implemented or clearly scheduled.

## Items from Round 2 Comments

1. Performance row "final validation run TBD" -> scheduled language

- Doc-only: `docs/sin-rfp/response/full-proposal-response-combined.md:58`
- Proposed update: "Scheduled for Pre-Launch Phase" or a real date.
- Owner: You (decision on schedule wording).
- Evidence: If a specific date is chosen, confirm it matches the project plan.

2. Key Highlights timeline phrasing (community engagement)

- Doc-only: `docs/sin-rfp/response/full-proposal-response-combined.md:79`
- Proposed update: Emphasize meaningful community engagement, not checkbox
  participation.
- Owner: You (approve tone and phrasing).

3. Soleil bio acknowledgement

- No action needed (already added per comment), but verify if the current
  bio text reflects the final wording.
- Owner: Repo check (confirm the text in the combined doc matches the new bio).

4. Proposed Solution Statement (community-led framing)

- Doc-only: `docs/sin-rfp/response/full-proposal-response-combined.md:420`
- Proposed update: Frame the team as community-led/connected, highlight
  Soleil as system navigator connecting to sport community, and remove
  the placeholder "[Soleil to confirm wording]".
- Owner: You (approve exact wording).
- Collaborator input: Soleil (verify framing, approve bio/statement).

5. Team location clarification (Ruslan is Montreal-based, not Soleil)

- Doc-only: `docs/sin-rfp/response/full-proposal-response-combined.md:427`
- **Clarification**: Soleil IS BC-based. Ruslan is Montreal-based (1 of 7).
- Current "BC based" claim is accurate for 6 of 7 team members.
- Proposed options:
  - Keep as-is (6/7 is "BC based" enough)
  - Change to "primarily BC-based" or "headquartered in BC"
  - Add qualifier: "BC-based team with additional expertise from Quebec"
- Owner: You (decide if any change needed).

6. Backup protection (AWS Backup Vault Lock)

- Doc change: `docs/sin-rfp/response/full-proposal-response-combined.md:695`
- Infra change: Implement AWS Backup Vault Lock for backups.
- Owner: Repo + infra check (confirm if vault lock is already in SST or
  needs to be added).
- Collaborator input: Infra/Sec advisors if needed for configuration review.

7. DR drill scheduled week

- Doc-only: `docs/sin-rfp/response/full-proposal-response-combined.md:706`
- Proposed update: Replace "Final production drill TBD" with
  "Scheduled for Implementation Week X" or Pre-Launch Phase.
- Owner: You (pick the week/phase).
- Evidence: Run or schedule a drill before final submission.

8. Help desk low priority target ("Best effort" -> fixed target)

- Doc-only: `docs/sin-rfp/response/full-proposal-response-combined.md:1270`
- Also update the Sev 4 table: `docs/sin-rfp/response/full-proposal-response-combined.md:1320`
- Proposed update: "10 Business Days" or "Next Release Cycle".
- Owner: You (pick the target language).
- Repo check: Verify any in-product SLA values align if surfaced in UI.

9. Replace ASCII architecture diagram

- Doc-only: `docs/sin-rfp/response/full-proposal-response-combined.md:634`
- Proposed update: Replace ASCII block with `high-level-system-architecture-v2.svg`
  from `docs/sin-rfp/response/08-appendices/diagrams/`.
- Owner: Repo check (confirm which diagram is the canonical final).

10. Add transit encryption and SSL to Regulatory Alignment table

- Doc-only: `docs/sin-rfp/response/03-service-approach/data-warehousing/final.md:47`
- Also: `docs/sin-rfp/response/full-proposal-response-combined.md:671`
- Comment: "Worth adding data transit is encrypted and APIs are SSL enabled"
- Current text in PIPEDA row: "Canadian data residency, encryption, access controls, audit logging"
- Proposed update: "Canadian data residency, **TLS 1.2+ encryption in transit**, encryption at rest, access controls, audit logging"
- Or add new row: "Transport security | All APIs served over HTTPS (TLS 1.2+), no unencrypted endpoints"
- Owner: Doc-only update.

11. Highlight encryption layers in Security Model Summary

- Doc-only: `docs/sin-rfp/response/01-executive-summary/final.md:30`
- Also: `docs/sin-rfp/response/full-proposal-response-combined.md:30`
- Comment: "I would highlight data security encryption at rest, in transit and table based encryption for processing controls"
- Current text: "encryption in transit and at rest"
- Proposed update: Expand to explicitly list all three encryption layers:
  - **At rest**: AES-256 via AWS KMS for RDS, S3, and backups
  - **In transit**: TLS 1.2+ for all API endpoints and database connections
  - **Processing controls**: PostgreSQL column-level encryption for highly sensitive fields (e.g., TOTP secrets)
- Owner: Doc-only update.

## Other Placeholders / TBDs in the Combined Response

### Performance and Validation — SCHEDULED IMMINENT

- "Final validation run TBD" appears in multiple sections.
- Doc-only updates:
  - `docs/sin-rfp/response/full-proposal-response-combined.md:58`
  - `docs/sin-rfp/response/full-proposal-response-combined.md:611`
  - `docs/sin-rfp/response/full-proposal-response-combined.md:1043`
  - `docs/sin-rfp/response/full-proposal-response-combined.md:1053`
  - `docs/sin-rfp/response/full-proposal-response-combined.md:1058`
  - `docs/sin-rfp/response/full-proposal-response-combined.md:3071`
- **Status**: Will execute load + Lighthouse tests on sin-perf this week.
- **Proposed language**: "Completed January 2026" (update after run)
- Evidence: Final load + Lighthouse runs in sin-perf.
- Owner: You (schedule), repo check (ensure results are captured).

### DR Drill — SCHEDULED IMMINENT

- "Final production drill TBD" and "final run TBD": `full-proposal-response-combined.md:706`
- **Status**: Will execute DR drill on sin-perf this week.
- **Proposed language**: "Completed January 2026" (update after run)
- **Rationale**: sin-perf is isolated, has production-like config, and can be
  reset freely. This provides sufficient validation evidence without risking
  UAT stakeholder data.

### Retention Durations — PROPOSED VALUES

- "Retention durations ... TBD": `full-proposal-response-combined.md:725`
- **Status**: Policy engine implemented; durations need final approval.

**Proposed retention schedule:**

| Data Type                | Retention | Archive           | Purge   | Rationale                                      |
| ------------------------ | --------- | ----------------- | ------- | ---------------------------------------------- |
| audit_logs               | 7 years   | 90 days → Glacier | Never   | Regulatory compliance, hash-chain immutability |
| form_submissions         | 3 years   | 1 year            | 5 years | Operational need + audit trail                 |
| form_submission_versions | 1 year    | —                 | 2 years | Historical edits, less critical                |
| submission_files         | 3 years   | 1 year            | 5 years | Aligns with submissions                        |
| dsar_exports             | 14 days   | —                 | 30 days | Short-lived user downloads                     |
| privacy_requests         | 3 years   | —                 | 5 years | Compliance documentation                       |
| import_job_errors        | 90 days   | —                 | 90 days | Debugging window (ADR D0.8)                    |
| notifications            | 90 days   | —                 | 90 days | Transient operational data                     |
| security_events          | 2 years   | —                 | 3 years | Incident investigation window                  |
| support_requests         | 3 years   | —                 | 5 years | Customer service history                       |

- Owner: You (approve durations), then seed script update if needed.

### DR + Retention Validation — USE sin-perf

- "Final DR and retention validation (TBD)": `full-proposal-response-combined.md:1463`, `full-proposal-response-combined.md:1710`
- **Status**: Will validate on sin-perf (not UAT).
- **Rationale**: sin-perf is purpose-built for validation, can be reset without
  impacting stakeholders, and has production-equivalent configuration.
- **Proposed language**: "Validated in performance environment January 2026"

### Templates, Metadata, and Content

- viaSport templates and field definitions: `full-proposal-response-combined.md:1558`
- Catalog taxonomy refinements: `full-proposal-response-combined.md:1637`
- Threshold tuning for data quality: `full-proposal-response-combined.md:1674`
- viaSport metadata configuration / UI refinement: `full-proposal-response-combined.md:1832`
- viaSport templates and sample data: `full-proposal-response-combined.md:2139`
- Guided walkthrough content review: `full-proposal-response-combined.md:2176`
- Help center content refinement: `full-proposal-response-combined.md:2208`
- Branding assets/theme configuration: `full-proposal-response-combined.md:2449`
- Owner: viaSport input required (templates, taxonomy, metadata, branding),
  collaborators (UX/content review), repo check for implementation status.
- Code/Infra: implement templates, metadata fields, and branding once inputs
  are received.

### Migration Pipelines

- Additional migration pipelines for org and user records: `full-proposal-response-combined.md:1749`
- Owner: You (prioritize), viaSport (legacy access + schema), repo check
  (pipeline status).
- Code/Infra: Build the pipelines and mapping once schema access is granted.

### DM-AGG-006 Upgrade — INTELLIGENT IMPORT NOW BUILT

The intelligent XLSX/CSV import feature (ticket: `docs/sin-rfp/tickets/TICKET-intelligent-xlsx-import.md`)
is now substantially complete and should be reflected in the proposal.

**Current proposal text** (`04-system-requirements/data-management-dm-agg/final.md:12`):
| DM-AGG-006 | Partial | Import wizard, file imports, ECS batch worker | Legacy extraction scope |

**Recommended update:**
| DM-AGG-006 | **Built** | Smart import wizard with error categorization, autofix, dynamic templates | Legacy extraction (awaiting BCAR/BCSI) |

**New capabilities to highlight in DM-AGG-006 detail section:**

1. **Intelligent Error Categorization**: Errors grouped by root cause (structural, data quality, completeness, referential) instead of row-by-row
2. **Pattern Detection**: 13 pattern detectors (email, date formats, phone, currency, postal codes, UUID, etc.) automatically identify column type mismatches
3. **Autofix with Confidence Scoring**: One-click fixes for column swaps, date format conversion, boolean normalization; dynamic confidence based on pattern match ratio, header hints, and sample size
4. **In-App Correction**: Inline cell editing with real-time validation, eliminating re-upload for minor fixes
5. **Dynamic Templates**: Generate XLSX/CSV templates from any form definition with field descriptions, example values, and Excel data validation dropdowns
6. **Virtualized Preview**: TanStack Virtual for 10k+ row previews without performance degradation
7. **Admin Template Management**: Template CRUD, version tracking, import history with rollback

**Files to update:**

- `04-system-requirements/data-management-dm-agg/final.md:12` (status table)
- `04-system-requirements/data-management-dm-agg/final.md:203` (DM-AGG-006 detail)
- `04-system-requirements/00-compliance-crosswalk/final.md:22` (crosswalk table)
- `full-proposal-response-combined.md:1464`, `:1531`, `:1722`

**Demo path update:**
Current: "Dashboard -> Imports -> New Import"
Proposed: "Dashboard -> Admin -> Imports (Smart wizard with autofix demo)"

### Training and Cohort Planning — POST-CONTRACT

- Cohort sizing and scheduling TBD: `full-proposal-response-combined.md:1179`
- Sample training materials review TBD: `full-proposal-response-combined.md:1221`
- **Status**: These are implementation activities that occur after contract award.
  Not blocking for proposal submission. Leave as "TBD pending contract award"
  or "To be scheduled during Implementation Phase."
- Owner: viaSport input + collaborators (UX/training) for content review.

### Team Bios — RESOLVED

**Will Siddall** (short bio - was placeholder):

> With 15+ years of development and business consulting experience across many industries, Will is ensuring a stable product can be delivered to customers with a focus on customer collaboration and user experience (UX).
>
> He's designed, delivered, and trained a variety of products for customers of all types and sizes, with most of his experience developing and delivering products to air-gapped environments. Industries he's supported in the past include mining, VFX, hydrography and ocean exploration, oil and gas, civil engineering and cadastral/bathymetric surveys.

- Location: `full-proposal-response-combined.md:322`, `:3186`

**Michael Casinha** (short bio - was placeholder):

> A seasoned 30 year veteran in the technology space, developing early DevOps practices in the dotcom era of the internet. Working with American banking companies like Bank of America, airline industry with Boeing and cutting edge quantum computing at 1Qbit. The one consistent thread with all the large and small enterprises is applying best practices in DevOps, encompassing agile, secure and consistent deployment practices into securely built and cloud environments in a consistent method.

- Location: `full-proposal-response-combined.md:359`

**Michael Casinha** (appendix bio - was placeholder):

> A 30+ year veteran of the dotcom internet era bringing generational lessons of best practices to an agile era of cloud development. Having worked with American Finance, Aviation and Canadian quantum computing startups. All relying on consistent, secure, repeatable development practices learned over years of successful achievements and hard lessons learned.

- Location: `full-proposal-response-combined.md:3197`

**Tyler Piller** (minor fix):

- Remove duplicate sentence: "He currently directs... ensuring that security decisions drive business success."
- Location: Team bios section

**Soleil Heaney** - Still needs:

- Confirm community-led framing language (comment [d])
- Location: `full-proposal-response-combined.md:317`, `:3182`

- Owner: Doc-only updates ready to apply.

### Project Start Date — POST-CONTRACT

- Project Start: TBD (contract award): `full-proposal-response-combined.md:2796`
- **Status**: Intentionally TBD. Keep as "Upon contract award" or similar.
  This is standard RFP language.

## Recommended Workstream Breakdown

### Needs Your Decision/Approval

- ~~Replace all "TBD" schedule language with approved phrasing or dates.~~
  **DECIDED**: Performance/DR = imminent (this week), training/project start = post-contract.
- ~~Decide on SLA low-priority target language.~~ **DECIDED**: "10 Business Days"
- ~~Decide on SLA auto-calculation.~~ **DECIDED**: Yes, implement auto-set based on priority.
- Confirm how to position community-led/connected framing in the
  Proposed Solution Statement. _(Still needs Soleil input)_
- Confirm whether "BC-based" language should be removed or qualified.
  _(Still needs Soleil input)_
- ~~Approve which architecture diagram is canonical.~~ **DECIDED**: Use v2 SVGs.
- **NEW**: Approve proposed retention durations (see table above).

### Needs Repo/Infra Verification — COMPLETED

- ~~Confirm current backup protection and whether AWS Backup Vault Lock exists
  in SST config.~~ **VERIFIED**: Not configured; will implement.
- ~~Confirm where SLA targets are surfaced in the product, if anywhere.~~
  **VERIFIED**: Schema exists, manual admin entry; will add auto-calculation.
- ~~Confirm retention duration configuration and legal hold defaults in code.~~
  **VERIFIED**: Implemented with seed script defaults.
- ~~Confirm migration pipelines status for org/user records.~~
  **VERIFIED**: Not implemented; awaiting viaSport legacy access.

### Needs Collaborator Input

- Soleil: bio + language for community-led framing.
- Will: bio for Appendix F.
- Michael: bio for Appendix F.
- UX/content partners: review help center and walkthrough copy once viaSport
  terminology is available.

### Needs viaSport Input

- Legacy system access + schema (BCAR/BCSI).
- Data dictionary, reporting metadata field definitions.
- Templates, sample data, taxonomy/tagging preferences.
- Branding assets (logo, colors, typography).
- Retention durations and escalation contacts for data quality thresholds.
- Training cohorts and schedule confirmation.

## Repo/Infra Verification Results (2026-01-07)

The following items were verified by scanning the codebase:

### 1. AWS Backup Vault Lock — NOT CONFIGURED

**Status**: Gap requiring implementation.

The `sst.config.ts` contains:

- RDS automated backups with retention (35 days for prod, 7 days for dev/perf)
- S3 Object Lock on `SinArtifacts` bucket (DSAR exports)
- S3 Object Lock on `SinAuditArchives` bucket (7-year GOVERNANCE mode for prod)
- CloudTrail bucket lifecycle (archive to Glacier after 90 days)

**Missing**: AWS Backup Vault Lock for RDS automated snapshots. This would provide
immutable backup protection beyond the standard RDS snapshot lifecycle.

**Action Required**:

- Add AWS Backup Vault resource to `sst.config.ts` (or via Pulumi aws.backup)
- Configure vault lock policy with GOVERNANCE or COMPLIANCE mode
- Reference: `sst.config.ts:140-165` (current RDS backup config)

### 2. Retention Policies — IMPLEMENTED

**Status**: Confirmed working.

- Retention policy engine: `src/lib/privacy/retention.ts` (647 lines)
- Cron job: `src/cron/enforce-retention.ts` (runs daily per `sst.config.ts:657-670`)
- Seed script: `scripts/seed-retention-policies.ts`
- Database schema: `src/db/schema/privacy.schema.ts:100-116`

**Default policies** (from seed script):
| Data Type | Retention | Archive After | Purge After |
|-----------|-----------|---------------|-------------|
| dsar_exports | 14 days | — | 30 days |
| audit_logs | 7 years | 90 days | Never (immutable) |
| form_submissions | 3 years | 1 year | 5 years |
| import_job_errors | 90 days | — | 90 days |

**Note**: Audit logs are marked immutable (hash chain integrity) and are archived
to S3 Glacier Deep Archive but never deleted.

### 3. DR Drill — EVIDENCE EXISTS

**Status**: Completed for sin-dev on 2025-12-30.

Evidence location: `docs/sin-rfp/review-plans/evidence/DR-DRILL-sin-dev-20251230.md`

- Snapshot restored in ~5 minutes (RTO target: 4 hours ✓)
- RPO for dev environments: 24h (daily snapshots)
- RPO for production: 1h (PITR enabled, Multi-AZ)
- Drill validated: connectivity, table counts, data integrity

**Final production drill** can be scheduled for Pre-Launch Phase once sin-prod
is ready for testing. The sin-dev drill serves as process validation.

### 4. SLA Targets in Product — PARTIALLY IMPLEMENTED

**Status**: Schema supports SLA but no fixed defaults in code.

- Support requests have `slaTargetAt` field (`src/db/schema/support.schema.ts:48`)
- Admins manually set SLA targets via datetime picker in admin panel
- No automatic calculation based on priority level

**Gap**: The proposal mentions specific SLA targets (e.g., "10 Business Days" for
low priority), but the product does not enforce or calculate these automatically.
This is acceptable if SLAs are contractual rather than system-enforced.

**If auto-calculation is desired**, add logic to:

- `src/features/support/support.mutations.ts` (on create/update)
- Map priority → default SLA offset (e.g., urgent=1 business day, low=10 days)

### 5. Architecture Diagrams — V2 EXISTS

**Status**: Canonical v2 diagrams available.

Location: `docs/sin-rfp/response/08-appendices/diagrams/`

Available diagrams:

- `high-level-system-architecture-v2.svg` ← Use for ASCII replacement
- `security-architecture-v2.svg`
- `multi-tenant-architecture-v2.svg`
- `data-flow-diagram-v2.svg`

**Action**: Replace ASCII diagram at line 634 with reference to
`high-level-system-architecture-v2.svg`.

### 6. Migration Pipelines — NOT IMPLEMENTED

**Status**: Pending viaSport legacy access.

No migration pipelines exist for org/user records from BCAR/BCSI. The import
infrastructure (`src/workers/import-batch.ts`, ECS task in `sst.config.ts:538-559`)
is ready, but legacy schema access is required to build the mappings.

### 7. Performance Testing — RUNBOOK EXISTS

**Status**: Ready to execute.

Runbook location: `docs/sin-rfp/review-plans/performance-test-runbook.md`

Prerequisites:

- Deploy `sin-perf` stage: `AWS_PROFILE=techdev npx sst deploy --stage sin-perf`
- Create perf test user (no MFA) for automation
- Generate 20M synthetic rows per runbook Phase 3

**I can execute this runbook** if you want to validate performance claims.

---

## In-Progress Work (2026-01-08)

### Security Scanning — NOW OPERATIONAL

The security CI/CD pipeline is now fully operational, validating the proposal claims.

**Implemented Workflows** (`.github/workflows/`):

| Tool              | Type             | Trigger                    | Status    |
| ----------------- | ---------------- | -------------------------- | --------- |
| Aikido            | SAST + Secrets   | push/PR to main            | ✓ Running |
| CodeQL            | SAST             | push/PR to main            | ✓ Running |
| ZAP               | DAST             | PR + weekly (Mon 4:41 UTC) | ✓ Running |
| Snyk              | SCA/Dependencies | push/PR to main            | ✓ Running |
| Dependency Review | SCA              | PR only                    | ✓ Running |

**First Scan Results** (see `docs/tickets/ci-security-findings-2026-01-08.md`):

- 54 total findings across all scanners
- 2 Critical (SQL injection in BI engine, open redirect)
- 3 High (credential logging, xlsx prototype pollution, file inclusion)
- Remediation in progress

**Proposal Alignment**: The proposal correctly claims:

- "SAST + SCA (for example CodeQL/Semgrep, Dependabot/Snyk)" — We have CodeQL + Aikido (SAST), Snyk + Dependency Review (SCA) ✓
- "DAST (for example OWASP ZAP)" — We have ZAP baseline scanning ✓

**No doc updates needed** — the "for example" language already covers our actual tooling.
The proposal was forward-looking and is now validated by implementation.

### sin-perf Deployment — IN PROGRESS

Performance environment being deployed for load testing, DR drill, and retention validation.
See updated runbook: `docs/sin-rfp/review-plans/performance-test-runbook.md`

---

## Actions Ready to Execute (Approved 2026-01-08)

### Imminent (This Week)

1. **Deploy sin-perf** and run performance tests (load + Lighthouse) — IN PROGRESS
2. **Run DR drill** on sin-perf, capture evidence
3. **Run retention validation** on sin-perf, capture evidence
4. **Implement AWS Backup Vault Lock** in `sst.config.ts`
5. **Implement SLA auto-calculation** (priority → target date mapping)
6. **Remediate critical security findings** (SQL injection, open redirect)

### Code Changes Needed

1. **AWS Backup Vault Lock** — Add to `sst.config.ts`
2. **SLA auto-set** — Add to `src/features/support/support.mutations.ts`:
   - urgent → 1 business day
   - high → 2 business days
   - normal → 5 business days
   - low → 10 business days
3. **Update retention seed script** — Add missing data types from proposed table
4. **Security remediation** (per `docs/tickets/ci-security-findings-2026-01-08.md`):
   - Fix SQL injection in `src/features/bi/engine/pivot-sql-compiler.ts`
   - Fix open redirect in `src/tenant/feature-gates.ts`
   - Remove credential logging from `e2e/helpers/global-setup.ts`
   - Address xlsx prototype pollution (update or replace library)
   - Add non-root user to `import-batch.Dockerfile`

### Doc Updates (After Tests Complete)

1. Replace "TBD" with "Completed January 2026" for performance/DR items
2. Replace ASCII diagram with SVG reference
3. Update SLA table with "10 Business Days" for low priority

## Proposed Next Steps

1. ~~Scan repo for infrastructure config~~ **DONE**
2. ~~Confirm schedule language and SLA wording~~ **DONE**
3. ~~Set up security scanning CI/CD~~ **DONE** — Aikido, CodeQL, ZAP, Snyk all operational
4. **IN PROGRESS**: Deploy sin-perf, run performance/DR/retention validation
5. **IN PROGRESS**: Remediate critical security findings (54 findings, 2 critical)
6. **NEXT**: Implement Backup Vault Lock + SLA auto-calc
7. **THEN**: Apply all doc-only edits with final language
8. **BLOCKED**: Migration pipelines (awaiting viaSport legacy access)
9. **BLOCKED**: Community-led framing (awaiting Soleil input)
