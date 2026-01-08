# Vendor Fit to viaSport's Needs

## Company Information

### Austin Wallace Tech

Austin Wallace Tech is a British Columbia based technology consulting firm
incorporated in 2025 and headquartered in Victoria, BC. The company was founded
to deliver information management solutions for the sport sector, with the
Strength in Numbers platform as its primary engagement.

| Attribute      | Details                                                            |
| -------------- | ------------------------------------------------------------------ |
| Incorporation  | 2025                                                               |
| Headquarters   | Victoria, British Columbia                                         |
| Delivery Model | Austin Wallace Tech leads delivery, supported by advisory partners |
| Team Coverage  | Security, UX and accessibility, data migration, delivery ops, QA   |
| Primary Focus  | Sport sector information management systems                        |

Austin Wallace Tech leads delivery directly, supported by advisory partners
who provide domain expertise, technical review, and validation. Work is
managed through a shared backlog, sprint cadence, QA gates, and security
sign-off. The solution architect leads delivery from discovery through rollout
to avoid handoffs.

## Delivery Model

### Core Delivery

- **Austin Wallace**: Solution architecture, data engineering, development,
  project management, and delivery governance.

### Execution Capacity and Engagement Model

| Role                               | Engagement                       | Phase Coverage                  |
| ---------------------------------- | -------------------------------- | ------------------------------- |
| Austin Wallace (Delivery Lead)     | Full-time, accountable           | All phases                      |
| Ruslan Hétu (UX/A11y Lead)         | Full-time UX research and design | All phases                      |
| Soleil Heaney (System Navigator)   | Ongoing community liaison        | Research, UAT, rollout          |
| Will Siddall (Engineering Support) | Part-time during development     | Weeks 11-22                     |
| Security Advisors                  | Scheduled reviews at checkpoints | Design freeze, pre-UAT, go-live |

Advisory partners participate in scheduled reviews and provide expertise at
defined checkpoints rather than full-time allocation.

### Advisory Partners

| Focus Area                  | Advisor         | Contribution                                            |
| --------------------------- | --------------- | ------------------------------------------------------- |
| UX and Accessibility        | Ruslan Hétu     | UX research lead, design, accessibility validation      |
| Sport Sector / Navigator    | Soleil Heaney   | System navigator connecting team to PSO community needs |
| Technical Architecture      | Will Siddall    | Architecture review and development support             |
| Security and Risk           | Parul Kharub    | Security strategy and risk advisory                     |
| Security and Infrastructure | Michael Casinha | Infrastructure security and DevOps review               |
| Security and Compliance     | Tyler Piller    | Security operations and compliance validation           |

## Relevant Delivery Portfolio

### Austin Wallace Tech, Selected Relevant Delivery Work (examples)

**Project: Legacy modernization (Teck Resources)**

- Scope: Replace brittle stored procedure workflows with testable pipelines.
- Delivered: Python-based data workflows and infrastructure as code
  deployments.
- Responsibility: Data model changes, pipeline logic, Terraform, operational
  handoff.
- Outcome: Improved reliability and maintainability, reduced manual
  intervention.

**Project: High-volume sports data platform (New Jersey Devils)**

- Scope: End-to-end platform for tracking data at game scale.
- Delivered: Data pipelines and dbt models supporting decision workflows.
- Responsibility: Architecture, pipeline implementation, modeling layer,
  analytics consumers.
- Outcome: Supported high-stakes decision making and large ingestion volumes.

**Project: Production data operations (Clio)**

- Scope: Production pipelines and governance.
- Delivered: Databricks pipelines and operational standards.
- Responsibility: Pipeline ownership, quality controls, documentation, AI
  usage guidance.
- Outcome: Stable production workloads and standardized practices.

Austin Wallace is the delivery lead and solution architect for Solstice. He
leads scope, architecture, and delivery governance for the platform and has 9+
years of enterprise data engineering experience.

## Advisory Partner Profiles

Advisory partners provide expertise and review. Short profiles are provided by
each advisor.

### Soleil Heaney, System Navigator

[To be provided by Soleil Heaney - 2-3 sentences on relevant sport sector
experience and their role connecting the team to PSO community needs]

### Will Siddall, Technical Advisor

[To be provided by Will Siddall - 2-3 sentences on relevant technical
experience and their focus areas for this project]

### Ruslan Hétu, UX and Accessibility Lead

[To be provided by Ruslan Hétu - 2-3 sentences on relevant UX research and
accessibility experience and their leadership role for this project]

### Parul Kharub, Security and Risk Advisor

Secure Transformation Leadership (Teck Resources Limited): Directed security
architecture and governance for a $1B digital transformation, ensuring secure
product development, legacy-to-cloud migration and overall robust security
controls.

Canadian Regulatory Expertise (CBSA): Managed large-scale cloud transformations
in the Canadian public sector, aligning over 350 security controls with PIPEDA
and ISO 27001 standards.

Big 4 Consulting North America (Deloitte): A strategic partner in building a
global Application Security practice across 43 countries - spearheaded the
development of a DevSecOps practice that embedded "Shift Left" security from
requirements to production into the CI/CD pipeline.

### Michael Casinha, Security and Infrastructure Advisor

[To be provided by Michael Casinha - 2-3 sentences on relevant infrastructure
and security experience and their focus areas for this project]

### Tyler Piller, Security and Compliance Advisor

[To be provided by Tyler Piller - 2-3 sentences on relevant security
operations experience and their focus areas for this project]

## Continuity of Services

Continuity is supported by the architecture and delivery model:

- **Infrastructure as Code:** All AWS resources are defined in SST and version
  controlled.
- **Operational Runbooks:** Deployment and recovery procedures are documented
  and maintained.
- **Automated Testing:** CI tests, including security vulnerability scanning,
  provide regression coverage for core workflows.
- **Delivery Governance:** Sprint cadence, backlog management, QA gates, and
  release readiness checks.
- **Principal Accountability:** Austin Wallace remains the constant delivery
  lead through rollout.

If a team member changes, the codebase, infrastructure definitions, and
operational documentation enable efficient transition.

## Data Ownership and Portability

| Aspect             | Commitment                                               |
| ------------------ | -------------------------------------------------------- |
| Data Ownership     | viaSport retains full ownership of all data              |
| Export Formats     | CSV, Excel, and JSON exports available at any time       |
| Data Extraction    | Full database export available on contract termination   |
| Documentation      | Operational runbooks and schema documentation provided   |
| Source Access      | Source code access available under mutually agreed terms |
| Transition Support | Support available for transition to a replacement system |

## Proposed Solution Statement

Austin Wallace Tech proposes the Solstice platform, a purpose-built, reliable,
and secure information management system aligned to the Strength in Numbers
requirements.

### Key Differentiators

**1. Working Prototype, Not a Proposal**

A functional prototype already exists and is available for evaluation. It
addresses the majority of System Requirements Addendum items today and has
been load-tested at production scale with 20.1 million rows.

**2. Principal-Led Delivery**

The architect and primary developer of the prototype will lead delivery. This
reduces knowledge transfer risk and provides direct accountability.

**3. Domain Expertise in Sport Data**

The team combines enterprise data engineering with direct sport sector
operations experience. Soleil Heaney brings perspective as a PSO executive,
ensuring the platform reflects how sport organizations actually work.
[Soleil to confirm wording]

**4. British Columbia Based**

The core team is based in British Columbia and remaining roles are expected to
be BC based.

**5. Canadian Data Residency**

See Section 1.1, Data Residency and Privacy Summary.

**6. Security and Privacy by Design**

Security and privacy are built into delivery from discovery through operations.
See Section 1.2, Security Model Summary.

Our approach aligns with OWASP application security practices, including the
OWASP Top 10 and OWASP ASVS as a verification framework.

**Security by Design Approach**

- **Security requirements up front:** Define security and privacy requirements
  during discovery (access control, retention, audit, monitoring), then
  validate them in the prototype and UAT.
- **Threat modeling:** Run threat modeling for the core workflows
  (authentication, imports, exports, delegated access) and track mitigations as
  delivery items.
- **Shift-left DevSecOps:** Automated code and dependency scanning in CI so
  issues are found before deployment.
- **Zero-trust access model:** MFA, RBAC, and organization scoping enforced
  server-side for all data access.
- **Data protection and Canadian hosting region:** See Section 1.1.
- **Monitoring and anomaly response:** Detect suspicious authentication
  patterns, alert administrators, and apply automated lockout controls.
- **Immutable audit and integrity:** Tamper-evident audit logging and retention
  controls to support forensic review and regulatory reporting.

### Benefits to viaSport

- **Reduced Risk:** Evaluate a working system before committing.
- **Accelerated Timeline:** 30 weeks to rollout, with time focused on UX
  research and community engagement rather than building core features.
- **Direct Accountability:** Principal-led delivery with no organizational
  layers.
- **Sector Understanding:** Experience leading amateur sport organizations, not
  just building software.
- **Secure and Safe:** Embedding security and privacy by design from day one of
  development.
- **Sustainability:** Serverless architecture and infrastructure as code reduce
  operating overhead.
