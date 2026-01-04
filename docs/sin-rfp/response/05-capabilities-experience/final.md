# Capabilities and Experience

## Demonstrated Success Delivering Similar Systems

Austin Wallace Tech brings demonstrated experience delivering enterprise-scale information management systems across sports and data-intensive industries.

### Austin Wallace: Enterprise Data Engineering

| Organization                              | Role                | Achievements                                                                                                                                                                                                 |
| ----------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Clio** (2024 to Present)                | Data Engineer       | Owns 10+ Databricks pipelines processing production workloads. Unlocked $1M+ in value through AI analysis. Authored company-wide AI best practices guide, increasing responsible AI adoption 20x.            |
| **New Jersey Devils, NHL** (2022 to 2024) | Sole Data Developer | Built end-to-end data platform processing 10 million rows per game of NHL tracking data (10,000x increase in data volume). Developed 40+ dbt models supporting multi-million dollar player salary decisions. |
| **Teck Resources** (2020 to 2022)         | Data Developer      | Transformed legacy PostgreSQL stored procedures into testable Python pipelines using Terraform and Azure infrastructure.                                                                                     |

### Will Siddal: Full-Stack Development

| Organization                      | Role                 | Achievements                                                                                                                                                                               |
| --------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Teck Resources** (2022 to 2024) | Full Stack Developer | Built mission-critical reporting pipelines processing billions of rows annually. Developed internal tools using React and TypeScript. Managed cloud infrastructure on AWS using Terraform. |

### The Solstice Prototype as Proof of Capability

The most relevant demonstration of our capability is the Solstice platform itself: a working prototype built specifically for viaSport's Strength in Numbers requirements.

| Metric           | Value                                       |
| ---------------- | ------------------------------------------- |
| Codebase         | 20,000+ lines of tested TypeScript          |
| Requirements Met | All 25 system requirements                  |
| Load Testing     | 20.1 million rows, sub-250ms response times |
| Server Errors    | Zero under concurrent load                  |

This is not a theoretical proposal. viaSport can evaluate a working system.

## Partners and Subcontractors

### Team Structure

| Role                     | Team Member     | Responsibilities                                                       | Status    |
| ------------------------ | --------------- | ---------------------------------------------------------------------- | --------- |
| Project Lead / Architect | Austin Wallace  | Architecture, data engineering, project management, delivery oversight | Committed |
| Senior Developer         | Will Siddal     | Frontend/backend development, feature implementation                   | Committed |
| Security Expert          | TBD (confirmed) | Security review, penetration testing, compliance validation            | Confirmed |
| UX Designer              | TBD (confirmed) | User research, interface design, accessibility audit                   | Confirmed |

All team members are based in British Columbia.

### Oversight Mechanisms

Austin Wallace, as Project Lead, maintains direct oversight of all project work:

- **Daily coordination** with development team on implementation priorities
- **Weekly deliverable reviews** with full team
- **Code review requirements** for all changes before merge
- **Security sign-off** required for authentication and access control changes
- **Direct accountability** to viaSport with no organizational layers in between

### Continuity of Services

The architecture and deployment approach ensures continuity regardless of team changes:

- **Infrastructure as Code**: All AWS resources defined in SST, reproducible from version control
- **Comprehensive Documentation**: Architecture decisions, deployment procedures, and operational runbooks maintained in the repository
- **Automated Testing**: 90%+ test coverage ensures changes can be validated by any developer
- **Single-Tenant Production**: viaSport's instance is isolated; no dependencies on shared services

In the event of team member departure, knowledge transfer is supported by the codebase itself. The principal-led structure ensures Austin Wallace remains the constant point of accountability.

## Relevant Non-Profit, Public Sector, and Sport Clients

### Direct Sport Sector Experience

| Organization                            | Relationship              | Scope                                                                                                                                                                                                          |
| --------------------------------------- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **International Quidditch Association** | Chair, Board of Directors | Led governance, data, and technology strategy for 30+ national governing bodies across six continents. Managed compliance, reporting, and information systems for one of the fastest-growing sports worldwide. |
| **Volunteer Media Organization**        | CEO                       | Grew organization to 70 staff across 30 countries. Managed international coordination, operations, and communications infrastructure.                                                                          |

This is not vendor experience serving the sport sector from the outside. Austin Wallace has led amateur sport organizations from the inside, understanding the governance challenges, resource constraints, and stakeholder dynamics that viaSport navigates daily.

### Team Experience with Public Sector and Enterprise Clients

| Team Member    | Organization            | Sector                                                         |
| -------------- | ----------------------- | -------------------------------------------------------------- |
| Austin Wallace | Teck Resources          | Resource sector, publicly traded                               |
| Austin Wallace | New Jersey Devils (NHL) | Professional sports                                            |
| Austin Wallace | Clio                    | Legal technology (serves law firms, including public interest) |
| Will Siddal    | Teck Resources          | Resource sector, publicly traded                               |

## Case Studies

### Primary: Solstice Platform (for viaSport)

**Context:** viaSport issued an RFP to replace legacy information management systems (BCAR and BCSI) serving 60+ Provincial Sport Organizations. The RFP specified 25 system requirements across data management, reporting, security, training, and user interface.

**Approach:** Rather than responding with a proposal document, Austin Wallace Tech built a working prototype that demonstrates capability through a functioning system.

**Deliverables:**

| Component               | Description                                                             |
| ----------------------- | ----------------------------------------------------------------------- |
| Data Submission Portal  | Form builder, file uploads, submission tracking, version history        |
| Native BI Platform      | Pivot tables, charts, export to CSV/Excel/JSON with tenancy enforcement |
| Role-Based Access       | Organization-scoped permissions, field-level access control             |
| Security Infrastructure | MFA, anomaly detection, tamper-evident audit logs                       |
| Import Tooling          | CSV/Excel import with mapping, validation, preview, rollback            |
| Training Framework      | Guided walkthroughs, help center, templates hub                         |

**Results:**

- All 25 system requirements addressed
- Load tested with 20.1 million rows
- Sub-250ms response times (p95) under concurrent load
- Zero server errors
- Live prototype available for viaSport evaluation

### Supporting: Qdrill (Production Sports Application)

**Context:** A training application used by competitive athletes, including members of Team Canada.

**Scope:** 87,000+ lines of code. Full-stack application with user authentication, data persistence, and real-time features.

**Relevance:** Demonstrates ability to ship user-facing sports software to production with real users and real data.

### Supporting: New Jersey Devils Data Platform

**Context:** The NHL requires teams to process large volumes of tracking data for player evaluation and game strategy.

**Scope:** 10 million rows per game. 40+ dbt models. Supported multi-million dollar player salary decisions.

**Relevance:** Demonstrates enterprise-scale data engineering in a sports context, with high stakes for data accuracy and reliability.

## Automation and AI

### Automation (Production-Ready)

The platform includes comprehensive automation for operational efficiency:

| Feature                 | Schedule        | Purpose                                                            |
| ----------------------- | --------------- | ------------------------------------------------------------------ |
| Scheduled Notifications | Every 5 minutes | Process queued notifications, send email digests                   |
| Retention Enforcement   | Daily           | Purge data past retention period, archive audit logs to S3 Glacier |
| Data Quality Monitor    | Daily           | Scan submissions for completeness, flag data quality issues        |
| Notification Queue      | Event-driven    | Asynchronous email delivery with retry and dead-letter queue       |
| Batch Import Worker     | On-demand       | Process large CSV/Excel imports via ECS Fargate with checkpointing |
| Health Monitoring       | On-demand       | Database and service health checks with alerting                   |
| Audit Logging           | Real-time       | Immutable logging of all system actions                            |

**Technical Infrastructure:**

| Service         | Purpose                                            |
| --------------- | -------------------------------------------------- |
| AWS EventBridge | Cron scheduling for periodic jobs                  |
| AWS Lambda      | Serverless job execution                           |
| AWS SQS FIFO    | Notification queue with deduplication              |
| AWS ECS Fargate | Batch processing (2 vCPU, 4 GB RAM, checkpointing) |
| AWS SES         | Email delivery with bounce handling                |
| AWS CloudWatch  | Metrics, alarms, and centralized logging           |

### AI Features (Roadmap)

The platform architecture is AI-ready, with specific features to be prioritized in collaboration with viaSport during the Planning phase.

**Proposed AI Features for Year 1:**

| Feature                | Description                                                 | Benefit                                        |
| ---------------------- | ----------------------------------------------------------- | ---------------------------------------------- |
| AI Report Narratives   | Generate board-ready summaries from submitted data          | Reduce manual report writing                   |
| Natural Language Query | Ask questions about data in plain English                   | Self-service analytics for non-technical users |
| Data Quality AI        | Automatically detect anomalies and errors in submissions    | Improve data integrity                         |
| Submission Assistant   | Help PSOs complete forms correctly with contextual guidance | Reduce errors and support requests             |

**Why AI is Roadmap, Not Day-One:**

The RFP identifies AI-enabled features as desirable, not required. Our approach prioritizes:

1. Delivering core functionality first
2. Gathering real usage data to inform AI priorities
3. Collaborating with viaSport to identify highest-value AI applications
4. Implementing AI features with proper validation and testing

Austin Wallace's experience at Clio (authored company-wide AI best practices, achieved 20x increase in responsible AI adoption) informs this measured approach.

## Responsible AI Approach

When AI features are implemented, the following principles will govern their development and deployment:

### Transparency

- Clear indication when AI generates or assists with content
- Explanation of AI confidence levels where applicable
- Documentation of AI model sources and capabilities

### Human-in-the-Loop

- AI-generated reports require human review before publication
- AI suggestions are recommendations, not automatic actions
- Users can override or reject AI outputs

### Privacy Protection

- AI models do not train on viaSport data without explicit consent
- PII is excluded from AI processing where not essential
- AI features respect the same access controls as the rest of the platform

### Bias Awareness

- Regular review of AI outputs for unintended patterns
- Diverse test cases during AI feature development
- Feedback mechanisms for users to flag problematic outputs

## Open Standards, APIs, and Open Source

### Open Standards

| Standard        | Usage                          |
| --------------- | ------------------------------ |
| OAuth 2.0       | Authentication protocol        |
| TOTP (RFC 6238) | Multi-factor authentication    |
| OpenAPI         | API documentation format       |
| CSV/Excel       | Data import and export formats |
| JSON            | API data interchange           |
| TLS 1.2+        | Transport security             |
| AES-256         | Encryption at rest             |

### APIs

The platform exposes REST APIs for integration with external systems:

| API Category    | Capabilities                         |
| --------------- | ------------------------------------ |
| Authentication  | Login, logout, session management    |
| Data Submission | Create, read, update submissions     |
| Reporting       | Query data, export results           |
| User Management | Invite users, manage roles           |
| Webhooks        | Event notifications for integrations |

API access is authenticated, rate-limited, and logged. Documentation follows OpenAPI specification.

**Note:** External system integrations (such as connections to third-party databases or services) will be scoped collaboratively with viaSport during the Planning phase based on specific requirements.

### Open Source

The platform is built on industry-standard open source technologies:

| Layer          | Technologies                                                      |
| -------------- | ----------------------------------------------------------------- |
| Frontend       | React 19, TanStack Router, TanStack Query, Radix UI, Tailwind CSS |
| Backend        | TanStack Start, Node.js, Drizzle ORM                              |
| Database       | PostgreSQL                                                        |
| Infrastructure | SST (infrastructure as code), AWS CDK                             |
| Testing        | Vitest, Playwright, Testing Library                               |
| Validation     | Zod                                                               |

This open source foundation ensures:

- **No vendor lock-in** for core technologies
- **Community support** and ongoing development
- **Auditability** of underlying code
- **Portability** if future migration is needed
- **Talent availability** for future development

The application code itself is proprietary, owned by Austin Wallace Tech, with full source code access provided to viaSport as part of the engagement.
