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

**MFA:** The viaSport Staff account has MFA enabled to demonstrate the full authentication flow. Other demo accounts have MFA disabled for faster evaluation.

**Data:** Synthetic only, with environment monitoring enabled (CloudTrail with CIS Benchmark alarms).

## Prototype Placeholders and Items to Be Finalized Post-Award

The prototype is fully functional for the workflows listed in the Requirements Compliance Crosswalk. The following items are content placeholders that will be finalized with viaSport during Discovery (needs assessment/gap analysis):

- Form labels and field names are representative placeholders and will be aligned to viaSport terminology during Discovery
- Sample templates are illustrative; viaSport's reporting templates will be configured during Discovery
- Help-center content will be refined during Discovery based on needs assessment and user research
- Logo and color scheme are placeholders; viaSport branding assets will be applied during Discovery

## 15-Minute Evaluator Walkthrough

This optional walkthrough is provided to help evaluators validate key workflows quickly and consistently.

1. Login and MFA, authenticate with email/password and complete TOTP
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
| MFA authentication              | SEC-AGG-001 | Login flow                                                                |
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

What changes because the baseline exists: discovery and UAT start from functioning software, enabling faster alignment, better feedback, and fewer surprises during rollout. Project effort is intentionally spent on adoption, reliability, and migration accuracy—rather than rebuilding foundational features.

---
