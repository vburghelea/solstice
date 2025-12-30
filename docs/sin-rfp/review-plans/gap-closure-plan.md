# SIN RFP Gap Closure Plan

**Date:** 2025-12-28  
**Owner:** Codex + Austin  
**Scope:** Address gaps from `docs/sin-rfp/review-plans/requirements-verification-report-2025-12-28.md`

## Priority Gaps (from report)

- P0: Password recovery flow (SEC-AGG-001, UI-AGG-001)
- P1: Legal holds + retention automation + backup/restore evidence (SEC-AGG-003, DM-AGG-005)
- P1: Import preview step + file field import support decision (DM-AGG-006)
- P1: Accessibility verification (UI-AGG-003)
- P2: Notifications/reminders delivery verification (RP-AGG-003, UI-AGG-004)
- P2: Analytics chart build/export verification with real data (RP-AGG-005)
- P2: Template seeding + contextual access validation (TO-AGG-001)
- P3: Global search + command palette (entity + actions) (UI-AGG-005)

---

## Immediate Work (I Can Do Now)

1. **Acceptance criteria checklist**
   - Create a per-gap checklist tied to evidence required (screenshots, tests, code refs).
2. **Implementation outlines**
   - Draft technical designs for password recovery, import preview, and legal hold flows.
3. **Seed data plan (no execution)**
   - Prepare a seed-data spec for sin-dev: orgs, forms, submissions, reporting tasks, templates, support requests.
4. **Verification playbook**
   - Draft MCP verification steps + evidence naming plan for every requirement.
5. **Accessibility plan**
   - Draft WCAG AA audit plan (pages to test, tooling, expected outputs).

---

## Items I Need From You

1. **Password recovery requirements**
   - Reset method (email-only vs email + SMS) <email only>
     - Impacts how we implement the reset flow, required providers, and UI scope. Email-only means a single secure link flow with no SMS dependency, plus rate limiting and anti-enumeration responses.
   - Token expiry (default proposal: 30-60 minutes) <60m>
     - Drives token TTL, cleanup strategy, and email copy. We will store hashed tokens, enforce single use, and invalidate on success; expiry should align with session step-up expectations.
   - Email sender/branding details and copy preferences <make it up for now>
     - Determines sender identity, reply-to routing, and default subject/body. We can start with a viaSport-branded sender and a generic reset message, then swap with final copy later.
2. **Legal hold + retention**
   - Confirm scope (records, users, organizations) and required hold actions <make something up that's configurable so that the client can change it later>
     - We will design a configurable hold policy that can be applied to users, orgs, or specific records, with reason, start/end, and optional expiration; purge jobs must honor the holds and every change should be audit-logged.
   - Confirm target archival approach (Glacier/Object Lock timing)
     - Impacts infrastructure and evidence: lifecycle rules, Object Lock mode/retention window, and whether we must show proof before launch.
   - Approval to document DR drill evidence (when and where) <approved: option 2 - sin-dev technical drill>
     - We will run a sin-dev restore drill using synthetic/seeded data, then capture logs + screenshots + runbook updates. Evidence will live in `docs/sin-rfp/phase-0/backup-restore-test-results.md` with screenshots in `docs/sin-rfp/review-plans/evidence/`.
3. **Import behavior**
   - Decide if file fields must be supported in imports <no>
     - If required, we need an upload mapping workflow and storage handling; otherwise we keep the current validation block.
   - Confirm whether a preview step is mandatory (recommended) <yes>
     - Decision: preview is mandatory before execution. Preview will show mapping summary, row counts, validation errors, and sample rows for confirmation.
4. **Reporting metadata**
   - Provide required metadata fields (fiscal periods, agreements, NCCP, etc) <confirmed defaults: configurable baseline>
     - Baseline fields (configurable): fiscalYearStart, fiscalYearEnd, reportingPeriodStart, reportingPeriodEnd, agreementId, agreementName, agreementStart, agreementEnd, nccpStatus, nccpNumber, primaryContactName, primaryContactEmail, primaryContactPhone, reportingFrequency.
     - Implementation will support a structured baseline plus optional metadata JSON for client-specific additions.
5. **Accessibility standard**
   - Confirm WCAG version and level (proposal: WCAG 2.1 AA) <yes>
     - Sets the audit baseline and acceptance criteria; determines whether we run automated tests only or add manual review steps.
6. **Seed data approval**
   - Permission to run seed scripts against sin-dev and define dataset shape <yes, and also consider improving the seed scripts, or the meta structure around them>
     - We need representative data to verify reporting, analytics, imports, and support workflows; this changes sin-dev state.
7. **Global search requirement**
   - Confirm whether cross-module search is required or out of scope <approved: basic global search + Cmd+K + actions>
     - Decision: implement a basic cross-module search with a Command Palette (Cmd/Ctrl+K). Use Enter to open a full search page with filters and richer results. Scope includes key entities (orgs, forms, submissions, reporting tasks, templates, help content), respecting org/role access.
     - The Cmd/Ctrl+K palette will show both entity results and action commands (example actions: register for team, file report). Actions will be permission-gated and may require step-up auth for sensitive operations.
     - Presentation rule: the first N results are actions, then a visual divider, then the next N results are objects. N should be configurable (default: 5 actions + 8 objects).
     - Implementation detail: entity results come from a unified search endpoint with server-side filtering by role/org. The full search page will provide filters by entity type and organization context.

---

## Execution Plan (After Inputs)

### Phase 1: Product Gaps (P0/P1)

1. Implement password recovery flow (UI + server + email).
2. Add import preview UI and confirm file field import support.
3. Add legal-hold controls and retention automation hooks.

### Phase 2: Data + Evidence

1. Seed sin-dev with representative data.
2. Run data catalog sync and data quality checks.
3. Trigger reporting reminders and verify email/in-app notifications.

### Phase 3: Compliance Evidence

1. Run DR/restore drill and document RPO/RTO results.
2. Capture evidence of retention/archival configurations.
3. Run WCAG audit and document results.

### Phase 4: Re-Verification

1. Re-run MCP verification for all partial items.
2. Update `requirements-verification-report-2025-12-28.md`.
3. Update consolidated backlog with remaining gaps and owners.

---

## Deliverables

- Updated verification report with closed gaps and fresh evidence.
- Seed data notes and reproducible steps.
- DR/retention evidence artifacts.
- Accessibility audit results.
