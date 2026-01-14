# SIN RFP Final.md Files Update Plan

## Overview

Update all `final.md` files in `docs/sin-rfp/response/` to address consistency issues identified in reviewer feedback on the combined proposal document.

## Key Issues to Address

1. **Status label inconsistency** - Legend defines 4 values but tables use different terms
2. **"Prototype" framing** - Should use "evaluation environment" consistently
3. **"Risk" language** - Replace risk framing with certainty/readiness framing
4. **Technical wording** - Fix encryption description and 24/7 support wording
5. **Pricing Philosophy** - Replace with pointer to delivery plan
6. **Executive Summary wording** - Fix table cell descriptions

---

## Phase 1: Fix Status Label Consistency

### Problem (Verified from File Review)

**Crosswalk file** (`00-compliance-crosswalk/final.md`):

- Defines 4-value legend (lines 5-12): "Implemented (Demoable Now)", "Implemented; Requires viaSport Configuration", "Requires Production Data Confirmation", "Optional / Post-Award"
- Uses column headers: "Prototype (Jan 2026)" | "Finalization Scope" ← Finalization Scope is CORRECT here
- But Status column uses only "Implemented" everywhere ← NOT using the 4-value legend

**Detailed requirement files** (dm-agg, rp-agg, sec-agg, ui-agg, to-agg):

- Use column headers: "Prototype (Jan 2026)" | "Remaining Scope" ← INCONSISTENT with crosswalk
- Use "Built" as Status value ← INCONSISTENT with crosswalk's "Implemented"
- Each requirement section has a subsection header "**Remaining Scope:**" ← INCONSISTENT

### Files Affected

1. `04-system-requirements/00-compliance-crosswalk/final.md` - Update status values only (headers already correct)
2. `04-system-requirements/data-management-dm-agg/final.md` - Update headers, status values, and subsection headers
3. `04-system-requirements/reporting-rp-agg/final.md` - Update headers, status values, and subsection headers
4. `04-system-requirements/security-sec-agg/final.md` - Update headers, status values, and subsection headers
5. `04-system-requirements/user-interface-ui-agg/final.md` - Update headers, status values, and subsection headers
6. `04-system-requirements/training-onboarding-to-agg/final.md` - Update headers, status values, and subsection headers

### Changes Required

#### A. Column Header Changes

**Crosswalk file** (00-compliance-crosswalk/final.md):

- Change: `Prototype (Jan 2026)` → `Evaluation Environment (Jan 2026)` (in all 5 category tables)
- Keep: `Finalization Scope` (already correct)

**Detailed requirement files** (all 5):

- Change: `Prototype (Jan 2026)` → `Evaluation Environment (Jan 2026)` (in Compliance Summary table)
- Change: `Remaining Scope` → `Finalization Scope` (in Compliance Summary table)

#### B. Subsection Header Changes (Detailed Requirement Files Only)

**Change 1: "Remaining Scope:" subsections**

Each requirement has a subsection like:

```
**Remaining Scope:**
```

Change ALL of these to:

```
**Finalization Scope:**
```

**Count by file:**

- data-management-dm-agg/final.md: 6 subsections (lines 37, 71, 112, 147, 181, 221)
- reporting-rp-agg/final.md: 5 subsections (lines 35, 65, 99, 129, 159)
- security-sec-agg/final.md: 4 subsections (lines 41, 83, 123, 153)
- user-interface-ui-agg/final.md: 7 subsections (lines 37, 67, 97, 127, 157, 188, 218)
- training-onboarding-to-agg/final.md: 3 subsections (lines 34, 69, 99)

**Change 2: "Prototype (Jan 2026):" subsections**

Each requirement ALSO has a subsection like:

```
**Prototype (Jan 2026):**
```

Change ALL of these to:

```
**Evaluation Environment (Jan 2026):**
```

**Count by file:**

- data-management-dm-agg/final.md: 6 subsections
- reporting-rp-agg/final.md: 5 subsections
- security-sec-agg/final.md: 4 subsections
- user-interface-ui-agg/final.md: 7 subsections
- training-onboarding-to-agg/final.md: 3 subsections
- **Total: 25 subsection headers to change**

#### C. Status Value Changes

**Crosswalk file** - Apply 4-value legend to each row:

| Req ID      | Current Status | New Status                                   | Rationale                                           |
| ----------- | -------------- | -------------------------------------------- | --------------------------------------------------- |
| DM-AGG-001  | Implemented    | Implemented; Requires viaSport Configuration | "Load viaSport templates during discovery"          |
| DM-AGG-002  | Implemented    | Optional / Post-Award                        | "Optional: scope external integrations if required" |
| DM-AGG-003  | Implemented    | Implemented (Demoable Now)                   | Minor taxonomy tuning                               |
| DM-AGG-004  | Implemented    | Implemented (Demoable Now)                   | Threshold tuning is minor                           |
| DM-AGG-005  | Implemented    | Implemented; Requires viaSport Configuration | "Confirm durations during discovery"                |
| DM-AGG-006  | Implemented    | Requires Production Data Confirmation        | "Confirm extraction method once access granted"     |
| RP-AGG-001  | Implemented    | Implemented (Demoable Now)                   | "None"                                              |
| RP-AGG-002  | Implemented    | Implemented; Requires viaSport Configuration | "Configure metadata during discovery"               |
| RP-AGG-003  | Implemented    | Implemented (Demoable Now)                   | "None"                                              |
| RP-AGG-004  | Implemented    | Implemented (Demoable Now)                   | "None"                                              |
| RP-AGG-005  | Implemented    | Implemented (Demoable Now)                   | "None"                                              |
| SEC-AGG-001 | Implemented    | Implemented (Demoable Now)                   | "None"                                              |
| SEC-AGG-002 | Implemented    | Implemented (Demoable Now)                   | "None"                                              |
| SEC-AGG-003 | Implemented    | Implemented (Demoable Now)                   | "None" (retention controls built)                   |
| SEC-AGG-004 | Implemented    | Implemented (Demoable Now)                   | "None"                                              |
| TO-AGG-001  | Implemented    | Implemented; Requires viaSport Configuration | "Load viaSport templates during discovery"          |
| TO-AGG-002  | Implemented    | Implemented; Requires viaSport Configuration | "Final content review during discovery"             |
| TO-AGG-003  | Implemented    | Implemented; Requires viaSport Configuration | "Refine content during discovery"                   |
| UI-AGG-001  | Implemented    | Implemented (Demoable Now)                   | "None"                                              |
| UI-AGG-002  | Implemented    | Implemented (Demoable Now)                   | "None"                                              |
| UI-AGG-003  | Implemented    | Implemented (Demoable Now)                   | "None"                                              |
| UI-AGG-004  | Implemented    | Implemented (Demoable Now)                   | "None"                                              |
| UI-AGG-005  | Implemented    | Implemented (Demoable Now)                   | "None"                                              |
| UI-AGG-006  | Implemented    | Implemented (Demoable Now)                   | "None"                                              |
| UI-AGG-007  | Implemented    | Implemented; Requires viaSport Configuration | "Apply viaSport branding during discovery"          |

**Detailed requirement files** - Change "Built" to match crosswalk:

| Req ID                | Current | New                              |
| --------------------- | ------- | -------------------------------- |
| All rows with "Built" | Built   | Match the crosswalk status above |

---

## Phase 2: Fix "Prototype" Framing in Executive Summary

### File: `01-executive-summary/final.md`

#### Change 1: "At a Glance" Table (Lines 68-80)

Replace:

```md
| Dimension        | Status                                                                                                         |
| :--------------- | :------------------------------------------------------------------------------------------------------------- |
| Prototype        | Working system available for evaluation (See Section 1.3)                                                      |
| Requirements     | 25/25 requirements built (See **System Requirements Compliance Crosswalk**)                                    |
```

With:

```md
| Dimension              | Status                                                                                                     |
| :--------------------- | :--------------------------------------------------------------------------------------------------------- |
| Evaluation environment | Working system available for evaluator validation (See Section 1.3)                                        |
| Requirements coverage  | 25/25 requirements implemented; finalization scope is documented in the Compliance Crosswalk               |
```

#### Change 2: Response Overview Table (Line 36)

Replace:

```md
| **System Requirements Compliance Crosswalk**                   | Requirement-by-requirement status with built and partial items.                                 |
```

With:

```md
| **System Requirements Compliance Crosswalk**                   | Requirement-by-requirement status, including finalization scope (viaSport configuration and production data confirmation) |
```

#### Change 3: Key Highlights - Working Prototype (Line 83)

Replace:

```md
**Working Prototype for Evaluator Validation** Evaluators can log into a working prototype...
```

With:

```md
**Working Evaluation Environment** Evaluators can log into a working system...
```

#### Change 4: Key Highlights - Requirements Coverage (Line 85)

Replace:

```md
**Requirements Coverage (January 2026 Prototype)** The prototype fully implements all 25 System Requirements...
```

With:

```md
**Requirements Coverage (January 2026 Evaluation Environment)** The evaluation environment fully implements all 25 System Requirements...
```

---

## Phase 3: Fix Risk Language

### File 1: `02-vendor-fit/final.md`

#### Change 1: Section Header (Line 60)

Replace:

```md
## What Makes This a Low-Risk Procurement Choice
```

With:

```md
## Why This Procurement is Straightforward to Evaluate
```

#### Change 2: Risk Mitigation Table Header and Labels (Lines 71-79)

Replace:

```md
### Risk Mitigation Summary

| Risk              | Mitigation                                                                                                                                |
| :---------------- | :---------------------------------------------------------------------------------------------------------------------------------------- |
| Vendor dependency | Source code escrow, data portability, documented runbooks                                                                                 |
| Key person risk   | Infrastructure as code, operational documentation, and a dedicated delivery team structure                                                |
| Technology risk   | Working prototype validated at scale (20M rows, p95 162ms, 25 concurrent users)                                                           |
| Delivery risk     | The prototype demonstrates that all 25 requirements are already built; delivery is led by a single accountable lead with minimal handoffs |
| Operational risk  | Defined SLA targets, continuous monitoring of uptime/performance/security events, and quarterly disaster recovery exercises               |
```

With:

```md
### Procurement Certainty Summary

| Concern                      | How We Address It                                                                                                                                    |
| :--------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vendor dependency            | Source code escrow, data portability, documented runbooks                                                                                            |
| Key person continuity        | Infrastructure as code, operational documentation, and a dedicated delivery team structure                                                           |
| Technology readiness         | Working evaluation environment validated at scale (20M rows, p95 162ms, 25 concurrent users)                                                         |
| Implementation readiness     | The evaluation environment demonstrates that all 25 requirements are already implemented; delivery is led by a single accountable lead with minimal handoffs |
| Operational accountability   | Defined SLA targets, continuous monitoring of uptime/performance/security events, and quarterly disaster recovery exercises                          |
```

### File 2: `01-B-prototype-evaluation-guide/final.md`

#### Change 1: Purpose Section (Lines 3-5)

Replace:

```md
## Purpose

This prototype exists to reduce delivery risk and demonstrate requirement alignment before contract award. viaSport can evaluate a working system, not just a proposal.
```

With:

```md
## Purpose

This prototype (evaluation environment) exists to reduce procurement uncertainty by enabling requirement and workflow validation before contract award. viaSport can evaluate a working system, not just a proposal.
```

### File 3: `01-executive-summary/final.md`

#### Change 1: "What viaSport is Buying" (Line 9)

Replace:

```md
Solstice is proposed as a **term subscription with managed service**, structured to reduce ongoing procurement overhead and operational risk:
```

With:

```md
Solstice is proposed as a **term subscription with managed service**, structured to reduce ongoing procurement overhead and provide clear operational accountability:
```

---

## Phase 4: Fix Technical Wording

### File: `01-executive-summary/final.md`

#### Change 1: PostgreSQL Encryption (Line 60)

Replace:

```md
- **Processing controls:** PostgreSQL column-level encryption for highly sensitive fields (e.g., TOTP secrets)
```

With:

```md
- **Processing controls:** Application-level field encryption for highly sensitive fields (e.g., TOTP secrets) stored encrypted in PostgreSQL
```

### File: `06-cost-value/final.md`

#### Change 1: 24/7 Support Wording (Lines 131-132)

Replace:

```md
Adds after-hours monitoring and response outside business hours, with Sev 1 response time reduced to 2 hours.
```

With:

```md
Adds after-hours monitoring and response outside business hours. After-hours Sev 1 response target: 2 hours (with 24/7 add-on).
```

---

## Phase 5: Replace Pricing Philosophy Section

### File: `06-cost-value/final.md`

#### Replace Lines 140-149

Replace:

```md
## Pricing Philosophy

Pricing is based on the value delivered, not on hourly billing. The existing prototype represents Austin Wallace Tech's investment in building a platform for the sport sector. viaSport benefits from:

- A working system available for evaluation before contract award
- Reduced delivery risk (all 25 requirements already built)
- Principal-led delivery with no organizational layers
- A managed service model with clear service levels and included enhancement capacity

The prototype and principal-led delivery model reduce overhead and accelerate implementation compared to traditional project structures or enterprise platform integrations.
```

With:

```md
## Pricing Philosophy

Pricing is based on the 30-week delivery plan described in **Project Plan, Timeline, and Delivery Schedule**.

- The **one-time implementation** covers discovery, viaSport configuration, migration execution and reconciliation, UAT support, training, rollout, and go-live/hypercare to operationalize the existing baseline.
- The **annual subscription + managed service** covers hosting, monitoring, support, security patching, backups/DR validation, ongoing product updates, and 200 hours/year of enhancement capacity.
```

---

## Verification Checklist

After making all changes, verify:

1. [ ] All crosswalk tables use the 4-value status legend
2. [ ] All detailed requirement files use "Evaluation Environment (Jan 2026)" column header
3. [ ] All detailed requirement files use "Finalization Scope" column header
4. [ ] No occurrences of "Built" status remain in tables
5. [ ] No occurrences of "**Remaining Scope:**" subsection headers remain
6. [ ] No occurrences of "**Prototype (Jan 2026):**" subsection headers remain
7. [ ] "Risk" framing replaced with "readiness/certainty" framing in vendor-fit
8. [ ] "PostgreSQL column-level encryption" replaced with "Application-level field encryption"
9. [ ] 24/7 support wording clarified
10. [ ] Pricing Philosophy simplified
11. [ ] Executive Summary "At a Glance" uses "Evaluation environment" dimension

### Search/Replace Commands to Verify

```bash
# Check for remaining "Built" status in tables
grep -r "| Built " docs/sin-rfp/response/04-system-requirements/

# Check for remaining "Remaining Scope" headers (table and subsection)
grep -r "Remaining Scope" docs/sin-rfp/response/04-system-requirements/

# Check for "Prototype (Jan 2026)" (table headers and subsections)
grep -r "Prototype (Jan 2026)" docs/sin-rfp/response/**/final.md

# Check for risk language in vendor-fit
grep -i "risk" docs/sin-rfp/response/02-vendor-fit/final.md

# Check for "Low-Risk" in vendor-fit
grep "Low-Risk" docs/sin-rfp/response/02-vendor-fit/final.md
```

### After Editing final.md Files

Regenerate the combined proposal document:

```bash
# The combined.md is likely generated from finals - check docs/sin-rfp/README.md for the process
cat docs/sin-rfp/response/**/final.md > docs/sin-rfp/response/full-proposal-response-combined.md
```

---

## Files to Edit (Ordered by Phase)

### Phase 1: System Requirements (Status Consistency)

1. `docs/sin-rfp/response/04-system-requirements/00-compliance-crosswalk/final.md`
   - Update "Prototype (Jan 2026)" → "Evaluation Environment (Jan 2026)" in 5 table headers
   - Update Status column values to use 4-value legend (25 rows)

2. `docs/sin-rfp/response/04-system-requirements/data-management-dm-agg/final.md`
   - Update table header: "Prototype (Jan 2026)" → "Evaluation Environment (Jan 2026)"
   - Update table header: "Remaining Scope" → "Finalization Scope"
   - Update Status column: "Built" → matching 4-value legend (6 rows)
   - Update 6 "**Remaining Scope:**" subsections → "**Finalization Scope:**"
   - Update 6 "**Prototype (Jan 2026):**" subsections → "**Evaluation Environment (Jan 2026):**"

3. `docs/sin-rfp/response/04-system-requirements/reporting-rp-agg/final.md`
   - Same pattern as #2 (5 requirements)

4. `docs/sin-rfp/response/04-system-requirements/security-sec-agg/final.md`
   - Same pattern as #2 (4 requirements)

5. `docs/sin-rfp/response/04-system-requirements/user-interface-ui-agg/final.md`
   - Same pattern as #2 (7 requirements)

6. `docs/sin-rfp/response/04-system-requirements/training-onboarding-to-agg/final.md`
   - Same pattern as #2 (3 requirements)

### Phase 2-5: Other Files

7. `docs/sin-rfp/response/01-executive-summary/final.md`
   - Line 9: "operational risk" → "clear operational accountability"
   - Line 36: "built and partial items" → new wording
   - Lines 70-73: "At a Glance" table updates
   - Line 60: PostgreSQL encryption wording
   - Line 83: "Working Prototype for Evaluator Validation" → "Working Evaluation Environment"
   - Line 85: "Requirements Coverage (January 2026 Prototype)" → "Requirements Coverage (January 2026 Evaluation Environment)"

8. `docs/sin-rfp/response/02-vendor-fit/final.md`
   - Line 60: Section header "Low-Risk Procurement Choice" → "Straightforward to Evaluate"
   - Lines 71-79: "Risk Mitigation Summary" table → "Procurement Certainty Summary"

9. `docs/sin-rfp/response/01-B-prototype-evaluation-guide/final.md`
   - Line 5: "reduce delivery risk" → "reduce procurement uncertainty"

10. `docs/sin-rfp/response/06-cost-value/final.md`
    - Line 132: 24/7 support wording fix
    - Lines 140-149: Replace entire Pricing Philosophy section
