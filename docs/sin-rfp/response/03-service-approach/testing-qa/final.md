# Service Approach: Testing and Quality Assurance

## QA Approach

### Testing Layers

| Layer                | Tool                     | Purpose                          | Frequency    |
| -------------------- | ------------------------ | -------------------------------- | ------------ |
| Unit and Integration | Vitest + Testing Library | Component and function testing   | Every commit |
| End-to-End           | Playwright               | Full user flow testing           | Every commit |
| Property-Based       | fast-check               | Access control, audit integrity  | Every commit |
| Performance          | Lighthouse, k6           | Load testing and Core Web Vitals | Pre-release  |
| Security             | Manual plus automated    | MFA, sessions, audit hash chain  | Pre-release  |

### Automated Testing

Automated tests run in CI and gate merges where applicable. Coverage focuses on core workflows: login, data submission, reporting, analytics, and access control.

### Performance Testing

Performance testing is conducted in sin-perf with production-scale data. Final validation runs will be executed before submission (TBD).

| Metric              | Value             | Target           | Status   |
| ------------------- | ----------------- | ---------------- | -------- |
| Data volume         | 20.1 million rows | Production scale | Achieved |
| p95 latency         | 250ms             | <500ms           | Pass     |
| p50 latency         | 130ms             | N/A              | Pass     |
| Concurrent users    | 15                | N/A              | Pass     |
| Server errors (5xx) | 0                 | 0                | Pass     |

Evidence: `docs/sin-rfp/review-plans/evidence/` (final run TBD).

### Core Web Vitals

Lighthouse results from the prototype are recorded in Appendix C. Final Lighthouse runs will be completed before submission (TBD).

### Security Testing

Security testing validates:

- MFA and password recovery
- Session expiry and step-up authentication
- Role-based access enforcement
- Audit log integrity and hash chain verification
- Account lockout and anomaly detection

Evidence includes `docs/sin-rfp/review-plans/evidence/SECURITY-LOCKOUT-sin-dev-20251231.md` and audit hash chain tests in `src/lib/audit/__tests__/audit-hash-chain.pbt.test.ts`.

### Defect Management

| Severity | Definition                             | Response Time |
| -------- | -------------------------------------- | ------------- |
| Critical | Security vulnerability, data loss risk | Immediate     |
| High     | Core functionality broken              | Same day      |
| Medium   | Non-critical functionality affected    | Within sprint |
| Low      | Cosmetic or minor UX issues            | Backlog       |

Defects are tracked in a shared system accessible to viaSport.

## User Acceptance Testing Strategy

### UAT Approach

User Acceptance Testing validates that the platform meets viaSport requirements from the user perspective.

| Element       | Approach                                      |
| ------------- | --------------------------------------------- |
| Environment   | sin-perf with production-like data            |
| Access        | Role-based test accounts for viaSport testers |
| Visibility    | Test scenarios mapped to requirement IDs      |
| Communication | Weekly demos and visible ticketing            |

### UAT Timeline

| Week   | Focus                                                   |
| ------ | ------------------------------------------------------- |
| Week 1 | Core workflows: login, navigation, data submission      |
| Week 2 | Reporting and analytics: dashboards, exports, queries   |
| Week 3 | Administration: user management, configuration, imports |
| Week 4 | Edge cases, regression testing, sign-off preparation    |

### Test Scenarios

| Category        | Example Scenarios                                   |
| --------------- | --------------------------------------------------- |
| Data Management | Submit form, upload file, run import, validate data |
| Reporting       | Track submission status, run analytics, export data |
| Security        | Login with MFA, verify access, review audit log     |
| Training        | Complete walkthrough, search help center            |
| UI              | Navigate dashboard, receive notification            |

### Sign-Off Criteria

UAT sign-off requires:

1. All critical and high severity defects resolved
2. Test scenarios executed with documented results
3. No blocking issues for go-live
4. Written sign-off from viaSport project sponsor

After UAT sign-off, the platform is promoted to production and monitoring is enabled.
