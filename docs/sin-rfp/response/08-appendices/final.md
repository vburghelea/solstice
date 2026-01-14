# Appendices

## Appendix A: Prototype Evaluation Access

A working prototype is available for viaSport evaluation in a dedicated UAT environment using synthetic data only.

**Demo URL:** [https://sin-uat.solstice.viasport.ca](https://sin-uat.solstice.viasport.ca)

**Environment:** `sin-uat` (User Acceptance Testing environment with evaluator access and CloudTrail monitoring)

### Environment Details

- Synthetic test data only \- no confidential viaSport data was used
- Environment monitoring enabled (CloudTrail with Center for Internet Security (CIS) Benchmark alarms)
- Production-equivalent security controls active
- Performance testing is executed separately in `sin-perf`

### Evaluator Access

To protect evaluator accounts and align with security best practices, credentials are provided via a secure **Evaluator Access Pack** delivered separately to viaSport's evaluation lead.

**To request access:**

1. Contact [support@solsticeapp.ca](mailto:support@solsticeapp.ca) with evaluator names and email addresses
2. Receive the Evaluator Access Pack via secure email
3. Credentials include accounts for multiple personas (viaSport Staff, PSO Admin, Club Reporter, Viewer)

Credentials will be rotated periodically and disabled after the evaluation window closes.

### Test Account Personas

| Persona        | Access Level                                  |
| :------------- | :-------------------------------------------- |
| viaSport Staff | Full admin with cross-org access              |
| PSO Admin      | BC Hockey organization administrator          |
| Club Reporter  | North Shore Club reporter (submission access) |
| Viewer         | Read-only access to assigned organization     |

### Multi-Factor Authentication (MFA)

MFA is disabled on all demo accounts for evaluator convenience. To evaluate the MFA enrollment and authentication flow:

1. Log in to any demo account
2. Navigate to **Settings > Security**
3. Click **Enable MFA** and scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)
4. Future logins will require a 6-digit code from your authenticator

This demonstrates SEC-AGG-001 compliance (authentication and access control).

### Suggested Evaluation Walkthrough

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

For a requirement-by-requirement walkthrough, see the **Prototype Evaluation Guide**.

## Appendix B: System Architecture

### High-Level Architecture

A formatted architecture diagram is provided in the Evidence Pack.

The platform runs entirely in AWS Canada (Central) (ca-central-1) using a serverless architecture: CloudFront CDN for edge delivery, Lambda for application compute, RDS PostgreSQL for the database, S3 for object storage, SQS for message queuing, ElastiCache Redis for caching, EventBridge for scheduling, CloudWatch for monitoring, and SES for email delivery.

### Technology Stack

| Layer          | Technologies                                                 |
| :------------- | :----------------------------------------------------------- |
| Frontend       | React 19, TanStack Start, TypeScript, Radix UI, Tailwind CSS |
| Backend        | TanStack Start, Node.js, Drizzle ORM                         |
| Database       | PostgreSQL on AWS RDS                                        |
| Caching        | Redis for rate limiting, BI caching, permissions             |
| Infrastructure | SST, AWS Lambda, CloudFront, ECS Fargate                     |
| Authentication | Better Auth with TOTP MFA                                    |
| Monitoring     | AWS CloudWatch, CloudTrail                                   |

## Appendix C: Performance Evidence

Load testing was conducted in the sin-perf environment on January 8, 2026. Results: p95 latency of 162ms (target: <500ms), 25 concurrent users, zero server errors.

### Data Volume

| Table            | Rows    |
| :--------------- | :------ |
| audit_logs       | 10.0M   |
| form_submissions | 8.0M    |
| notifications    | 2.0M    |
| **Total**        | **20M** |

### Performance Results

| Metric              | Value      | Target  | Status |
| :------------------ | :--------- | :------ | :----- |
| p95 latency         | 162ms      | \<500ms | Pass   |
| p50 latency         | 98ms       | N/A     | Pass   |
| Concurrent users    | 25         | N/A     | Pass   |
| Throughput          | 12.3 req/s | N/A     | Pass   |
| Server errors (5xx) | 0          | 0       | Pass   |

### Lighthouse Scores

| Metric                   | Value   | Target | Status |
| :----------------------- | :------ | :----- | :----- |
| Performance Score        | 90/100  | \>80   | Pass   |
| First Contentful Paint   | 1.0s    | \<1.8s | Pass   |
| Largest Contentful Paint | 1.0s    | \<2.5s | Pass   |
| Time to Interactive      | 1.1s    | \<3.8s | Pass   |
| Cumulative Layout Shift  | 0       | \<0.1  | Pass   |
| Accessibility Score      | 100/100 | \>90   | Pass   |

### DR Exercise Results (2026-01-08)

| Metric                         | Target   | Achieved | Status |
| :----------------------------- | :------- | :------- | :----- |
| Recovery Point Objective (RPO) | 1 hour   | 0 min    | Pass   |
| Recovery Time Objective (RTO)  | 4 hours  | 16 min   | Pass   |
| Records validated              | 20M rows | 20M rows | Pass   |

## Appendix D: Security Architecture Summary

### Shared Responsibility Model

The security model follows the AWS shared responsibility approach: AWS secures the underlying cloud infrastructure, and we implement and operate the application controls, configuration, and monitoring required for viaSport's use case. AWS compliance reports (SOC, ISO) are available via AWS Artifact upon request.

### Data Residency

Primary data stores (RDS PostgreSQL, S3 object storage, backups, and audit archives) are hosted in AWS Canada (Central) (ca-central-1). Authenticated content is configured to avoid edge caching. Email notifications are sent via AWS Simple Email Service (SES) in AWS Canada (Central) (ca-central-1). Once delivered to recipients, messages may transit or be stored by external email providers outside AWS.

### Encryption

| Scope              | Standard                                       |
| :----------------- | :--------------------------------------------- |
| In Transit         | TLS 1.2+                                       |
| At Rest (Database) | AES-256 via AWS KMS                            |
| At Rest (Storage)  | AES-256 via AWS KMS                            |
| Secrets            | AWS Secrets Manager (SST-managed, deploy-time) |

### Authentication

| Feature                     | Implementation                           |
| :-------------------------- | :--------------------------------------- |
| Multi-Factor Authentication | TOTP with backup codes                   |
| Password Requirements       | Configurable password policy             |
| Session Management          | Secure cookies, configurable expiry      |
| Account Lockout             | Automatic after failed attempt threshold |

### Authorization

| Feature                   | Implementation                            |
| :------------------------ | :---------------------------------------- |
| Role-Based Access Control | Owner, Admin, Reporter, Viewer roles      |
| Organization Scoping      | All queries scoped to user's organization |
| Field-Level Permissions   | Sensitive fields restricted by role       |
| Step-Up Authentication    | Required for admin actions and exports    |

### Audit Trail

| Feature      | Implementation                                                                                                   |
| :----------- | :--------------------------------------------------------------------------------------------------------------- |
| Scope        | All user actions, data changes, auth events                                                                      |
| Immutability | Append-only with hash chain verification; archived to S3 Object Lock (immutable storage) for long-term integrity |
| Retention    | Retention policies and legal holds (durations to be confirmed with viaSport during Discovery)                    |

### Compliance

- PIPEDA aligned data handling practices
- AWS Data Processing Addendum (DPA) in place
- CloudTrail API audit logging with CIS Benchmark alarms (root usage, IAM changes, security group changes)

## Appendix E: User Personas

| Persona        | Portal Access             | Key Capabilities                                    |
| :------------- | :------------------------ | :-------------------------------------------------- |
| viaSport Admin | Full platform             | Admin console, cross-org analytics, user management |
| PSO Admin      | Organization-scoped       | Reporting oversight, user invitations, analytics    |
| PSO Reporter   | Organization-scoped       | Form submission, file uploads, imports              |
| Viewer         | Read-only                 | Dashboard viewing, report access                    |
| Auditor        | Admin console (read-only) | Audit log access, compliance review                 |

## Appendix F: Team Biographies

### Austin Wallace, Project Lead and Solution Architect

Austin Wallace is the delivery lead and solution architect for Solstice. He leads platform architecture, data migration strategy, and delivery governance. He has 9+ years of enterprise data engineering experience and sport governance leadership.

### Ruslan Hétu, UX and Accessibility Lead

Ruslan Hétu is a design and research freelancer with a background in human-centered design and systems thinking. He earned a master's degree in design and has 6 years of experience applying mixed-methods research to public sector projects, healthcare, and startups.

### Soleil Heaney, System Navigator

Soleil Heaney has been involved in the sports industry for 10 years. Her work as the Executive Director with Quadball Canada, Manager of Member Services with BC Soccer, General Manager of Victoria Ultimate and President of several local sports club Boards gives her a unique perspective of the needs of sports governing bodies.

### Will Siddall, Technical Advisor

With 15+ years of development and business consulting experience across many industries, Will is ensuring a stable product can be delivered to customers with a focus on customer collaboration and user experience (UX).

He's designed, delivered, and trained a variety of products for customers of all types and sizes, with most of his experience developing and delivering products to air-gapped environments. Industries he's supported in the past include mining, VFX, hydrography and ocean exploration, oil and gas, civil engineering and cadastral/bathymetric surveys.

### Parul Kharub, Security and Risk Advisor

Parul is the strategic cybersecurity and risk advisor with 16 years of practical experience in Fortune 100 companies across the globe. She also brings experience working with regulators and privacy officers to offer breadth of security, privacy and regulatory coverage.

### Michael Casinha, Security and Infrastructure Advisor

A 30+ year veteran of the dotcom internet era bringing generational lessons of best practices to an agile era of cloud development. Having worked with American Finance, Aviation and Canadian quantum computing startups. All relying on consistent, secure, repeatable development practices learned over years of successful achievements and hard lessons learned.

### Tyler Piller, Security and Compliance Advisor

Tyler Piller is a cybersecurity veteran with over 10 years of experience in operational defense and strategic risk management. He currently directs an Information Security Risk Management program, providing strategic advisory to align technical risk with enterprise business objectives.

## Appendix G: Glossary

| Term | Definition                                                |
| :--- | :-------------------------------------------------------- |
| AT   | Assistive Technology                                      |
| BCAR | BC Activity Reporter, legacy system being replaced        |
| BCSI | BC Sport Information System, legacy system being replaced |
| CIS  | Center for Internet Security                              |
| IA   | Information Architecture                                  |
| MFA  | Multi-Factor Authentication                               |
| PSO  | Provincial Sport Organization                             |
| RBAC | Role-Based Access Control                                 |
| RDS  | Amazon Relational Database Service                        |
| SIN  | Strength in Numbers (project name)                        |
| SME  | Subject Matter Expert                                     |
| SST  | Serverless Stack (infrastructure as code framework)       |
| SUS  | System Usability Scale                                    |
| TOTP | Time-based One-Time Password                              |
| UAT  | User Acceptance Testing                                   |

## Appendix H: Contact Information

**Primary Contact:**

Austin Wallace Project Lead, Austin Wallace Tech Email: [austin@solsticeapp.ca](mailto:austin@solsticeapp.ca) Location: Victoria, British Columbia

Austin Wallace Tech welcomes the opportunity to present the prototype and discuss how Solstice can serve viaSport's Strength in Numbers initiative.

## Appendix I: Evidence Pack

The Evidence Pack provides supporting screenshots from the prototype.

| Evidence Item                   | Description                                  |
| :------------------------------ | :------------------------------------------- |
| 01-prototype-dashboard.png      | Role-based admin dashboard view              |
| 02-audit-log-integrity.png      | Audit log view with integrity verification   |
| 03-import-wizard-validation.png | Import wizard preview and validation results |

## Appendix J: OWASP Top 10:2025 Mapping

Our security testing program maps to the OWASP Top 10 categories:

- **A01: Broken Access Control** \- Attackers bypassing authorization to access other users' data (critical for SEC-AGG-001).
- **A02: Security Misconfiguration** \- Unsecured S3 buckets, default passwords, or overly permissive cloud settings.
- **A03: Software Supply Chain Failures** \- Vulnerabilities in third-party libraries or compromised build pipeline.
- **A04: Cryptographic Failures** \- Weak encryption or plain-text data storage (directly impacts PIPEDA compliance).
- **A05: Injection** \- SQL, NoSQL, or command injection.
- **A06: Insecure Design** \- Architectural flaws that cannot be fixed by coding.
- **A07: Authentication Failures** \- Weak MFA, credential stuffing, or session hijacking (directly impacts SEC-AGG-001).
- **A08: Software and Data Integrity Failures** \- Tampering with updates or data without verification.
- **A09: Security Logging and Alerting Failures** \- Lack of real-time monitoring (directly impacts SEC-AGG-002 and SEC-AGG-004).
- **A10: Mishandling of Exceptional Conditions** \- Error messages that leak sensitive info or systems that fail open.
