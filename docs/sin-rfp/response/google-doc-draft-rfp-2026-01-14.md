# **_Executive Summary_** {#executive-summary}

viaSport seeks a new foundational digital layer for sport in British Columbia. Austin Wallace Tech Corporation, a Victoria-based digital solutions provider, proposes Solstice, a managed information platform for data collection, reporting, and analytics in the sport sector.

Solstice is a modern information management platform designed for sport-sector reporting, analytics, and governance. The technology is user-friendly and designed to make data submission, compliance tracking, and cross-organization analytics powerful yet intuitive. The system is designed for easy analytics generation, and data can be integrated and responsibly shared across open-source technologies. APIs can securely push reports on data ranging from participation trends to funding allocations to third-party applications in near-real time.

Austin Wallace Tech Corporation is uniquely fit to lead this work. Its founder, Austin Wallace, brings real-world experience as a former member of the Canadian National Quadball team to maximize the system's value for amateur sports leagues. As a British Columbian in sports, Wallace also has a personal stake in the success of viaSport's modernization. Wallace and his team are dedicated to bringing the same drive that propelled Wallace to globally leading the sport of quadball and making a major impact at the NHL to viaSport's modernization.

Solstice is a working baseline solution with the ability to handle all 25 requirements in the System Requirements Addendum from Day 1\. Austin Wallace Tech Corporation does anticipate customization work to align the product with viaSport’s needs, but the underlying capabilities will be available immediately. By procuring Solstice, viaSport will be investing in a solution in which its specific needs, rather than foundational build work, will be the focus of development. viaSport and Austin Wallace Tech will be free to jointly invest their effort and project time on user experience, discovery, migration accuracy, accessibility validation, operational reliability, and adoption.

Solstice is a Software-as-a-Service (SaaS) solution which allows for easy scaling and AI-native integration. The initial subscription will last for a three-year base term with two optional one-year extensions. A one-time implementation fee will be charged to complete initial viaSport configuration, data migration, User Acceptance Testing (UAT), and rollout. The platform subscription and managed service provisions include hosting, monitoring, security patching, support, ongoing product updates, and up to 200 hours/year of enhancement capacity, with additional hours available on a supplemental basis.

Solstice's Service Level Agreement will provide viaSport clear accountability under its integrated, single-vendor delivery and operations model. Implementation and managed services are bundled into a single package, avoiding annual procurements for hosting and support.

## **Solution Overview**

Solstice is a cloud-hosted platform with its artifacts and user data stored in AWS’s Canada-Central-1 region. AWS cloud storage is the gold standard for cloud hosting and allows Solstice to scale easily. The platform is capable of replacing viaSport’s data collection system in its entirety.

The platform is built by athletes who care deeply about sports governance and data. Solstice delivers analytics tuned for the realities of sport administration, not generic business dashboards. A PSO executive director can track their annual submission compliance at a glance. viaSport staff can compare participation growth across sports, identifying where women's programs are thriving and where investment gaps remain. Funding analysts can model how provincial grants flow to different regions and disciplines. And when the Ministry asks about sport's impact on British Columbians, the data is ready: participation trends, regional coverage, and program reach, without weeks of manual spreadsheet assembly.

Solstice's user experience is, by default, convenient and effective. However, to maximize user adoption, Austin Wallace Tech will work with viaSport to customize the UX to match viaSport workflows, making submitting reports as easy as possible for organizations. A working evaluation environment is available for review:

Demo access: [https://sinuat.solsticeapp.ca](https://sinuat.solticeapp.ca)  
Username: [viasport-staff@demo.com](mailto:viasport-staff@demo.com)  
Password: demopassword123  
Additional detail and a guided evaluation walkthrough are available in \*\*Appendix A: Prototype Evaluation Access\*\*.

The solution is built on a modern, extensible architecture. New modules and functionality can be delivered quickly once prioritized through viaSport's governance process. API integration enables streamlined data exchange with external systems as needed.

## **Solution Specifics**

- Solstice offers a fully-developed and ready-to-implement website portal capable of handling user-driven reporting and data submission. While the portal is sleek and operational out of the gate, the portal is fully configurable to the needs of viaSport.
- The system’s integration with AWS will allow for easy data storage and warehousing for both viaSport’s historical data and its ongoing data needs.
- Historical data will be imported in five migration phases (discovery, mapping, pilot migration, full migration, and validation) and is expected to be completed by week 22\. A full breakdown of the migration stages can be found in the Service Approach section.
- The platform is fully realized at present, but can continue to be customized and designed for viaSport’s needs. For information about the cloud environment, security and access model, full system architecture, and process automations, see [Service Approach: Data Submission and Web Reporting Portal](#service-approach:-data-submission-and-reporting-web-portal).
- Testing and quality assurance is integrated by default into the Austin Wallace Tech workflow. Examples of system security protocols, user acceptance testing, and defect resolution can be found in the UX Strategy and Approach section and the Backup, Recover, and Encryption sections.
- Great software is nothing without an excited user base. Austin Wallace Tech will work with viaSport throughout the onboarding process, will offer bi-weekly office hours to check in on the continued success of the rollout, and will provide continuous training as new users join and new features are released. Administrators will be provided with supplemental training on how to manage users and access.
- The Solstice prototype was tested on more than 20 million rows of synthetic data to validate its capabilities. See [Appendix C](#appendix-c:-performance-evidence) for the full Performance Evaluation results.
- The Austin Wallace Tech team brings relevant delivery experience from data-intensive environments. Austin Wallace combines enterprise data engineering experience (New Jersey Devils, processing 10M+ rows per game; Clio, production pipelines with SOC II compliance) with direct amateur sport governance as former Chair of the International Quidditch Association, where he led technology strategy for 30+ national governing bodies. The broader team includes specialists in UX research and accessibility (Ruslan Hétu), PSO operations and governance (Soleil Heaney, former Executive Director of Quadball Canada and Manager of Member Services at BC Soccer), and security/compliance advisory from leaders with Fortune 100 and BC public sector experience.

The cloud-native architecture and AI integration will vastly improve the administrative process for data collection and reporting. Integration of AI via AWS Bedrock into the system architecture allows for rapid development of new features, including natural language analytics queries.

By virtue of being a SaaS platform on AWS, scalability will be easy and affordable, with functionally no limit on computing power available to viaSport. AWS cloud operation is also highly sustainable. An Accenture study in 2024 found customers running compute-heavy workloads could reduce carbon emissions by up to 94% by switching from on-prem to the AWS cloud. Users will experience full quality and functionality regardless of scale thanks to the cloud-native architecture.

The solution is innovative and sits at the forefront of AI-enabled operations. New modules and functionality can be constructed and launched within hours. Native API integration will allow for a generational change in the ease of transmitting reports and information, offering the ease of data distribution sought by viaSport and the B.C. amateur sports community.

##

# **_Proposal Foundations_**

## **Standard Assumptions and Security Posture**

The statements below apply across this response unless noted.

### _Data Residency and Privacy Summary_ {#data-residency-and-privacy-summary}

Primary data stores (RDS PostgreSQL, S3 object storage, backups, and audit archives) are hosted in AWS Canada (Central) (ca-central-1). Authenticated content is configured to avoid edge caching. Email notifications are sent via AWS Simple Email Service (SES) in AWS Canada (Central) (ca-central-1). Once delivered to recipients, messages may transit or be stored by external email providers outside AWS.

### _Security Model Summary_ {#security-model-summary}

The security model follows the AWS shared responsibility approach: AWS secures the underlying cloud infrastructure, and we implement and operate the application controls, configuration, and monitoring required for viaSport's use case. The platform implements MFA, role-based access control, organization scoping, and an immutable audit log with tamper-evident hashing.

#### **_Encryption layers_**

- **At rest:** AES-256 via AWS KMS for RDS, S3, and backups
- **In transit:** TLS 1.2+ for all API endpoints and database connections
- **Processing controls:** Application-level field encryption for highly sensitive authentication secrets (TOTP/backup codes), stored as encrypted values in PostgreSQL

Security evidence is summarized in Appendix D: Security Architecture Summary. AWS compliance reports (SOC, ISO) are available via AWS Artifact upon request.

### _Prototype and Data Provenance Summary_ {#prototype-and-data-provenance-summary}

A working prototype is available for evaluation in the sin-uat environment. No viaSport confidential data was used. Performance testing is run in sin-perf using synthetic data designed to match the scale characteristics described in the RFP. Performance and accessibility evidence is summarized in Appendix C: Performance Evidence. Demo access is provided via a secure Evaluator Access Pack (see [Appendix A](#appendix-a:-prototype-evaluation-access)), and a 15-minute validation path is provided in the Prototype Evaluation Guide.

## **At a Glance**

| Dimension              | Status                                                                                  | More detail                                                                             |
| :--------------------- | :-------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------- |
| Evaluation environment | Working system available for evaluator validation                                       | [Prototype and Data Provenance Summary](#prototype-and-data-provenance-summary)         |
| Requirements coverage  | 25/25 requirements implemented pending finalization with viaSport                       | [System Requirements Compliance Matrix](#system-requirements-compliance-matrix)         |
| Data Used              | Synthetic data only                                                                     | [Prototype and Data Provenance Summary](#prototype-and-data-provenance-summary)         |
| Performance            | 20M rows, p95 162ms, 25 concurrent users, 0 server errors                               | [Appendix C: Performance Evidence](#appendix-c:-performance-evidence)                   |
| Security               | Shared responsibility model and security controls                                       | [Appendix D: Security Architecture Summary](#appendix-d:-security-architecture-summary) |
| Service Levels         | 99.5% availability; Sev1 60 min; Sev2 4 hours; RPO 1 hour; RTO 4 hours                  | [Service Levels, Support, and Reliability](#service-levels,-support,-and-reliability)   |
| Timeline               | 30 weeks targeting Fall 2026 launch, including a 6-week discovery and UX research phase | [Project Plan](#project-plan,-timeline,-and-delivery-schedule)                          |
| Commercial Model       | 3-year base term \+ two optional 1-year extensions (3+1+1)                              | [Commercial Model and Pricing](#commercial-model-and-pricing)                           |
| Total Cost             | 3-year: **$1.2M** / 5-year: **$1.6M** (implementation \+ subscription)                  | [Commercial Model and Pricing](#commercial-model-and-pricing)                           |

## **Key Highlights**

### _Working Evaluation_

Environment Evaluators can log into a working system to validate key workflows and requirements prior to award. Access details are in Appendix A: Prototype Evaluation Access. The Prototype Evaluation Guide provides a 15-minute, requirement-linked walkthrough. See [Data Residency and Privacy Summary](#data-residency-and-privacy-summary).

### _Requirements Coverage (January 2026 Evaluation Environment)_

The evaluation environment fully implements all 25 System Requirements Addendum items. Finalization scope items (viaSport-specific configuration and inputs) are documented in the [System Requirements Compliance Matrix](#system-requirements-compliance-matrix).

### _Security and Residency_

See [Data Residency and Privacy Summary](#data-residency-and-privacy-summary) and [Security Model Summary](#security-model-summary),

### _Managed Service Model_

viaSport is procuring an SLA-backed managed service covering uptime, support response targets, and reliability, with Austin Wallace Tech responsible for day-to-day operations. The subscription includes availability/performance/security monitoring, ticket-based support and incident response, security patching, quarterly DR exercises, and 200 hours/year for ongoing enhancements. See [Commercial Model and Pricing for details](#commercial-model-and-pricing).

### _Delivery Timeline_

The proposed 30-week timeline targets launch in Fall 2026\. The timeline is intentionally structured around discovery gates, IA approval, UAT sign-off, and launch readiness, not feature build completion. Because the baseline system is already built, the timeline is allocated to user research, migration accuracy, accessibility validation, and operational readiness. See [Project Plan, Timeline, and Delivery Schedule](#project-plan,-timeline,-and-delivery-schedule).

## **Project Team**

| Team Member     | Role                      |
| :-------------- | :------------------------ |
| Austin Wallace  | Owner, Principal Engineer |
| Ruslan Hétu     | UX and Accessibility Lead |
| Soleil Heaney   | System Navigator          |
| Will Siddall    | Technical Advisor         |
| Parul Kharub    | Security Advisory         |
| Michael Casinha | Security Advisory         |
| Tyler Piller    | Security Advisory         |

Austin Wallace and Ruslan Hétu lead delivery together throughout the project. Soleil Heaney serves as system navigator, connecting the team to PSO community needs during research and rollout. Details on each team member are in Appendix F: Team Biographies.

# **_Solstice: A Working Prototype_** {#solstice:-a-working-prototype}

## **Purpose**

This prototype (evaluation environment) exists to reduce procurement uncertainty by enabling requirement and workflow validation before contract award. viaSport can evaluate a working system, not just a proposal.

This baseline does not replace discovery. Discovery remains required to confirm:

- viaSport terminology, templates, reporting cycles, and governance rules
- Legacy extraction constraints and migration mappings using real BCAR/BCSI data
- Accessibility and usability validation with real users under real reporting conditions
- Operational policies (retention durations, escalation contacts, support workflows)

With this baseline prototype, discovery and UAT can start from functioning software, resulting in faster alignment, more effective feedback loops, and fewer surprises during rollout. Valuable engineering time can be dedicated to adoption, reliability, and migration accuracy rather than creating foundational features.

## **Data Provenance**

**No viaSport confidential data was used.** Performance testing used synthetic data designed to match the scale characteristics described in the RFP:

| Table            | Rows    | Purpose                                |
| :--------------- | :------ | :------------------------------------- |
| audit_logs       | 10.0M   | Realistic audit trail volume           |
| form_submissions | 8.0M    | Simulates 10+ years of PSO submissions |
| notifications    | 2.0M    | Email and in-app notification history  |
| **Total**        | **20M** | Matches RFP 20+ million rows context   |

## **Implemented Baseline Capabilities**

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

## **Remaining Work**

To be completed with input & collaboration from viaSport

| Item                                                    | Timing                | Dependency                                 |
| :------------------------------------------------------ | :-------------------- | :----------------------------------------- |
| BCAR and BCSI extraction method                         | Discovery (Weeks 1-6) | Legacy system access                       |
| Form templates and reporting metadata                   | Discovery (Weeks 1-6) | viaSport data dictionary                   |
| Branding (logo, colors)                                 | Design (Week 11\)     | Brand assets from viaSport                 |
| Program-specific fields (NCCP, contribution agreements) | Design (Weeks 11-18)  | viaSport Subject Matter Expert (SME) input |

## **Demo Access**

Prototype evaluation credentials are provided via [Appendix A: Prototype Evaluation Access](#appendix-a:-prototype-evaluation-access).

**Contact:** [support@solsticeapp.ca](mailto:support@solsticeapp.ca)

**Environment:** sin-uat (User Acceptance Testing environment with evaluator access and CloudTrail monitoring). Performance testing is run in sin-perf.

**MFA:** Disabled on all demo accounts for convenience. To evaluate the MFA capability, navigate to **Settings \> Security** to enroll your own authenticator app.

**Data:** Synthetic only, with environment monitoring enabled (CloudTrail with CIS Benchmark alarms).

## **Prototype Placeholders and Items to Be Finalized Post-Award**

The prototype is fully functional for the workflows listed in the Requirements Compliance Matrix. The following items are content placeholders that will be finalized with viaSport during Discovery (needs assessment/gap analysis):

- Form labels and field names are representative placeholders and will be aligned to viaSport terminology during Discovery
- Sample templates are illustrative; viaSport's reporting templates will be configured during Discovery
- Help-center content will be refined during Discovery based on needs assessment and user research
- Logo and color scheme are placeholders; viaSport branding assets will be applied during Discovery

## **15-Minute Evaluator Walkthrough**

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

## **Demo Validation Guide**

| Req ID      | Requirement Description         | Validation Steps                                                          |
| :---------- | :------------------------------ | :------------------------------------------------------------------------ |
| DM-AGG-001  | Form building                   | Dashboard \-\> Forms \-\> Create Form                                     |
| DM-AGG-001  | File uploads                    | Form Builder \-\> Add File Field \-\> Submit                              |
| DM-AGG-006  | Import and rollback             | Dashboard \-\> Admin \-\> Imports \-\> New Import (Smart wizard)          |
| RP-AGG-003  | Submission tracking             | Dashboard \-\> Reporting                                                  |
| RP-AGG-005  | Self-service analytics          | Analytics \-\> New Query \-\> Pivot                                       |
| RP-AGG-005  | Export with access control      | Pivot \-\> Export \-\> Verify scoping                                     |
| SEC-AGG-001 | MFA authentication              | Settings → Security → Enable MFA                                          |
| SEC-AGG-001 | Role-based access               | Compare admin vs reporter dashboards                                      |
| SEC-AGG-002 | Monitoring and threat detection | Admin \-\> Security \-\> Events / Account Locks                           |
| SEC-AGG-003 | Privacy and compliance controls | Admin \-\> Privacy \-\> Retention Policies / Legal Holds, plus Appendix D |
| SEC-AGG-004 | Audit trail                     | Admin \-\> Audit Logs \-\> Filter                                         |
| SEC-AGG-004 | Hash chain verification         | Audit Logs \-\> Verify Integrity                                          |
| TO-AGG-002  | Guided walkthroughs             | Help \-\> Guided Walkthroughs                                             |
| TO-AGG-003  | Help center search              | Help \-\> Search                                                          |
| UI-AGG-006  | Support requests                | Help \-\> Support Request                                                 |

If evidence of AWS itself’s compliance is required, we will provide supporting artifacts through AWS Artifact and compliance documentation upon request.

# **_Evaluator Navigation Map_** {#evaluator-navigation-map}

This table maps each RFP evaluation criterion to the corresponding section of this response.

| RFP Evaluation Criterion            | Our Response Section                                                                                         | Notes                                       |
| :---------------------------------- | :----------------------------------------------------------------------------------------------------------- | :------------------------------------------ |
| Vendor Fit to viaSport's Needs      | Vendor Fit to viaSport's Needs                                                                               | Company profile, team, differentiators      |
| Solution Overview                   | Solution Overview                                                                                            | Non-technical workflow summary              |
| Service Approach and Responsiveness | Service Approach: Data Submission and Reporting Web Portal through Service Approach: Training and Onboarding | Methodology for each scope item             |
| System Requirements Addendum        | System Requirements Compliance Matrix and detailed requirement sections                                      | Requirement-by-requirement compliance       |
| Service Levels and Reliability      | Service Levels, Support, and Reliability                                                                     | SLAs, monitoring, ops commitments           |
| Capabilities and Experience         | Capabilities and Experience                                                                                  | Case studies, automation/AI approach        |
| Cost and Value                      | Commercial Model and Pricing                                                                                 | Term pricing, TCO, change management        |
| Timeline and Delivery Schedule      | Project Plan, Timeline, and Delivery Schedule                                                                | Milestones, risks, dependencies             |
| Prototype Validation                | Prototype Evaluation Guide and Appendices                                                                    | Demo access, performance/security summaries |

Austin Wallace Tech welcomes the opportunity to present the prototype and review the approach with viaSport's evaluation team.

# **_Scoring Summary_** {#scoring-summary}

This section provides a quick reference for how to evaluate each area of the proposal. All 25 RFP requirements are addressed, with most demonstrable in the evaluation environment.

## **Compliance Overview**

| Category                         | Total  | Fully Implemented | Finalization scope |
| :------------------------------- | :----- | :---------------- | :----------------- |
| Data Management (DM-AGG)         | 6      | 6                 | 0                  |
| Reporting (RP-AGG)               | 5      | 5                 | 0                  |
| Security (SEC-AGG)               | 4      | 4                 | 0                  |
| Training and Onboarding (TO-AGG) | 3      | 2                 | 1                  |
| User Interface (UI-AGG)          | 7      | 6                 | 1                  |
| **Total**                        | **25** | **23**            | **2**              |

## **Evaluation Steps**

| Evaluation Area         | How to Verify                                                                          |
| :---------------------- | :------------------------------------------------------------------------------------- |
| Functional completeness | Log in to sin-uat and complete the 15-minute walkthrough in Prototype Evaluation Guide |
| Requirement compliance  | Review System Requirements Compliance Matrix and per-requirement sections              |
| Security posture        | Review SEC-AGG sections; request AWS Artifact reports for SOC 2/ISO 27001              |
| Performance             | Review Appendix C performance evidence (20M rows, p95 162ms, 25 concurrent users)      |
| Team qualifications     | Review Appendix F: Team Biographies                                                    |
| Pricing clarity         | Review Commercial Model and Pricing (all-inclusive, no hidden fees)                    |
| Delivery confidence     | Review Project Plan timeline and case studies in Capabilities and Experience           |

## **Items Requiring Finalization**

Two requirements require viaSport-specific configuration during the Discovery phase:

| Requirement | Description                   | Finalization Scope                                                     |
| :---------- | :---------------------------- | :--------------------------------------------------------------------- |
| TO-AGG-002  | Guided onboarding walkthrough | Content and role-specific paths defined with viaSport during Discovery |
| UI-AGG-005  | Search and filter navigation  | Filter presets configured based on viaSport terminology and workflows  |

All other requirements are fully met with working implementation in the evaluation environment.

# **_Assumptions and Dependencies_** {#assumptions-and-dependencies}

This section consolidates the key assumptions underlying this proposal. Detailed context is provided in the referenced sections.

## **Key Assumptions**

| Category       | Assumption                                                                       | Reference              |
| :------------- | :------------------------------------------------------------------------------- | :--------------------- |
| Data residency | All primary data stores are in AWS Canada (Central) (ca-central-1)               | Executive Summary §1.1 |
| Security model | AWS shared responsibility model with application-level controls                  | Executive Summary §1.2 |
| Legacy access  | viaSport can provide export capability or schema documentation for BCAR and BCSI | Project Plan           |
| Timeline       | Target go-live Fall 2026; 2 business day data freeze window for cutover          | Project Plan           |
| Parallel run   | Not required; clean cutover with rollback capability                             | Project Plan           |
| Data retention | 7-year default retention, configurable per data type                             | Data Warehousing       |
| MFA policy     | Configurable by viaSport (enforcement level, methods)                            | Security sections      |

## **Dependencies on viaSport**

| Dependency                         | Timing      | Impact if Delayed          |
| :--------------------------------- | :---------- | :------------------------- |
| Legacy data access (BCAR/BCSI)     | Week 1      | Migration timeline at risk |
| Subject Matter Expert availability | Weeks 1-6   | Research quality reduced   |
| UAT testers                        | Weeks 19-22 | UAT duration extended      |
| PSO coordination                   | Weeks 27-30 | Rollout schedule impacted  |

See [Project Plan, Timeline, and Delivery Schedule](#project-plan,-timeline,-and-delivery-schedule) for the full risk register and mitigation strategies.

# **_Vendor Fit to viaSport's Needs_** {#vendor-fit-to-viasport's-needs}

## **Company Overview**

Austin Wallace Tech is a British Columbia limited company (Victoria, BC; incorporated 2025\) delivering Solstice as a managed platform for sport sector reporting and information management.

We operate with a single accountable delivery lead and a small core product team, augmented by specialist advisors for security, UX/accessibility, and independent testing. This model provides:

- A single accountable delivery lead from proposal through delivery (no handoff between sales and implementation teams)
- A stable core delivery pod: 1 full-time principal supported by 6 named contracted specialists
- On-demand specialist capacity for compliance, security testing, and UX validation

| Attribute          | Details                                                                                                                                                       |
| :----------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Headquarters       | Victoria, British Columbia                                                                                                                                    |
| Incorporated       | 2025 (BC Limited Company, BN 748709839BC0001)                                                                                                                 |
| Team size          | 1 principal (Project Lead/Solution Architect) \+ 6 specialist advisors (UX/accessibility, sport operations, technical advisory, security/compliance advisory) |
| Operating model    | Product team \+ managed service                                                                                                                               |
| Delivery structure | Core delivery pod \+ specialist partners                                                                                                                      |
| Hosting region     | AWS Canada (Central) for primary data stores                                                                                                                  |
| Primary focus      | Sport sector information management systems                                                                                                                   |

## **Operating Model**

### _Delivery Pod_

Solstice is delivered through a product team operating model: a consistent delivery pod for implementation and the same team responsible for ongoing operations. This avoids handoffs between "project build" and "ops," and provides clear accountability through rollout and into steady state.

| Function                                 | Responsibilities                                                                                                           | Primary                                     |
| :--------------------------------------- | :------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------ |
| Program & Delivery Lead                  | Delivery plan, governance, risk management, stakeholder management                                                         | Austin Wallace                              |
| UX & Accessibility Lead                  | UX research, design, accessibility validation, usability testing                                                           | Ruslan Hétu                                 |
| Sports Operations and Governance Advisor | Connects team to Provincial Sport Organization (PSO) community needs during research and rollout; acts as system navigator | Soleil Heaney                               |
| Technical Advisor                        | Architecture review, development support, performance engineering                                                          | Will Siddall                                |
| Security & Risk Advisors                 | Security architecture, control mapping, pen test coordination, compliance                                                  | Parul Kharub, Michael Casinha, Tyler Piller |

### _Engagement Model_

| Role                                                     | Engagement                                                                                                           | Phase Coverage                                        |
| :------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------- |
| Austin Wallace (Delivery Lead)                           | Full-time, accountable                                                                                               | All phases                                            |
| Ruslan Hétu (UX/A11y Lead)                               | Full-time UX research and design                                                                                     | All phases                                            |
| Soleil Heaney (Sports Operations and Governance Advisor) | Ongoing sector liaison: coordinates with PSOs to validate workflows, templates, and change-management communications | Research, UAT, rollout                                |
| Will Siddall (Technical Advisor)                         | Part-time during development                                                                                         | Weeks 11-22                                           |
| Security Advisors                                        | Formal checkpoint reviews at key milestones                                                                          | Design finalization, UAT readiness, Go-Live readiness |

## **Service Management and Coverage**

viaSport is procuring an SLA-backed managed service: a platform that performs reliably during reporting cycles, with clear operational ownership.

| Area                  | Approach                                                                                                                                                                                                    |
| :-------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Support model         | In-app support requests \+ email support with severity-based response targets (see [Service Levels](#service-levels,-support,-and-reliability))                                                             |
| Monitoring & alerting | 24/7 automated monitoring via AWS CloudWatch with alerting to the service team                                                                                                                              |
| Release management    | Scheduled maintenance windows (7 days advance notice; emergency maintenance on shorter notice with immediate viaSport notification), versioned releases, and change log reporting to viaSport               |
| Security operations   | Monthly routine patching; critical security patches within 2 business days of vendor patch availability; quarterly security reviews                                                                         |
| Continuity            | Infrastructure as code (environment configuration stored as code for reproducibility and disaster recovery), documented runbooks, tested restore procedures, quarterly disaster recovery validation         |
| Escalation            | Defined escalation path for Severity 1 incidents: acknowledgement within 60 minutes, direct phone/text escalation to delivery lead, updates provided to viaSport at least every 60 minutes until mitigation |

## **Why This Procurement is Straightforward to Evaluate**

viaSport is not purchasing a one-time "web project." Solstice is a managed, subscription-based platform service. The subscription includes defined service levels, ongoing support and monitoring, security maintenance, and scheduled enhancements.

Solstice is positioned like an enterprise platform engagement:

- viaSport receives a **subscription \+ managed service** with defined service levels
- viaSport retains **control of its configuration and content** (forms, templates, reporting definitions)
- viaSport retains **full access to its data** with export/portability options at any time
- Continuity and exit risk can be mitigated through **escrow and transition options** (see [Exit & Portability](#optional-risk-reduction:-exit-and-continuity))

### _Procurement Certainty Summary_

| Concern                    | How We Address It                                                                                                                                            |
| :------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vendor dependency          | Source code escrow, data portability, documented runbooks                                                                                                    |
| Key person continuity      | Infrastructure as code, operational documentation, and a dedicated delivery team structure                                                                   |
| Technology readiness       | Working evaluation environment validated at scale (20M rows, p95 162ms, 25 concurrent users)                                                                 |
| Implementation readiness   | The evaluation environment demonstrates that all 25 requirements are already implemented; delivery is led by a single accountable lead with minimal handoffs |
| Operational accountability | Defined SLA targets, continuous monitoring of uptime/performance/security events, and quarterly disaster recovery exercises                                  |

## **Relevant Delivery Portfolio** {#relevant-delivery-portfolio}

### _Austin Wallace Tech, Selected Relevant Delivery Work_

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

## **Advisory Partner Profiles**

Advisory partners provide expertise and review at defined checkpoints. The team includes:

| Role                                | Advisor         | Focus Area                                     |
| :---------------------------------- | :-------------- | :--------------------------------------------- |
| UX and Accessibility Lead           | Ruslan Hétu     | User research, interface design, accessibility |
| Sports Operations Advisor           | Soleil Heaney   | PSO workflows, governance, user perspective    |
| Technical Advisor                   | Will Siddall    | Architecture, delivery quality                 |
| Security and Risk Advisor           | Parul Kharub    | Enterprise security, PIPEDA/ISO compliance     |
| Security and Infrastructure Advisor | Michael Casinha | DevOps, secure deployment practices            |
| Security and Compliance Advisor     | Tyler Piller    | BC Public Sector security, risk management     |

Full biographies for all team members are provided in **Appendix F: Team Biographies**.

## **Data Ownership and Portability**

| Aspect             | Commitment                                                                            |
| :----------------- | :------------------------------------------------------------------------------------ |
| Data Ownership     | viaSport retains full ownership of all data                                           |
| Export Formats     | CSV, Excel, and JSON exports available at any time                                    |
| Data Extraction    | Full database export available on request or contract termination                     |
| Documentation      | Operational runbooks and schema documentation provided                                |
| Source Access      | Source code escrow available; perpetual license to customizations available as option |
| Transition Support | Support available for transition to a replacement system                              |

## **Proposed Solution Statement**

Austin Wallace Tech proposes the Solstice platform, a purpose-built, reliable, and secure information management system aligned to the Strength in Numbers requirements.

### _Key Differentiators_

**1\. Working Baseline, Not a Proposal**

A working baseline is available for evaluation. Most implementations begin with foundational development. Solstice begins with a working baseline aligned to the requirement set, allowing the project timeline to focus on adoption-critical work. It has been load-tested at production scale with 20 million rows.

**2\. Principal-Led Delivery**

The architect and primary developer of the prototype will lead delivery. This reduces knowledge transfer risk and provides direct accountability.

**3\. Domain Expertise in Sport Data**

The team combines enterprise data engineering and security with direct amateur sport sector operations experience, including PSO executive leadership, ensuring the platform reflects how sport organizations actually work.

**4\. Primarily BC-Based, Canadian Delivery**

Austin Wallace Tech is headquartered in Victoria, BC. Delivery is led from BC, with Canadian distributed specialists (including UX/accessibility) supporting research, design, and validation. We are available for in-person sessions in BC as needed.

**5\. Canadian Data Residency**

See [Data Residency and Privacy Summary](#data-residency-and-privacy-summary)

**6\. Security and Privacy by Design**

Security and privacy are built into delivery from discovery through operations. See [Security Model Summary](#security-model-summary).

Our approach aligns with OWASP application security practices, including the OWASP Top 10 and OWASP ASVS as a verification framework.

**Security by Design Approach**

- **Security requirements up front:** Define security and privacy requirements during discovery (access control, retention, audit, monitoring), then validate them in the prototype and UAT.
- **Threat modeling:** Run threat modeling for the core workflows (authentication, imports, exports, delegated access) and track mitigations as delivery items.
- **Shift-left DevSecOps:** Automated code and dependency scanning in CI so issues are found before deployment.
- **Zero-trust access model:** MFA, RBAC, and organization scoping enforced server-side for all data access.
- **Data protection and Canadian hosting region:** See [Data Residency and Privacy Summary](#data-residency-and-privacy-summary).
- **Monitoring and anomaly response:** Detect suspicious authentication patterns, alert administrators, and apply automated lockout controls.
- **Immutable audit and integrity:** Tamper-evident audit logging and retention controls to support forensic review and regulatory reporting.

### _Benefits viaSport_

- **Evaluator Validation:** Evaluators can review a working baseline prior to award to validate key workflows and requirements.
- **Predictable Costs:** Term subscription with included enhancement hours.
- **Direct Accountability:** Principal-led delivery with no organizational layers.
- **Sector Understanding:** Direct experience in the B.C. amateur sport sector (including PSOs and community sport organizations), not just software delivery.
- **Secure and Safe:** Embedding security and privacy by design from day one.
- **Sustainability:** Serverless architecture and infrastructure as code reduce operating overhead.
- **Exit Options:** Data portability, escrow, and transition support available.

# **_Solution Overview_** {#solution-overview}

## **Workflow Summary**

The Solstice platform supports the full reporting lifecycle from PSO submission to viaSport oversight and analytics.

1. PSOs submit data through forms, file uploads, or imports.
2. Validation rules check required fields and formatting on submission.
3. Reporting status is tracked with reminders and resubmission workflows.
4. Analytics and dashboards surface trends with role-based access controls.
5. Audit logs capture data changes, exports, and admin actions.

## **Multi-Tenant Model**

Each organization has isolated data and role-based permissions. viaSport admins can view cross-organization reporting and analytics, while PSOs only access their own records.

## **viaSport Administrator Capabilities**

- Configure forms and reporting cycles
- Manage organization access and delegated roles
- Monitor submission status and compliance
- Review audit logs and security events
- Set retention policies and legal holds
- Export analytics with audit logging

## **PSO Capabilities**

- Submit reports and supporting files
- Track submission status and deadlines
- Correct validation errors and resubmit
- View organization-level dashboards
- Export approved datasets within role permissions

## **Migration Summary**

Legacy data is extracted, mapped, validated, and imported with an auditable trail and rollback support. See [Service Approach: Data Migration](#service-approach:-data-migration) for the detailed migration plan and cutover steps.

# **_Service Approach: Data Submission and Reporting Web Portal_** {#service-approach:-data-submission-and-reporting-web-portal}

## **UX Strategy and Approach**

The Solstice portal is designed to make data submission efficient for non-technical administrators. The UX approach is role-based, task-focused, and aligned to reporting deadlines.

| User Group              | Primary Tasks                           | UX Focus                                                 |
| :---------------------- | :-------------------------------------- | :------------------------------------------------------- |
| viaSport Administrators | Oversight, analytics, compliance review | Cross-org dashboards, audit access, admin tools          |
| PSO Reporters           | Data submission, report tracking        | Streamlined forms, progress tracking, deadline awareness |
| Data Stewards           | Data quality, imports                   | Validation tools, error resolution, bulk operations      |

### _Role-Based Portal Design_

Each user sees a personalized dashboard based on role and organization. The dashboard surfaces relevant actions, pending tasks, and submission status without requiring deep navigation.

### _Navigation and Workflow_

- **Dashboard-led navigation:** Cards and summaries link directly to forms, reporting tasks, analytics, and support.
- **Command palette:** Keyboard navigation (Cmd or Ctrl plus K) to jump to pages, forms, and records.
- **Contextual links:** Templates, guides, and support appear alongside relevant tasks.

### _Responsive Design_

The interface adapts to desktop, tablet, and mobile viewports. Core workflows remain available on mobile for reviewers and administrators on the go.

### _Accessibility_

The interface is built on Radix UI primitives and shadcn/ui components, which provide keyboard navigation and ARIA defaults. Beyond these foundations, we have implemented:

- **Form accessibility:** Error messages are announced to screen readers via live regions. A form error summary component auto-focuses on validation failure and provides clickable links to each error field.
- **Keyboard navigation:** Command palette (Cmd/Ctrl+K) provides keyboard-first navigation. All form controls, buttons, and interactive elements are reachable via Tab.
- **Alternative interaction modes:** The Pivot Builder offers a button-based mode for users who cannot use drag-and-drop, allowing field addition and reordering via accessible buttons.
- **Chart accessibility:** Analytics charts include a "View data table" toggle that reveals a properly structured HTML table for screen reader users. A High Contrast color scheme option ensures 3:1+ minimum contrast for data visualization.

Accessibility evidence is summarized in Section 1.3.

### _UX Refinement Process_

During Planning and Discovery we will:

- Validate navigation structure against real viaSport workflows
- Identify friction points from legacy system usage
- Refine dashboard widgets to surface the most relevant information
- Apply viaSport branding and terminology

Detailed functional compliance for forms, submissions, and reporting lives in **System Requirements Compliance Matrix** (DM-AGG-001 and RP-AGG-003).

## **Technology Stack and Benefits**

### _Frontend_

| Technology     | Purpose                    | Benefit                                                         |
| :------------- | :------------------------- | :-------------------------------------------------------------- |
| TanStack Start | Full-stack React framework | Type-safe end-to-end, server-side rendering, file-based routing |
| React 19       | UI library                 | Performance optimizations and modern suspense support           |
| TypeScript     | Type system                | Compile-time error detection and maintainability                |
| Tailwind CSS   | Styling                    | Consistent design system, rapid iteration                       |
| shadcn/ui      | Component library          | Accessible components with full customization control           |

### _Backend and Middleware_

| Technology                      | Purpose         | Benefit                                                    |
| :------------------------------ | :-------------- | :--------------------------------------------------------- |
| TanStack Start Server Functions | API layer       | Co-located with UI, type-safe, no separate backend service |
| Drizzle ORM                     | Database access | Lightweight, predictable, typed schema mapping             |
| Better Auth                     | Authentication  | MFA support, session management, OAuth integration         |

### _Database_

| Technology            | Purpose            | Benefit                                         |
| :-------------------- | :----------------- | :---------------------------------------------- |
| PostgreSQL on AWS RDS | Primary data store | Proven enterprise database, tested at 20M+ rows |

### _Hosting_

| Technology     | Purpose          | Benefit                               |
| :------------- | :--------------- | :------------------------------------ |
| AWS Lambda     | Application tier | Serverless, auto-scaling, pay-per-use |
| AWS CloudFront | CDN              | Edge caching, fast delivery           |
| AWS S3         | Object storage   | Documents, imports, artifacts         |
| AWS SQS        | Message queues   | Reliable notification delivery        |
| AWS SES        | Email            | Transactional email delivery          |

### _Analytics_

| Technology         | Purpose                | Benefit                                          |
| :----------------- | :--------------------- | :----------------------------------------------- |
| Native BI Platform | Self-service analytics | Built-in tenancy enforcement and audited exports |
| ECharts            | Charting               | Interactive visualizations                       |
| TanStack Table     | Data grids             | Sortable, filterable pivot tables with export    |

### _Performance Evidence_

Lighthouse and load tests were conducted in the sin-perf environment on 2026-01-08.

| Metric                   | Score or Value | Target | Status |
| :----------------------- | :------------- | :----- | :----- |
| Performance Score        | 90/100         | \>80   | Pass   |
| First Contentful Paint   | 1.0s           | \<1.8s | Pass   |
| Largest Contentful Paint | 1.0s           | \<2.5s | Pass   |
| Time to Interactive      | 1.1s           | \<3.8s | Pass   |
| Cumulative Layout Shift  | 0              | \<0.1  | Pass   |
| Accessibility Score      | 100/100        | \>90   | Pass   |

See [Appendix C](#appendix-c:-performance-evidence) for performance evidence.

# **_Service Approach: Data Warehousing_** {#service-approach:-data-warehousing}

## **Hosting Solution, Tenancy Model, Data Residency, and Regulatory Alignment**

### _Hosting Solution_

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

### _Data Residency_

Standard data residency assumptions are defined in Section 1.1. The table below lists the specific data stores and regions for this service approach.

| Data Type            | Storage Location      | Region       |
| :------------------- | :-------------------- | :----------- |
| Application database | RDS PostgreSQL        | ca-central-1 |
| Documents and files  | S3                    | ca-central-1 |
| Audit archives       | S3 Deep Archive       | ca-central-1 |
| Backups              | RDS automated backups | ca-central-1 |

**Multi-AZ Architecture:** All production data is hosted in AWS Canada (Central) (ca-central-1). Production infrastructure uses Multi-AZ deployment within ca-central-1 for automatic failover and high availability. This provides fault tolerance across multiple data centers within the same Canadian region while maintaining data residency compliance.

### _Tenancy Model_

The platform uses a multi-tenant architecture with strict organization scoping:

- Every query is scoped to the user's organization.
- Role-based access control restricts actions by role.
- Field-level permissions control visibility of sensitive data.
- Cross-organization access requires explicit admin privileges.

### _Regulatory Alignment_

| Requirement                | Implementation                                                                                                                                                   |
| :------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PIPA and PIPEDA compliance | Canadian data residency, TLS 1.2+ encryption in transit, encryption at rest, access controls, audit logging, data minimization controls                          |
| Transport security         | All APIs served over HTTPS (TLS 1.2+); no unencrypted endpoints                                                                                                  |
| Data minimization          | Configurable retention policies, legal holds, collection limited to necessary purposes                                                                           |
| Right to access            | Data export workflows with audit trail                                                                                                                           |
| Breach notification        | Audit logging and anomaly detection                                                                                                                              |
| Security safeguards        | Reasonable security measures protect personal information from unauthorized access, collection, use, disclosure, copying, modification, disposal, or destruction |

AWS maintains a Data Processing Addendum that covers all services used by the platform, including SES for email delivery: [https://d1.awsstatic.com/legal/aws-dpa/aws-dpa.pdf](https://d1.awsstatic.com/legal/aws-dpa/aws-dpa.pdf)

### _Sub-Processors_

| Service              | Provider | Purpose                   | Data Residency        |
| :------------------- | :------- | :------------------------ | :-------------------- |
| Cloud infrastructure | AWS      | Hosting, compute, storage | Canada (ca-central-1) |
| Email delivery       | AWS SES  | Transactional emails      | Canada (ca-central-1) |

No additional sub-processors are used.

## **Backup, Recovery, and Encryption Standards**

### _Backup Strategy_

| Parameter                | Value                                          |
| :----------------------- | :--------------------------------------------- |
| Backup frequency         | Continuous (point-in-time recovery)            |
| Backup retention         | 35 days in production, 7 days in dev and perf  |
| Backup location          | RDS automated backups, ca-central-1            |
| Cross-region replication | Not enabled (single-region for data residency) |

### _Recovery Objectives_

| Metric                         | Target              | Evidence                                |
| :----------------------------- | :------------------ | :-------------------------------------- |
| Recovery Point Objective (RPO) | 1 hour (production) | DR exercise 2026-01-08: 0 min achieved  |
| Recovery Time Objective (RTO)  | 4 hours             | DR exercise 2026-01-08: 16 min achieved |

DR exercise type: RDS Point-in-Time Recovery (PITR). No data loss observed. Evidence for the latest DR exercise is summarized in Section 1.3 and Appendix C.

### _High Availability_

Production uses Multi-AZ for automatic failover. Dev and perf use single-AZ for cost efficiency.

### _Encryption Standards_

**In Transit:** TLS 1.2+ for all client-server and server-database connections.

**At Rest:** AES-256 via AWS KMS for database storage and S3 objects.

**Application Layer:** Sensitive authentication fields (e.g., TOTP secrets, backup codes) are encrypted before database storage using application-level symmetric encryption with secrets managed in AWS Secrets Manager.

Encryption evidence is summarized in Section 1.2.

### _Audit Log Retention and Archival_

Audit logs are immutable and archived to S3 Deep Archive based on retention policy configuration. Retention durations and archive schedules will be confirmed with viaSport during Discovery. Legal holds are supported to prevent deletion.

### _Why PostgreSQL (Not a Columnar Warehouse)_

viaSport's scale of 20M historical rows with 1M rows per year is well within PostgreSQL capability. A dedicated columnar warehouse would add cost and complexity without benefit at this scale.

| Factor                        | PostgreSQL        | Columnar Warehouse          |
| :---------------------------- | :---------------- | :-------------------------- |
| Optimal scale                 | Up to 500M+ rows  | Billions of rows            |
| viaSport projected (10 years) | 30M rows          | 30M rows                    |
| Operational complexity        | Low (managed RDS) | Higher (cluster management) |
| Data freshness                | Real-time         | Requires ETL, often delayed |

PostgreSQL provides real-time analytics and simplified operations while keeping data resident in Canada.

If viaSport later requires a dedicated warehouse for sector-wide benchmarking or very large-scale analytics (250M+ rows), the platform can replicate curated datasets into AWS Redshift without changing the submission system.

# **_Service Approach: Data Migration_** {#service-approach:-data-migration}

## **Migration Methodology**

### _Approach_

Migration follows a phased approach that reduces risk and validates data at each stage. BCAR and BCSI remain the source of truth until viaSport signs off on migrated data.

### _Migration Phases_

| Phase                      | Duration    | Activities                                                          | Exit Criteria              |
| :------------------------- | :---------- | :------------------------------------------------------------------ | :------------------------- |
| Discovery                  | Weeks 1-6   | Obtain sample exports, document legacy schemas, assess data quality | Schema mapping approved    |
| Mapping and Transformation | Weeks 7-10  | Build mapping templates, define validation rules, test with samples | Templates validated        |
| Pilot Migration            | Weeks 11-14 | Migrate subset (one PSO), validate accuracy, refine mappings        | Pilot data verified        |
| Full Migration             | Weeks 15-18 | Migrate organizations, users, submissions, documents                | Reconciliation checks pass |
| Validation and Cutover     | Weeks 19-22 | Full reconciliation, UAT on migrated data                           | Sign-off received          |

### _Migration Sequence_

1. Organizations and hierarchies
2. Users and role assignments
3. Historical submissions
4. Documents and attachments

### _Mapping Process_

Mapping templates define source fields, target fields, transformation rules, and validation requirements. Templates are reviewed and approved by viaSport before execution.

### _Cleansing_

Data quality issues are handled through:

- Format normalization for dates and numeric values
- Enum mapping to align legacy values with new fields
- Duplicate detection and manual review workflows

### _Validation_

Every imported record is validated against form definitions and required fields. Validation errors are logged with row-level detail for correction.

### _Rollback_

Imports are tagged with an import_job_id. Imports can be rolled back within the configured window (7 days by default) if issues are discovered after load.

## **Audit Trail and Success Verification**

### _Audit Trail_

Migration actions are logged with:

- Import job creation, status changes, and completion
- Mapping template creation and updates
- Row-level validation errors
- Rollback events

Import jobs and audit logs provide traceability for each migration run. Retention durations are configurable and will be confirmed with viaSport (confirmed during Discovery).

### _Success Verification_

Migration success is verified through reconciliation:

| Check                 | Method                                            |
| :-------------------- | :------------------------------------------------ |
| Row counts            | Source count matches target count                 |
| Checksums             | Hash comparison of key fields                     |
| Spot checks           | Manual verification of sample records by viaSport |
| Referential integrity | Foreign keys validated                            |

## **Data Quality Targets and Defect Workflow**

| Metric                 | Target                           |
| :--------------------- | :------------------------------- |
| Successful import rate | 99%+ of records                  |
| Validation pass rate   | 95%+ on first attempt            |
| Duplicate detection    | 100% of exact duplicates flagged |
| Referential integrity  | 100% of relationships valid      |

Defects are classified by severity and resolved before moving to the next migration phase.

## **Technical Infrastructure**

### _Import Processing_

Large imports run in two lanes:

- **Interactive lane:** Validation and import for smaller files inside the app.
- **Batch lane:** ECS Fargate worker for large files in perf and prod; local fallback available in dev.

### _Checkpointing and Errors_

- Checkpointed processing allows resumable jobs.
- Row-level errors are captured and can be reviewed or re-imported.

## **Dependencies on viaSport**

Migration execution requires:

1. Legacy system access (export capability or direct database access)
2. Schema documentation for BCAR and BCSI
3. Data dictionary and field mapping approval
4. SME availability for validation and sign-off

Import tooling is ready today. The extraction approach will be finalized during Discovery based on legacy system capabilities. See [System Requirements Compliance Matrix](#system-requirements-compliance-matrix) (DM-AGG-006) for detailed compliance mapping.

## **Cutover and Change Management**

A successful migration includes technical data movement and a managed transition for viaSport staff and PSOs.

### _Cutover Approach (Recommended)_

| Step                  | Description                                                 | Outcome                                              |
| :-------------------- | :---------------------------------------------------------- | :--------------------------------------------------- |
| Pilot org migration   | Migrate one PSO end-to-end, validate workflow and reporting | Validated templates, mappings, and training approach |
| Migration waves       | Migrate remaining orgs in planned cohorts                   | Manageable support load, reduced risk                |
| Data freeze window    | Short read-only or limited update window on legacy systems  | Prevents last-minute divergence                      |
| Final delta migration | Import changes since last full migration                    | Production data is current                           |
| Go-live               | Solstice becomes system of record, support team on standby  | Controlled launch                                    |
| Hypercare             | Elevated support and daily check-ins for a defined period   | Fast issue resolution, adoption support              |
| Rollback plan         | Predefined rollback criteria and steps                      | Risk control if a blocking issue occurs              |

### _Sector Communication and Training_

- Publish a cutover calendar (freeze window, go-live date, support contacts).
- Provide role-based quick-start guides and live training sessions.
- Use a ticketing workflow and escalation path during hypercare.

### _Downtime and Continuity Expectations_

- Document expected downtime (if any) during final cutover.
- If parallel run is required, define duration and responsibilities (who submits where, what is source of truth).

# **_Service Approach: Platform Design and Customization_** {#service-approach:-platform-design-and-customization}

## **Cloud Provider Services**

The platform is built on Amazon Web Services in the ca-central-1 (Montreal) region. See [Data Residency and Privacy Summary](#data-residency-and-privacy-summary).

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

### _Why AWS_

| Factor           | Rationale                      |
| :--------------- | :----------------------------- |
| Canadian region  | Data residency compliance      |
| Serverless-first | Reduced operational burden     |
| Mature services  | Strong SLAs and documentation  |
| SST integration  | Infrastructure as code for AWS |

### _Why Serverless_

Serverless provides:

1. No server management or patching
2. Automatic scaling during peak reporting periods
3. Pay-per-use cost efficiency
4. High availability across availability zones

AWS cloud operation is also highly sustainable. An Accenture study found customers running compute-heavy workloads could reduce carbon emissions by up to 94% by switching from on-premises to AWS cloud. Users will experience full quality and functionality regardless of scale thanks to the cloud-native architecture[^1]

### _Infrastructure as Code_

Infrastructure is defined in TypeScript using SST. This provides:

- Reproducible environments
- Version control for infrastructure changes
- Disaster recovery from code
- Environment parity across dev, perf, and prod

## **Development and Customization Process**

### _Environment Strategy_

| Environment | Purpose                 | Infrastructure Tier                                     |
| :---------- | :---------------------- | :------------------------------------------------------ |
| sin-dev     | Development and testing | t4g.micro, 50 GB, single-AZ                             |
| sin-perf    | Performance testing     | t4g.large, 200 GB, single-AZ, CloudTrail with alarms    |
| sin-uat     | User Acceptance Testing | t4g.medium, 100 GB, single-AZ, CloudTrail with alarms   |
| sin-prod    | Production              | t4g.large, 200 GB, Multi-AZ, 35-day backups, CloudTrail |

Each environment is isolated with its own database, storage, and credentials. The sin-uat environment is available for viaSport evaluator access, while performance testing is executed in sin-perf.

### _Development Workflow_

![][image1]

### _Quality Gates_

| Gate          | Tooling           | Purpose                        |
| :------------ | :---------------- | :----------------------------- |
| Linting       | oxlint and ESLint | Code quality                   |
| Type checking | TypeScript        | Compile-time validation        |
| Formatting    | oxfmt             | Consistent style               |
| Unit tests    | Vitest            | Component and function testing |
| E2E tests     | Playwright        | Full user flow testing         |

### _Deployment Process_

Deployments are executed with SST:

npx sst deploy \--stage sin-prod

This builds the application, deploys infrastructure, and updates application services. Database schema changes are applied through versioned migrations when required.

### _Rollback_

- Previous Lambda versions remain available for quick rollback.
- Database migrations include rollback plans when needed.
- SST maintains deployment history for audit and recovery.

### _Customization Capabilities_

The platform supports configuration without code changes:

| Customization         | Method                                        |
| :-------------------- | :-------------------------------------------- |
| Branding              | Tenant configuration (logo, colors, name)     |
| Forms                 | Form builder UI for custom data collection    |
| Roles and permissions | Admin UI for role management                  |
| Notifications         | Configurable templates and reminder schedules |
| Retention policies    | Admin-configurable retention periods          |

### _Change Management_

Changes to production follow a defined process:

1. Change request submitted
2. Impact assessment (scope, risk, timeline)
3. Development and testing in sin-dev
4. Performance validation in sin-perf
5. UAT sign-off
6. Deployment to sin-prod
7. Post-deployment verification

Emergency changes follow an expedited process with retrospective documentation.

# **_Service Approach: Testing and Quality Assurance_** {#service-approach:-testing-and-quality-assurance}

## **QA Approach**

### _Testing Layers_

| Layer                | Tooling (examples)                                        | Purpose                                  | Frequency                                      |
| :------------------- | :-------------------------------------------------------- | :--------------------------------------- | :--------------------------------------------- |
| Unit and Integration | Vitest \+ Testing Library                                 | Component and function testing           | Every commit                                   |
| End-to-End           | Playwright                                                | Full user flow testing                   | Every commit                                   |
| Accessibility        | Axe-core \+ Playwright                                    | WCAG 2.1 AA compliance validation        | Every commit                                   |
| Property-Based       | fast-check                                                | Access control and audit integrity       | Every commit                                   |
| Performance          | Lighthouse, k6                                            | Load testing and Core Web Vitals         | Pre-release and before major reporting periods |
| Security (Automated) | SAST \+ SCA (for example CodeQL/Semgrep, Dependabot/Snyk) | Find code and dependency vulnerabilities | Every commit                                   |
| Security (Dynamic)   | DAST (for example OWASP ZAP)                              | Detect runtime web vulnerabilities       | Scheduled and pre-release                      |

### _Automated Testing_

Automated tests run in CI and gate merges where applicable. Coverage focuses on core workflows: login, data submission, reporting, analytics, and access control. There is also automated security testing, please see below for further details.

### _Performance Testing_

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

### _Core Web Vitals_

Lighthouse results from sin-perf are recorded in Section 1.3 and Appendix C. Scores: Performance 90/100, FCP 1.0s, LCP 1.0s, TTI 1.1s, CLS 0, Accessibility 100/100.

### _Accessibility Testing_

Automated accessibility testing validates WCAG 2.1 Level AA compliance:

| Test Type                   | Tooling                | Coverage                                      |
| :-------------------------- | :--------------------- | :-------------------------------------------- |
| Automated scans             | Axe-core \+ Playwright | Auth flows, dashboard, forms, analytics       |
| Keyboard navigation         | Playwright             | Skip links, focus management, tab order       |
| Screen reader compatibility | Manual verification    | Live regions, ARIA labels, semantic structure |

Accessibility tests run in CI alongside functional tests, preventing regressions from reaching production.

### _Security Testing_

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

### _Defect Management_

| Severity | Definition                             | Response Time |
| :------- | :------------------------------------- | :------------ |
| Critical | Security vulnerability, data loss risk | Immediate     |
| High     | Core functionality broken              | Same day      |
| Medium   | Non-critical functionality affected    | Within sprint |
| Low      | Cosmetic or minor UX issues            | Backlog       |

Defects are tracked in a shared system accessible to viaSport.

## **User Acceptance Testing Strategy**

### _UAT Approach_

User Acceptance Testing validates that the platform meets viaSport requirements from the user perspective.

| Element       | Approach                                         |
| :------------ | :----------------------------------------------- |
| Environment   | sin-uat for UAT; performance testing in sin-perf |
| Access        | Role-based test accounts for viaSport testers    |
| Visibility    | Test scenarios mapped to requirement IDs         |
| Communication | Weekly demos and visible ticketing               |

### _UAT Timeline \- Starting Week 18 of Overall Timeline_

| Week   | Focus                                                   |
| :----- | :------------------------------------------------------ |
| Week 1 | Core workflows: login, navigation, data submission      |
| Week 2 | Reporting and analytics: dashboards, exports, queries   |
| Week 3 | Administration: user management, configuration, imports |
| Week 4 | Edge cases, regression testing, sign-off preparation    |

### _Test Scenarios_

| Category        | Example Scenarios                                   |
| :-------------- | :-------------------------------------------------- |
| Data Management | Submit form, upload file, run import, validate data |
| Reporting       | Track submission status, run analytics, export data |
| Security        | Login, verify access, review audit log              |
| Training        | Complete walkthrough, search help center            |
| UI              | Navigate dashboard, receive notification            |

### _Sign-Off Criteria_

UAT sign-off requires:

1. All critical and high severity defects resolved
2. Test scenarios executed with documented results
3. No blocking issues for go-live
4. Written sign-off from viaSport project sponsor

After UAT sign-off, the platform is promoted to production and monitoring is enabled.

# **_Service Approach: Training and Onboarding_** {#service-approach:-training-and-onboarding}

## **Audience-Based Training Approach**

Training is tailored to distinct user groups with different responsibilities.

| Audience                | Role                                       | Training Focus                                |
| :---------------------- | :----------------------------------------- | :-------------------------------------------- |
| viaSport Administrators | Platform oversight, analytics, PSO support | Admin tools, cross-org reporting, governance  |
| PSO Reporters           | Data submission, compliance                | Form completion, file uploads, deadlines      |
| Data Stewards           | Data quality, imports                      | Validation, error resolution, bulk operations |

### _Training Delivery Model_

| Method                     | Audience                    | Format                                |
| :------------------------- | :-------------------------- | :------------------------------------ |
| In-app guided walkthroughs | All users                   | Interactive tours inside the platform |
| Live training sessions     | viaSport admins, PSO admins | Video workshops and Q and A           |
| Train-the-trainer          | viaSport staff              | Enable viaSport to support PSOs       |
| Self-service help center   | All users                   | Searchable guides, FAQ, templates     |

### _Training Phases_

| Phase                   | Timing      | Participants       | Content                                    |
| :---------------------- | :---------- | :----------------- | :----------------------------------------- |
| viaSport Admin Training | Weeks 27-28 | viaSport staff     | Full platform capabilities and admin tools |
| Soft Launch Training    | Week 29     | Pilot cohort PSOs  | Core workflows with intensive support      |
| PSO Rollout Training    | Week 30     | PSO administrators | Core workflows and reporting               |
| Ongoing                 | Post-launch | All users          | Refreshers and new features                |

### _PSO Rollout Cohorts_

Cohort sizing and scheduling will be confirmed with viaSport during Planning (confirmed during Discovery).

## **Resources and Sample Training Materials**

### _In-App Training Features_

| Feature             | Description                               |
| :------------------ | :---------------------------------------- |
| Guided walkthroughs | Step-by-step tutorials for common tasks   |
| Onboarding tour     | First-time user walkthrough of key areas  |
| Progress tracking   | Per-user tracking of completed tutorials  |
| Contextual help     | Help icons and tooltips throughout the UI |

### _Help Center_

The help center provides searchable guides and FAQs by role:

| Content Type           | Examples                                               |
| :--------------------- | :----------------------------------------------------- |
| Getting started guides | Account setup, first login, dashboard overview         |
| How-to articles        | Submit a form, upload a file, export data              |
| FAQ                    | Common questions organized by category                 |
| Troubleshooting        | Login issues, validation errors, browser compatibility |

### _Templates Hub_

Templates are centrally managed and available in context:

| Template Type       | Purpose                                      |
| :------------------ | :------------------------------------------- |
| Import templates    | CSV and Excel templates with correct headers |
| Form templates      | Example submissions and expected formats     |
| Reporting templates | Sample reporting configurations and exports  |

### _Documentation Formats_

| Format             | Use Case                              |
| :----------------- | :------------------------------------ |
| In-app interactive | Primary delivery, always current      |
| PDF guides         | Offline reference                     |
| Video tutorials    | Visual learners and complex workflows |

Sample training materials will be reviewed with viaSport during Planning (confirmed during Discovery).

## **Help Desk and Ticketing Model**

The table below covers help desk inquiries (questions, how-to, bug reports). System incidents (Sev 1-4) follow the SLA response targets in [Service Levels, Support, and Reliability](#service-levels,-support,-and-reliability).

### _Support Tiers_

| Tier   | Channel                 | Scope                         | Response                                             |
| :----- | :---------------------- | :---------------------------- | :--------------------------------------------------- |
| Tier 1 | In-app support requests | General questions, how-to     | 24 hours                                             |
| Tier 2 | Email                   | Technical issues, bug reports | 24 hours                                             |
| Tier 3 | Direct escalation       | System incidents              | See [SLA](#service-levels,-support,-and-reliability) |

### _Support Hours_

| Coverage        | Hours                                                 |
| :-------------- | :---------------------------------------------------- |
| Standard        | Business hours, Pacific Time (Mon to Fri, 9am to 5pm) |
| Critical issues | Business hours with monitoring alerts                 |

24/7 support is available as an optional add-on.

### _Ticket Workflow_

User submits request  
 ↓  
Ticket created with unique ID  
 ↓  
Support team reviews and assigns  
 ↓  
Response provided (in-app and email)  
 ↓  
User can reply or mark resolved  
 ↓  
Ticket closed

### _Response Commitments (Help Desk Inquiries)_

| Priority | First Response | Target Resolution |
| :------- | :------------- | :---------------- |
| High     | 8 hours        | 2 business days   |
| Standard | 24 hours       | 5 business days   |
| Low      | 48 hours       | 10 Business Days  |

System incidents (Sev 1-4) follow the response targets in **Service Levels, Support, and Reliability** (Sev 1: 60-minute acknowledgement, escalation to delivery lead). Resolution targets depend on issue complexity and may require additional time for root-cause analysis.

viaSport receives monthly support reports covering ticket volume, response times, and trends.

# **_Service Levels, Support, and Reliability_** {#service-levels,-support,-and-reliability}

viaSport is procuring an SLA-backed managed service: a platform that performs reliably during reporting cycles, with clear operational ownership. This section defines the service level commitments included in the Platform Subscription \+ Managed Service.

## **Availability and Uptime**

| Metric                        | Target                                                                         |
| :---------------------------- | :----------------------------------------------------------------------------- |
| Monthly availability target   | 99.9% (excluding scheduled maintenance)                                        |
| Scheduled maintenance windows | Communicated 7 days in advance; typically during low-usage periods             |
| Emergency maintenance         | Critical security or stability issues only; immediate notification to viaSport |

Availability is measured as the percentage of time the production application is accessible and functional during each calendar month.

## **Monitoring and Alerting**

| Capability                | Implementation                                                                                                                      |
| :------------------------ | :---------------------------------------------------------------------------------------------------------------------------------- |
| Application monitoring    | 24/7 automated monitoring of application health, response times, and error rates                                                    |
| Infrastructure monitoring | AWS CloudWatch metrics for compute, database, storage, and network                                                                  |
| Security monitoring       | CloudTrail audit logging with Center for Internet Security (CIS) Benchmark alarms (root usage, IAM changes, security group changes) |
| Alerting                  | Automated alerts to service team for threshold breaches and anomalies                                                               |
| Status communication      | Proactive notification to viaSport for incidents affecting service                                                                  |

## **Incident Response**

### _Severity Definitions_

| Severity          | Definition                                                                 | Examples                                                                        |
| :---------------- | :------------------------------------------------------------------------- | :------------------------------------------------------------------------------ |
| Sev 1 \- Critical | System unavailable or major security incident; significant business impact | Production down, data breach, complete loss of core functionality               |
| Sev 2 \- High     | Major function impaired; workaround may exist but impacts productivity     | Reporting unavailable during deadline period, login failures for multiple users |
| Sev 3 \- Medium   | Issue affecting users but workaround available                             | Single feature not working, performance degradation, minor UI issues            |
| Sev 4 \- Low      | Minor issue or cosmetic defect; minimal business impact                    | Typo, minor styling issue, enhancement request                                  |

### _Response and Resolution Targets_

| Severity          | First Response | Target Resolution | Escalation                                                                                   |
| :---------------- | :------------- | :---------------- | :------------------------------------------------------------------------------------------- |
| Sev 1 \- Critical | 60 minutes     | Same business day | Immediate escalation to delivery lead; updates to viaSport every 60 minutes until mitigation |
| Sev 2 \- High     | 8 hours        | 2 business days   | Escalation if no progress in 24 hours                                                        |
| Sev 3 \- Medium   | 24 hours       | 5 business days   | Standard workflow                                                                            |
| Sev 4 \- Low      | 48 hours       | 10 Business Days  | Standard workflow                                                                            |

**Business hours:** Monday to Friday, 9:00 AM to 5:00 PM Pacific Time, excluding BC statutory holidays.

**Sev 1 acknowledgement is 24/7; Sev 2–4 response targets apply during business hours.** Monitoring is 24/7 in all cases.

**Note:** Resolution targets depend on issue complexity and may require additional time for root-cause analysis. viaSport will be kept informed of progress and revised estimates.

### _24/7 Support Option_

24/7 response coverage is available as an optional add-on ($30,000-$50,000/year). This provides:

- After-hours monitoring with on-call response
- Sev 1 response target reduced to 2 hours
- Weekend and holiday coverage

## **Support Channels**

| Channel                 | Use Case                                    | Response                                             |
| :---------------------- | :------------------------------------------ | :--------------------------------------------------- |
| In-app support requests | General questions, how-to, feature requests | Ticket created with unique ID; tracked to resolution |
| Email                   | Technical issues, bug reports, escalations  | Same ticketing workflow                              |
| Emergency contact       | Sev 1 incidents only                        | Direct phone/text to delivery lead                   |

### _Support Workflow_

1. User submits request (in-app or email)
2. Ticket created with unique ID and severity assignment
3. Acknowledgement sent to user
4. Service team triages and assigns
5. Response provided (in-app notification and email)
6. User can reply or mark resolved
7. Ticket closed with resolution summary

viaSport receives monthly support reports covering ticket volume, response times, resolution rates, and trends.

## **Backup and Recovery**

| Parameter                      | Commitment                                       |
| :----------------------------- | :----------------------------------------------- |
| Backup frequency               | Continuous (point-in-time recovery enabled)      |
| Backup retention               | 35 days in production                            |
| Recovery Point Objective (RPO) | 1 hour                                           |
| Recovery Time Objective (RTO)  | 4 hours                                          |
| DR exercise frequency          | Quarterly                                        |
| DR exercise reporting          | Results reported to viaSport after each exercise |

### _High Availability_

The production environment uses Multi-AZ deployment for automatic failover. Database and application tiers are distributed across multiple availability zones within AWS Canada (Central).

## **Security Operations**

| Activity                     | Cadence                                                                              |
| :--------------------------- | :----------------------------------------------------------------------------------- |
| Security patching (routine)  | Monthly, during scheduled maintenance windows                                        |
| Security patching (critical) | Within 2 business days of vendor patch availability                                  |
| Dependency updates           | Monthly review; immediate for security-related updates                               |
| Security reviews             | Quarterly review of access controls, configurations, and logs                        |
| Penetration testing          | Available as optional add-on (see [Commercial Model](#commercial-model-and-pricing)) |

## **Release Management**

| Aspect              | Approach                                                        |
| :------------------ | :-------------------------------------------------------------- |
| Release cadence     | Periodic releases based on roadmap; security patches as needed  |
| Release notes       | Provided to viaSport before each release                        |
| Staging validation  | All releases validated in staging environment before production |
| Rollback capability | Immediate rollback available if issues detected post-release    |
| Change log          | Maintained and accessible to viaSport administrators            |

## **Reporting to viaSport**

viaSport will receive regular operational reports:

| Report              | Frequency | Contents                                                |
| :------------------ | :-------- | :------------------------------------------------------ |
| Support summary     | Monthly   | Ticket volume, response times, resolution rates, trends |
| Availability report | Monthly   | Uptime percentage, incidents, maintenance windows       |
| Security summary    | Quarterly | Patching status, security reviews, any incidents        |
| DR exercise results | Quarterly | Exercise execution, recovery times achieved, any issues |

## **Service Level Governance**

### _Review Cadence_

- **Monthly:** Operational review (support metrics, availability, upcoming maintenance)
- **Quarterly:** Service review (SLA performance, security posture, roadmap alignment)
- **Annual:** Contract review (renewal terms, service level adjustments, pricing)

### _Service Credits_

Service credits apply when the monthly availability target is missed. Credits are applied to the following quarter's invoice based on the schedule below:

| Monthly Availability | Credit                      |
| :------------------- | :-------------------------- |
| 99.0% \- 99.9%       | 5% of monthly subscription  |
| 95.0% \- 99.0%       | 10% of monthly subscription |
| Below 95.0%          | 25% of monthly subscription |

Credits are applied to the following quarter's invoice upon viaSport request with documented evidence of downtime.

_Full service level terms can be incorporated into a formal SLA schedule as part of the contract._

# **_System Requirements Compliance Matrix_** {#system-requirements-compliance-matrix}

This table summarizes compliance status for all 25 requirements. Detailed implementation notes follow in subsequent sections.

## **Status Legend**

| Status                                       | Meaning                                                                                                                              |
| :------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------- |
| Implemented (Demoable Now)                   | Platform capability is fully built and available in the evaluation environment                                                       |
| Implemented; Requires viaSport Configuration | Capability is built; final values/content (templates, labels, policies, branding) are configured with viaSport during implementation |
| Requires Production Data Confirmation        | Capability is built; final migration mappings and edge cases are validated once BCAR/BCSI access is available                        |
| Optional / Post-Award                        | Not required for initial launch unless viaSport elects to scope it in                                                                |

## **Data Management (DM-AGG)**

| Req ID     | Title                                 | Status                                       | Evaluation Environment (Jan 2026\)              | Finalization Scope                                |
| :--------- | :------------------------------------ | :------------------------------------------- | :---------------------------------------------- | :------------------------------------------------ |
| DM-AGG-001 | Data Collection and Submission        | Implemented; Requires viaSport Configuration | Form builder, file uploads, submission tracking | Load viaSport templates during discovery          |
| DM-AGG-002 | Data Processing and Integration       | Optional / Post-Award                        | Import and export, validation, audit logging    | Optional: scope external integrations if required |
| DM-AGG-003 | Data Governance and Access Control    | Implemented (Demoable Now)                   | RBAC, org scoping, data catalog                 | Finalize taxonomy with viaSport during discovery  |
| DM-AGG-004 | Data Quality and Integrity            | Implemented (Demoable Now)                   | Validation, alerting with thresholds            | Configure thresholds during discovery             |
| DM-AGG-005 | Data Storage and Retention            | Implemented; Requires viaSport Configuration | Backups, archiving, retention enforcement       | Confirm durations during discovery                |
| DM-AGG-006 | Legacy Data Migration and Bulk Import | Requires Production Data Confirmation        | Smart import with autofix, dynamic templates    | Confirm extraction method once access granted     |

## **Reporting (RP-AGG)**

| Req ID     | Title                                  | Status                                       | Evaluation Environment (Jan 2026\)           | Finalization Scope                  |
| :--------- | :------------------------------------- | :------------------------------------------- | :------------------------------------------- | :---------------------------------- |
| RP-AGG-001 | Data Validation and Submission Rules   | Implemented (Demoable Now)                   | Validation rules and error messaging         | None                                |
| RP-AGG-002 | Reporting Information Management       | Implemented; Requires viaSport Configuration | Reporting metadata schema, delegated access  | Configure metadata during discovery |
| RP-AGG-003 | Reporting Flow and Support             | Implemented (Demoable Now)                   | Reminders, resubmission tracking, dashboards | None                                |
| RP-AGG-004 | Reporting Configuration and Collection | Implemented (Demoable Now)                   | Form builder, file management                | None                                |
| RP-AGG-005 | Self-Service Analytics and Data Export | Implemented (Demoable Now)                   | Native BI, pivots, charts, export            | None                                |

## **Security (SEC-AGG)**

| Req ID      | Title                             | Status                     | Evaluation Environment (Jan 2026\)                              | Finalization Scope |
| :---------- | :-------------------------------- | :------------------------- | :-------------------------------------------------------------- | :----------------- |
| SEC-AGG-001 | Authentication and Access Control | Implemented (Demoable Now) | MFA, RBAC, password policy, org scoping                         | None               |
| SEC-AGG-002 | Monitoring and Threat Detection   | Implemented (Demoable Now) | AWS WAF, rate limiting, pre-auth lockout, CloudTrail CIS alarms | None               |
| SEC-AGG-003 | Privacy and Regulatory Compliance | Implemented (Demoable Now) | Encryption, Canadian hosting, retention controls                | None               |
| SEC-AGG-004 | Audit Trail and Data Lineage      | Implemented (Demoable Now) | Immutable audit log, hash chain                                 | None               |

## **Training and Onboarding (TO-AGG)**

| Req ID     | Title                            | Status                                       | Evaluation Environment (Jan 2026\)    | Finalization Scope                       |
| :--------- | :------------------------------- | :------------------------------------------- | :------------------------------------ | :--------------------------------------- |
| TO-AGG-001 | Template Support and Integration | Implemented; Requires viaSport Configuration | Template hub with preview, versioning | Load viaSport templates during discovery |
| TO-AGG-002 | Guided Learning and Walkthroughs | Implemented; Requires viaSport Configuration | Auto-launch tours, progress tracking  | Final content review during discovery    |
| TO-AGG-003 | Reference Materials and Support  | Implemented; Requires viaSport Configuration | Role-scoped help, support with SLA    | Refine content during discovery          |

## **User Interface (UI-AGG)**

| Req ID     | Title                                   | Status                                       | Evaluation Environment (Jan 2026\)        | Finalization Scope                       |
| :--------- | :-------------------------------------- | :------------------------------------------- | :---------------------------------------- | :--------------------------------------- |
| UI-AGG-001 | User Access and Account Control         | Implemented (Demoable Now)                   | Login, MFA, recovery, RBAC                | None                                     |
| UI-AGG-002 | Personalized Dashboard                  | Implemented (Demoable Now)                   | Role-aware dashboards                     | None                                     |
| UI-AGG-003 | Responsive and Inclusive Design         | Implemented (Demoable Now)                   | Responsive UI, accessibility scans        | None                                     |
| UI-AGG-004 | Task and Notification Management        | Implemented (Demoable Now)                   | Notifications and reminders               | None                                     |
| UI-AGG-005 | Content Navigation and Interaction      | Implemented (Demoable Now)                   | Search, filtering, command palette        | None                                     |
| UI-AGG-006 | User Support and Feedback               | Implemented (Demoable Now)                   | Support with priority, SLA, notifications | None                                     |
| UI-AGG-007 | Consistent Visual Language and Branding | Implemented; Requires viaSport Configuration | Design system and theming                 | Apply viaSport branding during discovery |

## **Summary**

| Category                | Total  | Implemented |
| :---------------------- | :----- | :---------- |
| Data Management         | 6      | 6           |
| Reporting               | 5      | 5           |
| Security                | 4      | 4           |
| Training and Onboarding | 3      | 3           |
| User Interface          | 7      | 7           |
| **Total**               | **25** | **25**      |

All 25 requirements are implemented. Finalization scope items (viaSport-specific configuration, templates, branding) are completed during discovery and implementation.

# **_System Requirements: Data Management (DM-AGG)_** {#system-requirements:-data-management-(dm-agg)}

## **Compliance Summary**

| Req ID     | Title                                 | Status                                       | Evaluation Environment (Jan 2026\)                                 | Finalization Scope                           |
| :--------- | :------------------------------------ | :------------------------------------------- | :----------------------------------------------------------------- | :------------------------------------------- |
| DM-AGG-001 | Data Collection and Submission        | Implemented; Requires viaSport Configuration | Form builder, file uploads, submission tracking                    | viaSport templates and field definitions     |
| DM-AGG-002 | Data Processing and Integration       | Optional / Post-Award                        | Import and export, validation, audit logging                       | External integrations (optional, post-award) |
| DM-AGG-003 | Data Governance and Access Control    | Implemented (Demoable Now)                   | RBAC, org scoping, data catalog                                    | Catalog taxonomy refinement                  |
| DM-AGG-004 | Data Quality and Integrity            | Implemented (Demoable Now)                   | Validation rules, quality alerting with thresholds                 | Threshold tuning with viaSport               |
| DM-AGG-005 | Data Storage and Retention            | Implemented; Requires viaSport Configuration | Backups, archiving, retention enforcement                          | Retention durations (viaSport Discovery)     |
| DM-AGG-006 | Legacy Data Migration and Bulk Import | Requires Production Data Confirmation        | Smart import with error categorization, autofix, dynamic templates | Legacy extraction (awaiting BCAR/BCSI)       |

## **DM-AGG-001: Data Collection and Submission**

**Requirement:**

The system shall enable customizable form building, support flexible data entry through variable formats (forms, file uploads), with capabilities for real-time submission tracking, editing, and historical data migration.

**Acceptance Criteria:**

Users and System Admin can successfully submit, track, and edit data.

**How We Meet It:**

- Administrators build and publish custom forms without code changes.
- Submissions support file uploads and status tracking.
- Users can edit submissions and view version history.

**Evaluation Environment (Jan 2026):**

- Form builder with 11 field types (text, number, email, phone, date, select, multiselect, checkbox, file, textarea, rich text).
- Submission statuses with history and audit entries.
- File uploads validated and stored in S3 with access controls.
- Import jobs link historical data to form submissions.

**Finalization Scope:**

- viaSport specific templates and field definitions (confirmed during Discovery).

**viaSport Dependencies:**

- Final form templates and data dictionary.

**Approach:** Template and field definitions will be finalized during Discovery. See [Service Approach: Data Submission and Reporting Web Portal](#service-approach:-data-submission-and-reporting-web-portal) for UX approach.

**Evidence:** Evidence is summarized in Section 1.3.

## **DM-AGG-002: Data Processing and Integration**

**Requirement:**

The system shall enable standardization of data formatting, logging of transformation processes, and integration with external platforms through API (optional), and data import/export mechanisms.

**Acceptance Criteria:**

Incoming data is processed uniformly, logged for traceability, and exchanged with external platforms.

**How We Meet It:**

- Import and export pipelines normalize data types and validate required fields.
- Transformation and import events are logged in the audit trail.
- Export formats support CSV, Excel, and JSON.

**Evaluation Environment (Jan 2026):**

- Import parser with typed validation and row level error logging.
- Mapping templates and audit logging for import jobs.
- Export controls enforced through BI and reporting pipelines.

**Finalization Scope:**

- External API integrations scoped with viaSport and legacy system owners.
- Standardized mapping rules for cross system integrations.

**viaSport Dependencies:**

- Integration targets, API access, and data exchange requirements.

**Approach:** Define integration scope during Discovery, then implement connectors and validation. See [Service Approach: Data Migration](#service-approach:-data-migration) for methodology.

**Evidence:** Evidence is summarized in Section 1.3.

## **DM-AGG-003: Data Governance and Access Control**

**Requirement:**

The system shall enforce role-based access to data and provide administrators with secure database access, along with data cataloging and indexing capabilities for discoverability.

**Acceptance Criteria:**

Users can only access data based on permission.

**How We Meet It:**

- Role-based access control with organization scoping is enforced on every query.
- Field-level access control is applied in analytics and exports.
- Data catalog indexes forms, templates, and reports for discoverability.

**Evaluation Environment (Jan 2026):**

- Predefined roles (owner, admin, reporter, viewer) with permission checks.
- Data catalog and global search for forms, templates, and reports.
- Admin access to data through audited BI and SQL workbench.

### _Data Catalog (What It Is)_

In Solstice, the Data Catalog is a searchable inventory of forms, fields, templates, reports, and saved analytics views, with permission-aware access. It helps users discover what data exists and where it is used. It is not a document management system. Uploaded files are stored in S3 and referenced from submissions and catalog entries through secure links and access controls.

During discovery, we will confirm the proportion of structured submission data versus document-centric reporting and adjust catalog tagging and search priorities accordingly.

**Finalization Scope:**

- Catalog taxonomy and tagging refinement with viaSport (confirmed during Discovery).

**viaSport Dependencies:**

- Preferred catalog taxonomy and indexing priorities.

**Approach:** Refine catalog categories during Discovery. See [Service Approach: Platform Design and Customization](#service-approach:-platform-design-and-customization) for governance approach.

**Evidence:** Evidence is summarized in Section 1.3.

## **DM-AGG-004: Data Quality and Integrity**

**Requirement:**

The system shall ensure relational integrity and continuously monitor data quality using validation rules and automated checks.

**Acceptance Criteria:**

Submitted data meets validation rules.

**How We Meet It:**

- Database constraints enforce relational integrity.
- Forms and imports validate required fields and formats.
- Automated quality checks identify missing fields and validation errors.

**Evaluation Environment (Jan 2026):**

- Server-side validation with Zod schemas and form rules.
- Data quality monitoring job with threshold evaluation and change-only admin notifications.
- Global alert thresholds with optional org-level overrides via organization settings.
- Admin dashboard view for data quality metrics with notification link.

**Finalization Scope:**

- Threshold tuning and alert recipients confirmed with viaSport (confirmed during Discovery).

**viaSport Dependencies:**

- Data quality threshold preferences and escalation contacts.

**Approach:** Configure thresholds during Discovery and validate in UAT. See [Service Approach: Testing and Quality Assurance](#service-approach:-testing-and-quality-assurance).

**Evidence:** Evidence is summarized in Section 1.3.

## **DM-AGG-005: Data Storage and Retention**

**Requirement:**

The system shall support regular backups, disaster recovery mechanisms, data archiving, and secure cloud hosting aligned with retention policies.

**Acceptance Criteria:**

Data is backed up, archived as scheduled, and securely hosted in the cloud.

**How We Meet It:**

- RDS backups with point in time recovery are enabled.
- Retention enforcement and legal hold workflows protect regulated data.
- Audit logs are immutable and archived to S3 Deep Archive.

**Evaluation Environment (Jan 2026):**

- Backup retention configured per environment (35 days in production).
- Retention policy engine with legal holds and audit log archiving.
- S3 Object Lock enabled for artifacts storage.

**Finalization Scope:**

- Retention durations to be confirmed with viaSport during Discovery.

**viaSport Dependencies:**

- Confirm retention durations and DR schedule.

**Approach:** Run final DR and retention validation in sin-perf or sin-prod. See [Service Approach: Data Warehousing](#service-approach:-data-warehousing).

**Evidence:** Evidence is summarized in Appendix C (Performance Evidence) and Appendix D (Security Architecture Summary).

## **DM-AGG-006: Legacy Data Migration and Bulk Import**

**Requirement:**

The system shall provide tooling and configurable mapping templates to import historical data from CSV/Excel, legacy databases, or APIs, including validation, error-handling, and rollback.

**Acceptance Criteria:**

Administrators can map legacy fields to system fields, preview results, and execute import; import logs stored for audit.

**How We Meet It:**

- Smart import wizard supports CSV and Excel uploads with intelligent error handling.
- Pattern detection identifies column type mismatches and suggests fixes.
- One-click autofix for common issues with confidence scoring.
- Import jobs are auditable and reversible within the rollback window.

**Evaluation Environment (Jan 2026):**

- **Intelligent Error Categorization:** Errors grouped by root cause (structural, data quality, completeness, referential) instead of row-by-row display
- **Pattern Detection:** 13 pattern detectors (email, date formats, phone, currency, postal codes, UUID, etc.) automatically identify column type mismatches
- **Autofix with Confidence Scoring:** One-click fixes for column swaps, date format conversion, boolean normalization; dynamic confidence based on pattern match ratio, header hints, and sample size
- **In-App Correction:** Inline cell editing with real-time validation, eliminating re-upload for minor fixes
- **Dynamic Templates:** Generate XLSX/CSV templates from any form definition with field descriptions, example values, and Excel data validation dropdowns
- **Virtualized Preview:** TanStack Virtual for 10k+ row previews without performance degradation
- **Admin Template Management:** Template CRUD, version tracking, import history with rollback
- **Batch Processing:** ECS Fargate worker for large file processing (deployed in sin-perf and sin-uat)

**Finalization Scope:**

- Legacy extraction and BCAR or BCSI mapping rules.
- Additional migration pipelines for organization and user records (pending viaSport legacy access).

**viaSport Dependencies:**

- Legacy export access and schema documentation.
- SME review for mapping templates.

**Approach:** Finalize extraction approach during Discovery, then execute pilot and phased migration. See [Service Approach: Data Migration](#service-approach:-data-migration).

**Demo Path:** Dashboard → Admin → Imports (Smart wizard with autofix demo)

**Evidence:** Evidence is summarized in Section 1.3.

---

# **_System Requirements: Reporting (RP-AGG)_** {#system-requirements:-reporting-(rp-agg)}

## **Compliance Summary**

| Req ID     | Title                                  | Status                                       | Evaluation Environment (Jan 2026\)                 | Finalization Scope              |
| :--------- | :------------------------------------- | :------------------------------------------- | :------------------------------------------------- | :------------------------------ |
| RP-AGG-001 | Data Validation and Submission Rules   | Implemented (Demoable Now)                   | Validation rules and error messaging               | None                            |
| RP-AGG-002 | Reporting Information Management       | Implemented; Requires viaSport Configuration | Reporting metadata schema and access controls      | viaSport metadata configuration |
| RP-AGG-003 | Reporting Flow and Support             | Implemented (Demoable Now)                   | Reminders, resubmission tracking, dashboards       | None                            |
| RP-AGG-004 | Reporting Configuration and Collection | Implemented (Demoable Now)                   | Form builder, file management, admin configuration | None                            |
| RP-AGG-005 | Self-Service Analytics and Data Export | Implemented (Demoable Now)                   | Native BI, pivots, charts, CSV and Excel export    | None                            |

## **RP-AGG-001: Data Validation and Submission Rules**

**Requirement:**

The system shall validate submissions to ensure they are complete, clean, use the correct file types, and contain valid data fields such as dates and contact information.

**Acceptance Criteria:**

Submissions that fail validation are rejected with appropriate error messages.

**How We Meet It:**

- Required fields and validation rules are enforced on submit.
- File uploads are validated by MIME type and size.
- Errors are shown inline with actionable messages.

**Evaluation Environment (Jan 2026):**

- Zod-based validation for forms and imports.
- Server-side enforcement to prevent bypassing client checks.
- File upload validation and safe storage keys.

**Finalization Scope:**

- None. Fully implemented.

**Approach:** Continue to refine validation rules during Discovery based on viaSport templates.

**Evidence:** Evidence is summarized in Section 1.3.

## **RP-AGG-002: Reporting Information Management**

**Requirement:**

The system shall manage metadata related to reporting including but not limited to contribution agreements, NCCP, contact details, fiscal periods, organization profiles, and delegated access rights.

**Acceptance Criteria:**

Users can update relevant metadata and access reporting features accordingly.

**How We Meet It:**

- Reporting metadata schema includes fiscal periods, contribution agreements, and NCCP fields.
- Organization profiles and delegated access are managed through roles and invites.
- Reporting tasks and submissions are tied to organizations and cycles.

**Evaluation Environment (Jan 2026):**

- Reporting metadata schema and update endpoints.
- Organization profile and role management with delegated access.
- Reporting cycles and tasks with due dates and reminders.

**Finalization Scope:**

- viaSport metadata configuration and UI refinement for specific fields (confirmed during Discovery).

**viaSport Dependencies:**

- Data dictionary and field definitions for contribution agreements and NCCP.

**Approach:** Configure metadata fields during Discovery and validate in UAT. See [System Requirements: Training and Onboarding (TO-AGG)](<#system-requirements:-training-and-onboarding-(to-agg)>) for change adoption.

**Evidence:** Evidence is summarized in Section 1.3.

## **RP-AGG-003: Reporting Flow and Support**

**Requirement:**

The system shall support automated reporting reminders, allow users to track data resubmissions, and visualize submitted data through dashboards.

**Acceptance Criteria:**

Users are reminded, track changes, and view data in a dashboard format.

**How We Meet It:**

- Reporting tasks track status across cycles and due dates.
- Reminder schedules generate in-app and email notifications.
- Submission history records resubmissions and status changes.

**Evaluation Environment (Jan 2026):**

- Reporting dashboard with status and due dates.
- Reminder schedules and notification delivery.
- Submission history and resubmission tracking.

**Finalization Scope:**

- None. Fully implemented.

**Approach:** Reminder cadence and reporting dashboards will be tuned with viaSport during Discovery.

**Evidence:** Evidence is summarized in Section 1.3.

## **RP-AGG-004: Reporting Configuration and Collection**

**Requirement:**

The system shall allow system administrators to configure customizable reporting forms, define required fields, display files for users to read, edit, delete, and download.

**Acceptance Criteria:**

System admin can configure reporting information and forms.

**How We Meet It:**

- Administrators build forms and set required fields.
- File uploads are visible with read, download, and delete controls.
- Form versions preserve historical submissions.

**Evaluation Environment (Jan 2026):**

- Form builder and versioning for reporting forms.
- File management for submissions with delete and download actions.
- Admin reporting configuration tools.

**Finalization Scope:**

- None. Fully implemented.

**Approach:** Continue to refine reporting form templates during Discovery.

**Evidence:** Evidence is summarized in Section 1.3.

## **RP-AGG-005: Self-Service Analytics and Data Export**

**Requirement:**

Enable authorized users to build ad-hoc charts, pivot tables, and export raw or aggregated datasets in CSV, Excel, or JSON (optional) without developer intervention.

**Acceptance Criteria:**

The user builds a custom chart and exports the underlying dataset to CSVs; export respects field-level access rules.

**How We Meet It:**

- Native BI supports pivot tables, charts, and dashboards.
- Exports are available in CSV, Excel, and JSON.
- Field-level access and step-up authentication protect sensitive data.

**Evaluation Environment (Jan 2026):**

- Pivot builder and charting with ECharts.
- CSV, XLSX, and JSON exports with audit logging.
- Field-level access control and step-up authentication on export.

**Finalization Scope:**

- None. Fully implemented.

**Approach:** Continue to expand datasets and templates as viaSport priorities are defined.

**Evidence:** Evidence is summarized in Section 1.3.

# **_System Requirements: Security (SEC-AGG)_** {#system-requirements:-security-(sec-agg)}

## **Compliance Summary**

| Req ID      | Title                             | Status                     | Evaluation Environment (Jan 2026\)                              | Finalization Scope |
| :---------- | :-------------------------------- | :------------------------- | :-------------------------------------------------------------- | :----------------- |
| SEC-AGG-001 | Authentication and Access Control | Implemented (Demoable Now) | MFA, RBAC, org scoping, user admission                          | None               |
| SEC-AGG-002 | Monitoring and Threat Detection   | Implemented (Demoable Now) | AWS WAF, rate limiting, pre-auth lockout, CloudTrail CIS alarms | None               |
| SEC-AGG-003 | Privacy and Regulatory Compliance | Implemented (Demoable Now) | Encryption, Canadian hosting, retention controls                | None               |
| SEC-AGG-004 | Audit Trail and Data Lineage      | Implemented (Demoable Now) | Immutable audit log with hash chain                             | None               |

## **SEC-AGG-001: Authentication and Access Control**

**Requirement:**

The system shall enforce multi-factor authentication, support secure password recovery, restrict access based on user roles and affiliations, and allow organizational leaders to manage user admission.

**Acceptance Criteria:**

Users log in securely; only authorized individuals gain access based on role and affiliation.

**How We Meet It:**

- MFA with TOTP and backup codes is supported.
- Password reset uses time-limited email tokens.
- Password complexity enforced on signup and reset (uppercase, lowercase, number, symbol).
- RBAC and organization scoping are enforced in the API layer.
- Organization owners and admins manage invites and join requests.

**Evaluation Environment (Jan 2026):**

- MFA enrollment and recovery flows.
- Server-side password policy enforcement (validated: weak passwords blocked with inline errors).
- Role-based permissions and org membership enforcement.
- User invitation and join request workflows.

**Finalization Scope:**

- None. Fully implemented.

**Approach:** Continue to validate flows during UAT. See [Service Approach: Testing and Quality Assurance](#service-approach:-testing-and-quality-assurance).

**Evidence:** Evidence is summarized in Section 1.2.

## **SEC-AGG-002: Monitoring and Threat Detection**

**Requirement:**

The system shall detect and flag suspicious activities such as unusual login patterns or behavior anomalies and automatically lock accounts where appropriate.

**Acceptance Criteria:**

Security anomalies are flagged, logged, and result in appropriate account safeguards.

**How We Meet It:**

- Heuristic threat detection uses configurable thresholds to flag suspicious patterns.
- CloudFront edge security provides DDoS protection, security headers, and AWS WAF managed rules with rate limiting.
- Failed logins trigger account flagging and lockouts.
- Rate limiting protects authentication and API endpoints.
- CloudTrail with CIS Benchmark alarms detects infrastructure-level anomalies.
- Admins receive security alerts for flagged activity.

**CORS and Network Architecture:** The application uses a same-origin architecture where the frontend and API are served from the same CloudFront distribution, eliminating the need for CORS preflight requests. AWS WAF rules are configured for standard HTTPS traffic without requiring cross-origin exceptions.

**Network Isolation Option:** For environments requiring enhanced network isolation, AWS WAF can be configured with IP-based allow lists to restrict access to authorized networks. The current configuration uses rate limiting and managed rule sets; IP allow lists can be added per viaSport's security policy.

**Evaluation Environment (Jan 2026):**

- Pre-auth lockout gating blocks sign-in for locked users before authentication.
- Rate limiting with Redis-backed sliding window (auth: 30 requests per 15 minutes in evaluation environment; production default 5/15 min, configurable).
- Login failure thresholds: 5 failures in 15 minutes triggers 30-minute account lockout (30 failures in 15 minutes in evaluation environment).
- AWS WAF WebACL deployed on CloudFront with AWS Managed Rule Groups (Common Rule Set, SQLi, Known Bad Inputs) and edge rate limiting.
- Security event logging to security_events table with CloudWatch metrics.
- CloudTrail audit logging with CIS Benchmark alarms (root usage, IAM changes, security group changes, VPC changes, unauthorized API calls).
- CloudWatch alarms for anomalous request patterns and error rate spikes.
- Admin notifications for login anomalies and account lockouts.

**Finalization Scope:**

- None. Fully implemented.

**Approach:** Security rules are tuned with viaSport and validated in UAT.

**Evidence:** Evidence is summarized in Section 1.2.

## **SEC-AGG-003: Privacy and Regulatory Compliance**

**Requirement:**

The system shall comply with relevant data protection laws (e.g., PIPEDA) to ensure secure handling, storage, and access to personal information.

**Acceptance Criteria:**

All sensitive data is encrypted and stored securely.

**How We Meet It:**

The platform is designed to be compliant with PIPA (Personal Information Protection Act, BC) and PIPEDA (federal):

- **Data minimization:** Collection is limited to information necessary for identified purposes. Configurable retention policies ensure data is retained only as long as necessary.
- **Data accuracy:** Validation rules ensure completeness and correctness at submission.
- **Security safeguards:** Reasonable security measures protect personal information from unauthorized access, collection, use, disclosure, copying, modification, disposal, or destruction.
- **Data residency:** Canadian hosting (ca-central-1) for all primary data stores .
- **Access controls:** Role-based and field-level access controls protect PII.
- **Retention controls:** Retention policies and legal holds support data minimization and regulatory compliance.

**Privacy Officer:** Austin Wallace (Delivery Lead) is designated as Privacy Officer responsible for PIPA/PIPEDA compliance. The Privacy Officer has access to all information related to personal data processing and will coordinate with viaSport on privacy impact assessments, data handling procedures, and incident response.

**Evaluation Environment (Jan 2026):**

- Canadian hosting region (ca-central-1) for all primary data stores.
- AES-256 encryption via AWS KMS for RDS and S3 (encryption at rest).
- Sensitive authentication fields (e.g., TOTP secrets, backup codes) encrypted before database storage using application-level symmetric encryption with secrets managed in AWS Secrets Manager.
- TLS 1.2+ for all client-server and server-database connections (encryption in transit).
- Retention enforcement and legal hold tooling.
- CloudTrail API audit logging with CIS Benchmark alarms (root usage, IAM changes, security group changes).

**Finalization Scope:**

- None. Fully implemented.

**Approach:** Provide compliance artifacts as noted in Section 1.2 (Security Model Summary).

**Evidence:** Evidence is summarized in Section 1.2.

## **SEC-AGG-004: Audit Trail and Data Lineage**

**Requirement:**

The system shall maintain an immutable audit log of user actions, data changes, authentication events, and administrative configurations, supporting forensic review and regulatory reporting.

**Acceptance Criteria:**

Auditors can filter logs by user or record ID and export results; tamper-evident hashing verifies integrity of log entries.

**How We Meet It:**

- Audit log records user actions, auth events, and admin changes.
- Hash chain verification detects tampering: each log entry hashes the previous entry, creating a tamper-evident trail. Archived logs are stored with S3 Object Lock (immutable storage) for long-term integrity.
- Admins can filter and export logs.

**Evaluation Environment (Jan 2026):**

- Append-only audit log with hash chain verification.
- Export and filter UI for audit logs.
- Audit log archives stored in S3 Deep Archive.

**Finalization Scope:**

- None. Fully implemented.

**Approach:** Continue to validate audit integrity during UAT and provide evidence as noted in Section 1.2.

**Evidence:** Evidence is summarized in Section 1.2.

# **_System Requirements: Training and Onboarding (TO-AGG)_** {#system-requirements:-training-and-onboarding-(to-agg)}

## **Compliance Summary**

| Req ID     | Title                            | Status                                       | Evaluation Environment (Jan 2026\)    | Finalization Scope                                |
| :--------- | :------------------------------- | :------------------------------------------- | :------------------------------------ | :------------------------------------------------ |
| TO-AGG-001 | Template Support and Integration | Implemented; Requires viaSport Configuration | Template hub with preview, versioning | viaSport templates content                        |
| TO-AGG-002 | Guided Learning and Walkthroughs | Implemented; Requires viaSport Configuration | Auto-launch tours, progress tracking  | Final content review (confirmed during Discovery) |
| TO-AGG-003 | Reference Materials and Support  | Implemented; Requires viaSport Configuration | Role-scoped help, support with SLA    | Content refinement with viaSport                  |

## **TO-AGG-001: Template Support and Integration**

**Requirement:**

The system shall provide a centralized templates tab and offer contextual template access directly from each data entry item to guide users through required formats.

**Acceptance Criteria:**

Users can easily locate and access the correct template when needed.

**How We Meet It:**

- Templates hub centralizes all templates in one location.
- Contextual links surface templates from forms, imports, and reporting.
- Templates are tagged by context for search and filtering.

**Evaluation Environment (Jan 2026):**

- Templates hub UI with inline preview URLs and version grouping.
- Admin panel to manage global and organization templates.
- Contextual links on form detail pages with preview/download actions.
- Template shortcuts surfaced on form, reporting, and import screens.

**Finalization Scope:**

- viaSport specific templates and sample data (confirmed during Discovery).

**viaSport Dependencies:**

- Template content and formatting requirements.

**Approach:** Collect templates during Discovery and load into the hub prior to UAT.

**Evidence:** Evidence is summarized in Section 1.3.

## **TO-AGG-002: Guided Learning and Walkthroughs**

**Requirement:**

The system shall offer onboarding and data upload tutorials to help users navigate key processes, especially during their first-time use.

**Acceptance Criteria:**

Users can complete tasks independently with support from walkthroughs.

**How We Meet It:**

- Guided walkthroughs highlight key UI elements.
- Tutorials cover onboarding and data upload workflows.
- Progress tracking allows users to resume or restart.

**Evaluation Environment (Jan 2026):**

- Onboarding tour auto-launches after first organization selection when no prior progress exists.
- Guided tours for onboarding and data upload with restart controls.
- Tutorial panel with progress tracking and dismissal.
- Contextual launch points on portal pages.

**Finalization Scope:**

- Final content review with viaSport stakeholders (confirmed during Discovery).

**Approach:** Refine tutorial copy and steps during Discovery and UAT.

**Evidence:** Evidence is summarized in Section 1.3.

## **TO-AGG-003: Reference Materials and Support**

**Requirement:**

The system shall provide categorized guides and a frequently asked questions (FAQ) section to help users resolve issues and understand system functionality.

**Acceptance Criteria:**

Users can find accurate answers and instructional material without needing direct support.

**How We Meet It:**

- Help center organizes guides by role and category.
- FAQ entries surface common questions.
- Search filters content by keyword.

**Evaluation Environment (Jan 2026):**

- Help center with searchable guides and FAQ.
- Role-scoped content with audience badges visible to users.
- In-app support requests with priority selection, SLA targets, and response notifications.

**Finalization Scope:**

- Content refinement based on viaSport terminology (confirmed during Discovery).

**Approach:** Review help content during Discovery and incorporate viaSport feedback.

**Evidence:** Evidence is summarized in Section 1.3.

# **_System Requirements: User Interface (UI-AGG)_** {#system-requirements:-user-interface-(ui-agg)}

## **Compliance Summary**

| Req ID     | Title                                   | Status                                       | Evaluation Environment (Jan 2026\)        | Finalization Scope              |
| :--------- | :-------------------------------------- | :------------------------------------------- | :---------------------------------------- | :------------------------------ |
| UI-AGG-001 | User Access and Account Control         | Implemented (Demoable Now)                   | Login, MFA, recovery, RBAC                | None                            |
| UI-AGG-002 | Personalized Dashboard                  | Implemented (Demoable Now)                   | Role-aware dashboards                     | None                            |
| UI-AGG-003 | Responsive and Inclusive Design         | Implemented (Demoable Now)                   | Responsive UI and accessibility           | None                            |
| UI-AGG-004 | Task and Notification Management        | Implemented (Demoable Now)                   | Automated reminders and notifications     | None                            |
| UI-AGG-005 | Content Navigation and Interaction      | Implemented (Demoable Now)                   | Search, filtering, command palette        | None                            |
| UI-AGG-006 | User Support and Feedback Mechanism     | Implemented (Demoable Now)                   | Support with priority, SLA, notifications | None                            |
| UI-AGG-007 | Consistent Visual Language and Branding | Implemented; Requires viaSport Configuration | Design system and tenant branding         | viaSport branding configuration |

## **UI-AGG-001: User Access and Account Control**

**Requirement:**

The system shall support secure login/logout (MFA), individual and organizational account registration, account recovery, and system administrator account management with role-based access.

**Acceptance Criteria:**

Users and system admin can perform account-related tasks securely.

**How We Meet It:**

- Secure login with MFA and session management.
- Password recovery via time-limited tokens.
- Admin tools for user management and role assignment.

**Evaluation Environment (Jan 2026):**

- MFA enrollment and recovery flows.
- Organization invite and join request workflows.
- Admin settings panel for user access management.

**Finalization Scope:**

- None. Fully implemented.

**Approach:** Validate account flows during UAT and incorporate viaSport policy guidance.

**Evidence:** Evidence is summarized in Section 1.3.

## **UI-AGG-002: Personalized Dashboard**

**Requirement:**

The system shall provide the capability to create personalized dashboard for each user role, summarizing relevant data, actions, and reporting progress.

**Acceptance Criteria:**

Users can view personalized dashboards based on their roles.

**How We Meet It:**

- Dashboards show different cards and metrics by role.
- Reporting status and tasks surface at the top of the portal.
- Admin dashboards include cross-org visibility.

**Evaluation Environment (Jan 2026):**

- Role-aware portal dashboard.
- Reporting status and overdue indicators.
- Quick actions for forms, analytics, and imports.

**Finalization Scope:**

- None. Fully implemented.

**Approach:** Refine dashboard widgets based on viaSport priorities.

**Evidence:** Evidence is summarized in Section 1.3.

## **UI-AGG-003: Responsive and Inclusive Design**

**Requirement:**

The system shall provide a responsive interface across devices and include accessibility features such as screen reader compatibility, color contrast tools, and etc.

**Acceptance Criteria:**

System is functional on all devices and meets accessibility compliance.

**How We Meet It:**

- **Mobile-first layout** with responsive breakpoints for desktop, tablet, and mobile.
- **WCAG 2.1 Level AA compliance** validated through automated Axe-core testing in CI.
- **Keyboard accessibility throughout:**
  - Skip navigation links ("Skip to main content", "Skip to navigation")
  - Focus management on route changes (focus moves to main content for screen reader users)
  - All interactive elements reachable via Tab navigation
  - Drag-and-drop alternatives: Pivot builder and dashboard widgets offer button-based manipulation mode for keyboard users
- **Screen reader support:**
  - Live region announcements for toasts, form errors, and step changes
  - Form error summary component auto-focuses and provides clickable links to error fields
  - "View data table" toggle provides accessible alternative to charts
  - Semantic HTML with proper heading hierarchy and ARIA landmarks
- **Visual accessibility:**
  - High Contrast (WCAG) color scheme option for charts (3:1+ minimum contrast)
  - Visible focus indicators (ring-3 pattern) on all interactive elements
  - Reduced motion support via prefers-reduced-motion media query

**Evaluation Environment (Jan 2026):**

- Responsive portal and admin screens.
- A11y scan completed and recorded.
- Keyboard navigation and accessible components across workflows.

**Finalization Scope:**

- None. Fully implemented.

**Approach:** Continue to validate accessibility during UAT.

**Evidence:** Evidence is summarized in Section 1.3.

## **UI-AGG-004: Task and Notification Management**

**Requirement:**

The system shall enable automated and customizable notification messages and task reminders that alert users of pending actions and updates, both on the platform and via email.

**Acceptance Criteria:**

Users receive timely and relevant notifications and reminders.

**How We Meet It:**

- Scheduled reminders are generated from reporting tasks.
- In-app notifications surface updates and status changes.
- Email delivery uses AWS SES with delivery logging.

**Evaluation Environment (Jan 2026):**

- Notification scheduler and in-app notification feed.
- Email delivery with SES logging.
- Reminder cadence configurable per task.

**Finalization Scope:**

- None. Fully implemented.

**Approach:** Tune reminder cadence with viaSport during Discovery.

**Evidence:** Evidence is summarized in Section 1.3.

## **UI-AGG-005: Content Navigation and Interaction**

**Requirement:**

The system shall allow users to efficiently locate and interact with information using validated categorization, search and filtering capabilities.

**Acceptance Criteria:**

Users can retrieve accurate results through search and filter functions.

**How We Meet It:**

- Global search and command palette support quick navigation.
- List views include filtering, sorting, and pagination.
- Data catalog and template hubs provide structured categorization.

**Evaluation Environment (Jan 2026):**

- Command palette with actions and global search results.
- List filtering and sorting across forms, templates, and reporting.
- Data catalog and templates hub.

**Finalization Scope:**

- None. Fully implemented.

**Approach:** Expand search datasets as viaSport priorities are defined.

**Evidence:** Evidence is summarized in Section 1.3.

## **UI-AGG-006: User Support and Feedback Mechanism**

**Requirement:**

The system shall enable users to submit support inquiries and feedback and allow administrators to respond through a managed interface.

**Acceptance Criteria:**

Users can submit and receive responses to inquiries within the system.

**How We Meet It:**

- Support requests are submitted in-app with category and priority.
- Admin panel manages responses and status updates.
- Users receive email and in-app updates on responses.

**Evaluation Environment (Jan 2026):**

- Support request form with attachments, priority selection (Low/Normal/High/Urgent), and SLA targets.
- Admin support queue with status tracking and response form.
- Response and status changes dispatch in-app and email notifications.
- Audit logging for support actions.

**Finalization Scope:**

- None. Fully implemented.

**Approach:** Confirm SLA targets and escalation rules with viaSport.

**Evidence:** Evidence is summarized in Section 1.3.

## **UI-AGG-007: Consistent Visual Language and Branding**

**Requirement:**

The system shall maintain a consistent design style, color scheme, and branding across all modules.

**Acceptance Criteria:**

All UI components follow a standardized visual style.

**How We Meet It:**

- Design system components are shared across all screens.
- Tenant branding supports logo and color configuration.
- Typography, spacing, and iconography are standardized.

**Evaluation Environment (Jan 2026):**

- shadcn/ui component system applied across the portal.
- Tenant branding configuration available in admin settings.
- Consistent navigation and layout patterns.

**Finalization Scope:**

- viaSport branding assets and theme configuration (confirmed during Discovery).

**viaSport Dependencies:**

- Logo, color palette, and typography guidance.

**Approach:** Apply viaSport branding during Discovery and validate in UAT.

**Evidence:** Evidence is summarized in Section 1.3.

# **_Capabilities and Experience_** {#capabilities-and-experience}

## **Demonstrated Success Delivering Similar Systems**

Austin Wallace Tech brings experience delivering information systems in sports and data-intensive environments. For project-based delivery examples, see [Relevant Delivery Portfolio](#relevant-delivery-portfolio) in Vendor Fit to viaSport's Needs.

### _The Solstice Prototype as Proof_

The most relevant evidence is the Solstice prototype itself, built for viaSport requirements.

| Metric                | Value                                                                                                   |
| :-------------------- | :------------------------------------------------------------------------------------------------------ |
| Requirements coverage | 25 of 25 (100%) System Requirements Addendum items implemented                                          |
| Load testing          | 20M rows, p95 162ms, 25 concurrent users, 0 server errors                                               |
| Server errors         | Zero under concurrent load                                                                              |
| Test coverage         | Automated test suite covering core workflows (login, submission, import, export, RBAC, audit integrity) |
| Accessibility         | WCAG 2.1 Level AA compliance, Axe-core automated testing in CI, Lighthouse Accessibility 100/100        |

## **Delivery and Advisory Team**

### _Delivery Lead_

| Role                      | Name           | Responsibilities                                                 | Status    |
| :------------------------ | :------------- | :--------------------------------------------------------------- | :-------- |
| Principal Engineer, Owner | Austin Wallace | Architecture, data engineering, development, delivery governance | Committed |

### _Advisory Partners_

| Focus Area                  | Name            | Contribution                                  | Status    |
| :-------------------------- | :-------------- | :-------------------------------------------- | :-------- |
| UX and Accessibility        | Ruslan Hétu     | UX research lead, design, accessibility       | Committed |
| Sport Sector / Navigator    | Soleil Heaney   | System navigator connecting team to PSO needs | Committed |
| Technical Architecture      | Will Siddall    | Architecture review and development support   | Committed |
| Security and Risk           | Parul Kharub    | Security strategy and risk advisory           | Committed |
| Security and Infrastructure | Michael Casinha | Infrastructure security review                | Committed |
| Security and Compliance     | Tyler Piller    | Security operations and compliance validation | Committed |

### _Oversight Mechanisms_

- Daily coordination on implementation priorities
- Weekly deliverable reviews
- Code review required for all changes
- Security sign-off for auth and access control changes
- Direct accountability to viaSport with no organizational layers

### _Accessibility Expertise_

Ruslan Hétu leads UX research and accessibility validation with 6 years of experience in inclusive design. The team's accessibility approach includes:

- **Automated validation:** Axe-core accessibility tests run on every commit in CI
- **Manual verification:** Keyboard navigation, screen reader compatibility, and focus management testing
- **Inclusive design patterns:** Alternative interaction modes (button vs drag), data table alternatives for charts, form error summaries with field links

### _Continuity of Services_

Continuity is supported by:

- Infrastructure as code (SST)
- Automated testing and CI
- Operational runbooks and documentation
- Principal-led delivery continuity

## **Relevant Non-Profit, Public Sector, and Sport Clients**

### _Sport Sector Experience_

| Team Member    | Organization                                | Relationship              | Scope                                                                           |
| :------------- | :------------------------------------------ | :------------------------ | :------------------------------------------------------------------------------ |
| Austin Wallace | International Quidditch Association         | Chair, Board of Directors | Led governance, data, and technology strategy for 30+ national governing bodies |
| Austin Wallace | Media Organization                          | CEO                       | Managed operations for a 70-person volunteer organization                       |
| Soleil Heaney  | Quadball Canada                             | Executive Director        | Leading governance and operations for a National Governing Body                 |
| Soleil Heaney  | Senior Coordinator of Membership Engagement | BC Soccer                 | Policies, governance and membership for a BC PSO                                |

### _Public and Enterprise Experience_

| Team Member    | Organization                           | Sector                                    |
| :------------- | :------------------------------------- | :---------------------------------------- |
| Austin Wallace | Teck Resources                         | Publicly traded resource sector           |
| Austin Wallace | Clio                                   | Legal technology, public interest clients |
| Parul Kharub   | Canadian Border Services Agency (CBSA) | Federal Law Enforcement Agency            |
| Will Siddall   | Teck Resources                         | Publicly traded resource sector           |

## **Case Studies**

### _Primary Case Study: Solstice Platform (viaSport)_

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

### _Supporting Case Study: Qdrill_

A production training application used by competitive athletes, including Team Canada. Demonstrates ability to ship and operate a real user-facing sports application.

### _Supporting Case Study: New Jersey Devils Data Platform_

Processed 10 million rows per game for NHL tracking data and supported multi-million dollar decision making.

## **Automation and AI**

The cloud-native architecture and AI integration will vastly improve the administrative process for data collection and reporting. Solstice includes a production-ready AI foundation built on AWS Bedrock, hosted exclusively in AWS Canada (Central) for data residency compliance. The platform already supports natural language analytics queries—users can ask questions like "How many athletes registered in 2023 by sport?" and receive structured results without navigating complex filters. Additional AI capabilities (report narratives, semantic document search, data quality assistance) are available as governed, optional modules enabled only with viaSport's explicit approval.

### _Automation (Production-Ready)_

| Feature                 | Schedule        | Purpose                                     |
| :---------------------- | :-------------- | :------------------------------------------ |
| Scheduled notifications | Every 5 minutes | Process reminder and alert queue            |
| Retention enforcement   | Daily           | Archive and purge data per policy           |
| Data quality monitoring | Daily           | Detect missing fields and validation errors |
| Batch import worker     | On demand       | Process large imports with checkpointing    |
| Health monitoring       | On demand       | Service health checks with alerts           |

### _AI Enablement Foundation (Built)_

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

### _AI Feature Candidates_

The following AI feature candidates are available for prioritization with viaSport. AI features are optional modules enabled only with explicit governance decisions. During Discovery, we will conduct UX research with viaSport staff and PSO representatives to determine which features deliver the highest value.

| Feature                  | Description                                                                                   | Target Users         | Value                                   |
| :----------------------- | :-------------------------------------------------------------------------------------------- | :------------------- | :-------------------------------------- |
| AI report narratives     | Generate natural language summaries from analytics dashboards for board reports and briefings | viaSport admins      | Reduce manual report writing by 60-80%  |
| Natural language query   | Ask questions in plain English and receive structured answers from the data warehouse         | viaSport admins, PSO | Self-service analytics without SQL      |
| AI dashboard builder     | Describe a visualization in words and generate chart configurations automatically             | viaSport admins      | Faster dashboard creation               |
| Semantic document search | Search submissions and documents by meaning rather than exact keywords                        | All users            | Find relevant records faster            |
| Data quality AI          | Detect anomalies and outliers in submissions with plain-language explanations                 | viaSport admins      | Catch errors before they affect reports |
| Submission assistant     | Contextual guidance and suggestions while completing forms based on historical patterns       | PSO staff            | Reduce submission errors and rework     |

### _Prioritization Approach_

AI features will not be enabled without user research. Our approach:

1. **Discovery interviews** with viaSport staff and PSO representatives to understand pain points
2. **Value mapping** to identify which features address the highest-impact workflows
3. **Prototype testing** of prioritized features with real users before production release
4. **Iterative rollout** starting with the highest-value feature, gathering feedback before expanding

The foundation work is complete. We will implement the AI features that drive real value for viaSport and PSOs based on what we learn during research.

## **Responsible AI Governance**

| Principle                | Implementation                                                                                       |
| :----------------------- | :--------------------------------------------------------------------------------------------------- |
| Transparency             | All AI-generated content is clearly labeled; users see when AI assisted                              |
| Human-in-the-loop        | AI outputs require human review before publishing or external sharing                                |
| Privacy by design        | No PII in prompts; data aggregated or anonymized before AI processing                                |
| No unauthorized training | viaSport data is never used for model training without explicit consent                              |
| Bias mitigation          | Regular review of AI outputs for demographic or organizational bias                                  |
| Audit trail              | All AI requests logged with prompt version, user, timestamp, and response characteristics            |
| Data residency           | AWS Bedrock in ca-central-1 only; no non-Canadian AI providers without written consent from viaSport |

## **Open Standards, APIs, and Open Source**

### _Open Standards_

- TOTP (RFC 6238\) for MFA
- CSV and Excel for import and export
- JSON for data interchange
- TLS 1.2+ for transport security
- AES-256 for encryption at rest

### _APIs_

Internal APIs are structured for extension. External integrations will be scoped with viaSport during Discovery.

### _Open Source Foundations_

| Layer          | Technologies                                                 |
| :------------- | :----------------------------------------------------------- |
| Frontend       | React 19, TanStack Start, TypeScript, Radix UI, Tailwind CSS |
| Backend        | TanStack Start, Node.js, Drizzle ORM                         |
| Database       | PostgreSQL                                                   |
| Infrastructure | SST                                                          |
| Testing        | Vitest, Playwright, Testing Library                          |
| Validation     | Zod                                                          |

The application code is proprietary to Austin Wallace Tech, with source access available under mutually agreed terms.

# **_Commercial Model and Pricing_** {#commercial-model-and-pricing}

## **Procurement Structure**

Austin Wallace Tech proposes Solstice as a **3-year base term subscription** with two optional 1-year extensions at viaSport's discretion (3+1+1). This structure avoids a separate annual RFP for operations and provides predictable multi-year budgeting.

## **Pricing Summary**

| Component                                         | Price           | Additional Details                                                                                     |
| :------------------------------------------------ | :-------------- | :----------------------------------------------------------------------------------------------------- |
| Implementation Cost                               | $600,000        | Discovery, configuration, migration, UAT support, training, rollout, go-live/hypercare                 |
| Platform Subscription \+ Managed Service (annual) | $200,000 / year | Hosting, monitoring, patching, support, reliability management, product updates, 200 enhancement hours |

## **Total Cost View**

| Term                                   | Total      |
| :------------------------------------- | :--------- |
| 3-year base term                       | $1,200,000 |
| 5-year total (if extensions exercised) | $1,600,000 |

## **What is Included**

### _Cost Element Breakdown_

| Cost Element                               | Included In    | Notes                                         |
| :----------------------------------------- | :------------- | :-------------------------------------------- |
| Discovery \+ UX research                   | Implementation | Interviews, IA testing, prototypes            |
| Configuration (forms, templates, metadata) | Implementation | viaSport-specific setup                       |
| Migration implementation                   | Implementation | Mapping templates, pilot \+ phased waves      |
| Training materials \+ sessions             | Implementation | Cohorts finalized with viaSport               |
| UAT support \+ hypercare                   | Implementation | Defect remediation, go-live support           |
| Hosting \+ monitoring                      | Subscription   | AWS infrastructure, logging, on-call response |
| Security patching \+ dependency updates    | Subscription   | Monthly \+ expedited for critical vulns       |
| Support channels                           | Subscription   | In-app \+ email with SLA-based response       |
| DR exercises \+ backups                    | Subscription   | Quarterly validation, 35-day retention        |
| Enhancement hours (200/year)               | Subscription   | Feature requests, configuration changes       |

### _Implementation Cost_

- Discovery and requirements confirmation against the prototype
- viaSport-specific configuration (forms, templates, metadata, branding)
- Legacy data extraction approach, pilot migration, full migration, and reconciliation
- UAT support and defect remediation
- Training delivery (viaSport admin, train-the-trainer, PSO rollout enablement)
- Go-live support and defined hypercare period

### _Platform Subscription \+ Managed Service_

- Canadian-hosted production infrastructure and routine operations
- Monitoring, alerting, and incident response coordination
- Security patching and dependency updates
- Routine backups and quarterly DR exercises (results reported to viaSport)
- Support channels (in-app and email) with severity-based response targets
- Ongoing product updates and non-custom feature improvements
- **200 hours per year** for enhancements, minor feature requests, and configuration changes

## **Enhancements and Change Requests**

viaSport will have evolving needs. The subscription includes **200 hours per year** for enhancements, minor feature requests, and configuration changes beyond routine operations.

Additional work beyond the included hours is available at **$175/hour** with prior approval. A change control process ensures transparency:

1. Change request submitted
2. Impact assessment (scope, timeline, hours)
3. Proposal with options
4. Mutual agreement documented
5. Work proceeds after sign-off

## **Payment Schedule**

| Milestone        | Amount   | Percentage | Due Upon                           |
| :--------------- | :------- | :--------- | :--------------------------------- |
| Contract Signing | $150,000 | 25%        | Signed agreement                   |
| UAT Sign-Off     | $150,000 | 25%        | User acceptance testing completion |
| Go-Live          | $300,000 | 50%        | Production deployment              |

Annual subscriptions are billed quarterly in advance ($50,000 per quarter).

## **Factors That Do Not Trigger Price Adjustments**

- Normal data volume growth within PostgreSQL capacity
- Standard security updates and patches
- Configuration changes within existing features
- Work within the included 200 enhancement hours

## **Factors That May Trigger Cost Adjustments**

The following scope changes may require adjustment to pricing or timeline:

- Net-new integrations or real-time API requirements beyond agreed scope
- Mandatory SSO integration at launch (depends on IdP and coordination effort)
- Material increase in migration scope (attachment volume, additional legacy systems)
- 24/7 response coverage (optional add-on, already priced below)
- Third-party penetration testing (optional add-on, already priced below)

Any scope changes will be handled through the change control process described above, with transparent impact assessment before proceeding.

## **Renewal and Price Protection**

Renewal years can be priced:

- At the same annual rate ($200,000), or
- With a mutually agreed inflation cap (e.g., CPI-capped adjustments)

Renewal terms will be discussed no later than 90 days before the end of each contract year.

## **Optional Risk Reduction: Exit and Continuity** {#optional-risk-reduction:-exit-and-continuity}

To reduce vendor risk, viaSport may select from the following continuity options:

| Option                              | Description                                                                                                              | Included                    |
| :---------------------------------- | :----------------------------------------------------------------------------------------------------------------------- | :-------------------------- |
| Data portability \+ runbooks        | Full data export (CSV, JSON, database dump) plus operational runbooks                                                    | Baseline (included)         |
| Source code escrow                  | Source code deposited with escrow agent, released upon defined trigger conditions (insolvency, failure to support, etc.) | Optional                    |
| Perpetual license to customizations | At end of contract, viaSport receives perpetual license to viaSport-specific configuration and customizations            | Optional                    |
| Transition support                  | Support for transition to a replacement system if viaSport chooses not to renew                                          | Available at standard rates |

Details on escrow and perpetual license options are provided in the Exit and Portability Appendix.

## **Optional Add-Ons**

### _Third-Party Penetration Testing_

**Estimated:** $10,000 to $20,000 per assessment

Independent penetration testing by a qualified third-party security firm. Can be scheduled pre-go-live or annually. Austin Wallace Tech coordinates with the testing firm and remediates findings.

### _Extended Support Coverage (24/7)_

**Estimated:** $30,000 to $50,000 per year additional

Adds after-hours monitoring and response outside business hours. After-hours Sev 1 response target: 2 hours (with 24/7 add-on).

### _Operations Portal (Events and Team Management)_

**Estimated:** $50,000 to $100,000 implementation, plus ongoing support

The Solstice platform includes an operations portal used by Quadball Canada. This could be extended to viaSport and PSOs to unify reporting and operations.

## **Pricing Philosophy**

Pricing is based on the 30-week delivery plan described in **Project Plan, Timeline, and Delivery Schedule**.

- The **one-time implementation** covers discovery, viaSport configuration, migration execution and reconciliation, UAT support, training, rollout, and go-live/hypercare to operationalize the existing baseline.
- The **annual subscription \+ managed service** covers hosting, monitoring, support, security patching, backups/DR validation, ongoing product updates, and 200 hours/year of enhancement capacity.

# **_Project Plan, Timeline, and Delivery Schedule_** {#project-plan,-timeline,-and-delivery-schedule}

## **Timeline and Milestones**

Austin Wallace Tech proposes a 30-week implementation timeline targeting Fall 2026 launch. While the Solstice core platform is functional today, this timeline ensures the transition from legacy systems (BCAR/BCSI) to the new environment is smooth, compliant, and widely adopted by the PSO community.

| Phase                         | Duration | Key Activities                                                                      | Milestone           |
| :---------------------------- | :------- | :---------------------------------------------------------------------------------- | :------------------ |
| Discovery and Research        | 6 weeks  | User research, user observation sessions, legacy system analysis                    | Research Synthesis  |
| Information Architecture (IA) | 4 weeks  | User-driven categorization exercises, navigation validation testing                 | IA Approval         |
| Design and Prototyping        | 8 weeks  | Wireframes, high-fidelity design, interactive prototyping                           | Design Finalization |
| User Acceptance Testing       | 4 weeks  | Usability testing, accessibility validation, Assistive Technology (AT) user testing | UAT Sign-Off        |
| Remediation and Refinement    | 4 weeks  | Address UAT findings, design QA, launch preparation                                 | Launch Approval     |
| Training and Launch           | 4 weeks  | Training materials, soft launch, phased rollout                                     | Full Rollout        |

**Total Duration:** 30 weeks

**Target Dates:**

- Project Start: Upon contract award (estimated Q1 2026\)
- Soft Launch: Week 29 (pilot cohort)
- Full Rollout: Week 30 (Fall 2026\)

### _Why This Timeline_

- **Privacy and Legislative Alignment:** Early weeks support viaSport's Privacy Impact Assessment (PIA) and security review processes, ensuring system configuration meets FOIPPA requirements
- **Legacy Data Integrity:** Migrating \~20M rows requires rigorous mapping and validation to prevent data loss or corruption during the transition from BCAR/BCSI
- **Community-Wide Adoption:** UX research and community liaison (led by our System Navigator) ensures the interface reflects actual PSO workflows, reducing post-launch support volume

The timeline reflects our commitment to getting the user experience right. The baseline system already implements the requirement set, so project time focuses on:

- **Proper user research** with viaSport staff and PSO representatives across British Columbia
- **Community-informed design** with Soleil Heaney as system navigator connecting the team to sport sector needs
- **Accessibility validation** including assistive technology user testing
- **Phased rollout** with pilot cohorts before full deployment

| Phase                       | Status           | Remaining Work                        |
| :-------------------------- | :--------------- | :------------------------------------ |
| Architecture                | Complete         | None                                  |
| Authentication and Security | Complete         | Production hardening                  |
| Core Features               | Largely complete | UX refinements per community research |
| Analytics Platform          | Complete         | Dataset tuning with viaSport          |
| Migration Tooling           | Complete         | Extraction from BCAR and BCSI         |

## **Phase Details**

**Phase 1: Discovery and Research (Weeks 1-6)**

- Finalize UX team engagement and research protocols
- Stakeholder alignment workshop with viaSport
- User observation sessions in work environment (12-15 participants)
- User research interviews (15-20 participants)
- Diary studies during actual reporting periods (6-8 participants)
- Legacy system analytics audit (support tickets, usage patterns)
- Migration discovery (legacy access, schema documentation)
- Brand asset collection

**Deliverables:** User personas, current-state journey maps, research synthesis report, design principles

**Milestone:** Week 6 \- Research Findings Presentation

**Phase 2: Information Architecture (Weeks 7-10)**

- User-driven categorization exercises to inform navigation (25-30 participants)
- Analysis and navigation structure options
- Navigation validation testing with 2-3 navigation variants (25-30 participants)
- Findability measurement and label refinement
- Information Architecture (IA) documentation and stakeholder review
- Migration mapping and transformation begins

**Deliverables:** Validated navigation taxonomy, site map with role-based views, findability report

**Milestone:** Week 10 \- Information Architecture (IA) Approval Gate

**Phase 3: Design and Prototyping (Weeks 11-18)**

- Low-fidelity wireframes for priority screens (\~25-30 screens)
- Core workflow mapping
- viaSport branding application
- Design system expansion (components, patterns, tokens)
- High-fidelity mockups for core modules
- Interactive design prototyping with working interactions
- Edge cases, error states, empty states
- Data migration execution with validation
- Production environment preparation

**Deliverables:** High-fidelity designs, interactive prototype, design system documentation, development handoff specifications

**Milestone:** Week 18 \- Design Finalization and UAT Ready

**Phase 4: User Acceptance Testing (Weeks 19-22)**

- UAT preparation and test scenario finalization
- Participant recruitment (10-12 users across roles)
- Moderated usability testing sessions (60 min each)
- System Usability Scale (SUS) measurement
- Accessibility validation:
  - Axe-core automated scans for WCAG 2.1 Level AA compliance
  - Keyboard navigation testing (skip links, focus management, tab order)
  - Assistive Technology (AT) testing with 3-5 users:
    - Screen reader users (NVDA, VoiceOver)
    - Keyboard-only users
  - Alternative interaction mode validation (button vs drag in pivot builder)
- Quantitative and qualitative analysis
- Prioritized recommendations

**Deliverables:** UAT Report, prioritized remediation backlog, success metrics baseline, accessibility validation

**Milestone:** Week 22 \- Remediation Planning Workshop

**Phase 5: Remediation and Refinement (Weeks 23-26)**

- Fix critical and high-severity issues
- Design refinements based on feedback
- Accessibility remediations
- Development QA and regression testing
- Final validation and launch readiness assessment

**Deliverables:** Remediated design and implementation, regression test results, launch readiness recommendation

**Milestone:** Week 26 \- Launch Approval Gate

**Phase 6: Training and Launch (Weeks 27-30)**

- Training material finalization
- Video tutorial production
- Help center content review
- Train-the-trainer preparation
- Soft launch with pilot cohort (10-15 PSOs)
- Intensive monitoring and rapid response
- Full rollout with phased PSO onboarding
- Legacy systems archived

**Deliverables:** Training materials package, launch monitoring plan, post-launch UX roadmap

See [Service Approach: Data Migration](#service-approach:-data-migration) for the detailed cutover plan, including data freeze window, hypercare period, and rollback criteria.

## **Governance and Communications**

### _Communication Cadence_

| Frequency | Participants                                | Purpose                           |
| :-------- | :------------------------------------------ | :-------------------------------- |
| Weekly    | Austin Wallace and viaSport Project Manager | Status updates and blockers       |
| Bi-weekly | Steering committee                          | Milestone review and escalations  |
| As needed | Technical stakeholders                      | UX reviews and migration planning |
| Monthly   | Research readouts                           | Share findings with broader team  |

### _Reporting_

viaSport will receive:

- Weekly status reports
- Research synthesis reports at phase gates
- Milestone completion reports with sign-off
- Defect status reports during UAT
- Post-go-live support reports (monthly)

### _Decision-Making_

| Decision Type              | Directly Responsible Individual   |
| :------------------------- | :-------------------------------- |
| Day-to-day implementation  | Austin Wallace                    |
| Requirements clarification | viaSport Project Manager          |
| UX research direction      | Ruslan Hétu with viaSport input   |
| Scope changes              | Mutual agreement via change order |
| Go-live readiness          | viaSport Project Sponsor          |

## **Risks, Assumptions, and Dependencies**

### _Dependencies on viaSport_

| Dependency                               | Timing      | Impact if Delayed           |
| :--------------------------------------- | :---------- | :-------------------------- |
| Legacy data access                       | Week 1      | Migration timeline at risk  |
| Brand assets                             | Week 11     | Branding work delayed       |
| Subject Matter Expert (SME) availability | Weeks 1-6   | Research quality reduced    |
| Research participants                    | Weeks 1-10  | User research scope limited |
| UAT testers                              | Weeks 19-22 | UAT duration extended       |
| PSO coordination                         | Weeks 27-30 | Rollout schedule impacted   |

### _Assumptions_

- viaSport can provide export capability or schema documentation for BCAR and BCSI
- viaSport staff and PSO representatives are available for research and reviews
- Participants can be recruited for user research sessions (we will work with Soleil as system navigator)
- No major scope changes after design finalization
- PSOs are responsive to onboarding communications

### _Risk Register_

| Risk                       | Likelihood | Impact | Mitigation                             |
| :------------------------- | :--------- | :----- | :------------------------------------- |
| Legacy data access delayed | Medium     | High   | Begin migration discovery in Week 1    |
| Data quality issues        | Medium     | Medium | Validation tooling and pilot migration |
| Research recruitment slow  | Medium     | Medium | Leverage Soleil's sector relationships |
| viaSport SME availability  | Low        | Medium | Schedule interviews early              |
| Scope creep                | Low        | High   | Weekly check-ins and change control    |
| PSO adoption resistance    | Low        | Medium | Train-the-trainer and PSO champions    |

## **Timeline Commitment**

The timeline is structured around quality gates (discovery sign-off, IA approval, UAT sign-off, launch readiness) rather than feature build completion. This reflects our assessment based on the existing baseline and the need for user research and collaboration with the sport sector community. We will identify blockers early and communicate any required adjustments.

# **_Appendices_** {#appendices}

## **Appendix A: Prototype Evaluation Access** {#appendix-a:-prototype-evaluation-access}

A working prototype is available for viaSport evaluation in a dedicated UAT environment using synthetic data only.

**Demo URL:** [https://sinuat.solsticeapp.ca](https://sinuat.solsticeapp.ca)

**Environment:** sin-uat (User Acceptance Testing environment with evaluator access and CloudTrail monitoring)

### _Environment Details_

- Synthetic test data only (no confidential viaSport data was used)
- Environment monitoring enabled (CloudTrail with CIS Benchmark alarms)
- Production-equivalent security controls active
- Performance testing is executed separately in sin-perf
- Rate limiting: Evaluator-friendly thresholds are configured (approximately 30 login attempts per 15 minutes per account). If you get locked out, email support@solsticeapp.ca for immediate unlock.

### _Demo Credentials_

Credentials are provided below for the evaluation period. **Credentials valid during evaluation period only** and will be rotated after review concludes.

| User                    | Password        | Platform Role  | Org Membership              | Access Scope                      |
| :---------------------- | :-------------- | :------------- | :-------------------------- | :-------------------------------- |
| viasport-staff@demo.com | testpassword123 | viaSport Admin | viaSport BC (owner)         | Full access including Analytics   |
| global-admin@demo.com   | demopassword123 | Solstice Admin | None                        | Platform admin pages only         |
| pso-admin@demo.com      | testpassword123 | None           | BC Hockey (admin)           | BC Hockey org features, Analytics |
| club-reporter@demo.com  | testpassword123 | None           | North Shore Club (reporter) | Club reporting, Analytics         |
| member@demo.com         | testpassword123 | None           | Vancouver Minor (viewer)    | View-only access (no Analytics)   |

**Recommended starting account:** viasport-staff@demo.com provides full access to all platform features.

**MFA:** Disabled on all demo accounts for convenience. To evaluate the MFA capability, navigate to **Settings \> Security** to enroll your own authenticator app.

**Rate limiting:** Evaluator-friendly thresholds are configured (approximately 30 login attempts per 15 minutes per account). If you get locked out, email support@solsticeapp.ca for immediate unlock.

### _Suggested Evaluation Walkthrough_

| Step | Action                                                         | Requirement |
| :--- | :------------------------------------------------------------- | :---------- |
| 1    | Login with viasport-staff@demo.com (password: testpassword123) | SEC-AGG-001 |
| 2    | View dashboard and role-based navigation                       | UI-AGG-002  |
| 3    | Admin → Forms → Open a form → Submit test data                 | DM-AGG-001  |
| 4    | Admin → Import → Upload CSV → Map fields → Complete import     | DM-AGG-006  |
| 5    | Admin → Reporting → Create cycle → Assign tasks                | RP-AGG-003  |
| 6    | Analytics → Explore → Build pivot table → Export to CSV        | RP-AGG-005  |
| 7    | Admin → Audit → Filter by date → Verify hash chain             | SEC-AGG-004 |
| 8    | Settings → Security → Enable MFA (optional)                    | SEC-AGG-001 |

For a complete requirement-by-requirement walkthrough, see the [Prototype Evaluation Guide](#solstice:-a-working-prototype).

### _Video Demonstrations_

| ID  | Title                      | Duration | File                                          |
| :-- | :------------------------- | :------- | :-------------------------------------------- |
| V1  | Authentication & MFA Login | 24s      | SEC-AGG-001-auth-mfa-login-flow-FINAL.mp4     |
| V2  | Form Submission Workflow   | 29s      | DM-AGG-001-form-submission-flow-FINAL.mp4     |
| V3  | Data Import Wizard         | 54s      | DM-AGG-006-import-wizard-flow-FINAL.mp4       |
| V4  | Reporting Workflow Cycle   | 10s      | RP-AGG-003-reporting-workflow-flow-FINAL.mp4  |
| V5  | Analytics & Export         | 26s      | RP-AGG-005-analytics-export-flow-FINAL.mp4    |
| V6  | Audit Trail Verification   | 25s      | SEC-AGG-004-audit-verification-flow-FINAL.mp4 |

**Primary access:** YouTube links (TBD \- to be provided before submission)

**Fallback:** If YouTube is blocked, see /videos/ folder in the submission ZIP.

### _Support During Evaluation_

**Email:** [support@solsticeapp.ca](mailto:support@solsticeapp.ca)

**Response time:** Within 4 business hours during evaluation period

**Available support:**

- Account unlock requests
- Technical questions about the platform
- Demo data reset (restores baseline if evaluators change settings)

##

## **Appendix B: System Architecture**

### _High-Level Architecture_

A formatted architecture diagram is provided in the Evidence Pack.

The platform runs entirely in AWS Canada (Central) (ca-central-1) using a serverless architecture: CloudFront CDN for edge delivery, Lambda for application compute, RDS PostgreSQL for the database, S3 for object storage, SQS for message queuing, ElastiCache Redis for caching, EventBridge for scheduling, CloudWatch for monitoring, and SES for email delivery.

### _Technology Stack_

| Layer          | Technologies                                                 |
| :------------- | :----------------------------------------------------------- |
| Frontend       | React 19, TanStack Start, TypeScript, Radix UI, Tailwind CSS |
| Backend        | TanStack Start, Node.js, Drizzle ORM                         |
| Database       | PostgreSQL on AWS RDS                                        |
| Caching        | Redis for rate limiting, BI caching, permissions             |
| Infrastructure | SST, AWS Lambda, CloudFront, ECS Fargate                     |
| Authentication | Better Auth with TOTP MFA                                    |
| Monitoring     | AWS CloudWatch, CloudTrail                                   |

##

## **Appendix C: Performance Evidence** {#appendix-c:-performance-evidence}

Load testing was conducted in the sin-perf environment on January 8, 2026\. Results: p95 latency of 162ms (target: \<500ms), 25 concurrent users, zero server errors.

### _Data Volume_

| Table            | Rows    |
| :--------------- | :------ |
| audit_logs       | 10.0M   |
| form_submissions | 8.0M    |
| notifications    | 2.0M    |
| **Total**        | **20M** |

### _Performance Results_

| Metric              | Value      | Target  | Status |
| :------------------ | :--------- | :------ | :----- |
| p95 latency         | 162ms      | \<500ms | Pass   |
| p50 latency         | 98ms       | N/A     | Pass   |
| Concurrent users    | 25         | N/A     | Pass   |
| Throughput          | 12.3 req/s | N/A     | Pass   |
| Server errors (5xx) | 0          | 0       | Pass   |

### _Lighthouse Scores_

| Metric                   | Value   | Target | Status |
| :----------------------- | :------ | :----- | :----- |
| Performance Score        | 90/100  | \>80   | Pass   |
| First Contentful Paint   | 1.0s    | \<1.8s | Pass   |
| Largest Contentful Paint | 1.0s    | \<2.5s | Pass   |
| Time to Interactive      | 1.1s    | \<3.8s | Pass   |
| Cumulative Layout Shift  | 0       | \<0.1  | Pass   |
| Accessibility Score      | 100/100 | \>90   | Pass   |

### _DR Exercise Results (2026-01-08)_

| Metric                         | Target   | Achieved | Status |
| :----------------------------- | :------- | :------- | :----- |
| Recovery Point Objective (RPO) | 1 hour   | 0 min    | Pass   |
| Recovery Time Objective (RTO)  | 4 hours  | 16 min   | Pass   |
| Records validated              | 20M rows | 20M rows | Pass   |

##

## **Appendix D: Security Architecture Summary** {#appendix-d:-security-architecture-summary}

### _Shared Responsibility Model_

The security model follows the AWS shared responsibility approach: AWS secures the underlying cloud infrastructure, and we implement and operate the application controls, configuration, and monitoring required for viaSport's use case. AWS compliance reports (SOC, ISO) are available via AWS Artifact upon request.

### _Data Residency_

Primary data stores (RDS PostgreSQL, S3 object storage, backups, and audit archives) are hosted in AWS Canada (Central) (ca-central-1). Authenticated content is configured to avoid edge caching. Email notifications are sent via AWS Simple Email Service (SES) in AWS Canada (Central) (ca-central-1). Once delivered to recipients, messages may transit or be stored by external email providers outside AWS.

### _Encryption_

| Scope              | Standard                                       |
| :----------------- | :--------------------------------------------- |
| In Transit         | TLS 1.2+                                       |
| At Rest (Database) | AES-256 via AWS KMS                            |
| At Rest (Storage)  | AES-256 via AWS KMS                            |
| Secrets            | AWS Secrets Manager (SST-managed, deploy-time) |

### _Authentication_

| Feature                     | Implementation                           |
| :-------------------------- | :--------------------------------------- |
| Multi-Factor Authentication | TOTP with backup codes                   |
| Password Requirements       | Configurable password policy             |
| Session Management          | Secure cookies, configurable expiry      |
| Account Lockout             | Automatic after failed attempt threshold |

### _Authorization_

| Feature                   | Implementation                            |
| :------------------------ | :---------------------------------------- |
| Role-Based Access Control | Owner, Admin, Reporter, Viewer roles      |
| Organization Scoping      | All queries scoped to user's organization |
| Field-Level Permissions   | Sensitive fields restricted by role       |
| Step-Up Authentication    | Required for admin actions and exports    |

### _Audit Trail_

| Feature      | Implementation                                                                                                   |
| :----------- | :--------------------------------------------------------------------------------------------------------------- |
| Scope        | All user actions, data changes, auth events                                                                      |
| Immutability | Append-only with hash chain verification; archived to S3 Object Lock (immutable storage) for long-term integrity |
| Retention    | Retention policies and legal holds (durations to be confirmed with viaSport during Discovery)                    |

### _Compliance_

- PIPEDA aligned data handling practices
- AWS Data Processing Addendum (DPA) in place
- CloudTrail API audit logging with CIS Benchmark alarms (root usage, IAM changes, security group changes)

##

## **Appendix E: User Personas**

| Persona        | Portal Access             | Key Capabilities                                    |
| :------------- | :------------------------ | :-------------------------------------------------- |
| viaSport Admin | Full platform             | Admin console, cross-org analytics, user management |
| PSO Admin      | Organization-scoped       | Reporting oversight, user invitations, analytics    |
| PSO Reporter   | Organization-scoped       | Form submission, file uploads, imports              |
| Viewer         | Read-only                 | Dashboard viewing, report access                    |
| Auditor        | Admin console (read-only) | Audit log access, compliance review                 |

##

## **Appendix F: Team Biographies**

### _Austin Wallace, Project Lead and Solution Architect_

Austin Wallace is the delivery lead and solution architect for Solstice. He leads platform architecture, data migration strategy, and delivery governance. He has 9+ years of enterprise data engineering experience and sport governance leadership.

### _Ruslan Hétu, UX and Accessibility Lead_

Ruslan Hétu is a design and research freelancer with a background in human-centered design and systems thinking. He earned a master's degree in design and has 6 years of experience applying mixed-methods research to public sector projects, healthcare, and startups.

### _Soleil Heaney, System Navigator_

Soleil Heaney has been involved in the sports industry for 10 years. Her work as the Executive Director with Quadball Canada, Manager of Member Services with BC Soccer, General Manager of Victoria Ultimate and President of several local sports club Boards gives her a practical end-user perspective of the needs of sports governing bodies.

### _Will Siddall, Technical Advisor_

With 15+ years of development and business consulting experience across many industries, Will is ensuring a stable product can be delivered to customers with a focus on customer collaboration and user experience (UX).

He's designed, delivered, and trained a variety of products for customers of all types and sizes, with most of his experience developing and delivering products to air-gapped environments. Industries he's supported in the past include mining, VFX, hydrography and ocean exploration, oil and gas, civil engineering and cadastral/bathymetric surveys.

### _Parul Kharub, Security and Risk Advisor_

Parul is the strategic cybersecurity and risk advisor with 16 years of practical experience in Fortune 100 companies across the globe. She also brings experience working with regulators and privacy officers to offer breadth of security, privacy and regulatory coverage.

### _Michael Casinha, Security and Infrastructure Advisor_

A 30+ year veteran of the dotcom internet era bringing generational lessons of best practices to an agile era of cloud development. Having worked with American Finance, Aviation and Canadian quantum computing startups. All relying on consistent, secure, repeatable development practices learned over years of successful achievements and hard lessons learned.

### _Tyler Piller, Security and Compliance Advisor_

Tyler Piller is a cybersecurity veteran with over 10 years of experience in operational defense and strategic risk management. He currently directs an Information Security Risk Management program, providing strategic advisory to align technical risk with enterprise business objectives.

##

## **Appendix G: Glossary**

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

##

## **Appendix H: Contact Information**

**Primary Contact:**

Austin Wallace Project Lead, Austin Wallace Tech Email: [austin@solsticeapp.ca](mailto:austin@solsticeapp.ca) Location: Victoria, British Columbia

Austin Wallace Tech welcomes the opportunity to present the prototype and discuss how Solstice can serve viaSport's Strength in Numbers initiative.

##

## **Appendix I: Evidence Pack**

The Evidence Pack provides supporting screenshots from the prototype.

| Evidence Item                   | Description                                  |
| :------------------------------ | :------------------------------------------- |
| 01-prototype-dashboard.png      | Role-based admin dashboard view              |
| 02-audit-log-integrity.png      | Audit log view with integrity verification   |
| 03-import-wizard-validation.png | Import wizard preview and validation results |

##

## **Appendix J: OWASP Top 10:2025 Mapping**

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

[^1]: Amazon Web Services, "Carbon Reduction with AWS," 2024\. https://sustainability.aboutamazon.com/carbon-reduction-aws.pdf
