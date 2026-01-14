# RFP Section-by-Section Restructure Plan (Proof-First, Evaluator Aligned)

This plan integrates the GridMatrix proof-first layout and the 5.2 pro feedback. It is designed to reduce evaluator effort, make compliance obvious, and keep the doc scoring-friendly.

## Key position

I recommend breadth-first ordering for reviewers:

- Show the full set of evaluation criteria early in short, scannable sections.
- Then move into requirement-by-requirement proof pages.
- Deep technical detail belongs in appendices.

This is the opposite of depth-first narrative. Evaluators can score faster when every section yields immediate evidence.

---

## Proposed top-level order (final table of contents)

1. Cover Letter (1 page)
2. Executive Summary (2 to 3 pages)
3. Evaluator Navigation Map (1 page)
4. Solution Overview (non-technical, 2 to 3 pages)
5. Service Approach (6 scope items, proof-first)
6. System Requirements Compliance Crosswalk (1 page)
7. System Requirements: Data Management (DM-AGG)
8. System Requirements: Reporting (RP-AGG)
9. System Requirements: Security (SEC-AGG)
10. System Requirements: Training and Onboarding (TO-AGG)
11. System Requirements: User Interface (UI-AGG)
12. Capabilities and Experience
13. Cost and Value
14. Project Plan, Timeline, and Delivery Schedule
15. Appendices (diagrams, performance, security, evidence)

Optional:

- Add a short Assumptions and Exceptions page if viaSport expects it.

---

## Section-by-section changes

### 1) Executive Summary

Goals:

- Keep Kyle voice and cut any extra summary versions.
- Use RFP language, not product language.
- Proof appears on page 1 or 2.

Changes:

- Keep only the Kyle summary and remove the older summary.
- Replace "league and event management" with "data collection, reporting, warehousing, analytics, and governance".
- Add a 15 minute evaluation block with video index on page 3.
- Use 3 images max, each with a short caption.

### 2) Evaluator Navigation Map

Changes:

- Standalone 1 page after Executive Summary.
- Use exact header titles.
- Add an evidence column for figures and videos.

### 3) Solution Overview

Changes:

- Keep non-technical workflow summary with a screenshot grid.
- Avoid architecture or stack detail here.
- Use short captions to prove the whole system in one page.

### 4) Service Approach (6 scope items)

Changes:

- Use a consistent proof-first template for each item:
  - 4 to 7 lines of narrative.
  - 1 hero screenshot or 3 step strip.
  - Short bullets for how it works.
  - Implementation notes.
  - Evidence callout.
- Do not repeat requirement details here.
- Tech stack is summarized only, and deep detail goes to appendix.

### 5) System Requirements Compliance Crosswalk

Changes:

- Keep as a 1 page table.
- Add "Status" column with Confirmed wording.
- Add "Evidence" column referencing figures and videos.

### 6) Requirements sections (DM-AGG, RP-AGG, SEC-AGG, TO-AGG, UI-AGG)

Changes:

- Convert each requirement into a proof section:
  - Requirement restatement.
  - Status line.
  - 2 to 4 bullets.
  - Evidence callout (figure and video).

- Keep each requirement to 1 page where possible.
- Use triptych step visuals for workflows:
  - Form creation and submission.
  - Reporting cycle setup.
  - Import wizard.

### 7) Capabilities and Experience

Changes:

- Convert to case-study pages, one page per case study.
- Remove bios from this section.
- Add a short responsible AI paragraph with clear boundaries.

### 8) Cost and Value

Changes:

- 1 page pricing summary table.
- 1 page change management rules.
- Do not include technical detail here.

### 9) Project Plan, Timeline, and Delivery Schedule

Changes:

- Add a dedicated cutover and change management subsection.
- Use a simple timeline graphic plus a milestones table.

### 10) Appendices

Changes:

- Move all detailed technical content to appendices:
  - Architecture diagrams
  - Security model
  - Performance evidence
  - OWASP mapping
  - Full bios
  - Evidence pack index

---

## Duplication removal plan

- Executive Summary contains only a team table, not bios.
- Vendor Fit has role table but no full bios.
- Full bios live only in Appendix F.
- Security model is documented once in Appendix D, referenced elsewhere.
- Performance evidence is documented once in Appendix C, referenced elsewhere.
- Remove any repeated environment explanations, keep in one appendix.

---

## How this fits viaSport evaluation flow

- Evaluators see proof immediately.
- Each scope section has a single hero image or triptych.
- Requirements are scored quickly because each page includes status and evidence.
