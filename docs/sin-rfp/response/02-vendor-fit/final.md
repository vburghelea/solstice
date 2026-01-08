# Vendor Fit to viaSport's Needs

## Company Overview

Austin Wallace Tech is a British Columbia incorporated technology firm (Victoria, BC) delivering Solstice as a managed platform for sport sector reporting and information management.

We operate as a principal-led product team with contracted specialists for security, UX/accessibility, and independent testing. This model provides:

- A single accountable delivery lead (no sales-to-delivery handoff)
- A stable core engineering team
- Elastic specialist capacity for compliance, security testing, and UX validation

| Attribute          | Details                                      |
| ------------------ | -------------------------------------------- |
| Headquarters       | Victoria, British Columbia                   |
| Operating model    | Product team + managed service               |
| Delivery structure | Core delivery pod + specialist partners      |
| Hosting region     | AWS Canada (Central) for primary data stores |
| Primary focus      | Sport sector information management systems  |

## Operating Model

### Delivery Pod

Solstice is delivered through a product team operating model: a consistent delivery pod for implementation and the same team responsible for ongoing operations. This avoids handoffs between "project build" and "ops," and provides clear accountability through rollout and into steady state.

| Function                 | Responsibilities                                                          | Primary                                     |
| ------------------------ | ------------------------------------------------------------------------- | ------------------------------------------- |
| Program & Delivery Lead  | Delivery plan, governance, risk management, stakeholder management        | Austin Wallace                              |
| UX & Accessibility Lead  | UX research, design, accessibility validation, usability testing          | Ruslan Hétu                                 |
| System Navigator         | Connects team to PSO community needs during research and rollout          | Soleil Heaney                               |
| Technical Advisor        | Architecture review, development support, performance engineering         | Will Siddall                                |
| Security & Risk Advisors | Security architecture, control mapping, pen test coordination, compliance | Parul Kharub, Michael Casinha, Tyler Piller |

### Engagement Model

| Role                             | Engagement                       | Phase Coverage                  |
| -------------------------------- | -------------------------------- | ------------------------------- |
| Austin Wallace (Delivery Lead)   | Full-time, accountable           | All phases                      |
| Ruslan Hétu (UX/A11y Lead)       | Full-time UX research and design | All phases                      |
| Soleil Heaney (System Navigator) | Ongoing community liaison        | Research, UAT, rollout          |
| Will Siddall (Technical Advisor) | Part-time during development     | Weeks 11-22                     |
| Security Advisors                | Scheduled reviews at checkpoints | Design freeze, pre-UAT, go-live |

## Service Management and Coverage

viaSport is purchasing an outcome: a platform that performs reliably during reporting cycles, with clear operational ownership.

| Area                  | Approach                                                                                                  |
| --------------------- | --------------------------------------------------------------------------------------------------------- |
| Support model         | In-app support requests + email support with severity-based response targets (see Service Levels section) |
| Monitoring & alerting | 24/7 automated monitoring via AWS CloudWatch with alerting to the service team                            |
| Release management    | Scheduled maintenance windows, versioned releases, and change log reporting to viaSport                   |
| Security operations   | Regular patching cadence, expedited response for critical vulnerabilities, quarterly security reviews     |
| Continuity            | Infrastructure as Code, documented runbooks, tested restore procedures, quarterly DR validation           |
| Escalation            | Clear escalation path for Severity 1 incidents, including immediate triage and customer communications    |

## What Makes This a Low-Risk Procurement Choice

viaSport is not purchasing a one-time "web project." viaSport is purchasing an outcome: a reliable platform that supports ongoing reporting cycles with predictable support, monitoring, and updates.

Solstice is positioned like an enterprise platform engagement:

- viaSport receives a **subscription + managed service** with defined service levels
- viaSport retains **control of its configuration and content** (forms, templates, reporting definitions)
- viaSport retains **full access to its data** with export/portability options at any time
- Continuity and exit risk can be mitigated through **escrow and transition options** (see Exit & Portability Appendix)

### Risk Mitigation Summary

| Risk              | Mitigation                                                                |
| ----------------- | ------------------------------------------------------------------------- |
| Vendor dependency | Source code escrow, data portability, documented runbooks                 |
| Key person risk   | Infrastructure as Code, operational documentation, delivery pod structure |
| Technology risk   | Working prototype validated at scale (20.1M rows, sub-250ms p95)          |
| Delivery risk     | 23 of 25 requirements already built; principal-led with no handoffs       |
| Operational risk  | Defined SLAs, 24/7 monitoring, quarterly DR drills                        |

## Relevant Delivery Portfolio

### Austin Wallace Tech, Selected Relevant Delivery Work

**Project: Legacy modernization (Teck Resources)**

- **Problem:** Replace brittle stored procedure workflows with testable, maintainable pipelines
- **Delivered:** Python-based data workflows and infrastructure as code deployments
- **Ownership:** Data model changes, pipeline logic, Terraform, operational handoff
- **Outcome:** Improved reliability and maintainability, reduced manual intervention
- **Relevance to viaSport:** Mirrors migration from legacy systems to modern, maintainable architecture

**Project: High-volume sports data platform (New Jersey Devils)**

- **Problem:** Process tracking data at game scale for decision support
- **Delivered:** End-to-end data pipelines and dbt models supporting decision workflows
- **Ownership:** Architecture, pipeline implementation, modeling layer, analytics consumers
- **Outcome:** Supported high-stakes decision making and large ingestion volumes (10M+ rows per game)
- **Relevance to viaSport:** Demonstrates ability to deliver reliable analytics at scale in sport sector

**Project: Production data operations (Clio)**

- **Problem:** Establish stable production pipelines with governance and quality controls
- **Delivered:** Databricks pipelines and operational standards
- **Ownership:** Pipeline ownership, quality controls, documentation, operational support
- **Outcome:** Stable production workloads and standardized practices
- **Relevance to viaSport:** Demonstrates operational maturity and production reliability

## Advisory Partner Profiles

Advisory partners provide expertise and review at defined checkpoints.

### Ruslan Hétu, UX and Accessibility Lead

[To be provided by Ruslan Hétu - 2-3 sentences on relevant UX research and accessibility experience]

### Soleil Heaney, System Navigator

[To be provided by Soleil Heaney - 2-3 sentences on relevant sport sector experience and role connecting team to PSO community needs]

### Will Siddall, Technical Advisor

With 15+ years of development and business consulting experience across many industries, Will is ensuring a stable product can be delivered to customers with a focus on customer collaboration and user experience (UX). He's designed, delivered, and trained a variety of products for customers of all types and sizes, with most of his experience developing and delivering products to air-gapped environments.

### Parul Kharub, Security and Risk Advisor

Strategic cybersecurity and risk advisor with 16 years of experience in Fortune 100 companies globally. Led security architecture and governance for a $1B digital transformation at Teck Resources. Managed large-scale cloud transformations at CBSA, aligning 350+ security controls with PIPEDA and ISO 27001. Built Deloitte's global Application Security practice across 43 countries with DevSecOps and "Shift Left" security practices.

### Michael Casinha, Security and Infrastructure Advisor

A seasoned 30 year veteran in the technology space, developing early DevOps practices in the dotcom era of the internet. Working with American banking companies like Bank of America, airline industry with Boeing and cutting edge quantum computing at 1Qbit. The one consistent thread with all the large and small enterprises is applying best practices in DevOps, encompassing agile, secure and consistent deployment practices into securely built and cloud environments in a consistent method.

### Tyler Piller, Security and Compliance Advisor

[To be provided by Tyler Piller - 2-3 sentences on relevant security operations experience]

## Data Ownership and Portability

| Aspect             | Commitment                                                                            |
| ------------------ | ------------------------------------------------------------------------------------- |
| Data Ownership     | viaSport retains full ownership of all data                                           |
| Export Formats     | CSV, Excel, and JSON exports available at any time                                    |
| Data Extraction    | Full database export available on request or contract termination                     |
| Documentation      | Operational runbooks and schema documentation provided                                |
| Source Access      | Source code escrow available; perpetual license to customizations available as option |
| Transition Support | Support available for transition to a replacement system                              |

## Proposed Solution Statement

Austin Wallace Tech proposes the Solstice platform, a purpose-built, reliable, and secure information management system aligned to the Strength in Numbers requirements.

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
- **Predictable Costs:** Term subscription with included enhancement hours.
- **Direct Accountability:** Principal-led delivery with no organizational layers.
- **Sector Understanding:** Experience leading amateur sport organizations, not just building software.
- **Secure and Safe:** Embedding security and privacy by design from day one.
- **Sustainability:** Serverless architecture and infrastructure as code reduce operating overhead.
- **Exit Options:** Data portability, escrow, and transition support available.
