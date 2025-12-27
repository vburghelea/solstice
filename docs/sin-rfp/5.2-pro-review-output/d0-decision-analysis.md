# D0 Decision Analysis: SIN RFP 5.2 Blocking Decisions

> **Document Purpose:** Detailed analysis of each blocking decision in the consolidated backlog with recommendations, rationale, and implementation guidance.
>
> **Last Updated:** 2025-12-27
> **Version:** 1.2 (Verified corrections from codebase review)
>
> **Source:** `docs/sin-rfp/5.2-pro-review-output/consolidated-backlog.md`

---

## Critical Notice

**Several of these "decisions" are not just policy choices — they are live security bugs in the current codebase.** The priority matrix below has been adjusted to reflect actual code state, not theoretical planning order.

Items marked with 🔴 are **currently unsafe** and require immediate fixes regardless of decision outcome.

---

## Assumptions

Before implementing these decisions, confirm the following architectural assumptions:

| Assumption                            | Current State                                          | Impact                                                 |
| ------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------ |
| **QC and SIN are separate databases** | Yes (separate RDS instances per stage)                 | D0.12 is effectively per-tenant without schema changes |
| **Tenant key available at runtime**   | Yes (`getTenantKey()` in `src/tenant/`)                | Can enforce tenant-specific behavior                   |
| **Feature flags are server-enforced** | Partial (UI gating exists, server gating inconsistent) | Must add server-side checks                            |

---

## Executive Summary

The consolidated backlog identifies **17 blocking decisions** (D0.1-D0.17) that must be resolved before implementation streams can proceed. These decisions affect:

- Data visibility and scoping (D0.1, D0.2, D0.10)
- Security boundaries (D0.3, D0.9, D0.11)
- Data integrity (D0.4, D0.5, D0.6, D0.7, D0.8)
- Audit integrity (D0.12)
- Privacy compliance (D0.13)
- Email/provider policy (D0.14)
- Feature scope and rollout (D0.15, D0.16)
- Infrastructure/runtime architecture (D0.17)

Decision status: All D0 decisions are accepted as of 2025-12-26.

### Decision Priority Matrix

**Priority adjusted based on actual codebase security state:**

| Priority | Decision | Recommended Answer                   | Blocks                   | Current State                                        |
| -------- | -------- | ------------------------------------ | ------------------------ | ---------------------------------------------------- |
| **P0**   | D0.1     | Personal scope only                  | Stream C (reports)       | 🔴 **UNSAFE**: No auth, returns all reports          |
| **P0**   | D0.2     | Admin-only default                   | Stream C (reporting)     | 🔴 **UNSAFE**: Unauthenticated access to submissions |
| **P0**   | D0.3     | Server-only                          | Stream I (notifications) | 🔴 **UNSAFE**: Unauthenticated, spoofable audit      |
| **P0**   | D0.5     | Add with transitions                 | Stream F (workflow)      | 🔴 **BROKEN**: UI/DB enum mismatch                   |
| **P0**   | D0.9     | Global admin only                    | Stream C (org creation)  | 🔴 **UNSAFE**: Any user can create orgs              |
| **P0**   | D0.12    | Advisory locks (fork prevention)     | Stream G (audit)         | 🔴 **UNSAFE**: Hash chain can fork                   |
| **P1**   | D0.7     | Server allowlist                     | Stream F (filters)       | ⚠️ Filters logged but not applied                    |
| **P1**   | D0.8     | Sanitize and keep                    | Stream E (import)        | ⚠️ Rollback doesn't sanitize PII                     |
| **P1**   | D0.11    | Flag-first                           | Stream G (detection)     | ⚠️ Needs threshold tuning                            |
| **P1**   | D0.17    | ECS Fargate                          | Stream L (batch)         | ⚠️ Worker exists but not wired                       |
| **P2**   | D0.4     | Clamp to 1                           | Stream D (forms)         | ⚠️ Config allows multi-file                          |
| **P2**   | D0.6     | Tiered classification                | Stream F (redaction)     | ⚠️ No field-level PII flags                          |
| **P2**   | D0.14    | SES everywhere                       | Stream I (email)         | ⚠️ SendGrid still wired                              |
| **P3**   | D0.10    | Admin-only (defer)                   | Stream C (members)       | ✅ Relatively safe                                   |
| **P3**   | D0.13    | 14 days auto-delete                  | Stream H (DSAR)          | ⚠️ No expiry field in schema                         |
| **P3**   | D0.15    | Build once, deploy everywhere        | Stream M (features)      | ✅ Planning only                                     |
| **P3**   | D0.16    | Full pivot builder + charts + export | Stream M (analytics)     | ✅ Planning only                                     |

### Pros/Cons Summary (Recommended Choices)

| Decision | Recommendation                                          | Pros                                                  | Cons                                                       |
| -------- | ------------------------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------- |
| D0.1     | Personal scope for null-org reports                     | Clear ownership, avoids cross-org leakage             | No system-wide null-org reports without explicit scope     |
| D0.2     | Admin-only for null-org reporting items                 | Safe default, minimal change                          | Broadcast workflows need explicit assignment table later   |
| D0.3     | Server-only createNotification                          | Prevents spoof/spam, correct audit actor              | Requires separate admin broadcast endpoint                 |
| D0.4     | Clamp maxFiles = 1                                      | Fast hardening, avoids array bugs                     | Limits multi-file workflows until reworked                 |
| D0.5     | Add rejected with transition rules                      | Matches UI intent, formal workflow                    | Migration + extra transition logic                         |
| D0.6     | Tiered data classification per field                    | Precise redaction, compliance-ready                   | Schema/UI changes, requires author discipline              |
| D0.7     | Server-side allowlist for filters/columns               | Strongest injection defense, predictable exports      | Manual upkeep per data source                              |
| D0.8     | Sanitize and keep import errors                         | Keeps audit trail without PII                         | Still retains metadata, needs sanitize job                 |
| D0.9     | Global admin only org creation                          | Strong governance, prevents rogue orgs                | Slower onboarding, admin bottleneck                        |
| D0.10    | Admin-only member list (defer directory)                | Minimizes PII exposure                                | Reduces member discoverability                             |
| D0.11    | Flag-first thresholds                                   | Fewer false lockouts, early alerts                    | More attempts before lock triggers                         |
| D0.12    | Advisory locks for chain integrity                      | Prevents forks, maintains tamper evidence             | Serializes writes (acceptable tradeoff)                    |
| D0.13    | 14-day DSAR retention                                   | Balances access and minimization                      | Missed window requires re-request                          |
| D0.14    | SES everywhere                                          | Simplest ops, consistent residency, fewer edge cases  | May require migrating QC workflows, fewer fallback options |
| D0.15    | Build once, deploy everywhere                           | Fast delivery, consistent UX, no pilot overhead       | Higher risk if untested, less phased feedback              |
| D0.16    | Full pivot builder + charts + export (library-assisted) | Meets requirements fully, reusable analytics platform | Larger scope, higher UI/maintenance and bundle risk        |
| D0.17    | ECS Fargate batch runtime                               | Long-running jobs, scalable                           | Higher infra complexity/cost vs Lambda                     |

### Decision Status and ADRs

| Decision | Status   | ADR                                                                             |
| -------- | -------- | ------------------------------------------------------------------------------- |
| D0.1     | Accepted | `docs/sin-rfp/decisions/ADR-2025-12-26-d0-1-saved-reports-null-org-scope.md`    |
| D0.2     | Accepted | `docs/sin-rfp/decisions/ADR-2025-12-26-d0-2-reporting-null-org-visibility.md`   |
| D0.3     | Accepted | `docs/sin-rfp/decisions/ADR-2025-12-26-d0-3-create-notification-exposure.md`    |
| D0.4     | Accepted | `docs/sin-rfp/decisions/ADR-2025-12-26-d0-4-forms-multifile-support.md`         |
| D0.5     | Accepted | `docs/sin-rfp/decisions/ADR-2025-12-26-d0-5-reporting-rejected-status.md`       |
| D0.6     | Accepted | `docs/sin-rfp/decisions/ADR-2025-12-26-d0-6-form-pii-classification.md`         |
| D0.7     | Accepted | `docs/sin-rfp/decisions/ADR-2025-12-26-d0-7-report-filter-allowlist.md`         |
| D0.8     | Accepted | `docs/sin-rfp/decisions/ADR-2025-12-26-d0-8-import-error-retention.md`          |
| D0.9     | Accepted | `docs/sin-rfp/decisions/ADR-2025-12-26-d0-9-org-creation-policy.md`             |
| D0.10    | Accepted | `docs/sin-rfp/decisions/ADR-2025-12-26-d0-10-member-directory-exposure.md`      |
| D0.11    | Accepted | `docs/sin-rfp/decisions/ADR-2025-12-26-d0-11-security-anomaly-thresholds.md`    |
| D0.12    | Accepted | `docs/sin-rfp/decisions/ADR-2025-12-26-d0-12-audit-hash-chain-scope.md`         |
| D0.13    | Accepted | `docs/sin-rfp/decisions/ADR-2025-12-26-d0-13-dsar-export-retention.md`          |
| D0.14    | Accepted | `docs/sin-rfp/decisions/ADR-2025-12-26-d0-14-email-provider-policy.md`          |
| D0.15    | Accepted | `docs/sin-rfp/decisions/ADR-2025-12-26-d0-15-templates-help-support-rollout.md` |
| D0.16    | Accepted | `docs/sin-rfp/decisions/ADR-2025-12-26-d0-16-analytics-charts-pivots-scope.md`  |
| D0.17    | Accepted | `docs/sin-rfp/decisions/ADR-2025-12-26-d0-17-import-batch-runtime.md`           |

---

## D0.1: Saved Reports with `organizationId = null`

### Current Repo State: 🔴 UNSAFE

**File:** `src/features/reports/reports.queries.ts`

**Issues found:**

1. `listSavedReports` has **no session check** — unauthenticated callers can enumerate all reports
2. If `organizationId` is omitted, returns **all saved reports** in the system
3. `isOrgWide` logic leaks cross-org: the `or()` clause doesn't scope org-wide reports to a specific org
4. No validation that `sharedWith` users are in the same org

**Blast radius:** Full metadata leak of all report definitions (names, filters, sharedWith lists)

### Context

The `saved_reports` table has a nullable `organizationId` field. Currently in `src/features/reports/reports.queries.ts:13-35`, when listing reports, if no org filter is provided, the query returns all reports including those with `null` organizationId combined with `isOrgWide` reports.

### The Problem

- Reports with `organizationId = null` could be personal reports (user's own analysis)
- Or they could be system-wide reports (global admin reports)
- Current code doesn't distinguish, creating ambiguity about who can see what
- **Critical:** No auth check means anyone can list all reports

### Options

| Option                      | Description                           | Pros                      | Cons                                           |
| --------------------------- | ------------------------------------- | ------------------------- | ---------------------------------------------- | --------------------------- | --------------------------------- |
| **A: Personal scope only**  | Null = owner-only visibility          | Simple, predictable       | No system-wide reports without explicit org    |
| **B: Admin-visible**        | Null = global admins can see          | Supports system reports   | Unclear ownership, could leak personal reports |
| **C: System org ID**        | Create reserved "solstice-system" org | Explicit, clear semantics | Migration complexity, adds abstraction         |
| **D: Explicit scope field** | Add `scope: 'personal'                | 'org'                     | 'system'`                                      | Most flexible, clear intent | Schema change, migration required |

### Recommendation: Option A (Personal Scope Only)

```typescript
// Visibility rules for saved_reports:
// 1. organizationId = null → only owner can see (via owner_id match)
// 2. organizationId = X → users with org access can see if:
//    - They are the owner, OR
//    - They are in sharedWith array, OR
//    - isOrgWide = true AND they have org access
// 3. Global admins can see all reports (override)
```

### Rationale

- Simplest mental model: "null org = my private report"
- No migration needed beyond adding the access control logic
- If system-wide reports are needed later, explicitly assign them to a system org or add the scope field then
- Prevents accidental data leakage in the meantime

### Implementation Impact

Stream C (C1-C3)

### Acceptance Criteria

- [ ] A non-admin user can only list reports they own, that are shared with them, or org-wide reports scoped to an org they belong to
- [ ] Unauthenticated requests return 401
- [ ] `isOrgWide=true` reports are only visible within that specific org
- [ ] Creating `isOrgWide=true` requires org admin role
- [ ] `sharedWith` validation ensures users are in the same org (or explicitly allowed)

### Implementation Sketch

```typescript
// src/features/reports/reports.queries.ts
export const listSavedReports = createServerFn({ method: "POST" })
  .inputValidator(listSavedReportsSchema.parse)
  .handler(async ({ data }) => {
    const session = await requireSession(); // FIX: Add auth check
    const userId = session.user.id;
    const isAdmin = await isGlobalAdmin(userId);

    let query = db.select().from(savedReports);

    if (isAdmin) {
      // Admins see all reports (with optional org filter)
      if (data.organizationId) {
        query = query.where(eq(savedReports.organizationId, data.organizationId));
      }
    } else {
      // Non-admins see:
      // 1. Their own reports (any org, including null)
      // 2. Reports shared with them
      // 3. Org-wide reports in their accessible orgs (MUST scope to accessible orgs)
      const accessibleOrgIds = await getAccessibleOrgIds(userId);

      query = query.where(
        or(
          eq(savedReports.ownerId, userId),
          sql`${savedReports.sharedWith} @> ${JSON.stringify([userId])}::jsonb`,
          and(
            eq(savedReports.isOrgWide, true),
            inArray(savedReports.organizationId, accessibleOrgIds), // FIX: Scope org-wide
          ),
        ),
      );
    }

    return query;
  });

// src/features/reports/reports.mutations.ts - Add creation-time enforcement
export const createSavedReport = createServerFn({ method: "POST" })
  .inputValidator(createSavedReportSchema.parse)
  .handler(async ({ data }) => {
    const session = await requireSession();

    // FIX: Enforce isOrgWide invariants
    if (data.organizationId === null && data.isOrgWide) {
      throw badRequest("Cannot create org-wide report without an organization");
    }

    if (data.isOrgWide) {
      // Require org admin to create org-wide reports
      await requireOrganizationAccess({
        userId: session.user.id,
        organizationId: data.organizationId,
        roles: ORG_ADMIN_ROLES,
      });
    }

    // FIX: Validate sharedWith users are in same org
    if (data.sharedWith?.length && data.organizationId) {
      const orgMembers = await getOrganizationMemberIds(data.organizationId);
      const invalidUsers = data.sharedWith.filter((id) => !orgMembers.includes(id));
      if (invalidUsers.length > 0) {
        throw badRequest("Cannot share with users outside the organization");
      }
    }

    // ... create report
  });
```

---

## D0.2: Reporting Cycles/Tasks Without `organizationId`

### Current Repo State: 🔴 UNSAFE

**File:** `src/features/reporting/reporting.queries.ts`

**Issues found:**

1. `listReportingCycles`: **No session check** — unauthenticated access
2. `listReportingTasks`: Session only checked if `organizationId` is provided; otherwise lists broadly
3. `listReportingSubmissions`: Only checks org access **if `userId` exists**. If unauthenticated (`userId = null`), still returns submissions for any `organizationId`

**Blast radius:** Unauthenticated enumeration of all reporting cycles, tasks, and submissions

### Context

In `src/features/reporting/reporting.queries.ts`, cycles and tasks can have `null` organizationId. The intent may be "applies to all orgs of a type" but this creates ambiguity about who can view/manage them.

### The Problem

- `listReportingCycles` has no session check at all
- `listReportingSubmissions` allows unauthenticated access when userId is null
- Tasks with `null` org could mean "broadcast to everyone" or "misconfigured"
- No clear visibility boundary

### Options

| Option                           | Description                                                        | Use Case                      |
| -------------------------------- | ------------------------------------------------------------------ | ----------------------------- |
| **A: Admin-only**                | Null org items visible only to global admins                       | System-configured cycles      |
| **B: Filter by accessible orgs** | Show tasks matching user's org memberships via `organization_type` | Delegated admin access        |
| **C: Explicit assignment table** | `reporting_task_assignments(task_id, org_id)`                      | Most precise targeting        |
| **D: Require org_id always**     | Make organizationId NOT NULL                                       | Simplest but blocks broadcast |

### Recommendation: Option A (Admin-Only Default) with Option C Roadmap

**Short-term:** Treat null organizationId as admin-only

```typescript
// listReportingCycles: require session, if not global admin, filter to:
//   organizationId IN (user's accessible org IDs)
```

**Long-term:** Add explicit assignment table for broadcasts

```sql
CREATE TABLE reporting_task_assignments (
  task_id UUID REFERENCES reporting_tasks(id),
  organization_id UUID REFERENCES organizations(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (task_id, organization_id)
);
```

### Rationale

- Immediate security: unscoped items are admin-only (safe default)
- Preserves flexibility for broadcast scenarios via `organization_type` filter
- Future enhancement (assignment table) gives explicit control without ambiguity
- Avoids the "null means everyone" interpretation which is a security anti-pattern

**Note:** `createReportingTask` is already global-admin + step-up gated, so "who can create broadcast tasks" is solved. The issue is visibility rules for reading.

### Implementation Impact

Stream C (C9)

### Acceptance Criteria

- [ ] All reporting query endpoints require authentication (return 401 if no session)
- [ ] Non-admin users only see cycles/tasks assigned to their accessible orgs
- [ ] Visibility rules for tasks where `organizationId = null`:
  - If `organizationType != null`: visible to members of orgs of that type
  - If both null: visible only to global admins (broadcast, not all-users)
- [ ] `listReportingSubmissions` always validates org access, never allows null userId to bypass

### Implementation Sketch

```typescript
// src/features/reporting/reporting.queries.ts
export const listReportingCycles = createServerFn({ method: "POST" })
  .inputValidator(listReportingCyclesSchema.parse)
  .handler(async ({ data }) => {
    const session = await requireSession(); // FIX: Now required
    const userId = session.user.id;
    const isAdmin = await isGlobalAdmin(userId);

    let query = db.select().from(reportingCycles);

    if (!isAdmin) {
      // Non-admins only see cycles that have tasks assigned to their orgs
      const accessibleOrgIds = await getAccessibleOrgIds(userId);
      const userOrgTypes = await getUserOrgTypes(userId); // e.g., ['pso', 'club']

      query = query.where(
        exists(
          db
            .select()
            .from(reportingTasks)
            .where(
              and(
                eq(reportingTasks.cycleId, reportingCycles.id),
                or(
                  // Direct org assignment
                  inArray(reportingTasks.organizationId, accessibleOrgIds),
                  // Org type broadcast (user belongs to an org of that type)
                  and(
                    isNull(reportingTasks.organizationId),
                    inArray(reportingTasks.organizationType, userOrgTypes),
                  ),
                ),
              ),
            ),
        ),
      );
    }

    return query;
  });

// FIX: listReportingSubmissions - ALWAYS require auth
export const listReportingSubmissions = createServerFn({ method: "POST" })
  .inputValidator(listReportingSubmissionsSchema.parse)
  .handler(async ({ data }) => {
    const session = await requireSession(); // FIX: Remove conditional auth
    const userId = session.user.id;

    // Always validate org access
    if (data.organizationId) {
      await requireOrganizationAccess({
        userId,
        organizationId: data.organizationId,
      });
    } else {
      // If no org specified, only return user's own submissions or require admin
      const isAdmin = await isGlobalAdmin(userId);
      if (!isAdmin) {
        // Scope to user's accessible orgs
        const accessibleOrgIds = await getAccessibleOrgIds(userId);
        data.organizationIds = accessibleOrgIds; // Filter internally
      }
    }

    // ... rest of query
  });
```

---

## D0.3: `createNotification` Exposure

### Current Repo State: 🔴 UNSAFE

**File:** `src/features/notifications/notifications.mutations.ts`

**Issues found:**

1. `createNotification` (lines 122-157): **No session check** — unauthenticated callers can create notifications for any user
2. Audit log `actorUserId` set to `data.userId` (line 148) — **the target user, not the actual actor** (audit spoofing)
3. `createNotificationTemplate` (lines 159-193): Has session check but **NO `requireAdmin`** — any authenticated user can create templates
4. `scheduleNotification` (lines 248-282): Has session check but **NO `requireAdmin`** — any authenticated user can schedule notifications

**Note:** `updateNotificationTemplate` and `deleteNotificationTemplate` DO correctly require admin.

**Blast radius:**

- Notification spam/phishing via unauthenticated `createNotification`
- Template pollution via `createNotificationTemplate` without admin check
- Scheduled notification abuse via `scheduleNotification` without admin check
- Audit log integrity destroyed (actor is spoofed)

### Context

In `src/features/notifications/notifications.mutations.ts:122-156`, `createNotification` has no session check and sets the audit `actorUserId` from `data.userId` (the target user, not the actual actor).

### The Problem

- Any unauthenticated caller can create notifications for any user
- Audit trail is spoofable (actor = target, not actual actor)
- Could be used for spam, phishing, or audit log pollution
- Other notification endpoints also lack proper admin enforcement

### Options

| Option                     | Description                                   | Who Can Call                       |
| -------------------------- | --------------------------------------------- | ---------------------------------- |
| **A: Server-only**         | Remove from client-callable server fns        | Internal code only                 |
| **B: Require session**     | Add auth middleware                           | Any authenticated user             |
| **C: Require admin**       | Add admin check                               | Only admins                        |
| **D: Allowlist + session** | Session required, restrict notification types | Authenticated users, limited types |

### Recommendation: Option A (Server-Only) with Option C for Admin UI

```typescript
// Move to internal helper (not exported as server fn)
// src/lib/notifications/create.ts
export async function createNotificationInternal(params: {
  userId: string;
  type: string;
  title: string;
  body: string;
  actorUserId?: string; // null for system, required for admin actions
  organizationId?: string;
}) {
  // Internal implementation - not client-callable
}

// If admin needs to send notifications, create separate endpoint:
export const sendAdminNotification = createServerFn({ method: "POST" })
  .inputValidator(adminNotificationSchema.parse)
  .handler(async ({ data }) => {
    const session = await requireSession();
    await requireAdmin(session.user.id);
    await requireRecentAuth(session); // Step-up for manual notifications

    return createNotificationInternal({
      ...data,
      actorUserId: session.user.id, // Actor is the admin, not target
    });
  });
```

### Rationale

- Notifications triggered by system actions (reminders, security alerts) should be internal
- Manual notifications (admin broadcasts) need explicit admin gate + step-up
- Audit actor must always come from session, never from client input
- Prevents notification spam and audit spoofing

### Implementation Impact

Stream I (I1-I3)

### Implementation Sketch

```typescript
// src/lib/notifications/create.ts (internal, not client-callable)
import { db } from "~/db";
import { notifications } from "~/db/schema/notifications.schema";
import { logDataChange } from "~/lib/audit";

export async function createNotificationInternal(params: {
  userId: string;
  type: string;
  title: string;
  body: string;
  link?: string;
  organizationId?: string;
  actorUserId?: string | null; // null = system
  metadata?: Record<string, unknown>;
}) {
  const [notification] = await db
    .insert(notifications)
    .values({
      userId: params.userId,
      type: params.type,
      category: getNotificationCategory(params.type),
      title: params.title,
      body: params.body,
      link: params.link,
      organizationId: params.organizationId,
      metadata: params.metadata ?? {},
    })
    .returning();

  await logDataChange({
    action: "NOTIFICATION_CREATED",
    targetType: "notification",
    targetId: notification.id,
    actorUserId: params.actorUserId ?? null, // System if not specified
    metadata: {
      notificationType: params.type,
      targetUserId: params.userId,
    },
  });

  return notification;
}

// Remove the old createNotification server fn entirely
// Or keep it but make it admin-only with proper actor tracking
```

---

## D0.4: Multi-File Upload Support

### Context

Form fields can have `fileConfig.maxFiles > 1`, but the UI (`ValidatedFileUpload.tsx`) and server only handle single files. The `buildSubmissionFiles` function expects single values, not arrays.

### The Problem

- Config allows multi-file but implementation is broken
- Array payloads could cause validation bypass or crashes
- Inconsistent behavior between config and reality

### Options

| Option                         | Description                                         | Effort           |
| ------------------------------ | --------------------------------------------------- | ---------------- |
| **A: Clamp to maxFiles=1**     | Enforce single file everywhere until full support   | Low              |
| **B: Full multi-file support** | Update UI, validation, storage, submission handling | High (2-3 weeks) |

### Recommendation: Option A (Clamp to maxFiles=1)

```typescript
// src/features/forms/forms.utils.ts
export function normalizeFileConfig(config: FileConfig): FileConfig {
  return {
    ...config,
    maxFiles: 1, // Clamp until multi-file is fully implemented
  };
}

// src/features/forms/forms.mutations.ts (validation)
if (Array.isArray(filePayload)) {
  throw badRequest("Multi-file uploads not yet supported");
}
```

### Rationale

- Multi-file adds complexity across UI, validation, storage key patterns, and export
- Single-file covers 90%+ of use cases for SIN (document uploads, reports)
- Can be revisited post-MVP if there's a real need
- Prevents partial implementation from causing bugs

### Implementation Impact

Stream D (D9)

### Implementation Sketch

```typescript
// src/features/forms/forms.utils.ts
export function getFileConfigForField(
  definition: FormDefinition,
  fieldKey: string,
): FileConfig {
  const field = definition.fields.find((f) => f.key === fieldKey);

  if (!field || field.type !== "file") {
    return DEFAULT_FILE_CONFIG;
  }

  return {
    allowedTypes: field.fileConfig?.allowedTypes ?? DEFAULT_ALLOWED_TYPES,
    maxSizeBytes: field.fileConfig?.maxSizeBytes ?? DEFAULT_MAX_SIZE,
    maxFiles: 1, // Always clamp to 1 until full multi-file support
  };
}

// src/features/forms/forms.mutations.ts
export const submitForm = createServerFn({ method: "POST" })
  .inputValidator(submitFormSchema.parse)
  .handler(async ({ data }) => {
    // ... existing logic

    // Validate file fields
    for (const field of definition.fields.filter((f) => f.type === "file")) {
      const value = data.payload[field.key];

      // Reject arrays explicitly
      if (Array.isArray(value)) {
        throw badRequest(`Field "${field.label}" does not support multiple files`);
      }
    }

    // ... rest of submission
  });
```

---

## D0.5: Reporting Status "rejected" Enum

### Context

The UI in `reporting-dashboard-shell.tsx` shows "rejected" as a status option, but the database enum in `reporting.schema.ts` doesn't include it. This causes a mismatch.

### The Problem

- UI shows option that DB can't store
- If selected, insert will fail with constraint violation
- Unclear if rejection is part of the intended workflow

### Options

| Option                           | Description                                          | Workflow Implication                   |
| -------------------------------- | ---------------------------------------------------- | -------------------------------------- |
| **A: Add "rejected" to enum**    | Full support for rejection workflow                  | Submissions can be terminally rejected |
| **B: Remove from UI**            | Use "changes_requested" only                         | Submissions can always be resubmitted  |
| **C: Add with transition rules** | "rejected" only from "under_review", requires reason | Formal rejection with audit trail      |

### Recommendation: Option C (Add with Transition Rules)

```sql
-- Migration: Add rejected status
ALTER TYPE reporting_submission_status ADD VALUE 'rejected';
```

**Transition rules (enforced in code):**

- `rejected` can only be reached from `under_review`
- `rejected` is terminal (cannot transition out without admin override)

### Rationale

- Reporting workflows legitimately need rejection (non-compliant submissions)
- Terminal status prevents infinite resubmission loops
- Transition rules ensure proper workflow
- Audit trail captures who rejected and why

### Implementation Impact

Stream F (F1, F3)

### Implementation Sketch

```typescript
// src/features/reporting/reporting.mutations.ts

const VALID_TRANSITIONS: Record<string, string[]> = {
  not_started: ["in_progress"],
  in_progress: ["submitted"],
  submitted: ["under_review"],
  under_review: ["approved", "changes_requested", "rejected"],
  changes_requested: ["in_progress", "submitted"],
  approved: [], // terminal
  rejected: [], // terminal (admin can reopen via separate action if needed)
};

export const updateReportingSubmission = createServerFn({ method: "POST" })
  .inputValidator(updateReportingSubmissionSchema.parse)
  .handler(async ({ data }) => {
    const session = await requireSession();

    // Get current submission
    const submission = await getReportingSubmission(data.id);
    if (!submission) throw notFound();

    // Validate transition
    const allowedNextStatuses = VALID_TRANSITIONS[submission.status] ?? [];
    if (!allowedNextStatuses.includes(data.status)) {
      throw badRequest(
        `Cannot transition from "${submission.status}" to "${data.status}"`,
      );
    }

    // Require rejection reason
    if (data.status === "rejected" && !data.rejectionReason) {
      throw badRequest("Rejection reason is required");
    }

    // Clear stale metadata on status change
    const updates: Partial<ReportingSubmission> = {
      status: data.status,
    };

    if (data.status === "rejected") {
      updates.reviewedBy = session.user.id;
      updates.reviewedAt = new Date();
      updates.reviewNotes = data.rejectionReason;
    }

    if (data.status === "submitted") {
      updates.submittedBy = session.user.id;
      updates.submittedAt = new Date();
      // Clear previous review data
      updates.reviewedBy = null;
      updates.reviewedAt = null;
      updates.reviewNotes = null;
    }

    // ... update and audit log
  });
```

---

## D0.6: PII Model for Form Payloads

### Context

Form submissions contain arbitrary user data in JSONB `payload`. Some fields contain PII (names, addresses, DOB), others don't (fiscal year, sport type). Current export only masks top-level sensitive field names, not nested form data.

### The Problem

- Exports can leak PII inside form payloads
- No way to know which form fields contain PII
- DSAR exports need to include user's PII but admin exports should redact it

### Options

| Option                              | Description                             | Granularity |
| ----------------------------------- | --------------------------------------- | ----------- | ------------ | ------ |
| **A: Per-field PII flags**          | Add `pii: boolean` to form field schema | Field-level |
| **B: Field type inference**         | Treat email, phone, date fields as PII  | Type-based  |
| **C: Form-level PII flag**          | Mark entire forms as containing PII     | Form-level  |
| **D: Explicit data classification** | `pii: 'none'                            | 'personal'  | 'sensitive'` | Tiered |

### Recommendation: Option D (Tiered Classification)

```typescript
// src/features/forms/forms.schemas.ts
const formFieldSchema = z.object({
  key: z.string(),
  type: fieldTypeEnum,
  label: z.string(),
  // ... existing fields
  dataClassification: z.enum(["none", "personal", "sensitive"]).default("none"),
  // none: public data (sport type, fiscal year)
  // personal: PII (name, email, phone) - redact in general reports
  // sensitive: sensitive PII (DOB, health info) - requires pii.read permission
});
```

**Export behavior:**

- `none`: always visible
- `personal`: visible to org admins, redacted for others
- `sensitive`: requires explicit `pii.read` permission, always redacted in exports unless DSAR

### Rationale

- Tiered approach matches real-world data classification needs
- Form creators explicitly mark fields during form building
- Export logic can check permissions and apply appropriate redaction
- DSAR exports ignore classification (user is requesting their own data)
- Aligns with PIPEDA's distinction between personal info and sensitive personal info

### Implementation Impact

Stream F (F6-F8), Stream D

### Implementation Sketch

```typescript
// src/features/reports/reports.mutations.ts

type DataClassification = "none" | "personal" | "sensitive";

interface RedactionContext {
  userRoles: string[];
  isOrgAdmin: boolean;
  isGlobalAdmin: boolean;
  hasPiiReadPermission: boolean;
  isDsarExport: boolean;
}

function shouldRedactField(
  classification: DataClassification,
  context: RedactionContext,
): boolean {
  // DSAR exports always include user's own data
  if (context.isDsarExport) return false;

  switch (classification) {
    case "none":
      return false;
    case "personal":
      // Org admins and above can see personal data
      return !context.isOrgAdmin && !context.isGlobalAdmin;
    case "sensitive":
      // Requires explicit permission
      return !context.hasPiiReadPermission;
  }
}

function redactFormPayload(
  payload: Record<string, unknown>,
  formDefinition: FormDefinition,
  context: RedactionContext,
): Record<string, unknown> {
  const redacted: Record<string, unknown> = {};

  for (const field of formDefinition.fields) {
    const value = payload[field.key];
    const classification = field.dataClassification ?? "none";

    if (shouldRedactField(classification, context)) {
      redacted[field.key] = "[REDACTED]";
    } else {
      redacted[field.key] = value;
    }
  }

  return redacted;
}
```

---

## D0.7: Report Filter/Column Allowlist

### Current Repo State: ⚠️ CORRECTNESS ISSUE

**File:** `src/features/reports/reports.mutations.ts:88-128`

**Verified behavior:** The `loadReportData` function currently **ignores** `filters`, `columns`, and `sort` entirely. It only:

1. Checks the `dataSource` parameter
2. Applies `organizationId` scoping if provided
3. Returns entire tables without filtering

**Immediate issue:** Filters are logged in `filtersUsed` audit field but **not actually applied** — this is a correctness/audit integrity issue, not currently an injection risk.

**Future risk:** When filters ARE implemented, allowlist validation will be critical to prevent SQL injection.

### Context

In `src/features/reports/reports.mutations.ts`, the `loadReportData` function accepts `filters`, `columns`, and `sort` from the client but doesn't use them. The `exportReport` function logs `filtersUsed` but the underlying query ignores these parameters.

### The Problem

- Filters are logged but not applied (audit mismatch)
- No validation infrastructure exists for when filters are implemented
- Current exports return unfiltered data (may include more than expected)
- No column selection — entire rows returned

### Options

| Option                            | Description                              | Safety Level |
| --------------------------------- | ---------------------------------------- | ------------ |
| **A: Server-side allowlist**      | Define valid fields per data source      | High         |
| **B: Schema-based validation**    | Derive from Drizzle schema               | Medium-High  |
| **C: Parameterized queries only** | Use Drizzle query builder, never raw SQL | Medium       |

### Recommendation: Option A (Server-Side Allowlist)

```typescript
// src/features/reports/reports.config.ts
export const DATA_SOURCE_CONFIG: Record<string, DataSourceConfig> = {
  submissions: {
    allowedColumns: ["id", "status", "submittedAt", "organizationId", "formId"],
    allowedFilters: {
      status: { operators: ["eq", "in"], type: "enum" },
      submittedAt: { operators: ["gte", "lte", "between"], type: "date" },
      organizationId: { operators: ["eq"], type: "uuid" },
      formId: { operators: ["eq"], type: "uuid" },
    },
    allowedSorts: ["submittedAt", "status", "createdAt"],
    piiFields: ["payload"],
  },
  memberships: {
    allowedColumns: ["id", "userId", "organizationId", "role", "status"],
    // ...
  },
};
```

### Rationale

- Explicit allowlist is the safest approach
- Prevents SQL injection via column/filter manipulation
- Allows audit log to accurately record what was actually applied
- Can add new fields by updating config, not code
- Different data sources can have different rules

### Implementation Impact

Stream F (F5)

### Implementation Sketch

```typescript
// src/features/reports/reports.validation.ts

export interface DataSourceConfig {
  allowedColumns: string[];
  allowedFilters: Record<string, FilterConfig>;
  allowedSorts: string[];
  piiFields: string[];
}

export interface FilterConfig {
  operators: ("eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "in" | "between")[];
  type: "string" | "number" | "date" | "enum" | "uuid" | "boolean";
}

export function validateReportQuery(
  dataSource: string,
  query: {
    columns?: string[];
    filters?: Record<string, { operator: string; value: unknown }>;
    sort?: { field: string; direction: "asc" | "desc" };
  },
): void {
  const config = DATA_SOURCE_CONFIG[dataSource];
  if (!config) {
    throw badRequest(`Invalid data source: ${dataSource}`);
  }

  // Validate columns
  if (query.columns) {
    for (const col of query.columns) {
      if (!config.allowedColumns.includes(col)) {
        throw badRequest(`Column "${col}" not allowed for ${dataSource}`);
      }
    }
  }

  // Validate filters
  if (query.filters) {
    for (const [field, filter] of Object.entries(query.filters)) {
      const filterConfig = config.allowedFilters[field];
      if (!filterConfig) {
        throw badRequest(`Filter on "${field}" not allowed for ${dataSource}`);
      }
      if (!filterConfig.operators.includes(filter.operator as any)) {
        throw badRequest(
          `Operator "${filter.operator}" not allowed for field "${field}"`,
        );
      }
      // Type validation based on filterConfig.type
      validateFilterValue(filter.value, filterConfig.type);
    }
  }

  // Validate sort
  if (query.sort) {
    if (!config.allowedSorts.includes(query.sort.field)) {
      throw badRequest(`Sort on "${query.sort.field}" not allowed`);
    }
    if (!["asc", "desc"].includes(query.sort.direction)) {
      throw badRequest(`Invalid sort direction: ${query.sort.direction}`);
    }
  }
}
```

---

## D0.8: Import Rollback Error Retention

### Current Repo State: ⚠️ PII RETENTION ISSUE

**File:** `src/features/imports/imports.mutations.ts:454-512`

**Verified behavior:** The `rollbackImportJob` function:

1. ✅ Deletes `formSubmissions` where `importJobId` matches
2. ✅ Updates `importJobs` status to `rolled_back`
3. ❌ Does **NOT** touch `import_job_errors` — raw values with PII remain indefinitely

**Immediate issue:** After rollback, error records containing PII (in `rawValue` column) persist with no sanitization or cleanup.

### Context

When an import is rolled back, the `import_job_errors` table retains row-level errors with `raw_value` (potentially containing PII). The question is whether to keep these for audit/debugging or purge them.

### The Problem

- Error records contain original data that failed validation
- Could include PII from the import file
- Retention creates a second copy of data
- But deletion loses audit trail of what went wrong
- **Current code does not handle this at all**

### Options

| Option                     | Description                           | Retention  |
| -------------------------- | ------------------------------------- | ---------- |
| **A: Keep for 30-90 days** | Time-limited retention                | Short-term |
| **B: Keep indefinitely**   | Full audit trail                      | Permanent  |
| **C: Purge on rollback**   | Delete errors with rollback           | None       |
| **D: Sanitize and keep**   | Redact raw_value, keep error metadata | Sanitized  |

### Recommendation: Option D (Sanitize and Keep)

```typescript
// On rollback or after retention period:
async function sanitizeImportErrors(jobId: string) {
  await db
    .update(importJobErrors)
    .set({
      raw_value: null, // Remove PII
      // Keep: row_number, field_key, error_type, error_message
    })
    .where(eq(importJobErrors.jobId, jobId));
}
```

### Rationale

- Keeps audit trail of what went wrong (row number, field, error type)
- Removes PII from error records
- Supports debugging without data retention risk
- Aligns with data minimization principle

### Implementation Impact

Stream E (E7)

### Implementation Sketch

```typescript
// src/features/imports/imports.mutations.ts

export const rollbackImport = createServerFn({ method: "POST" })
  .inputValidator(rollbackImportSchema.parse)
  .handler(async ({ data }) => {
    const session = await requireSession();
    const job = await getImportJob(data.jobId);

    if (!job) throw notFound();
    if (!job.canRollback) {
      throw badRequest("This import cannot be rolled back");
    }
    if (job.rollbackBefore && new Date() > job.rollbackBefore) {
      throw badRequest("Rollback window has expired");
    }

    await db.transaction(async (tx) => {
      // Delete imported submissions
      await tx.delete(formSubmissions).where(eq(formSubmissions.importJobId, data.jobId));

      // Sanitize error records (keep metadata, remove raw values)
      await tx
        .update(importJobErrors)
        .set({ rawValue: null })
        .where(eq(importJobErrors.jobId, data.jobId));

      // Update job status
      await tx
        .update(importJobs)
        .set({
          status: "rolled_back",
          canRollback: false,
        })
        .where(eq(importJobs.id, data.jobId));
    });

    await logAdminAction({
      action: "IMPORT_ROLLED_BACK",
      targetType: "import_job",
      targetId: data.jobId,
      actorUserId: session.user.id,
      metadata: {
        rowsDeleted: job.stats.rowsSucceeded,
        errorsRetained: true,
        rawValuesSanitized: true,
      },
    });
  });
```

---

## D0.9: Self-Service Org Creation

### Context

In `src/features/organizations/organizations.mutations.ts:120-203`, `createOrganization` only requires the `sin_admin_orgs` feature flag and a session. Any authenticated user can create organizations.

### The Problem

- SIN is a government compliance system with hierarchical org structure
- Uncontrolled org creation could pollute the hierarchy
- viaSport → PSO → Club relationship needs governance
- Creator becomes owner with full permissions

### Options

| Option                              | Description                                           | Control Level   |
| ----------------------------------- | ----------------------------------------------------- | --------------- |
| **A: Global admin only**            | Only platform admins create orgs                      | Strictest       |
| **B: Type-restricted self-service** | Users can create "affiliate" only, others admin-gated | Medium          |
| **C: Approval workflow**            | Anyone can request, admin approves                    | Medium-Flexible |
| **D: Unrestricted**                 | Current behavior                                      | None            |

### Recommendation: Option A (Global Admin Only)

```typescript
// src/features/organizations/organizations.mutations.ts
export const createOrganization = createServerFn({ method: "POST" })
  .inputValidator(createOrganizationSchema.parse)
  .handler(async ({ data }) => {
    assertFeatureEnabled("sin_admin_orgs");
    const session = await requireSession();

    // Require global admin for all org creation
    await requireAdmin(session.user.id);

    // Optional: require step-up for this high-impact action
    await requireRecentAuth(session, { maxAge: 15 * 60 * 1000 }); // 15 min

    // ... rest of creation logic
  });
```

### Rationale

- SIN's org hierarchy (viaSport → PSO → Club → Affiliate) is carefully structured
- Org creation has major implications: data scoping, reporting requirements, access grants
- Self-service adds complexity (approval workflow, type restrictions) without clear benefit
- Admins can bulk-create orgs for onboarding if needed
- If self-service is ever needed, it can be added with proper controls later

### Implementation Impact

Stream C (C4)

---

## D0.10: Non-Admin Member Directory

### Context

`listOrganizationMembers` returns email addresses for all members to anyone with org membership. The question is whether non-admins need a member directory and what fields are safe to expose.

### The Problem

- Email exposure is a privacy concern
- Members may want to see who else is in the org (legitimate use case)
- But full contact details should be restricted

### Options

| Option                      | Description                             | Exposed Fields      |
| --------------------------- | --------------------------------------- | ------------------- |
| **A: Admin-only full list** | No member directory for non-admins      | None for non-admins |
| **B: Redacted directory**   | Separate endpoint with safe fields      | Name, role only     |
| **C: Opt-in visibility**    | Members control their own visibility    | User preference     |
| **D: Role-based fields**    | Different fields based on viewer's role | Variable            |

### Recommendation: Option A (Admin-Only) with Option B Deferred

```typescript
// Current endpoint: require admin
export const listOrganizationMembers = createServerFn({ method: "POST" })
  .inputValidator(listOrgMembersSchema.parse)
  .handler(async ({ data }) => {
    const session = await requireSession();
    await requireOrganizationAccess({
      userId: session.user.id,
      organizationId: data.organizationId,
      roles: ORG_ADMIN_ROLES, // Admin only for full list
    });
    // ... return full member list with emails
  });
```

**Future:** If directory is needed, create a separate endpoint:

```typescript
export const listOrganizationDirectory = createServerFn({ method: "POST" })
  .inputValidator(/* ... */)
  .handler(async ({ data }) => {
    const session = await requireSession();
    await requireOrganizationAccess({
      userId: session.user.id,
      organizationId: data.organizationId,
      // Any org role can access directory
    });

    return db
      .select({
        id: users.id,
        name: users.name, // No email
        role: organizationMembers.role,
      })
      .from(organizationMembers)
      .innerJoin(users, eq(organizationMembers.userId, users.id))
      .where(/* ... */);
  });
```

### Rationale

- Default to restrictive (admin-only) - safe starting point
- No immediate need for member directory in SIN use cases
- If needed later, create a purpose-built endpoint with safe projection
- Avoid feature creep during security hardening phase

### Implementation Impact

Stream C (C6)

---

## D0.11: Anomaly Detection Thresholds

### Context

`src/lib/security/detection.ts` has basic threshold checks (5 failed logins → 30 min lock). The question is where to draw the line between flagging (alert + step-up) vs locking (block access).

### The Problem

- Too aggressive → legitimate users get locked out
- Too permissive → attackers have more attempts
- No risk scoring or anomaly detection beyond simple counts
- No tenant-specific thresholds

### Recommendation: Flag-First with Escalation

| Trigger           | Flag (Alert + Step-up) | Lock                               |
| ----------------- | ---------------------- | ---------------------------------- |
| Failed logins     | 3 in 15 min            | 5 in 15 min                        |
| MFA failures      | 2 in 5 min             | 3 in 5 min                         |
| New geo/device    | Always                 | After failed auth from new context |
| Password resets   | 2 in 1 hour            | 3 in 1 hour                        |
| Impossible travel | Always                 | Never (false positive risk)        |

### Rationale

- Flag-first catches attacks while minimizing false positive impact
- Escalation to lock only after clear threshold breach
- Admin notification on lock ensures human review
- User notification on flag gives transparency
- Can tune thresholds per tenant if needed (store in org settings)

### Implementation Impact

Stream G (G10)

### Implementation Sketch

```typescript
// src/lib/security/config.ts
export const SECURITY_THRESHOLDS = {
  loginFailures: {
    flagThreshold: 3,
    flagWindow: 15 * 60 * 1000, // 15 min
    lockThreshold: 5,
    lockWindow: 15 * 60 * 1000,
    lockDuration: 30 * 60 * 1000, // 30 min
  },
  mfaFailures: {
    flagThreshold: 2,
    flagWindow: 5 * 60 * 1000,
    lockThreshold: 3,
    lockWindow: 5 * 60 * 1000,
    lockDuration: 15 * 60 * 1000,
  },
  newContext: {
    requireStepUp: true,
    notifyUser: true,
    notifyAdmin: false, // Unless combined with failures
  },
};

// src/lib/security/detection.ts
async function evaluateSecurityEvent(event: SecurityEvent) {
  const thresholds = SECURITY_THRESHOLDS.loginFailures;
  const recentFailures = await countRecentEvents(
    event.userId,
    "login_fail",
    thresholds.flagWindow,
  );

  if (recentFailures >= thresholds.lockThreshold) {
    await lockAccount(event.userId, "failed_logins", thresholds.lockDuration);
    await notifyAdmins("account_locked", event);
    await logSecurityEvent("account_locked", event);
  } else if (recentFailures >= thresholds.flagThreshold) {
    await flagForReview(event.userId, "multiple_failures");
    await notifyUser("suspicious_activity", event);
    await logSecurityEvent("account_flagged", event);
  }
}
```

---

## D0.12: Audit Hash Chain Integrity

### Current Repo State: 🔴 UNSAFE (CHAIN CAN FORK)

**File:** `src/lib/audit/index.ts:153-210`

**Verified behavior:** The `logAuditEntry` function:

1. Fetches previous hash: `orderBy(desc(auditLogs.occurredAt)).limit(1)`
2. Computes new hash including `prevHash`
3. Inserts new entry
4. ❌ **No transaction isolation** — concurrent writes can see same `previous` and fork
5. ❌ **No advisory lock** — no serialization of writes
6. ❌ **Ordering by `occurredAt` only** — ties are non-deterministic (should include `id`)

**Immediate issue:** Under concurrent load, multiple entries can have the same `prevHash`, creating a forked chain that destroys tamper-evidence.

**Note:** Schema has no `tenantKey` column. If QC and SIN use separate databases (confirmed), "per-tenant" is already effectively true. The **real** decision is concurrency control, not scope.

### Context

The audit log hash chain links each entry to the previous via `prev_hash`. There are TWO separate concerns:

1. **Scope:** Should the chain be global, per-tenant, or per-org?
2. **Concurrency:** How do we prevent chain forks under concurrent writes?

### The Problem

**Scope concern:**

- Global chain: single lock point, contention under high volume
- Per-org chain: more isolation but 100s of chains to maintain
- Per-tenant chain: middle ground, aligns with deployment model

**Concurrency concern (more critical):**

- No advisory lock means concurrent inserts can fork the chain
- Ordering by `occurredAt` alone is non-deterministic for same-millisecond entries
- Verification will fail if chain has forks

### Options

| Scope          | Isolation    | Contention | Verification Complexity    |
| -------------- | ------------ | ---------- | -------------------------- |
| **Global**     | None         | High       | Simple (one chain)         |
| **Per-tenant** | Deployment   | Medium     | Medium (one per tenant)    |
| **Per-org**    | Organization | Low        | High (many chains)         |
| **No chain**   | N/A          | None       | N/A (lose tamper evidence) |

### Recommendation: Advisory Locks (Primary) + Per-Tenant Scope (If Single DB)

Since QC and SIN use separate databases, "per-tenant" scope is already achieved without schema changes. The critical fix is **advisory locks to prevent forks**.

**If separate DBs (current state):**

```typescript
// src/lib/audit/index.ts
async function logAuditEntry(entry: AuditEntry) {
  return await db.transaction(async (tx) => {
    // Advisory lock to serialize writes (prevents forks)
    // Use a fixed lock ID since we're already DB-isolated by tenant
    await tx.execute(sql`SELECT pg_advisory_xact_lock(42)`); // Fixed ID within DB

    // Get previous hash with deterministic ordering (occurredAt + id)
    const [prev] = await tx
      .select({ entryHash: auditLogs.entryHash })
      .from(auditLogs)
      .orderBy(desc(auditLogs.occurredAt), desc(auditLogs.id))
      .limit(1);

    const id = crypto.randomUUID();
    const occurredAt = new Date();

    const entryHash = hashAuditEntry({
      ...entry,
      id,
      occurredAt,
      prevHash: prev?.entryHash ?? null,
    });

    await tx.insert(auditLogs).values({
      id,
      occurredAt,
      prevHash: prev?.entryHash ?? null,
      entryHash,
      ...entry,
    });

    return { id, entryHash };
  });
}
```

**If single multi-tenant DB (future):** Add `tenantKey` column and scope lock:

```typescript
const lockId = hashString(`audit_chain_${tenantKey}`);
await tx.execute(sql`SELECT pg_advisory_xact_lock(${lockId})`);
// ... and filter by tenantKey in prev hash lookup
```

### Rationale

- **Advisory lock is the critical fix** — prevents chain forks regardless of scope
- Separate DBs already provide tenant isolation (no schema change needed now)
- Deterministic ordering (`occurredAt` + `id`) ensures consistent chain even with same-millisecond entries
- Serialization adds latency but is acceptable for audit integrity
- Can add `tenantKey` later if consolidating to single DB

### Implementation Impact

Stream G (G2-G4)

---

## D0.13: DSAR Export Retention

### Context

When a user requests their data (DSAR access/export), the system generates a JSON/ZIP file and stores it in S3. How long should this file be available?

### The Problem

- Too short: user might miss the window to download
- Too long: unnecessary data retention
- Must balance usability with data minimization
- PIPEDA requires "timely" access but doesn't specify retention

### Options

| Retention         | User Access           | Admin Access     | Auto-Delete |
| ----------------- | --------------------- | ---------------- | ----------- |
| **7 days**        | Self-service download | Step-up required | Yes         |
| **14 days**       | Self-service download | Step-up required | Yes         |
| **30 days**       | Self-service download | Admin approval   | Yes         |
| **Until deleted** | Permanent             | Any admin        | No          |

### Recommendation: 14 Days with Explicit Tagging

```typescript
// src/features/privacy/privacy.mutations.ts
async function generatePrivacyExport(requestId: string) {
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days

  await s3.putObject({
    Bucket: env.SIN_ARTIFACTS_BUCKET,
    Key: `privacy/exports/${userId}/${requestId}.json`,
    Body: JSON.stringify(exportData),
    ServerSideEncryption: "aws:kms",
    SSEKMSKeyId: env.KMS_KEY_ID,
    Tagging: `dsar=true&expiresAt=${expiresAt.toISOString()}&requestId=${requestId}`,
    Metadata: {
      "x-amz-meta-dsar": "true",
      "x-amz-meta-expires-at": expiresAt.toISOString(),
    },
  });

  // Update request with result and expiry
  await db.update(privacyRequests).set({
    resultUrl: key,
    resultExpiresAt: expiresAt,
    status: "completed",
  });
}
```

### Rationale

- 14 days gives reasonable window for download (email notification with link)
- Auto-deletion via S3 lifecycle ensures compliance
- Tags enable easy identification and cleanup
- User can request a new export if they miss the window
- Admin access to others' exports requires step-up (Stream H6)

### Implementation Impact

Stream H (H5-H6)

---

## D0.14: SendGrid Usage

### Current Repo State: ⚠️ NO TENANT GUARD

**File:** `src/lib/email/sendgrid.ts:153-163`

**Verified behavior:** The `resolveEmailService` function:

```typescript
const useSendGrid = process.env["SENDGRID_API_KEY"] && process.env["NODE_ENV"] !== "test";
```

**Issues:**

1. ❌ **No tenant check** — if `SENDGRID_API_KEY` is set, SendGrid is used for ALL tenants
2. ❌ **No environment validation** — SIN could accidentally use SendGrid if key is present
3. ❌ **Provider selection at wrong level** — decision is in `sendgrid.ts`, not a higher-level router

**Immediate risk:** If SIN deployment has `SENDGRID_API_KEY` set (e.g., copied from QC config), PII will flow to US-based SendGrid, violating data residency requirements.

### Context

`src/lib/email/sendgrid.ts` is used for membership and team workflows. SIN requirements specify AWS SES for data residency (ca-central-1). The question is whether SendGrid should be allowed for non-SIN tenants.

### The Problem

- SIN production must use SES (data residency requirement)
- QC tenant might prefer SendGrid (existing integration)
- Mixing email providers adds complexity
- Need to ensure PII doesn't leak to US-based SendGrid from SIN
- **Current code has no tenant enforcement at all**

### Options

| Option                     | SIN Tenant     | QC Tenant         | Complexity |
| -------------------------- | -------------- | ----------------- | ---------- |
| **A: SES everywhere**      | SES            | SES               | Lowest     |
| **B: Tenant-based choice** | SES only       | SendGrid or SES   | Medium     |
| **C: Hybrid with guards**  | SES (enforced) | SendGrid (opt-in) | Higher     |

### Recommendation: Option A (SES Everywhere)

```typescript
// src/lib/email/send.ts
export async function sendEmail(params: EmailParams) {
  return sendViaSes(params);
}
```

### Rationale

- Single provider eliminates tenant/env misconfiguration risk
- Meets SIN data residency requirements by default
- Simplifies ops and support (one provider)
- Enables consistent deliverability tooling and monitoring

### Implementation Impact

Stream I (I6)

---

## D0.15: Templates/Help/Support Rollout

### Context

Stream M includes new features: template hub (TO-AGG-001), guided walkthroughs (TO-AGG-002), reference materials (TO-AGG-003), and support/feedback (UI-AGG-006). These are RFP requirements but not security-critical.

### The Problem

- Building for all tenants simultaneously is slow
- Different tenants have different content needs
- Need to validate UX before broad rollout

### Options

| Rollout Strategy                        | Risk            | Speed          |
| --------------------------------------- | --------------- | -------------- |
| **A: Build once, deploy everywhere**    | High (untested) | Fast initial   |
| **B: QC pilot first**                   | Low             | Slower overall |
| **C: Feature-flagged gradual rollout**  | Medium          | Medium         |
| **D: SIN pilot with viaSport feedback** | Medium          | Medium         |

### Recommendation: Build Once, Deploy Everywhere

Since there are no active users yet, enable these features for all tenants as
soon as they are production-ready.

**Rollout plan:**

1. Build core features and content scaffolding.
2. Deploy to all tenants in the same release.
3. Collect feedback and iterate from a single baseline.

### Rationale

- Fastest path to compliance and consistency
- Avoids duplicated effort and split feature states
- Simplifies documentation and training materials
- Any issues are fixed once across all tenants

### Implementation Impact

Stream M

---

## D0.16: Analytics Charts/Pivots Scope

### Context

RP-AGG-005 requires "ad-hoc charts, pivot tables, and export." Current implementation has report builder with filters and export but no charts or pivots.

### The Problem

- Full pivot builder is a larger UI/UX surface area
- Chart libraries add bundle size and integration complexity
- Needs careful data-scope enforcement and export correctness

### Options

| Scope                     | Features                       | Effort      |
| ------------------------- | ------------------------------ | ----------- |
| **A: MVP charts**         | 3-4 chart types, simple config | 1 week      |
| **B: Simple pivot**       | 1 row, 1 column, 1 measure     | 1 week      |
| **C: Full pivot builder** | Multi-dimension pivots         | 3-4 weeks   |
| **D: Export only**        | No charts, export to Excel     | 0 (current) |

### Recommendation: Option C (Full Pivot Builder + Charts + Export)

```typescript
// Chart types (expandable)
type ChartType = "bar" | "line" | "area" | "pie" | "heatmap" | "table";

interface ChartConfig {
  type: ChartType;
  dataSource: string;
  filters: Filter[];
  groupBy: string[]; // One or more dimensions
  measures: Array<{
    field: string;
    aggregation: "count" | "sum" | "avg" | "min" | "max";
  }>;
}

// Full pivot (multiple rows/columns/measures)
interface PivotConfig {
  dataSource: string;
  filters: Filter[];
  rowFields: string[];
  columnFields: string[];
  measures: Array<{
    field: string;
    aggregation: "count" | "sum" | "avg" | "min" | "max";
  }>;
}
```

### Rationale

- Meets RP-AGG-005 fully and avoids rework later
- Server-side aggregation preserves data minimization and security constraints
- Library-assisted UI reduces bespoke drag/drop and rendering work
- Export remains first-class via existing XLSX support and chart snapshots

**Selected libraries:**

- Charts: Apache ECharts via `echarts-for-react` (rich chart types, export to SVG/PNG).
- Pivot table rendering: `@tanstack/react-table` (already in repo) + `@tanstack/react-virtual` for large datasets.
- Pivot builder UX: `@dnd-kit` for drag/drop of dimensions/measures.
- Export: reuse existing `xlsx`; consider `pdf-lib` if PDF export is required.

### Implementation Impact

Stream M (M7)

---

## D0.17: Import Batch Worker Runtime

### Context

Lane 2 batch imports need to process 20M+ rows. `src/workers/import-batch.ts` exists but isn't wired to infrastructure. The question is which AWS compute to use.

### The Problem

- Lambda max timeout: 15 minutes
- 20M rows at 1000 rows/sec = ~5.5 hours
- Lambda max memory: 10GB
- Need checkpointing for resume on failure

### Options

| Runtime            | Max Duration | Memory         | Cost Model         | Complexity |
| ------------------ | ------------ | -------------- | ------------------ | ---------- |
| **Lambda**         | 15 min       | 10GB           | Per-invocation     | Low        |
| **Lambda chunked** | 15 min × N   | 10GB           | Per-invocation × N | Medium     |
| **ECS Fargate**    | Unlimited    | Up to 120GB    | Per-hour           | Medium     |
| **ECS EC2**        | Unlimited    | Instance-based | Per-hour           | Higher     |

### Recommendation: ECS Fargate

```typescript
// sst.config.ts
const importBatchTask = new sst.aws.Service("ImportBatchWorker", {
  cluster: cluster.arn,
  cpu: "2 vCPU",
  memory: "4 GB",
  containers: [
    {
      name: "import-worker",
      image: {
        dockerfile: "Dockerfile.import-worker",
      },
      environment: {
        DATABASE_URL: database.url,
        S3_BUCKET: artifactsBucket.name,
      },
    },
  ],
  scaling: {
    min: 0,
    max: 3, // Can run multiple imports in parallel
  },
});
```

```typescript
// src/workers/import-batch.ts (entrypoint)
async function main() {
  const jobId = process.env.IMPORT_JOB_ID;
  if (!jobId) throw new Error("IMPORT_JOB_ID required");

  const job = await getImportJob(jobId);

  try {
    await processImportJob(job, {
      chunkSize: 5000,
      checkpointInterval: 10000,
      onProgress: async (processed, total) => {
        await updateJobProgress(jobId, processed, total);
      },
    });
  } catch (error) {
    await markJobFailed(jobId, error);
    throw error; // ECS will mark task as failed
  }
}
```

### Rationale

- ECS Fargate has no timeout limit - can run for hours
- 4GB memory handles large file parsing
- Checkpointing allows resume from last checkpoint on failure
- Fargate is serverless - no instance management
- Can scale to multiple concurrent imports
- Cost: ~$0.08/hour vs Lambda chunking complexity

**Lambda chunked alternative** would work but adds complexity:

- Need SQS queue for chunk coordination
- Each chunk must be idempotent
- Orchestration logic to track overall progress
- More failure modes to handle

### Implementation Impact

Stream L (L1)

---

## Appendix: Decision Dependencies

```
D0.3 (notifications) ──────────────────────────┐
D0.9 (org creation) ───────────────────────────┤
D0.12 (audit chain scope) ─────────────────────┼──► P0: Must decide first
D0.17 (batch runtime) ─────────────────────────┘

D0.1 (report visibility) ──────────────────────┐
D0.2 (reporting visibility) ───────────────────┤
D0.5 (rejected status) ────────────────────────┼──► P1: Before Stream C/F
D0.7 (filter allowlist) ───────────────────────┤
D0.11 (detection thresholds) ──────────────────┘

D0.4 (multi-file) ─────────────────────────────┐
D0.6 (PII model) ──────────────────────────────┤
D0.8 (error retention) ────────────────────────┼──► P2: Before Streams D/E/F
D0.14 (email provider) ────────────────────────┘

D0.10 (member directory) ──────────────────────┐
D0.13 (DSAR retention) ────────────────────────┤
D0.15 (feature rollout) ───────────────────────┼──► P3: Can defer
D0.16 (analytics scope) ───────────────────────┘
```

---

## Document History

| Version | Date       | Changes                                                                                                                                                                                                                                                                 |
| ------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.0     | 2025-12-26 | Initial detailed analysis of all D0 decisions                                                                                                                                                                                                                           |
| 1.1     | 2025-12-26 | Added UNSAFE markers, priority matrix adjustments, acceptance criteria                                                                                                                                                                                                  |
| 1.2     | 2025-12-27 | Verified corrections: D0.7 filters not applied (correctness issue), D0.8 rollback doesn't sanitize errors, D0.12 separated scope from concurrency control and noted advisory lock is missing, D0.14 no tenant guard exists, D0.3 additional endpoints need admin checks |
