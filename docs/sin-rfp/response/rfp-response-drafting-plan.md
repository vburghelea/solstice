# SIN RFP Response Drafting Plan

## Goals

- Produce a modular RFP response aligned to the viaSport RFP structure.
- Enable parallel drafting and evidence collection by section.
- Treat each section `final.md` as the source of truth until final assembly.
- Convert to `.docx` only after the full response is reviewed and approved.

## Inputs

- `docs/sin-rfp/source/VIASPORT-PROVIDED-viasport-sin-rfp.md` (RFP structure)
- `docs/sin-rfp/source/VIASPORT-PROVIDED-system-requirements-addendum.md`
- `docs/sin-rfp/requirements/SIN-REQUIREMENTS.md` (normalized requirements)
- `docs/sin-rfp/source/DO-NOT-COMMIT-CONFIDENTIAL-example-rfp-real.txt` (tone)
- `docs/sin-rfp/source/initial-template-rfp-response.md` (scaffold)

## Constraints and Decisions

- Follow the viaSport RFP section order and requested content only.
- No "intentionally blank" placeholders or example-specific numbering schemes.
- `final.md` files are the single source of truth per section.
- All claims must be supported by evidence or clearly labeled as planned.

## Drafting Workflow

- Start each section by extracting the relevant RFP prompts and requirements.
- Gather evidence (screenshots, exports, references) into the section's
  `evidence/` folder.
- Draft `final.md` using the scaffold for structure and the real example for
  tone (formal, confident, evaluator-friendly).
- Add citations to evidence locations and requirement IDs where applicable.
- Review pass per section: content accuracy, evidence coverage, tone alignment.

## Proposed Workspace Structure (Pending Confirmation)

Response root: `docs/sin-rfp/response/`

Section folders (ordered to match the RFP response):

- `01-executive-summary/`
- `02-vendor-fit/`
- `03-service-approach/`
  - `data-submission-reporting/`
  - `data-warehousing/`
  - `data-migration/`
  - `platform-design/`
  - `testing-qa/`
  - `training-onboarding/`
- `04-system-requirements/`
  - `data-management-dm-agg/`
  - `reporting-rp-agg/`
  - `security-sec-agg/`
  - `training-onboarding-to-agg/`
  - `user-interface-ui-agg/`
- `05-capabilities-experience/`
- `06-cost-value/`
- `07-delivery-schedule/`
- `08-appendices/`
- `manifest.md` (assembly order and checklist)

Each section folder includes:

- `final.md` (source of truth)
- `notes.md` (working notes)
- `example-copy.md` (tone reference snippets)
- `requirements.md` (only where requirements apply)
- `evidence/` (screenshots, CSVs, diagrams)

## Section Mapping to RFP

- Executive Summary: requested in RFP.
- Vendor Fit to viaSport's Needs: company details, solution statement, sector
  alignment.
- Service Approach and Responsiveness: scope items 1-6 with concerns and schedule
  alignment.
- System Requirements Compliance: requirement-by-requirement responses with
  evidence.
- Capabilities and Experience: success, partners, clients, case studies,
  automation/AI, responsible AI, open standards.
- Cost and Value of Services: pricing model, breakdown, change management, in-kind
  contributions.
- Delivery Schedule: timeline/milestones to support evaluation criteria.
- Appendices: evidence, diagrams, detailed matrices, supporting material.

## Requirements Matrix Format

Columns per requirement:

- Req ID
- Response (Comply / Configurable / Custom / Partial)
- How requirement is met
- Evidence (file path or appendix)
- Notes / assumptions

## Evidence Standards

- Evidence filename: `<REQID>-<topic>-YYYYMMDD-HHMM.<ext>`
- Reference evidence in `final.md` as inline paths.
- Prefer screenshots or exports from sin-dev when possible.

## Assembly

- Once all `final.md` sections are complete, assemble in `manifest.md` order.
- Produce a single Markdown master (name to be decided) for final review.
- Run a consistency pass for tone, terminology, and cross-references.

## Decisions Needed

- Confirm the proposed folder tree and section order.
- Confirm the name of the assembled master Markdown file.
