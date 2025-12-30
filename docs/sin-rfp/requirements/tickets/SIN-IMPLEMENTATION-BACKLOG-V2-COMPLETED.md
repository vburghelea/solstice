# viaSport SIN Implementation Backlog v2 - Completed

> Completed items moved out of `SIN-IMPLEMENTATION-BACKLOG-V2.md` to keep the active backlog focused.

## Part 3: Implementation Phases (Completed Items)

### Phase 0: Pre-Development Documentation (1-2 weeks)

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

### Phase 2: Security Hardening (3-4 weeks)

#### S-001: Multi-Factor Authentication

**Evidence:**

- `src/features/auth/mfa/`
- `src/features/auth/components/login.tsx`
- `src/features/roles/components/role-management-dashboard.tsx`
- `src/lib/auth/guards/step-up.ts`
- `src/lib/auth/utils/admin-check.ts`

**Implementation:**

- [x] MFA enrollment + QR + backup codes
- [x] MFA verification on login + step-up flows
- [x] Per-role MFA UI in admin role management
- [x] Global admin roles auto-enforce MFA requirement

---

### Phase 3: Core SIN Features (6-8 weeks)

#### D-002: Bulk Import & Data Migration

**Evidence:**

- `src/features/imports/`
- `src/lib/imports/batch-runner.ts`
- `src/workers/import-batch.ts`
- `docker/import-batch.Dockerfile`
- `sst.config.ts`

**Implementation:**

- [x] Lane 1 interactive import UI
- [x] Lane 2 batch runner + worker entrypoint
- [x] ECS task definition wiring + SST task trigger

---

#### D-003: Group Registration + Bundled Checkout (D0.18)

**Priority:** P1
**Effort:** 3-5 weeks
**Requirements:** viaSport user stories (pair/relay + membership bundling)

**Reference Docs:**

- `docs/sin-rfp/decisions/ADR-2025-12-29-d0-18-group-registration-bundled-checkout.md`
- `docs/sin-rfp/requirements/user-stories-and-flows.md`
- `docs/sin-rfp/registration-model-migration-plan.md`
- `docs/sin-rfp/square-callback-refactor-plan.md`

**Evidence:**

- `src/db/schema/events.schema.ts` (registration groups + pair/relay size columns)
- `src/features/events/registration-groups.mutations.ts`
- `src/features/events/registration-groups.queries.ts`
- `src/features/events/events.mutations.ts` (registerForEvent with groups + checkout)
- `src/routes/api/payments/square/callback.ts` (checkout_sessions + checkout_items)
- `src/routes/api/webhooks/square.ts` (payment finalization + refunds)
- `src/routes/dashboard/events/$slug.register.tsx` (group UI + localStorage)
- `src/routes/join/registration/$token.tsx` (invite acceptance)
- `src/features/events/components/event-create-form.tsx` (pair/relay size config)
- `e2e/tests/authenticated/group-registration.auth.spec.ts`

**Implementation:**

- [x] Registration groups schema (`registration_groups`, `registration_group_members`, `registration_invites`)
- [x] Server functions: `registration-groups.mutations.ts` (CRUD + invite/accept/decline/revoke)
- [x] Server functions: `registration-groups.queries.ts` (group roster + event listing)
- [x] Server functions: `getRegistrationInvitePreview` (public, cross-tenant invite details)
- [x] `registerForEvent` integration with `groupType` + invites (creates groups/members/invites)
- [x] Group registration UI (group type selector, invite inputs, pending member list)
- [x] Invite acceptance page (`/join/registration/$token`) with event details, loading states, invalid/expired handling
- [x] Email: `sendRegistrationGroupInviteEmail` for invite notifications
- [x] Organizer view: Groups tab with real roster data + CSV export
- [x] E2E tests: `group-registration.auth.spec.ts` for group types, invites, token handling
- [x] Remove reliance on `event_payment_sessions` and `membership_payment_sessions` in active flows
- [x] Membership eligibility checks on registration (`checkMembershipEligibility` in `membership.queries.ts`)
- [x] Unified checkout flow (`registerForEvent` creates `checkout_sessions` + `checkout_items`)
- [x] Square callback uses `checkout_sessions` + `checkout_items` (with legacy shim fallback)
- [x] Square webhooks finalize registrations + membership purchases and handle refunds
- [x] Pending/resume payment UX (localStorage-backed in `$slug.register.tsx`)
- [x] Event configuration for pairs/relays with size rules (schema, admin UI, validation)

**Acceptance Criteria:**

- [x] Organizers can configure events that allow pairs/relays with size rules
- [x] Registrants can invite members by email and see pending status
- [x] Single checkout can include event registration + membership purchase
- [x] Payment completion finalizes both registration and membership entitlements
- [x] Refunds update registration status and membership purchase status
- [x] Pending checkouts can be resumed without duplicate registration errors
- [x] Organizer roster exports reflect group members (including pending)

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

**Evidence:**

- `src/db/schema/reports.schema.ts`
- `src/features/reports/`
- `src/features/reports/reports.queries.ts`
- `src/features/reports/reports.mutations.ts`

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

### RFP Submission Checklist

#### Backup Restore Test Results

**Evidence:** `docs/sin-rfp/review-plans/backup-restore-test-results.md`
