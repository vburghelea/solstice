# Vendor Fit to viaSport's Needs

## Company Overview

Austin Wallace Tech is a British Columbia limited company (Victoria, BC; incorporated 2025) delivering Solstice as a managed platform for sport sector reporting and information management.

We operate with a single accountable delivery lead and a small core product team, augmented by specialist advisors for security, UX/accessibility, and independent testing. This model provides:

- A single accountable delivery lead from proposal through delivery (no handoff between sales and implementation teams)
- A stable core delivery pod: 1 full-time principal supported by 6 named contracted specialists
- On-demand specialist capacity for compliance, security testing, and UX validation

| Attribute          | Details                                                                                                                                                      |
| :----------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Headquarters       | Victoria, British Columbia                                                                                                                                   |
| Incorporated       | 2025 (BC Limited Company, BN 748709839BC0001)                                                                                                                |
| Team size          | 1 principal (Project Lead/Solution Architect) + 6 specialist advisors (UX/accessibility, sport operations, technical advisory, security/compliance advisory) |
| Operating model    | Product team \+ managed service                                                                                                                              |
| Delivery structure | Core delivery pod \+ specialist partners                                                                                                                     |
| Hosting region     | AWS Canada (Central) for primary data stores                                                                                                                 |
| Primary focus      | Sport sector information management systems                                                                                                                  |

## Operating Model

### Delivery Pod

Solstice is delivered through a product team operating model: a consistent delivery pod for implementation and the same team responsible for ongoing operations. This avoids handoffs between "project build" and "ops," and provides clear accountability through rollout and into steady state.

| Function                                 | Responsibilities                                                                                                           | Primary                                     |
| :--------------------------------------- | :------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------ |
| Program & Delivery Lead                  | Delivery plan, governance, risk management, stakeholder management                                                         | Austin Wallace                              |
| UX & Accessibility Lead                  | UX research, design, accessibility validation, usability testing                                                           | Ruslan Hétu                                 |
| Sports Operations and Governance Advisor | Connects team to Provincial Sport Organization (PSO) community needs during research and rollout; acts as system navigator | Soleil Heaney                               |
| Technical Advisor                        | Architecture review, development support, performance engineering                                                          | Will Siddall                                |
| Security & Risk Advisors                 | Security architecture, control mapping, pen test coordination, compliance                                                  | Parul Kharub, Michael Casinha, Tyler Piller |

### Engagement Model

| Role                                                     | Engagement                                                                                                           | Phase Coverage                                        |
| :------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------- |
| Austin Wallace (Delivery Lead)                           | Full-time, accountable                                                                                               | All phases                                            |
| Ruslan Hétu (UX/A11y Lead)                               | Full-time UX research and design                                                                                     | All phases                                            |
| Soleil Heaney (Sports Operations and Governance Advisor) | Ongoing sector liaison: coordinates with PSOs to validate workflows, templates, and change-management communications | Research, UAT, rollout                                |
| Will Siddall (Technical Advisor)                         | Part-time during development                                                                                         | Weeks 11-22                                           |
| Security Advisors                                        | Formal checkpoint reviews at key milestones                                                                          | Design finalization, UAT readiness, Go-Live readiness |

## Service Management and Coverage

viaSport is procuring an SLA-backed managed service: a platform that performs reliably during reporting cycles, with clear operational ownership.

| Area                  | Approach                                                                                                                                                                                                    |
| :-------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Support model         | In-app support requests \+ email support with severity-based response targets (see Service Levels section)                                                                                                  |
| Monitoring & alerting | 24/7 automated monitoring via AWS CloudWatch with alerting to the service team                                                                                                                              |
| Release management    | Scheduled maintenance windows (7 days advance notice; emergency maintenance on shorter notice with immediate viaSport notification), versioned releases, and change log reporting to viaSport               |
| Security operations   | Monthly routine patching; critical security patches within 2 business days of vendor patch availability; quarterly security reviews                                                                         |
| Continuity            | Infrastructure as code (environment configuration stored as code for reproducibility and disaster recovery), documented runbooks, tested restore procedures, quarterly disaster recovery validation         |
| Escalation            | Defined escalation path for Severity 1 incidents: acknowledgement within 60 minutes, direct phone/text escalation to delivery lead, updates provided to viaSport at least every 60 minutes until mitigation |

## What Makes This a Low-Risk Procurement Choice

viaSport is not purchasing a one-time "web project." viaSport is procuring a managed, subscription-based platform service. The subscription includes defined service levels, ongoing support and monitoring, security maintenance, and scheduled enhancements.

Solstice is positioned like an enterprise platform engagement:

- viaSport receives a **subscription \+ managed service** with defined service levels
- viaSport retains **control of its configuration and content** (forms, templates, reporting definitions)
- viaSport retains **full access to its data** with export/portability options at any time
- Continuity and exit risk can be mitigated through **escrow and transition options** (see Exit & Portability Appendix)

### Risk Mitigation Summary

| Risk              | Mitigation                                                                                                                                  |
| :---------------- | :------------------------------------------------------------------------------------------------------------------------------------------ |
| Vendor dependency | Source code escrow, data portability, documented runbooks                                                                                   |
| Key person risk   | Infrastructure as code, operational documentation, and a dedicated delivery team structure                                                  |
| Technology risk   | Working prototype validated at scale (20.1M rows, ≤250ms p95)                                                                               |
| Delivery risk     | The prototype demonstrates that 23 of 25 requirements are already built; delivery is led by a single accountable lead with minimal handoffs |
| Operational risk  | Defined SLA targets, continuous monitoring of uptime/performance/security events, and quarterly disaster recovery exercises                 |

## Relevant Delivery Portfolio

### Austin Wallace Tech, Selected Relevant Delivery Work

**Project: Legacy modernization (Teck Resources)**

- **Problem:** Replace brittle stored procedure workflows with testable, maintainable pipelines
- **Delivered:** Python-based data workflows and infrastructure as code deployments
- **Ownership:** Data model changes, pipeline logic, Terraform, operational handoff
- **Outcome:** Improved reliability and maintainability, reduced manual intervention
- **Relevance to viaSport:** Mirrors migration from legacy systems to modern, maintainable architecture

**Project: High-volume sports data platform (New Jersey Devils)**

- **Problem:** Process tracking data at game/event scale to support operational decision-making
- **Delivered:** End-to-end data pipelines and dbt models powering analytics and reporting used in operational decision-making
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

Ruslan Hétu brings 6 years of mixed-methods research and design experience across public sector, healthcare and startup environments. As Founding Designer at Parafoil, he led all user interface and user research for an AI product from ideation to alpha development and launch. He conducted UX research with over 50+ users and collaborated cross-functionally to translate complex data into intuitive and accessible dashboard experiences. His research experience extends to facilitating co-design sessions both digitally and in person with 200+ participants, supervising research teams, and applying systems thinking and foresight to executive level workshops.

### Soleil Heaney, Sports Operations and Governance Advisor

Soleil Heaney has been involved in the sports industry for 10 years. Her work as the Executive Director with Quadball Canada, Manager of Member Services with BC Soccer, General Manager of Victoria Ultimate and President of several local sports club Boards gives her a unique perspective of the needs of sports governing bodies.

### Will Siddall, Technical Advisor

With 15+ years of development and business consulting experience across many industries, Will is ensuring a stable product can be delivered to customers with a focus on customer collaboration and user experience (UX). He's designed, delivered, and trained a variety of products for customers of all types and sizes, with most of his experience developing and delivering products to air-gapped environments.

### Parul Kharub, Security and Risk Advisor

Strategic cybersecurity and risk advisor with 16 years of experience in Fortune 100 companies globally. Led security architecture and governance for a $1B digital transformation at Teck Resources. Managed large-scale cloud transformations at CBSA, aligning 350+ security controls with PIPEDA and ISO 27001\. Built Deloitte's global Application Security practice across 43 countries with DevSecOps and "Shift Left" security practices.

### Michael Casinha, Security and Infrastructure Advisor

Michael Casinha is a technology leader with 30 years of experience in DevOps, security, and infrastructure. He has supported teams in regulated and high-security environments—including financial services (Bank of America), aerospace (Boeing), and emerging computing (1QBit)—with a focus on secure, repeatable deployment practices and operational resilience.

### Tyler Piller, Security and Compliance Advisor

With over a decade of cybersecurity expertise in the BC Public Sector, Tyler bridges the critical gap between Security Operations and Risk Management. He has directed high-stakes initiatives ranging from major incident response and digital forensics to large-scale cloud infrastructure migrations and transformations. Currently, Tyler leads the Information Security Risk Management program, providing strategic advisory to align technical risk with enterprise business objectives.

## Data Ownership and Portability

| Aspect             | Commitment                                                                            |
| :----------------- | :------------------------------------------------------------------------------------ |
| Data Ownership     | viaSport retains full ownership of all data                                           |
| Export Formats     | CSV, Excel, and JSON exports available at any time                                    |
| Data Extraction    | Full database export available on request or contract termination                     |
| Documentation      | Operational runbooks and schema documentation provided                                |
| Source Access      | Source code escrow available; perpetual license to customizations available as option |
| Transition Support | Support available for transition to a replacement system                              |

## Proposed Solution Statement

Austin Wallace Tech proposes the Solstice platform, a purpose-built, reliable, and secure information management system aligned to the Strength in Numbers requirements.

### Key Differentiators

**1\. Working Prototype, Not a Proposal**

A functional prototype is available for evaluation and fully implements 23 of 25 (92%) System Requirements Addendum items. It has been load-tested at production scale with 20.1 million rows.

**2\. Principal-Led Delivery**

The architect and primary developer of the prototype will lead delivery. This reduces knowledge transfer risk and provides direct accountability.

**3\. Domain Expertise in Sport Data**

The team combines enterprise data engineering and security with direct amateur sport sector operations experience, including PSO executive leadership, ensuring the platform reflects how sport organizations actually work.

**4\. Primarily BC-Based, Canadian Delivery**

Austin Wallace Tech is headquartered in Victoria, BC. Delivery is led from BC, with Canadian distributed specialists (including UX/accessibility) supporting research, design, and validation. We are available for in-person sessions in BC as needed.

**5\. Canadian Data Residency**

See Section 1.1, Data Residency and Privacy Summary.

**6\. Security and Privacy by Design**

Security and privacy are built into delivery from discovery through operations. See Section 1.2, Security Model Summary.

Our approach aligns with OWASP application security practices, including the OWASP Top 10 and OWASP ASVS as a verification framework.

**Security by Design Approach**

- **Security requirements up front:** Define security and privacy requirements during discovery (access control, retention, audit, monitoring), then validate them in the prototype and UAT.
- **Threat modeling:** Run threat modeling for the core workflows (authentication, imports, exports, delegated access) and track mitigations as delivery items.
- **Shift-left DevSecOps:** Automated code and dependency scanning in CI so issues are found before deployment.
- **Zero-trust access model:** MFA, RBAC, and organization scoping enforced server-side for all data access.
- **Data protection and Canadian hosting region:** See Section 1.1.
- **Monitoring and anomaly response:** Detect suspicious authentication patterns, alert administrators, and apply automated lockout controls.
- **Immutable audit and integrity:** Tamper-evident audit logging and retention controls to support forensic review and regulatory reporting.

### Benefits viaSport

- **Evaluator Validation:** Evaluators can review a working prototype prior to award to validate key workflows and requirements.
- **Predictable Costs:** Term subscription with included enhancement hours.
- **Direct Accountability:** Principal-led delivery with no organizational layers.
- **Sector Understanding:** Direct experience in the B.C. amateur sport sector (including PSOs and community sport organizations), not just software delivery.
- **Secure and Safe:** Embedding security and privacy by design from day one.
- **Sustainability:** Serverless architecture and infrastructure as code reduce operating overhead.
- **Exit Options:** Data portability, escrow, and transition support available.

---
