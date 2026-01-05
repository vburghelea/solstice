# Capabilities and Experience

## Demonstrated Success Delivering Similar Systems

Austin Wallace Tech brings experience delivering information systems in sports and data-intensive environments.

### Austin Wallace: Enterprise Data Engineering

| Organization                          | Role                | Achievements                                                                                 |
| ------------------------------------- | ------------------- | -------------------------------------------------------------------------------------------- |
| Clio (2024 to Present)                | Data Engineer       | Owns Databricks pipelines processing production workloads. Authored AI best practices guide. |
| New Jersey Devils, NHL (2022 to 2024) | Sole Data Developer | Built data platform processing 10 million rows per game. Developed 40+ dbt models.           |
| Teck Resources (2020 to 2022)         | Data Developer      | Modernized legacy PostgreSQL processes with Terraform and Python.                            |

### Will Siddal: Full-Stack Development

| Organization                  | Role                 | Achievements                                                                                               |
| ----------------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------- |
| Teck Resources (2022 to 2024) | Full Stack Developer | Built reporting pipelines processing billions of rows. Developed internal tools with React and TypeScript. |

### The Solstice Prototype as Proof

The most relevant evidence is the Solstice prototype itself, built for viaSport requirements.

| Metric                | Value                                                |
| --------------------- | ---------------------------------------------------- |
| Requirements coverage | Majority of System Requirements Addendum implemented |
| Load testing          | 20.1 million rows, sub-250ms p95 latency             |
| Server errors         | Zero under concurrent load                           |
| Codebase size         | 97,000+ lines of TypeScript (app plus tests)         |

## Partners and Subcontractors

### Team Structure

| Role                     | Team Member    | Responsibilities                                            | Status      |
| ------------------------ | -------------- | ----------------------------------------------------------- | ----------- |
| Project Lead / Architect | Austin Wallace | Architecture, data engineering, delivery oversight          | Committed   |
| Senior Developer         | Will Siddal    | Frontend and backend development                            | Committed   |
| Security Expert          | TBD            | Security review, penetration testing, compliance validation | In progress |
| UX Designer              | TBD            | User research, interface refinement, accessibility audit    | In progress |

### Oversight Mechanisms

- Daily coordination on implementation priorities
- Weekly deliverable reviews
- Code review required for all changes
- Security sign-off for auth and access control changes
- Direct accountability to viaSport with no organizational layers

### Continuity of Services

Continuity is supported by:

- Infrastructure as code (SST)
- Automated testing and CI
- Operational runbooks and documentation
- Principal-led delivery continuity

## Relevant Non-Profit, Public Sector, and Sport Clients

### Sport Sector Experience

| Organization                        | Relationship              | Scope                                                                           |
| ----------------------------------- | ------------------------- | ------------------------------------------------------------------------------- |
| International Quidditch Association | Chair, Board of Directors | Led governance, data, and technology strategy for 30+ national governing bodies |
| Volunteer Media Organization        | CEO                       | Managed operations for a 70-person volunteer organization                       |

### Public and Enterprise Experience

| Team Member    | Organization   | Sector                                    |
| -------------- | -------------- | ----------------------------------------- |
| Austin Wallace | Teck Resources | Publicly traded resource sector           |
| Austin Wallace | Clio           | Legal technology, public interest clients |
| Will Siddal    | Teck Resources | Publicly traded resource sector           |

## Case Studies

### Primary Case Study: Solstice Platform (viaSport)

**Context:** viaSport requires replacement of BCAR and BCSI with a modern information system.

**Approach:** Build a working prototype that meets the System Requirements Addendum and demonstrate performance at scale.

**Deliverables:**

- Data submission portal with form builder and file uploads
- Native analytics with pivots, charts, and export
- Role-based access control and organization scoping
- MFA, anomaly detection, and tamper-evident audit logs
- Import tooling with mapping, validation, preview, rollback
- Guided walkthroughs and help center

**Results:**

- 20.1M rows tested, sub-250ms p95 latency
- Zero server errors under concurrent load
- Prototype available for evaluator validation

### Supporting Case Study: Qdrill

A production training application used by competitive athletes, including Team Canada. Demonstrates ability to ship and operate a real user-facing sports application.

### Supporting Case Study: New Jersey Devils Data Platform

Processed 10 million rows per game for NHL tracking data and supported multi-million dollar decision making.

## Automation and AI

### Automation (Production-Ready)

| Feature                 | Schedule        | Purpose                                     |
| ----------------------- | --------------- | ------------------------------------------- |
| Scheduled notifications | Every 5 minutes | Process reminder and alert queue            |
| Retention enforcement   | Daily           | Archive and purge data per policy           |
| Data quality monitoring | Daily           | Detect missing fields and validation errors |
| Batch import worker     | On demand       | Process large imports with checkpointing    |
| Health monitoring       | On demand       | Service health checks with alerts           |

### AI Features (Roadmap)

AI features will be prioritized with viaSport during Planning:

| Feature                | Description                         | Benefit                 |
| ---------------------- | ----------------------------------- | ----------------------- |
| AI report narratives   | Generate summaries from submissions | Reduce manual reporting |
| Natural language query | Ask questions in plain English      | Self-service analytics  |
| Data quality AI        | Detect anomalies in submissions     | Improve integrity       |
| Submission assistant   | Contextual form guidance            | Reduce errors           |

AI is a roadmap item, not a day-one dependency.

## Responsible AI Approach

- Transparent labeling of AI-generated content
- Human review before publishing AI outputs
- No model training on viaSport data without consent
- Bias review and feedback mechanisms

## Open Standards, APIs, and Open Source

### Open Standards

- TOTP (RFC 6238) for MFA
- CSV and Excel for import and export
- JSON for data interchange
- TLS 1.2+ for transport security
- AES-256 for encryption at rest

### APIs

Internal APIs are structured for extension. External integrations will be scoped with viaSport during Discovery.

### Open Source Foundations

| Layer          | Technologies                                                 |
| -------------- | ------------------------------------------------------------ |
| Frontend       | React 19, TanStack Start, TypeScript, Radix UI, Tailwind CSS |
| Backend        | TanStack Start, Node.js, Drizzle ORM                         |
| Database       | PostgreSQL                                                   |
| Infrastructure | SST                                                          |
| Testing        | Vitest, Playwright, Testing Library                          |
| Validation     | Zod                                                          |

The application code is proprietary to Austin Wallace Tech, with source access available under mutually agreed terms.
