# RFP Visual Layout Plan (Kyle and GridMatrix Proof-First Style)

This plan is designed to mirror the GridMatrix PDF structure and Kyle's proof-first pattern, while using the evidence assets already in the repo.

Core model to copy:

1. Plain-language claim (short, confident)
2. Proof immediately (screenshot or triptych)
3. Confirmation (short bullets, evidence references)

The reader should feel like they are scoring evidence, not reading a proposal.

---

## 1) Global layout system

### 1.1 Page grid and typography

- Page size: US Letter.
- Margins: 0.8 in top, 0.75 in bottom, 0.8 in left, 0.8 in right.
- Body text: 10.5 to 11 pt, single column.
- Headings:
  - H1: 20 to 22 pt, bold, numbered (01, 02, 03).
  - H2: 14 to 16 pt, bold.
  - H3: 12 to 13 pt, bold.
- Tables: 9.5 to 10 pt with strong header row.

### 1.2 Header and footer pattern (GridMatrix style)

- Header left: `Solstice // January 2026 // Strength in Numbers RFP`.
- Header right: `Section Name // Page X`.
- Footer left: `Austin Wallace Tech`.
- Footer right: `viaSport SIN RFP Response`.

### 1.3 Visual system

- Palette: 1 primary color, 1 accent, grayscale.
- Use large labeled figures and simple captions.
- Each figure uses `Figure <Section>-<#>. <Short caption>`.
- Use thin border callouts labeled `Evidence` or `Proof`.

### 1.4 Evidence callout standard

Every requirement or major section uses an evidence callout:

- Title: `Evidence`.
- Include 1 screenshot and 1 video link if available.
- Always include file path reference, example:
  - `Evidence: docs/sin-rfp/review-plans/evidence/SEC-AGG-004-audit-20251228-1953.png`

---

## 2) Front matter layout

### 2.1 Cover page

- Title block with RFP name and submission date.
- 1 hero image centered or faint background.
- Recommended image: `docs/sin-rfp/review-plans/evidence/UI-AGG-002-dashboard-20251228-1953.png`.
- Keep the layout minimal, similar to the GridMatrix cover page.

### 2.2 Cover letter (1 page)

- Short paragraphs, local tone, direct claims.
- Right aligned contact box.

### 2.3 Authorized contacts (1 page)

- Clean list, no visuals.

### 2.4 Table of contents

- Dot leaders and page numbers, one page if possible.

---

## 3) Executive Summary (max 3 pages)

### Page 1

- Kyle narrative, trimmed to RFP language.
- One hero screenshot, full width:
  - `docs/sin-rfp/response/evidence-pack/01-prototype-dashboard.png`
- Caption example:
  - `Figure ES-1. Role-based dashboards show progress, tasks, and follow-ups.`

### Page 2

- Purpose alignment, bullet-by-bullet ("You asked for X, we provide X").
- 1 proof image:
  - Import wizard error summary: `docs/sin-rfp/response/evidence-pack/03-import-wizard-validation.png`
- Caption:
  - `Figure ES-2. Migration readiness: imports validate structure and data quality before load.`

### Page 3

- How to evaluate in 15 minutes + video index.
- 1 proof image:
  - Audit integrity: `docs/sin-rfp/response/evidence-pack/02-audit-log-integrity.png`
- Caption:
  - `Figure ES-3. Tamper-evident auditing with verification and export flags.`

---

## 4) Evaluator Navigation Map (1 page)

- Table columns: RFP criterion, section title, evidence.
- Add a third column for evidence references (Figure and Video IDs).
- Use exact header titles, no internal folder names.

---

## 5) Solution Overview (2 to 3 pages)

### Layout

- Short narrative (6 to 10 lines) then proof grid.
- 6 panel grid (like GridMatrix intersection grid).

### Recommended panel set

- Form Builder: `docs/sin-rfp/review-plans/evidence/DM-AGG-001-form-builder-20251228-1953.png`
- Reporting Cycle: `docs/sin-rfp/review-plans/evidence/RP-AGG-003-reporting-20251228-1953.png`
- Submission Review: `docs/sin-rfp/review-plans/evidence/DM-AGG-004-data-quality-20251228-1953.png`
- Import Wizard: `docs/sin-rfp/review-plans/evidence/DM-AGG-006-imports-20251228-1953.png`
- Analytics Builder: `docs/sin-rfp/review-plans/evidence/RP-AGG-005-analytics-admin-20251228-1953.png`
- Audit Log: `docs/sin-rfp/review-plans/evidence/SEC-AGG-004-audit-20251228-1953.png`

---

## 6) Service Approach (6 sections, each with proof-first layout)

### Standard section template

1. 4 to 7 lines of plain language.
2. 1 hero screenshot or a 3 step strip.
3. 6 to 8 bullets describing how it works.
4. 2 to 3 bullets for implementation notes.
5. Evidence callout with figure and video.

### 6.1 Data Submission and Reporting Web Portal

- Hero: `docs/sin-rfp/review-plans/evidence/2026-01-08/screenshots/DM-AGG-001/06-sinuat-forms-list.png`
- Triptych:
  - `01-form-builder-fields.png`
  - `02-form-published-success.png`
  - `07-sinuat-form-submission.png`
- Video: `docs/sin-rfp/review-plans/evidence/2026-01-10/videos/DM-AGG-001-form-submission-flow-FINAL.mp4`

### 6.2 Data Warehousing

- Hero: `docs/sin-rfp/response/08-appendices/diagrams/high-level-system-architecture-v3.png`
- Secondary: `docs/sin-rfp/response/08-appendices/diagrams/multi-tenant-architecture-v3.png`

### 6.3 Data Migration

- Hero: `docs/sin-rfp/review-plans/evidence/2026-01-08/screenshots/DM-AGG-006/02-import-error-list.png`
- Triptych:
  - `01-import-upload-errors.png`
  - `03-import-field-mapping.png`
  - `05-sinuat-imports-list.png`
- Video: `docs/sin-rfp/review-plans/evidence/2026-01-10/videos/DM-AGG-006-import-wizard-flow-FINAL.mp4`

### 6.4 Platform Design and Customization

- Hero: `docs/sin-rfp/response/08-appendices/diagrams/security-architecture-v3.png`

### 6.5 Testing and Quality Assurance

- Evidence excerpt:
  - `docs/sin-rfp/review-plans/evidence/PERF-WORKLOG-2026-01-08.md`
  - `docs/sin-rfp/review-plans/evidence/a11y-scan-20251231.json`
- Present as small side callouts, not full pages.

### 6.6 Training and Onboarding

- Hero: `docs/sin-rfp/review-plans/evidence/TO-AGG-003-help-center-20251228-1953.png`
- Secondary: `docs/sin-rfp/review-plans/evidence/TO-AGG-001-templates-20251228-1953.png`

---

## 7) System Requirements Compliance Crosswalk

### Layout

- One full-width table.
- Columns: Requirement ID, Requirement, Status, Evidence.
- Status uses consistent wording:
  - Confirmed
  - Confirmed (configuration)
  - Confirmed (migration dependent)

---

## 8) Requirement sections (proof sections)

Each requirement uses:

- Short requirement restatement.
- Status line.
- 2 to 4 bullets describing how Solstice meets it.
- Evidence block with figure and video.

### Example placements

#### DM-AGG-001

- `docs/sin-rfp/review-plans/evidence/2026-01-08/screenshots/DM-AGG-001/01-form-builder-fields.png`
- Video: DM-AGG-001 form submission flow

#### RP-AGG-003

- `docs/sin-rfp/review-plans/evidence/2026-01-08/screenshots/RP-AGG-003/05-sinuat-reporting-tasks.png`
- Video: RP-AGG-003 reporting workflow flow

#### RP-AGG-005

- `docs/sin-rfp/review-plans/evidence/2026-01-08/screenshots/RP-AGG-005/01-pivot-table-view.png`
- Video: RP-AGG-005 analytics export flow

#### SEC-AGG-001

- `docs/sin-rfp/review-plans/evidence/2026-01-08/screenshots/SEC-AGG-001/08-sinuat-mfa-challenge.png`
- Video: SEC-AGG-001 auth and MFA login flow

#### SEC-AGG-004

- `docs/sin-rfp/review-plans/evidence/2026-01-08/screenshots/SEC-AGG-004/02-hash-chain-verification.png`
- Video: SEC-AGG-004 audit verification flow

#### UI-AGG-006

- `docs/sin-rfp/review-plans/evidence/UI-AGG-006-support-20251228-1953.png`
- `docs/sin-rfp/review-plans/evidence/UI-AGG-006-support-admin-20251228-1953.png`

---

## 9) Video evidence index

Provide a half-page index used in two places: Exec Summary page 3 and Appendix.

Label examples:

- Video 1: Form builder to submission to approval (DM-AGG-001, RP-AGG-003)
- Video 2: Reporting cycle setup and reminders (RP-AGG-003)
- Video 3: Audit log integrity and export (SEC-AGG-004)
- Video 4: Analytics builder and export (RP-AGG-005)
- Video 5: Import wizard and migration flow (DM-AGG-006)
- Video 6: Login, MFA, session control (SEC-AGG-001)

---

## 10) Diagrams and appendix placement

Keep diagrams in appendices, reference them where anxiety peaks:

- Multi-tenant diagram: Data Warehousing and Security sections.
- Security architecture: Security section and Assumptions.
- High-level architecture: Platform Design and Customization.
- Data flow diagram: Data Migration.

---

## 11) Packaging

- Submission zip includes:
  - Main PDF
  - Evidence folder with screenshots and videos
  - Evidence index
