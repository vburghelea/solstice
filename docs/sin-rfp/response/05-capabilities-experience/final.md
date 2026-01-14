# Capabilities and Experience

## Demonstrated Success Delivering Similar Systems

Austin Wallace Tech brings experience delivering information systems in sports and data-intensive environments. For project-based delivery examples, see **Relevant Delivery Portfolio** in Vendor Fit to viaSport's Needs.

### The Solstice Prototype as Proof

The most relevant evidence is the Solstice prototype itself, built for viaSport requirements.

| Metric                | Value                                                                                                   |
| :-------------------- | :------------------------------------------------------------------------------------------------------ |
| Requirements coverage | 25 of 25 (100%) System Requirements Addendum items implemented                                          |
| Load testing          | 20M rows, p95 162ms, 25 concurrent users, 0 server errors                                               |
| Server errors         | Zero under concurrent load                                                                              |
| Test coverage         | Automated test suite covering core workflows (login, submission, import, export, RBAC, audit integrity) |
| Accessibility         | WCAG 2.1 Level AA compliance, Axe-core automated testing in CI, Lighthouse Accessibility 100/100        |

## Delivery and Advisory Team

### Delivery Lead

| Role                              | Name           | Responsibilities                                                 | Status    |
| :-------------------------------- | :------------- | :--------------------------------------------------------------- | :-------- |
| Project Lead / Solution Architect | Austin Wallace | Architecture, data engineering, development, delivery governance | Committed |

### Advisory Partners

| Focus Area                  | Name            | Contribution                                  | Status    |
| :-------------------------- | :-------------- | :-------------------------------------------- | :-------- |
| UX and Accessibility        | Ruslan Hétu     | UX research lead, design, accessibility       | Committed |
| Sport Sector / Navigator    | Soleil Heaney   | System navigator connecting team to PSO needs | Committed |
| Technical Architecture      | Will Siddall    | Architecture review and development support   | Committed |
| Security and Risk           | Parul Kharub    | Security strategy and risk advisory           | Committed |
| Security and Infrastructure | Michael Casinha | Infrastructure security review                | Committed |
| Security and Compliance     | Tyler Piller    | Security operations and compliance validation | Committed |

### Oversight Mechanisms

- Daily coordination on implementation priorities
- Weekly deliverable reviews
- Code review required for all changes
- Security sign-off for auth and access control changes
- Direct accountability to viaSport with no organizational layers

### Accessibility Expertise

Ruslan Hétu leads UX research and accessibility validation with 6 years of experience in inclusive design. The team's accessibility approach includes:

- **Automated validation:** Axe-core accessibility tests run on every commit in CI
- **Manual verification:** Keyboard navigation, screen reader compatibility, and focus management testing
- **Inclusive design patterns:** Alternative interaction modes (button vs drag), data table alternatives for charts, form error summaries with field links

### Continuity of Services

Continuity is supported by:

- Infrastructure as code (SST)
- Automated testing and CI
- Operational runbooks and documentation
- Principal-led delivery continuity

## Relevant Non-Profit, Public Sector, and Sport Clients

### Sport Sector Experience

| Organization                        | Relationship              | Scope                                                                           |
| :---------------------------------- | :------------------------ | :------------------------------------------------------------------------------ |
| International Quidditch Association | Chair, Board of Directors | Led governance, data, and technology strategy for 30+ national governing bodies |
| Volunteer Media Organization        | CEO                       | Managed operations for a 70-person volunteer organization                       |

### Public and Enterprise Experience

| Team Member    | Organization                           | Sector                                    |
| :------------- | :------------------------------------- | :---------------------------------------- |
| Austin Wallace | Teck Resources                         | Publicly traded resource sector           |
| Austin Wallace | Clio                                   | Legal technology, public interest clients |
| Parul Kharub   | Canadian Border Services Agency (CBSA) | Federal Law Enforcement Agency            |
| Will Siddall   | Teck Resources                         | Publicly traded resource sector           |

## Case Studies

### Primary Case Study: Solstice Platform (viaSport)

**Context:** viaSport requires replacement of BCAR and BCSI with a modern information system.

**Approach:** Deliver a prototype that meets the System Requirements Addendum and demonstrate performance at scale.

**Deliverables:**

- Data submission portal with form builder and file uploads
- Native analytics with pivots, charts, and export
- Role-based access control and organization scoping
- MFA, anomaly detection, and tamper-evident audit logs
- Import tooling with mapping, validation, preview, rollback
- Guided walkthroughs and help center

**Results:**

- 20M rows tested, p95 162ms (25 concurrent users)
- Zero server errors under concurrent load
- Prototype available for evaluator validation

### Supporting Case Study: Qdrill

A production training application used by competitive athletes, including Team Canada. Demonstrates ability to ship and operate a real user-facing sports application.

### Supporting Case Study: New Jersey Devils Data Platform

Processed 10 million rows per game for NHL tracking data and supported multi-million dollar decision making.

## Automation and AI

### Automation (Production-Ready)

| Feature                 | Schedule        | Purpose                                     |
| :---------------------- | :-------------- | :------------------------------------------ |
| Scheduled notifications | Every 5 minutes | Process reminder and alert queue            |
| Retention enforcement   | Daily           | Archive and purge data per policy           |
| Data quality monitoring | Daily           | Detect missing fields and validation errors |
| Batch import worker     | On demand       | Process large imports with checkpointing    |
| Health monitoring       | On demand       | Service health checks with alerts           |

### AI Enablement Foundation (Built)

Austin Wallace Tech (AWT) provides a pre-configured AI infrastructure within the Solstice platform, designed to enhance data quality and reporting efficiency without compromising viaSport's data residency or governance requirements. The AI foundation is fully implemented in the current prototype and resides exclusively within the AWS Canada (Central) region. This infrastructure includes:

| Component                    | Description                                                                                                                            |
| :--------------------------- | :------------------------------------------------------------------------------------------------------------------------------------- |
| AWS Bedrock integration      | Foundation models via AWS Bedrock in ca-central-1                                                                                      |
| Central AI service           | Unified interface with retries, timeouts, and error handling                                                                           |
| Prompt template registry     | Versioned prompts with audit trail and rollback capability                                                                             |
| Structured output validation | Zod schema validation ensuring AI responses match expected formats                                                                     |
| Usage logging and costs      | Per-request tracking of tokens, latency, cost estimates by org and user. Usage reports/exports available to viaSport for auditability. |
| Quota enforcement            | Rate limiting and budget controls per tenant and user                                                                                  |
| Embedding support            | Amazon Titan embeddings for semantic search                                                                                            |

AI features use AWS Bedrock hosted in AWS Canada (Central) (ca-central-1). We log per-request token usage, latency, and cost estimates by organization/user for auditability, and we can provide usage reports/exports to viaSport. No AI provider outside Canada will be used without explicit written authorization from viaSport, and viaSport data will not be used for model fine-tuning/training without explicit written approval.

### AI Feature Candidates

The following AI feature candidates are available for prioritization with viaSport. AI features are optional modules enabled only with explicit governance decisions. During Discovery, we will conduct UX research with viaSport staff and PSO representatives to determine which features deliver the highest value.

| Feature                  | Description                                                                                   | Target Users         | Value                                   |
| :----------------------- | :-------------------------------------------------------------------------------------------- | :------------------- | :-------------------------------------- |
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

## Responsible AI Governance

| Principle                | Implementation                                                                                       |
| :----------------------- | :--------------------------------------------------------------------------------------------------- |
| Transparency             | All AI-generated content is clearly labeled; users see when AI assisted                              |
| Human-in-the-loop        | AI outputs require human review before publishing or external sharing                                |
| Privacy by design        | No PII in prompts; data aggregated or anonymized before AI processing                                |
| No unauthorized training | viaSport data is never used for model training without explicit consent                              |
| Bias mitigation          | Regular review of AI outputs for demographic or organizational bias                                  |
| Audit trail              | All AI requests logged with prompt version, user, timestamp, and response characteristics            |
| Data residency           | AWS Bedrock in ca-central-1 only; no non-Canadian AI providers without written consent from viaSport |

## Open Standards, APIs, and Open Source

### Open Standards

- TOTP (RFC 6238\) for MFA
- CSV and Excel for import and export
- JSON for data interchange
- TLS 1.2+ for transport security
- AES-256 for encryption at rest

### APIs

Internal APIs are structured for extension. External integrations will be scoped with viaSport during Discovery.

### Open Source Foundations

| Layer          | Technologies                                                 |
| :------------- | :----------------------------------------------------------- |
| Frontend       | React 19, TanStack Start, TypeScript, Radix UI, Tailwind CSS |
| Backend        | TanStack Start, Node.js, Drizzle ORM                         |
| Database       | PostgreSQL                                                   |
| Infrastructure | SST                                                          |
| Testing        | Vitest, Playwright, Testing Library                          |
| Validation     | Zod                                                          |

The application code is proprietary to Austin Wallace Tech, with source access available under mutually agreed terms.

---
