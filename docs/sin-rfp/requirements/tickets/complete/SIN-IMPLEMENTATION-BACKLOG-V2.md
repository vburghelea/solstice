# viaSport SIN Implementation Backlog v2

> Comprehensive implementation plan for the Strength in Numbers (SIN) system.
> Incorporates architecture review feedback, compliance requirements, and practical delivery sequencing.

---

## Executive Summary

### Current State

- **Codebase maturity:** Solid TypeScript/React foundation with TanStack Start, Drizzle ORM, Better Auth
- **SIN readiness:** ~35-40% of requirements have partial implementation
- **Critical gaps:** Organization tenancy, audit logging, MFA, notifications, dynamic forms, bulk import, analytics

### Key Insight

> **SIN is governance + compliance + workflows, not UI.**
> Building features before tenancy + audit + security posture = rework everything later.

### Critical Path (Non-Negotiable Sequence)

```
Lock Architecture → Organization Tenancy → Audit Logging → Notifications → Security Hardening → Forms → Reporting → Analytics
```

### Timeline Estimate

| Phase                        | Duration        | Outcome                         |
| ---------------------------- | --------------- | ------------------------------- |
| Phase 0: Architecture & Docs | 1-2 weeks       | RFP-defensible documentation    |
| Phase 1: Foundation          | 4-6 weeks       | Tenancy + Audit + Notifications |
| Phase 2: Security            | 3-4 weeks       | MFA + Lockouts + Privacy        |
| Phase 3: Core SIN            | 6-8 weeks       | Forms + Import + Reporting      |
| Phase 4: Analytics           | 3-4 weeks       | Exports + Saved Reports         |
| **Total to SIN-Ready**       | **17-24 weeks** | Phases 0-4                      |

---

## Implementation Progress Tracker

> **Last Updated:** 2025-12-24
> **Overall Progress:** ~85% (Core logic + admin UI done; infra/migration gaps remain)

### Phase 0: Pre-Development Documentation

| Item                               | Status      | Score    | Evidence                                         |
| ---------------------------------- | ----------- | -------- | ------------------------------------------------ |
| P0-001: Reference Architecture     | ✅ Complete | 100%     | `docs/sin-rfp/phase-0/architecture-reference.md` |
| P0-002: Data Residency Statement   | ✅ Complete | 100%     | `docs/sin-rfp/phase-0/data-residency.md`         |
| P0-003: Security Controls Overview | ✅ Complete | 100%     | `docs/sin-rfp/phase-0/security-controls.md`      |
| P0-004: Backup & DR Plan           | ✅ Complete | 100%     | `docs/sin-rfp/phase-0/backup-dr-plan.md`         |
| P0-005: Audit & Retention Policy   | ✅ Complete | 100%     | `docs/sin-rfp/phase-0/audit-retention-policy.md` |
| **Phase 0 Total**                  | ✅          | **100%** | All 5 documents complete                         |

### Phase 1: Foundation

| Item                           | Status      | Score   | Evidence                                                                                         |
| ------------------------------ | ----------- | ------- | ------------------------------------------------------------------------------------------------ |
| F-001: Organization & Tenancy  | ✅ Complete | 95%     | Schema: `organizations.schema.ts` + guards + admin UI. **Note:** hierarchy visualization pending |
| F-002: Immutable Audit Logging | ✅ Complete | 100%    | Schema + hash chain + immutability trigger + admin UI/export                                     |
| F-003: Notification Engine     | ✅ Complete | 100%    | SQS/SES integration + scheduler + digest aggregation + admin templates                           |
| **Phase 1 Total**              | ✅          | **98%** | Core logic + admin UI complete                                                                   |

### Phase 2: Security Hardening

| Item                                       | Status      | Score   | Evidence                                                                                          |
| ------------------------------------------ | ----------- | ------- | ------------------------------------------------------------------------------------------------- |
| S-001: Multi-Factor Authentication         | ✅ Complete | 95%     | Enrollment + QR + backup codes + login challenge + step-up + per-role MFA UI (global admin roles) |
| S-002: Security Event Monitoring & Lockout | ✅ Complete | 95%     | Events + detection + lockout + dashboard + admin alerts                                           |
| S-003: Privacy Compliance (PIPEDA)         | ✅ Complete | 95%     | Policy acceptance + DSAR workflow + export + erasure + retention UI/cron                          |
| **Phase 2 Total**                          | 🟡          | **92%** | Security UI complete, minor admin config gap                                                      |

### Phase 3: Core SIN Features

| Item                                | Status      | Score   | Evidence                                                     |
| ----------------------------------- | ----------- | ------- | ------------------------------------------------------------ |
| D-001: Dynamic Form Builder         | ✅ Complete | 95%     | Builder + preview + publish + renderer + submissions history |
| D-002: Bulk Import & Data Migration | ✅ Complete | 90%     | Lane 1 UI + Lane 2 batch runner + ECS task definition wiring |
| R-001: Reporting Cycles & Workflows | ✅ Complete | 95%     | Cycles + tasks + reminders + dashboards + review workflow    |
| **Phase 3 Total**                   | 🟡          | **90%** | ECS batch worker infra remaining                             |

### Phase 4: Analytics & Export

| Item                      | Status      | Score   | Evidence                                                 |
| ------------------------- | ----------- | ------- | -------------------------------------------------------- |
| R-002: Reporting & Export | ✅ Complete | 95%     | Report builder UI + saved reports + sharing + export ACL |
| **Phase 4 Total**         | ✅          | **95%** | Builder + exports complete                               |

### Summary by Category

| Category                 | Progress | Notes                                              |
| ------------------------ | -------- | -------------------------------------------------- |
| **Documentation**        | 100%     | All Phase 0 docs complete                          |
| **Database Schema**      | 100%     | All SIN tables defined + migrations applied        |
| **Server Functions**     | 95%      | Queries + mutations with auth guards + audit hooks |
| **Auth & Security**      | 90%      | MFA, lockout, step-up, admin enforcement complete  |
| **Notification Backend** | 95%      | SQS + SES + scheduler + digests                    |
| **Admin UI Components**  | 85%      | Core admin panels implemented                      |
| **E2E Tests**            | 30%      | Initial SIN auth/export/upload tests in place      |

### Recent Changes (2025-12-24)

Applied security patches (Issues 01-11):

- ✅ Audit log access control with org scoping
- ✅ Security events access control
- ✅ Reporting permission checks
- ✅ Field-level ACL for report exports
- ✅ Audit log immutability in retention
- ✅ S3 cleanup for DSAR erasure
- ✅ Step-up auth re-auth window
- ✅ Server-side file validation
- ✅ SQS/SES notification integration
- ✅ XLSX export generation
- ✅ MFA enrollment QR + backup code regeneration
- ✅ Notification digest aggregation + audit verification UI
- ✅ Lane 2 batch runner helper + worker entrypoint

See `docs/sin-rfp/requirements/SIN-IMPLEMENTATION-TECHNICAL-DEBT.md` for detailed patch notes.

---

## Part 1: Architecture Decisions to Lock First

> These decisions ripple everywhere. Do not write code until these are documented and approved.

### ADR-001: Data Residency

**Decision:** All production data stored and processed in Canada (AWS `ca-central-1`).

**Rationale:** PIPEDA compliance, viaSport requirement, RFP defensibility.

**Implications:**

- Migrate from Neon to AWS RDS PostgreSQL in `ca-central-1`
- Use AWS SES (not SendGrid) for transactional email
- Use S3 `ca-central-1` for document storage
- No Netlify for production (edge compute has no residency guarantees)
- All sub-processors must have Canadian data processing or explicit DPAs

---

### ADR-002: Tenancy Model

**Decision:** Organization-based tenancy (not team-based).

**Rationale:** SIN requires hierarchical org structure: viaSport → PSO → Club/Affiliate.

**Data Model:**

```
organizations (id, name, type, parent_org_id, ...)
    ↓
organization_members (user_id, org_id, role, status, ...)
    ↓
All tenant-owned entities have organization_id FK
```

**Implications:**

- Remove/deprecate `teamId`/`eventId` scoping from RBAC for SIN
- Add `organization_id` to: forms, submissions, reporting_tasks, imports, notifications
- Every query must be org-scoped by default
- Consider Postgres RLS for defense-in-depth (Phase 2 hardening)

---

### ADR-003: Audit Logging Policy

**Decision:** Immutable append-only audit log with PII-aware handling.

**What Gets Logged:**
| Action Type | Detail Level | Before/After |
|-------------|--------------|--------------|
| `AUTH.*` (login, logout, MFA) | Metadata only (no secrets) | No |
| `ADMIN.*` (role changes, config) | Full detail | Yes (full) |
| `DATA.CREATE/UPDATE/DELETE` | Field-level diffs | Yes (diff only) |
| `EXPORT.*` | Query params, row count | No |
| `SECURITY.*` (lockouts, anomalies) | Full context | No |

**PII Handling in Audit Logs:**

- Store **diffs**, not full before/after snapshots for personal data
- Store **hashes** for sensitive fields (DOB, phone, emergency contact)
- Redact secrets (passwords, tokens) completely
- Define retention: audit logs retained 7 years (or as specified by viaSport)

**Rationale:** Full before/after creates a second copy of PII, complicates DSAR/erasure.

---

### ADR-004: Email PII Policy

**Decision:** Minimal PII in transactional emails.

**Allowed in Email:**

- First name (for personalization)
- Organization name
- Action summaries ("Your Q1 report is due in 7 days")
- Links to system (with auth required to view details)

**NOT Allowed in Email:**

- Full addresses
- Phone numbers
- Date of birth
- Emergency contact details
- Submission content/data

**Rationale:** Email is a US-processor risk (even with SES). Minimize data exposure.

---

### ADR-005: Session Security

**Decision:** Tightened session policy for government data system.

| Setting               | Value                       | Rationale                             |
| --------------------- | --------------------------- | ------------------------------------- |
| Session max age       | 8 hours                     | Reduced from 30 days                  |
| Idle timeout          | 30 minutes                  | Auto-logout on inactivity             |
| Admin session max     | 4 hours                     | Higher privilege = shorter session    |
| Step-up auth required | Role changes, exports, DSAR | Re-authenticate for sensitive actions |
| Admin MFA             | Required                    | Non-negotiable for SIN                |

---

### ADR-006: Infrastructure Stack

**Decision:** AWS via SST for production, Netlify for development preview only.

| Component      | Technology                             | Region                    |
| -------------- | -------------------------------------- | ------------------------- |
| Compute        | Lambda (requests), ECS Fargate (batch) | ca-central-1              |
| Database       | RDS PostgreSQL (Multi-AZ, PITR)        | ca-central-1              |
| Object Storage | S3 (SSE-KMS, versioning)               | ca-central-1              |
| Email          | AWS SES                                | ca-central-1              |
| Queues         | SQS                                    | ca-central-1              |
| Scheduling     | EventBridge Scheduler                  | ca-central-1              |
| Secrets        | Secrets Manager                        | ca-central-1              |
| Monitoring     | CloudWatch, CloudTrail, GuardDuty      | ca-central-1              |
| CDN            | CloudFront (cache static only)         | Global edge, origin in CA |

**Residency Constraints:**

- CloudFront caches static assets only; authenticated/PII responses must use `Cache-Control: no-store`.
- CSP nonce injection must move to app-layer middleware for AWS (see `sst-migration-plan.md`).

**Known Issue:** SST Lambda Function URL permissions require `$transform` workaround. See `sst-migration-plan.md`.

---

## Part 2: Compliance & Security Posture

### Sub-Processor Inventory

| Service            | Vendor                    | Data Processed                       | Region                    | DPA Status       |
| ------------------ | ------------------------- | ------------------------------------ | ------------------------- | ---------------- |
| Database           | AWS RDS                   | All PII, submissions, audit logs     | ca-central-1              | AWS DPA ✓        |
| Email              | AWS SES                   | Names, org names, action summaries   | ca-central-1              | AWS DPA ✓        |
| Object Storage     | AWS S3                    | Documents, attachments, import files | ca-central-1              | AWS DPA ✓        |
| Auth               | Self-hosted (Better Auth) | Credentials, sessions                | ca-central-1              | N/A              |
| Monitoring         | AWS CloudWatch            | Logs (PII redacted)                  | ca-central-1              | AWS DPA ✓        |
| OAuth (if enabled) | Google                    | Email + profile claims               | Verify (likely US/global) | Google terms/DPA |
| Payments           | Square (if needed)        | Payment tokens only                  | Verify                    | Requires DPA     |

**No external sub-processors for PII beyond those listed.** If added later (analytics, support tools), update this table and obtain DPAs.

---

### Security Controls Mapped to SIN Requirements

| Requirement                          | Control                                      | Status         | Evidence                                                                                                                               |
| ------------------------------------ | -------------------------------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| SEC-AGG-001: MFA                     | Better Auth 2FA plugin (TOTP + backup codes) | ✅ Implemented | `src/features/auth/mfa`, `src/lib/auth/session.ts`, `docs/sin-rfp/archive/streams/stream-a.md`                                         |
| SEC-AGG-001: Role/affiliation access | Organization-scoped RBAC                     | ✅ Implemented | `src/features/organizations/organizations.access.ts`, `src/lib/auth/guards/org-guard.ts`, `docs/sin-rfp/archive/streams/stream-c.md`   |
| SEC-AGG-001: Leader admission        | Org membership approval workflow             | ✅ Implemented | `src/features/organizations/organizations.mutations.ts`, `src/features/organizations/components/organization-admin-panel.tsx`          |
| SEC-AGG-002: Anomaly detection       | Security events + risk scoring               | ✅ Implemented | `src/lib/security/detection.ts`, `src/features/security/security.mutations.ts`, `docs/sin-rfp/archive/streams/stream-g.md`             |
| SEC-AGG-002: Account lockout         | Threshold-based auto-lock                    | ✅ Implemented | `src/db/schema/security.schema.ts`, `src/features/security/security.mutations.ts`, `docs/sin-rfp/archive/streams/stream-g.md`          |
| SEC-AGG-003: PIPEDA compliance       | Consent tracking, retention, DSAR            | 🟡 Partial     | `src/features/privacy`, `src/lib/privacy/retention.ts`, `docs/sin-rfp/phase-0/audit-retention-policy.md`                               |
| SEC-AGG-004: Immutable audit         | Append-only table + hash chain               | ✅ Implemented | `src/lib/audit/index.ts`, `src/db/migrations/0013_audit_security_hardening.sql`, `scripts/verify-audit-immutability.ts`                |
| SEC-AGG-004: Export                  | Audit log filtering + CSV export             | ✅ Implemented | `src/features/audit/audit.queries.ts`, `src/features/audit/components/audit-log-table.tsx`, `docs/sin-rfp/archive/streams/stream-g.md` |

---

### Backup & Disaster Recovery

| Metric                         | Target    | Mechanism                           |
| ------------------------------ | --------- | ----------------------------------- |
| RPO (Recovery Point Objective) | 1 hour    | RDS automated backups + PITR        |
| RTO (Recovery Time Objective)  | 4 hours   | Multi-AZ failover + restore runbook |
| Backup retention               | 35 days   | RDS automated + manual snapshots    |
| Audit log retention            | 7 years   | S3 Glacier archive with Object Lock |
| DR testing                     | Quarterly | Documented restore procedure        |

---

## Part 3: Implementation Phases

### Phase 0: Pre-Development Documentation (1-2 weeks)

> Write these documents before writing code. They make your RFP submission defensible.

> Completed items moved to `docs/sin-rfp/requirements/tickets/SIN-IMPLEMENTATION-BACKLOG-V2-COMPLETED.md`.

### Phase 1: Foundation (4-6 weeks)

> These are blocking dependencies. Everything else builds on this.

> Completed items moved to `docs/sin-rfp/requirements/tickets/SIN-IMPLEMENTATION-BACKLOG-V2-COMPLETED.md`.

### Phase 2: Security Hardening (3-4 weeks)

> Completed items moved to `docs/sin-rfp/requirements/tickets/SIN-IMPLEMENTATION-BACKLOG-V2-COMPLETED.md`.

### Phase 3: Core SIN Features (6-8 weeks)

> Completed items moved to `docs/sin-rfp/requirements/tickets/SIN-IMPLEMENTATION-BACKLOG-V2-COMPLETED.md`.

---

### Phase 4: Analytics & Export (3-4 weeks)

> Completed items moved to `docs/sin-rfp/requirements/tickets/SIN-IMPLEMENTATION-BACKLOG-V2-COMPLETED.md`.

---

## Part 4: Deferred Features (Phase 5+)

> These are not required for SIN MVP. Build only if explicitly requested.

| Feature                      | Reason to Defer              |
| ---------------------------- | ---------------------------- |
| Website builder              | Not a SIN requirement        |
| Mobile native app            | PWA sufficient               |
| Live scoring                 | Not a data warehouse feature |
| Competition management       | Not a SIN requirement        |
| LMS / training modules       | Can use external tool        |
| Full chart builder (Layer 3) | Layer 1-2 likely sufficient  |
| Multi-currency               | CAD only for viaSport        |
| Ticket sales                 | Not a SIN requirement        |

---

## Part 5: Migration Strategy (20M+ Rows)

### Pre-Migration Checklist

- [x] Legacy data inventory (tables, row counts, relationships) (synthetic placeholders in `docs/sin-rfp/phase-0/migration-strategy.md`)
- [x] Data quality assessment (nulls, duplicates, invalid formats) (synthetic placeholders in `docs/sin-rfp/phase-0/migration-strategy.md`)
- [x] Field mapping document (legacy → SIN) (synthesized in `docs/sin-rfp/phase-0/migration-strategy.md`)
- [x] Transformation rules (date formats, phone normalization, enum mappings) (synthesized in `docs/sin-rfp/phase-0/migration-strategy.md`)
- [x] Rollback plan (keep legacy system read-only during transition) (documented in `docs/sin-rfp/phase-0/migration-strategy.md`)

### Migration Phases

| Phase | Scope                  | Approach                             |
| ----- | ---------------------- | ------------------------------------ |
| 1     | Schema creation        | Run in empty environment             |
| 2     | Organization hierarchy | Manual or scripted setup             |
| 3     | User migration         | Batch import with email notification |
| 4     | Historical submissions | Lane 2 batch import                  |
| 5     | Document migration     | S3 bulk copy with metadata sync      |
| 6     | Validation             | Reconciliation reports               |
| 7     | Cutover                | DNS switch, legacy read-only         |

### Batch Import Configuration for 20M Rows

```yaml
# ECS Task Definition
resources:
  cpu: 2048
  memory: 4096

# Processing settings
chunk_size: 5000
checkpoint_interval: 10000
max_retries: 3
connection_pool: unpooled # Direct connection, not pooled

# Error handling
max_errors_before_abort: 10000
error_report_format: csv
error_report_destination: s3://bucket/imports/{job_id}/errors.csv
```

---

## Part 6: RFP Submission Checklist

### Documentation Deliverables

- [x] Reference architecture document (with diagram)
- [x] Data residency statement
- [x] Security controls overview
- [x] Backup & DR plan with RPO/RTO
- [x] Audit & retention policy
- [x] Sub-processor inventory
- [x] Data classification guide
- [x] Migration strategy document
- [x] Phased delivery plan

### Technical Demonstration

- [x] Organization hierarchy with multi-level access (hierarchy visualization pending)
- [x] Audit log with filtering and export
- [x] MFA enrollment and challenge
- [x] Dynamic form creation and submission
- [x] Bulk import with validation and rollback
- [x] Reporting cycle with reminders
- [x] DSAR workflow (export, erasure)

### Compliance Evidence

- [x] AWS Canada region configuration
- [x] Encryption at rest (KMS)
- [x] Encryption in transit (TLS 1.3)
- [x] Immutable audit logs (trigger-enforced)
- [x] Session security controls
- [x] PII redaction in logs
- [x] Backup restore test results (executed; see `docs/sin-rfp/review-plans/backup-restore-test-results.md`)

---

## Appendix A: Existing Code to Leverage

| Existing Code                                    | Use For                            |
| ------------------------------------------------ | ---------------------------------- |
| `src/db/schema/roles.schema.ts`                  | Extend for org-scoped roles        |
| `src/components/form-fields/*`                   | Form builder field types           |
| `src/lib/email/sendgrid.ts`                      | Migrate to SES, keep patterns      |
| `src/components/ui/data-table.tsx`               | Admin dashboards                   |
| `src/lib/pacer/*`                                | Rate limiting foundation           |
| `src/features/membership/membership.finalize.ts` | Pattern for atomic multi-table ops |
| `src/lib/auth/*`                                 | Extend with MFA and org context    |

---

## Appendix B: Technology Stack Updates

| Current            | SIN Production                    |
| ------------------ | --------------------------------- |
| Neon PostgreSQL    | AWS RDS PostgreSQL (ca-central-1) |
| Netlify            | AWS via SST (production)          |
| SendGrid           | AWS SES (ca-central-1)            |
| Local file storage | S3 with SSE-KMS                   |
| No queue           | SQS for notifications             |
| No scheduler       | EventBridge Scheduler             |
| Console logging    | CloudWatch Logs (PII redacted)    |

---

## Appendix C: Better Auth 2FA Configuration

```typescript
// src/lib/auth/index.ts
import { betterAuth } from "better-auth";
import { twoFactor } from "better-auth/plugins/2fa";

export const auth = betterAuth({
  // ... existing config
  plugins: [
    twoFactor({
      issuer: "viaSport SIN",
      // TOTP settings
      totpOptions: {
        digits: 6,
        period: 30,
      },
      // Backup codes
      backupCodes: {
        enabled: true,
        count: 10,
        length: 8,
      },
    }),
  ],
});
```

---

## Document History

| Version | Date       | Changes                                                      |
| ------- | ---------- | ------------------------------------------------------------ |
| v1.0    | 2024-12    | Initial backlog                                              |
| v2.0    | 2024-12    | Complete rewrite incorporating architecture review feedback  |
| v2.1    | 2025-12-24 | Added Implementation Progress Tracker with codebase analysis |
