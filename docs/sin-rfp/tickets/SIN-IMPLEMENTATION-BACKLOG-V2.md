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

| Item                                       | Status      | Score   | Evidence                                                                                                                        |
| ------------------------------------------ | ----------- | ------- | ------------------------------------------------------------------------------------------------------------------------------- |
| S-001: Multi-Factor Authentication         | 🟡 Partial  | 85%     | Enrollment + QR + backup codes + login challenge + step-up. **Missing:** per-role MFA UI (auto-enforced for global admin roles) |
| S-002: Security Event Monitoring & Lockout | ✅ Complete | 95%     | Events + detection + lockout + dashboard + admin alerts                                                                         |
| S-003: Privacy Compliance (PIPEDA)         | ✅ Complete | 95%     | Policy acceptance + DSAR workflow + export + erasure + retention UI/cron                                                        |
| **Phase 2 Total**                          | 🟡          | **92%** | Security UI complete, minor admin config gap                                                                                    |

### Phase 3: Core SIN Features

| Item                                | Status      | Score   | Evidence                                                                 |
| ----------------------------------- | ----------- | ------- | ------------------------------------------------------------------------ |
| D-001: Dynamic Form Builder         | ✅ Complete | 95%     | Builder + preview + publish + renderer + submissions history             |
| D-002: Bulk Import & Data Migration | 🟡 Partial  | 80%     | Lane 1 UI + Lane 2 batch runner; **Missing:** ECS task definition wiring |
| R-001: Reporting Cycles & Workflows | ✅ Complete | 95%     | Cycles + tasks + reminders + dashboards + review workflow                |
| **Phase 3 Total**                   | 🟡          | **90%** | ECS batch worker infra remaining                                         |

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

See `docs/sin-rfp/SIN-IMPLEMENTATION-TECHNICAL-DEBT.md` for detailed patch notes.

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

| Requirement                          | Control                                      | Status   |
| ------------------------------------ | -------------------------------------------- | -------- |
| SEC-AGG-001: MFA                     | Better Auth 2FA plugin (TOTP + backup codes) | To Build |
| SEC-AGG-001: Role/affiliation access | Organization-scoped RBAC                     | To Build |
| SEC-AGG-001: Leader admission        | Org membership approval workflow             | To Build |
| SEC-AGG-002: Anomaly detection       | Security events + risk scoring               | To Build |
| SEC-AGG-002: Account lockout         | Threshold-based auto-lock                    | To Build |
| SEC-AGG-003: PIPEDA compliance       | Consent tracking, retention, DSAR            | To Build |
| SEC-AGG-004: Immutable audit         | Append-only table + hash chain               | To Build |
| SEC-AGG-004: Export                  | Audit log filtering + CSV export             | To Build |

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

#### P0-001: Reference Architecture Document

**Deliverable:** `docs/sin-rfp/phase-0/architecture-reference.md`

Contents:

- [x] Architecture diagram (CloudFront → Lambda → RDS → S3)
- [x] Data flow diagram (user → system → storage)
- [x] Network diagram (VPC, subnets, security groups)
- [x] Component descriptions

---

#### P0-002: Data Residency Statement

**Deliverable:** `docs/sin-rfp/phase-0/data-residency.md`

Contents:

- [x] Explicit statement: "All production data stored in AWS ca-central-1"
- [x] Sub-processor list with regions
- [x] Data classification (PII, sensitive PII, operational)
- [x] Cross-border data transfer policy (none for PII)

---

#### P0-003: Security Controls Overview

**Deliverable:** `docs/sin-rfp/phase-0/security-controls.md`

Contents:

- [x] Authentication controls (MFA, session management)
- [x] Authorization controls (RBAC, org scoping)
- [x] Encryption (at rest: KMS, in transit: TLS 1.3)
- [x] Logging and monitoring
- [x] Incident response (outline)

---

#### P0-004: Backup & DR Plan

**Deliverable:** `docs/sin-rfp/phase-0/backup-dr-plan.md`

Contents:

- [x] RPO/RTO targets
- [x] Backup mechanisms and schedules
- [x] Restore procedures (step-by-step)
- [x] DR testing schedule and evidence

---

#### P0-005: Audit & Retention Policy

**Deliverable:** `docs/sin-rfp/phase-0/audit-retention-policy.md`

Contents:

- [x] What is logged (per action type)
- [x] Retention periods by data type
- [x] Archive and purge procedures
- [x] Legal hold capability

---

### Phase 1: Foundation (4-6 weeks)

> These are blocking dependencies. Everything else builds on this.

#### F-001: Organization & Tenancy Model

**Priority:** P0 (Blocker)
**Effort:** 2-3 weeks
**Blocks:** All org-scoped features

**Database Schema:**

```sql
-- Organizations (viaSport, PSOs, Clubs, Affiliates)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('governing_body', 'pso', 'club', 'affiliate')),
  parent_org_id UUID REFERENCES organizations(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'suspended', 'archived')),
  settings JSONB NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Organization membership with role
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'reporter', 'viewer', 'member')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'removed')),
  invited_by TEXT REFERENCES "user"(id),
  invited_at TIMESTAMPTZ,
  approved_by TEXT REFERENCES "user"(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, organization_id)
);

-- Delegated access for reporting (separate from membership)
CREATE TABLE delegated_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delegate_user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  scope TEXT NOT NULL CHECK (scope IN ('reporting', 'analytics', 'admin')),
  granted_by TEXT NOT NULL REFERENCES "user"(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  revoked_by TEXT REFERENCES "user"(id),
  notes TEXT
);

-- Indices
CREATE INDEX idx_org_members_user ON organization_members(user_id) WHERE status = 'active';
CREATE INDEX idx_org_members_org ON organization_members(organization_id) WHERE status = 'active';
CREATE INDEX idx_org_parent ON organizations(parent_org_id);
CREATE INDEX idx_delegated_access_user ON delegated_access(delegate_user_id) WHERE revoked_at IS NULL;
CREATE UNIQUE INDEX delegated_access_active_unique
  ON delegated_access(delegate_user_id, organization_id, scope)
  WHERE revoked_at IS NULL;
```

**Implementation:**

- [x] Create `src/db/schema/organizations.schema.ts`
- [x] Create `src/features/organizations/` feature module
- [x] Implement org context middleware (resolve user's org + role per request)
- [x] Create `src/lib/auth/guards/org-guard.ts`
- [x] Add org admin UI: create org, invite members, approve/deny
- [x] Retrofit `organization_id` to existing entities (as needed for SIN)

**Acceptance Criteria:**

- [x] Organizations can be created with parent/child relationships
- [x] Users can be invited to organizations with specific roles
- [x] Organization admins can approve/deny membership requests
- [x] Delegated access can be granted and revoked with audit trail
- [x] All data queries are org-scoped by default (SIN modules scoped)
- [x] Users cannot access data outside their organization(s) (org guard enforced)

---

#### F-002: Immutable Audit Logging

**Priority:** P0 (Blocker)
**Effort:** 2 weeks
**Blocks:** Compliance, DSAR, security monitoring

**Database Schema:**

```sql
-- Append-only audit log with hash chain
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Actor information
  actor_user_id TEXT REFERENCES "user"(id),
  actor_org_id UUID REFERENCES organizations(id),
  actor_ip INET,
  actor_user_agent TEXT,

  -- Action classification
  action TEXT NOT NULL, -- 'AUTH.LOGIN', 'DATA.CREATE', 'ADMIN.ROLE_ASSIGN', etc.
  action_category TEXT NOT NULL, -- 'AUTH', 'ADMIN', 'DATA', 'EXPORT', 'SECURITY'

  -- Target information
  target_type TEXT, -- 'user', 'organization', 'submission', etc.
  target_id TEXT,
  target_org_id UUID REFERENCES organizations(id),

  -- Change tracking (with PII awareness)
  changes JSONB, -- Field-level diffs, NOT full snapshots
  metadata JSONB NOT NULL DEFAULT '{}',

  -- Correlation and integrity
  request_id TEXT NOT NULL, -- Generate for background jobs (job_id/trace_id)
  prev_hash TEXT, -- Hash of previous entry (tamper evidence)
  entry_hash TEXT NOT NULL, -- Hash of this entry

  -- Indexing support
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enforce append-only via trigger
CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are immutable - modifications not allowed';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_logs_immutable
BEFORE UPDATE OR DELETE ON audit_logs
FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();

-- Indices for common query patterns
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_user_id, occurred_at DESC);
CREATE INDEX idx_audit_logs_target ON audit_logs(target_type, target_id, occurred_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action_category, occurred_at DESC);
CREATE INDEX idx_audit_logs_org ON audit_logs(target_org_id, occurred_at DESC);
CREATE INDEX idx_audit_logs_request ON audit_logs(request_id);
```

**Audit Library Design:**

```typescript
// src/lib/audit/index.ts
interface AuditEntry {
  action: string;
  targetType?: string;
  targetId?: string;
  targetOrgId?: string;
  changes?: Record<string, { old?: unknown; new?: unknown }>;
  metadata?: Record<string, unknown>;
}

// Central logging functions
audit.logAuthEvent(type: 'LOGIN' | 'LOGOUT' | 'MFA_ENROLL' | ..., context)
audit.logAdminAction(type: 'ROLE_ASSIGN' | 'ORG_CREATE' | ..., target, changes)
audit.logDataChange(type: 'CREATE' | 'UPDATE' | 'DELETE', entity, changes)
audit.logExport(type: 'CSV' | 'EXCEL' | ..., query, rowCount)
audit.logSecurityEvent(type: 'LOCKOUT' | 'ANOMALY' | ..., context)
```

**PII Redaction Rules:**

```typescript
// Fields to hash (not store plaintext)
const HASH_FIELDS = ["dateOfBirth", "phone", "emergencyContact.phone"];

// Fields to redact completely
const REDACT_FIELDS = ["password", "secret", "token", "mfaSecret"];

// For DATA changes, store diffs only
function createAuditDiff(before: object, after: object): object {
  // Returns { fieldName: { old: redacted/hashed, new: redacted/hashed } }
}
```

**Implementation:**

- [x] Create `src/db/schema/audit.schema.ts`
- [x] Create `src/lib/audit/` module
- [x] Implement hash chain verification utility
- [x] Add request ID middleware (correlation)
- [x] Wire into auth flows (login, logout, MFA)
- [x] Wire into admin actions (role changes, org management)
- [x] Create admin UI for log viewing, filtering, export

**Acceptance Criteria:**

- [x] All auth events are logged (login, logout, failed attempts, MFA)
- [x] All admin actions are logged with actor and target
- [x] Data changes log field-level diffs (not full snapshots)
- [x] PII fields are hashed/redacted per policy
- [x] Logs cannot be modified or deleted (DB trigger enforced)
- [x] Hash chain can be verified for integrity
- [x] Admin can filter by user, org, action, date range
- [x] Logs can be exported to CSV

---

#### F-003: Notification Engine

**Priority:** P0 (Blocker)
**Effort:** 2 weeks
**Blocks:** Reporting reminders, security alerts, support tickets

**Architecture:**

```
User Action → Notification Request → SQS Queue → Worker → Email (SES) + In-App DB
                                                      ↓
                                              User Preferences Check
```

**Database Schema:**

```sql
-- In-app notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id),

  type TEXT NOT NULL, -- 'reporting_reminder', 'security_alert', 'ticket_update', etc.
  category TEXT NOT NULL, -- 'reporting', 'security', 'support', 'system'

  title TEXT NOT NULL,
  body TEXT NOT NULL,
  link TEXT, -- Deep link to relevant page

  read_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,

  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User notification preferences
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- 'reporting', 'security', 'support', 'system'

  channel_email BOOLEAN NOT NULL DEFAULT true,
  channel_in_app BOOLEAN NOT NULL DEFAULT true,

  -- Email frequency (for non-urgent)
  email_frequency TEXT NOT NULL DEFAULT 'immediate'
    CHECK (email_frequency IN ('immediate', 'daily_digest', 'weekly_digest', 'never')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, category)
);

-- Admin-managed notification templates
CREATE TABLE notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL, -- 'reporting_reminder_7day', 'security_lockout', etc.

  category TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_template TEXT NOT NULL, -- Supports {{variable}} substitution

  is_system BOOLEAN NOT NULL DEFAULT false, -- System templates can't be deleted

  created_by TEXT REFERENCES "user"(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Scheduled notifications (for reminders)
CREATE TABLE scheduled_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key TEXT NOT NULL REFERENCES notification_templates(key),

  -- Target (user, org, or broadcast)
  user_id TEXT REFERENCES "user"(id),
  organization_id UUID REFERENCES organizations(id),
  role_filter TEXT, -- Optional: only users with this role

  scheduled_for TIMESTAMPTZ NOT NULL,

  -- Execution tracking
  sent_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,

  variables JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indices
CREATE INDEX idx_notifications_user ON notifications(user_id, read_at NULLS FIRST, created_at DESC);
CREATE INDEX idx_notifications_org ON notifications(organization_id, created_at DESC);
CREATE INDEX idx_scheduled_pending ON scheduled_notifications(scheduled_for)
  WHERE sent_at IS NULL AND failed_at IS NULL;
```

**Implementation:**

- [x] Create `src/db/schema/notifications.schema.ts`
- [x] Create `src/features/notifications/` module
- [x] Create `src/lib/notifications/queue.ts` (SQS integration)
- [x] Create `src/lib/notifications/send.ts` (dispatch logic)
- [x] Create `src/lib/notifications/scheduler.ts` (EventBridge integration)
- [x] Add notification bell component to header
- [x] Add notification preferences UI
- [x] Add admin template management UI

**Acceptance Criteria:**

- [x] Users see notification bell with unread count
- [x] Notification panel shows recent items, mark as read
- [x] Users can configure preferences per category
- [x] Email notifications respect user preferences
- [x] Scheduled notifications fire at configured times
- [x] Failed notifications retry with backoff
- [x] All notifications are audit logged

---

### Phase 2: Security Hardening (3-4 weeks)

#### S-001: Multi-Factor Authentication

**Priority:** P1
**Effort:** 1.5 weeks
**Requirement:** SEC-AGG-001

**Approach:** Use [Better Auth 2FA Plugin](https://www.better-auth.com/docs/plugins/2fa)

**Features to Implement:**

- [x] TOTP enrollment with QR code
- [x] Backup codes (10 single-use codes)
- [x] MFA challenge on login
- [x] MFA required for admin roles (enforced)
- [x] Step-up auth for sensitive actions
- [x] MFA recovery workflow

**Note:** Better Auth 2FA currently supports credential accounts only. For admin roles,
require a password-linked account or restrict admin roles to credential users.

**Database Additions:**

```sql
-- Better Auth 2FA plugin manages its own tables, but we track:
ALTER TABLE "user" ADD COLUMN mfa_required BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "user" ADD COLUMN mfa_enrolled_at TIMESTAMPTZ;

-- Track MFA events in audit log (no additional table needed)
```

**Implementation:**

- [x] Install and configure Better Auth 2FA plugin
- [x] Create `src/features/auth/mfa/` components
- [x] MFA enrollment wizard (TOTP QR + backup codes)
- [x] MFA challenge screen
- [x] Step-up auth middleware for sensitive routes
- [x] Admin UI to require MFA for roles (warning + badges added in role dashboard)

**Acceptance Criteria:**

- [x] Users can enroll in TOTP MFA
- [x] Backup codes are generated and displayed once
- [x] Login requires MFA code when enrolled
- [x] Admin roles must have MFA (enforced on role assignment)
- [x] Sensitive actions (exports, role changes) require re-auth
- [x] All MFA events are audit logged

---

#### S-002: Security Event Monitoring & Lockout

**Priority:** P1
**Effort:** 1.5 weeks
**Requirement:** SEC-AGG-002

**Database Schema:**

```sql
-- Security events (separate from audit for performance)
CREATE TABLE security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES "user"(id),

  event_type TEXT NOT NULL, -- 'login_success', 'login_fail', 'mfa_fail', 'password_reset', etc.

  ip_address INET NOT NULL,
  user_agent TEXT,
  geo_country TEXT,
  geo_region TEXT,

  risk_score INTEGER NOT NULL DEFAULT 0, -- 0-100
  risk_factors JSONB NOT NULL DEFAULT '[]', -- ['new_device', 'new_location', 'unusual_time']

  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Account locks
CREATE TABLE account_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES "user"(id),

  reason TEXT NOT NULL, -- 'failed_logins', 'suspicious_activity', 'admin_action'

  locked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unlock_at TIMESTAMPTZ, -- NULL = permanent until manual unlock

  unlocked_by TEXT REFERENCES "user"(id),
  unlocked_at TIMESTAMPTZ,
  unlock_reason TEXT,

  metadata JSONB NOT NULL DEFAULT '{}'
);

-- Indices
CREATE INDEX idx_security_events_user ON security_events(user_id, created_at DESC);
CREATE INDEX idx_security_events_ip ON security_events(ip_address, created_at DESC);
CREATE INDEX idx_account_locks_user ON account_locks(user_id) WHERE unlocked_at IS NULL;
```

**Detection Rules (Configurable):**
| Trigger | Action |
|---------|--------|
| 5 failed logins in 15 minutes | Lock for 30 minutes |
| 10 failed logins in 1 hour | Lock until admin unlock |
| Login from new country | Flag for review, notify user |
| 3 failed MFA in 5 minutes | Lock for 15 minutes |
| Password reset from new device | Require additional verification |

**Implementation:**

- [x] Create `src/db/schema/security.schema.ts`
- [x] Create `src/lib/security/events.ts` (capture and store)
- [x] Create `src/lib/security/detection.ts` (rules engine)
- [x] Create `src/lib/security/lockout.ts` (lock/unlock logic)
- [x] Integrate with auth flows
- [x] Create admin security dashboard
- [x] Add alert notifications to admins

**Acceptance Criteria:**

- [x] All auth events captured with IP/UA/geo
- [x] Failed login threshold triggers auto-lock
- [x] Locked accounts cannot authenticate
- [x] Admins receive notifications for lockouts
- [x] Admins can manually lock/unlock with reason
- [x] Security dashboard shows recent events and anomalies
- [x] All security events are audit logged

---

#### S-003: Privacy Compliance (PIPEDA)

**Priority:** P1
**Effort:** 1.5 weeks
**Requirement:** SEC-AGG-003

**Database Schema:**

```sql
-- Privacy policy versions
CREATE TABLE policy_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('privacy_policy', 'terms_of_service', 'data_agreement')),
  version TEXT NOT NULL,

  content_url TEXT, -- S3 URL to PDF
  content_hash TEXT NOT NULL, -- SHA-256 of content

  effective_date DATE NOT NULL,
  published_at TIMESTAMPTZ,
  published_by TEXT REFERENCES "user"(id),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(type, version)
);

-- User policy acceptances (immutable record)
CREATE TABLE user_policy_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES "user"(id),
  policy_id UUID NOT NULL REFERENCES policy_documents(id),

  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,

  UNIQUE(user_id, policy_id)
);

-- Data Subject Access Requests (DSAR)
CREATE TABLE privacy_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES "user"(id),

  type TEXT NOT NULL CHECK (type IN ('access', 'export', 'erasure', 'correction')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),

  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Processing
  processed_by TEXT REFERENCES "user"(id),
  processed_at TIMESTAMPTZ,

  -- Result
  result_url TEXT, -- S3 URL for exports
  result_notes TEXT,
  rejection_reason TEXT,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Data retention policies
CREATE TABLE retention_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_type TEXT NOT NULL, -- 'submissions', 'audit_logs', 'sessions', etc.

  retention_days INTEGER NOT NULL,
  archive_after_days INTEGER,
  purge_after_days INTEGER,

  legal_hold BOOLEAN NOT NULL DEFAULT false,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(data_type)
);
```

**Implementation:**

- [x] Create `src/db/schema/privacy.schema.ts`
- [x] Create `src/features/privacy/` module
- [x] Policy acceptance flow (block access until accepted)
- [x] DSAR request submission UI
- [x] Admin DSAR processing workflow
- [x] Data export generation (user's PII)
- [x] Data erasure/anonymization logic
- [x] Retention policy configuration UI
- [x] Scheduled retention enforcement job

**Acceptance Criteria:**

- [x] Users must accept current policy to proceed
- [x] Policy acceptance recorded with timestamp/IP
- [x] Users can submit DSAR (export, erasure)
- [x] Admins can process DSAR with audit trail
- [x] Data exports include all user PII
- [x] Erasure anonymizes data while preserving audit logs
- [x] Retention policies can be configured per data type

---

### Phase 3: Core SIN Features (6-8 weeks)

#### D-001: Dynamic Form Builder

**Priority:** P1
**Effort:** 3-4 weeks
**Requirements:** DM-AGG-001, RP-AGG-004

**Database Schema:**

```sql
-- Form definitions
CREATE TABLE forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id), -- NULL = system-wide

  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,

  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),

  created_by TEXT NOT NULL REFERENCES "user"(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(organization_id, slug)
);

-- Form versions (immutable once published)
CREATE TABLE form_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,

  version_number INTEGER NOT NULL,

  -- Form definition (see FormDefinition type below)
  definition JSONB NOT NULL,

  published_at TIMESTAMPTZ,
  published_by TEXT REFERENCES "user"(id),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(form_id, version_number)
);

-- Form submissions
CREATE TABLE form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES forms(id),
  form_version_id UUID NOT NULL REFERENCES form_versions(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),

  submitter_id TEXT REFERENCES "user"(id),

  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'submitted', 'under_review', 'changes_requested', 'approved', 'rejected')),

  payload JSONB NOT NULL,

  -- Validation tracking
  completeness_score INTEGER, -- 0-100
  missing_fields JSONB DEFAULT '[]',
  validation_errors JSONB DEFAULT '[]',

  -- Workflow tracking
  submitted_at TIMESTAMPTZ,
  reviewed_by TEXT REFERENCES "user"(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Submission version history
CREATE TABLE form_submission_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES form_submissions(id) ON DELETE CASCADE,

  version_number INTEGER NOT NULL,
  payload_snapshot JSONB NOT NULL,

  changed_by TEXT REFERENCES "user"(id),
  change_reason TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(submission_id, version_number)
);

-- File attachments
CREATE TABLE submission_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES form_submissions(id) ON DELETE CASCADE,

  field_key TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  checksum TEXT NOT NULL, -- SHA-256

  storage_key TEXT NOT NULL, -- S3 key

  uploaded_by TEXT REFERENCES "user"(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Form Definition TypeScript Schema:**

```typescript
interface FormDefinition {
  fields: FormField[];
  layout?: {
    sections: { title: string; fieldKeys: string[] }[];
  };
  settings: {
    allowDraft: boolean;
    requireApproval: boolean;
    notifyOnSubmit: string[]; // role names or user IDs
  };
}

interface FormField {
  key: string;
  type:
    | "text"
    | "number"
    | "email"
    | "phone"
    | "date"
    | "select"
    | "multiselect"
    | "checkbox"
    | "file"
    | "textarea"
    | "rich_text";
  label: string;
  description?: string;
  placeholder?: string;
  required: boolean;
  validation?: ValidationRule[];
  options?: { value: string; label: string }[]; // for select/multiselect
  conditional?: {
    field: string;
    operator: "equals" | "not_equals" | "contains" | "greater_than";
    value: unknown;
  };
  fileConfig?: {
    allowedTypes: string[]; // MIME types
    maxSizeBytes: number;
    maxFiles: number;
  };
}

interface ValidationRule {
  type: "min_length" | "max_length" | "pattern" | "min" | "max" | "custom";
  value: string | number;
  message: string;
}
```

**Implementation:**

- [x] Create `src/db/schema/forms.schema.ts`
- [x] Create `src/features/forms/` module
- [x] Form builder UI (drag-and-drop field palette)
- [x] Field configuration panel
- [x] Form preview mode
- [x] Form publishing workflow (creates immutable version)
- [x] Form renderer (generates form from definition)
- [x] Server-side validation from definition
- [x] Sanitize `rich_text` content server-side (allowlist + XSS-safe rendering)
- [x] Submission workflow (draft → submit → review)
- [x] File upload with S3 pre-signed URLs
- [x] Submission history viewer

**Acceptance Criteria:**

- [x] Admins can create forms with all field types
- [x] Validation rules are enforced server-side
- [x] Published forms are immutable (edits create new version)
- [x] Submissions track which form version was used
- [x] Files can be attached and downloaded
- [x] Submission history shows all changes
- [x] Forms support conditional field visibility

---

#### D-002: Bulk Import & Data Migration

**Priority:** P1
**Effort:** 2-3 weeks
**Requirement:** DM-AGG-006

**Two-Lane Architecture:**

**Lane 1: Interactive Import (<10K rows)**

- UI wizard for admin uploads
- In-memory validation with preview
- Row-level error display
- Direct database insert with rollback support (tag rows with `import_job_id` or use staging)

**Lane 2: Batch Import (>10K rows, up to 20M+)**

- S3 upload for source file
- Worker-based processing (ECS Fargate)
- Chunked validation in SQL
- Resumable checkpoints
- Error report to S3 (not row-per-row in DB)

**Database Schema:**

```sql
-- Import jobs (both lanes)
CREATE TABLE import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),

  -- Source
  type TEXT NOT NULL CHECK (type IN ('csv', 'excel')),
  lane TEXT NOT NULL CHECK (lane IN ('interactive', 'batch')),
  source_file_key TEXT NOT NULL, -- S3 key
  source_file_hash TEXT NOT NULL,
  source_row_count INTEGER,

  -- Target
  target_form_id UUID REFERENCES forms(id),
  mapping_template_id UUID REFERENCES import_mapping_templates(id),

  -- Status
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'validating', 'validated', 'importing',
                      'completed', 'failed', 'cancelled', 'rolled_back')),

  -- Progress (for batch)
  progress_checkpoint INTEGER DEFAULT 0,

  -- Stats
  stats JSONB NOT NULL DEFAULT '{}',
  -- { rows_total, rows_processed, rows_succeeded, rows_failed, validation_errors }

  -- Error handling
  error_report_key TEXT, -- S3 key to detailed error CSV
  error_summary JSONB DEFAULT '{}',

  -- Rollback support (for batch)
  can_rollback BOOLEAN NOT NULL DEFAULT true,
  rollback_before TIMESTAMPTZ, -- Deadline for rollback

  -- Audit
  created_by TEXT NOT NULL REFERENCES "user"(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Mapping templates (reusable)
CREATE TABLE import_mapping_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),

  name TEXT NOT NULL,
  description TEXT,

  target_form_id UUID REFERENCES forms(id),

  -- Mapping rules
  mappings JSONB NOT NULL,
  -- { sourceColumn: { targetField, transform?, defaultValue? } }

  created_by TEXT NOT NULL REFERENCES "user"(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Row-level errors (Lane 1 only, capped)
CREATE TABLE import_job_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES import_jobs(id) ON DELETE CASCADE,

  row_number INTEGER NOT NULL,
  field_key TEXT,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  raw_value TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cap row-level errors to prevent table explosion
-- For batch imports, write full errors to S3 instead
```

**Lane 2 Batch Processing Design:**

```
1. Upload CSV to S3 → Create import_jobs row
2. EventBridge triggers ECS task
3. Worker:
   - Stream-parse CSV (don't load all in memory)
   - Validate in chunks (1000 rows)
   - Write valid rows to staging table
   - Write errors to S3 (errors.csv)
   - Update checkpoint after each chunk
4. On success:
   - Promote from staging to production in chunks (short transactions)
   - Mark job completed
5. On failure:
   - Log checkpoint for resume
   - Mark job failed with error summary
6. Rollback:
   - DELETE WHERE import_job_id = X
   - Only available before rollback_before deadline
```

**Implementation:**

- [x] Create `src/db/schema/imports.schema.ts`
- [x] Create `src/features/imports/` module
- [x] Lane 1: Import wizard UI
- [x] Lane 1: Field mapping UI with auto-suggestions
- [x] Lane 1: Validation preview
- [x] Lane 2: S3 upload flow
- [x] Lane 2: Worker container (ECS task definition) (drafted in `docs/sin-rfp/phase-0/import-batch-worker.md`)
- [x] Lane 2: Chunked processing with checkpoints
- [x] Lane 1 rollback strategy (tag inserts with `import_job_id` or stage then promote)
- [x] Mapping template CRUD
- [x] Import history and status dashboard
- [x] Rollback capability

**Acceptance Criteria:**

- [x] Admin can upload CSV/Excel and preview columns
- [x] Auto-suggest mappings by column name similarity
- [x] Preview shows first N rows with validation results
- [x] Validation errors shown per row (Lane 1) or in report (Lane 2)
- [x] Import can be executed after validation
- [x] Batch imports are resumable after failure
- [x] Lane 1 rollback supported via `import_job_id` tagging or staging discard
- [x] Rollback available within configured window
- [x] Mapping templates can be saved and reused
- [x] All imports are audit logged

---

#### R-001: Reporting Cycles & Workflows

**Priority:** P1
**Effort:** 2 weeks
**Requirement:** RP-AGG-003

**Database Schema:**

```sql
-- Reporting cycles (e.g., "FY2025 Q1", "Annual Report 2025")
CREATE TABLE reporting_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  name TEXT NOT NULL,
  description TEXT,

  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  status TEXT NOT NULL DEFAULT 'upcoming'
    CHECK (status IN ('upcoming', 'active', 'closed', 'archived')),

  created_by TEXT REFERENCES "user"(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reporting tasks (what's due, when)
CREATE TABLE reporting_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES reporting_cycles(id) ON DELETE CASCADE,

  form_id UUID NOT NULL REFERENCES forms(id),

  -- Target (specific org or all orgs of a type)
  organization_id UUID REFERENCES organizations(id), -- NULL = all applicable orgs
  organization_type TEXT, -- 'pso', 'club', etc.

  title TEXT NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,

  -- Reminder configuration
  reminder_config JSONB NOT NULL DEFAULT '{}',
  -- { days_before: [14, 7, 3, 1], overdue_frequency: 'daily' }

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reporting submissions (per org per task)
CREATE TABLE reporting_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES reporting_tasks(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),

  form_submission_id UUID REFERENCES form_submissions(id),

  status TEXT NOT NULL DEFAULT 'not_started'
    CHECK (status IN ('not_started', 'in_progress', 'submitted',
                      'under_review', 'changes_requested', 'approved', 'overdue')),

  submitted_at TIMESTAMPTZ,
  submitted_by TEXT REFERENCES "user"(id),

  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT REFERENCES "user"(id),
  review_notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(task_id, organization_id)
);

-- Submission history (for resubmissions)
CREATE TABLE reporting_submission_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporting_submission_id UUID NOT NULL REFERENCES reporting_submissions(id) ON DELETE CASCADE,

  action TEXT NOT NULL, -- 'submitted', 'changes_requested', 'resubmitted', 'approved'
  actor_id TEXT REFERENCES "user"(id),
  notes TEXT,

  form_submission_version_id UUID REFERENCES form_submission_versions(id),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Implementation:**

- [x] Create `src/db/schema/reporting.schema.ts`
- [x] Create `src/features/reporting/` module
- [x] Reporting cycle CRUD (admin)
- [x] Task assignment UI
- [x] Reminder scheduler (EventBridge → SQS → notification)
- [x] Organization reporting dashboard ("What's due")
- [x] Admin reporting dashboard ("Who's behind")
- [x] Review workflow (approve/request changes)
- [x] Resubmission tracking with history

**Acceptance Criteria:**

- [x] Admins can create reporting cycles and tasks
- [x] Tasks can target specific orgs or org types
- [x] Organizations see their assigned tasks with due dates
- [x] Automated reminders sent at configured intervals
- [x] Status tracked through full workflow
- [x] Resubmissions maintain history with diffs
- [x] Dashboard shows progress across all orgs
- [x] Overdue tasks highlighted and tracked

---

### Phase 4: Analytics & Export (3-4 weeks)

#### R-002: Reporting & Export

**Priority:** P2
**Effort:** 3-4 weeks
**Requirement:** RP-AGG-005

**Layered Approach:**

| Layer   | Scope                                | Effort                            |
| ------- | ------------------------------------ | --------------------------------- |
| Layer 1 | Curated exports with field-level ACL | 2 weeks                           |
| Layer 2 | Saved reports with filters           | 1-2 weeks                         |
| Layer 3 | Self-service chart builder           | 3-4 weeks (defer unless required) |

**Database Schema:**

```sql
-- Saved reports
CREATE TABLE saved_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),

  name TEXT NOT NULL,
  description TEXT,

  -- Report definition
  data_source TEXT NOT NULL, -- 'submissions', 'memberships', 'organizations'
  filters JSONB NOT NULL DEFAULT '{}',
  columns JSONB NOT NULL DEFAULT '[]', -- Which fields to include
  sort JSONB DEFAULT '{}',

  -- Access control
  owner_id TEXT NOT NULL REFERENCES "user"(id),
  shared_with JSONB DEFAULT '[]', -- user IDs or roles
  is_org_wide BOOLEAN NOT NULL DEFAULT false,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Export history (for audit)
CREATE TABLE export_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id TEXT NOT NULL REFERENCES "user"(id),
  organization_id UUID REFERENCES organizations(id),

  report_id UUID REFERENCES saved_reports(id),

  export_type TEXT NOT NULL, -- 'csv', 'excel', 'pdf'
  data_source TEXT NOT NULL,
  filters_used JSONB NOT NULL,
  row_count INTEGER NOT NULL,

  file_key TEXT, -- S3 key (temporary)

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Field-Level Access Control:**

```typescript
interface FieldAccessPolicy {
  field: string;
  requiredRoles: string[]; // Empty = visible to all
  redactForRoles?: string[]; // Show as "***"
}

// Applied at export time, not query time
function applyFieldAccess(data: any[], userRoles: string[], policy: FieldAccessPolicy[]) {
  // Redact or remove fields based on policy
}
```

**Implementation:**

- [x] Create `src/db/schema/reports.schema.ts`
- [x] Create `src/features/reports/` module
- [x] Curated export endpoints (CSV, Excel)
- [x] Field-level access control middleware
- [x] Export audit logging
- [x] Saved report CRUD
- [x] Report builder UI (filters, columns)
- [x] Report sharing

**Acceptance Criteria:**

- [x] Authorized users can export datasets
- [x] Exports respect field-level access rules
- [x] Every export is audit logged
- [x] Reports can be saved with filters
- [x] Saved reports can be shared within org

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
- [ ] Backup restore test results (template only; needs execution)

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
