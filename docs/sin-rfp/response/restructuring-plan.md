# RFP Response Restructuring Plan

## Objective

Address feedback to: (1) get Executive Summary under 3 pages, and (2) reframe "unique additions" as evaluator tools and risk reduction rather than scope creep.

## Current State Analysis

### Executive Summary Issues (01-executive-summary/final.md)

- Currently ~120 lines with embedded security sections (1.1, 1.2, 1.3)
- Response Overview table includes too much detail
- Key Highlights repeats security/residency info
- Navigation Map is useful but too long for Exec Summary

### Duplication Identified

| Topic               | Appears In                                                                         |
| ------------------- | ---------------------------------------------------------------------------------- |
| Security/encryption | Exec Summary (1.2), Vendor Fit (Key Differentiators), SEC-AGG sections, Appendix D |
| Data residency      | Exec Summary (1.1), Vendor Fit, SEC-AGG-003, Appendix D                            |
| Team bios           | Exec Summary, Vendor Fit, Appendix F                                               |
| Performance metrics | Exec Summary At-a-Glance, Appendix C, Capabilities                                 |

---

## Implementation Plan

### ~~Phase 1: Create New Cover Letter~~ SKIPPED

**Decision:** Skip cover letter. The condensed Executive Summary serves as the introduction.

---

### Phase 2: Rewrite Executive Summary (≤3 pages)

**File:** `docs/sin-rfp/response/01-executive-summary/final.md`

**Approach:** Use the paste-ready template from feedback as starting point.

Replace current content with this structure:

1. **Opening paragraph** - "Austin Wallace Tech proposes **Solstice**..." (what viaSport is buying + why low risk)
2. **At a Glance table** - Dimension/Proposal Summary format (condensed, no Section references)
3. **What viaSport Is Buying** - Term structure (3-year base + extensions), one-time vs subscription
4. **Why This Approach Reduces Risk** - 4 numbered points (working system, traceable, ops included, adoption focus)
5. **Implementation Plan and Timeline** - 30 weeks with phase breakdown
6. **How viaSport Can Evaluate Quickly** - 3 bullets (Prototype Guide, Crosswalk, Evidence Pack)
7. **Team and Accountability** - Role table (keep current format)
8. **Key Assumptions and Dependencies** - Brief list
9. **Closing statement** - "Austin Wallace Tech welcomes the opportunity..."

**Key removals:**

- REMOVE Sections 1.1, 1.2, 1.3 (replaced with single line: "Security, data residency, and prototype details are in **Appendix D**")
- REMOVE Response Overview table (redundant - Navigation Map is now separate)
- REMOVE Key Highlights section (redundant with At a Glance)
- REMOVE Navigation Map (moved to 01-C-navigation-map/final.md)

---

### Phase 3: Move Navigation Map

**Current location:** End of Executive Summary
**New location:** `docs/sin-rfp/response/01-C-navigation-map/final.md` (NEW)

Position immediately after Executive Summary as standalone section (½–1 page).

**Table format:**
| RFP Evaluation Criterion | Our Response Section |
|--------------------------|---------------------|
| Vendor Fit | **Vendor Fit to viaSport's Needs** (company profile, team) |
| Solution Overview | **Solution Overview** (workflow summary) |
| ... | ... |

Merge "Notes" column into Response Section as parentheticals to reduce width.

---

### Phase 4: Consolidate Security Content

**Single source of truth:** `docs/sin-rfp/response/08-appendices/final.md` (Appendix D)

**Changes to other files:**

| File                                               | Change                                                                                                                         |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `01-executive-summary/final.md`                    | Replace Sections 1.1, 1.2, 1.3 with: "Security, data residency, and prototype data provenance are detailed in **Appendix D**." |
| `02-vendor-fit/final.md`                           | In Key Differentiator #5 & #6, replace details with "See **Appendix D: Security Architecture Summary**"                        |
| `04-system-requirements/security-sec-agg/final.md` | Keep requirement details, but remove repeated encryption layers (reference Appendix D)                                         |

---

### Phase 5: Reframe Unique Additions

Apply consistent labeling in all documents:

| Addition                     | Frame As            | Location                              |
| ---------------------------- | ------------------- | ------------------------------------- |
| Prototype + Evaluation Guide | **Evaluator Tool**  | Appendix A                            |
| Service Levels & SLA         | **Risk Reduction**  | Main body (short), Appendix           |
| Evidence Pack                | **Evaluator Tool**  | Appendix B/C                          |
| AI Foundation                | **Optional Module** | Capabilities section                  |
| Exit & Portability           | **Risk Reduction**  | Appendix E (referenced in Vendor Fit) |

**Specific edits:**

- In `01-B-prototype-evaluation-guide/final.md`: Add header text "This guide is provided as an **Evaluator Tool** to reduce evaluation effort."
- In `03-service-approach/service-levels/final.md`: Frame SLA as **Risk Reduction** ("reduces operational risk")
- In `05-capabilities-experience/final.md`: AI section already frames as "Optional modules enabled only with governance decisions" - keep this framing

---

### Phase 6: Evidence Organization

**Approach:** Use a folder-based evidence structure in the submission zip:

```
evidence/
├── screenshots/
│   ├── DM-AGG-001/
│   ├── SEC-AGG-001/
│   └── ...
├── videos/
│   └── [FINAL videos]
└── README.md (evidence index with key highlights)
```

**In Appendix I (Evidence Pack):**

- Reference the `evidence/` folder in the zip
- Highlight 10-15 key screenshots that prove critical requirements
- Note: "Complete evidence is organized by requirement ID in the evidence folder"

**In Crosswalk:** Add brief evidence references like:

> SEC-AGG-004 | ... | Evidence: `evidence/screenshots/SEC-AGG-004/`

---

### Phase 7: Fix Crosswalk Phrasing (DM-AGG-002)

**File:** `04-system-requirements/00-compliance-crosswalk/final.md`

**Change 1 - Table row:**
From:

> DM-AGG-002 | Optional / Post-Award | Import and export, validation, audit logging

To:

> DM-AGG-002 | Implemented (Demoable Now) | Import/export, standardization, transformation logging | External API integrations optional post-award

**Change 2 - Summary table footnote:**
Add below the Summary table:

> _25/25 core requirements are implemented. DM-AGG-002 external integrations are optional add-ons scoped post-award if required._

---

### Phase 8: FOIPPA Reference Cleanup

**File:** `07-delivery-schedule/final.md` (line 26)

Change from:

> "ensuring system configuration meets FOIPPA requirements"

To:

> "ensuring system configuration meets PIPA/PIPEDA and any applicable provincial requirements"

---

## File Changes Summary

| File                                                      | Action                                               | Phase   |
| --------------------------------------------------------- | ---------------------------------------------------- | ------- |
| `07-delivery-schedule/final.md`                           | MINOR EDIT (FOIPPA → PIPA/PIPEDA)                    | 8       |
| `04-system-requirements/00-compliance-crosswalk/final.md` | EDIT (DM-AGG-002 phrasing + Summary footnote)        | 7       |
| `08-appendices/final.md`                                  | EDIT (ensure Appendix D is complete source of truth) | 4       |
| `02-vendor-fit/final.md`                                  | EDIT (update Section 1.x refs → Appendix D)          | 4.5     |
| `03-service-approach/platform-design/final.md`            | EDIT (update Section 1.x refs)                       | 4.5     |
| `03-service-approach/data-warehousing/final.md`           | EDIT (update Section 1.x refs)                       | 4.5     |
| `04-system-requirements/security-sec-agg/final.md`        | EDIT (update Section 1.x refs)                       | 4.5     |
| `01-C-navigation-map/final.md`                            | CREATE (move from Exec Summary)                      | 3       |
| `01-executive-summary/final.md`                           | MAJOR REWRITE (compress to ≤3 pages)                 | 2       |
| ~~`00-cover-letter/final.md`~~                            | ~~CREATE~~                                           | SKIPPED |
| `01-B-prototype-evaluation-guide/final.md`                | MINOR EDIT (add "Evaluator Tool" framing)            | 5       |
| `03-service-approach/service-levels/final.md`             | MINOR EDIT (add "Risk Reduction" framing)            | 5       |
| `full-proposal-response-combined.md`                      | REGENERATE                                           | 9       |

---

### Phase 4.5: Update All Section References (NEW)

After removing Sections 1.1, 1.2, 1.3 from Executive Summary, update all downstream references:

| Current Reference | New Reference                                           | Files Affected                                |
| ----------------- | ------------------------------------------------------- | --------------------------------------------- |
| "See Section 1.1" | "See **Appendix D: Security Architecture Summary**"     | vendor-fit, platform-design, data-warehousing |
| "See Section 1.2" | "See **Appendix D: Security Architecture Summary**"     | vendor-fit, security-sec-agg                  |
| "See Section 1.3" | "See **Appendix A** and **Prototype Evaluation Guide**" | Multiple                                      |

---

### Phase 9: Regenerate Combined Document (NEW)

**File:** `docs/sin-rfp/response/full-proposal-response-combined.md`

After all changes are complete, regenerate the combined document to reflect the new structure.

---

## Recommended Implementation Order

| Order | Phase                                 | Rationale                                          |
| ----- | ------------------------------------- | -------------------------------------------------- |
| 1     | Phase 8: FOIPPA Cleanup               | Quick, isolated change; no dependencies            |
| 2     | Phase 7: DM-AGG-002 Fix               | Quick fix; establishes correct framing             |
| 3     | Phase 4: Consolidate Security         | Must complete before removing Sections 1.1/1.2/1.3 |
| 4     | Phase 4.5: Update Section References  | Fix all downstream "See Section 1.x" references    |
| 5     | Phase 3: Move Navigation Map          | Creates new file before Exec Summary rewrite       |
| 6     | Phase 2: Rewrite Executive Summary    | Major rewrite using paste-ready template           |
| 7     | Phase 5: Reframe Unique Additions     | Apply consistent labeling after main structure set |
| 8     | Phase 6: Evidence Organization        | Update Appendix I with folder reference approach   |
| 9     | Phase 9: Regenerate Combined Document | Flatten all changes                                |

**Note:** Phase 1 (Cover Letter) skipped per user decision.

---

## Verification

After changes:

1. Word count Executive Summary: Target ≤1,500 words (~3 pages)
2. Security/encryption details appear ONLY in Appendix D
3. All "unique additions" labeled as Evaluator Tool, Risk Reduction, or Optional Module
4. DM-AGG-002 phrasing no longer contradicts "25/25 implemented"
5. No FOIPPA references (only PIPA/PIPEDA)
6. No broken "See Section 1.x" references
7. Combined document regenerated

---

## Decisions Made

- **Evidence Index:** Folder-based approach - highlight key files in Appendix I, reference `evidence/` folder in zip
- **Cover Letter:** Skipped - Executive Summary serves as introduction
- **Executive Summary:** Use paste-ready template from feedback
- **Navigation Map:** Merge Notes into Response Section as parentheticals
- **DM-AGG-002:** Add Summary table footnote explaining external integrations are optional

---

## Paste-Ready Executive Summary Template

The feedback included a paste-ready Executive Summary. Key sections to preserve from that template:

1. Opening: "Austin Wallace Tech proposes **Solstice**..."
2. At a Glance table with Dimension/Proposal Summary columns
3. "What viaSport Is Buying" with term structure
4. "Why This Approach Reduces Risk" (4 numbered points)
5. "Implementation Plan and Timeline" with week ranges
6. "How viaSport Can Evaluate Quickly" with 3 bullets
7. "Team and Accountability" with role table
8. "Key Assumptions and Dependencies"
9. Closing: "Austin Wallace Tech welcomes the opportunity..."
