# Service Approach: Testing and Quality Assurance

## QA Approach

### Testing Layers

The platform uses a multi-layer testing strategy to catch issues at different levels:

| Layer            | Tool                     | Purpose                                      | Frequency    |
| ---------------- | ------------------------ | -------------------------------------------- | ------------ |
| Unit/Integration | Vitest + Testing Library | Component and function testing               | Every commit |
| End-to-End       | Playwright               | Full user flow testing                       | Every commit |
| Property-Based   | Custom                   | Access control, audit integrity verification | Every commit |
| Performance      | Lighthouse, k6           | Load testing, Core Web Vitals                | Pre-release  |
| Security         | Manual + automated       | MFA, sessions, audit hash chain              | Pre-release  |

### Automated Testing

Automated tests run on commits and pull requests through the CI/CD pipeline. Merges are gated by passing tests where applicable.

**Test Coverage:**

- Unit tests for business logic and utility functions
- Integration tests for database operations and API endpoints
- End-to-end tests for critical user flows (login, data submission, reporting)
- Property-based tests for access control rules (verifying users cannot access data outside their organization)

### Performance Testing

Performance testing is conducted in the sin-perf environment with production-scale data.

**Load Test Results (latest run; date TBD):**

| Metric              | Value             | Target           | Status   |
| ------------------- | ----------------- | ---------------- | -------- |
| Data volume         | 20.1 million rows | Production scale | Achieved |
| p95 latency         | 250ms             | <500ms           | Pass     |
| p50 latency         | 130ms             | N/A              | Pass     |
| Concurrent users    | 15                | N/A              | Pass     |
| Server errors (5xx) | 0                 | 0                | Pass     |

**Data Distribution:**

| Table                    | Rows  |
| ------------------------ | ----- |
| form_submissions         | 10.0M |
| audit_logs               | 7.0M  |
| notifications            | 2.0M  |
| bi_query_log             | 1.0M  |
| form_submission_versions | 0.1M  |

The platform handles 20 million rows with sub-250ms response times and zero server errors under concurrent load.

**Core Web Vitals (Lighthouse, latest prototype run; date TBD):**

| Metric                   | Value  | Target  | Status |
| ------------------------ | ------ | ------- | ------ |
| Performance Score        | 93/100 | >80     | Pass   |
| Largest Contentful Paint | 2284ms | <2500ms | Pass   |
| Time to First Byte       | 380ms  | <500ms  | Pass   |
| Total Blocking Time      | 88ms   | <300ms  | Pass   |
| Cumulative Layout Shift  | 0      | <0.1    | Pass   |

### Security Testing

Security testing validates the platform's protection mechanisms:

| Area               | Testing Approach                                    |
| ------------------ | --------------------------------------------------- |
| Authentication     | MFA flow validation (TOTP, backup codes)            |
| Session management | Session expiry, concurrent session limits           |
| Access control     | Role-based access enforcement, organization scoping |
| Audit integrity    | Hash chain verification, tamper detection           |
| Anomaly detection  | Login pattern analysis, account lock triggers       |

Security testing is conducted before each release and after any changes to authentication or authorization logic.

### Defect Management

Defects discovered during testing are classified by severity:

| Severity | Definition                             | Response Time |
| -------- | -------------------------------------- | ------------- |
| Critical | Security vulnerability, data loss risk | Immediate     |
| High     | Core functionality broken              | Same day      |
| Medium   | Non-critical functionality affected    | Within sprint |
| Low      | Cosmetic or minor UX issues            | Backlog       |

Defects will be tracked in a shared ticketing system accessible to viaSport.

## User Acceptance Testing Strategy

### UAT Approach

User Acceptance Testing validates that the platform meets viaSport's requirements from the user's perspective. Our UAT approach emphasizes collaboration and early feedback:

| Element       | Approach                                                   |
| ------------- | ---------------------------------------------------------- |
| Environment   | Dedicated sin-perf environment with production-like data   |
| Access        | viaSport testers receive accounts with appropriate roles   |
| Visibility    | Test scenarios mapped to requirements, progress tracked    |
| Communication | Weekly demos, immediate platform access, visible ticketing |

### UAT Timeline

UAT is scheduled for 4 weeks during the implementation timeline:

| Week   | Focus                                                   |
| ------ | ------------------------------------------------------- |
| Week 1 | Core workflows: login, navigation, data submission      |
| Week 2 | Reporting and analytics: dashboards, exports, queries   |
| Week 3 | Administration: user management, configuration, imports |
| Week 4 | Edge cases, regression testing, sign-off preparation    |

### Test Scenarios

Test scenarios are structured around the System Requirements Addendum:

| Category                 | Example Scenarios                                                       |
| ------------------------ | ----------------------------------------------------------------------- |
| Data Management (DM-AGG) | Submit form, upload file, import CSV, validate data quality             |
| Reporting (RP-AGG)       | Track submission status, run analytics query, export data               |
| Security (SEC-AGG)       | Login with MFA, verify role-based access, review audit log              |
| Training (TO-AGG)        | Complete guided walkthrough, search help center, submit support request |
| User Interface (UI-AGG)  | Navigate dashboard, use command palette, receive notification           |

### Test Accounts

viaSport testers receive role-appropriate accounts:

| Role           | Access Level                 | Test Focus                                    |
| -------------- | ---------------------------- | --------------------------------------------- |
| viaSport Admin | Full platform access         | Administrative functions, cross-org analytics |
| PSO Admin      | Organization-scoped admin    | User management, reporting oversight          |
| PSO Reporter   | Organization-scoped reporter | Data submission, form completion              |
| Viewer         | Read-only                    | Dashboard viewing, report access              |

### Feedback Process

1. **Immediate access:** viaSport can use the platform at any time, not just during scheduled test sessions.
2. **Weekly demos:** Scheduled sessions to walk through new features and gather feedback.
3. **Visible ticketing:** All issues logged in a shared system where viaSport can see status and priority.
4. **Direct communication:** Questions and concerns addressed within one business day.

### Sign-Off Criteria

UAT sign-off requires:

1. All critical and high-severity defects resolved
2. All test scenarios executed with documented results
3. No blocking issues for go-live
4. Written sign-off from viaSport project sponsor

### Post-UAT

After UAT sign-off:

- Medium and low-severity defects addressed during viaSport Training phase
- Platform deployed to production
- Monitoring enabled for production issues
- Support process activated
