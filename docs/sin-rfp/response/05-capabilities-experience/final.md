# Capabilities and Experience

## Demonstrated Success Delivering Similar Systems

Austin Wallace Tech brings experience delivering information systems in sports and data-intensive environments.

### Austin Wallace: Enterprise Data Engineering

| Organization                          | Role                | Achievements                                                                                 |
| ------------------------------------- | ------------------- | -------------------------------------------------------------------------------------------- |
| Clio (2024 to Present)                | Data Engineer       | Owns Databricks pipelines processing production workloads. Authored AI best practices guide. |
| New Jersey Devils, NHL (2022 to 2024) | Sole Data Developer | Built data platform processing 10 million rows per game. Developed 40+ dbt models.           |
| Teck Resources (2020 to 2022)         | Data Developer      | Modernized legacy PostgreSQL processes with Terraform and Python.                            |

### Will Siddall: Full-Stack Development

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

## Delivery and Advisory Team

### Delivery Lead

| Role                              | Name           | Responsibilities                                                 | Status    |
| --------------------------------- | -------------- | ---------------------------------------------------------------- | --------- |
| Project Lead / Solution Architect | Austin Wallace | Architecture, data engineering, development, delivery governance | Committed |

### Advisory Partners

| Focus Area                  | Name            | Contribution                                  | Status    |
| --------------------------- | --------------- | --------------------------------------------- | --------- |
| Sport Sector Operations     | Soleil Heaney   | User perspective and workflow validation      | Committed |
| Technical Architecture      | Will Siddall    | Architecture review and development support   | Committed |
| UX and Accessibility        | Ruslan Hétu     | Design research and accessibility validation  | Committed |
| Security and Risk           | Parul Kharub    | Security strategy and risk advisory           | Committed |
| Security and Infrastructure | Michael Casinha | Infrastructure security review                | Committed |
| Security and Compliance     | Tyler Piller    | Security operations and compliance validation | Committed |

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
| Will Siddall   | Teck Resources | Publicly traded resource sector           |

## Case Studies

### Primary Case Study: Solstice Platform (viaSport)

**Context:** viaSport requires replacement of BCAR and BCSI with a modern information system.

**Approach:** Deliver a prototype that meets the System Requirements Addendum
and demonstrate performance at scale.

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

### AI Enablement Foundation (Built)

The platform includes a production-ready AI foundation layer that enables rapid delivery of AI features during the engagement. This infrastructure is fully implemented:

| Component                    | Description                                                             |
| ---------------------------- | ----------------------------------------------------------------------- |
| Provider registry            | Adapters for multiple LLM providers (Claude, OpenAI, Azure OpenAI)      |
| Central AI service           | Unified interface with retries, timeouts, and error handling            |
| Prompt template registry     | Versioned prompts with audit trail and rollback capability              |
| Structured output validation | Zod schema validation ensuring AI responses match expected formats      |
| Usage logging and costs      | Per-request tracking of tokens, latency, cost estimates by org and user |
| Quota enforcement            | Rate limiting and budget controls per tenant and user                   |
| Embedding support            | Vector generation for semantic search and document similarity           |

This foundation means AI features can be delivered in days rather than weeks, with consistent safety, observability, and cost controls from day one.

### AI Feature Candidates

The following AI features are included in the contract scope. During Planning, we will conduct UX research with viaSport staff and PSO representatives to determine which features deliver the highest value and should be prioritized for implementation.

| Feature                  | Description                                                                                   | Target Users         | Value                                   |
| ------------------------ | --------------------------------------------------------------------------------------------- | -------------------- | --------------------------------------- |
| AI report narratives     | Generate natural language summaries from analytics dashboards for board reports and briefings | viaSport admins      | Reduce manual report writing by 60-80%  |
| Natural language query   | Ask questions in plain English and receive structured answers from the data warehouse         | viaSport admins, PSO | Self-service analytics without SQL      |
| AI dashboard builder     | Describe a visualization in words and generate chart configurations automatically             | viaSport admins      | Faster dashboard creation               |
| Semantic document search | Search submissions and documents by meaning rather than exact keywords                        | All users            | Find relevant records faster            |
| Data quality AI          | Detect anomalies and outliers in submissions with plain-language explanations                 | viaSport admins      | Catch errors before they affect reports |
| Submission assistant     | Contextual guidance and suggestions while completing forms based on historical patterns       | PSO staff            | Reduce submission errors and rework     |

### Prioritization Approach

AI features will not be enabled without user research. Our approach:

1. **Discovery interviews** with viaSport staff and PSO representatives to understand pain points
2. **Value mapping** to identify which features address the highest-impact workflows
3. **Prototype testing** of prioritized features with real users before production release
4. **Iterative rollout** starting with the highest-value feature, gathering feedback before expanding

The foundation work is complete. We will implement the AI features that drive real value for viaSport and PSOs based on what we learn during research.

## Responsible AI Approach

| Principle                | Implementation                                                                            |
| ------------------------ | ----------------------------------------------------------------------------------------- |
| Transparency             | All AI-generated content is clearly labeled; users see when AI assisted                   |
| Human-in-the-loop        | AI outputs require human review before publishing or external sharing                     |
| Privacy by design        | No PII in prompts; data aggregated or anonymized before AI processing                     |
| No unauthorized training | viaSport data is never used for model training without explicit consent                   |
| Bias mitigation          | Regular review of AI outputs for demographic or organizational bias                       |
| Audit trail              | All AI requests logged with prompt version, user, timestamp, and response characteristics |
| Data residency           | Canadian-region AI providers prioritized; fallback to providers with compliant policies   |

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
