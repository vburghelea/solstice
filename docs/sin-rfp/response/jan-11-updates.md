# Jan 11 Updates — Harmonization and Fix Plan

This doc is the single source for fixes before the next draft. It includes the exact data to lock, the copy changes to make, and the open questions that need answers.

## Authoritative Performance & Test Data (use everywhere)

- Source: `docs/sin-rfp/response/jan-8-updates.md` / `docs/sin-rfp/review-plans/evidence/PERF-WORKLOG-2026-01-08.md`.
- Environment: sin-perf, 2026-01-08, db.t4g.large, 7.6 GB database.
- Data volume: 20.0M rows (audit_logs 10.0M, form_submissions 8.0M, notifications 2.0M). Say “20M rows” everywhere.
- Load test (k6, 25 VUs): p95 163ms, p50 98ms, throughput 12.3 req/s, 0 server errors (429s are expected rate limits).
- Lighthouse (sin-perf CloudFront): Perf 90/100, FCP 1.0s, LCP 1.0s, TTI 1.1s, CLS 0, A11y 100/100.
- DR exercise (use “exercise” not “drill”): RTO 16 min, RPO 0 min, 20M records validated.
- Use these numbers consistently in: Executive Summary “At a Glance”, QA/performance table, case studies, Appendix C narrative + table, System Requirements references, and any other p95/concurrency mentions. Remove all “final run TBD” text.

## Terminology/Naming Fixes

- Glossary and all expansions: BCAR = “BC Activity Reporter”; BCSI = “BC Sport Information System”.
- DR wording: use “DR exercise” everywhere (not “drill”).
- Replace “Built Today” phrasing with “Available in Prototype (Jan 2026)” to avoid ambiguity.

## SLA/Support Consistency

- Standardize on SLA table numbers: Sev 1 acknowledgement = 60 minutes, updates every 60 minutes until mitigation; business hours coverage unless 24/7 add-on is purchased.
- Training/Help Desk section currently lists 4-hour “Critical.” Change to align with Sev 1 = 60 minutes OR label that table as “standard questions (non-incident)” and keep Sev 1 governed by the SLA table. Make wording cohesive across Service Levels and Training sections.
- 24/7 add-on: keep “Sev 1 response target = 2 hours any time; Sev 2 after-hours coverage.”

## Executive Summary Structure

- Target ≤3 pages. Keep Executive Summary lean (overview, highlights, costs, timeline, residency/security summary). Move Prototype Evaluation Guide out of the Exec Summary flow; keep a one-line pointer to its dedicated section/appendix.

## Status Definitions (Crosswalk and narrative)

- Use these labels:
  - Built — Available in Prototype (Jan 2026): meets acceptance criteria and demonstrated.
  - Built — Pending viaSport configuration: meets acceptance criteria; needs viaSport field values/content/branding to finalize (e.g., templates, metadata, branding).
  - Partial — Acceptance criteria not fully met yet: only use where functionality does not yet meet acceptance criteria (not for optional integrations).
- Apply to DM-AGG-002/006, RP-AGG-002, DM-AGG-005 (mark as Built with Jan 2026 DR exercise), and any “Partial” that is actually just waiting on viaSport inputs.

## TBD Consolidation (current occurrences to remove/centralize)

- Performance runs TBD: Exec Summary Section 1.3 (line ~539), Testing section perf table (line ~981), Lighthouse TBD (line ~995), Appendix C text/table (line ~2974).
- DR/retention TBD: RPO/RTO rows (line ~788), DR/retention notes in DM-AGG-005 and crosswalk (lines ~1399, ~1465, ~1637).
- Retention durations TBD: lines ~809, ~883.
- Training/Planning TBDs: cohort sizing (line ~1113), training materials (line ~1155), content review (lines ~1426, ~2027, ~2055, ~2090, ~2120), branding assets (line ~2346), templates/metadata (lines ~1493, ~1758).
- Migration dependencies TBD: legacy extraction (lines ~1400, ~1466).
- Action: Create a single “Items to confirm with viaSport during Discovery” list (Discovery inputs) and replace scattered “TBD” with references to that list (e.g., “to be confirmed with viaSport during Discovery; see Discovery inputs”).

## Evidence Referencing (screenshots zip)

- Keep the file paths that will exist in the submission zip and reference them directly in the crosswalk for auditability. Example: `evidence/2026-01-10/screenshots/DM-AGG-001/01-form-builder-fields.png`.
- In the crosswalk “Evidence” cells, use a short, specific pointer (e.g., “Screenshot: evidence/2026-01-10/screenshots/DM-AGG-001/01-form-builder-fields.png; Prototype walkthrough step 3”).
- If the final deliverable is a PDF, we can hyperlink the paths; if not, keep the exact relative path so the reviewer can locate it in the zip. (Open: final submission format decision.)
- For requirements with multiple screenshots, number them in the folder and reference the primary 1–2 per requirement to avoid clutter.

## New Sections to Add

- **viaSport Fit and Sector Context** (6–10 lines in Exec Summary or Vendor Fit): highlight PSO reporting cycles/deadlines, resubmissions, delegated access, discovery/UAT with PSO reps, sector-friendly onboarding/templates.
- **In-Kind and Value-Add Contributions**: include prototype access + evaluator guide, 200 hrs/year enhancements, AI foundation, training artifacts/templates, and **event/league management module already built** that can be activated post-award. PSO users can create/run leagues/events; players use Solstice to register/participate; RBAC keeps information management views separate. Reference: `docs/PROJECT-AUDIT-SUMMARY.md`, `docs/quadball-plan/index.md`, `docs/plans/event-payments.md`, `docs/sin-rfp/requirements/sin-dual-portal-considerations.md`.
- **Pre-built implementation lets us polish UX**: emphasize that because core implementation is already built and viaSport targets Fall 2026 launch (with 2027 feature additions), we can spend the time between now and launch on UX iteration, content polish, and smooth rollout instead of rushing build at the end.

## File/Section-Specific Edits (full-proposal-response-combined.md)

- At a Glance + all performance mentions: replace with the authoritative metrics above; set concurrency to 25 users (k6 VUs), p95 163ms, p50 98ms, throughput 12.3 req/s, 20.0M rows.
- Case study results (Primary case study): change “≤250ms p95 latency” and “zero server errors under concurrent load” to “p95 163ms (25 concurrent users), zero server errors.”
- Testing/QA tables: replace perf rows with authoritative numbers; remove TBD language; align with Appendix C.
- Appendix C: replace narrative + tables with the authoritative metrics and DR exercise results; use “exercise.”
- Glossary: fix BCAR/BCSI expansions.
- Service Levels vs Training: align to 60-minute Sev 1 acknowledgement or clearly scope the Training table as non-incident inquiries.
- Crosswalk status/remaining columns: apply the status definitions above; change “Built Today” header to “Available in Prototype (Jan 2026)”; change “Partial” labels that are only waiting on viaSport inputs to “Built — Pending viaSport configuration.”
- DR wording: change all “DR drill” to “DR exercise.”

## Questions to Answer

1. Evidence linking: Should we hyperlink paths in the PDF, or keep plain text paths matching the submission zip? (depends on final submission format)
2. Event/league management value-add framing is set: already built and can be activated post-award; PSO users get leagues/events, players interact via Solstice, RBAC hides information management. (No tenant name mentioned.)

## Ready-to-apply Copy Blocks (templates)

- Discovery inputs block (for Exec Summary or Project Plan): “Items to confirm with viaSport during Discovery: BCAR/BCSI extraction method (DB access/CSV exports); launch templates and reporting metadata (contribution agreements, NCCP, fiscal periods, org profiles, delegated access, contacts); branding assets; retention durations and DR exercise cadence; training cohort schedule; threshold tuning recipients; final content review/terminology alignment.”
- Evidence cell pattern: “Evidence: evidence/2026-01-10/screenshots/DM-AGG-001/01-form-builder-fields.png; Prototype walkthrough step 3.”
- Value-add block: “In-Kind and Value-Add Contributions: Prototype access + evaluator guide (no cost); 200 hours/year enhancement capacity; AI foundation (Bedrock, structured output validation, quota enforcement); training templates and guides; Event/League Management module (registration, teams, scheduling, payments) already built for QC tenant and available to activate post-award.”
