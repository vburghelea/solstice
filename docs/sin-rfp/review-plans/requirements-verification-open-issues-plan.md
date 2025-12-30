# Requirements Verification Open Issues - Working Notes

Source report: docs/sin-rfp/review-plans/requirements-verification-report-2025-12-28.md

## Purpose

Capture open questions, best guesses, and a no-work-started plan to close the remaining gaps in the SIN RFP requirements verification report. This is a working doc for decisions and next steps.

## Open Questions and Options

### External integrations (DM-AGG-002)

Question: Are any specific external platforms in scope for data exchange?
Best guess: No external integrations are required for the initial release.
Option A: Mark out of scope for phase 1.
Pros: Avoids scope creep, faster closure.
Cons: Requirement remains partial without future plan.
Option B: Implement a minimal outbound export or API stub.
Pros: Improves compliance posture with minimal scope.
Cons: May not satisfy real integration needs.
Decision: No decision, want your thoughts on: They want both import and export. I think exporting everything to csv would be good. I think let's choose a well known common thing we could need to import from and build that as a proof of concept. It says to integrate with external platforms via api, does that mean building our own api, or being able to consume within the platform from another api?

### Multi-file uploads (DM-AGG-001, RP-AGG-004)

Question: Should a single form field accept multiple files?
Best guess: Not required; forms use single-file per field.
Option A: Keep single-file support.
Pros: Simpler validation/storage, lower security risk.
Cons: Potential mismatch if multi-file was expected.
Option B: Add multi-file support.
Pros: Stronger compliance coverage.
Cons: Extra UI, storage, and validation work.
Decision: Let's do single file for now, but note it as a future work item.

### Admin database query interface (DM-AGG-003)

Question: Do admins need a secure query tool in-product?
Best guess: No; data catalog + exports cover the need.
Option A: Keep out of product and document rationale.
Pros: Lower risk and scope.
Cons: Requirement remains partial.
Option B: Add read-only query console with audit logging.
Pros: Stronger compliance.
Cons: Security review and scoping risk.
Decision: What would this interface look like within our project?

### Fiscal periods, agreements, NCCP metadata (RP-AGG-002)

Question: Which fields are required, and where should they live?
Best guess: Required fields should be modeled on org profile.
Option A: Extend org profile schema/UI.
Pros: Centralized metadata management.
Cons: More complex validation/migrations.
Option B: Create a reporting metadata module.
Pros: Scoped to reporting use cases.
Cons: New surface area to maintain.
Decision: Can you describe the two options in more detail in terms of ux and how they would fit in our architectuer

### Self-service org registration (SEC-AGG-001)

Question: Is self-service org creation required?
Best guess: Admin-only is acceptable.
Option A: Keep admin-only with documentation.
Pros: Controlled onboarding.
Cons: Requirement may stay partial.
Option B: Add self-serve with approval workflow.
Pros: Better compliance posture.
Cons: More abuse mitigation work.
Decision: Let's do option a, i believe this complies with requirements.

### Guided walkthroughs (TO-AGG-002)

Question: Are interactive tours required or are checklists enough?
Best guess: Checklists are acceptable.
Option A: Keep checklist-based walkthroughs.
Pros: Fast, low risk.
Cons: Weaker interpretation of "guided".
Option B: Add guided overlays and in-context tours.
Pros: Stronger compliance.
Cons: Larger UX/dev effort.
Decision: Guided overlays and in context tours

### Global search (UI-AGG-005)

Question: Is cross-module search required?
Best guess: No, module-level search is sufficient.
Option A: Document as out of scope.
Pros: Minimal effort.
Cons: Requirement remains partial.
Option B: Implement global search with permissions.
Pros: Better compliance and UX.
Cons: Indexing and permissions complexity.
Decision: We decided on a cmd-k command pallette with n actions and n objects.

### File delete/replace on submissions (RP-AGG-004)

Question: Do users/admins need to delete or replace uploaded files?
Best guess: Admin delete/replace is required.
Option A: Add delete/replace controls with audit.
Pros: Meets CRUD expectations.
Cons: Retention and audit complexity.
Option B: Keep download-only behavior.
Pros: Lower risk.
Cons: Requirement remains partial.
Decision: delete

### Transformation log viewer (DM-AGG-002)

Question: Should import transformation logs be visible in UI?
Best guess: Audit logs are sufficient.
Option A: Add admin UI viewer.
Pros: Operational traceability.
Cons: More UI and data work.
Option B: Keep in audit/logs only.
Pros: Minimal scope.
Cons: Limited visibility for admins.
Decision: b is fine for now but put it down as a possible future thing

### Retention automation and legal-hold enforcement (SEC-AGG-003)

Question: Is scheduled purge enforcement required before go-live?
Best guess: Yes, before production cutover.
Option A: Implement scheduled jobs + evidence.
Pros: Strong compliance.
Cons: Ops complexity.
Option B: Document manual process short-term.
Pros: Faster.
Cons: Weaker compliance posture.
Decision: a

### Backup/DR drill evidence (DM-AGG-005)

Question: Should evidence come from sin-dev, staging, or production?
Best guess: Staging or sin-dev drill is acceptable initially.
Option A: Stage/sin-dev drill.
Pros: Safe, faster.
Cons: Not production-proof.
Option B: Production drill.
Pros: Strongest evidence.
Cons: Risk and approvals required.
Decision: sin dev

### Accessibility audit scope (UI-AGG-003)

Question: What WCAG level and tooling are required?
Best guess: WCAG 2.1 AA with axe + manual spot checks.
Option A: Automated scan only.
Pros: Fast.
Cons: Incomplete coverage.
Option B: Automated + manual audit.
Pros: Stronger compliance.
Cons: More effort.
Decision: a

### Notification verification (UI-AGG-004, RP-AGG-003)

Question: Is real email delivery required in sin-dev or are logs acceptable?
Best guess: At least one real delivery test is expected.
Option A: Verify via logs only.
Pros: Easy.
Cons: Weaker evidence.
Option B: Send real email + capture evidence.
Pros: Strong compliance evidence.
Cons: Setup time.
Decision: b

### Seeding sources (cross-cutting)

Question: Do we have canonical seed data for forms, templates, reporting tasks, analytics datasets, and support requests?
Best guess: No, we will define minimal fixtures.
Decision: no, we will need to define minimal fixtures and also a way to generate large amounts of synthetic data for the perf test

## Ready to Start Without Asking

- Compile a precise open-issues tracker from the report with owners, dependencies, and evidence needed.
- Draft a sin-dev seeding checklist and minimal dataset spec per module.
- Draft a verification runbook for MCP evidence capture per open item.
- Draft evidence templates for DR/retention drills and accessibility audit results.
- Map likely code touchpoints/tests to each gap for rapid execution after decisions.

## Proposed Plan (Not Started)

1. Enumerate open gaps and confirm scope/decisions (external integrations, multi-file uploads, admin DB query access, fiscal/NCCP metadata, self-service org registration, interactive walkthroughs, global search).
2. Define a sin-dev seeding checklist to cover missing datasets (forms/submissions, reporting tasks, templates, data catalog entries, analytics datasets, support requests, notifications) and identify owners for seeding.
3. Map verification runs needed once data exists (user submission edit flow, reminders/email delivery, analytics chart build/export, template download, support response loop, security lockouts, audit export, data quality run).
4. List implementation tasks for true feature gaps (file delete/replace for uploads, transformation log viewer, retention purge automation/legal-hold enforcement, metadata UI fields, accessibility audit/remediation) and size them.
5. Outline evidence capture and documentation updates (screenshots/logs, DR restore drill evidence, retention automation evidence) and update the report/gap summary after completion.

## Decision Log (Fill In)

| Topic                         | Decision | Date | Notes |
| ----------------------------- | -------- | ---- | ----- |
| External integrations         |          |      |       |
| Multi-file uploads            |          |      |       |
| Admin DB query interface      |          |      |       |
| Fiscal/NCCP metadata          |          |      |       |
| Self-service org registration |          |      |       |
| Guided walkthroughs           |          |      |       |
| Global search                 |          |      |       |
| File delete/replace           |          |      |       |
| Transformation log viewer     |          |      |       |
| Retention automation          |          |      |       |
| Backup/DR drill evidence      |          |      |       |
| Accessibility audit scope     |          |      |       |
| Notification verification     |          |      |       |
| Seeding sources               |          |      |       |
