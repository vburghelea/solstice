# SEC-AGG-004 Audit Trail Verification - Remediation Plan

**Video:** `SEC-AGG-004-audit-verification-flow-FINAL.mp4`
**Duration:** 25 seconds (50 frames at 2fps)
**Analysis Date:** 2026-01-12T14:30:00Z
**Status:** NEEDS RE-RECORDING

---

## Executive Summary

The SEC-AGG-004 video demonstrates audit trail functionality but has significant gaps:

- **Positive:** Hash chain verification SUCCEEDS (green message), Step-up badges visible on EXPORT entries
- **Critical:** Empty state shown for 4.5s, only 2 entries visible, excessive static frames, Export CSV not clicked

**Overall Score:** 5/10 - Core functionality partially shown but not compelling

---

## Frame Analysis Summary

| Frames | Duration | Content                            | Issues                                              |
| ------ | -------- | ---------------------------------- | --------------------------------------------------- |
| 1-9    | 4.5s     | "No audit entries yet" empty state | **CRITICAL**: Empty state should not appear         |
| 10-36  | 13.5s    | 2 AUTH entries visible             | **CRITICAL**: Only 2 entries, excessive static time |
| 37     | 0.5s     | Category filter dropdown opened    | Good                                                |
| 38     | 0.5s     | EXPORT filter selected             | Brief empty state during transition                 |
| 39-40  | 1s       | EXPORT entries with Step-up badges | Good: Step-up badges visible                        |
| 41-50  | 5s       | "Hash chain verified successfully" | **POSITIVE**: Success message shown                 |

---

## Issues by Category

### Data Issues (Requires seed script changes)

| Issue                  | Severity | Current State               | Target State                          | Fix Location                                                  |
| ---------------------- | -------- | --------------------------- | ------------------------------------- | ------------------------------------------------------------- |
| Empty state shown      | CRITICAL | 0 entries initially visible | 200+ entries pre-loaded               | `scripts/seed-sin-data.ts` Phase 23                           |
| Only 2 entries visible | CRITICAL | 2 AUTH entries              | 20+ diverse entries across categories | `scripts/seed-sin-data.ts` Phase 23                           |
| No PII badges visible  | HIGH     | Only "No PII" badges shown  | Mix of PII and non-PII entries        | `scripts/seed-sin-data.ts` - add `metadata.includesPii: true` |

### Script Issues (Requires recording script changes)

| Issue                                | Severity | Current State             | Target State                            | Fix Location                            |
| ------------------------------------ | -------- | ------------------------- | --------------------------------------- | --------------------------------------- |
| Excessive static frames (13.5s + 5s) | HIGH     | 18.5s of 25s is static    | Max 3s per view                         | `scripts/record-sin-uat-sec-agg-004.ts` |
| Export CSV never clicked             | MEDIUM   | Button visible only       | Click button, show download toast       | Line 88-119                             |
| No entry detail panel                | MEDIUM   | No entry clicked          | Click entry, show full details          | Add click action after filter           |
| Date filter not demonstrated         | LOW      | Date pickers visible only | Apply date range, show filtered results | Lines 131-140 need actual interaction   |

### Code Issues

**None identified** - All features exist and work correctly.

### MCP/Capture Issues

**None identified** - Recording captured properly, no blank frames.

---

## Positive Findings

1. **Hash chain verification SUCCESS** - Green "Hash chain verified successfully" message displayed
2. **Step-up badges visible** - EXPORT entries show "Step-up" badges correctly
3. **Category filter works** - Dropdown opens and filter applies correctly
4. **Clean UI rendering** - No visual glitches or rendering issues

---

## Remediation Steps

### Step 1: Verify Data Seeding (Data Issue)

The VIDEO-EXCELLENCE-PLAN.md states 207 audit entries were seeded on sin-uat. The empty state suggests:

- Either the recording used a different environment
- Or the seeded data was cleared between seeding and recording

**Action 1a:** Before re-recording, verify audit log count:

```sql
SELECT category, COUNT(*) FROM audit_log GROUP BY category ORDER BY category;
```

Expected output:

```
ADMIN    | 1
AUTH     | 83
DATA     | 20
EXPORT   | 4
SECURITY | 99
```

**Action 1b: CRITICAL - Validate hash chain integrity**

Row counts alone don't guarantee the hash chain is valid. The seed script generates `entryHash` and `prevHash` values - if these are incorrect, verification will fail with a red "Hash chain invalid" error.

```sql
-- Check for broken hash chain links (entries where prevHash doesn't match previous entry's entryHash)
WITH ordered_entries AS (
  SELECT
    id,
    "entryHash",
    "prevHash",
    LAG("entryHash") OVER (ORDER BY "occurredAt", id) as expected_prev_hash,
    ROW_NUMBER() OVER (ORDER BY "occurredAt", id) as row_num
  FROM audit_log
)
SELECT id, row_num, "prevHash", expected_prev_hash
FROM ordered_entries
WHERE row_num > 1 AND "prevHash" != expected_prev_hash
LIMIT 10;
```

**If any rows returned:** The hash chain is broken. You must re-run the seed script to regenerate valid hash chains:

```bash
# Re-seed audit entries with valid hash chain
DATABASE_URL="..." BETTER_AUTH_SECRET="..." npx tsx scripts/seed-sin-data.ts --force
```

**If no rows returned:** Hash chain is valid - proceed to re-recording.

**Alternative: Test via UI before recording**

Navigate to `https://sinuat.solsticeapp.ca/dashboard/admin/sin/audit` and click "Verify hash chain" manually. If it shows green success, proceed. If red error, re-seed.

### Step 2: Update Recording Script

**File:** `scripts/record-sin-uat-sec-agg-004.ts`

**Changes needed:**

1. **Remove excessive waits** - Current `wait(700)` and `wait(900)` calls create static frames
2. **Add entry click for detail panel** - After initial load, click an entry to show details
3. **Actually click Export CSV** - The script has export code but may not be executing properly
4. **Demonstrate PII badge** - Filter to DATA or SECURITY category to show PII entries
5. **Reduce filter demo static time** - Speed up transitions between views

**Proposed flow (45s target):**

```
1. Navigate to audit page (2s) - entries already visible
2. Scroll to show entry variety (3s) - demonstrate 200+ entries
3. Click AUTH entry → show detail panel (5s) - actor, IP, user agent
4. Close detail → scroll more (3s)
5. Click DATA entry with PII badge → show detail (5s) - show PII accessed
6. Filter to EXPORT category (3s)
7. Show EXPORT entries with Step-up badges (3s)
8. Click "Verify hash chain" → success message (5s)
9. Click "Export CSV" → step-up auth if needed → download toast (8s)
10. Apply date filter → show results change (5s)
```

### Step 3: Re-record Video

```bash
# Ensure tunnel is running
AWS_PROFILE=techdev npx sst tunnel --stage sin-uat

# Verify data exists
AWS_PROFILE=techdev npx sst shell --stage sin-uat -- bash -c 'psql ... -c "SELECT COUNT(*) FROM audit_log"'

# Run updated recording script
npx tsx scripts/record-sin-uat-sec-agg-004.ts
```

### Step 4: Post-Recording Verification

Extract frames and verify:

- [ ] No empty state frames
- [ ] 20+ entries visible when scrolling
- [ ] PII badge visible on at least one entry
- [ ] Step-up badge visible on EXPORT entries
- [ ] Entry detail panel shown
- [ ] Export CSV clicked with success toast
- [ ] Hash chain verification success
- [ ] No static segments > 3 seconds

---

## Script Diff Preview

```diff
--- a/scripts/record-sin-uat-sec-agg-004.ts
+++ b/scripts/record-sin-uat-sec-agg-004.ts
@@ -52,7 +52,15 @@ const run = async () => {
   const firstRow = page
     .getByRole("row")
     .filter({ hasText: /SECURITY|AUTH|DATA|EXPORT/i })
     .first();
   await firstRow.waitFor({ timeout: 15_000 }).catch(() => {});
-  await wait(700);
+  await wait(300);
   await takeScreenshot("00-audit-loaded.png");

+  // Click first entry to show detail panel
+  console.log("Opening entry detail panel...");
+  await firstRow.click();
+  await page.getByText(/Details|Metadata/i).waitFor({ timeout: 5000 }).catch(() => {});
+  await wait(500);
+  await takeScreenshot("00b-entry-detail.png");
+
   console.log("Scrolling to show more categories...");
```

---

## Dependencies

- No code changes required
- Seed data verification required before re-recording
- Recording script updates required

---

## Verification Checklist

After re-recording, verify:

- [ ] Video duration 40-50 seconds
- [ ] No empty state shown at any point
- [ ] Multiple categories visible (AUTH, DATA, SECURITY, EXPORT)
- [ ] Entry detail panel demonstrated
- [ ] PII badge visible on at least one entry
- [ ] Step-up badge visible on EXPORT entries
- [ ] Hash chain verification shows success
- [ ] Export CSV triggers download/toast
- [ ] Date filter demonstration included
- [ ] No static segments > 3 seconds
- [ ] Frame-by-frame review completed

---

## Related Files

| File                                                                     | Purpose                                 |
| ------------------------------------------------------------------------ | --------------------------------------- |
| `scripts/record-sin-uat-sec-agg-004.ts`                                  | Recording script                        |
| `scripts/seed-sin-data.ts`                                               | Data seeding (Phase 23 - audit entries) |
| `src/features/audit/components/audit-log-table.tsx`                      | Audit UI component                      |
| `src/lib/audit/index.ts`                                                 | Hash chain logic                        |
| `docs/sin-rfp/review-plans/evidence/2026-01-10/VIDEO-EXCELLENCE-PLAN.md` | Quality targets                         |
