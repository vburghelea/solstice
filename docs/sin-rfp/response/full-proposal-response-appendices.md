# Appendices

## Appendix A: Live Demo Access

A working prototype is available for viaSport evaluation in a dedicated UAT environment. Credentials are listed below to reduce reviewer friction.

**Demo URL:** https://sin-uat.solstice.viasport.ca (or CloudFront URL TBD)

**Environment:** `sin-uat` (User Acceptance Testing environment with evaluator
access and CloudTrail monitoring)

### Data and Monitoring

- Synthetic data only, no confidential viaSport data
- Environment monitoring enabled (CloudTrail with CIS Benchmark alarms)
- Production-equivalent security controls
- Performance testing is executed in `sin-perf`

### Test Accounts

| Persona        | Email                      | Password        | Access Level                                      |
| -------------- | -------------------------- | --------------- | ------------------------------------------------- |
| viaSport Staff | viasport-staff@example.com | testpassword123 | viaSport admin with full org access (MFA enabled) |
| PSO Admin      | pso-admin@example.com      | testpassword123 | BC Hockey organization admin                      |
| Club Reporter  | club-reporter@example.com  | testpassword123 | North Shore Club reporter                         |
| Viewer         | member@example.com         | testpassword123 | View-only access                                  |

**Note:** MFA-enabled accounts use TOTP authentication. Other demo accounts have MFA disabled for faster evaluation.

### Suggested Demo Walkthrough

1. Login as viaSport Staff to see full admin capabilities
2. Explore the role-based dashboard
3. Create a test form using the form builder
4. Submit data using the form
5. View submission in the analytics platform
6. Build a pivot table and export to CSV
7. Review audit logs for recent actions
8. Security Dashboard: review recent security events and account lockouts (SEC-AGG-002)
9. Privacy and Retention: view retention policies and legal hold capabilities (SEC-AGG-003)
10. Explore help center and guided walkthroughs

## Appendix B: System Architecture

### High-Level Architecture

```
+---------------------------------------------------------------+
|                         AWS ca-central-1                      |
+---------------------------------------------------------------+
|                                                               |
|   +-----------+    +-----------+    +-----------+             |
|   | CloudFront| -> |  Lambda   | -> |    RDS    |             |
|   |    CDN    |    |  (App)    |    | PostgreSQL|             |
|   +-----------+    +-----------+    +-----------+             |
|        |                  |                 |                 |
|   +----+-----+      +-----+-----+     +-----+-----+           |
|   |    S3    |      |    SQS    |     |   Redis   |           |
|   | Storage  |      |  Queue    |     |  Cache    |           |
|   +----------+      +-----------+     +-----------+           |
|                                                               |
|   +-----------+    +------------+    +-----------+            |
|   |EventBridge|    | CloudWatch |    |    SES    |            |
|   | Scheduler |    | Monitoring |    |   Email   |            |
|   +-----------+    +------------+    +-----------+            |
|                                                               |
+---------------------------------------------------------------+
```

### Technology Stack

| Layer          | Technologies                                                 |
| -------------- | ------------------------------------------------------------ |
| Frontend       | React 19, TanStack Start, TypeScript, Radix UI, Tailwind CSS |
| Backend        | TanStack Start, Node.js, Drizzle ORM                         |
| Database       | PostgreSQL on AWS RDS                                        |
| Caching        | Redis for rate limiting, BI caching, permissions             |
| Infrastructure | SST, AWS Lambda, CloudFront, ECS Fargate                     |
| Authentication | Better Auth with TOTP MFA                                    |
| Monitoring     | AWS CloudWatch, CloudTrail                                   |

## Appendix C: Performance Evidence

Load testing was conducted in the sin-perf environment. Final validation runs will be completed before submission (TBD).

### Data Volume

| Table                    | Rows      |
| ------------------------ | --------- |
| form_submissions         | 10.0M     |
| audit_logs               | 7.0M      |
| notifications            | 2.0M      |
| bi_query_log             | 1.0M      |
| form_submission_versions | 0.1M      |
| **Total**                | **20.1M** |

### Performance Results

| Metric              | Value | Target | Status |
| ------------------- | ----- | ------ | ------ |
| p95 latency         | 250ms | <500ms | Pass   |
| p50 latency         | 130ms | N/A    | Pass   |
| Concurrent users    | 15    | N/A    | Pass   |
| Server errors (5xx) | 0     | 0      | Pass   |

### Lighthouse Scores

| Metric                   | Value  | Target  | Status |
| ------------------------ | ------ | ------- | ------ |
| Performance Score        | 93/100 | >80     | Pass   |
| Largest Contentful Paint | 2284ms | <2500ms | Pass   |
| Time to First Byte       | 380ms  | <500ms  | Pass   |
| Total Blocking Time      | 88ms   | <300ms  | Pass   |
| Cumulative Layout Shift  | 0      | <0.1    | Pass   |

## Appendix D: Security Architecture Summary

### Shared Responsibility Model

The security model follows the AWS shared responsibility approach: AWS secures the underlying cloud infrastructure, and we implement and operate the application controls, configuration, and monitoring required for viaSport's use case. AWS compliance reports (SOC, ISO) are available via AWS Artifact upon request.

### Data Residency

Primary data stores (RDS PostgreSQL, S3 object storage, backups, and audit archives) are hosted in AWS Canada (Central) (ca-central-1). Authenticated content is configured to avoid edge caching. Email notifications are delivered to recipients and may traverse external networks.

### Encryption

| Scope              | Standard                                       |
| ------------------ | ---------------------------------------------- |
| In Transit         | TLS 1.2+                                       |
| At Rest (Database) | AES-256 via AWS KMS                            |
| At Rest (Storage)  | AES-256 via AWS KMS                            |
| Secrets            | AWS Secrets Manager (SST-managed, deploy-time) |

### Authentication

| Feature                     | Implementation                           |
| --------------------------- | ---------------------------------------- |
| Multi-Factor Authentication | TOTP with backup codes                   |
| Password Requirements       | Configurable password policy             |
| Session Management          | Secure cookies, configurable expiry      |
| Account Lockout             | Automatic after failed attempt threshold |

### Authorization

| Feature                   | Implementation                            |
| ------------------------- | ----------------------------------------- |
| Role-Based Access Control | Owner, Admin, Reporter, Viewer roles      |
| Organization Scoping      | All queries scoped to user's organization |
| Field-Level Permissions   | Sensitive fields restricted by role       |
| Step-Up Authentication    | Required for admin actions and exports    |

### Audit Trail

| Feature      | Implementation                                                                                        |
| ------------ | ----------------------------------------------------------------------------------------------------- |
| Scope        | All user actions, data changes, auth events                                                           |
| Immutability | Hash chain verification: each entry hashes the previous, rendering the trail mathematically immutable |
| Retention    | Retention policies and legal holds (durations TBD)                                                    |

### Compliance

- PIPEDA aligned data handling practices
- AWS Data Processing Addendum (DPA) in place
- CloudTrail API audit logging with CIS Benchmark alarms (root usage, IAM changes, security group changes)

## Appendix E: User Personas

| Persona        | Portal Access             | Key Capabilities                                    |
| -------------- | ------------------------- | --------------------------------------------------- |
| viaSport Admin | Full platform             | Admin console, cross-org analytics, user management |
| PSO Admin      | Organization-scoped       | Reporting oversight, user invitations, analytics    |
| PSO Reporter   | Organization-scoped       | Form submission, file uploads, imports              |
| Viewer         | Read-only                 | Dashboard viewing, report access                    |
| Auditor        | Admin console (read-only) | Audit log access, compliance review                 |

## Appendix F: Team Biographies

### Austin Wallace, Project Lead and Solution Architect

Austin Wallace is the delivery lead and solution architect for Solstice. He
leads platform architecture, data migration strategy, and delivery governance.
He has 9+ years of enterprise data engineering experience and sport governance
leadership.

### Ruslan Hétu, UX and Accessibility Lead

[To be provided by Ruslan Hétu]

### Soleil Heaney, System Navigator

[To be provided by Soleil Heaney]

### Will Siddall, Technical Advisor

[To be provided by Will Siddall]

### Parul Kharub, Security and Risk Advisor

[To be provided by Parul Kharub]

### Michael Casinha, Security and Infrastructure Advisor

[To be provided by Michael Casinha]

### Tyler Piller, Security and Compliance Advisor

[To be provided by Tyler Piller]

## Appendix G: Glossary

| Term | Definition                                                      |
| ---- | --------------------------------------------------------------- |
| BCAR | British Columbia Activity Records, legacy system being replaced |
| BCSI | BC Sport Intelligence, legacy system being replaced             |
| MFA  | Multi-Factor Authentication                                     |
| PSO  | Provincial Sport Organization                                   |
| RBAC | Role-Based Access Control                                       |
| RDS  | Amazon Relational Database Service                              |
| SIN  | Strength in Numbers (project name)                              |
| SST  | Serverless Stack (infrastructure as code framework)             |
| TOTP | Time-based One-Time Password                                    |
| UAT  | User Acceptance Testing                                         |

## Appendix H: Contact Information

**Primary Contact:**

Austin Wallace
Project Lead, Austin Wallace Tech
Email: austin@austinwallace.tech
Location: Victoria, British Columbia

Austin Wallace Tech welcomes the opportunity to present the prototype and discuss how Solstice can serve viaSport's Strength in Numbers initiative.

## Appendix I: Evidence Pack

The Evidence Pack provides supporting screenshots from the prototype.

| Evidence Item                   | Description                                  |
| ------------------------------- | -------------------------------------------- |
| 01-prototype-dashboard.png      | Role-based admin dashboard view              |
| 02-audit-log-integrity.png      | Audit log view with integrity verification   |
| 03-import-wizard-validation.png | Import wizard preview and validation results |

## Appendix J: OWASP Top 10:2025 Mapping

Our security testing program maps to the OWASP Top 10 categories:

- **A01: Broken Access Control** - Attackers bypassing authorization to access
  other users' data (critical for SEC-AGG-001).
- **A02: Security Misconfiguration** - Unsecured S3 buckets, default passwords,
  or overly permissive cloud settings.
- **A03: Software Supply Chain Failures** - Vulnerabilities in third-party
  libraries or compromised build pipeline.
- **A04: Cryptographic Failures** - Weak encryption or plain-text data storage
  (directly impacts PIPEDA compliance).
- **A05: Injection** - SQL, NoSQL, or command injection.
- **A06: Insecure Design** - Architectural flaws that cannot be fixed by
  coding.
- **A07: Authentication Failures** - Weak MFA, credential stuffing, or session
  hijacking (directly impacts SEC-AGG-001).
- **A08: Software and Data Integrity Failures** - Tampering with updates or
  data without verification.
- **A09: Security Logging and Alerting Failures** - Lack of real-time
  monitoring (directly impacts SEC-AGG-002 and SEC-AGG-004).
- **A10: Mishandling of Exceptional Conditions** - Error messages that leak
  sensitive info or systems that fail open.
