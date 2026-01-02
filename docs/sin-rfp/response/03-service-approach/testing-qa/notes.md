# Context Notes - Service Approach - Testing and Quality Assurance

## RFP Prompts

- QA approach including performance and security testing.
- UAT approach and strategy.

## Evidence Targets

- Test plans, runbooks, or past test reports.
- UAT schedule and sign-off workflow.

## Sources

- docs/sin-rfp/source/VIASPORT-PROVIDED-viasport-sin-rfp.md
- docs/sin-rfp/source/initial-template-rfp-response.md
- docs/sin-rfp/source/DO-NOT-COMMIT-CONFIDENTIAL-example-rfp-real.txt
- docs/sin-rfp/review-plans/performance-testing-plan.md
- docs/sin-rfp/review-plans/performance-test-runbook.md
- docs/sin-rfp/review-plans/property-based-testing-plan.md
- docs/sin-rfp/review-plans/requirements-review-plan.md
- docs/sin-rfp/review-plans/requirements-verification-report-2025-12-28.md
- docs/sin-rfp/ux-review-findings.md
- CLAUDE.md

## Context Highlights (source-backed)

- QA approach includes multi-layer testing (unit/integration, E2E, property-based)
  and automated lint/type checks. (CLAUDE.md, docs/sin-rfp/review-plans/property-based-testing-plan.md)
- Performance testing plan covers Lighthouse metrics, API latency profiling, and
  k6 load testing against a dedicated `sin-perf` stage. (docs/sin-rfp/review-plans/performance-testing-plan.md)
- Performance runbook describes provisioning `sin-perf`, seeding data, generating
  20M synthetic rows, and running test suites. (docs/sin-rfp/review-plans/performance-test-runbook.md)
- Requirements review plan defines verification methodology, evidence standards,
  and acceptance criteria tracking. (docs/sin-rfp/review-plans/requirements-review-plan.md)
- Requirements verification report documents current compliance status and
  evidence captured via Playwright MCP. (docs/sin-rfp/review-plans/requirements-verification-report-2025-12-28.md)
- UX review findings document usability and responsive design checks across
  portal routes. (docs/sin-rfp/ux-review-findings.md)

## Draft Bullets for final.md (notes only)

### QA Approach (performance and security testing)

- Layered QA: unit/integration tests (Vitest + Testing Library), E2E tests
  (Playwright), and property-based tests for access control and audit integrity.
  (CLAUDE.md, docs/sin-rfp/review-plans/property-based-testing-plan.md)
- Performance testing plan covers Lighthouse CWVs, API latency, and k6 load
  testing on a dedicated `sin-perf` stage with synthetic data.
  (docs/sin-rfp/review-plans/performance-testing-plan.md,
  docs/sin-rfp/review-plans/performance-test-runbook.md)
- Security validation includes MFA flows, session policy, audit hash-chain
  verification, and anomaly detection checks documented in verification report.
  (docs/sin-rfp/review-plans/requirements-verification-report-2025-12-28.md)

### User Acceptance Testing Strategy

- UAT aligns to the requirements review plan: seeded sin-dev/perf environments,
  role-based test accounts, and evidence capture per requirement.
  (docs/sin-rfp/review-plans/requirements-review-plan.md)
- Acceptance evidence captured via Playwright MCP with screenshots and code/test
  references for evaluator review. (docs/sin-rfp/review-plans/requirements-verification-report-2025-12-28.md)
- UX review and accessibility checks supplement UAT with responsive and usability
  validation. (docs/sin-rfp/ux-review-findings.md)
