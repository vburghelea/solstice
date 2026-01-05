# Executive Summary

Austin Wallace Tech responds to viaSport British Columbia's Request for Proposal for the Strength in Numbers Project. We built a working prototype that aligns to the System Requirements Addendum and demonstrates delivery feasibility before contract award.

**Data Provenance:** The prototype was built using synthetic test data designed to match viaSport's scale characteristics. No viaSport confidential data was accessed or used in development or testing.

## At a Glance

| Dimension    | Status                                                                    |
| ------------ | ------------------------------------------------------------------------- |
| Prototype    | Working system available for evaluation (see Section 01-B and Appendix A) |
| Requirements | 22 of 25 built today; 3 partial pending viaSport inputs (see Section 04)  |
| Data Used    | Synthetic only, no confidential viaSport data                             |
| Performance  | 20.1M rows, sub-250ms p95 latency, final validation run TBD               |
| Security     | MFA, RBAC, audit chain, S3 Object Lock, Canadian data residency           |
| Timeline     | 18 weeks from contract to full rollout (see Section 07)                   |
| Investment   | $600K implementation + $200K/year operations (see Section 06)             |

## Key Highlights

**De-risked Delivery**
A working prototype already exists and is available for evaluation. This reduces delivery risk and allows evaluators to validate requirements directly, not through a promise. Access details are in Appendix A. The Prototype Evaluation Guide in Section 01-B provides a 15-minute validation path tied to requirement IDs.

**Requirements Coverage**
The prototype covers the majority of the System Requirements Addendum today. Three requirements remain partial and are explicitly scoped with viaSport dependencies and delivery approach. The compliance crosswalk in Section 04 provides the requirement-by-requirement view.

**Security and Residency**
All data is hosted in AWS ca-central-1 (Canada). The platform implements MFA, role-based access control, organization scoping, encryption in transit and at rest, and an immutable audit log with tamper-evident hashing. Security evidence is summarized in Appendix D.

**Delivery Timeline**
The proposed 18-week timeline is achievable because the core platform is already built. Remaining work is discovery, migration execution, viaSport-specific configuration, and production hardening.

## Proposed Team

| Role                         | Team Member    |
| ---------------------------- | -------------- |
| Project Lead / Data Engineer | Austin Wallace |
| Senior Developer             | Will Siddal    |
| Security Expert              | TBD            |
| UX Designer                  | TBD            |

Austin Wallace, the architect and primary developer of the prototype, will lead delivery directly to maintain continuity and accountability.

## Evaluator Navigation Map

| RFP Evaluation Criterion            | Our Response Section                         | Notes                                 |
| ----------------------------------- | -------------------------------------------- | ------------------------------------- |
| Vendor Fit to viaSport's Needs      | 02-vendor-fit                                | Company profile, team, differentiator |
| Service Approach and Responsiveness | 03-service-approach (6 files)                | Methodology for each scope item       |
| System Requirements Addendum        | 04-system-requirements (5 files + crosswalk) | Per-requirement compliance            |
| Capabilities and Experience         | 05-capabilities-experience                   | Case studies, AI approach, team       |
| Cost and Value                      | 06-cost-value                                | Pricing, breakdown, change management |
| Timeline and Delivery Schedule      | 07-delivery-schedule                         | Milestones, risks, dependencies       |
| Prototype Validation                | 01-B-prototype-evaluation-guide + Appendices | Demo access, test results             |

Austin Wallace Tech welcomes the opportunity to present the prototype and review the approach with viaSport's evaluation team.

# Prototype Evaluation Guide

## Purpose

This prototype exists to reduce delivery risk and demonstrate requirement alignment before contract award. viaSport can evaluate a working system, not just a proposal.

## Data Provenance

**No viaSport confidential data was used.** Performance testing used synthetic data designed to match the scale characteristics described in the RFP:

| Table            | Rows      | Purpose                                |
| ---------------- | --------- | -------------------------------------- |
| form_submissions | 10.0M     | Simulates 10+ years of PSO submissions |
| audit_logs       | 7.0M      | Realistic audit trail volume           |
| notifications    | 2.0M      | Email and in-app notification history  |
| bi_query_log     | 1.0M      | Analytics query patterns               |
| **Total**        | **20.1M** | Matches RFP 20+ million rows context   |

## What Is Production-Ready Today

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

| Item                                                    | Timing                  | Dependency                 |
| ------------------------------------------------------- | ----------------------- | -------------------------- |
| BCAR and BCSI extraction method                         | Discovery (Weeks 1-2)   | Legacy system access       |
| Form templates and reporting metadata                   | Discovery (Weeks 1-2)   | viaSport data dictionary   |
| Branding (logo, colors)                                 | Development (Week 3)    | Brand assets from viaSport |
| Program-specific fields (NCCP, contribution agreements) | Development (Weeks 3-8) | viaSport SME input         |
| Independent penetration test                            | Pre-UAT (Week 8)        | Security specialist        |

## Demo Access

Demo credentials are listed in Appendix A to reduce reviewer friction.

**Contact:** TBD

**Environment:** sin-perf (performance testing environment with production-like data)

**MFA:** The viaSport Staff account has MFA enabled to demonstrate the full authentication flow. Other demo accounts have MFA disabled for faster evaluation.

**Data:** Synthetic only, with monitoring enabled.

## What to Ignore in the Prototype

Some elements are placeholders and will be replaced with viaSport-approved content during Discovery:

- Form labels and field names (will match viaSport terminology)
- Sample templates (will be replaced with viaSport reporting templates)
- Help center content (will be refined per UX interviews)
- Logo and color scheme (will apply viaSport branding assets)

## 15-Minute Demo Script

1. Login and MFA, authenticate with email/password and complete TOTP
2. Dashboard, observe role-based content (admin vs reporter)
3. Form Builder, create a test form with required fields and file upload
4. Submit Data, complete and submit the form, observe status tracking
5. Version History, edit submission and view change history with attribution
6. Analytics, build a pivot table and export to CSV
7. Audit Logs, review recent actions and verify hash chain integrity
8. Help Center, search for a topic and view contextual guidance
9. Import Wizard, upload CSV, map fields, preview validation results

## Requirement Validation Crosswalk

| To validate...             | Requirement | Demo path                                |
| -------------------------- | ----------- | ---------------------------------------- |
| Form building              | DM-AGG-001  | Dashboard -> Forms -> Create Form        |
| File uploads               | DM-AGG-001  | Form Builder -> Add File Field -> Submit |
| Import and rollback        | DM-AGG-006  | Dashboard -> Imports -> New Import       |
| Submission tracking        | RP-AGG-003  | Dashboard -> Reporting                   |
| Self-service analytics     | RP-AGG-005  | Analytics -> New Query -> Pivot          |
| Export with access control | RP-AGG-005  | Pivot -> Export -> Verify scoping        |
| MFA authentication         | SEC-AGG-001 | Login flow                               |
| Role-based access          | SEC-AGG-001 | Compare admin vs reporter dashboards     |
| Audit trail                | SEC-AGG-004 | Admin -> Audit Logs -> Filter            |
| Hash chain verification    | SEC-AGG-004 | Audit Logs -> Verify Integrity           |
| Guided walkthroughs        | TO-AGG-002  | Help -> Guided Walkthroughs              |
| Help center search         | TO-AGG-003  | Help -> Search                           |
| Support requests           | UI-AGG-006  | Help -> Support Request                  |

## Prototype Positioning

We built this prototype to prove feasibility and reduce delivery risk. Discovery remains mandatory to validate workflows, templates, and migration realities. The prototype is not a substitute for stakeholder alignment, it is an accelerator.

# Vendor Fit to viaSport's Needs

## Company Information

### Austin Wallace Tech

Austin Wallace Tech is a British Columbia based technology consulting firm incorporated in 2025 and headquartered in Victoria, BC. The company was founded to deliver information management solutions for the sport sector, with the Strength in Numbers platform as its primary engagement.

| Attribute     | Details                                     |
| ------------- | ------------------------------------------- |
| Incorporation | 2025                                        |
| Headquarters  | Victoria, British Columbia                  |
| Staff         | 1 principal plus contracted specialists     |
| Structure     | Incorporated company with contracted team   |
| Primary Focus | Sport sector information management systems |

Austin Wallace Tech operates as a principal-led consultancy. The person who architected and built the working prototype will lead delivery through production. There are no hand-offs between sales, architecture, and delivery teams.

## Principal: Austin Wallace, Project Lead and Data Engineer

Austin Wallace brings 9+ years of enterprise data engineering experience with executive leadership in amateur sport governance.

**Professional Experience**

- **Clio (Aug 2024 to Present):** Data Engineer. Owns 10+ Databricks pipelines processing production workloads. Authored company-wide AI best practices guide.
- **New Jersey Devils, NHL (May 2022 to Aug 2024):** Sole Data Developer. Built an end-to-end data platform processing 10 million rows per game of NHL tracking data. Developed 40+ dbt models supporting multi-million dollar player salary decisions.
- **Teck Resources (Oct 2020 to May 2022):** Data Developer. Modernized legacy PostgreSQL stored procedures into testable Python pipelines using Terraform and Azure.

**Sport Sector Leadership**

- **Chair, Board of Directors, International Quidditch Association:** Led data and technology strategy for 30+ national governing bodies.
- **CEO, Volunteer Media Organization:** Managed operations for a 70-person volunteer organization across 30 countries.

**Education**

- **B.Sc., University of British Columbia:** Analytical Sports Management, a custom degree combining business, statistics, and machine learning.

## Team Member: Will Siddal, Senior Developer

Will Siddal brings 2+ years of full-stack development experience at Teck Resources, one of Canada's largest mining companies.

**Professional Experience**

- **Teck Resources (2022 to 2024):** Full Stack Developer. Built reporting pipelines processing billions of rows annually. Developed internal tools using React and TypeScript. Managed AWS infrastructure using Terraform.

**Education**

- Simon Fraser University. Based in British Columbia.

## Additional Team Members

Security Expert and UX Designer roles are in progress and will be named before submission. These positions will be filled with British Columbia based professionals with relevant enterprise experience.

| Role            | Status |
| --------------- | ------ |
| Security Expert | TBD    |
| UX Designer     | TBD    |

## Continuity of Services

Continuity is supported by the architecture and delivery model:

- **Infrastructure as Code:** All AWS resources are defined in SST and version controlled.
- **Operational Runbooks:** Deployment and recovery procedures are documented and maintained.
- **Automated Testing:** CI tests provide regression coverage for core workflows.
- **Principal Accountability:** Austin Wallace remains the constant delivery lead through rollout.

If a team member changes, the codebase, infrastructure definitions, and operational documentation enable efficient transition.

## Proposed Solution Statement

Austin Wallace Tech proposes the Solstice platform, a purpose-built information management system aligned to the Strength in Numbers requirements.

### Key Differentiators

**1. Working Prototype, Not a Proposal**

A functional prototype already exists and is available for evaluation. It addresses the majority of System Requirements Addendum items today and has been load-tested at production scale with 20.1 million rows.

**2. Principal-Led Delivery**

The architect and primary developer of the prototype will lead delivery. This reduces knowledge transfer risk and provides direct accountability.

**3. Domain Expertise in Sport Data**

Austin Wallace combines enterprise data engineering experience with leadership in amateur sport governance. This team understands sport sector reporting and data governance from firsthand experience.

**4. British Columbia Based**

The core team is based in British Columbia and remaining roles are expected to be BC based.

**5. Canadian Data Residency**

All data is hosted in AWS ca-central-1 (Canada). No data leaves Canadian jurisdiction.

### Benefits to viaSport

- **Reduced Risk:** Evaluate a working system before committing.
- **Accelerated Timeline:** 18 weeks to rollout because the platform exists today.
- **Direct Accountability:** Principal-led delivery with no organizational layers.
- **Sector Understanding:** Experience leading amateur sport organizations, not just building software.
- **Sustainability:** Serverless architecture and infrastructure as code reduce operating overhead.

# Service Approach: Data Submission and Reporting Web Portal

## UX Strategy and Approach

The Solstice portal is designed to make data submission efficient for non-technical administrators. The UX approach is role-based, task-focused, and aligned to reporting deadlines.

| User Group              | Primary Tasks                           | UX Focus                                                 |
| ----------------------- | --------------------------------------- | -------------------------------------------------------- |
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

The interface is built on Radix UI primitives and shadcn/ui components, which provide keyboard navigation and ARIA defaults. A formal WCAG audit is planned before submission. Latest accessibility scan evidence is in `docs/sin-rfp/review-plans/evidence/a11y-scan-20251231.json`.

### UX Refinement Process

During Planning and Discovery we will:

- Validate navigation structure against real viaSport workflows
- Identify friction points from legacy system usage
- Refine dashboard widgets to surface the most relevant information
- Apply viaSport branding and terminology

Detailed functional compliance for forms, submissions, and reporting lives in Section 04 (DM-AGG-001 and RP-AGG-003).

## Technology Stack and Benefits

### Frontend

| Technology     | Purpose                    | Benefit                                                         |
| -------------- | -------------------------- | --------------------------------------------------------------- |
| TanStack Start | Full-stack React framework | Type-safe end-to-end, server-side rendering, file-based routing |
| React 19       | UI library                 | Performance optimizations and modern suspense support           |
| TypeScript     | Type system                | Compile-time error detection and maintainability                |
| Tailwind CSS   | Styling                    | Consistent design system, rapid iteration                       |
| shadcn/ui      | Component library          | Accessible components with full customization control           |

### Backend and Middleware

| Technology                      | Purpose         | Benefit                                                    |
| ------------------------------- | --------------- | ---------------------------------------------------------- |
| TanStack Start Server Functions | API layer       | Co-located with UI, type-safe, no separate backend service |
| Drizzle ORM                     | Database access | Lightweight, predictable, typed schema mapping             |
| Better Auth                     | Authentication  | MFA support, session management, OAuth integration         |

### Database

| Technology            | Purpose            | Benefit                                         |
| --------------------- | ------------------ | ----------------------------------------------- |
| PostgreSQL on AWS RDS | Primary data store | Proven enterprise database, tested at 20M+ rows |

### Hosting

| Technology     | Purpose          | Benefit                               |
| -------------- | ---------------- | ------------------------------------- |
| AWS Lambda     | Application tier | Serverless, auto-scaling, pay-per-use |
| AWS CloudFront | CDN              | Edge caching, fast delivery           |
| AWS S3         | Object storage   | Documents, imports, artifacts         |
| AWS SQS        | Message queues   | Reliable notification delivery        |
| AWS SES        | Email            | Transactional email delivery          |

### Analytics

| Technology         | Purpose                | Benefit                                          |
| ------------------ | ---------------------- | ------------------------------------------------ |
| Native BI Platform | Self-service analytics | Built-in tenancy enforcement and audited exports |
| ECharts            | Charting               | Interactive visualizations                       |
| TanStack Table     | Data grids             | Sortable, filterable pivot tables with export    |

### Performance Evidence

Lighthouse and load tests were run in the prototype environment. Final validation runs will be completed before submission (TBD).

| Metric                   | Score or Value | Target  | Status |
| ------------------------ | -------------- | ------- | ------ |
| Performance Score        | 93/100         | >80     | Pass   |
| Largest Contentful Paint | 2284ms         | <2500ms | Pass   |
| Time to First Byte       | 380ms          | <500ms  | Pass   |
| Total Blocking Time      | 88ms           | <300ms  | Pass   |
| Cumulative Layout Shift  | 0              | <0.1    | Pass   |

See Appendix C for performance evidence and planned final runs.

# Service Approach: Data Warehousing

## Hosting Solution, Tenancy Model, Data Residency, and Regulatory Alignment

### Hosting Solution

The platform is hosted entirely on Amazon Web Services in a serverless architecture that reduces infrastructure overhead.

| Component        | AWS Service     | Purpose                                    |
| ---------------- | --------------- | ------------------------------------------ |
| Application Tier | Lambda          | Serverless compute, auto-scaling           |
| Database         | RDS PostgreSQL  | Managed relational database                |
| Object Storage   | S3              | Documents, import files, audit archives    |
| CDN              | CloudFront      | Edge caching, static asset delivery        |
| Message Queue    | SQS             | Asynchronous notification processing       |
| Email            | SES             | Transactional email delivery               |
| Scheduling       | EventBridge     | Scheduled jobs for retention and reminders |
| Secrets          | Secrets Manager | Credential storage                         |
| Encryption Keys  | KMS             | Key management for encryption at rest      |

### Data Residency

All data is hosted in AWS ca-central-1 (Canada). No data is stored or processed outside Canadian jurisdiction.

| Data Type            | Storage Location      | Region       |
| -------------------- | --------------------- | ------------ |
| Application database | RDS PostgreSQL        | ca-central-1 |
| Documents and files  | S3                    | ca-central-1 |
| Audit archives       | S3 Deep Archive       | ca-central-1 |
| Backups              | RDS automated backups | ca-central-1 |

### Tenancy Model

The platform uses a multi-tenant architecture with strict organization scoping:

- Every query is scoped to the user's organization.
- Role-based access control restricts actions by role.
- Field-level permissions control visibility of sensitive data.
- Cross-organization access requires explicit admin privileges.

### Regulatory Alignment

| Requirement         | Implementation                                                      |
| ------------------- | ------------------------------------------------------------------- |
| PIPEDA alignment    | Canadian data residency, encryption, access controls, audit logging |
| Data minimization   | Configurable retention policies and legal holds                     |
| Right to access     | Data export workflows with audit trail                              |
| Breach notification | Audit logging and anomaly detection                                 |

AWS maintains a Data Processing Addendum that covers all services used by the platform, including SES for email delivery: https://d1.awsstatic.com/legal/aws-dpa/aws-dpa.pdf

### Sub-Processors

| Service              | Provider | Purpose                   | Data Residency        |
| -------------------- | -------- | ------------------------- | --------------------- |
| Cloud infrastructure | AWS      | Hosting, compute, storage | Canada (ca-central-1) |
| Email delivery       | AWS SES  | Transactional emails      | Canada (ca-central-1) |

No additional sub-processors are used.

## Backup, Recovery, and Encryption Standards

### Backup Strategy

| Parameter                | Value                                          |
| ------------------------ | ---------------------------------------------- |
| Backup frequency         | Continuous (point-in-time recovery)            |
| Backup retention         | 35 days in production, 7 days in dev and perf  |
| Backup location          | RDS automated backups, ca-central-1            |
| Cross-region replication | Not enabled (single-region for data residency) |

### Recovery Objectives

| Metric                         | Target              | Evidence                               |
| ------------------------------ | ------------------- | -------------------------------------- |
| Recovery Point Objective (RPO) | 1 hour (production) | Final production drill TBD             |
| Recovery Time Objective (RTO)  | 4 hours             | sin-dev drill completed, final run TBD |

Evidence for the latest DR drill is in `docs/sin-rfp/review-plans/evidence/DR-DRILL-sin-dev-20251230.md`.

### High Availability

Production uses Multi-AZ for automatic failover. Dev and perf use single-AZ for cost efficiency.

### Encryption Standards

**In Transit:** TLS 1.2+ for client and service communication.

**At Rest:** AES-256 via AWS KMS for database storage and S3 objects.

Encryption evidence is documented in `docs/sin-rfp/review-plans/evidence/ENCRYPTION-STATUS-sin-dev-20251231.md`.

### Audit Log Retention and Archival

Audit logs are immutable and archived to S3 Deep Archive based on retention policy configuration. Retention durations and archive schedules will be finalized with viaSport (TBD). Legal holds are supported to prevent deletion.

### Why PostgreSQL (Not a Columnar Warehouse)

viaSport's scale of 20M historical rows with 1M rows per year is well within PostgreSQL capability. A dedicated columnar warehouse would add cost and complexity without benefit at this scale.

| Factor                        | PostgreSQL        | Columnar Warehouse          |
| ----------------------------- | ----------------- | --------------------------- |
| Optimal scale                 | Up to 500M+ rows  | Billions of rows            |
| viaSport projected (10 years) | 30M rows          | 30M rows                    |
| Operational complexity        | Low (managed RDS) | Higher (cluster management) |
| Estimated annual cost         | $3,000 to $6,000  | $12,000+ minimum            |
| Data freshness                | Real-time         | Requires ETL, often delayed |

PostgreSQL provides real-time analytics and simplified operations while keeping data resident in Canada.

# Service Approach: Data Migration

## Migration Methodology

### Approach

Migration follows a phased approach that reduces risk and validates data at each stage. BCAR and BCSI remain the source of truth until viaSport signs off on migrated data.

### Migration Phases

| Phase                      | Duration  | Activities                                                          | Exit Criteria              |
| -------------------------- | --------- | ------------------------------------------------------------------- | -------------------------- |
| Discovery                  | Weeks 1-2 | Obtain sample exports, document legacy schemas, assess data quality | Schema mapping approved    |
| Mapping and Transformation | Weeks 2-3 | Build mapping templates, define validation rules, test with samples | Templates validated        |
| Pilot Migration            | Weeks 3-4 | Migrate subset (one PSO), validate accuracy, refine mappings        | Pilot data verified        |
| Full Migration             | Weeks 4-6 | Migrate organizations, users, submissions, documents                | Reconciliation checks pass |
| Validation and Cutover     | Weeks 6-7 | Full reconciliation, UAT on migrated data                           | Sign-off received          |

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

Import jobs and audit logs provide traceability for each migration run. Retention durations are configurable and will be confirmed with viaSport (TBD).

### Success Verification

Migration success is verified through reconciliation:

| Check                 | Method                                            |
| --------------------- | ------------------------------------------------- |
| Row counts            | Source count matches target count                 |
| Checksums             | Hash comparison of key fields                     |
| Spot checks           | Manual verification of sample records by viaSport |
| Referential integrity | Foreign keys validated                            |

## Data Quality Targets and Defect Workflow

| Metric                 | Target                           |
| ---------------------- | -------------------------------- |
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

Import tooling is ready today. Extraction approach will be finalized during Discovery based on legacy system capabilities. See Section 04 DM-AGG-006 for detailed compliance mapping.

# Service Approach: Platform Design and Customization

## Cloud Provider Services

The platform is built on Amazon Web Services in the ca-central-1 (Montreal) region.

| Service         | Purpose                                    |
| --------------- | ------------------------------------------ |
| CloudFront      | CDN for static assets and edge caching     |
| Lambda          | Serverless application compute             |
| RDS PostgreSQL  | Managed relational database                |
| S3              | Object storage for documents and imports   |
| SQS             | Message queues for notifications           |
| SES             | Transactional email delivery               |
| EventBridge     | Scheduled jobs for retention and reminders |
| CloudWatch      | Metrics, logs, alarms                      |
| CloudTrail      | API audit logging                          |
| GuardDuty       | Threat detection                           |
| Secrets Manager | Credential storage with rotation           |
| KMS             | Encryption key management                  |

### Why AWS

| Factor           | Rationale                      |
| ---------------- | ------------------------------ |
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

| Environment | Purpose                 | Infrastructure Tier                         |
| ----------- | ----------------------- | ------------------------------------------- |
| sin-dev     | Development and testing | t4g.micro, 50 GB, single-AZ                 |
| sin-perf    | Performance testing     | t4g.large, 200 GB, single-AZ                |
| sin-prod    | Production              | t4g.large, 200 GB, Multi-AZ, 35-day backups |

Each environment is isolated with its own database, storage, and credentials.

### Development Workflow

```
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
```

### Quality Gates

| Gate          | Tooling           | Purpose                        |
| ------------- | ----------------- | ------------------------------ |
| Linting       | oxlint and ESLint | Code quality                   |
| Type checking | TypeScript        | Compile-time validation        |
| Formatting    | oxfmt             | Consistent style               |
| Unit tests    | Vitest            | Component and function testing |
| E2E tests     | Playwright        | Full user flow testing         |

### Deployment Process

Deployments are executed with SST:

```
npx sst deploy --stage sin-prod
```

This builds the application, deploys infrastructure, and updates application services. Database schema changes are applied through versioned migrations when required.

### Rollback

- Previous Lambda versions remain available for quick rollback.
- Database migrations include rollback plans when needed.
- SST maintains deployment history for audit and recovery.

### Customization Capabilities

The platform supports configuration without code changes:

| Customization         | Method                                        |
| --------------------- | --------------------------------------------- |
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

# Service Approach: Testing and Quality Assurance

## QA Approach

### Testing Layers

| Layer                | Tool                     | Purpose                          | Frequency    |
| -------------------- | ------------------------ | -------------------------------- | ------------ |
| Unit and Integration | Vitest + Testing Library | Component and function testing   | Every commit |
| End-to-End           | Playwright               | Full user flow testing           | Every commit |
| Property-Based       | fast-check               | Access control, audit integrity  | Every commit |
| Performance          | Lighthouse, k6           | Load testing and Core Web Vitals | Pre-release  |
| Security             | Manual plus automated    | MFA, sessions, audit hash chain  | Pre-release  |

### Automated Testing

Automated tests run in CI and gate merges where applicable. Coverage focuses on core workflows: login, data submission, reporting, analytics, and access control.

### Performance Testing

Performance testing is conducted in sin-perf with production-scale data. Final validation runs will be executed before submission (TBD).

| Metric              | Value             | Target           | Status   |
| ------------------- | ----------------- | ---------------- | -------- |
| Data volume         | 20.1 million rows | Production scale | Achieved |
| p95 latency         | 250ms             | <500ms           | Pass     |
| p50 latency         | 130ms             | N/A              | Pass     |
| Concurrent users    | 15                | N/A              | Pass     |
| Server errors (5xx) | 0                 | 0                | Pass     |

Evidence: `docs/sin-rfp/review-plans/evidence/` (final run TBD).

### Core Web Vitals

Lighthouse results from the prototype are recorded in Appendix C. Final Lighthouse runs will be completed before submission (TBD).

### Security Testing

Security testing validates:

- MFA and password recovery
- Session expiry and step-up authentication
- Role-based access enforcement
- Audit log integrity and hash chain verification
- Account lockout and anomaly detection

Evidence includes `docs/sin-rfp/review-plans/evidence/SECURITY-LOCKOUT-sin-dev-20251231.md` and audit hash chain tests in `src/lib/audit/__tests__/audit-hash-chain.pbt.test.ts`.

### Defect Management

| Severity | Definition                             | Response Time |
| -------- | -------------------------------------- | ------------- |
| Critical | Security vulnerability, data loss risk | Immediate     |
| High     | Core functionality broken              | Same day      |
| Medium   | Non-critical functionality affected    | Within sprint |
| Low      | Cosmetic or minor UX issues            | Backlog       |

Defects are tracked in a shared system accessible to viaSport.

## User Acceptance Testing Strategy

### UAT Approach

User Acceptance Testing validates that the platform meets viaSport requirements from the user perspective.

| Element       | Approach                                      |
| ------------- | --------------------------------------------- |
| Environment   | sin-perf with production-like data            |
| Access        | Role-based test accounts for viaSport testers |
| Visibility    | Test scenarios mapped to requirement IDs      |
| Communication | Weekly demos and visible ticketing            |

### UAT Timeline

| Week   | Focus                                                   |
| ------ | ------------------------------------------------------- |
| Week 1 | Core workflows: login, navigation, data submission      |
| Week 2 | Reporting and analytics: dashboards, exports, queries   |
| Week 3 | Administration: user management, configuration, imports |
| Week 4 | Edge cases, regression testing, sign-off preparation    |

### Test Scenarios

| Category        | Example Scenarios                                   |
| --------------- | --------------------------------------------------- |
| Data Management | Submit form, upload file, run import, validate data |
| Reporting       | Track submission status, run analytics, export data |
| Security        | Login with MFA, verify access, review audit log     |
| Training        | Complete walkthrough, search help center            |
| UI              | Navigate dashboard, receive notification            |

### Sign-Off Criteria

UAT sign-off requires:

1. All critical and high severity defects resolved
2. Test scenarios executed with documented results
3. No blocking issues for go-live
4. Written sign-off from viaSport project sponsor

After UAT sign-off, the platform is promoted to production and monitoring is enabled.

# Service Approach: Training and Onboarding

## Audience-Based Training Approach

Training is tailored to distinct user groups with different responsibilities.

| Audience                | Role                                       | Training Focus                                |
| ----------------------- | ------------------------------------------ | --------------------------------------------- |
| viaSport Administrators | Platform oversight, analytics, PSO support | Admin tools, cross-org reporting, governance  |
| PSO Reporters           | Data submission, compliance                | Form completion, file uploads, deadlines      |
| Data Stewards           | Data quality, imports                      | Validation, error resolution, bulk operations |

### Training Delivery Model

| Method                     | Audience                    | Format                                |
| -------------------------- | --------------------------- | ------------------------------------- |
| In-app guided walkthroughs | All users                   | Interactive tours inside the platform |
| Live training sessions     | viaSport admins, PSO admins | Video workshops and Q and A           |
| Train-the-trainer          | viaSport staff              | Enable viaSport to support PSOs       |
| Self-service help center   | All users                   | Searchable guides, FAQ, templates     |

### Training Phases

| Phase                   | Timing      | Participants       | Content                                    |
| ----------------------- | ----------- | ------------------ | ------------------------------------------ |
| viaSport Admin Training | Weeks 13-14 | viaSport staff     | Full platform capabilities and admin tools |
| PSO Rollout Training    | Weeks 15-18 | PSO administrators | Core workflows and reporting               |
| Ongoing                 | Post-launch | All users          | Refreshers and new features                |

### PSO Rollout Cohorts

Cohort sizing and scheduling will be confirmed with viaSport during Planning (TBD).

## Resources and Sample Training Materials

### In-App Training Features

| Feature             | Description                               |
| ------------------- | ----------------------------------------- |
| Guided walkthroughs | Step-by-step tutorials for common tasks   |
| Onboarding tour     | First-time user walkthrough of key areas  |
| Progress tracking   | Per-user tracking of completed tutorials  |
| Contextual help     | Help icons and tooltips throughout the UI |

### Help Center

The help center provides searchable guides and FAQs by role:

| Content Type           | Examples                                               |
| ---------------------- | ------------------------------------------------------ |
| Getting started guides | Account setup, first login, dashboard overview         |
| How-to articles        | Submit a form, upload a file, export data              |
| FAQ                    | Common questions organized by category                 |
| Troubleshooting        | Login issues, validation errors, browser compatibility |

### Templates Hub

Templates are centrally managed and available in context:

| Template Type       | Purpose                                      |
| ------------------- | -------------------------------------------- |
| Import templates    | CSV and Excel templates with correct headers |
| Form templates      | Example submissions and expected formats     |
| Reporting templates | Sample reporting configurations and exports  |

### Documentation Formats

| Format             | Use Case                              |
| ------------------ | ------------------------------------- |
| In-app interactive | Primary delivery, always current      |
| PDF guides         | Offline reference                     |
| Video tutorials    | Visual learners and complex workflows |

Sample training materials will be reviewed with viaSport during Planning (TBD).

## Help Desk and Ticketing Model

### Support Tiers

| Tier   | Channel                 | Scope                           | Response                            |
| ------ | ----------------------- | ------------------------------- | ----------------------------------- |
| Tier 1 | In-app support requests | General questions, how-to       | 24 hours                            |
| Tier 2 | Email                   | Technical issues, bug reports   | 24 hours standard, 4 hours critical |
| Tier 3 | Direct escalation       | Critical issues, system outages | 4 hours                             |

### Support Hours

| Coverage        | Hours                                                 |
| --------------- | ----------------------------------------------------- |
| Standard        | Business hours, Pacific Time (Mon to Fri, 9am to 5pm) |
| Critical issues | Business hours with monitoring alerts                 |

24/7 support is available as an optional add-on.

### Ticket Workflow

```
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
```

### Response Commitments

| Priority | First Response | Target Resolution |
| -------- | -------------- | ----------------- |
| Critical | 4 hours        | Same business day |
| High     | 8 hours        | 2 business days   |
| Standard | 24 hours       | 5 business days   |
| Low      | 48 hours       | Best effort       |

Resolution targets depend on issue complexity and may require additional time for root-cause analysis.

viaSport receives monthly support reports covering ticket volume, response times, and trends.

# System Requirements Compliance Crosswalk

This table summarizes compliance status for all 25 requirements. Detailed implementation notes follow in subsequent sections.

## Status Legend

| Status      | Meaning                                                  |
| ----------- | -------------------------------------------------------- |
| **Built**   | Functional in the prototype and available for evaluation |
| **Partial** | Core functionality built, specific items remaining       |
| **Depends** | Requires viaSport input to complete                      |

## Data Management (DM-AGG)

| Req ID     | Title                                 | Status  | Built Today                                     | Remaining                               |
| ---------- | ------------------------------------- | ------- | ----------------------------------------------- | --------------------------------------- |
| DM-AGG-001 | Data Collection and Submission        | Built   | Form builder, file uploads, submission tracking | viaSport templates                      |
| DM-AGG-002 | Data Processing and Integration       | Partial | Import and export, validation, audit logging    | External integrations                   |
| DM-AGG-003 | Data Governance and Access Control    | Built   | RBAC, org scoping, data catalog                 | Catalog taxonomy refinement             |
| DM-AGG-004 | Data Quality and Integrity            | Built   | Validation rules, data quality monitoring       | Threshold tuning with viaSport          |
| DM-AGG-005 | Data Storage and Retention            | Built   | Backups, archiving, retention enforcement       | Final DR and retention validation (TBD) |
| DM-AGG-006 | Legacy Data Migration and Bulk Import | Partial | Import wizard, mapping templates, rollback      | Legacy extraction and mapping           |

## Reporting (RP-AGG)

| Req ID     | Title                                  | Status  | Built Today                                  | Remaining                       |
| ---------- | -------------------------------------- | ------- | -------------------------------------------- | ------------------------------- |
| RP-AGG-001 | Data Validation and Submission Rules   | Built   | Validation rules and error messaging         | None                            |
| RP-AGG-002 | Reporting Information Management       | Partial | Reporting metadata schema, delegated access  | viaSport metadata configuration |
| RP-AGG-003 | Reporting Flow and Support             | Built   | Reminders, resubmission tracking, dashboards | None                            |
| RP-AGG-004 | Reporting Configuration and Collection | Built   | Form builder, file management                | None                            |
| RP-AGG-005 | Self-Service Analytics and Data Export | Built   | Native BI, pivots, charts, export            | None                            |

## Security (SEC-AGG)

| Req ID      | Title                             | Status | Built Today                               | Remaining                             |
| ----------- | --------------------------------- | ------ | ----------------------------------------- | ------------------------------------- |
| SEC-AGG-001 | Authentication and Access Control | Built  | MFA, RBAC, org scoping                    | None                                  |
| SEC-AGG-002 | Monitoring and Threat Detection   | Built  | Anomaly detection, lockouts, alerts       | None                                  |
| SEC-AGG-003 | Privacy and Regulatory Compliance | Built  | Encryption, residency, retention controls | Compliance package and pen test (TBD) |
| SEC-AGG-004 | Audit Trail and Data Lineage      | Built  | Immutable audit log, hash chain           | None                                  |

## Training and Onboarding (TO-AGG)

| Req ID     | Title                            | Status | Built Today                         | Remaining                  |
| ---------- | -------------------------------- | ------ | ----------------------------------- | -------------------------- |
| TO-AGG-001 | Template Support and Integration | Built  | Templates hub with contextual links | viaSport templates         |
| TO-AGG-002 | Guided Learning and Walkthroughs | Built  | Guided tours and walkthroughs       | Final content review (TBD) |
| TO-AGG-003 | Reference Materials and Support  | Built  | Help center with guides and FAQ     | Content refinement         |

## User Interface (UI-AGG)

| Req ID     | Title                                   | Status | Built Today                         | Remaining                |
| ---------- | --------------------------------------- | ------ | ----------------------------------- | ------------------------ |
| UI-AGG-001 | User Access and Account Control         | Built  | Login, MFA, recovery, RBAC          | None                     |
| UI-AGG-002 | Personalized Dashboard                  | Built  | Role-aware dashboards               | None                     |
| UI-AGG-003 | Responsive and Inclusive Design         | Built  | Responsive UI, accessibility scans  | Formal audit (TBD)       |
| UI-AGG-004 | Task and Notification Management        | Built  | Notifications and reminders         | None                     |
| UI-AGG-005 | Content Navigation and Interaction      | Built  | Search, filtering, command palette  | None                     |
| UI-AGG-006 | User Support and Feedback               | Built  | Support requests and admin response | None                     |
| UI-AGG-007 | Consistent Visual Language and Branding | Built  | Design system and theming           | viaSport branding assets |

## Summary

| Category                | Total  | Built  | Partial |
| ----------------------- | ------ | ------ | ------- |
| Data Management         | 6      | 4      | 2       |
| Reporting               | 5      | 4      | 1       |
| Security                | 4      | 4      | 0       |
| Training and Onboarding | 3      | 3      | 0       |
| User Interface          | 7      | 7      | 0       |
| **Total**               | **25** | **22** | **3**   |

Three requirements are partial due to integration and metadata dependencies that require viaSport input.

# System Requirements: Data Management (DM-AGG)

## Compliance Summary

| Req ID     | Title                                 | Status  | Built Today                                     | Remaining Scope                          |
| ---------- | ------------------------------------- | ------- | ----------------------------------------------- | ---------------------------------------- |
| DM-AGG-001 | Data Collection and Submission        | Built   | Form builder, file uploads, submission tracking | viaSport templates and field definitions |
| DM-AGG-002 | Data Processing and Integration       | Partial | Import and export, validation, audit logging    | External integrations and mapping rules  |
| DM-AGG-003 | Data Governance and Access Control    | Built   | RBAC, org scoping, data catalog                 | Catalog taxonomy refinement              |
| DM-AGG-004 | Data Quality and Integrity            | Built   | Validation rules, data quality monitoring       | Threshold tuning with viaSport           |
| DM-AGG-005 | Data Storage and Retention            | Built   | Backups, archiving, retention enforcement       | Final DR and retention validation (TBD)  |
| DM-AGG-006 | Legacy Data Migration and Bulk Import | Partial | Import wizard, mapping templates, rollback      | Legacy extraction scope and mapping      |

## DM-AGG-001: Data Collection and Submission

**Requirement:**

> The system shall enable customizable form building, support flexible data entry through variable formats (forms, file uploads), with capabilities for real-time submission tracking, editing, and historical data migration.

**Acceptance Criteria:**

> Users and System Admin can successfully submit, track, and edit data.

**How We Meet It:**

- Administrators build and publish custom forms without code changes.
- Submissions support file uploads and status tracking.
- Users can edit submissions and view version history.

**Built Today:**

- Form builder with 11 field types (text, number, email, phone, date, select, multiselect, checkbox, file, textarea, rich text).
- Submission statuses with history and audit entries.
- File uploads validated and stored in S3 with access controls.
- Import jobs link historical data to form submissions.

**Remaining Scope:**

- viaSport specific templates and field definitions (TBD).

**viaSport Dependencies:**

- Final form templates and data dictionary.

**Approach:**
Template and field definitions will be finalized during Discovery. See Section 03 Data Submission and Reporting for UX approach.

**Evidence:**

- `docs/sin-rfp/review-plans/evidence/DM-AGG-001-form-builder-20251228-1953.png`
- `docs/sin-rfp/review-plans/evidence/DM-AGG-001-forms-20251228-1953.png`

## DM-AGG-002: Data Processing and Integration

**Requirement:**

> The system shall enable standardization of data formatting, logging of transformation processes, and integration with external platforms through API (optional), and data import/export mechanisms.

**Acceptance Criteria:**

> Incoming data is processed uniformly, logged for traceability, and exchanged with external platforms.

**How We Meet It:**

- Import and export pipelines normalize data types and validate required fields.
- Transformation and import events are logged in the audit trail.
- Export formats support CSV, Excel, and JSON.

**Built Today:**

- Import parser with typed validation and row level error logging.
- Mapping templates and audit logging for import jobs.
- Export controls enforced through BI and reporting pipelines.

**Remaining Scope:**

- External API integrations scoped with viaSport and legacy system owners.
- Standardized mapping rules for cross system integrations.

**viaSport Dependencies:**

- Integration targets, API access, and data exchange requirements.

**Approach:**
Define integration scope during Discovery, then implement connectors and validation. See Section 03 Data Migration for methodology.

**Evidence:**

- `docs/sin-rfp/review-plans/evidence/2025-12-29-import-preview-confirmation.png`
- `src/features/imports/imports.mutations.ts`

## DM-AGG-003: Data Governance and Access Control

**Requirement:**

> The system shall enforce role-based access to data and provide administrators with secure database access, along with data cataloging and indexing capabilities for discoverability.

**Acceptance Criteria:**

> Users can only access data based on permission.

**How We Meet It:**

- Role-based access control with organization scoping is enforced on every query.
- Field-level access control is applied in analytics and exports.
- Data catalog indexes forms, templates, and reports for discoverability.

**Built Today:**

- Predefined roles (owner, admin, reporter, viewer) with permission checks.
- Data catalog and global search for forms, templates, and reports.
- Admin access to data through audited BI and SQL workbench.

**Remaining Scope:**

- Catalog taxonomy and tagging refinement with viaSport (TBD).

**viaSport Dependencies:**

- Preferred catalog taxonomy and indexing priorities.

**Approach:**
Refine catalog categories during Discovery. See Section 03 Platform Design for governance approach.

**Evidence:**

- `docs/sin-rfp/review-plans/evidence/DM-AGG-003-data-catalog-20251228-1953.png`
- `docs/sin-rfp/review-plans/evidence/DM-AGG-003-org-access-20251228-1953.png`

## DM-AGG-004: Data Quality and Integrity

**Requirement:**

> The system shall ensure relational integrity and continuously monitor data quality using validation rules and automated checks.

**Acceptance Criteria:**

> Submitted data meets validation rules.

**How We Meet It:**

- Database constraints enforce relational integrity.
- Forms and imports validate required fields and formats.
- Automated quality checks identify missing fields and validation errors.

**Built Today:**

- Server side validation with Zod schemas and form rules.
- Data quality monitoring job with alerting for missing fields and low completeness.
- Admin dashboard view for data quality metrics.

**Remaining Scope:**

- Threshold tuning and alert recipients confirmed with viaSport (TBD).

**viaSport Dependencies:**

- Data quality threshold preferences and escalation contacts.

**Approach:**
Configure thresholds during Discovery and validate in UAT. See Section 03 Testing and QA.

**Evidence:**

- `docs/sin-rfp/review-plans/evidence/DM-AGG-004-data-quality-20251228-1953.png`
- `src/features/data-quality/data-quality.monitor.ts`

## DM-AGG-005: Data Storage and Retention

**Requirement:**

> The system shall support regular backups, disaster recovery mechanisms, data archiving, and secure cloud hosting aligned with retention policies.

**Acceptance Criteria:**

> Data is backed up, archived as scheduled, and securely hosted in the cloud.

**How We Meet It:**

- RDS backups with point in time recovery are enabled.
- Retention enforcement and legal hold workflows protect regulated data.
- Audit logs are immutable and archived to S3 Deep Archive.

**Built Today:**

- Backup retention configured per environment (35 days in production).
- Retention policy engine with legal holds and audit log archiving.
- S3 Object Lock enabled for artifacts storage.

**Remaining Scope:**

- Final production DR drill and retention validation before submission (TBD).

**viaSport Dependencies:**

- Confirm retention durations and DR schedule.

**Approach:**
Run final DR and retention validation in sin-perf or sin-prod. See Section 03 Data Warehousing.

**Evidence:**

- `docs/sin-rfp/review-plans/evidence/DR-DRILL-sin-dev-20251230.md`
- `docs/sin-rfp/review-plans/evidence/ENCRYPTION-STATUS-sin-dev-20251231.md`
- `docs/sin-rfp/review-plans/evidence/RETENTION-JOB-sin-dev-20251230.md`

## DM-AGG-006: Legacy Data Migration and Bulk Import

**Requirement:**

> The system shall provide tooling and configurable mapping templates to import historical data from CSV/Excel, legacy databases, or APIs, including validation, error-handling, and rollback.

**Acceptance Criteria:**

> Administrators can map legacy fields to system fields, preview results, and execute import; import logs stored for audit.

**How We Meet It:**

- Import wizard supports CSV and Excel uploads with mapping templates.
- Validation preview highlights errors before commit.
- Import jobs are auditable and reversible within the rollback window.

**Built Today:**

- Import wizard with upload, mapping, preview, and commit flow.
- Mapping template library and reusable mappings.
- Rollback support using import job ID and 7 day rollback window.
- Batch processing lane with ECS Fargate in perf and prod.

**Remaining Scope:**

- Legacy extraction and BCAR or BCSI mapping rules.
- Additional migration pipelines for organization and user records (TBD).

**viaSport Dependencies:**

- Legacy export access and schema documentation.
- SME review for mapping templates.

**Approach:**
Finalize extraction approach during Discovery, then execute pilot and phased migration. See Section 03 Data Migration.

**Evidence:**

- `docs/sin-rfp/review-plans/evidence/DM-AGG-006-imports-20251228-1953.png`
- `docs/sin-rfp/review-plans/evidence/DM-AGG-006-import-admin-20251228-1953.png`
- `docs/sin-rfp/review-plans/evidence/2025-12-29-import-preview-confirmation.png`

# System Requirements: Reporting (RP-AGG)

## Compliance Summary

| Req ID     | Title                                  | Status  | Built Today                                        | Remaining Scope                 |
| ---------- | -------------------------------------- | ------- | -------------------------------------------------- | ------------------------------- |
| RP-AGG-001 | Data Validation and Submission Rules   | Built   | Validation rules and error messaging               | None                            |
| RP-AGG-002 | Reporting Information Management       | Partial | Reporting metadata schema and access controls      | viaSport metadata configuration |
| RP-AGG-003 | Reporting Flow and Support             | Built   | Reminders, resubmission tracking, dashboards       | None                            |
| RP-AGG-004 | Reporting Configuration and Collection | Built   | Form builder, file management, admin configuration | None                            |
| RP-AGG-005 | Self-Service Analytics and Data Export | Built   | Native BI, pivots, charts, CSV and Excel export    | None                            |

## RP-AGG-001: Data Validation and Submission Rules

**Requirement:**

> The system shall validate submissions to ensure they are complete, clean, use the correct file types, and contain valid data fields such as dates and contact information.

**Acceptance Criteria:**

> Submissions that fail validation are rejected with appropriate error messages.

**How We Meet It:**

- Required fields and validation rules are enforced on submit.
- File uploads are validated by MIME type and size.
- Errors are shown inline with actionable messages.

**Built Today:**

- Zod-based validation for forms and imports.
- Server-side enforcement to prevent bypassing client checks.
- File upload validation and safe storage keys.

**Remaining Scope:**

- None. Fully implemented.

**Approach:**
Continue to refine validation rules during Discovery based on viaSport templates.

**Evidence:**

- `docs/sin-rfp/review-plans/evidence/DM-AGG-001-forms-20251228-1953.png`
- `src/features/forms/forms.utils.ts`

## RP-AGG-002: Reporting Information Management

**Requirement:**

> The system shall manage metadata related to reporting including but not limited to contribution agreements, NCCP, contact details, fiscal periods, organization profiles, and delegated access rights.

**Acceptance Criteria:**

> Users can update relevant metadata and access reporting features accordingly.

**How We Meet It:**

- Reporting metadata schema includes fiscal periods, contribution agreements, and NCCP fields.
- Organization profiles and delegated access are managed through roles and invites.
- Reporting tasks and submissions are tied to organizations and cycles.

**Built Today:**

- Reporting metadata schema and update endpoints.
- Organization profile and role management with delegated access.
- Reporting cycles and tasks with due dates and reminders.

**Remaining Scope:**

- viaSport metadata configuration and UI refinement for specific fields (TBD).

**viaSport Dependencies:**

- Data dictionary and field definitions for contribution agreements and NCCP.

**Approach:**
Configure metadata fields during Discovery and validate in UAT. See Section 03 Training and Onboarding for change adoption.

**Evidence:**

- `src/features/reporting/reporting.schemas.ts`
- `src/features/organizations/organizations.mutations.ts`

## RP-AGG-003: Reporting Flow and Support

**Requirement:**

> The system shall support automated reporting reminders, allow users to track data resubmissions, and visualize submitted data through dashboards.

**Acceptance Criteria:**

> Users are reminded, track changes, and view data in a dashboard format.

**How We Meet It:**

- Reporting tasks track status across cycles and due dates.
- Reminder schedules generate in-app and email notifications.
- Submission history records resubmissions and status changes.

**Built Today:**

- Reporting dashboard with status and due dates.
- Reminder schedules and notification delivery.
- Submission history and resubmission tracking.

**Remaining Scope:**

- None. Fully implemented.

**Approach:**
Reminder cadence and reporting dashboards will be tuned with viaSport during Discovery.

**Evidence:**

- `docs/sin-rfp/review-plans/evidence/RP-AGG-003-reporting-20251228-1953.png`
- `docs/sin-rfp/review-plans/evidence/NOTIFICATIONS-DELIVERY-sin-dev-20251231.md`

## RP-AGG-004: Reporting Configuration and Collection

**Requirement:**

> The system shall allow system administrators to configure customizable reporting forms, define required fields, display files for users to read, edit, delete, and download.

**Acceptance Criteria:**

> System admin can configure reporting information and forms.

**How We Meet It:**

- Administrators build forms and set required fields.
- File uploads are visible with read, download, and delete controls.
- Form versions preserve historical submissions.

**Built Today:**

- Form builder and versioning for reporting forms.
- File management for submissions with delete and download actions.
- Admin reporting configuration tools.

**Remaining Scope:**

- None. Fully implemented.

**Approach:**
Continue to refine reporting form templates during Discovery.

**Evidence:**

- `docs/sin-rfp/review-plans/evidence/RP-AGG-004-reporting-admin-20251228-1953.png`
- `src/routes/dashboard/sin/submissions/$submissionId.tsx`

## RP-AGG-005: Self-Service Analytics and Data Export

**Requirement:**

> Enable authorized users to build ad-hoc charts, pivot tables, and export raw or aggregated datasets in CSV, Excel, or JSON (optional) without developer intervention.

**Acceptance Criteria:**

> User builds a custom chart and exports underlying dataset to CSVs; export respects field-level access rules.

**How We Meet It:**

- Native BI supports pivot tables, charts, and dashboards.
- Exports are available in CSV, Excel, and JSON.
- Field-level access and step-up authentication protect sensitive data.

**Built Today:**

- Pivot builder and charting with ECharts.
- CSV, XLSX, and JSON exports with audit logging.
- Field-level access control and step-up authentication on export.

**Remaining Scope:**

- None. Fully implemented.

**Approach:**
Continue to expand datasets and templates as viaSport priorities are defined.

**Evidence:**

- `docs/sin-rfp/review-plans/evidence/RP-AGG-005-analytics-access-20251228-1953.png`
- `docs/sin-rfp/review-plans/evidence/RP-AGG-005-analytics-admin-20251228-1953.png`

# System Requirements: Security (SEC-AGG)

## Compliance Summary

| Req ID      | Title                             | Status | Built Today                                | Remaining Scope                       |
| ----------- | --------------------------------- | ------ | ------------------------------------------ | ------------------------------------- |
| SEC-AGG-001 | Authentication and Access Control | Built  | MFA, RBAC, org scoping, user admission     | None                                  |
| SEC-AGG-002 | Monitoring and Threat Detection   | Built  | Anomaly detection, account lockout, alerts | None                                  |
| SEC-AGG-003 | Privacy and Regulatory Compliance | Built  | Encryption, residency, retention controls  | Compliance package and pen test (TBD) |
| SEC-AGG-004 | Audit Trail and Data Lineage      | Built  | Immutable audit log with hash chain        | None                                  |

## SEC-AGG-001: Authentication and Access Control

**Requirement:**

> The system shall enforce multi-factor authentication, support secure password recovery, restrict access based on user roles and affiliations, and allow organizational leaders to manage user admission.

**Acceptance Criteria:**

> Users log in securely; only authorized individuals gain access based on role and affiliation.

**How We Meet It:**

- MFA with TOTP and backup codes is supported.
- Password reset uses time-limited email tokens.
- RBAC and organization scoping are enforced in the API layer.
- Organization owners and admins manage invites and join requests.

**Built Today:**

- MFA enrollment and recovery flows.
- Role-based permissions and org membership enforcement.
- User invitation and join request workflows.

**Remaining Scope:**

- None. Fully implemented.

**Approach:**
Continue to validate flows during UAT. See Section 03 Testing and QA.

**Evidence:**

- `docs/sin-rfp/review-plans/evidence/SEC-AGG-001-login-20251228-1953.png`
- `docs/sin-rfp/review-plans/evidence/SEC-AGG-001-mfa-20251228-1953.png`
- `docs/sin-rfp/review-plans/evidence/SEC-AGG-001-roles-20251228-1953.png`

## SEC-AGG-002: Monitoring and Threat Detection

**Requirement:**

> The system shall detect and flag suspicious activities such as unusual login patterns or behavior anomalies and automatically lock accounts where appropriate.

**Acceptance Criteria:**

> Security anomalies are flagged, logged, and result in appropriate account safeguards.

**How We Meet It:**

- Security events are recorded with risk scores and thresholds.
- Failed logins trigger account flagging and lockouts.
- Admins receive security alerts for anomalous behavior.

**Built Today:**

- Login failure and MFA failure thresholds with account lockouts.
- Security event logging and admin alerting.
- GuardDuty enabled for infrastructure level monitoring.

**Remaining Scope:**

- None. Fully implemented.

**Approach:**
Security rules are tuned with viaSport and validated in UAT.

**Evidence:**

- `docs/sin-rfp/review-plans/evidence/SEC-AGG-002-security-20251228-1953.png`
- `docs/sin-rfp/review-plans/evidence/SECURITY-LOCKOUT-sin-dev-20251231.md`

## SEC-AGG-003: Privacy and Regulatory Compliance

**Requirement:**

> The system shall comply with relevant data protection laws (e.g., PIPEDA) to ensure secure handling, storage, and access to personal information.

**Acceptance Criteria:**

> All sensitive data is encrypted and stored securely.

**How We Meet It:**

- Data is hosted in Canada with encryption in transit and at rest.
- Role-based and field-level access controls protect PII.
- Retention policies and legal holds support data minimization.

**Built Today:**

- Canadian data residency (ca-central-1).
- AES-256 encryption via KMS for RDS and S3.
- Retention enforcement and legal hold tooling.

**Remaining Scope:**

- Final compliance package and penetration test prior to submission (TBD).

**Approach:**
Provide compliance artifacts and independent test results in Appendix D prior to submission.

**Evidence:**

- `docs/sin-rfp/review-plans/evidence/SEC-AGG-003-privacy-20251228-1953.png`
- `docs/sin-rfp/review-plans/evidence/ENCRYPTION-STATUS-sin-dev-20251231.md`
- `docs/sin-rfp/review-plans/evidence/2025-12-29-privacy-retention-legal-hold.png`

## SEC-AGG-004: Audit Trail and Data Lineage

**Requirement:**

> The system shall maintain an immutable audit log of user actions, data changes, authentication events, and administrative configurations, supporting forensic review and regulatory reporting.

**Acceptance Criteria:**

> Auditors can filter logs by user or record ID and export results; tamper-evident hashing verifies integrity of log entries.

**How We Meet It:**

- Audit log records user actions, auth events, and admin changes.
- Hash chain verification detects tampering.
- Admins can filter and export logs.

**Built Today:**

- Append-only audit log with hash chain verification.
- Export and filter UI for audit logs.
- Audit log archives stored in S3 Deep Archive.

**Remaining Scope:**

- None. Fully implemented.

**Approach:**
Continue to validate audit integrity during UAT and provide evidence in Appendix D.

**Evidence:**

- `docs/sin-rfp/review-plans/evidence/SEC-AGG-004-audit-20251228-1953.png`
- `src/lib/audit/__tests__/audit-hash-chain.pbt.test.ts`

# System Requirements: Training and Onboarding (TO-AGG)

## Compliance Summary

| Req ID     | Title                            | Status | Built Today                         | Remaining Scope                  |
| ---------- | -------------------------------- | ------ | ----------------------------------- | -------------------------------- |
| TO-AGG-001 | Template Support and Integration | Built  | Templates hub with contextual links | viaSport templates content       |
| TO-AGG-002 | Guided Learning and Walkthroughs | Built  | Guided tours and walkthroughs       | Final content review (TBD)       |
| TO-AGG-003 | Reference Materials and Support  | Built  | Help center with guides and FAQ     | Content refinement with viaSport |

## TO-AGG-001: Template Support and Integration

**Requirement:**

> The system shall provide a centralized templates tab and offer contextual template access directly from each data entry item to guide users through required formats.

**Acceptance Criteria:**

> Users can easily locate and access the correct template when needed.

**How We Meet It:**

- Templates hub centralizes all templates in one location.
- Contextual links surface templates from forms, imports, and reporting.
- Templates are tagged by context for search and filtering.

**Built Today:**

- Templates hub UI with context filters.
- Admin panel to manage global and organization templates.
- Contextual links on form, reporting, and import screens.

**Remaining Scope:**

- viaSport specific templates and sample data (TBD).

**viaSport Dependencies:**

- Template content and formatting requirements.

**Approach:**
Collect templates during Discovery and load into the hub prior to UAT.

**Evidence:**

- `docs/sin-rfp/review-plans/evidence/TO-AGG-001-templates-20251228-1953.png`
- `docs/sin-rfp/review-plans/evidence/TO-AGG-001-templates-admin-20251228-1953.png`

## TO-AGG-002: Guided Learning and Walkthroughs

**Requirement:**

> The system shall offer onboarding and data upload tutorials to help users navigate key processes, especially during their first-time use.

**Acceptance Criteria:**

> Users can complete tasks independently with support from walkthroughs.

**How We Meet It:**

- Guided walkthroughs highlight key UI elements.
- Tutorials cover onboarding and data upload workflows.
- Progress tracking allows users to resume or restart.

**Built Today:**

- Guided tours for onboarding and data upload.
- Tutorial panel with progress tracking.
- Contextual launch points on portal pages.

**Remaining Scope:**

- Final content review with viaSport stakeholders (TBD).

**Approach:**
Refine tutorial copy and steps during Discovery and UAT.

**Evidence:**

- `src/features/tutorials/tutorials.config.ts`
- `src/features/tutorials/components/tutorial-panel.tsx`

## TO-AGG-003: Reference Materials and Support

**Requirement:**

> The system shall provide categorized guides and a frequently asked questions (FAQ) section to help users resolve issues and understand system functionality.

**Acceptance Criteria:**

> Users can find accurate answers and instructional material without needing direct support.

**How We Meet It:**

- Help center organizes guides by role and category.
- FAQ entries surface common questions.
- Search filters content by keyword.

**Built Today:**

- Help center with searchable guides and FAQ.
- Role-based content filtering.
- In-app support requests for escalation.

**Remaining Scope:**

- Content refinement based on viaSport terminology (TBD).

**Approach:**
Review help content during Discovery and incorporate viaSport feedback.

**Evidence:**

- `docs/sin-rfp/review-plans/evidence/TO-AGG-003-help-center-20251228-1953.png`

# System Requirements: User Interface (UI-AGG)

## Compliance Summary

| Req ID     | Title                                   | Status | Built Today                            | Remaining Scope                      |
| ---------- | --------------------------------------- | ------ | -------------------------------------- | ------------------------------------ |
| UI-AGG-001 | User Access and Account Control         | Built  | Login, MFA, recovery, RBAC             | None                                 |
| UI-AGG-002 | Personalized Dashboard                  | Built  | Role-aware dashboards                  | None                                 |
| UI-AGG-003 | Responsive and Inclusive Design         | Built  | Responsive UI and accessibility        | Formal audit before submission (TBD) |
| UI-AGG-004 | Task and Notification Management        | Built  | Automated reminders and notifications  | None                                 |
| UI-AGG-005 | Content Navigation and Interaction      | Built  | Search, filtering, command palette     | None                                 |
| UI-AGG-006 | User Support and Feedback Mechanism     | Built  | Support requests and admin response UI | None                                 |
| UI-AGG-007 | Consistent Visual Language and Branding | Built  | Design system and tenant branding      | viaSport branding configuration      |

## UI-AGG-001: User Access and Account Control

**Requirement:**

> The system shall support secure login/logout (MFA), individual and organizational account registration, account recovery, and system administrator account management with role-based access.

**Acceptance Criteria:**

> Users and system admin can perform account-related tasks securely.

**How We Meet It:**

- Secure login with MFA and session management.
- Password recovery via time-limited tokens.
- Admin tools for user management and role assignment.

**Built Today:**

- MFA enrollment and recovery flows.
- Organization invite and join request workflows.
- Admin settings panel for user access management.

**Remaining Scope:**

- None. Fully implemented.

**Approach:**
Validate account flows during UAT and incorporate viaSport policy guidance.

**Evidence:**

- `docs/sin-rfp/review-plans/evidence/SEC-AGG-001-login-20251228-1953.png`
- `docs/sin-rfp/review-plans/evidence/UI-AGG-001-settings-20251228-1953.png`

## UI-AGG-002: Personalized Dashboard

**Requirement:**

> The system shall provide the capability to create personalized dashboard for each user role, summarizing relevant data, actions, and reporting progress.

**Acceptance Criteria:**

> Users can view personalized dashboards based on their roles.

**How We Meet It:**

- Dashboards show different cards and metrics by role.
- Reporting status and tasks surface at the top of the portal.
- Admin dashboards include cross-org visibility.

**Built Today:**

- Role-aware portal dashboard.
- Reporting status and overdue indicators.
- Quick actions for forms, analytics, and imports.

**Remaining Scope:**

- None. Fully implemented.

**Approach:**
Refine dashboard widgets based on viaSport priorities.

**Evidence:**

- `docs/sin-rfp/review-plans/evidence/UI-AGG-002-dashboard-20251228-1953.png`

## UI-AGG-003: Responsive and Inclusive Design

**Requirement:**

> The system shall provide a responsive interface across devices and include accessibility features such as screen reader compatibility, color contrast tools, and etc.

**Acceptance Criteria:**

> System is functional on all devices and meets accessibility compliance.

**How We Meet It:**

- Mobile-first layout with responsive breakpoints.
- Accessible UI primitives with keyboard navigation and ARIA labels.
- Color contrast and focus indicators baked into the design system.

**Built Today:**

- Responsive portal and admin screens.
- A11y scan completed and recorded.
- Keyboard navigation and accessible components across workflows.

**Remaining Scope:**

- Formal accessibility audit before submission (TBD).

**Approach:**
Run formal audit and remediate findings prior to submission.

**Evidence:**

- `docs/sin-rfp/review-plans/evidence/UI-AGG-003-mobile-20251228-1953.png`
- `docs/sin-rfp/review-plans/evidence/a11y-scan-20251231.json`

## UI-AGG-004: Task and Notification Management

**Requirement:**

> The system shall enable automated and customizable notification messages and task reminders that alert users of pending actions and updates, both on the platform and via email.

**Acceptance Criteria:**

> Users receive timely and relevant notifications and reminders.

**How We Meet It:**

- Scheduled reminders are generated from reporting tasks.
- In-app notifications surface updates and status changes.
- Email delivery uses AWS SES with delivery logging.

**Built Today:**

- Notification scheduler and in-app notification feed.
- Email delivery with SES logging.
- Reminder cadence configurable per task.

**Remaining Scope:**

- None. Fully implemented.

**Approach:**
Tune reminder cadence with viaSport during Discovery.

**Evidence:**

- `docs/sin-rfp/review-plans/evidence/UI-AGG-004-notifications-20251228-1953.png`
- `docs/sin-rfp/review-plans/evidence/NOTIFICATIONS-DELIVERY-sin-dev-20251231.md`

## UI-AGG-005: Content Navigation and Interaction

**Requirement:**

> The system shall allow users to efficiently locate and interact with information using robust categorization, search and filtering capabilities.

**Acceptance Criteria:**

> Users can retrieve accurate results through search and filter functions.

**How We Meet It:**

- Global search and command palette support quick navigation.
- List views include filtering, sorting, and pagination.
- Data catalog and template hubs provide structured categorization.

**Built Today:**

- Command palette with actions and global search results.
- List filtering and sorting across forms, templates, and reporting.
- Data catalog and templates hub.

**Remaining Scope:**

- None. Fully implemented.

**Approach:**
Expand search datasets as viaSport priorities are defined.

**Evidence:**

- `src/features/search/components/global-search-command-palette.tsx`
- `docs/sin-rfp/review-plans/evidence/DM-AGG-003-data-catalog-20251228-1953.png`

## UI-AGG-006: User Support and Feedback Mechanism

**Requirement:**

> The system shall enable users to submit support inquiries and feedback and allow administrators to respond through a managed interface.

**Acceptance Criteria:**

> Users can submit and receive responses to inquiries within the system.

**How We Meet It:**

- Support requests are submitted in-app with category and priority.
- Admin panel manages responses and status updates.
- Users receive email and in-app updates on responses.

**Built Today:**

- Support request form with attachments and priority.
- Admin support queue with status tracking.
- Audit logging for support actions.

**Remaining Scope:**

- None. Fully implemented.

**Approach:**
Confirm SLA targets and escalation rules with viaSport.

**Evidence:**

- `docs/sin-rfp/review-plans/evidence/UI-AGG-006-support-20251228-1953.png`
- `docs/sin-rfp/review-plans/evidence/UI-AGG-006-support-admin-20251228-1953.png`

## UI-AGG-007: Consistent Visual Language and Branding

**Requirement:**

> The system shall maintain a consistent design style, color scheme, and branding across all modules.

**Acceptance Criteria:**

> All UI components follow a standardized visual style.

**How We Meet It:**

- Design system components are shared across all screens.
- Tenant branding supports logo and color configuration.
- Typography, spacing, and iconography are standardized.

**Built Today:**

- shadcn/ui component system applied across the portal.
- Tenant branding configuration available in admin settings.
- Consistent navigation and layout patterns.

**Remaining Scope:**

- viaSport branding assets and theme configuration (TBD).

**viaSport Dependencies:**

- Logo, color palette, and typography guidance.

**Approach:**
Apply viaSport branding during Discovery and validate in UAT.

**Evidence:**

- `docs/sin-rfp/review-plans/evidence/ADMIN-SIN-overview-20251228-1953.png`

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

# Cost and Value of Services

## Pricing Model Overview

Austin Wallace Tech proposes a fixed-price engagement with milestone-based payments.

| Component         | Amount   | Period   |
| ----------------- | -------- | -------- |
| Implementation    | $600,000 | One-time |
| Annual Operations | $200,000 | Per year |

**Year 1 Total:** $800,000
**Year 2 and beyond:** $200,000 per year

This pricing reflects the value delivered to viaSport, not cost-plus billing. The working prototype reduces delivery risk because viaSport can evaluate a functioning system before contract award.

## Cost Breakdown

### Implementation ($600,000)

| Phase                   | Activities                                                  |
| ----------------------- | ----------------------------------------------------------- |
| Planning and Discovery  | Requirements validation, UX interviews, migration discovery |
| Development             | viaSport configuration, branding, remaining feature work    |
| Data Migration          | Legacy extraction, mapping, validation, import              |
| User Acceptance Testing | UAT environment, test support, defect resolution            |
| Training                | viaSport admin training, train-the-trainer                  |
| PSO Rollout             | Cohort onboarding and go-live support                       |
| Production Deployment   | Monitoring setup and operational handoff                    |

All RFP requirements are included, including completion of partial items (DM-AGG-002, DM-AGG-006, RP-AGG-002).

### Annual Operations ($200,000 per year)

| Category                   | Scope                                             |
| -------------------------- | ------------------------------------------------- |
| Hosting and Infrastructure | AWS ca-central-1, database, storage, CDN, compute |
| Security                   | Monitoring, patching, quarterly reviews           |
| Maintenance                | Bug fixes, dependency updates, performance tuning |
| Support                    | Business hours support, 24 hour response standard |
| Minor Enhancements         | Small improvements within existing scope          |
| Disaster Recovery          | Backups and quarterly DR drills                   |

### Payment Schedule

| Milestone        | Percentage | Amount   | Trigger                          |
| ---------------- | ---------- | -------- | -------------------------------- |
| Contract Signing | 25%        | $150,000 | Signed agreement                 |
| UAT Sign-Off     | 25%        | $150,000 | User acceptance testing complete |
| Go-Live          | 50%        | $300,000 | Production deployment            |

Annual operations are billed quarterly in advance ($50,000 per quarter).

## Factors Affecting Timeline and Price

### Scope Changes

Changes beyond the RFP scope trigger a change order:

| Change Type                  | Process                               |
| ---------------------------- | ------------------------------------- |
| New features not in RFP      | Scope assessment and proposal         |
| Additional integrations      | Integration specification and pricing |
| Major infrastructure changes | Architecture review and options       |

### Change Management Process

1. Change request submitted
2. Impact assessment (scope, timeline, cost)
3. Proposal with options
4. Mutual agreement documented
5. Work proceeds after sign-off

### Factors That Do Not Trigger Price Adjustments

- Normal data volume growth within PostgreSQL capacity
- Standard security updates and patches
- Configuration changes within existing features

## Optional Add-Ons

### Operations Portal (Events and Team Management)

**Estimated:** $50,000 to $100,000 implementation, plus ongoing support

The Solstice platform includes an operations portal used by Quadball Canada. This could be extended to viaSport and PSOs to unify reporting and operations.

### Extended Support Coverage (24/7)

**Estimated:** $30,000 to $50,000 per year additional

Adds after-hours monitoring and response outside business hours.

## In-Kind and Value-Add Contributions

### Value-Add: Working Prototype

A functional prototype already exists:

- 20.1M rows tested with sub-250ms p95 latency
- Majority of system requirements implemented
- Available for evaluator review before contract award

### Value-Add: Source Code Access

Source code access can be provided under mutually agreed terms to support transparency and continuity.

### Pricing Philosophy

Pricing is based on the value delivered, not on hourly billing. The prototype and principal-led delivery model reduce overhead and accelerate implementation compared to traditional project structures.

# Project Plan, Timeline, and Delivery Schedule

## Timeline and Milestones

Austin Wallace Tech proposes an 18-week implementation timeline from contract signing to full rollout.

| Phase                     | Duration | Key Activities                                              | Milestone             |
| ------------------------- | -------- | ----------------------------------------------------------- | --------------------- |
| Planning and Discovery    | 2 weeks  | UX interviews, requirements refinement, migration discovery | Requirements Sign-Off |
| Development and Migration | 6 weeks  | Feature refinement, viaSport configuration, data migration  | Code Complete         |
| User Acceptance Testing   | 4 weeks  | viaSport testing, defect resolution, acceptance sign-off    | UAT Sign-Off          |
| viaSport Training         | 2 weeks  | Admin training, documentation handoff                       | Soft Launch           |
| PSO Rollout               | 4 weeks  | PSO onboarding, training, support ramp-up                   | Full Rollout          |

**Total Duration:** 18 weeks

### Why This Timeline is Achievable

The prototype already covers the majority of system requirements, so remaining work focuses on discovery, migration, and production hardening.

| Phase                       | Status           | Remaining Work                          |
| --------------------------- | ---------------- | --------------------------------------- |
| Architecture                | Complete         | None                                    |
| Authentication and Security | Complete         | Production hardening and pen test (TBD) |
| Core Features               | Largely complete | UX refinements per viaSport feedback    |
| Analytics Platform          | Complete         | Dataset tuning with viaSport            |
| Migration Tooling           | Complete         | Extraction from BCAR and BCSI           |

## Phase Details

**Planning and Discovery (Weeks 1-2)**

- Kickoff and project plan confirmation
- UX interviews with viaSport stakeholders
- Requirements validation against prototype
- Migration discovery (legacy access, schema documentation)
- Brand asset collection (logo, colors, style guidelines)

**Development and Migration (Weeks 3-8)**

- viaSport specific configuration and branding
- UX refinements based on interview findings
- Legacy data extraction and mapping
- Data migration with validation
- Production environment preparation

**User Acceptance Testing (Weeks 9-12)**

- UAT in sin-perf with production-like data
- Test scenarios mapped to requirement IDs
- Defect identification and resolution
- Performance validation and security review (final runs TBD)

**viaSport Training (Weeks 13-14)**

- Administrator training sessions
- Train-the-trainer preparation
- Documentation and runbook handoff
- Support process activation

**PSO Rollout (Weeks 15-18)**

- Cohort based PSO onboarding (cohort size TBD with viaSport)
- Live training sessions with Q and A
- Support ramp-up and monitoring
- Legacy systems archived

## Governance and Communications

### Communication Cadence

| Frequency | Participants                                | Purpose                           |
| --------- | ------------------------------------------- | --------------------------------- |
| Weekly    | Austin Wallace and viaSport Project Manager | Status updates and blockers       |
| Bi-weekly | Steering committee                          | Milestone review and escalations  |
| As needed | Technical stakeholders                      | UX reviews and migration planning |

### Reporting

viaSport will receive:

- Weekly status reports
- Milestone completion reports with sign-off
- Defect status reports during UAT
- Post-go-live support reports (monthly)

### Decision-Making

| Decision Type              | Authority                         |
| -------------------------- | --------------------------------- |
| Day-to-day implementation  | Austin Wallace                    |
| Requirements clarification | viaSport Project Manager          |
| Scope changes              | Mutual agreement via change order |
| Go-live readiness          | viaSport Project Sponsor          |

## Risks, Assumptions, and Dependencies

### Dependencies on viaSport

| Dependency         | Timing      | Impact if Delayed          |
| ------------------ | ----------- | -------------------------- |
| Legacy data access | Week 1      | Migration timeline at risk |
| Brand assets       | Week 2      | Branding work delayed      |
| SME availability   | Weeks 1-2   | UX refinements delayed     |
| UAT testers        | Weeks 9-12  | UAT duration extended      |
| PSO coordination   | Weeks 15-18 | Rollout schedule impacted  |

### Assumptions

- viaSport can provide export capability or schema documentation for BCAR and BCSI
- viaSport staff are available for interviews and reviews
- No major scope changes after requirements sign-off
- PSOs are responsive to onboarding communications

### Risk Register

| Risk                       | Likelihood | Impact | Mitigation                             |
| -------------------------- | ---------- | ------ | -------------------------------------- |
| Legacy data access delayed | Medium     | High   | Begin migration discovery in Week 1    |
| Data quality issues        | Medium     | Medium | Validation tooling and pilot migration |
| viaSport SME availability  | Low        | Medium | Schedule interviews early              |
| Scope creep                | Low        | High   | Weekly check-ins and change control    |
| PSO adoption resistance    | Low        | Medium | Train-the-trainer and PSO champions    |

## Timeline Commitment

This timeline reflects our assessment based on the existing prototype and assumed collaboration. We will identify blockers early and communicate any required adjustments.

# Appendices

## Appendix A: Live Demo Access

A working prototype is available for viaSport evaluation. Credentials are listed below to reduce reviewer friction.

**Demo URL:** TBD

### Data and Monitoring

- Synthetic data only, no confidential viaSport data
- Environment monitoring enabled

### Test Accounts

| Persona        | Email                      | Password        | Access Level                                      |
| -------------- | -------------------------- | --------------- | ------------------------------------------------- |
| viaSport Staff | viasport-staff@example.com | testpassword123 | viaSport admin with full org access (MFA enabled) |
| PSO Admin      | pso-admin@example.com      | testpassword123 | BC Hockey organization admin                      |
| Club Reporter  | club-reporter@example.com  | testpassword123 | North Shore Club reporter                         |
| Viewer         | member@example.com         | testpassword123 | View-only access                                  |

**Note:** MFA-enabled accounts use TOTP authentication. Other demo accounts have MFA disabled for faster evaluation.

### Suggested Demo Walkthrough

1. Login as viaSport Staff to see full admin capabilities
2. Explore the role-based dashboard
3. Create a test form using the form builder
4. Submit data using the form
5. View submission in the analytics platform
6. Build a pivot table and export to CSV
7. Review audit logs for recent actions
8. Explore help center and guided walkthroughs

## Appendix B: System Architecture

### High-Level Architecture

```
+---------------------------------------------------------------+
|                         AWS ca-central-1                      |
+---------------------------------------------------------------+
|                                                               |
|   +-----------+    +-----------+    +-----------+             |
|   | CloudFront| -> |  Lambda   | -> |    RDS    |             |
|   |    CDN    |    |  (App)    |    | PostgreSQL|             |
|   +-----------+    +-----------+    +-----------+             |
|        |                  |                 |                 |
|   +----+-----+      +-----+-----+     +-----+-----+           |
|   |    S3    |      |    SQS    |     |    SES    |           |
|   | Storage  |      |  Queue    |     |   Email   |           |
|   +----------+      +-----------+     +-----------+           |
|                                                               |
|   +-----------+    +------------+    +-----------+            |
|   |EventBridge|    | CloudWatch |    | GuardDuty |            |
|   | Scheduler |    | Monitoring |    |  Threat   |            |
|   +-----------+    +------------+    +-----------+            |
|                                                               |
+---------------------------------------------------------------+
```

### Technology Stack

| Layer          | Technologies                                                 |
| -------------- | ------------------------------------------------------------ |
| Frontend       | React 19, TanStack Start, TypeScript, Radix UI, Tailwind CSS |
| Backend        | TanStack Start, Node.js, Drizzle ORM                         |
| Database       | PostgreSQL on AWS RDS                                        |
| Infrastructure | SST, AWS Lambda, CloudFront                                  |
| Authentication | Better Auth with TOTP MFA                                    |
| Monitoring     | AWS CloudWatch, CloudTrail                                   |

## Appendix C: Load Test Results

Load testing was conducted in the sin-perf environment. Final validation runs will be completed before submission (TBD).

### Data Volume

| Table                    | Rows      |
| ------------------------ | --------- |
| form_submissions         | 10.0M     |
| audit_logs               | 7.0M      |
| notifications            | 2.0M      |
| bi_query_log             | 1.0M      |
| form_submission_versions | 0.1M      |
| **Total**                | **20.1M** |

### Performance Results

| Metric              | Value | Target | Status |
| ------------------- | ----- | ------ | ------ |
| p95 latency         | 250ms | <500ms | Pass   |
| p50 latency         | 130ms | N/A    | Pass   |
| Concurrent users    | 15    | N/A    | Pass   |
| Server errors (5xx) | 0     | 0      | Pass   |

### Lighthouse Scores

| Metric                   | Value  | Target  | Status |
| ------------------------ | ------ | ------- | ------ |
| Performance Score        | 93/100 | >80     | Pass   |
| Largest Contentful Paint | 2284ms | <2500ms | Pass   |
| Time to First Byte       | 380ms  | <500ms  | Pass   |
| Total Blocking Time      | 88ms   | <300ms  | Pass   |
| Cumulative Layout Shift  | 0      | <0.1    | Pass   |

## Appendix D: Security Summary

### Data Residency

All data is hosted in AWS ca-central-1 (Canada). No data is stored or processed outside Canadian jurisdiction.

### Encryption

| Scope              | Standard            |
| ------------------ | ------------------- |
| In Transit         | TLS 1.2+            |
| At Rest (Database) | AES-256 via AWS KMS |
| At Rest (Storage)  | AES-256 via AWS KMS |
| Secrets            | AWS Secrets Manager |

### Authentication

| Feature                     | Implementation                           |
| --------------------------- | ---------------------------------------- |
| Multi-Factor Authentication | TOTP with backup codes                   |
| Password Requirements       | Configurable password policy             |
| Session Management          | Secure cookies, configurable expiry      |
| Account Lockout             | Automatic after failed attempt threshold |

### Authorization

| Feature                   | Implementation                            |
| ------------------------- | ----------------------------------------- |
| Role-Based Access Control | Owner, Admin, Reporter, Viewer roles      |
| Organization Scoping      | All queries scoped to user's organization |
| Field-Level Permissions   | Sensitive fields restricted by role       |
| Step-Up Authentication    | Required for admin actions and exports    |

### Audit Trail

| Feature      | Implementation                                     |
| ------------ | -------------------------------------------------- |
| Scope        | All user actions, data changes, auth events        |
| Immutability | Append-only audit log with hash chain              |
| Retention    | Retention policies and legal holds (durations TBD) |

### Compliance

- PIPEDA aligned data handling practices
- AWS Data Processing Addendum (DPA) in place
- No sub-processors outside AWS Canada

## Appendix E: User Personas

| Persona        | Portal Access             | Key Capabilities                                    |
| -------------- | ------------------------- | --------------------------------------------------- |
| viaSport Admin | Full platform             | Admin console, cross-org analytics, user management |
| PSO Admin      | Organization-scoped       | Reporting oversight, user invitations, analytics    |
| PSO Reporter   | Organization-scoped       | Form submission, file uploads, imports              |
| Viewer         | Read-only                 | Dashboard viewing, report access                    |
| Auditor        | Admin console (read-only) | Audit log access, compliance review                 |

## Appendix F: Team Biographies

### Austin Wallace, Project Lead and Data Engineer

Austin Wallace brings 9+ years of enterprise data engineering experience combined with executive leadership in international amateur sport governance.

**Professional Experience:**

- **Clio (2024 to Present):** Data Engineer. Owns Databricks pipelines. Authored AI best practices guide.
- **New Jersey Devils, NHL (2022 to 2024):** Sole Data Developer. Built end-to-end data platform processing 10 million rows per game. Developed 40+ dbt models.
- **Teck Resources (2020 to 2022):** Data Developer. Modernized legacy systems with Terraform and Python.

**Sport Sector Experience:**

- Chair, International Quidditch Association (30+ national governing bodies)
- CEO, Volunteer Media Organization (70 staff across 30 countries)
- Creator of Qdrill, training app used by Team Canada athletes

**Education:** B.Sc., University of British Columbia, Analytical Sports Management

### Will Siddal, Senior Developer

Will Siddal brings 2+ years of full-stack development experience at Teck Resources.

**Professional Experience:**

- **Teck Resources (2022 to 2024):** Full Stack Developer. Built reporting pipelines processing billions of rows. Developed internal tools using React and TypeScript. Managed AWS infrastructure using Terraform.

**Technical Skills:** Python, React, TypeScript, AWS, Terraform, PostgreSQL, Snowflake

**Education:** Simon Fraser University. Based in British Columbia.

### Security Expert

TBD

### UX Designer

TBD

## Appendix G: Glossary

| Term | Definition                                                      |
| ---- | --------------------------------------------------------------- |
| BCAR | British Columbia Activity Records, legacy system being replaced |
| BCSI | BC Sport Intelligence, legacy system being replaced             |
| MFA  | Multi-Factor Authentication                                     |
| PSO  | Provincial Sport Organization                                   |
| RBAC | Role-Based Access Control                                       |
| RDS  | Amazon Relational Database Service                              |
| SIN  | Strength in Numbers (project name)                              |
| SST  | Serverless Stack (infrastructure as code framework)             |
| TOTP | Time-based One-Time Password                                    |
| UAT  | User Acceptance Testing                                         |

## Appendix H: Contact Information

**Primary Contact:**

Austin Wallace
Project Lead, Austin Wallace Tech
Email: TBD
Phone: TBD
Location: Victoria, British Columbia

Austin Wallace Tech welcomes the opportunity to present the prototype and discuss how Solstice can serve viaSport's Strength in Numbers initiative.
