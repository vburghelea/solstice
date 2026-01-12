# Service Approach: Testing and Quality Assurance

## QA Approach

### Testing Layers

| Layer                | Tooling (examples)                                        | Purpose                                  | Frequency                                      |
| :------------------- | :-------------------------------------------------------- | :--------------------------------------- | :--------------------------------------------- |
| Unit and Integration | Vitest \+ Testing Library                                 | Component and function testing           | Every commit                                   |
| End-to-End           | Playwright                                                | Full user flow testing                   | Every commit                                   |
| Property-Based       | fast-check                                                | Access control and audit integrity       | Every commit                                   |
| Performance          | Lighthouse, k6                                            | Load testing and Core Web Vitals         | Pre-release and before major reporting periods |
| Security (Automated) | SAST \+ SCA (for example CodeQL/Semgrep, Dependabot/Snyk) | Find code and dependency vulnerabilities | Every commit                                   |
| Security (Dynamic)   | DAST (for example OWASP ZAP)                              | Detect runtime web vulnerabilities       | Scheduled and pre-release                      |

### Automated Testing

Automated tests run in CI and gate merges where applicable. Coverage focuses on core workflows: login, data submission, reporting, analytics, and access control. There is also automated security testing, please see below for further details.

### Performance Testing

Performance testing is conducted in sin-perf with production-scale data. Final validation runs will be executed before submission (TBD).

| Metric              | Value             | Target           | Status   |
| :------------------ | :---------------- | :--------------- | :------- |
| Data volume         | 20.1 million rows | Production scale | Achieved |
| p95 latency         | 250ms             | \<500ms          | Pass     |
| p50 latency         | 130ms             | N/A              | Pass     |
| Concurrent users    | 15                | N/A              | Pass     |
| Server errors (5xx) | 0                 | 0                | Pass     |

Evidence is summarized in Section 1.3 (final run TBD).

### Core Web Vitals

Lighthouse results from the prototype are recorded as noted in Section 1.3. Final Lighthouse runs will be completed before submission (TBD).

### Security Testing

Security vulnerability scanning runs on every commit to identify issues early followed by scheduled and pre-release scans to identify run-time issues.

Security testing covers authentication, authorization, and audit integrity, plus application vulnerability testing.

**Automated security checks**

- SAST and dependency scanning run in CI on each change to identify common vulnerabilities early.
- DAST runs against a staging environment on a schedule and again prior to major releases.

**OWASP Top 10:2025 coverage**

Our security testing program maps to the OWASP Top 10 categories. The full mapping is provided in **Appendix J: OWASP Top 10:2025 Mapping**.

**Operational monitoring**

In production, application-level detection is combined with AWS monitoring and logging (CloudWatch/CloudTrail) to support detection, alerting, and incident response. High-severity security events (account lockouts, anomaly flags) emit CloudWatch metrics for alerting.

**Functional security testing validates:**

- MFA and password recovery
- Session expiry and step-up authentication
- Role-based access enforcement
- Audit log integrity and hash chain verification
- Account lockout and anomaly detection

Security evidence is summarized in Section 1.2.

### Defect Management

| Severity | Definition                             | Response Time |
| :------- | :------------------------------------- | :------------ |
| Critical | Security vulnerability, data loss risk | Immediate     |
| High     | Core functionality broken              | Same day      |
| Medium   | Non-critical functionality affected    | Within sprint |
| Low      | Cosmetic or minor UX issues            | Backlog       |

Defects are tracked in a shared system accessible to viaSport.

## User Acceptance Testing Strategy

### UAT Approach

User Acceptance Testing validates that the platform meets viaSport requirements from the user perspective.

| Element       | Approach                                         |
| :------------ | :----------------------------------------------- |
| Environment   | sin-uat for UAT; performance testing in sin-perf |
| Access        | Role-based test accounts for viaSport testers    |
| Visibility    | Test scenarios mapped to requirement IDs         |
| Communication | Weekly demos and visible ticketing               |

### UAT Timeline

| Week   | Focus                                                   |
| :----- | :------------------------------------------------------ |
| Week 1 | Core workflows: login, navigation, data submission      |
| Week 2 | Reporting and analytics: dashboards, exports, queries   |
| Week 3 | Administration: user management, configuration, imports |
| Week 4 | Edge cases, regression testing, sign-off preparation    |

### Test Scenarios

| Category        | Example Scenarios                                   |
| :-------------- | :-------------------------------------------------- |
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

---
