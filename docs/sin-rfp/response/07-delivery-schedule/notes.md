# Draft Notes - Project Plan, Timeline, and Delivery Schedule

## RFP prompts and evaluation criteria

- Timeline and delivery schedule is an explicit evaluation criterion. Source:
  `docs/sin-rfp/source/VIASPORT-PROVIDED-viasport-sin-rfp.md`.
- Section 6 template calls for timeline table, governance cadence, team roles, and
  risks/assumptions/dependencies. Source:
  `docs/sin-rfp/source/initial-template-rfp-response.md`.

## Timeline and milestones (phased delivery)

- Phased delivery plan (sequence + durations) and total timeline (17-24 weeks):
  `docs/sin-rfp/phase-0/phased-delivery-plan.md`.
- Phase 0: Architecture & Docs (1-2 weeks). Deliverables are already drafted:
  architecture reference, data residency, security controls, backup/DR plan, audit
  retention policy in `docs/sin-rfp/phase-0/*`.
- Phase 1: Foundation (4-6 weeks). Deliverables: org tenancy, immutable audit
  logging, notification engine. Source:
  `docs/sin-rfp/phase-0/phased-delivery-plan.md`.
- Phase 2: Security (3-4 weeks). Deliverables: MFA, security event monitoring and
  lockout, privacy compliance/DSAR. Source:
  `docs/sin-rfp/phase-0/phased-delivery-plan.md`.
- Phase 3: Core SIN features (6-8 weeks). Deliverables: dynamic forms, bulk
  import lanes, reporting cycles/workflows. Source:
  `docs/sin-rfp/phase-0/phased-delivery-plan.md`.
- Phase 4: Analytics & export (3-4 weeks). Deliverables: curated exports, saved
  reports, field-level access control. Source:
  `docs/sin-rfp/phase-0/phased-delivery-plan.md`.
- Critical path sequence (Lock Architecture -> Organization Tenancy -> Audit
  Logging -> Notifications -> Security Hardening -> Forms -> Reporting ->
  Analytics). Source:
  `docs/sin-rfp/requirements/tickets/SIN-IMPLEMENTATION-BACKLOG-V2.md`.
- Implementation progress snapshot (as of 2025-12-24): Phase 1-4 mostly complete
  with infra/E2E gaps noted. Use carefully if positioning timeline as
  "accelerated from current build." Source:
  `docs/sin-rfp/requirements/tickets/SIN-IMPLEMENTATION-BACKLOG-V2.md`.
- Gap-closure execution plan (if needed for near-term milestone framing):
  Product gaps -> Data + Evidence -> Compliance Evidence -> Re-Verification.
  Source: `docs/sin-rfp/review-plans/gap-closure-plan.md`.

## Governance and communications

- Decision log exists and can be referenced in governance cadence:
  `docs/sin-rfp/decisions/decision-register.md`.
- Stream status and blockers tracked in the master worklog (useful for status
  reporting structure): `docs/sin-rfp/worklogs/master.md`.
- Incident communications roles (operational comms reference): incident lead,
  security lead, viaSport notified per policy. Source:
  `docs/sin-rfp/phase-0/backup-dr-plan.md`.

## Project team and roles

- Template suggests core roles (PM, tech lead, data migration lead, security
  lead, UX lead). Source: `docs/sin-rfp/source/initial-template-rfp-response.md`.
- No named team roster or org chart found in repo (see concerns).

## Risks, assumptions, dependencies

- Stream dependency chain (A before C/H, etc) documented in worklog master:
  `docs/sin-rfp/worklogs/master.md`.
- Audit retention policy notes Object Lock + audit archive targeted for 2026-02
  (post-Phase 0, before production cutover). Source:
  `docs/sin-rfp/phase-0/audit-retention-policy.md`.
- Dual-portal considerations highlight scope creep risk and dependencies on
  payments and seeded data if ops modules are enabled. Source:
  `docs/sin-rfp/requirements/sin-dual-portal-considerations.md`.
- Gap-closure plan lists open items (retention automation, accessibility,
  notification delivery verification, analytics verification) that could affect
  schedule. Source: `docs/sin-rfp/review-plans/gap-closure-plan.md`.
