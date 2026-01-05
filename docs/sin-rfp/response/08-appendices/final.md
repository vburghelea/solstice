# Appendices

## Appendix A: Live Demo Access

A working prototype is available for viaSport evaluation. Credentials are listed below to reduce reviewer friction.

**Demo URL:** TBD

### Data and Monitoring

- Synthetic data only, no confidential viaSport data
- Environment monitoring enabled

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
8. Explore help center and guided walkthroughs

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
|   | Storage  |      |  Queue    |     | (Upstash) |           |
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
| Caching        | Redis (Upstash) for rate limiting, BI caching, permissions   |
| Infrastructure | SST, AWS Lambda, CloudFront, ECS Fargate                     |
| Authentication | Better Auth with TOTP MFA                                    |
| Monitoring     | AWS CloudWatch, CloudTrail                                   |

## Appendix C: Load Test Results

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

## Appendix D: Security Summary

### Data Residency

All data is hosted in AWS ca-central-1 (Canada). No data is stored or processed outside Canadian jurisdiction.

### Encryption

| Scope              | Standard            |
| ------------------ | ------------------- |
| In Transit         | TLS 1.2+            |
| At Rest (Database) | AES-256 via AWS KMS |
| At Rest (Storage)  | AES-256 via AWS KMS |
| Secrets            | AWS Secrets Manager |

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

| Feature      | Implementation                                     |
| ------------ | -------------------------------------------------- |
| Scope        | All user actions, data changes, auth events        |
| Immutability | Append-only audit log with hash chain              |
| Retention    | Retention policies and legal holds (durations TBD) |

### Compliance

- PIPEDA aligned data handling practices
- AWS Data Processing Addendum (DPA) in place
- No sub-processors outside AWS Canada

## Appendix E: User Personas

| Persona        | Portal Access             | Key Capabilities                                    |
| -------------- | ------------------------- | --------------------------------------------------- |
| viaSport Admin | Full platform             | Admin console, cross-org analytics, user management |
| PSO Admin      | Organization-scoped       | Reporting oversight, user invitations, analytics    |
| PSO Reporter   | Organization-scoped       | Form submission, file uploads, imports              |
| Viewer         | Read-only                 | Dashboard viewing, report access                    |
| Auditor        | Admin console (read-only) | Audit log access, compliance review                 |

## Appendix F: Team Biographies

### Austin Wallace, Project Lead and Data Engineer

Austin Wallace brings 9+ years of enterprise data engineering experience combined with executive leadership in international amateur sport governance.

**Professional Experience:**

- **Clio (2024 to Present):** Data Engineer. Owns Databricks pipelines. Authored AI best practices guide.
- **New Jersey Devils, NHL (2022 to 2024):** Sole Data Developer. Built end-to-end data platform processing 10 million rows per game. Developed 40+ dbt models.
- **Teck Resources (2020 to 2022):** Data Developer. Modernized legacy systems with Terraform and Python.

**Sport Sector Experience:**

- Chair, International Quidditch Association (30+ national governing bodies)
- CEO, Volunteer Media Organization (70 staff across 30 countries)
- Creator of Qdrill, training app used by Team Canada athletes

**Education:** B.Sc., University of British Columbia, Analytical Sports Management

### Will Siddal, Senior Developer

Will Siddal brings 2+ years of full-stack development experience at Teck Resources.

**Professional Experience:**

- **Teck Resources (2022 to 2024):** Full Stack Developer. Built reporting pipelines processing billions of rows. Developed internal tools using React and TypeScript. Managed AWS infrastructure using Terraform.

**Technical Skills:** Python, React, TypeScript, AWS, Terraform, PostgreSQL, Snowflake

**Education:** Simon Fraser University. Based in British Columbia.

### Security Expert

TBD

### UX Designer

TBD

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
Email: TBD
Phone: TBD
Location: Victoria, British Columbia

Austin Wallace Tech welcomes the opportunity to present the prototype and discuss how Solstice can serve viaSport's Strength in Numbers initiative.
