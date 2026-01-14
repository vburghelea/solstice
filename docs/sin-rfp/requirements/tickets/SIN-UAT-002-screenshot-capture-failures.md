# SIN-UAT-002: Screenshot Capture Failures - Import, Hash Chain, Form Submission

**Priority:** P1 (Affects RFP evidence quality)
**Effort:** 4-6 hours
**Status:** Resolved (screenshots captured 2026-01-14)
**Created:** 2026-01-14
**Source:** Screenshot capture session for figure-registry.csv evidence

---

## Summary

During screenshot capture on sin-uat (https://sinuat.solsticeapp.ca) for the RFP submission on January 14, 2026, three issues were identified that affect evidence quality:

1. **DM-6 Import Complete**: 500 server error when running batch import
2. **SEC-4 Hash Verification**: Shows "invalid for 3 entries" instead of successful verification
3. **DM-1 Form Submission**: Shows "Organization is required" error in admin preview

All issues had workarounds using existing screenshots from January 10. Remediation work is
now complete with updated code fixes and fresh screenshots captured on 2026-01-14.

**Latest Evidence Capture (2026-01-14)**

- `docs/sin-rfp/review-plans/evidence/2026-01-14/screenshots/DM-AGG-006/04-import-complete.png`
- `docs/sin-rfp/review-plans/evidence/2026-01-14/screenshots/SEC-AGG-004/04-hash-verified.png`
- `docs/sin-rfp/review-plans/evidence/2026-01-14/screenshots/DM-AGG-001/05-form-submission-success.png`

---

## Issue 1: Import Wizard 500 Server Error (DM-6)

**Severity:** High (feature broken in production)
**Component:** `src/features/imports/imports.mutations.ts`
**Figure ID:** DM-6 (04-import-complete.png)

### Problem

Clicking "Run import" button in the import wizard returns 500 server errors. The import job is created but remains in "pending" status indefinitely.

### Evidence

- **Worklog**: `docs/sin-rfp/review-plans/evidence/2026-01-10/SCREENSHOT-CAPTURE-WORKLOG.md` (lines 44-53)
- **Console errors**: Three 500 errors observed when clicking "Run import"
- **Job status**: Import job created but stuck in "pending" status

### Root Cause

The `runBatchImport` server function dynamically imports `Resource` from SST at runtime, but `Resource` is a **build-time only construct** that doesn't exist in the Lambda runtime environment.

**Location**: `src/features/imports/imports.mutations.ts:972-995`

```typescript
export const runBatchImport = createServerFn({ method: "POST" })
  .inputValidator(zod$(runBatchImportSchema))
  .handler(async ({ data }) => {
    await assertFeatureEnabled("sin_admin_imports");
    const actorUserId = await requireSessionUserId();
    const { Resource } = await import("sst");  // ❌ LINE 977: CRASHES HERE

    type ImportTaskResource = {
      cluster: string;
      taskDefinition: string;
      subnets: string[];
      securityGroups: string[];
      assignPublicIp: boolean;
      containers: string[];
    };

    const resources = Resource as unknown as Record<string, unknown>;
    const importTask = resources["SinImportBatchTask"] as ImportTaskResource | undefined;

    if (!importTask?.taskDefinition) {
      // ❌ NEVER REACHED - crashes before this fallback
      const { runBatchImportJob } = await import("~/lib/imports/batch-runner");
      return runBatchImportJob({ jobId: data.jobId, actorUserId });
    }

    const { task } = await import("sst/aws/task");
    const runResult = await task.run(importTask, {
      SIN_IMPORT_JOB_ID: data.jobId,
      SIN_IMPORT_ACTOR_USER_ID: actorUserId,
    });

    return { success: true, taskArn: runResult.arn };
  });
```

### Technical Explanation

1. **TanStack Start Code Extraction**: TanStack Start extracts server-only code from `handler()` functions at build time
2. **SST `Resource` Object**: Exists only during SST config evaluation (`sst.config.ts`), not at Lambda runtime
3. **Dynamic Import Failure**: `await import("sst")` succeeds, but `Resource` is undefined/empty at runtime
4. **Crash Before Fallback**: The code crashes accessing `Resource["SinImportBatchTask"]` before reaching the `runBatchImportJob` fallback

### Environment Impact

| Environment         | Behavior                                  |
| ------------------- | ----------------------------------------- |
| Local `sst dev`     | May appear to work (SST injects Resource) |
| sin-uat (deployed)  | **500 Error**                             |
| sin-prod (deployed) | **500 Error**                             |

### Fix

Use a server-only wrapper per CLAUDE.md best practices (lines 247-269):

```typescript
import { createServerOnlyFn } from "@tanstack/react-start";

const getImportTask = createServerOnlyFn(async () => {
  try {
    const { Resource } = await import("sst");
    return Resource?.["SinImportBatchTask"] as ImportTaskResource | undefined;
  } catch {
    return undefined;
  }
});

export const runBatchImport = createServerFn({ method: "POST" })
  .inputValidator(zod$(runBatchImportSchema))
  .handler(async ({ data }) => {
    await assertFeatureEnabled("sin_admin_imports");
    const actorUserId = await requireSessionUserId();

    const importTask = await getImportTask();

    if (!importTask?.taskDefinition) {
      const { runBatchImportJob } = await import("~/lib/imports/batch-runner");
      return runBatchImportJob({ jobId: data.jobId, actorUserId });
    }

    const { task } = await import("sst/aws/task");
    const runResult = await task.run(importTask, {
      SIN_IMPORT_JOB_ID: data.jobId,
      SIN_IMPORT_ACTOR_USER_ID: actorUserId,
    });

    return { success: true, taskArn: runResult.arn };
  });
```

### RFP Workaround

Updated screenshot captured on 2026-01-14:
`docs/sin-rfp/review-plans/evidence/2026-01-14/screenshots/DM-AGG-006/04-import-complete.png`

### Verification

1. Navigate to Import Wizard on sin-uat
2. Upload valid CSV and complete mapping
3. Click "Run import"
4. Confirm job transitions from "pending" to "running" to "completed"
5. No 500 errors in browser console

---

## Issue 2: Audit Hash Chain Verification Shows Invalid Entries (SEC-4)

**Severity:** Medium (cosmetic - feature works correctly)
**Component:** `src/lib/audit/index.ts`
**Figure ID:** SEC-4 (04-hash-verified.png)

### Problem

Hash chain verification showed "Hash chain invalid for 3 entries" instead of
"Hash chain verified successfully."

### Evidence

- **Superseded screenshot**: `.playwright-mcp/SEC-AGG-004/04-hash-verified.png` showed red "invalid" message
- **Updated screenshot**: `docs/sin-rfp/review-plans/evidence/2026-01-14/screenshots/SEC-AGG-004/04-hash-verified.png` shows green "verified successfully"

### Root Cause

Hash chain verification relied on ordering rows by `created_at` and `id`. When multiple
audit entries are created within the same millisecond, the random UUID ordering can diverge
from insertion order, causing valid chains to appear invalid. This is amplified by the
millisecond precision of JavaScript `Date` values.

**Hash Creation** (`src/lib/audit/index.ts`):

```typescript
const [previous] = await tx
  .select({ entryHash: auditLogs.entryHash, createdAt: auditLogs.createdAt })
  .from(auditLogs)
  .orderBy(desc(auditLogs.createdAt), desc(auditLogs.id))
  .limit(1);

const prevHash = previous?.entryHash ?? null;
const occurredAt = occurredAtValue instanceof Date
  ? occurredAtValue
  : new Date(occurredAtValue as string | number);
const resolvedOccurredAt =
  previous?.createdAt && occurredAt <= previous.createdAt
    ? new Date(previous.createdAt.getTime() + 1)
    : occurredAt;
```

**Hash Verification** (`src/lib/audit/index.ts`):

```typescript
const rowsByPrevHash = new Map<string | null, AuditHashRow[]>();
// ...
const nextRows: AuditHashRow[] = rowsByPrevHash.get(current.entryHash) ?? [];
```

**The Problem**: Ordering by `created_at` + random UUIDs can mismatch the actual
`prev_hash` chain when multiple entries share the same timestamp, even though the stored
hashes are correct.

### Why 3 Entries

1. **Seeded entries** (19 total): Pre-computed hashes with exact timestamps → verify ✅
2. **Live entries** (3 total): Created via actual `logAuditEntry()` during UAT testing → fail ❌

The 3 entries are:

- Login events from the screenshot capture session
- Import job creation events
- BI pivot query events

### Technical Details

**Seed script** (`scripts/seed-sin-data.ts:3008-3051`):

```typescript
// Manually constructed timestamps with exact values
const occurredAt = new Date(baseTime.getTime() + i * 10 * 60 * 1000);
// Pre-computed hash matches exactly
const entryHash = await hashValue(payload);
```

**Live logging** (`src/lib/audit/index.ts`):

```typescript
// Timestamps are normalized to remain strictly increasing
const resolvedOccurredAt =
  previous?.createdAt && occurredAt <= previous.createdAt
    ? new Date(previous.createdAt.getTime() + 1)
    : occurredAt;
```

### Fix

1. **Ensure monotonic timestamps** during audit entry creation (bump by 1ms if needed).
2. **Verify by following the `prev_hash` chain**, so ordering mismatches do not produce
   false negatives.

### RFP Workaround

Updated screenshot captured on 2026-01-14:
`docs/sin-rfp/review-plans/evidence/2026-01-14/screenshots/SEC-AGG-004/04-hash-verified.png`

### Important Note

**The entries are NOT corrupted.** The issue was an ordering mismatch in verification,
not data integrity. The audit log remains tamper-evident and intact.

### Verification

After fix:

1. Create new audit entries via any action (login, form submit, etc.)
2. Navigate to Admin → SIN Admin → Audit
3. Click "Verify hash chain"
4. Confirm "Hash chain verified successfully." appears in green

---

## Issue 3: Form Submission "Organization Required" Error (DM-1)

**Severity:** Low (by design, not a bug)
**Component:** `src/features/forms/components/form-builder-shell.tsx`
**Figure ID:** DM-1 (05-form-submission-success.png)

### Problem

Submitting a form in the admin preview shows "Organization is required to submit this form" error instead of success.

### Evidence

- **Worklog**: `docs/sin-rfp/review-plans/evidence/2026-01-10/SCREENSHOT-CAPTURE-WORKLOG.md` (lines 11-18)
- **Screenshot**: Shows filled form with error message

### Root Cause

This is **intentional validation**, not a bug. Global forms (without an assigned organization) require organization context at submission time.

**Client-side validation** (`src/features/forms/components/form-builder-shell.tsx:411-414`):

```typescript
// In DynamicFormRenderer onSubmit handler
if (!organizationId) {
  setSubmitError("Organization is required to submit this form.");
  return;
}
```

**Server-side validation** (`src/features/forms/forms.mutations.ts:405-418`):

```typescript
const organizationId = form.organizationId ?? data.organizationId ?? null;
if (!organizationId) {
  throw forbidden("Organization is required for submissions");
}
```

**Admin preview props** (`src/features/forms/components/form-builder-shell.tsx:1634-1638`):

```typescript
<DynamicFormRenderer
  formId={selectedFormId}
  organizationId={selectedForm?.organizationId ?? null}  // null for global forms
  definition={definition}
/>
```

### Design Rationale

Form submissions must be tied to an organization for:

- **Audit trail**: Know which organization owns the submission
- **Reporting**: Aggregate submissions by organization
- **Access control**: Organization admins can only see their submissions

Global forms are templates that can be used by multiple organizations. When previewing a global form, there's no way to know which organization the test submission should belong to.

### Two Form Types

| Form Type      | `organizationId`    | Admin Preview       | User Submission     |
| -------------- | ------------------- | ------------------- | ------------------- |
| **Org-scoped** | Set to specific org | ✅ Works            | ✅ Works            |
| **Global**     | `null`              | ❌ Error (expected) | ❌ Error (expected) |

### Workarounds for RFP

**Option A: Use org-scoped form**

1. In Admin → Forms, create or edit a form
2. Assign an organization to the form
3. Preview and submit - will succeed

**Option B: Use user form page**

1. Navigate to `/dashboard/sin/forms/$formId` as a user with org membership
2. Submit the form - org context comes from user's membership

**Option C: Use submission history**

- Screenshot `06-submission-history.png` shows existing successful submissions
- This proves form submissions work correctly

### RFP Workaround

Use the org-scoped user submission screenshot captured on 2026-01-14:
`docs/sin-rfp/review-plans/evidence/2026-01-14/screenshots/DM-AGG-001/05-form-submission-success.png`

### Not Recommended to Fix

This validation is intentional and correct. Removing it would:

- Create orphan submissions with no organization
- Break audit trail reporting
- Violate data integrity requirements

---

## Files Referenced

| File                                                   | Lines              | Purpose                                  |
| ------------------------------------------------------ | ------------------ | ---------------------------------------- |
| `src/features/imports/imports.mutations.ts`            | 972-995            | Import batch runner (Issue 1)            |
| `src/lib/imports/batch-runner.ts`                      | -                  | Fallback batch processor                 |
| `sst.config.ts`                                        | 640, 680           | SinImportBatchTask definition            |
| `src/lib/audit/index.ts`                               | 249-327, 410-459   | Audit logging and verification (Issue 2) |
| `scripts/seed-sin-data.ts`                             | 3004-3055          | Seed data with pre-computed hashes       |
| `src/features/forms/components/form-builder-shell.tsx` | 411-414, 1634-1638 | Form preview validation (Issue 3)        |
| `src/features/forms/forms.mutations.ts`                | 405-418            | Server-side form validation              |

---

## Acceptance Criteria

### Issue 1 (DM-6)

- [x] `runBatchImport` server function uses `createServerOnlyFn` wrapper
- [x] Import jobs successfully transition from pending → running → completed (sin-uat)
- [x] No 500 errors when clicking "Run import" (sin-uat)
- [ ] Validate sin-prod after deploy

### Issue 2 (SEC-4)

- [x] New audit entries created via live actions verify correctly (sin-uat)
- [x] "Hash chain verified successfully." appears for all entries (sin-uat)
- [x] Monotonic timestamps + chain-order verification prevent false negatives

### Issue 3 (DM-1)

- [ ] (No code change needed - by design)
- [ ] Document in RFP that org-scoped forms should be used for demo
- [x] Use org-scoped submission screenshot as evidence

---

## Testing

### Issue 1

```bash
# After fix, deploy and test
AWS_PROFILE=techdev npx sst deploy --stage sin-uat

# Navigate to Import Wizard
# Upload CSV, complete mapping
# Click "Run import"
# Verify job completes without 500 errors
```

### Issue 2

```bash
# After fix, create new audit entry
# Login to sin-uat (creates AUTH.LOGIN_SUCCESS entry)

# Verify hash chain
# Navigate to Admin → SIN Admin → Audit
# Click "Verify hash chain"
# Confirm green "verified successfully" message
```

### Issue 3

```bash
# No fix needed - test workaround
# Create org-scoped form in admin
# Preview and submit - should succeed
```

---

## Related Documents

- `docs/sin-rfp/review-plans/evidence/2026-01-10/SCREENSHOT-CAPTURE-WORKLOG.md`
- `docs/sin-rfp/response/figure-registry.csv`
- `CLAUDE.md` (lines 247-269 for serverOnly pattern)
