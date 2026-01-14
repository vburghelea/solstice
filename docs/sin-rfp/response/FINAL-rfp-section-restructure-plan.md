# RFP Section-by-Section Restructure Plan - Final Enhanced Version

This plan synthesizes:

- GridMatrix San Mateo RFP structure (professional RFP flow)
- viaSport RFP evaluation criteria order
- Kyle's professional RFP writing feedback
- Current draft analysis and duplication identification

---

## Core Recommendation: Breadth-First Structure

### Current Problem (Depth-First)

The current draft goes:

```
Executive Summary → Deep dive on capabilities → Deep dive on team →
Deep dive on security → Deep dive on each requirement...
```

This forces evaluators to read deeply before they understand the scope.

### Recommended Solution (Breadth-First)

The new structure goes:

```
Executive Summary (all key points) → Evaluation Guide → Navigation Map →
[Brief section summaries for each criterion] → [Detailed appendices]
```

This gives evaluators:

1. **Fast scoring path** (first 10 pages cover all criteria)
2. **Deep dives available** (appendices for detail-seekers)
3. **Clear evidence mapping** (every claim has a screenshot/video reference)

---

## Proposed Top-Level Sequence

| #   | Section                                           | Pages | Purpose                                 |
| --- | ------------------------------------------------- | ----- | --------------------------------------- |
| 0   | Cover Page (with contact info)                    | 1     | Professional presentation + contact box |
| 0   | Table of Contents                                 | 1     | Navigation                              |
| 1   | Executive Summary                                 | 2-3   | All key points in one place             |
| 2   | Prototype Evaluation Guide                        | 1-2   | How to validate quickly                 |
| 3   | Evaluator Navigation Map                          | 1     | Where to find each criterion            |
| 3.5 | Assumptions, Dependencies, and Finalization Scope | 1     | Consolidated risk view                  |
| 4   | Vendor Fit to viaSport's Needs                    | 3-4   | Company, team, differentiators          |
| 5   | Solution Overview                                 | 2     | Non-technical workflow summary          |
| 6   | Service Approach                                  | 8-10  | Methodology for each scope item         |
| 7   | Service Levels, Support, Reliability              | 2     | SLAs and ops commitments                |
| 8   | System Requirements Crosswalk                     | 1     | Quick compliance summary                |
| 9   | System Requirements: DM-AGG                       | 3-4   | Data Management details                 |
| 10  | System Requirements: RP-AGG                       | 2-3   | Reporting details                       |
| 11  | System Requirements: SEC-AGG                      | 2-3   | Security details                        |
| 12  | System Requirements: TO-AGG                       | 1-2   | Training details                        |
| 13  | System Requirements: UI-AGG                       | 2-3   | User Interface details                  |
| 14  | Capabilities and Experience                       | 2-3   | Case studies                            |
| 15  | Commercial Model and Pricing                      | 2     | Term pricing, TCO                       |
| 16  | Project Plan and Timeline                         | 2-3   | Milestones and cutover                  |
| 17  | Appendices                                        | 10-15 | Deep technical detail                   |

**Note:** No separate cover letter or authorized contacts page. Contact info is on the cover page.

**Total estimated pages:** 48-58 (excluding appendices)

---

## Section-by-Section Changes

### 1. Executive Summary

#### Current Issues

- Two Executive Summary sections in the combined doc (Kyle's + older version)
- Kyle notes and placeholder text visible (`<<<^new Summary`, `notes from convo with kyle:`)
- Security and data residency content too deep for summary
- Team bios duplicated here and in other sections

#### Changes Required

1. **Keep only Kyle's narrative** (first section)
2. **Delete the older summary section entirely** (starts at line 42)
3. **Delete all Kyle notes and placeholders** (lines 15-37)
4. **Add "At a Glance" table** (quick facts in right column)
5. **Add "RFP Alignment" section** that maps to viaSport's Purpose bullets:
   - "You asked for data collection → We deliver configurable form builder"
   - "You asked for analytics → We deliver native BI platform"
   - etc.
6. **Move security/privacy detail to Section 1.1/1.2 references only**
7. **Move team bios to Appendix F** - keep only role table in summary
8. **Add explicit statement:** "This response follows the RFP evaluation criteria in order"

#### Target Length

- 2-3 pages maximum

---

### 2. Prototype Evaluation Guide

#### Current Issues

- Strong content, but SEC-AGG-002 and SEC-AGG-003 not explicitly validated in crosswalk
- Evidence and videos scattered
- Too much narrative

#### Changes Required

1. **Place immediately after Executive Summary**
2. **Add explicit crosswalk rows for SEC-AGG-002 and SEC-AGG-003:**
   - SEC-AGG-002: Admin → Security → Events / Account Locks
   - SEC-AGG-003: Admin → Privacy → Retention Policies / Legal Holds
3. **Add video strip** with 6 video thumbnails + clickable youtu.be links (no QR codes)
4. **Reduce narrative** to 1-2 pages maximum
5. **Create 6-step evaluator path:**
   1. Login with MFA
   2. View role-based dashboard
   3. Create/submit a form
   4. Build analytics query
   5. Review audit logs
   6. Verify hash chain

#### Target Length

- 1-2 pages

---

### 3. Evaluator Navigation Map

#### Current Issues

- Uses folder names in some places
- Doesn't match final header titles

#### Changes Required

1. **Make this a separate 1-page section** after Prototype Evaluation Guide
2. **Use exact section titles** (no internal folder references)
3. **Two-column format:**

| RFP Criterion                  | Our Response Section         |
| ------------------------------ | ---------------------------- |
| Vendor Fit to viaSport's Needs | Section 4: Vendor Fit        |
| Solution Overview              | Section 5: Solution Overview |
| Service Approach               | Section 6: Service Approach  |
| System Requirements            | Sections 8-13                |
| Service Levels                 | Section 7: Service Levels    |
| Capabilities and Experience    | Section 14: Capabilities     |
| Cost and Value                 | Section 15: Commercial Model |
| Timeline                       | Section 16: Project Plan     |
| Prototype Validation           | Section 2: Evaluation Guide  |

---

### 3.1 Scoring Summary (NEW - 1 page)

#### Purpose

A "gift to the evaluator" that turns the proposal into a scoring aid. Add immediately after the Navigation Map.

#### Layout

| Evaluation Criterion | What to read (pages) | What to verify (demo)         | Evidence             |
| -------------------- | -------------------- | ----------------------------- | -------------------- |
| Prototype validation | Sec 2                | 15-min walkthrough steps      | V1–V6                |
| System requirements  | Sec 8–13             | Verify 5 key workflows        | DM-1, RP-1, SEC-1... |
| Service approach     | Sec 6                | See deliverables tables       | SA figures           |
| Security/privacy     | Sec 11 + App D       | Lockout, retention, audit     | SEC-1, SEC-2...      |
| Service levels       | Sec 7                | SLA table, DR drill evidence  | App C                |
| Capabilities         | Sec 14               | Case study outcomes           | —                    |
| Cost and value       | Sec 15               | Pricing table                 | —                    |
| Timeline             | Sec 16               | Milestone table, cutover plan | —                    |

**Why this works:** Evaluators can scan this page and immediately understand where to find each scoring criterion. It reduces "I couldn't find it" moments.

---

### 3.5 Assumptions, Dependencies, and Finalization Scope (NEW)

#### Purpose

A single consolidated 1-page table that shows viaSport what decisions and inputs are needed, and demonstrates professional project management. This reduces perceived risk.

#### Layout

```
+------------------------------------------+
| H2: Assumptions, Dependencies, and       |
|     Finalization Scope                   |
+------------------------------------------+
| ASSUMPTION TABLE                         |
| | Item | Assumption | Dependency | Impact|
| |------|------------|------------|-------|
| | Legacy data | Export available | viaSport| Delays migration |
| | MFA policy | Configurable | viaSport | Discovery item |
| | SSO | Phased rollout | Discovery | Post-launch |
+------------------------------------------+
```

#### Content

| Category  | Item                   | Our Assumption                  | viaSport Dependency           | Impact if Delayed  | Mitigation               |
| --------- | ---------------------- | ------------------------------- | ----------------------------- | ------------------ | ------------------------ |
| Migration | Legacy DB access       | Direct export available         | viaSport provides credentials | Delays migration   | Start with sample export |
| Migration | Data freeze window     | 2 business days                 | viaSport confirms timing      | Cutover scheduling | Flexible delta sync      |
| Migration | Parallel run           | Not required                    | viaSport confirms             | Scope change       | Can add if needed        |
| Auth      | MFA policy             | Configurable by viaSport        | Policy decision               | Discovery scope    | Default: optional        |
| Auth      | SSO providers          | Phased: M365 first, then social | IdP configuration             | Discovery scope    | Email/password available |
| Retention | Data retention periods | 7-year default                  | viaSport policy               | Discovery scope    | Configurable per type    |
| Training  | User onboarding format | Self-serve + live sessions      | viaSport preference           | Training timing    | Both available           |

#### Target Length

- 1 page maximum

---

### 4. Vendor Fit to viaSport's Needs

#### Current Issues

- Team bios repeated here, in Executive Summary, and in Appendix F
- Security differentiation repeated here and in security sections
- "1 principal plus contracted specialists" phrasing could be stronger

#### Changes Required

1. **Keep short team table** (names and roles only)
2. **Move full bios to Appendix F only**
3. **Add shared responsibility model statement:**
   > "AWS secures the underlying cloud infrastructure and we implement and operate application-level controls, configuration, and monitoring."
4. **Keep "Security and Privacy by Design"** but reduce to 1 short paragraph
5. **Rephrase delivery structure:**
   - FROM: "1 principal plus contracted specialists"
   - TO: "Core delivery pod with specialized advisory partners"
6. **Remove any security content that duplicates SEC-AGG sections**

#### Target Length

- 3-4 pages

---

### 5. Solution Overview

#### Current Issues

- Content begins to deep dive before evaluators see full outline
- Too technical too early

#### Changes Required

1. **Keep as high-level workflow summary**
2. **Limit to 2 pages** with:
   - Workflow diagram
   - Role summary (admin vs PSO capabilities)
   - Migration summary (1 paragraph)
3. **Push all technical and operational detail** to Service Approach and System Requirements
4. **Use "show don't tell" pattern:**
   - 1 paragraph → 1 screenshot → bullet list

#### Target Length

- 2 pages

---

### 6. Service Approach (6 items)

#### Current Issues

- Some sections include requirement details that belong in System Requirements
- Causes duplication and confusion

#### Changes Required

Each of the 6 items follows the **same template:**

```
[H2: Service Approach Item Name]

[1 paragraph summary - what viaSport asked, what we deliver]

3-STEP METHOD          | EVIDENCE
1. [Step]              | [Screenshot]
2. [Step]              | Figure SA-X
3. [Step]              | Video: [Link]

KEY DELIVERABLES TABLE
| Deliverable | Timing | Dependency |
```

**Specific changes per item:**

#### 6.1 Data Submission and Reporting Web Portal

- Keep UX strategy content
- **Move technology stack tables to Appendix G** (keep only brief summary in main body)
- Remove requirement-level detail → reference DM-AGG-001 and RP-AGG-003

#### 6.2 Data Warehousing

- Keep hosting solution and tenancy model
- Keep data residency table
- Remove duplicate security content → reference SEC-AGG sections

#### 6.3 Data Migration

- Keep migration phases table
- **Add explicit Cutover section:**
  - Data freeze window: **2 business days** (confirmed assumption)
  - No parallel run required (confirmed assumption)
  - Final validation checklist
  - Rollback criteria
  - Hypercare period: **UAT through 1 month post go-live**
- Remove technical infrastructure detail → move to appendix

#### 6.4 Platform Design and Customization

- **Move AWS services table to Appendix G** (keep 1-sentence tech summary in main body)
- Keep "Why Serverless" section (1 paragraph only)
- Move development workflow diagram to appendix

#### 6.5 Testing and Quality Assurance

- Keep quality gates table
- Add accessibility evidence summary
- Add performance evidence summary

#### 6.6 Training and Onboarding

- Keep training approach
- Keep phased rollout plan
- Remove content that duplicates TO-AGG sections

---

### 7. Service Levels, Support, and Reliability

#### Current Issues

- Section exists but is buried in the document
- Not visually prominent

#### Changes Required

1. **Place right after Service Approach** (keeps evaluation criteria order)
2. **Include SLA table:**

| Metric          | Target  | Evidence             |
| --------------- | ------- | -------------------- |
| Availability    | 99.5%   | Monitoring dashboard |
| Response (Sev1) | 60 min  | Escalation path      |
| Response (Sev2) | 4 hours | Support tickets      |
| RPO             | 1 hour  | DR drill 2026-01-08  |
| RTO             | 4 hours | DR drill 2026-01-08  |

3. **Add DR and retention evidence callouts**

#### Target Length

- 2 pages

---

### 8. System Requirements Compliance Crosswalk

#### Current Issues

- Crosswalk exists but separated from requirement sections

#### Changes Required

1. **Place immediately before requirement sections**
2. **Use 1-page summary format:**

| ID         | Title           | Status    | Evidence          |
| ---------- | --------------- | --------- | ----------------- |
| DM-AGG-001 | Data Collection | Confirmed | Fig DM-1, Video 2 |
| ...        | ...             | ...       | ...               |

3. **Add note:** "Detailed requirement responses follow in Sections 9-13"

---

### 9-13. System Requirements Sections

#### Changes Required

For each category (DM-AGG, RP-AGG, SEC-AGG, TO-AGG, UI-AGG):

1. **Add 1-page category summary table first** (all requirements in that category)
2. **Use 1 page per requirement:**
   - Requirement text (abbreviated)
   - Implementation summary
   - Finalization scope (what needs viaSport input)
   - Evidence image or video
3. **Move deep architecture/storage details to appendices**

#### Per-Requirement Template

```
+------------------------------------------+
| REQ ID: [ID]                             |
| Title: [Title]                           |
| Status: CONFIRMED / IMPLEMENTED          |
+--------------------+---------------------+
| REQUIREMENT        | EVIDENCE            |
| [Abbreviated text] | [Screenshot]        |
|                    | Figure [X]          |
| HOW WE MEET IT     |                     |
| - Bullet           | Video: [Link]       |
| - Bullet           |                     |
| - Bullet           |                     |
+--------------------+---------------------+
| FINALIZATION SCOPE                       |
| [What needs viaSport input]              |
+------------------------------------------+
```

---

### 14. Capabilities and Experience

#### Current Issues

- Reads like a resume in places
- Bios duplicated from other sections

#### Changes Required

1. **Convert to case study format** (1 page per case study):
   - Problem
   - Delivered
   - Outcome
   - Relevance to viaSport
2. **Add AI and automation paragraph** with responsible AI practices
3. **Remove all bios** → reference Appendix F only
4. **Keep Soleil Heaney's sport sector connection** as a differentiator

#### Target Length

- 2-3 pages

---

### 15. Commercial Model and Pricing

#### Changes Required

1. **Page 1: Pricing summary table**
   - 3-year total
   - 5-year total
   - Implementation fee
   - Annual subscription
2. **Page 2: Change management and optional add-ons**
   - Enhancement hours
   - Optional support tiers
   - In-kind contributions (if applicable)
3. **Use plain language** - no marketing

#### Target Length

- 2 pages

---

### 16. Project Plan, Timeline, and Delivery Schedule

#### Current Issues

- No explicit cutover plan

#### Changes Required

1. **Add Cutover and Change Management subsection:**
   - Data freeze window: **2 business days**
   - No parallel run (viaSport confirmed)
   - Final validation checklist
   - Rollback criteria
   - Hypercare period: **UAT through 1 month post go-live**
2. **Include timeline graphic** (horizontal, 16-30 weeks)
3. **Add milestone table** with dependencies
4. **Target go-live:** Fall 2026

#### PSO Champion Sourcing

When referencing "PSO champions" in the timeline or risk sections:

- **Clarify:** "PSO champions will be identified during Discovery in collaboration with viaSport staff who have existing PSO relationships."
- This answers "from where?" and shows we're not assuming access we don't have.

#### Risk Table Improvements

The mitigation column in the risk table needs specific, actionable content:

- **Not:** "Mitigate through communication"
- **Better:** "Weekly stakeholder sync with viaSport PMO; escalation path to Director level within 24 hours"

#### Target Length

- 2-3 pages

---

### 17. Appendices

#### Changes Required

Centralize all deep technical and evidence content:

| Appendix | Content                                                                                   | Pages |
| -------- | ----------------------------------------------------------------------------------------- | ----- |
| A        | Demo Access                                                                               | 1     |
| B        | Evaluator Access Pack                                                                     | 1     |
| C        | Performance Evidence                                                                      | 2     |
| D        | Security Architecture Summary                                                             | 2     |
| E        | Exit and Portability                                                                      | 1     |
| F        | Full Team Bios                                                                            | 2-3   |
| G        | Technology Stack Detail (AWS services table, framework versions, infrastructure diagrams) | 2-3   |
| H        | Development and QA Process                                                                | 2     |
| I        | Evidence Pack (screenshot index)                                                          | 1-2   |
| J        | OWASP Top 10 Mapping                                                                      | 1     |

**Remove any repeated content from main body**

### Repo Artifacts (Single Sources of Truth)

Create these files before final assembly to prevent inconsistencies:

#### 1. Figure Registry File

**Location:** `docs/sin-rfp/response/figure-registry.csv`

| Column             | Purpose                                    |
| ------------------ | ------------------------------------------ |
| `figure_id`        | Canonical ID (DM-1, SEC-2, etc.)           |
| `requirement_id`   | Which requirement this supports (optional) |
| `caption`          | Exact caption to use everywhere            |
| `source_file_path` | Path to the screenshot file                |
| `evaluator_path`   | sin-uat navigation path                    |
| `video_id`         | Associated video if any (V1-V6)            |
| `used_in_sections` | Which sections reference this figure       |

**Purpose:** Prevents duplicated screenshots, mismatched captions, and inconsistent figure numbering.

#### 2. Evaluator Quick-Reference Pack

**Include in submission ZIP:** A standalone 1-page PDF (`evaluator-quick-reference.pdf`)

Contents:

- sin-uat URL
- Credentials table (same as Appendix A)
- Support email
- Video links list (youtu.be + ZIP fallback)
- 15-minute walkthrough steps (condensed)

**Purpose:** This is the page evaluators will keep open while scoring. Reduces friction.

#### Appendix Introduction Standard

Each appendix should begin with a 1-2 sentence introduction explaining:

- What the appendix contains
- Why it's relevant to evaluators
- How to use it

**Example for Appendix E (User Personas):**

> "This appendix describes the five user personas supported by Solstice. Each persona maps to a role in viaSport's organization hierarchy, from platform administrators to club reporters."

#### Team Bio Requirements (Appendix F)

Team bios must meet these standards:

- Include LinkedIn profile URLs for all team members
- Specify domain expertise clearly (not "many industries" - list 2-3 specific industries)
- Avoid vague phrases:
  - "hard lessons" → specify the lesson type (e.g., "data governance lessons learned")
  - "defense" → clarify as "defense sector" or "cybersecurity"
  - "enterprise business objectives" → simplify to "business goals" or "organizational priorities"
  - "unique perspective" → change to "practical end-user perspective"
- Include Ruslan's technical credentials explicitly
- Include Will's architecture and integration experience

---

## Duplication Removal Checklist

### Team Bios (appears 3 times currently)

- [ ] Executive Summary: Keep summary team table only
- [ ] Vendor Fit: Keep role descriptions only
- [ ] Appendix F: Keep full bios (single source of truth)

### Security Model (appears 4+ times)

- [ ] Executive Summary Section 1.2: Keep 1 paragraph summary
- [ ] Vendor Fit "Security by Design": Reduce to 1 paragraph + reference
- [ ] Service Approach Data Warehousing: Keep regulatory alignment table
- [ ] SEC-AGG sections: Keep full detail
- [ ] Appendix D: Keep architecture diagram

### Data Residency (appears 3+ times)

- [ ] Executive Summary Section 1.1: Keep as single source of truth
- [ ] Service Approach Data Warehousing: Reference Section 1.1
- [ ] SEC-AGG-003: Reference Section 1.1

### Performance Stats (appears 2+ times)

- [ ] Executive Summary "At a Glance": Keep summary stats
- [ ] Appendix C: Keep full evidence

### Technology Stack (appears 2+ times)

- [ ] Service Approach 6.1: Remove technology stack tables → reference Appendix G
- [ ] Service Approach 6.4: Remove AWS services table → reference Appendix G
- [ ] Appendix G: Single source of truth for all tech stack detail

---

## Content to Delete

### Executive Summary

- Lines 15-37: All Kyle notes and placeholders
- Lines 42-160: Old executive summary section (keep only Kyle's version)

### Duplicate Sections

- Any "Response Overview" tables that repeat the TOC
- Any team bio content outside Appendix F
- Any security architecture content that duplicates SEC-AGG sections

### Internal References

- All folder path references (e.g., "See Section 01-B")
- All internal notes (e.g., "<<<^new Summary", "TBD")

---

## Migration Order for Restructuring

1. **Create new document structure** (empty skeleton with all headers)
2. **Move Executive Summary** (clean Kyle version only)
3. **Move Prototype Evaluation Guide** (add video strip)
4. **Create Evaluator Navigation Map** (new 1-page section)
5. **Move Vendor Fit** (remove bio duplication)
6. **Move Solution Overview** (keep brief)
7. **Move Service Approach sections** (remove requirement duplication)
8. **Create Service Levels section** (consolidate SLA content)
9. **Move System Requirements** (use per-requirement template)
10. **Move Capabilities** (convert to case study format)
11. **Move Commercial Model** (clean pricing tables)
12. **Move Project Plan** (add cutover section)
13. **Compile Appendices** (consolidate all deep content)
14. **Final pass:** Remove all remaining duplication

---

## Validation Checklist

After restructuring, verify:

- [ ] Every RFP evaluation criterion has a clear section
- [ ] No content appears in more than one section
- [ ] Every requirement has a screenshot/video reference
- [ ] All internal notes and placeholders are removed
- [ ] Team bios appear only in Appendix F
- [ ] Security architecture appears only in SEC-AGG and Appendix D
- [ ] Performance evidence appears only in At a Glance and Appendix C
- [ ] All section titles match the TOC exactly
- [ ] Page count is within target range (50-60 pages)
