# viaSport SIN Implementation Backlog

> Prioritized implementation plan for the Strength in Numbers (SIN) system requirements.
> Based on analysis of existing Solstice codebase against 25 SIN requirements.

---

## Executive Summary

**Current Progress:** ~40% of SIN requirements have partial implementation
**Total Requirements:** 25 across 5 categories
**Estimated New Tables:** ~25 database entities
**Critical Path:** Organization Model → Audit Logging → Notifications → Forms → Reporting

---

## Priority Levels

| Priority | Meaning                             | Timeline Guidance |
| -------- | ----------------------------------- | ----------------- |
| **P0**   | Foundation - blocks everything else | Phase 1           |
| **P1**   | Core SIN functionality              | Phase 2           |
| **P2**   | Required for compliance/RFP         | Phase 3           |
| **P3**   | Enhanced UX/polish                  | Phase 4           |
| **P4**   | Nice-to-have                        | Future            |

---

## Phase 1: Foundation (P0)

These items are **blocking dependencies** for most other features.

### F-001: Organization & Affiliation Model

**Priority:** P0
**Blocks:** SEC-AGG-001, DM-AGG-003, RP-AGG-002, UI-AGG-002, all reporting features
**Effort:** Large

**Description:**
Extend the existing team model to support a hierarchical organization structure (viaSport → PSO → Club/Team). This is the multi-tenant foundation for SIN.

**Database Schema:**

```sql
-- Organizations (PSOs, clubs, affiliates)
CREATE TABLE organizations (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL, -- 'pso', 'club', 'affiliate'
  parent_org_id UUID REFERENCES organizations(id),
  status TEXT DEFAULT 'active',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User membership in organizations
CREATE TABLE organization_members (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES "user"(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  role TEXT NOT NULL, -- 'owner', 'admin', 'reporter', 'member'
  status TEXT DEFAULT 'pending', -- 'pending', 'active', 'rejected', 'suspended'
  invited_by TEXT REFERENCES "user"(id),
  joined_at TIMESTAMPTZ,
  approved_by TEXT REFERENCES "user"(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, organization_id)
);

-- Delegated access for reporting
CREATE TABLE delegated_access (
  id UUID PRIMARY KEY,
  delegate_user_id TEXT NOT NULL REFERENCES "user"(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  scope TEXT NOT NULL, -- 'reporting', 'analytics', 'admin'
  granted_by TEXT NOT NULL REFERENCES "user"(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  UNIQUE(delegate_user_id, organization_id, scope)
);
```

**Acceptance Criteria:**

- [ ] Organizations can be created with parent/child relationships
- [ ] Users can be invited to organizations with specific roles
- [ ] Organization admins can approve/deny membership requests
- [ ] Delegated access can be granted for specific scopes
- [ ] All organization data is scoped - users only see their org's data

**Files to Create/Modify:**

- `src/db/schema/organizations.schema.ts` (new)
- `src/features/organizations/` (new feature module)
- `src/lib/auth/guards/org-guard.ts` (new)

---

### F-002: Immutable Audit Logging System

**Priority:** P0
**Blocks:** SEC-AGG-004, DM-AGG-002, RP-AGG-003, compliance
**Effort:** Medium

**Description:**
Create an append-only audit log that captures all significant system events with tamper-evident hashing. Required for PIPEDA compliance and regulatory reporting.

**Database Schema:**

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  occurred_at TIMESTAMPTZ DEFAULT NOW(),
  actor_user_id TEXT REFERENCES "user"(id), -- null for system actions
  actor_ip INET,
  actor_user_agent TEXT,

  action TEXT NOT NULL, -- 'AUTH.LOGIN', 'DATA.CREATE', 'ADMIN.ROLE_ASSIGN', etc.
  target_type TEXT, -- 'user', 'organization', 'submission', etc.
  target_id TEXT,

  before_state JSONB,
  after_state JSONB,
  metadata JSONB DEFAULT '{}',

  request_id TEXT, -- correlation ID
  prev_hash TEXT, -- hash of previous entry (tamper evidence)
  entry_hash TEXT NOT NULL -- hash of this entry
);

-- Enforce append-only via trigger
CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are immutable';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_logs_immutable
BEFORE UPDATE OR DELETE ON audit_logs
FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();

-- Index for common queries
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_user_id, occurred_at DESC);
CREATE INDEX idx_audit_logs_target ON audit_logs(target_type, target_id, occurred_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action, occurred_at DESC);
```

**Acceptance Criteria:**

- [ ] All auth events are logged (login, logout, failed attempts, MFA)
- [ ] All data mutations are logged with before/after state
- [ ] All admin actions are logged (role changes, org management)
- [ ] Logs cannot be modified or deleted (DB-enforced)
- [ ] Hash chain can be verified for integrity
- [ ] Admin UI can filter by user, target, action, date range
- [ ] Logs can be exported to CSV

**Files to Create/Modify:**

- `src/db/schema/audit.schema.ts` (new)
- `src/lib/audit/` (new module)
- `src/lib/audit/log.ts` - logging functions
- `src/lib/audit/verify.ts` - hash chain verification
- `src/features/admin/audit-viewer.tsx` (new)

---

### F-003: Notification Engine

**Priority:** P0
**Blocks:** RP-AGG-003, UI-AGG-004, SEC-AGG-002, TO-AGG-002
**Effort:** Medium

**Description:**
Build a unified notification system supporting in-app notifications, email delivery, user preferences, and scheduled reminders.

**Database Schema:**

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES "user"(id),
  type TEXT NOT NULL, -- 'reporting_reminder', 'ticket_update', 'security_alert', etc.
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  link TEXT, -- deep link to relevant page

  read_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,

  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES "user"(id),
  category TEXT NOT NULL, -- 'reporting', 'security', 'support', 'system'
  channel_email BOOLEAN DEFAULT true,
  channel_in_app BOOLEAN DEFAULT true,
  frequency TEXT DEFAULT 'immediate', -- 'immediate', 'daily_digest', 'weekly_digest'
  UNIQUE(user_id, category)
);

CREATE TABLE notification_templates (
  id UUID PRIMARY KEY,
  key TEXT UNIQUE NOT NULL, -- 'reporting_reminder_7day', 'ticket_response', etc.
  subject TEXT NOT NULL,
  body_template TEXT NOT NULL, -- supports {{variable}} substitution
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE scheduled_notifications (
  id UUID PRIMARY KEY,
  template_key TEXT NOT NULL REFERENCES notification_templates(key),
  user_id TEXT REFERENCES "user"(id), -- null for broadcast
  organization_id UUID REFERENCES organizations(id),
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  error_message TEXT,
  variables JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, read_at, created_at DESC);
CREATE INDEX idx_scheduled_pending ON scheduled_notifications(scheduled_for) WHERE sent_at IS NULL;
```

**Acceptance Criteria:**

- [ ] Users see notification bell with unread count in header
- [ ] Clicking bell shows notification panel with recent items
- [ ] Users can mark notifications as read/unread
- [ ] Users can configure preferences per category
- [ ] Email notifications respect user preferences
- [ ] Scheduled notifications are sent at configured times
- [ ] Admins can manage notification templates

**Files to Create/Modify:**

- `src/db/schema/notifications.schema.ts` (new)
- `src/features/notifications/` (new feature module)
- `src/components/ui/notification-bell.tsx` (new)
- `src/lib/notifications/send.ts` (new)
- `src/lib/notifications/scheduler.ts` (new)
- Modify `src/routes/__root.tsx` to include notification bell

---

## Phase 2: Core SIN Functionality (P1)

### S-001: Multi-Factor Authentication (MFA)

**Priority:** P1
**Requirement:** SEC-AGG-001
**Effort:** Medium

**Description:**
Add TOTP-based MFA with backup codes. Optional SMS can be added later.

**Database Schema:**

```sql
CREATE TABLE mfa_factors (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES "user"(id),
  type TEXT NOT NULL, -- 'totp', 'sms' (future)
  secret_encrypted TEXT, -- for TOTP
  phone_e164 TEXT, -- for SMS
  is_active BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE mfa_backup_codes (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES "user"(id),
  code_hash TEXT NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add to user table
ALTER TABLE "user" ADD COLUMN mfa_required BOOLEAN DEFAULT false;
ALTER TABLE "user" ADD COLUMN mfa_enrolled BOOLEAN DEFAULT false;
```

**Acceptance Criteria:**

- [ ] Users can enroll in TOTP MFA via QR code
- [ ] Users receive and can save backup codes
- [ ] Login requires MFA code when enrolled
- [ ] Backup codes work for recovery (single use)
- [ ] Admins can require MFA for specific roles
- [ ] All MFA events are audit logged

**Files to Create:**

- `src/features/auth/mfa/` (new)
- `src/features/auth/components/mfa-enrollment.tsx`
- `src/features/auth/components/mfa-challenge.tsx`
- `src/lib/auth/mfa.ts`

---

### S-002: Security Event Monitoring & Account Lockout

**Priority:** P1
**Requirement:** SEC-AGG-002
**Effort:** Medium

**Description:**
Track security events, detect anomalies, and auto-lock accounts after suspicious activity.

**Database Schema:**

```sql
CREATE TABLE security_events (
  id UUID PRIMARY KEY,
  user_id TEXT REFERENCES "user"(id),
  event_type TEXT NOT NULL, -- 'login_success', 'login_fail', 'mfa_fail', 'password_reset', etc.
  ip_address INET,
  user_agent TEXT,
  geo_country TEXT,
  geo_city TEXT,
  risk_score INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE account_locks (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES "user"(id),
  reason TEXT NOT NULL, -- 'failed_logins', 'suspicious_activity', 'admin_action'
  locked_at TIMESTAMPTZ DEFAULT NOW(),
  unlock_at TIMESTAMPTZ, -- auto-unlock time
  unlocked_by TEXT REFERENCES "user"(id),
  unlocked_at TIMESTAMPTZ,
  notes TEXT
);

CREATE INDEX idx_security_events_user ON security_events(user_id, created_at DESC);
CREATE INDEX idx_security_events_ip ON security_events(ip_address, created_at DESC);
```

**Detection Rules (configurable):**

- 5 failed logins in 15 minutes → lock for 30 minutes
- 10 failed logins in 1 hour → lock until admin unlock
- Login from new country → require MFA step-up
- Unusual time of day + new device → flag for review

**Acceptance Criteria:**

- [ ] All auth events are captured with IP/UA/geo
- [ ] Failed login threshold triggers auto-lock
- [ ] Locked accounts cannot authenticate
- [ ] Admins receive alerts for lockouts
- [ ] Admins can manually lock/unlock accounts
- [ ] Security dashboard shows recent events and anomalies

---

### D-001: Dynamic Form Builder

**Priority:** P1
**Requirement:** DM-AGG-001, RP-AGG-004
**Effort:** Large

**Description:**
Admin UI to create custom forms without code. Forms are versioned and submissions are tracked.

**Database Schema:**

```sql
CREATE TABLE forms (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  organization_id UUID REFERENCES organizations(id), -- null for system-wide
  status TEXT DEFAULT 'draft', -- 'draft', 'published', 'archived'
  created_by TEXT REFERENCES "user"(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE form_versions (
  id UUID PRIMARY KEY,
  form_id UUID NOT NULL REFERENCES forms(id),
  version_number INTEGER NOT NULL,
  definition JSONB NOT NULL, -- field configs, layout, validation rules
  published_at TIMESTAMPTZ,
  published_by TEXT REFERENCES "user"(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(form_id, version_number)
);

CREATE TABLE form_submissions (
  id UUID PRIMARY KEY,
  form_id UUID NOT NULL REFERENCES forms(id),
  form_version_id UUID NOT NULL REFERENCES form_versions(id),
  organization_id UUID REFERENCES organizations(id),
  submitter_id TEXT REFERENCES "user"(id),

  status TEXT DEFAULT 'draft', -- 'draft', 'submitted', 'under_review', 'changes_requested', 'approved', 'rejected'
  payload JSONB NOT NULL,

  completeness_score INTEGER,
  missing_fields JSONB DEFAULT '[]',
  validation_errors JSONB DEFAULT '[]',

  submitted_at TIMESTAMPTZ,
  reviewed_by TEXT REFERENCES "user"(id),
  reviewed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE form_submission_versions (
  id UUID PRIMARY KEY,
  submission_id UUID NOT NULL REFERENCES form_submissions(id),
  version_number INTEGER NOT NULL,
  payload_snapshot JSONB NOT NULL,
  changed_by TEXT REFERENCES "user"(id),
  change_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(submission_id, version_number)
);

CREATE TABLE submission_files (
  id UUID PRIMARY KEY,
  submission_id UUID NOT NULL REFERENCES form_submissions(id),
  field_key TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  checksum TEXT NOT NULL,
  storage_key TEXT NOT NULL,
  uploaded_by TEXT REFERENCES "user"(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Form Definition Schema (JSONB):**

```typescript
interface FormDefinition {
  fields: FormField[];
  layout?: LayoutConfig;
  settings: {
    allowDraft: boolean;
    requireApproval: boolean;
    notifyOnSubmit: string[]; // user IDs or roles
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
    | "textarea";
  label: string;
  description?: string;
  required: boolean;
  validation?: ValidationRule[];
  options?: { value: string; label: string }[]; // for select/multiselect
  conditional?: ConditionalRule; // show/hide based on other fields
  fileConfig?: { allowedTypes: string[]; maxSize: number };
}
```

**Acceptance Criteria:**

- [ ] Admins can create forms with drag-and-drop field builder
- [ ] Forms support all standard field types
- [ ] Validation rules are enforced server-side
- [ ] Forms can be published (creates immutable version)
- [ ] Users can save drafts and submit
- [ ] Submissions track version history
- [ ] Files can be attached and downloaded

**Files to Create:**

- `src/db/schema/forms.schema.ts` (new)
- `src/features/forms/` (new feature module)
- `src/features/forms/components/form-builder.tsx`
- `src/features/forms/components/form-renderer.tsx`
- `src/features/forms/components/submission-viewer.tsx`

---

### D-002: Bulk Import & Data Migration

**Priority:** P1
**Requirement:** DM-AGG-006
**Effort:** Large

**Description:**
Import CSV/Excel files with field mapping, validation, preview, and rollback capability. Must support 20M+ row initial migration.

**Database Schema:**

```sql
CREATE TABLE import_jobs (
  id UUID PRIMARY KEY,
  type TEXT NOT NULL, -- 'csv', 'excel', 'api'
  target_form_id UUID REFERENCES forms(id),
  target_table TEXT, -- for direct table imports

  source_file_key TEXT,
  source_file_hash TEXT,
  mapping_template_id UUID REFERENCES import_mapping_templates(id),

  status TEXT DEFAULT 'pending', -- 'pending', 'validating', 'validated', 'importing', 'completed', 'failed', 'rolled_back'

  stats JSONB DEFAULT '{}', -- rows_total, rows_processed, rows_succeeded, rows_failed
  error_summary JSONB DEFAULT '{}',

  created_by TEXT REFERENCES "user"(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE TABLE import_job_rows (
  id UUID PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES import_jobs(id),
  row_number INTEGER NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'valid', 'invalid', 'imported', 'failed'
  source_data JSONB NOT NULL,
  transformed_data JSONB,
  errors JSONB DEFAULT '[]',
  target_record_id TEXT, -- ID of created record
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE import_mapping_templates (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  target_form_id UUID REFERENCES forms(id),
  target_table TEXT,
  mappings JSONB NOT NULL, -- source_column -> target_field + transform
  created_by TEXT REFERENCES "user"(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE transformation_logs (
  id UUID PRIMARY KEY,
  job_id UUID REFERENCES import_jobs(id),
  submission_id UUID REFERENCES form_submissions(id),
  field_key TEXT NOT NULL,
  original_value TEXT,
  transformed_value TEXT,
  transformation_type TEXT, -- 'normalize_phone', 'parse_date', 'map_enum', etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_import_job_rows_job ON import_job_rows(job_id, row_number);
```

**Two-Lane Architecture:**

1. **Interactive UI Import** - for admin uploads < 10K rows
2. **Batch Pipeline** - for migration/large imports, uses unpooled connection, chunked processing, resumable

**Acceptance Criteria:**

- [ ] Admin can upload CSV/Excel and preview columns
- [ ] Auto-suggest mappings based on column names
- [ ] Preview shows first N rows with validation results
- [ ] Validation errors shown per-row with clear messages
- [ ] Import can be executed after validation passes
- [ ] Import can be rolled back (deletes imported records)
- [ ] Mapping templates can be saved and reused
- [ ] All imports are audit logged
- [ ] Large imports use batch pipeline (not UI)

**Files to Create:**

- `src/features/imports/` (new feature module)
- `src/features/imports/components/import-wizard.tsx`
- `src/features/imports/components/field-mapper.tsx`
- `scripts/batch-import.ts` (CLI for large migrations)

---

### R-001: Reporting Cycles & Workflow

**Priority:** P1
**Requirement:** RP-AGG-003
**Effort:** Medium

**Description:**
Define reporting cycles with deadlines, track submission status, send automated reminders, and enable resubmission workflows.

**Database Schema:**

```sql
CREATE TABLE reporting_cycles (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL, -- 'FY2025 Q1', 'Annual Report 2025'
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'upcoming', -- 'upcoming', 'active', 'closed', 'archived'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE reporting_tasks (
  id UUID PRIMARY KEY,
  cycle_id UUID NOT NULL REFERENCES reporting_cycles(id),
  form_id UUID NOT NULL REFERENCES forms(id),
  organization_id UUID REFERENCES organizations(id), -- null = all orgs

  title TEXT NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,

  reminder_config JSONB DEFAULT '{}', -- days_before: [14, 7, 3, 1], overdue_frequency: 'daily'

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE reporting_submissions (
  id UUID PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES reporting_tasks(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  form_submission_id UUID REFERENCES form_submissions(id),

  status TEXT DEFAULT 'not_started', -- 'not_started', 'in_progress', 'submitted', 'under_review', 'changes_requested', 'approved', 'overdue'

  submitted_at TIMESTAMPTZ,
  submitted_by TEXT REFERENCES "user"(id),

  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT REFERENCES "user"(id),
  review_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(task_id, organization_id)
);

CREATE TABLE reporting_submission_history (
  id UUID PRIMARY KEY,
  reporting_submission_id UUID NOT NULL REFERENCES reporting_submissions(id),
  action TEXT NOT NULL, -- 'submitted', 'changes_requested', 'resubmitted', 'approved'
  actor_id TEXT REFERENCES "user"(id),
  notes TEXT,
  form_submission_version_id UUID REFERENCES form_submission_versions(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Acceptance Criteria:**

- [ ] Admins can create reporting cycles and assign tasks
- [ ] Organizations see their assigned tasks with due dates
- [ ] Automated reminders sent at configured intervals
- [ ] Submission status is tracked through workflow
- [ ] Resubmissions maintain full history
- [ ] Dashboard shows reporting progress across all orgs
- [ ] Overdue tasks are highlighted and tracked

---

## Phase 3: Compliance & Reporting (P2)

### C-001: Privacy Compliance (PIPEDA)

**Priority:** P2
**Requirement:** SEC-AGG-003
**Effort:** Medium

**Database Schema:**

```sql
CREATE TABLE policy_documents (
  id UUID PRIMARY KEY,
  type TEXT NOT NULL, -- 'privacy_policy', 'terms_of_service'
  version TEXT NOT NULL,
  content_url TEXT,
  content_hash TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_policy_acceptances (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES "user"(id),
  policy_id UUID NOT NULL REFERENCES policy_documents(id),
  accepted_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  UNIQUE(user_id, policy_id)
);

CREATE TABLE privacy_requests (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES "user"(id),
  type TEXT NOT NULL, -- 'export', 'erasure', 'correction'
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'rejected'
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  processed_by TEXT REFERENCES "user"(id),
  processed_at TIMESTAMPTZ,
  notes TEXT
);

CREATE TABLE retention_policies (
  id UUID PRIMARY KEY,
  data_type TEXT NOT NULL, -- 'submissions', 'audit_logs', 'sessions', etc.
  retention_days INTEGER NOT NULL,
  archive_after_days INTEGER,
  purge_after_days INTEGER,
  legal_hold BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Acceptance Criteria:**

- [ ] Users must accept current privacy policy to proceed
- [ ] Policy acceptance is recorded with timestamp/IP
- [ ] Users can request data export (DSAR)
- [ ] Users can request account deletion
- [ ] Retention policies can be configured per data type
- [ ] Scheduled jobs enforce retention policies

---

### C-002: Data Quality Dashboard

**Priority:** P2
**Requirement:** DM-AGG-004
**Effort:** Medium

**Database Schema:**

```sql
CREATE TABLE data_quality_issues (
  id UUID PRIMARY KEY,
  submission_id UUID REFERENCES form_submissions(id),
  organization_id UUID REFERENCES organizations(id),

  issue_type TEXT NOT NULL, -- 'missing_required', 'invalid_format', 'out_of_range', 'duplicate'
  field_key TEXT,
  severity TEXT DEFAULT 'warning', -- 'info', 'warning', 'error'
  message TEXT NOT NULL,

  detected_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT REFERENCES "user"(id)
);

CREATE TABLE data_quality_runs (
  id UUID PRIMARY KEY,
  run_type TEXT NOT NULL, -- 'scheduled', 'manual'
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  stats JSONB DEFAULT '{}', -- records_checked, issues_found, etc.
  triggered_by TEXT REFERENCES "user"(id)
);
```

**Acceptance Criteria:**

- [ ] Dashboard shows data quality metrics by org/form
- [ ] Issues are categorized by type and severity
- [ ] Drill-down shows specific records with issues
- [ ] Scheduled quality checks run nightly
- [ ] Issues can be marked as resolved

---

### R-002: Self-Service Analytics & Export

**Priority:** P2
**Requirement:** RP-AGG-005
**Effort:** Large

**Database Schema:**

```sql
CREATE TABLE analytics_reports (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,

  data_source TEXT NOT NULL, -- 'submissions', 'memberships', 'organizations', etc.
  filters JSONB DEFAULT '{}',
  dimensions JSONB DEFAULT '[]', -- group by fields
  measures JSONB DEFAULT '[]', -- aggregations
  chart_type TEXT, -- 'bar', 'line', 'pie', 'table', null for raw

  owner_id TEXT REFERENCES "user"(id),
  organization_id UUID REFERENCES organizations(id),
  is_public BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE analytics_report_shares (
  id UUID PRIMARY KEY,
  report_id UUID NOT NULL REFERENCES analytics_reports(id),
  shared_with_user_id TEXT REFERENCES "user"(id),
  shared_with_role TEXT,
  shared_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Acceptance Criteria:**

- [ ] Users can select data source and build queries
- [ ] Support for filtering, grouping, aggregation
- [ ] Visualizations: bar, line, pie charts + pivot table
- [ ] Export to CSV, Excel, JSON
- [ ] Field-level access control on exports
- [ ] Reports can be saved and shared

---

## Phase 4: UX Enhancements (P3)

### U-001: Personalized Dashboard

**Priority:** P3
**Requirement:** UI-AGG-002
**Effort:** Medium

**Database Schema:**

```sql
CREATE TABLE dashboard_layouts (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES "user"(id),
  widgets JSONB NOT NULL, -- ordered list of widget configs
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE dashboard_widget_defaults (
  id UUID PRIMARY KEY,
  role TEXT NOT NULL, -- 'org_admin', 'reporter', 'viasport_admin'
  widgets JSONB NOT NULL,
  UNIQUE(role)
);
```

**Acceptance Criteria:**

- [ ] Users can add/remove/reorder dashboard widgets
- [ ] Layout persists across sessions
- [ ] Different roles have different default layouts
- [ ] Reporting progress widget shows task status

---

### U-002: Global Search

**Priority:** P3
**Requirement:** UI-AGG-005
**Effort:** Medium

**Acceptance Criteria:**

- [ ] Search bar in header searches across entities
- [ ] Results grouped by type (orgs, users, submissions, forms)
- [ ] Results respect user permissions
- [ ] Search terms highlighted in results
- [ ] Recent searches saved per user

---

### U-003: Accessibility Enhancements

**Priority:** P3
**Requirement:** UI-AGG-003
**Effort:** Medium

**Acceptance Criteria:**

- [ ] WCAG 2.1 AA audit completed
- [ ] All critical issues remediated
- [ ] High contrast mode toggle available
- [ ] Full keyboard navigation support
- [ ] Screen reader compatibility verified

---

### U-004: Support Ticket System

**Priority:** P3
**Requirement:** UI-AGG-006
**Effort:** Medium

**Database Schema:**

```sql
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL, -- 'technical', 'reporting', 'access', 'other'
  priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  status TEXT DEFAULT 'open', -- 'open', 'in_progress', 'waiting_response', 'resolved', 'closed'

  submitter_id TEXT NOT NULL REFERENCES "user"(id),
  organization_id UUID REFERENCES organizations(id),
  assigned_to TEXT REFERENCES "user"(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE ticket_messages (
  id UUID PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES support_tickets(id),
  author_id TEXT NOT NULL REFERENCES "user"(id),
  body TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false, -- admin-only notes
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ticket_ratings (
  id UUID PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES support_tickets(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Acceptance Criteria:**

- [ ] Users can submit support tickets
- [ ] Ticket status tracked through workflow
- [ ] Admins can respond and manage tickets
- [ ] Email notifications on ticket updates
- [ ] Resolution triggers feedback prompt

---

## Phase 5: Training & Help (P4)

### T-001: Template Library

**Priority:** P4
**Requirement:** TO-AGG-001
**Effort:** Small

**Database Schema:**

```sql
CREATE TABLE templates (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES template_categories(id),
  file_key TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE template_categories (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE template_form_links (
  id UUID PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES templates(id),
  form_id UUID REFERENCES forms(id),
  field_key TEXT, -- optional: link to specific field
  UNIQUE(template_id, form_id, field_key)
);
```

**Acceptance Criteria:**

- [ ] Templates library page with categories
- [ ] Template preview and download
- [ ] Contextual template links in forms

---

### T-002: Guided Walkthroughs

**Priority:** P4
**Requirement:** TO-AGG-002
**Effort:** Medium

**Database Schema:**

```sql
CREATE TABLE user_onboarding_state (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES "user"(id),
  completed_tours JSONB DEFAULT '[]', -- list of tour keys
  skipped_tours JSONB DEFAULT '[]',
  last_tour_at TIMESTAMPTZ,
  UNIQUE(user_id)
);
```

**Acceptance Criteria:**

- [ ] New users see onboarding tour automatically
- [ ] Tours can be skipped and replayed
- [ ] Completion is tracked per user

---

### T-003: Help Center & FAQ

**Priority:** P4
**Requirement:** TO-AGG-003
**Effort:** Small

**Acceptance Criteria:**

- [ ] Help center with categorized articles
- [ ] FAQ section with search
- [ ] Contextual help links from UI

---

## Summary: Implementation Phases

| Phase       | Items                             | Focus                                              |
| ----------- | --------------------------------- | -------------------------------------------------- |
| **Phase 1** | F-001, F-002, F-003               | Foundation (Orgs, Audit, Notifications)            |
| **Phase 2** | S-001, S-002, D-001, D-002, R-001 | Core SIN (MFA, Security, Forms, Import, Reporting) |
| **Phase 3** | C-001, C-002, R-002               | Compliance (Privacy, Quality, Analytics)           |
| **Phase 4** | U-001, U-002, U-003, U-004        | UX (Dashboard, Search, A11y, Support)              |
| **Phase 5** | T-001, T-002, T-003               | Training (Templates, Tours, Help)                  |

---

## Appendix: Existing Code to Leverage

| Existing Code                      | Use For                     |
| ---------------------------------- | --------------------------- |
| `src/features/roles/`              | Extend for org-scoped roles |
| `src/components/form-fields/`      | Form builder field types    |
| `src/lib/email/sendgrid.ts`        | Notification emails         |
| `src/components/ui/data-table.tsx` | Admin dashboards            |
| `src/lib/utils/csv-export.ts`      | Export functionality        |
| `src/lib/pacer/`                   | Rate limiting for security  |
| `src/features/membership/`         | Pattern for org membership  |
| `src/routes/onboarding/`           | Pattern for guided flows    |
