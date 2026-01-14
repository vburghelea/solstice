# Executive Summary

viaSport seeks a new foundational digital layer for sport in British Columbia. Austin Wallace Tech Corporation, a proudly local digital solutions provider, has developed the perfect solution in Solstice.

Solstice is a modern information management platform designed for league and event management. The technology is user-friendly and designed to make day-to-day operations like membership signups, payment, team management, and event registration powerful yet intuitive. The system is designed for easy analytics generation, and data can be integrated and responsibly shared across open-source technologies. APIs can securely push reports on data ranging from tournament attendance estimates to league financial projections to third-party applications in near-real time.

Austin Wallace Tech Corporation is uniquely fit to lead this work. Its founder, Austin Wallace, brings real-world experience as a former member of the Canadian National Quadball team to maximize the system’s value for amateur sports leagues. As a British Columbian in sports, Wallace also has a personal stake in the success of viaSport’s modernization. Wallace and his team are dedicated to bringing the enthusiasm and passion that propelled Wallace to the top tier of Canadian quadball to its client partnerships.

Solstice is a working baseline solution with the ability to handle all 25 requirements in the System Requirements Addendum from Day 1. Austin Wallace Tech Corporation does anticipate customization work to align the product with viaSport’s needs, but the underlying capabilities will be available immediately. By procuring Solstice, viaSport will be investing in a solution in which its specific needs, rather than foundational build work, will be the focus of development. viaSport and Austin Wallace Tech will be free to jointly invest their effort and project time on user experience, discovery, migration accuracy, accessibility validation, operational reliability, and adoption.

Solstice is a Software-as-a-Service (SaaS) solution which allows for easy scaling and AI-native integration. The initial subscription will last for a three-year base term with two optional one-year extensions. A one-time implementation fee will be charged to complete initial viaSport configuration, data migration, User Acceptance Testing (UAT), and rollout. The platform subscription and managed service provisions include hosting, monitoring, security patching, support, ongoing product updates, and up to 200 hours/year of enhancement capacity, with additional hours available on a supplemental basis.

Solstice's Service Level Agreement will provide viaSport clear accountability under its integrated, single-vendor delivery and operations model. Implementation and managed services are bundled into a single package, avoiding annual procurements for hosting and support.

## Standard Assumptions and Security Posture

The statements below apply across this response unless noted.

### 1.1 Data Residency and Privacy Summary

Primary data stores (RDS PostgreSQL, S3 object storage, backups, and audit archives) are hosted in AWS Canada (Central) (ca-central-1). Authenticated content is configured to avoid edge caching. Email notifications are sent via AWS Simple Email Service (SES) in AWS Canada (Central) (ca-central-1). Once delivered to recipients, messages may transit or be stored by external email providers outside AWS.

### 1.2 Security Model Summary

The security model follows the AWS shared responsibility approach: AWS secures the underlying cloud infrastructure, and we implement and operate the application controls, configuration, and monitoring required for viaSport's use case. The platform implements MFA, role-based access control, organization scoping, and an immutable audit log with tamper-evident hashing.

**Encryption layers:**

- **At rest:** AES-256 via AWS KMS for RDS, S3, and backups
- **In transit:** TLS 1.2+ for all API endpoints and database connections
- **Processing controls:** Application-level field encryption for highly sensitive authentication secrets (TOTP/backup codes), stored as encrypted values in PostgreSQL

Security evidence is summarized in **Appendix D: Security Architecture Summary**. AWS compliance reports (SOC, ISO) are available via AWS Artifact upon request.

### 1.3 Prototype and Data Provenance Summary

A working prototype is available for evaluation in the sin-uat environment. No viaSport confidential data was used. Performance testing is run in sin-perf using synthetic data designed to match the scale characteristics described in the RFP. Performance and accessibility evidence is summarized in **Appendix C: Performance Evidence**. Demo access is provided via a secure Evaluator Access Pack (see **Appendix A**), and a 15-minute validation path is provided in the **Prototype Evaluation Guide**.

## At a Glance

| Dimension              | Status                                                                                                         |
| :--------------------- | :------------------------------------------------------------------------------------------------------------- |
| Evaluation environment | Working system available for evaluator validation (See Section 1.3)                                            |
| Requirements coverage  | 25/25 requirements implemented; finalization scope is documented in the Compliance Crosswalk                   |
| Data Used              | See Section 1.3                                                                                                |
| Performance            | 20M rows, p95 162ms, 25 concurrent users, 0 server errors                                                      |
| Security               | See Section 1.2                                                                                                |
| Timeline               | 30 weeks targeting Fall 2026 launch, including a 6-week discovery and UX research phase (See **Project Plan**) |
| Commercial Model       | 3-year base term \+ two optional 1-year extensions (3+1+1)                                                     |
| Total Cost             | 3-year: **$1.2M** / 5-year: **$1.6M** (implementation + subscription)                                          |

## Key Highlights

**Working Evaluation Environment** Evaluators can log into a working system to validate key workflows and requirements prior to award. Access details are in **Appendix A: Prototype Evaluation Access**. The **Prototype Evaluation Guide** provides a 15-minute, requirement-linked walkthrough. See Section 1.3 for the evaluation environment and data provenance summary.

**Requirements Coverage (January 2026 Evaluation Environment)** The evaluation environment fully implements all 25 System Requirements Addendum items. Finalization scope items (viaSport-specific configuration and inputs) are documented in the **System Requirements Compliance Crosswalk**.

**Security and Residency** See Section 1.1 for data residency and privacy, and Section 1.2 for the security model summary and evidence references.

**Managed Service Model** viaSport is procuring an SLA-backed managed service covering uptime, support response targets, and reliability, with Austin Wallace Tech responsible for day-to-day operations. The subscription includes availability/performance/security monitoring, ticket-based support and incident response, security patching, quarterly DR exercises, and 200 hours/year for ongoing enhancements. See **Commercial Model and Pricing** for details.

**Delivery Timeline** The proposed 30-week timeline targets Fall 2026 launch. The timeline is intentionally structured around discovery gates, IA approval, UAT sign-off, and launch readiness, not feature build completion. Because the baseline system is already built, the timeline is allocated to user research, migration accuracy, accessibility validation, and operational readiness.

## Proposed Team

| Role                              | Name                                        |
| :-------------------------------- | :------------------------------------------ |
| Project Lead / Solution Architect | Austin Wallace                              |
| UX and Accessibility Lead         | Ruslan Hétu                                 |
| System Navigator                  | Soleil Heaney                               |
| Technical Advisor                 | Will Siddall                                |
| Security Advisory                 | Parul Kharub, Michael Casinha, Tyler Piller |

Austin Wallace and Ruslan Hétu lead delivery together throughout the project. Soleil Heaney serves as system navigator, connecting the team to PSO community needs during research and rollout. Details on each team member are in **Appendix F: Team Biographies**.

---

# Prototype Evaluation Guide

## Purpose

This prototype (evaluation environment) exists to reduce procurement uncertainty by enabling requirement and workflow validation before contract award. viaSport can evaluate a working system, not just a proposal.

## Data Provenance

**No viaSport confidential data was used.** Performance testing used synthetic data designed to match the scale characteristics described in the RFP:

| Table            | Rows    | Purpose                                |
| :--------------- | :------ | :------------------------------------- |
| audit_logs       | 10.0M   | Realistic audit trail volume           |
| form_submissions | 8.0M    | Simulates 10+ years of PSO submissions |
| notifications    | 2.0M    | Email and in-app notification history  |
| **Total**        | **20M** | Matches RFP 20+ million rows context   |

## Implemented Baseline Capabilities

- Authentication with TOTP MFA and backup codes
- Role-based access control (owner, admin, reporter, viewer)
- Organization-scoped data isolation
- Tamper-evident audit log with hash chain verification
- Form builder with 11 field types including file uploads
- Submission tracking with version history
- Native BI platform (pivot tables, charts, export)
- Import wizard with field mapping, preview, rollback
- S3 storage with Object Lock for immutability
- Retention enforcement and legal hold tooling
- Help center with searchable guides and FAQ
- Support request system with status tracking and SLA targets

## What Will Be Finalized With viaSport

| Item                                                    | Timing                | Dependency                                 |
| :------------------------------------------------------ | :-------------------- | :----------------------------------------- |
| BCAR and BCSI extraction method                         | Discovery (Weeks 1-6) | Legacy system access                       |
| Form templates and reporting metadata                   | Discovery (Weeks 1-6) | viaSport data dictionary                   |
| Branding (logo, colors)                                 | Design (Week 11)      | Brand assets from viaSport                 |
| Program-specific fields (NCCP, contribution agreements) | Design (Weeks 11-18)  | viaSport Subject Matter Expert (SME) input |

## Demo Access

Prototype evaluation credentials are provided via a secure Evaluator Access Pack (see **Appendix A: Prototype Evaluation Access**).

**Contact:** [support@solsticeapp.ca](mailto:support@solsticeapp.ca)

**Environment:** sin-uat (User Acceptance Testing environment with evaluator access and CloudTrail monitoring). Performance testing is run in sin-perf.

**MFA:** Disabled on all demo accounts for convenience. To evaluate the MFA capability, navigate to **Settings > Security** to enroll your own authenticator app.

**Data:** Synthetic only, with environment monitoring enabled (CloudTrail with CIS Benchmark alarms).

## Prototype Placeholders and Items to Be Finalized Post-Award

The prototype is fully functional for the workflows listed in the Requirements Compliance Crosswalk. The following items are content placeholders that will be finalized with viaSport during Discovery (needs assessment/gap analysis):

- Form labels and field names are representative placeholders and will be aligned to viaSport terminology during Discovery
- Sample templates are illustrative; viaSport's reporting templates will be configured during Discovery
- Help-center content will be refined during Discovery based on needs assessment and user research
- Logo and color scheme are placeholders; viaSport branding assets will be applied during Discovery

## 15-Minute Evaluator Walkthrough

This optional walkthrough is provided to help evaluators validate key workflows quickly and consistently.

1. Login, authenticate with email/password
2. Dashboard, observe role-based content (admin vs reporter)
3. Form Builder, create a test form with required fields and file upload
4. Submit Data, complete and submit the form, observe status tracking
5. Version History, edit submission and view change history with attribution
6. Analytics, build a pivot table and export to CSV
7. Audit Logs, review recent actions and verify hash chain integrity
8. Security Dashboard, review recent security events and account lockouts (SEC-AGG-002)
9. Privacy and Retention, view retention policies and legal hold capabilities (SEC-AGG-003)
10. Help Center, search for a topic and view contextual guidance
11. Import Wizard, upload CSV, map fields, preview validation results

## Requirement Validation Crosswalk

| To validate...                  | Requirement | Demo path                                                                 |
| :------------------------------ | :---------- | :------------------------------------------------------------------------ |
| Form building                   | DM-AGG-001  | Dashboard \-\> Forms \-\> Create Form                                     |
| File uploads                    | DM-AGG-001  | Form Builder \-\> Add File Field \-\> Submit                              |
| Import and rollback             | DM-AGG-006  | Dashboard \-\> Admin \-\> Imports \-\> New Import (Smart wizard)          |
| Submission tracking             | RP-AGG-003  | Dashboard \-\> Reporting                                                  |
| Self-service analytics          | RP-AGG-005  | Analytics \-\> New Query \-\> Pivot                                       |
| Export with access control      | RP-AGG-005  | Pivot \-\> Export \-\> Verify scoping                                     |
| MFA authentication              | SEC-AGG-001 | Settings → Security → Enable MFA                                          |
| Role-based access               | SEC-AGG-001 | Compare admin vs reporter dashboards                                      |
| Monitoring and threat detection | SEC-AGG-002 | Admin \-\> Security \-\> Events / Account Locks                           |
| Privacy and compliance controls | SEC-AGG-003 | Admin \-\> Privacy \-\> Retention Policies / Legal Holds, plus Appendix D |
| Audit trail                     | SEC-AGG-004 | Admin \-\> Audit Logs \-\> Filter                                         |
| Hash chain verification         | SEC-AGG-004 | Audit Logs \-\> Verify Integrity                                          |
| Guided walkthroughs             | TO-AGG-002  | Help \-\> Guided Walkthroughs                                             |
| Help center search              | TO-AGG-003  | Help \-\> Search                                                          |
| Support requests                | UI-AGG-006  | Help \-\> Support Request                                                 |

Where evidence is platform-level (for example AWS compliance reports), we provide supporting artifacts through AWS Artifact and standard AWS compliance documentation upon request.

## Platform Baseline Positioning

Solstice is provided as a working baseline so viaSport can evaluate real workflows and requirement compliance before award. This reduces procurement uncertainty and accelerates delivery.

This baseline does not replace discovery. Discovery remains required to confirm:

- viaSport terminology, templates, reporting cycles, and governance rules
- Legacy extraction constraints and migration mappings using real BCAR/BCSI data
- Accessibility and usability validation with real users under real reporting conditions
- Operational policies (retention durations, escalation contacts, support workflows)

What changes because the baseline exists: discovery and UAT start from functioning software, enabling faster alignment, better feedback, and fewer surprises during rollout. Project effort is intentionally spent on adoption, reliability, and migration accuracy, rather than rebuilding foundational features.

---

# Evaluator Navigation Map

This table maps each RFP evaluation criterion to the corresponding section of this response.

| RFP Evaluation Criterion            | Our Response Section                                                                                                 | Notes                                       |
| :---------------------------------- | :------------------------------------------------------------------------------------------------------------------- | :------------------------------------------ |
| Vendor Fit to viaSport's Needs      | **Vendor Fit to viaSport's Needs**                                                                                   | Company profile, team, differentiators      |
| Solution Overview                   | **Solution Overview**                                                                                                | Non-technical workflow summary              |
| Service Approach and Responsiveness | **Service Approach: Data Submission and Reporting Web Portal** through **Service Approach: Training and Onboarding** | Methodology for each scope item             |
| System Requirements Addendum        | **System Requirements Compliance Crosswalk** and detailed requirement sections                                       | Requirement-by-requirement compliance       |
| Service Levels and Reliability      | **Service Levels, Support, and Reliability**                                                                         | SLAs, monitoring, ops commitments           |
| Capabilities and Experience         | **Capabilities and Experience**                                                                                      | Case studies, automation/AI approach        |
| Cost and Value                      | **Commercial Model and Pricing**                                                                                     | Term pricing, TCO, change management        |
| Timeline and Delivery Schedule      | **Project Plan, Timeline, and Delivery Schedule**                                                                    | Milestones, risks, dependencies             |
| Prototype Validation                | **Prototype Evaluation Guide** and **Appendices**                                                                    | Demo access, performance/security summaries |

Austin Wallace Tech welcomes the opportunity to present the prototype and review the approach with viaSport's evaluation team.

---

# Scoring Summary

This section provides a quick reference for how to evaluate each area of the proposal. All 25 RFP requirements are addressed, with most demonstrable in the evaluation environment.

## Compliance Overview

| Category                         | Requirements | Fully Met | Met with Finalization | Evidence Available |
| :------------------------------- | :----------: | :-------: | :-------------------: | :----------------: |
| Data Management (DM-AGG)         |      6       |     6     |           0           |         6          |
| Reporting (RP-AGG)               |      5       |     5     |           0           |         5          |
| Security (SEC-AGG)               |      4       |     4     |           0           |         4          |
| Training and Onboarding (TO-AGG) |      3       |     2     |           1           |         2          |
| User Interface (UI-AGG)          |      7       |     6     |           1           |         6          |
| **Total**                        |    **25**    |  **23**   |         **2**         |       **23**       |

## How to Evaluate

| Evaluation Area         | How to Verify                                                                          |
| :---------------------- | :------------------------------------------------------------------------------------- |
| Functional completeness | Log in to sin-uat and complete the 15-minute walkthrough in Prototype Evaluation Guide |
| Requirement compliance  | Review System Requirements Compliance Crosswalk and per-requirement sections           |
| Security posture        | Review SEC-AGG sections; request AWS Artifact reports for SOC 2/ISO 27001              |
| Performance             | Review Appendix C performance evidence (10M audit log rows, sub-50ms queries)          |
| Team qualifications     | Review Appendix F: Team Biographies                                                    |
| Pricing clarity         | Review Commercial Model and Pricing (all-inclusive, no hidden fees)                    |
| Delivery confidence     | Review Project Plan timeline and case studies in Capabilities and Experience           |

## Items Requiring Finalization

Two requirements require viaSport-specific configuration during the Discovery phase:

| Requirement | Description                   | Finalization Scope                                                     |
| :---------- | :---------------------------- | :--------------------------------------------------------------------- |
| TO-AGG-002  | Guided onboarding walkthrough | Content and role-specific paths defined with viaSport during Discovery |
| UI-AGG-005  | Search and filter navigation  | Filter presets configured based on viaSport terminology and workflows  |

All other requirements are fully met with working implementation in the evaluation environment.

---

# Assumptions and Dependencies

This section consolidates the key assumptions underlying this proposal. Detailed context is provided in the referenced sections.

## Key Assumptions

| Category       | Assumption                                                                       | Reference              |
| :------------- | :------------------------------------------------------------------------------- | :--------------------- |
| Data residency | All primary data stores are in AWS Canada (Central) (ca-central-1)               | Executive Summary §1.1 |
| Security model | AWS shared responsibility model with application-level controls                  | Executive Summary §1.2 |
| Legacy access  | viaSport can provide export capability or schema documentation for BCAR and BCSI | Project Plan           |
| Timeline       | Target go-live Fall 2026; 2 business day data freeze window for cutover          | Project Plan           |
| Parallel run   | Not required; clean cutover with rollback capability                             | Project Plan           |
| Data retention | 7-year default retention, configurable per data type                             | Data Warehousing       |
| MFA policy     | Configurable by viaSport (enforcement level, methods)                            | Security sections      |

## Dependencies on viaSport

| Dependency                         | Timing      | Impact if Delayed          |
| :--------------------------------- | :---------- | :------------------------- |
| Legacy data access (BCAR/BCSI)     | Week 1      | Migration timeline at risk |
| Subject Matter Expert availability | Weeks 1-6   | Research quality reduced   |
| UAT testers                        | Weeks 19-22 | UAT duration extended      |
| PSO coordination                   | Weeks 27-30 | Rollout schedule impacted  |

See **Project Plan: Risks, Assumptions, and Dependencies** for the full risk register and mitigation strategies.

---

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

## Why This Procurement is Straightforward to Evaluate

viaSport is not purchasing a one-time "web project." viaSport is procuring a managed, subscription-based platform service. The subscription includes defined service levels, ongoing support and monitoring, security maintenance, and scheduled enhancements.

Solstice is positioned like an enterprise platform engagement:

- viaSport receives a **subscription \+ managed service** with defined service levels
- viaSport retains **control of its configuration and content** (forms, templates, reporting definitions)
- viaSport retains **full access to its data** with export/portability options at any time
- Continuity and exit risk can be mitigated through **escrow and transition options** (see Exit & Portability Appendix)

### Procurement Certainty Summary

| Concern                    | How We Address It                                                                                                                                            |
| :------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vendor dependency          | Source code escrow, data portability, documented runbooks                                                                                                    |
| Key person continuity      | Infrastructure as code, operational documentation, and a dedicated delivery team structure                                                                   |
| Technology readiness       | Working evaluation environment validated at scale (20M rows, p95 162ms, 25 concurrent users)                                                                 |
| Implementation readiness   | The evaluation environment demonstrates that all 25 requirements are already implemented; delivery is led by a single accountable lead with minimal handoffs |
| Operational accountability | Defined SLA targets, continuous monitoring of uptime/performance/security events, and quarterly disaster recovery exercises                                  |

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

Advisory partners provide expertise and review at defined checkpoints. The team includes:

| Role                                | Advisor         | Focus Area                                     |
| :---------------------------------- | :-------------- | :--------------------------------------------- |
| UX and Accessibility Lead           | Ruslan Hétu     | User research, interface design, accessibility |
| Sports Operations Advisor           | Soleil Heaney   | PSO workflows, governance, user perspective    |
| Technical Advisor                   | Will Siddall    | Architecture, air-gapped deployments           |
| Security and Risk Advisor           | Parul Kharub    | Enterprise security, PIPEDA/ISO compliance     |
| Security and Infrastructure Advisor | Michael Casinha | DevOps, secure deployment practices            |
| Security and Compliance Advisor     | Tyler Piller    | BC Public Sector security, risk management     |

Full biographies for all team members are provided in **Appendix F: Team Biographies**.

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

**1\. Working Baseline, Not a Proposal**

A working baseline is available for evaluation. Most implementations begin with foundational development. Solstice begins with a working baseline aligned to the requirement set, allowing the project timeline to focus on adoption-critical work. It has been load-tested at production scale with 20 million rows.

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

- **Evaluator Validation:** Evaluators can review a working baseline prior to award to validate key workflows and requirements.
- **Predictable Costs:** Term subscription with included enhancement hours.
- **Direct Accountability:** Principal-led delivery with no organizational layers.
- **Sector Understanding:** Direct experience in the B.C. amateur sport sector (including PSOs and community sport organizations), not just software delivery.
- **Secure and Safe:** Embedding security and privacy by design from day one.
- **Sustainability:** Serverless architecture and infrastructure as code reduce operating overhead.
- **Exit Options:** Data portability, escrow, and transition support available.

---

# Solution Overview

## Workflow Summary

The Solstice platform supports the full reporting lifecycle from PSO submission to viaSport oversight and analytics.

1. PSOs submit data through forms, file uploads, or imports.
2. Validation rules check required fields and formatting on submission.
3. Reporting status is tracked with reminders and resubmission workflows.
4. Analytics and dashboards surface trends with role-based access controls.
5. Audit logs capture data changes, exports, and admin actions.

## Multi-Tenant Model

Each organization has isolated data and role-based permissions. viaSport admins can view cross-organization reporting and analytics, while PSOs only access their own records.

## viaSport Administrator Capabilities

- Configure forms and reporting cycles
- Manage organization access and delegated roles
- Monitor submission status and compliance
- Review audit logs and security events
- Set retention policies and legal holds
- Export analytics with audit logging

## PSO Capabilities

- Submit reports and supporting files
- Track submission status and deadlines
- Correct validation errors and resubmit
- View organization-level dashboards
- Export approved datasets within role permissions

## Migration Summary

Legacy data is extracted, mapped, validated, and imported with an auditable trail and rollback support. See **Service Approach: Data Migration** for the detailed migration plan and cutover steps.

---

# Service Approach: Data Submission and Reporting Web Portal

## UX Strategy and Approach

The Solstice portal is designed to make data submission efficient for non-technical administrators. The UX approach is role-based, task-focused, and aligned to reporting deadlines.

| User Group              | Primary Tasks                           | UX Focus                                                 |
| :---------------------- | :-------------------------------------- | :------------------------------------------------------- |
| viaSport Administrators | Oversight, analytics, compliance review | Cross-org dashboards, audit access, admin tools          |
| PSO Reporters           | Data submission, report tracking        | Streamlined forms, progress tracking, deadline awareness |
| Data Stewards           | Data quality, imports                   | Validation tools, error resolution, bulk operations      |

### Role-Based Portal Design

Each user sees a personalized dashboard based on role and organization. The dashboard surfaces relevant actions, pending tasks, and submission status without requiring deep navigation.

### Navigation and Workflow

- **Dashboard-led navigation:** Cards and summaries link directly to forms, reporting tasks, analytics, and support.
- **Command palette:** Keyboard navigation (Cmd or Ctrl plus K) to jump to pages, forms, and records.
- **Contextual links:** Templates, guides, and support appear alongside relevant tasks.

### Responsive Design

The interface adapts to desktop, tablet, and mobile viewports. Core workflows remain available on mobile for reviewers and administrators on the go.

### Accessibility

The interface is built on Radix UI primitives and shadcn/ui components, which provide keyboard navigation and ARIA defaults. Beyond these foundations, we have implemented:

- **Form accessibility:** Error messages are announced to screen readers via live regions. A form error summary component auto-focuses on validation failure and provides clickable links to each error field.
- **Keyboard navigation:** Command palette (Cmd/Ctrl+K) provides keyboard-first navigation. All form controls, buttons, and interactive elements are reachable via Tab.
- **Alternative interaction modes:** The Pivot Builder offers a button-based mode for users who cannot use drag-and-drop, allowing field addition and reordering via accessible buttons.
- **Chart accessibility:** Analytics charts include a "View data table" toggle that reveals a properly structured HTML table for screen reader users. A High Contrast color scheme option ensures 3:1+ minimum contrast for data visualization.

Accessibility evidence is summarized in Section 1.3.

### UX Refinement Process

During Planning and Discovery we will:

- Validate navigation structure against real viaSport workflows
- Identify friction points from legacy system usage
- Refine dashboard widgets to surface the most relevant information
- Apply viaSport branding and terminology

Detailed functional compliance for forms, submissions, and reporting lives in **System Requirements Compliance Crosswalk** (DM-AGG-001 and RP-AGG-003).

## Technology Stack and Benefits

### Frontend

| Technology     | Purpose                    | Benefit                                                         |
| :------------- | :------------------------- | :-------------------------------------------------------------- |
| TanStack Start | Full-stack React framework | Type-safe end-to-end, server-side rendering, file-based routing |
| React 19       | UI library                 | Performance optimizations and modern suspense support           |
| TypeScript     | Type system                | Compile-time error detection and maintainability                |
| Tailwind CSS   | Styling                    | Consistent design system, rapid iteration                       |
| shadcn/ui      | Component library          | Accessible components with full customization control           |

### Backend and Middleware

| Technology                      | Purpose         | Benefit                                                    |
| :------------------------------ | :-------------- | :--------------------------------------------------------- |
| TanStack Start Server Functions | API layer       | Co-located with UI, type-safe, no separate backend service |
| Drizzle ORM                     | Database access | Lightweight, predictable, typed schema mapping             |
| Better Auth                     | Authentication  | MFA support, session management, OAuth integration         |

### Database

| Technology            | Purpose            | Benefit                                         |
| :-------------------- | :----------------- | :---------------------------------------------- |
| PostgreSQL on AWS RDS | Primary data store | Proven enterprise database, tested at 20M+ rows |

### Hosting

| Technology     | Purpose          | Benefit                               |
| :------------- | :--------------- | :------------------------------------ |
| AWS Lambda     | Application tier | Serverless, auto-scaling, pay-per-use |
| AWS CloudFront | CDN              | Edge caching, fast delivery           |
| AWS S3         | Object storage   | Documents, imports, artifacts         |
| AWS SQS        | Message queues   | Reliable notification delivery        |
| AWS SES        | Email            | Transactional email delivery          |

### Analytics

| Technology         | Purpose                | Benefit                                          |
| :----------------- | :--------------------- | :----------------------------------------------- |
| Native BI Platform | Self-service analytics | Built-in tenancy enforcement and audited exports |
| ECharts            | Charting               | Interactive visualizations                       |
| TanStack Table     | Data grids             | Sortable, filterable pivot tables with export    |

### Performance Evidence

Lighthouse and load tests were conducted in the sin-perf environment on 2026-01-08.

| Metric                   | Score or Value | Target | Status |
| :----------------------- | :------------- | :----- | :----- |
| Performance Score        | 90/100         | \>80   | Pass   |
| First Contentful Paint   | 1.0s           | \<1.8s | Pass   |
| Largest Contentful Paint | 1.0s           | \<2.5s | Pass   |
| Time to Interactive      | 1.1s           | \<3.8s | Pass   |
| Cumulative Layout Shift  | 0              | \<0.1  | Pass   |
| Accessibility Score      | 100/100        | \>90   | Pass   |

See Section 1.3 and Appendix C for performance evidence.

---

# Service Approach: Data Warehousing

## Hosting Solution, Tenancy Model, Data Residency, and Regulatory Alignment

### Hosting Solution

Primary data storage and compute run in AWS Canada (Central) (ca-central-1) in a serverless architecture that reduces infrastructure overhead. CloudFront is used for static delivery with authenticated content configured to avoid edge caching.

| Component        | AWS Service       | Purpose                                    |
| :--------------- | :---------------- | :----------------------------------------- |
| Application Tier | Lambda            | Serverless compute, auto-scaling           |
| Database         | RDS PostgreSQL    | Managed relational database                |
| Caching          | ElastiCache Redis | Rate limiting, BI caching, permissions     |
| Object Storage   | S3                | Documents, import files, audit archives    |
| CDN              | CloudFront        | Edge caching, static asset delivery        |
| Message Queue    | SQS               | Asynchronous notification processing       |
| Batch Processing | ECS Fargate       | Large file import processing               |
| Email            | SES               | Transactional email delivery               |
| Scheduling       | EventBridge       | Scheduled jobs for retention and reminders |
| Secrets          | Secrets Manager   | Credential storage (SST-managed)           |
| Encryption Keys  | KMS               | Key management for encryption at rest      |

### Data Residency

Standard data residency assumptions are defined in Section 1.1. The table below lists the specific data stores and regions for this service approach.

| Data Type            | Storage Location      | Region       |
| :------------------- | :-------------------- | :----------- |
| Application database | RDS PostgreSQL        | ca-central-1 |
| Documents and files  | S3                    | ca-central-1 |
| Audit archives       | S3 Deep Archive       | ca-central-1 |
| Backups              | RDS automated backups | ca-central-1 |

**Multi-AZ Architecture:** All production data is hosted in AWS Canada (Central) (ca-central-1). Production infrastructure uses Multi-AZ deployment within ca-central-1 for automatic failover and high availability. This provides fault tolerance across multiple data centers within the same Canadian region while maintaining data residency compliance.

See Section 1.2 for the shared responsibility model and AWS Artifact references.

### Tenancy Model

The platform uses a multi-tenant architecture with strict organization scoping:

- Every query is scoped to the user's organization.
- Role-based access control restricts actions by role.
- Field-level permissions control visibility of sensitive data.
- Cross-organization access requires explicit admin privileges.

### Regulatory Alignment

| Requirement                | Implementation                                                                                                                                                   |
| :------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PIPA and PIPEDA compliance | Canadian data residency, TLS 1.2+ encryption in transit, encryption at rest, access controls, audit logging, data minimization controls                          |
| Transport security         | All APIs served over HTTPS (TLS 1.2+); no unencrypted endpoints                                                                                                  |
| Data minimization          | Configurable retention policies, legal holds, collection limited to necessary purposes                                                                           |
| Right to access            | Data export workflows with audit trail                                                                                                                           |
| Breach notification        | Audit logging and anomaly detection                                                                                                                              |
| Security safeguards        | Reasonable security measures protect personal information from unauthorized access, collection, use, disclosure, copying, modification, disposal, or destruction |

AWS maintains a Data Processing Addendum that covers all services used by the platform, including SES for email delivery: [https://d1.awsstatic.com/legal/aws-dpa/aws-dpa.pdf](https://d1.awsstatic.com/legal/aws-dpa/aws-dpa.pdf)

### Sub-Processors

| Service              | Provider | Purpose                   | Data Residency        |
| :------------------- | :------- | :------------------------ | :-------------------- |
| Cloud infrastructure | AWS      | Hosting, compute, storage | Canada (ca-central-1) |
| Email delivery       | AWS SES  | Transactional emails      | Canada (ca-central-1) |

No additional sub-processors are used.

## Backup, Recovery, and Encryption Standards

### Backup Strategy

| Parameter                | Value                                          |
| :----------------------- | :--------------------------------------------- |
| Backup frequency         | Continuous (point-in-time recovery)            |
| Backup retention         | 35 days in production, 7 days in dev and perf  |
| Backup location          | RDS automated backups, ca-central-1            |
| Cross-region replication | Not enabled (single-region for data residency) |

### Recovery Objectives

| Metric                         | Target              | Evidence                                |
| :----------------------------- | :------------------ | :-------------------------------------- |
| Recovery Point Objective (RPO) | 1 hour (production) | DR exercise 2026-01-08: 0 min achieved  |
| Recovery Time Objective (RTO)  | 4 hours             | DR exercise 2026-01-08: 16 min achieved |

DR exercise type: RDS Point-in-Time Recovery (PITR). No data loss observed. Evidence for the latest DR exercise is summarized in Section 1.3 and Appendix C.

### High Availability

Production uses Multi-AZ for automatic failover. Dev and perf use single-AZ for cost efficiency.

### Encryption Standards

**In Transit:** TLS 1.2+ for all client-server and server-database connections.

**At Rest:** AES-256 via AWS KMS for database storage and S3 objects.

**Application Layer:** Sensitive authentication fields (e.g., TOTP secrets, backup codes) are encrypted before database storage using application-level symmetric encryption with secrets managed in AWS Secrets Manager.

Encryption evidence is summarized in Section 1.2.

### Audit Log Retention and Archival

Audit logs are immutable and archived to S3 Deep Archive based on retention policy configuration. Retention durations and archive schedules will be confirmed with viaSport during Discovery. Legal holds are supported to prevent deletion.

### Why PostgreSQL (Not a Columnar Warehouse)

viaSport's scale of 20M historical rows with 1M rows per year is well within PostgreSQL capability. A dedicated columnar warehouse would add cost and complexity without benefit at this scale.

| Factor                        | PostgreSQL        | Columnar Warehouse          |
| :---------------------------- | :---------------- | :-------------------------- |
| Optimal scale                 | Up to 500M+ rows  | Billions of rows            |
| viaSport projected (10 years) | 30M rows          | 30M rows                    |
| Operational complexity        | Low (managed RDS) | Higher (cluster management) |
| Data freshness                | Real-time         | Requires ETL, often delayed |

PostgreSQL provides real-time analytics and simplified operations while keeping data resident in Canada.

If viaSport later requires a dedicated warehouse for sector-wide benchmarking or very large-scale analytics (250M+ rows), the platform can replicate curated datasets into AWS Redshift without changing the submission system.

---

# Service Approach: Data Migration

## Migration Methodology

### Approach

Migration follows a phased approach that reduces risk and validates data at each stage. BCAR and BCSI remain the source of truth until viaSport signs off on migrated data.

### Migration Phases

| Phase                      | Duration    | Activities                                                          | Exit Criteria              |
| :------------------------- | :---------- | :------------------------------------------------------------------ | :------------------------- |
| Discovery                  | Weeks 1-6   | Obtain sample exports, document legacy schemas, assess data quality | Schema mapping approved    |
| Mapping and Transformation | Weeks 7-10  | Build mapping templates, define validation rules, test with samples | Templates validated        |
| Pilot Migration            | Weeks 11-14 | Migrate subset (one PSO), validate accuracy, refine mappings        | Pilot data verified        |
| Full Migration             | Weeks 15-18 | Migrate organizations, users, submissions, documents                | Reconciliation checks pass |
| Validation and Cutover     | Weeks 19-22 | Full reconciliation, UAT on migrated data                           | Sign-off received          |

### Migration Sequence

1. Organizations and hierarchies
2. Users and role assignments
3. Historical submissions
4. Documents and attachments

### Mapping Process

Mapping templates define source fields, target fields, transformation rules, and validation requirements. Templates are reviewed and approved by viaSport before execution.

### Cleansing

Data quality issues are handled through:

- Format normalization for dates and numeric values
- Enum mapping to align legacy values with new fields
- Duplicate detection and manual review workflows

### Validation

Every imported record is validated against form definitions and required fields. Validation errors are logged with row-level detail for correction.

### Rollback

Imports are tagged with an `import_job_id`. Imports can be rolled back within the configured window (7 days by default) if issues are discovered after load.

## Audit Trail and Success Verification

### Audit Trail

Migration actions are logged with:

- Import job creation, status changes, and completion
- Mapping template creation and updates
- Row-level validation errors
- Rollback events

Import jobs and audit logs provide traceability for each migration run. Retention durations are configurable and will be confirmed with viaSport (confirmed during Discovery).

### Success Verification

Migration success is verified through reconciliation:

| Check                 | Method                                            |
| :-------------------- | :------------------------------------------------ |
| Row counts            | Source count matches target count                 |
| Checksums             | Hash comparison of key fields                     |
| Spot checks           | Manual verification of sample records by viaSport |
| Referential integrity | Foreign keys validated                            |

## Data Quality Targets and Defect Workflow

| Metric                 | Target                           |
| :--------------------- | :------------------------------- |
| Successful import rate | 99%+ of records                  |
| Validation pass rate   | 95%+ on first attempt            |
| Duplicate detection    | 100% of exact duplicates flagged |
| Referential integrity  | 100% of relationships valid      |

Defects are classified by severity and resolved before moving to the next migration phase.

## Technical Infrastructure

### Import Processing

Large imports run in two lanes:

- **Interactive lane:** Validation and import for smaller files inside the app.
- **Batch lane:** ECS Fargate worker for large files in perf and prod; local fallback available in dev.

### Checkpointing and Errors

- Checkpointed processing allows resumable jobs.
- Row-level errors are captured and can be reviewed or re-imported.

## Dependencies on viaSport

Migration execution requires:

1. Legacy system access (export capability or direct database access)
2. Schema documentation for BCAR and BCSI
3. Data dictionary and field mapping approval
4. SME availability for validation and sign-off

Import tooling is ready today. Extraction approach will be finalized during Discovery based on legacy system capabilities. See **System Requirements Compliance Crosswalk** (DM-AGG-006) for detailed compliance mapping.

## Cutover and Change Management

A successful migration includes technical data movement and a managed transition for viaSport staff and PSOs.

### Cutover Approach (Recommended)

| Step                  | Description                                                 | Outcome                                              |
| :-------------------- | :---------------------------------------------------------- | :--------------------------------------------------- |
| Pilot org migration   | Migrate one PSO end-to-end, validate workflow and reporting | Validated templates, mappings, and training approach |
| Migration waves       | Migrate remaining orgs in planned cohorts                   | Manageable support load, reduced risk                |
| Data freeze window    | Short read-only or limited update window on legacy systems  | Prevents last-minute divergence                      |
| Final delta migration | Import changes since last full migration                    | Production data is current                           |
| Go-live               | Solstice becomes system of record, support team on standby  | Controlled launch                                    |
| Hypercare             | Elevated support and daily check-ins for a defined period   | Fast issue resolution, adoption support              |
| Rollback plan         | Predefined rollback criteria and steps                      | Risk control if a blocking issue occurs              |

### Sector Communication and Training

- Publish a cutover calendar (freeze window, go-live date, support contacts).
- Provide role-based quick-start guides and live training sessions.
- Use a ticketing workflow and escalation path during hypercare.

### Downtime and Continuity Expectations

- Document expected downtime (if any) during final cutover.
- If parallel run is required, define duration and responsibilities (who submits where, what is source of truth).

---

# Service Approach: Platform Design and Customization

## Cloud Provider Services

The platform is built on Amazon Web Services in the ca-central-1 (Montreal) region. See Section 1.1 for data residency and privacy summary.

| Service           | Purpose                                    |
| :---------------- | :----------------------------------------- |
| CloudFront        | CDN for static assets and edge caching     |
| Lambda            | Serverless application compute             |
| RDS PostgreSQL    | Managed relational database                |
| ElastiCache Redis | Rate limiting, caching, permissions        |
| S3                | Object storage for documents and imports   |
| SQS               | Message queues for notifications           |
| ECS Fargate       | Batch import processing                    |
| SES               | Transactional email delivery               |
| EventBridge       | Scheduled jobs for retention and reminders |
| CloudWatch        | Metrics, logs, alarms                      |
| CloudTrail        | API audit logging                          |
| Secrets Manager   | Credential storage (SST-managed)           |
| KMS               | Encryption key management                  |

### Why AWS

| Factor           | Rationale                      |
| :--------------- | :----------------------------- |
| Canadian region  | Data residency compliance      |
| Serverless-first | Reduced operational burden     |
| Mature services  | Strong SLAs and documentation  |
| SST integration  | Infrastructure as code for AWS |

### Why Serverless

Serverless provides:

1. No server management or patching
2. Automatic scaling during peak reporting periods
3. Pay-per-use cost efficiency
4. High availability across availability zones

### Infrastructure as Code

Infrastructure is defined in TypeScript using SST. This provides:

- Reproducible environments
- Version control for infrastructure changes
- Disaster recovery from code
- Environment parity across dev, perf, and prod

## Development and Customization Process

### Environment Strategy

| Environment | Purpose                 | Infrastructure Tier                                     |
| :---------- | :---------------------- | :------------------------------------------------------ |
| sin-dev     | Development and testing | t4g.micro, 50 GB, single-AZ                             |
| sin-perf    | Performance testing     | t4g.large, 200 GB, single-AZ, CloudTrail with alarms    |
| sin-uat     | User Acceptance Testing | t4g.medium, 100 GB, single-AZ, CloudTrail with alarms   |
| sin-prod    | Production              | t4g.large, 200 GB, Multi-AZ, 35-day backups, CloudTrail |

Each environment is isolated with its own database, storage, and credentials. The sin-uat environment is available for viaSport evaluator access, while performance testing is executed in sin-perf.

### Development Workflow

Developer writes code

        |

        v

Pre-commit checks (lint, type check, format)

        |

        v

Automated tests

        |

        v

Code review and merge

        |

        v

Deploy to sin-dev (automatic)

        |

        v

Deploy to sin-perf (manual, for load testing)

        |

        v

Deploy to sin-prod (manual, after UAT sign-off)

### Quality Gates

| Gate          | Tooling           | Purpose                        |
| :------------ | :---------------- | :----------------------------- |
| Linting       | oxlint and ESLint | Code quality                   |
| Type checking | TypeScript        | Compile-time validation        |
| Formatting    | oxfmt             | Consistent style               |
| Unit tests    | Vitest            | Component and function testing |
| E2E tests     | Playwright        | Full user flow testing         |

### Deployment Process

Deployments are executed with SST:

npx sst deploy \--stage sin-prod

This builds the application, deploys infrastructure, and updates application services. Database schema changes are applied through versioned migrations when required.

### Rollback

- Previous Lambda versions remain available for quick rollback.
- Database migrations include rollback plans when needed.
- SST maintains deployment history for audit and recovery.

### Customization Capabilities

The platform supports configuration without code changes:

| Customization         | Method                                        |
| :-------------------- | :-------------------------------------------- |
| Branding              | Tenant configuration (logo, colors, name)     |
| Forms                 | Form builder UI for custom data collection    |
| Roles and permissions | Admin UI for role management                  |
| Notifications         | Configurable templates and reminder schedules |
| Retention policies    | Admin-configurable retention periods          |

### Change Management

Changes to production follow a defined process:

1. Change request submitted
2. Impact assessment (scope, risk, timeline)
3. Development and testing in sin-dev
4. Performance validation in sin-perf
5. UAT sign-off
6. Deployment to sin-prod
7. Post-deployment verification

Emergency changes follow an expedited process with retrospective documentation.

---

# Service Approach: Testing and Quality Assurance

## QA Approach

### Testing Layers

| Layer                | Tooling (examples)                                        | Purpose                                  | Frequency                                      |
| :------------------- | :-------------------------------------------------------- | :--------------------------------------- | :--------------------------------------------- |
| Unit and Integration | Vitest \+ Testing Library                                 | Component and function testing           | Every commit                                   |
| End-to-End           | Playwright                                                | Full user flow testing                   | Every commit                                   |
| Accessibility        | Axe-core + Playwright                                     | WCAG 2.1 AA compliance validation        | Every commit                                   |
| Property-Based       | fast-check                                                | Access control and audit integrity       | Every commit                                   |
| Performance          | Lighthouse, k6                                            | Load testing and Core Web Vitals         | Pre-release and before major reporting periods |
| Security (Automated) | SAST \+ SCA (for example CodeQL/Semgrep, Dependabot/Snyk) | Find code and dependency vulnerabilities | Every commit                                   |
| Security (Dynamic)   | DAST (for example OWASP ZAP)                              | Detect runtime web vulnerabilities       | Scheduled and pre-release                      |

### Automated Testing

Automated tests run in CI and gate merges where applicable. Coverage focuses on core workflows: login, data submission, reporting, analytics, and access control. There is also automated security testing, please see below for further details.

### Performance Testing

Performance testing was conducted in sin-perf with production-scale data on 2026-01-08.

| Metric              | Value      | Target           | Status   |
| :------------------ | :--------- | :--------------- | :------- |
| Data volume         | 20M rows   | Production scale | Achieved |
| p95 latency         | 162ms      | \<500ms          | Pass     |
| p50 latency         | 98ms       | N/A              | Pass     |
| Concurrent users    | 25         | N/A              | Pass     |
| Throughput          | 12.3 req/s | N/A              | Pass     |
| Server errors (5xx) | 0          | 0                | Pass     |

Evidence is summarized in Section 1.3 and Appendix C.

### Core Web Vitals

Lighthouse results from sin-perf are recorded in Section 1.3 and Appendix C. Scores: Performance 90/100, FCP 1.0s, LCP 1.0s, TTI 1.1s, CLS 0, Accessibility 100/100.

### Accessibility Testing

Automated accessibility testing validates WCAG 2.1 Level AA compliance:

| Test Type                   | Tooling               | Coverage                                      |
| :-------------------------- | :-------------------- | :-------------------------------------------- |
| Automated scans             | Axe-core + Playwright | Auth flows, dashboard, forms, analytics       |
| Keyboard navigation         | Playwright            | Skip links, focus management, tab order       |
| Screen reader compatibility | Manual verification   | Live regions, ARIA labels, semantic structure |

Accessibility tests run in CI alongside functional tests, preventing regressions from reaching production.

### Security Testing

Security vulnerability scanning runs on every commit to identify issues early followed by scheduled and pre-release scans to identify run-time issues.

Security testing covers authentication, authorization, and audit integrity, plus application vulnerability testing.

**Automated security checks**

- SAST and dependency scanning run in CI on each change to identify common vulnerabilities early.
- DAST runs against a staging environment on a schedule and again prior to major releases.

**OWASP Top 10:2025 coverage**

Our security testing program maps to the OWASP Top 10 categories. The full mapping is provided in **Appendix J: OWASP Top 10:2025 Mapping**.

**Operational monitoring**

In production, application-level detection is combined with AWS monitoring and logging (CloudWatch/CloudTrail) to support detection, alerting, and incident response. High-severity security events (account lockouts, anomaly flags) emit CloudWatch metrics for alerting.

**Functional security testing validates:**

- MFA and password recovery
- Session expiry and step-up authentication
- Role-based access enforcement
- Audit log integrity and hash chain verification
- Account lockout and anomaly detection

Security evidence is summarized in Section 1.2.

### Defect Management

| Severity | Definition                             | Response Time |
| :------- | :------------------------------------- | :------------ |
| Critical | Security vulnerability, data loss risk | Immediate     |
| High     | Core functionality broken              | Same day      |
| Medium   | Non-critical functionality affected    | Within sprint |
| Low      | Cosmetic or minor UX issues            | Backlog       |

Defects are tracked in a shared system accessible to viaSport.

## User Acceptance Testing Strategy

### UAT Approach

User Acceptance Testing validates that the platform meets viaSport requirements from the user perspective.

| Element       | Approach                                         |
| :------------ | :----------------------------------------------- |
| Environment   | sin-uat for UAT; performance testing in sin-perf |
| Access        | Role-based test accounts for viaSport testers    |
| Visibility    | Test scenarios mapped to requirement IDs         |
| Communication | Weekly demos and visible ticketing               |

### UAT Timeline

| Week   | Focus                                                   |
| :----- | :------------------------------------------------------ |
| Week 1 | Core workflows: login, navigation, data submission      |
| Week 2 | Reporting and analytics: dashboards, exports, queries   |
| Week 3 | Administration: user management, configuration, imports |
| Week 4 | Edge cases, regression testing, sign-off preparation    |

### Test Scenarios

| Category        | Example Scenarios                                   |
| :-------------- | :-------------------------------------------------- |
| Data Management | Submit form, upload file, run import, validate data |
| Reporting       | Track submission status, run analytics, export data |
| Security        | Login, verify access, review audit log              |
| Training        | Complete walkthrough, search help center            |
| UI              | Navigate dashboard, receive notification            |

### Sign-Off Criteria

UAT sign-off requires:

1. All critical and high severity defects resolved
2. Test scenarios executed with documented results
3. No blocking issues for go-live
4. Written sign-off from viaSport project sponsor

After UAT sign-off, the platform is promoted to production and monitoring is enabled.

---

# Service Approach: Training and Onboarding

## Audience-Based Training Approach

Training is tailored to distinct user groups with different responsibilities.

| Audience                | Role                                       | Training Focus                                |
| :---------------------- | :----------------------------------------- | :-------------------------------------------- |
| viaSport Administrators | Platform oversight, analytics, PSO support | Admin tools, cross-org reporting, governance  |
| PSO Reporters           | Data submission, compliance                | Form completion, file uploads, deadlines      |
| Data Stewards           | Data quality, imports                      | Validation, error resolution, bulk operations |

### Training Delivery Model

| Method                     | Audience                    | Format                                |
| :------------------------- | :-------------------------- | :------------------------------------ |
| In-app guided walkthroughs | All users                   | Interactive tours inside the platform |
| Live training sessions     | viaSport admins, PSO admins | Video workshops and Q and A           |
| Train-the-trainer          | viaSport staff              | Enable viaSport to support PSOs       |
| Self-service help center   | All users                   | Searchable guides, FAQ, templates     |

### Training Phases

| Phase                   | Timing      | Participants       | Content                                    |
| :---------------------- | :---------- | :----------------- | :----------------------------------------- |
| viaSport Admin Training | Weeks 27-28 | viaSport staff     | Full platform capabilities and admin tools |
| Soft Launch Training    | Week 29     | Pilot cohort PSOs  | Core workflows with intensive support      |
| PSO Rollout Training    | Week 30     | PSO administrators | Core workflows and reporting               |
| Ongoing                 | Post-launch | All users          | Refreshers and new features                |

### PSO Rollout Cohorts

Cohort sizing and scheduling will be confirmed with viaSport during Planning (confirmed during Discovery).

## Resources and Sample Training Materials

### In-App Training Features

| Feature             | Description                               |
| :------------------ | :---------------------------------------- |
| Guided walkthroughs | Step-by-step tutorials for common tasks   |
| Onboarding tour     | First-time user walkthrough of key areas  |
| Progress tracking   | Per-user tracking of completed tutorials  |
| Contextual help     | Help icons and tooltips throughout the UI |

### Help Center

The help center provides searchable guides and FAQs by role:

| Content Type           | Examples                                               |
| :--------------------- | :----------------------------------------------------- |
| Getting started guides | Account setup, first login, dashboard overview         |
| How-to articles        | Submit a form, upload a file, export data              |
| FAQ                    | Common questions organized by category                 |
| Troubleshooting        | Login issues, validation errors, browser compatibility |

### Templates Hub

Templates are centrally managed and available in context:

| Template Type       | Purpose                                      |
| :------------------ | :------------------------------------------- |
| Import templates    | CSV and Excel templates with correct headers |
| Form templates      | Example submissions and expected formats     |
| Reporting templates | Sample reporting configurations and exports  |

### Documentation Formats

| Format             | Use Case                              |
| :----------------- | :------------------------------------ |
| In-app interactive | Primary delivery, always current      |
| PDF guides         | Offline reference                     |
| Video tutorials    | Visual learners and complex workflows |

Sample training materials will be reviewed with viaSport during Planning (confirmed during Discovery).

## Help Desk and Ticketing Model

The table below covers help desk inquiries (questions, how-to, bug reports). System incidents (Sev 1-4) follow the SLA response targets in **Service Levels, Support, and Reliability**.

### Support Tiers

| Tier   | Channel                 | Scope                         | Response |
| :----- | :---------------------- | :---------------------------- | :------- |
| Tier 1 | In-app support requests | General questions, how-to     | 24 hours |
| Tier 2 | Email                   | Technical issues, bug reports | 24 hours |
| Tier 3 | Direct escalation       | System incidents              | See SLA  |

### Support Hours

| Coverage        | Hours                                                 |
| :-------------- | :---------------------------------------------------- |
| Standard        | Business hours, Pacific Time (Mon to Fri, 9am to 5pm) |
| Critical issues | Business hours with monitoring alerts                 |

24/7 support is available as an optional add-on.

### Ticket Workflow

User submits request

        |

        v

Ticket created with unique ID

        |

        v

Support team reviews and assigns

        |

        v

Response provided (in-app and email)

        |

        v

User can reply or mark resolved

        |

        v

Ticket closed

### Response Commitments (Help Desk Inquiries)

| Priority | First Response | Target Resolution |
| :------- | :------------- | :---------------- |
| High     | 8 hours        | 2 business days   |
| Standard | 24 hours       | 5 business days   |
| Low      | 48 hours       | 10 Business Days  |

System incidents (Sev 1-4) follow the response targets in **Service Levels, Support, and Reliability** (Sev 1: 60-minute acknowledgement, escalation to delivery lead). Resolution targets depend on issue complexity and may require additional time for root-cause analysis.

viaSport receives monthly support reports covering ticket volume, response times, and trends.

---

# Service Levels, Support, and Reliability

viaSport is procuring an SLA-backed managed service: a platform that performs reliably during reporting cycles, with clear operational ownership. This section defines the service level commitments included in the Platform Subscription + Managed Service.

## Availability and Uptime

| Metric                        | Target                                                                         |
| :---------------------------- | :----------------------------------------------------------------------------- |
| Monthly availability target   | 99.9% (excluding scheduled maintenance)                                        |
| Scheduled maintenance windows | Communicated 7 days in advance; typically during low-usage periods             |
| Emergency maintenance         | Critical security or stability issues only; immediate notification to viaSport |

Availability is measured as the percentage of time the production application is accessible and functional during each calendar month.

## Monitoring and Alerting

| Capability                | Implementation                                                                                                                      |
| :------------------------ | :---------------------------------------------------------------------------------------------------------------------------------- |
| Application monitoring    | 24/7 automated monitoring of application health, response times, and error rates                                                    |
| Infrastructure monitoring | AWS CloudWatch metrics for compute, database, storage, and network                                                                  |
| Security monitoring       | CloudTrail audit logging with Center for Internet Security (CIS) Benchmark alarms (root usage, IAM changes, security group changes) |
| Alerting                  | Automated alerts to service team for threshold breaches and anomalies                                                               |
| Status communication      | Proactive notification to viaSport for incidents affecting service                                                                  |

## Incident Response

### Severity Definitions

| Severity          | Definition                                                                 | Examples                                                                        |
| :---------------- | :------------------------------------------------------------------------- | :------------------------------------------------------------------------------ |
| Sev 1 \- Critical | System unavailable or major security incident; significant business impact | Production down, data breach, complete loss of core functionality               |
| Sev 2 \- High     | Major function impaired; workaround may exist but impacts productivity     | Reporting unavailable during deadline period, login failures for multiple users |
| Sev 3 \- Medium   | Issue affecting users but workaround available                             | Single feature not working, performance degradation, minor UI issues            |
| Sev 4 \- Low      | Minor issue or cosmetic defect; minimal business impact                    | Typo, minor styling issue, enhancement request                                  |

### Response and Resolution Targets

| Severity         | First Response | Target Resolution | Escalation                                                                                   |
| :--------------- | :------------- | :---------------- | :------------------------------------------------------------------------------------------- |
| Sev 1 - Critical | 60 minutes     | Same business day | Immediate escalation to delivery lead; updates to viaSport every 60 minutes until mitigation |
| Sev 2 \- High    | 8 hours        | 2 business days   | Escalation if no progress in 24 hours                                                        |
| Sev 3 \- Medium  | 24 hours       | 5 business days   | Standard workflow                                                                            |
| Sev 4 \- Low     | 48 hours       | 10 Business Days  | Standard workflow                                                                            |

**Business hours:** Monday to Friday, 9:00 AM to 5:00 PM Pacific Time, excluding BC statutory holidays.

**Sev 1 acknowledgement is 24/7; Sev 2–4 response targets apply during business hours.** Monitoring is 24/7 in all cases.

**Note:** Resolution targets depend on issue complexity and may require additional time for root-cause analysis. viaSport will be kept informed of progress and revised estimates.

### 24/7 Support Option

24/7 response coverage is available as an optional add-on ($30,000-$50,000/year). This provides:

- After-hours monitoring with on-call response
- Sev 1 response target reduced to 2 hours
- Weekend and holiday coverage

## Support Channels

| Channel                                                         | Use Case                                    | Response                                             |
| :-------------------------------------------------------------- | :------------------------------------------ | :--------------------------------------------------- |
| In-app support requests                                         | General questions, how-to, feature requests | Ticket created with unique ID; tracked to resolution |
| Email ([support@solsticeapp.ca](mailto:support@solsticeapp.ca)) | Technical issues, bug reports, escalations  | Same ticketing workflow                              |
| Emergency contact                                               | Sev 1 incidents only                        | Direct phone/text to delivery lead                   |

### Support Workflow

1. User submits request (in-app or email)
2. Ticket created with unique ID and severity assignment
3. Acknowledgement sent to user
4. Service team triages and assigns
5. Response provided (in-app notification and email)
6. User can reply or mark resolved
7. Ticket closed with resolution summary

viaSport receives monthly support reports covering ticket volume, response times, resolution rates, and trends.

## Backup and Recovery

| Parameter                      | Commitment                                       |
| :----------------------------- | :----------------------------------------------- |
| Backup frequency               | Continuous (point-in-time recovery enabled)      |
| Backup retention               | 35 days in production                            |
| Recovery Point Objective (RPO) | 1 hour                                           |
| Recovery Time Objective (RTO)  | 4 hours                                          |
| DR exercise frequency          | Quarterly                                        |
| DR exercise reporting          | Results reported to viaSport after each exercise |

### High Availability

Production environment uses Multi-AZ deployment for automatic failover. Database and application tiers are distributed across multiple availability zones within AWS Canada (Central).

## Security Operations

| Activity                     | Cadence                                                       |
| :--------------------------- | :------------------------------------------------------------ |
| Security patching (routine)  | Monthly, during scheduled maintenance windows                 |
| Security patching (critical) | Within 2 business days of vendor patch availability           |
| Dependency updates           | Monthly review; immediate for security-related updates        |
| Security reviews             | Quarterly review of access controls, configurations, and logs |
| Penetration testing          | Available as optional add-on (see Commercial Model)           |

## Release Management

| Aspect              | Approach                                                        |
| :------------------ | :-------------------------------------------------------------- |
| Release cadence     | Periodic releases based on roadmap; security patches as needed  |
| Release notes       | Provided to viaSport before each release                        |
| Staging validation  | All releases validated in staging environment before production |
| Rollback capability | Immediate rollback available if issues detected post-release    |
| Change log          | Maintained and accessible to viaSport administrators            |

## Reporting to viaSport

viaSport will receive regular operational reports:

| Report              | Frequency | Contents                                                |
| :------------------ | :-------- | :------------------------------------------------------ |
| Support summary     | Monthly   | Ticket volume, response times, resolution rates, trends |
| Availability report | Monthly   | Uptime percentage, incidents, maintenance windows       |
| Security summary    | Quarterly | Patching status, security reviews, any incidents        |
| DR exercise results | Quarterly | Exercise execution, recovery times achieved, any issues |

## Service Level Governance

### Review Cadence

- **Monthly:** Operational review (support metrics, availability, upcoming maintenance)
- **Quarterly:** Service review (SLA performance, security posture, roadmap alignment)
- **Annual:** Contract review (renewal terms, service level adjustments, pricing)

### Escalation Path

| Level   | Contact                        | Trigger                                        |
| :------ | :----------------------------- | :--------------------------------------------- |
| Level 1 | Support team                   | All tickets                                    |
| Level 2 | Technical lead (Will Siddall)  | Sev 1-2 incidents, complex technical issues    |
| Level 3 | Delivery lead (Austin Wallace) | Sev 1 incidents, escalations, service concerns |

### Service Credits

Service credits apply when the monthly availability target is missed. Credits are applied to the following quarter's invoice based on the schedule below:

| Monthly Availability | Credit                      |
| :------------------- | :-------------------------- |
| 99.0% \- 99.9%       | 5% of monthly subscription  |
| 95.0% \- 99.0%       | 10% of monthly subscription |
| Below 95.0%          | 25% of monthly subscription |

Credits are applied to the following quarter's invoice upon viaSport request with documented evidence of downtime.

---

_Full service level terms can be incorporated into a formal SLA schedule as part of the contract._
