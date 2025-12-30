# SIN RFP Gap Closure Plan

**Date:** 2025-12-28  
**Updated:** 2025-12-30  
**Owner:** Codex + Austin  
**Scope:** Address gaps from `docs/sin-rfp/review-plans/requirements-verification-report-2025-12-28.md`

## Priority Gaps (from report)

- P0: Password recovery flow (SEC-AGG-001, UI-AGG-001) (CLOSED 2025-12-30)
- P1: Legal holds + retention automation + backup/restore evidence (SEC-AGG-003, DM-AGG-005) (UI done; automation + evidence open)
- P1: Import preview step + file field import support decision (DM-AGG-006) (CLOSED 2025-12-30; file fields not supported)
- P1: Accessibility verification (UI-AGG-003) (open; automated scan planned)
- P2: Notifications/reminders delivery verification (RP-AGG-003, UI-AGG-004)
- P2: Analytics chart build/export verification with real data (RP-AGG-005)
- P2: Template seeding + contextual access validation (TO-AGG-001)
- P2: Guided walkthroughs with in-context tours (TO-AGG-002) (decision: implement)
- P2: Submission file delete/replace flow (RP-AGG-004) (decision: delete; scope TBD)
- P3: Global search + command palette (entity + actions) (UI-AGG-005) (decision confirmed; open)
- P3: External integrations/API PoC (DM-AGG-002) (target TBD)
- P3: Admin data explorer/DB query interface (DM-AGG-003) (decision pending)

---

## Immediate Work (I Can Do Now)

1. **Acceptance criteria checklist**
   - Create a per-gap checklist tied to evidence required (screenshots, tests, code refs).
2. **Implementation outlines**
   - Draft technical designs for retention automation, global search, guided tours, and submission file delete/replace.
3. **Seed data plan (no execution)**
   - Prepare a seed-data spec for sin-dev: orgs, forms, submissions, reporting tasks, templates, support requests.
4. **Verification playbook**
   - Draft MCP verification steps + evidence naming plan for every requirement.
5. **Accessibility plan**
   - Draft WCAG 2.1 AA audit plan with automated-only scope (manual follow-up optional).

---

## Decisions Captured (2025-12-30)

1. **Password recovery**: email-only reset, 60m token TTL, placeholder branding/copy. Status: completed 2025-12-30.
2. **Legal hold + retention**: configurable policy (scope by user/org/record), retention automation required, DR drill approved in sin-dev. Archival approach still TBD.
3. **Import behavior**: preview is mandatory; file fields are not supported.
4. **Reporting metadata**: baseline fields (configurable): fiscalYearStart, fiscalYearEnd, reportingPeriodStart, reportingPeriodEnd, agreementId, agreementName, agreementStart, agreementEnd, nccpStatus, nccpNumber, primaryContactName, primaryContactEmail, primaryContactPhone, reportingFrequency. Allow optional metadata JSON for client-specific additions.
5. **Accessibility**: WCAG 2.1 AA target; verification approach is automated-only for now (risk: may not fully substantiate AA).
6. **Seed data**: approved; improve seed scripts/meta structure and add synthetic data generation for perf testing.
7. **Global search**: Cmd/Ctrl+K palette with actions + objects; unified search endpoint; full search page with filters; permission-gated; configurable N actions and N objects.
8. **Guided walkthroughs**: in-context tours required.
9. **Multi-file uploads**: single-file only for now; log as future work item.
10. **Submission file handling**: delete required; clarify admin vs user scope.
11. **Transformation log viewer**: defer; audit logs sufficient for now.
12. **Notifications**: real email delivery test required; define sender/from and test recipients.
13. **External integrations**: baseline CSV/Excel import/export required; optional API integration PoC; target TBD.
14. **Admin data explorer**: decision pending; option is a read-only data explorer with audit logging.

---

## Execution Plan (After Inputs)

### Phase 1: Product Gaps (P1/P2)

1. Complete retention automation and legal-hold enforcement.
2. Implement global search command palette + unified search endpoint.
3. Implement guided walkthrough tours.
4. Add submission file delete/replace controls with audit/retention checks.

### Phase 2: Data + Evidence

1. Seed sin-dev with representative data.
2. Run data catalog sync and data quality checks.
3. Trigger reporting reminders and verify email/in-app notifications.

### Phase 3: Compliance Evidence

1. Run DR/restore drill in sin-dev and document RPO/RTO results.
2. Capture evidence of retention/archival configurations.
3. Run automated WCAG audit and document results (manual follow-up if required).

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
