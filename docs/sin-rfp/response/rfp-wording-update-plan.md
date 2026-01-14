# RFP Wording Update Plan (Kyle Tone, Proof-First)

This plan applies the GridMatrix style and the 5.2 pro feedback to wording throughout the response. It focuses on clarity, evaluator scoring, and alignment with the viaSport RFP.

---

## 1) Global tone rules

- Use short sentences and direct claims.
- Replace marketing adjectives with verifiable statements.
- Do not lead with technology stack. Lead with outcomes.
- Keep every paragraph tied to a scoring question:
  - Does it meet the requirement?
  - Can it be implemented on time?
  - Is it secure?
  - Will users adopt it?
  - Is cost clear?

---

## 2) Standard proof-first section template

Use this structure for every scope item and requirement:

1. Requirement or scope statement (one sentence).
2. Solstice delivers statement (one sentence).
3. Evidence line (Figure and Video references).
4. How it works (2 to 6 bullets).
5. Implementation notes (short, optional).

Example:

- Requirement: viaSport needs configurable submissions with validation.
- Solstice delivers configurable forms, file uploads, and validation rules.
- Evidence: Figure DM-1, Video 1.
- How it works: bullets.
- Implementation notes: short.

---

## 3) Executive Summary wording changes

Target file:

- `docs/sin-rfp/response/full-proposal-response-combined.md`

Edits to apply:

- Remove the second Executive Summary and all internal notes.
- Replace "perfect solution" with "strong fit" or "ready to deploy fit".
- Replace "league and event management" with "data collection, reporting, warehousing, analytics, and governance".
- Replace "out of the box" with "working baseline".
- Add one sentence that explicitly states the evaluation environment exists and implements all 25 requirements.
- Fix typos and naming consistency:
  - "viaSat" -> "viaSport".
  - "the its" -> "its".
  - Choose one company name and use it everywhere.

Suggested tightened opening (drop-in):
"viaSport is seeking a new foundational digital layer for Strength in Numbers. Austin Wallace Tech proposes Solstice, a managed information platform for secure data collection, reporting, analytics, and governance. Solstice is available today for evaluation and already implements the 25 System Requirements Addendum items, so the project focuses on rollout and adoption rather than foundational build work."

---

## 4) Navigation and cross-references

Target files:

- `docs/sin-rfp/response/01-executive-summary/final.md`
- `docs/sin-rfp/response/full-proposal-response-combined.md`

Edits:

- Replace all "See Section XX" references with exact header titles.
- In the navigation map, use header titles verbatim.

---

## 5) Requirement status phrasing

Apply everywhere requirements are listed:

- Status should be one of:
  - Confirmed
  - Confirmed (configuration)
  - Confirmed (migration dependent)

Add a short evidence line under each requirement:

- "Evidence: Figure DM-1, Video 5"

---

## 6) Security and privacy language

Target files:

- `docs/sin-rfp/response/02-vendor-fit/final.md`
- `docs/sin-rfp/response/04-system-requirements/security-sec-agg/final.md`
- `docs/sin-rfp/response/08-appendices/final.md`

Edits:

- Use standard residency wording from COMPREHENSIVE-UPDATE-GUIDE.md.
- Add shared responsibility statement and AWS Artifact wording.
- Ensure SEC-AGG-002 language matches actual monitoring tools.
- Avoid claims that all data never leaves Canada.

---

## 7) Data catalog definition

Target file:

- `docs/sin-rfp/response/04-system-requirements/data-management-dm-agg/final.md`

Add one clear sentence:

- "The data catalog is a searchable index of datasets, fields, and reporting metadata. It supports discovery and permissioned access. It is not a public data marketplace."

---

## 8) AI and automation wording

Target files:

- `docs/sin-rfp/response/05-capabilities-experience/final.md`
- `docs/sin-rfp/response/01-executive-summary/final.md`

Edits:

- Use "automation and AI where appropriate" language.
- Add a short responsible AI paragraph aligned to RFP criteria: transparency, privacy, bias mitigation, human review.
- Avoid claims of AI features unless evidence exists.

---

## 9) Implementation and cutover language

Target files:

- `docs/sin-rfp/response/03-service-approach/data-migration/final.md`
- `docs/sin-rfp/response/07-delivery-schedule/final.md`

Add a short cutover subsection:

- Data freeze window
- Parallel run option
- Validation checklist
- Rollback criteria
- Hypercare period

---

## 10) Replace early stack deep dives

Target files:

- `docs/sin-rfp/response/03-service-approach/*`
- `docs/sin-rfp/response/02-vendor-fit/final.md`

Edits:

- Move long AWS service lists to appendices.
- In the main body, use outcome statements:
  - Canadian hosted, secure, scalable, managed service.

---

## 11) Formatting and clarity

Global edits:

- Remove double spaces.
- Avoid long paragraphs (keep to 3 to 5 lines).
- Use figure captions that answer "so what".
