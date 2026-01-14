# RFP Visual Layout Plan - Final Enhanced Version

This plan synthesizes:

- GridMatrix San Mateo RFP sample (Kyle's professional RFP writing style)
- viaSport RFP requirements and evaluation criteria
- Current evidence inventory from `docs/sin-rfp/review-plans/evidence/` (Dec 28 + Jan 10 folders)
- Feedback from professional RFP review

---

## Executive Design Philosophy: "Proof-First"

The GridMatrix approach that makes their RFP compelling:

1. **Say what you're going to do** (1-2 short paragraphs)
2. **Show it immediately** (screenshot/visual proof)
3. **Then expand the explanation**
4. Repeat

This reduces evaluator cognitive load. They stop "reading a proposal" and start "reviewing evidence."

---

## 1. Global Document Layout System

### 1.1 Page Grid and Typography

| Element              | Specification                              |
| -------------------- | ------------------------------------------ |
| Page size            | US Letter                                  |
| Margins              | 0.8" top, 0.75" bottom, 0.8" left/right    |
| Body text            | 11pt, single column                        |
| H1 (section headers) | 20-22pt, bold, numbered (01, 02, 03)       |
| H2 (subsections)     | 14-16pt, bold                              |
| H3 (minor sections)  | 12-13pt, bold                              |
| Table text           | 10pt                                       |
| Bullets              | Simple dash or dot, consistent indentation |

### 1.2 Footer-Only Navigation (GridMatrix Style)

**Footer (two lines):**

- Line 1 (right-aligned): `Strength in Numbers // Page X`
- Line 2 (right-aligned, smaller): `Austin Wallace Tech // Jan 14, 2026`

**Rationale:** GridMatrix keeps the page top clean and uses footer-only navigation. This reduces visual noise when pages already contain evidence screenshots.

### 1.3 Visual System

| Element           | Specification                                                        |
| ----------------- | -------------------------------------------------------------------- |
| Color palette     | viaSport brand colors (see below)                                    |
| Callout boxes     | Thin border, Light Mint (`#DCF6EC`) background for evidence callouts |
| Status badges     | `Implemented`, `Demoable Now`, `Finalization Scope`                  |
| Evidence callouts | Right-aligned boxes with screenshot + video link                     |

#### viaSport Brand Colors (Implemented)

| Role           | Color        | Hex       | Usage                               |
| -------------- | ------------ | --------- | ----------------------------------- |
| Primary        | Dark Teal    | `#003B4D` | Headers, navigation, text emphasis  |
| Secondary      | Teal         | `#00675B` | CTAs, buttons, interactive elements |
| Background     | Light Mint   | `#DCF6EC` | Section backgrounds, callout boxes  |
| Background Alt | Light Sage   | `#ACDECB` | Secondary backgrounds, hover states |
| Success        | Bright Green | `#00BC70` | Success states, positive indicators |
| Text Primary   | Black        | `#000000` | Body text                           |
| Text Secondary | Dark Gray    | `#333333` | Captions, secondary content         |

**WCAG Compliance:**

- Dark Teal on White: 10.5:1 (AAA)
- Dark Teal on Light Mint: 8.9:1 (AAA)
- Teal on White: 5.2:1 (AA for large text, use for buttons/CTAs only)

**Design Philosophy:** Subtle over bold. viaSport colors are used for professional emphasis, not as primary backgrounds. This aligns with evaluator expectations for government RFP submissions.

**Note:** All screenshots from sin-uat now reflect viaSport branding (as of January 2026 implementation).

### 1.4 Evidence Callout Standard

Every requirement section includes:

```
+---------------------------+
| EVIDENCE                  |
| [Screenshot thumbnail]    |
| Figure X: [Caption]       |
|                           |
| Evaluator path:           |
| sin-uat → Admin → [path]  |
|                           |
| Validate: [1 sentence -   |
| what to do]               |
| Expected: [1 sentence -   |
| what to see]              |
|                           |
| Video: V1 [youtu.be link] |
| See Appendix I            |
+---------------------------+
```

**Evaluator Intent Lines (add to every evidence box):**

- **Validate:** What the evaluator should do (1 sentence action)
- **Expected:** What they should see (1 sentence result)

Example:

> **Validate:** Attempt 6 failed logins on `viasport-staff@demo.com`.
> **Expected:** Account lockout event appears in Admin → Security → Events.

**Screenshot Readability Rules:**

- If the screenshot contains UI text that must be read, it must be **at least half-page width** (or be cropped to the relevant area)
- Use thumbnails only for "recognition" screenshots (dashboard overview, navigation, etc.)
- The "Evaluator path" line tells evaluators exactly where to click in sin-uat to see this feature live

**Evidence Box Width Rule:**

- If UI text must be read: **full width**, or **60/40 split** where the image is the 60%
- Reserve narrow right-column evidence boxes for:
  - Recognition shots (dashboard overview)
  - Simple visuals (charts, icons)
  - "Proof of existence" where text isn't critical

### 1.5 PDF Usability Standards

Government evaluators often use PDF viewers with limited navigation. Optimize for scoring:

| Feature             | Implementation                                      |
| ------------------- | --------------------------------------------------- |
| Clickable TOC       | All TOC entries link to their sections              |
| Internal hyperlinks | Cross-references link to target sections/appendices |
| PDF bookmarks       | Bookmark panel matches TOC structure                |
| Live video links    | youtu.be links are clickable, not bare text         |
| Print test          | Verify mint backgrounds don't muddy in grayscale    |

### 1.6 Font Selection

**Use standard fonts that embed cleanly in PDF:**

- Body: System sans-serif (Helvetica, Arial) or open-source equivalent
- Headers: Same family, bold weight
- **Do not use** licensed viaSport fonts (Serifa, Scandia Web) unless embedding is confirmed to work on Windows

**Rationale:** Procurement readers often open PDFs on Windows machines. Licensed fonts may not render correctly if not properly embedded.

### 1.7 Table Formatting Rules

| Rule          | Standard                                        |
| ------------- | ----------------------------------------------- |
| Alignment     | Left-aligned (not centered)                     |
| Header row    | Bold, slightly darker background                |
| Column widths | Auto-fit to content, consistent within section  |
| Borders       | Subtle horizontal rules, minimal vertical lines |

**Rationale:** Left-aligned tables are easier to scan and look more professional. Centered tables can feel off-balance, especially with varying column widths.

---

## 2. Document Structure with Page-by-Page Layout

### 2.1 Cover Page (1 page)

**Layout:**

- Hero screenshot as background (subtle, 30% opacity) or centered image
- Title block centered
- Contact box at bottom (no separate contacts page needed)

**Content:**

```
STRENGTH IN NUMBERS PROJECT
viaSport BC Information Management System Replacement
RFP Response

[Hero image - dashboard screenshot]

Victoria, British Columbia
January 2026

+----------------------------------+
| CONTACT                          |
| Austin Wallace                   |
| Austin Wallace Tech Corporation  |
| austin@solsticeapp.ca            |
| 604-603-8668                     |
| 1403-728 Yates Street            |
| Victoria, BC V8W 0C8             |
+----------------------------------+
```

**Recommended Hero Image:**

- `docs/sin-rfp/review-plans/evidence/2026-01-10/screenshots/DM-AGG-001/00-dashboard-post-login.png` (shows the main dashboard)

**Note:** No separate cover letter or authorized contacts page. Contact info on cover page is sufficient for a single-principal vendor.

---

### 2.2 Table of Contents (1 page)

**Layout:**

- Dot leaders with page numbers (GridMatrix style)
- Two columns if needed to fit on one page
- Section numbers match headers exactly

---

## 3. Executive Summary (2-3 pages)

### Page 1 Structure

**Layout:**

```
+------------------------------------------+
| H1: Executive Summary                    |
|                                          |
| [Kyle narrative - 2 short paragraphs]    |
|                                          |
+------------------+-----------------------+
| [Narrative cont] | AT A GLANCE           |
|                  | - Evaluation env: Yes |
|                  | - Requirements: 25/25 |
|                  | - Performance: 20M    |
|                  | - Timeline: 30 weeks  |
|                  | - Total Cost: $1.2M   |
+------------------+-----------------------+
|                                          |
| [HERO SCREENSHOT - Full width]           |
| Figure ES-1: Role-based dashboard        |
|                                          |
+------------------------------------------+
```

**Screenshot:**

- `docs/sin-rfp/review-plans/evidence/2026-01-10/screenshots/SEC-AGG-001/00-dashboard-post-login.png`
- **Caption:** "Solstice provides role-based dashboards: admins see cross-org oversight; reporters see tasks and submissions."

### Page 2 Structure

**Layout:**

```
+------------------------------------------+
| RFP ALIGNMENT                            |
|                                          |
| [Bullet list mapping to viaSport's       |
| Purpose bullets from page 2 of RFP]      |
|                                          |
| - You need data collection → We deliver  |
| - You need analytics → We deliver        |
| - etc.                                   |
|                                          |
+------------------------------------------+
| WHAT VIASPORT IS BUYING                  |
|                                          |
| [Pricing structure - 3 bullet summary]   |
|                                          |
+--------------------+---------------------+
| [Import screenshot]| PROOF BOX           |
| Figure ES-2        | - 20M rows tested   |
|                    | - p95: 162ms        |
|                    | - 25 concurrent     |
|                    | - 0 server errors   |
+--------------------+---------------------+
```

**Screenshot:**

- `docs/sin-rfp/review-plans/evidence/2026-01-10/screenshots/DM-AGG-006/01-validation-errors.png`
- **Caption:** "Migration readiness: bulk import catches structural and data-quality issues before load."

### Page 3 Structure (Video Index)

**Layout:**

```
+------------------------------------------+
| VIDEO WALKTHROUGHS                       |
|                                          |
| Evaluators can validate key workflows    |
| through these demonstration videos:      |
|                                          |
| +------+ +------+ +------+               |
| |Video1| |Video2| |Video3|               |
| |thumb | |thumb | |thumb |               |
| +------+ +------+ +------+               |
|                                          |
| +------+ +------+ +------+               |
| |Video4| |Video5| |Video6|               |
| |thumb | |thumb | |thumb |               |
| +------+ +------+ +------+               |
|                                          |
+------------------------------------------+
| PROPOSED TEAM (Summary only)             |
| [Simple table - names and roles]         |
| Full bios: See Appendix F                |
+------------------------------------------+
```

**Videos to display (with durations):**
| ID | Title | Duration | File |
|----|-------|----------|------|
| V1 | Authentication & MFA | TBD | `SEC-AGG-001-auth-mfa-login-flow-FINAL.mp4` |
| V2 | Form Submission | TBD | `DM-AGG-001-form-submission-flow-FINAL.mp4` |
| V3 | Data Import | TBD | `DM-AGG-006-import-wizard-flow-FINAL.mp4` |
| V4 | Reporting Cycles | TBD | `RP-AGG-003-reporting-workflow-flow-FINAL.mp4` |
| V5 | Analytics & Export | TBD | `RP-AGG-005-analytics-export-flow-FINAL.mp4` |
| V6 | Audit Logs | TBD | `SEC-AGG-004-audit-verification-flow-FINAL.mp4` |

**Note:** Add a fallback line everywhere videos are referenced:

> "If YouTube is blocked, see `/videos/` in the submission ZIP."

---

## 4. Prototype Evaluation Guide (2 pages)

### Page 1 Structure

**Layout:**

```
+------------------------------------------+
| H1: Prototype Evaluation Guide           |
|                                          |
+--------------------+---------------------+
| PURPOSE & DATA     | DEMO ACCESS         |
| PROVENANCE         |                     |
|                    | Environment: sin-uat|
| No viaSport data   | Contact: support@   |
| was used. Synthetic| solsticeapp.ca      |
| data matches RFP   |                     |
| scale: 20M rows    | [Credentials box]   |
+--------------------+---------------------+
|                                          |
| VIDEO EVIDENCE STRIP (6 tiles + links)   |
|                                          |
| +----+ +----+ +----+ +----+ +----+ +----+|
| |V1  | |V2  | |V3  | |V4  | |V5  | |V6  ||
| +----+ +----+ +----+ +----+ +----+ +----+|
+------------------------------------------+
```

### Page 2 Structure

**Layout:**

```
+------------------------------------------+
| 15-MINUTE EVALUATOR WALKTHROUGH          |
|                                          |
| Step 1: Login & MFA                      |
| +--------+                               |
| |[thumb] | SEC-AGG-001-auth-mfa-login... |
| +--------+                               |
|                                          |
| Step 2: Dashboard & Navigation           |
| +--------+                               |
| |[thumb] | screenshots/SEC-AGG-001/00... |
| +--------+                               |
|                                          |
| [Continue for 6 steps total]             |
|                                          |
+------------------------------------------+
```

**Screenshots per step:**

1. Login: `docs/sin-rfp/review-plans/evidence/2026-01-10/screenshots/SEC-AGG-001/02-mfa-totp-challenge.png`
2. Dashboard: `docs/sin-rfp/review-plans/evidence/2026-01-10/screenshots/SEC-AGG-001/00-dashboard-post-login.png`
3. Form Builder: `docs/sin-rfp/review-plans/evidence/2026-01-10/screenshots/DM-AGG-001/01-form-builder-selected.png`
4. Submission: `docs/sin-rfp/review-plans/evidence/2026-01-10/screenshots/DM-AGG-001/05-form-submission-success.png`
5. Analytics: `docs/sin-rfp/review-plans/evidence/2026-01-10/screenshots/RP-AGG-005/03-bar-chart.png`
6. Audit: `docs/sin-rfp/review-plans/evidence/2026-01-10/screenshots/SEC-AGG-004/04-hash-verified.png`

---

## 5. Vendor Fit to viaSport's Needs (3-4 pages)

### Page 1: Company Overview

**Layout:**

```
+------------------------------------------+
| H1: Vendor Fit to viaSport's Needs       |
|                                          |
| [Company overview - 1 paragraph]         |
|                                          |
| +--------------------------------------+ |
| | COMPANY PROFILE TABLE                | |
| | Headquarters: Victoria, BC           | |
| | Incorporated: 2025                   | |
| | Team size: Core delivery pod of 7    | |
| | Hosting: AWS Canada (Central)        | |
| +--------------------------------------+ |
|                                          |
| [Operating model - 1 paragraph]          |
+------------------------------------------+
```

**No hero screenshot** - text-focused

### Page 2: Delivery Pod + Proof

**Layout:**

```
+------------------------------------------+
| DELIVERY POD                             |
|                                          |
| +--------------------------------------+ |
| | Function | Responsibilities | Name   | |
| |----------|-----------------|---------|  |
| | Lead     | Delivery, risk  | Austin  | |
| | UX Lead  | Research, a11y  | Ruslan  | |
| | etc.     | etc.            | etc.    | |
| +--------------------------------------+ |
|                                          |
+--------------------+---------------------+
| [Screenshot]       | PRODUCT MATURITY    |
| Figure VF-1        | Working baseline    |
|                    | available for       |
|                    | evaluation today    |
+--------------------+---------------------+
```

**Screenshot:**

- `docs/sin-rfp/review-plans/evidence/2026-01-10/screenshots/RP-AGG-003/00-reporting-admin.png`
- **Caption:** "Reporting administration dashboard demonstrating production-ready functionality"

### Page 3: Relevant Experience

**Layout:** Icon blocks for each case study (no photos)

- Teck Resources
- New Jersey Devils
- Clio

**No screenshots** - keep professional

### Page 4: Advisory Partners (Condensed)

**Layout:** 1-line summaries with "See Appendix F for full bios"

---

## 6. Solution Overview (2 pages)

### Page 1: Workflow Summary

**Layout:**

```
+------------------------------------------+
| H1: Solution Overview                    |
|                                          |
| [Workflow diagram - full width]          |
| docs/sin-rfp/response/08-appendices/     |
| diagrams/data-flow-diagram-v3.png        |
|                                          |
+------------------------------------------+
```

### Page 2: 6-Panel Proof Grid (GridMatrix Style)

**Layout:** Like GridMatrix's "intersection grid" - 6 panels that prove the whole platform in 30 seconds

```
+------------------------------------------+
| 6-PANEL PROOF GRID                       |
|                                          |
| +----------+ +----------+ +----------+   |
| |Form      | |Reporting | |Submission|   |
| |Builder   | |Cycle     | |Review    |   |
| +----------+ +----------+ +----------+   |
|                                          |
| +----------+ +----------+ +----------+   |
| |Import    | |Analytics | |Audit     |   |
| |Wizard    | |Builder   | |Log       |   |
| +----------+ +----------+ +----------+   |
+------------------------------------------+
```

**Recommended 6-panel screenshots:**

1. **Form Builder:** `docs/sin-rfp/review-plans/evidence/2026-01-10/screenshots/DM-AGG-001/01-form-builder-selected.png`
   - Caption: "Admins configure what data is collected without code"
2. **Reporting Cycle:** `docs/sin-rfp/review-plans/evidence/2026-01-10/screenshots/RP-AGG-003/01-cycle-details.png`
   - Caption: "Reporting cycles create clear ownership and deadlines"
3. **Submission Review:** `docs/sin-rfp/review-plans/evidence/2026-01-10/screenshots/RP-AGG-003/05-review-panel.png`
   - Caption: "Built-in validation improves accuracy before warehousing"
4. **Import Wizard:** `docs/sin-rfp/review-plans/evidence/2026-01-10/screenshots/DM-AGG-006/02-mapping-applied.png`
   - Caption: "Import tools accelerate legacy migration with validation"
5. **Analytics Builder:** `docs/sin-rfp/review-plans/evidence/2026-01-10/screenshots/RP-AGG-005/03-bar-chart.png`
   - Caption: "Dashboards built in-platform with secure export"
6. **Audit Log:** `docs/sin-rfp/review-plans/evidence/2026-01-10/screenshots/SEC-AGG-004/04-hash-verified.png`
   - Caption: "Security and governance built-in with full audit trails"

### Page 2 (continued): Role Capabilities Panel

**Layout:** Add a compact role capabilities panel below the 6-panel proof grid:

```
+--------------------+---------------------+
| ADMIN CAPABILITIES | PSO CAPABILITIES    |
| - Configure forms  | - Submit reports    |
| - Manage orgs      | - Track status      |
| - Review audit     | - Export data       |
+--------------------+---------------------+
```

**Note:** Keep Solution Overview to 2 pages total. Role capabilities fit as a compact panel, not a full page. If more detail is needed, reference "See Section 4: Vendor Fit" for role descriptions.

---

## 7. Service Approach Sections (6 items)

### Template for Each Section (1-2 pages each)

**Layout:**

```
+------------------------------------------+
| H2: [Service Approach Item Name]         |
|                                          |
| [1 paragraph summary - what viaSport     |
| asked for, what Solstice delivers]       |
|                                          |
+--------------------+---------------------+
| 3-STEP METHOD      | EVIDENCE            |
|                    |                     |
| 1. [Step]          | [Screenshot]        |
| 2. [Step]          | Figure SA-X         |
| 3. [Step]          |                     |
|                    | Video: [Link]       |
+--------------------+---------------------+
|                                          |
| KEY DELIVERABLES TABLE                   |
| | Deliverable | Timing | Dependency |    |
| |-------------|--------|------------|    |
+------------------------------------------+
```

### 7.1 Data Submission and Reporting Web Portal

**Screenshots:**

- Hero: `docs/sin-rfp/review-plans/evidence/2026-01-10/screenshots/DM-AGG-001/01-form-builder-selected.png`
- **Caption:** "Form builder: create, version, preview, and publish reporting forms without code"

**Video:** `DM-AGG-001-form-submission-flow-FINAL.mp4`

### 7.2 Data Warehousing

**Screenshots:**

- Hero: `diagrams/high-level-system-architecture-v3.png`
- Secondary: `diagrams/multi-tenant-architecture-v3.png`

**No video** - architecture focus

### 7.3 Data Migration

**Screenshots:**

- Hero: `docs/sin-rfp/review-plans/evidence/2026-01-10/screenshots/DM-AGG-006/00-import-wizard.png`
- Step flow:
  1. `docs/sin-rfp/review-plans/evidence/2026-01-10/screenshots/DM-AGG-006/01-validation-errors.png`
  2. `docs/sin-rfp/review-plans/evidence/2026-01-10/screenshots/DM-AGG-006/02-mapping-applied.png`
  3. `docs/sin-rfp/review-plans/evidence/2026-01-10/screenshots/DM-AGG-006/04-import-complete.png`

**Video:** `DM-AGG-006-import-wizard-flow-FINAL.mp4`

### 7.4 Platform Design and Customization

**Screenshots:**

- Hero: `diagrams/security-architecture-v3.png`

### 7.5 Testing and Quality Assurance

**Evidence:**

- Performance metrics table (from evidence)
- Accessibility score box

### 7.6 Training and Onboarding

**Screenshots:**

- Help center screenshot (if available) or placeholder

---

## 8. System Requirements Sections

### 8.1 Compliance Crosswalk (1 page)

**Layout:** Full-width table with columns:

- Requirement ID
- Title
- Status (Confirmed/Implemented)
- Evidence Reference

### 8.2 Per-Requirement Template

**Layout for each requirement (half page each):**

```
+------------------------------------------+
| REQ ID: DM-AGG-001                        |
| Title: Data Collection & Submission       |
+--------------------+---------------------+
| REQUIREMENT TEXT   | EVIDENCE            |
| [Abbreviated]      |                     |
|                    | [Screenshot]        |
| HOW WE MEET IT     | Figure DM-1         |
| - Bullet 1         |                     |
| - Bullet 2         | Video: [Link]       |
| - Bullet 3         |                     |
|                    | Status: IMPLEMENTED |
+--------------------+---------------------+
```

### Screenshot Assignments by Requirement

#### Data Management (DM-AGG)

| Req ID     | Primary Screenshot                                                                                  | Video                                       |
| ---------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| DM-AGG-001 | `docs/sin-rfp/review-plans/evidence/2026-01-10/screenshots/DM-AGG-001/01-form-builder-selected.png` | `DM-AGG-001-form-submission-flow-FINAL.mp4` |
| DM-AGG-002 | `docs/sin-rfp/review-plans/evidence/2026-01-10/screenshots/DM-AGG-006/02-mapping-applied.png`       | -                                           |
| DM-AGG-003 | `docs/sin-rfp/review-plans/evidence/DM-AGG-003-org-admin-20251228-1953.png`                         | -                                           |
| DM-AGG-004 | `docs/sin-rfp/review-plans/evidence/DM-AGG-004-data-quality-20251228-1953.png`                      | -                                           |
| DM-AGG-005 | `docs/sin-rfp/review-plans/evidence/2025-12-29-privacy-retention-legal-hold.png`                    | -                                           |
| DM-AGG-006 | `docs/sin-rfp/review-plans/evidence/2026-01-10/screenshots/DM-AGG-006/04-import-complete.png`       | `DM-AGG-006-import-wizard-flow-FINAL.mp4`   |

#### Reporting (RP-AGG)

| Req ID     | Primary Screenshot                                                                              | Video                                          |
| ---------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| RP-AGG-001 | `docs/sin-rfp/review-plans/evidence/2026-01-10/screenshots/DM-AGG-006/01-validation-errors.png` | -                                              |
| RP-AGG-002 | `docs/sin-rfp/review-plans/evidence/2026-01-10/screenshots/RP-AGG-003/01-cycle-details.png`     | -                                              |
| RP-AGG-003 | `docs/sin-rfp/review-plans/evidence/2026-01-10/screenshots/RP-AGG-003/02b-task-assigned.png`    | `RP-AGG-003-reporting-workflow-flow-FINAL.mp4` |
| RP-AGG-004 | `docs/sin-rfp/review-plans/evidence/RP-AGG-004-reporting-admin-20251228-1953.png`               | -                                              |
| RP-AGG-005 | `docs/sin-rfp/review-plans/evidence/2026-01-10/screenshots/RP-AGG-005/03-bar-chart.png`         | `RP-AGG-005-analytics-export-flow-FINAL.mp4`   |

#### Security (SEC-AGG)

| Req ID      | Primary Screenshot                                                                                | Video                                           |
| ----------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| SEC-AGG-001 | `docs/sin-rfp/review-plans/evidence/2026-01-10/screenshots/SEC-AGG-001/02-mfa-totp-challenge.png` | `SEC-AGG-001-auth-mfa-login-flow-FINAL.mp4`     |
| SEC-AGG-002 | `docs/sin-rfp/review-plans/evidence/SEC-AGG-002-security-20251228-1953.png`                       | -                                               |
| SEC-AGG-003 | `docs/sin-rfp/review-plans/evidence/SEC-AGG-003-privacy-20251228-1953.png`                        | -                                               |
| SEC-AGG-004 | `docs/sin-rfp/review-plans/evidence/2026-01-10/screenshots/SEC-AGG-004/04-hash-verified.png`      | `SEC-AGG-004-audit-verification-flow-FINAL.mp4` |

#### Training & Onboarding (TO-AGG)

| Req ID     | Primary Screenshot                                                                | Video |
| ---------- | --------------------------------------------------------------------------------- | ----- |
| TO-AGG-001 | `docs/sin-rfp/review-plans/evidence/TO-AGG-001-templates-admin-20251228-1953.png` | -     |
| TO-AGG-002 | Need walkthrough screenshot (guided onboarding overlay)                           | -     |
| TO-AGG-003 | `docs/sin-rfp/review-plans/evidence/TO-AGG-003-help-center-20251228-1953.png`     | -     |

#### User Interface (UI-AGG)

| Req ID     | Primary Screenshot                                                              | Video |
| ---------- | ------------------------------------------------------------------------------- | ----- |
| UI-AGG-001 | `docs/sin-rfp/review-plans/evidence/UI-AGG-001-settings-20251228-1953.png`      | -     |
| UI-AGG-002 | `docs/sin-rfp/review-plans/evidence/UI-AGG-002-dashboard-20251228-1953.png`     | -     |
| UI-AGG-003 | `docs/sin-rfp/review-plans/evidence/UI-AGG-003-mobile-20251228-1953.png`        | -     |
| UI-AGG-004 | `docs/sin-rfp/review-plans/evidence/UI-AGG-004-notifications-20251228-1953.png` | -     |
| UI-AGG-005 | Need search/filter navigation screenshot                                        | -     |
| UI-AGG-006 | `docs/sin-rfp/review-plans/evidence/UI-AGG-006-support-admin-20251228-1953.png` | -     |
| UI-AGG-007 | viaSport-branded interface (any 3 screens showing consistent styling)           | -     |

---

## 9. Remaining Sections (Minimal Visuals)

### Capabilities and Experience (2 pages)

- 1 page per case study
- Logo or icon only, no headshots

### Commercial Model and Pricing (2 pages)

- Pricing table only
- No screenshots

### Project Plan, Timeline (2 pages)

- Horizontal timeline diagram
- Milestone table

### Appendices

- Appendix A: Demo Access (1 page)
- Appendix B: Evaluator Access Pack (1 page)
- Appendix C: Performance Evidence (1-2 pages with charts)
- Appendix D: Security Architecture (diagram + summary)
- Appendix E: Exit and Portability (1 page)
- Appendix F: Full Team Bios (2-3 pages)
- Appendix I: Evidence Pack (screenshot index)

---

## 10. Video Placement Summary

Each video is **featured** in exactly TWO places, and **listed** in the evidence index:

1. Executive Summary page 3 (video index) - featured
2. The single most relevant requirement section - featured
3. Appendix I (evidence index) - listed with all other evidence

| Video ID | File                                          | ES Page 3 | Primary Section |
| -------- | --------------------------------------------- | --------- | --------------- |
| V1       | SEC-AGG-001-auth-mfa-login-flow-FINAL.mp4     | Yes       | SEC-AGG-001     |
| V2       | DM-AGG-001-form-submission-flow-FINAL.mp4     | Yes       | DM-AGG-001      |
| V3       | DM-AGG-006-import-wizard-flow-FINAL.mp4       | Yes       | DM-AGG-006      |
| V4       | RP-AGG-003-reporting-workflow-flow-FINAL.mp4  | Yes       | RP-AGG-003      |
| V5       | RP-AGG-005-analytics-export-flow-FINAL.mp4    | Yes       | RP-AGG-005      |
| V6       | SEC-AGG-004-audit-verification-flow-FINAL.mp4 | Yes       | SEC-AGG-004     |

**Canonical Figure/Video ID System:**

| Prefix | Scope                            | Example           | Usage                                 |
| ------ | -------------------------------- | ----------------- | ------------------------------------- |
| `ES-`  | Executive Summary                | `ES-1`, `ES-2`    | Hero screenshots in exec summary only |
| `DM-`  | Data Management requirements     | `DM-1`, `DM-2`    | DM-AGG section evidence               |
| `RP-`  | Reporting requirements           | `RP-1`, `RP-2`    | RP-AGG section evidence               |
| `SEC-` | Security requirements            | `SEC-1`, `SEC-2`  | SEC-AGG section evidence              |
| `TO-`  | Training/Onboarding requirements | `TO-1`, `TO-2`    | TO-AGG section evidence               |
| `UI-`  | User Interface requirements      | `UI-1`, `UI-2`    | UI-AGG section evidence               |
| `SA-`  | Service Approach                 | `SA-1`, `SA-2`    | Service Approach section diagrams     |
| `V`    | Videos                           | `V1` through `V6` | Same numbering everywhere             |

**Rules:**

- Each figure has ONE canonical ID (no duplicates like `DM-1` and `Figure DM-1`)
- If the same screenshot appears in multiple sections, use ONE ID and reference it
- Videos use `V1`–`V6` everywhere (Executive Summary index + primary requirement section + evidence index)
- Example evidence reference: `Evidence: DM-1, V2`

**Anti-pattern to avoid:** Don't use `ES-1` in exec summary and then `DM-1` for the same screenshot in the requirement section. Pick one ID.

---

## 11. Missing Evidence (Action Items)

**Note:** Many requirements have existing evidence from the Dec 28 capture session. The table below lists ONLY items that still need fresh screenshots.

| Requirement | Missing Evidence | Description                            | Existing Alternative                           |
| ----------- | ---------------- | -------------------------------------- | ---------------------------------------------- |
| TO-AGG-002  | Walkthroughs     | Guided onboarding overlay              | None - feature may need scoping                |
| UI-AGG-005  | Search/filter    | Content navigation with search results | Could use analytics filter as partial evidence |

**Resolved:**
| UI-AGG-007 | Design consistency | ✅ viaSport branding implemented | Screenshots now show consistent brand styling across all SIN environments |

**Evidence Status Summary:**

- **Confirmed with evidence:** DM-AGG-001, DM-AGG-002, DM-AGG-003, DM-AGG-004, DM-AGG-005, DM-AGG-006, RP-AGG-001, RP-AGG-002, RP-AGG-003, RP-AGG-004, RP-AGG-005, SEC-AGG-001, SEC-AGG-002, SEC-AGG-003, SEC-AGG-004, TO-AGG-001, TO-AGG-003, UI-AGG-001, UI-AGG-002, UI-AGG-003, UI-AGG-004, UI-AGG-006, UI-AGG-007
- **Needs fresh capture or scoping:** TO-AGG-002, UI-AGG-005

---

## 12. Final Assembly Checklist

### Pre-Assembly (Do First)

- [ ] Lock the **Figure Registry** (`docs/sin-rfp/response/figure-registry.csv`)
- [ ] Lock video links + durations (measure final videos)
- [ ] Resolve TO-AGG-002 and UI-AGG-005 evidence (implement or scope)

### Document Assembly

- [ ] Create cover page with hero image
- [ ] Verify cover page contact box is complete (no separate cover letter)
- [ ] Build TOC with dot leaders and clickable links
- [ ] Layout Executive Summary with At a Glance table
- [ ] Insert video index on ES page 3 (with youtu.be links, no QR codes)
- [ ] Create Scoring Summary page (Section 3.1)
- [ ] Create Prototype Evaluation Guide with step screenshots
- [ ] Layout each Service Approach section with evidence callouts
- [ ] Build Compliance Crosswalk table
- [ ] Create per-requirement pages with screenshots
- [ ] Add Validate/Expected lines to every evidence box
- [ ] Insert diagrams in appropriate sections
- [ ] Compile appendices with introduction paragraphs

### Quality Checks

- [ ] Run link checker (broken youtu.be links, missing evidence files, wrong appendix refs)
- [ ] Add PDF bookmarks matching TOC structure
- [ ] Verify all internal hyperlinks work
- [ ] Test grayscale print (mint backgrounds readable?)
- [ ] Test PDF on Windows viewer (fonts embed correctly?)
- [ ] Consistency pass: figure IDs match registry, no duplicate screenshots

### Final Deliverables

- [ ] Generate final PDF
- [ ] Create Evaluator Quick-Reference PDF (1-page standalone)
- [ ] Create submission ZIP with:
  - [ ] Main proposal PDF
  - [ ] Evaluator Quick-Reference PDF
  - [ ] `/videos/` folder with MP4 files
  - [ ] `/evidence/` folder with screenshots
