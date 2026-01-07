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

Demo credentials are listed in **Appendix A: Live Demo Access** to reduce reviewer friction.

**Contact:** austin@austinwallace.tech

**Environment:** sin-uat (User Acceptance Testing environment with evaluator
access and CloudTrail monitoring). Performance testing is run in sin-perf.

**MFA:** The viaSport Staff account has MFA enabled to demonstrate the full authentication flow. Other demo accounts have MFA disabled for faster evaluation.

**Data:** Synthetic only, with environment monitoring enabled (CloudTrail with CIS Benchmark alarms).

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
8. Security Dashboard, review recent security events and account lockouts (SEC-AGG-002)
9. Privacy and Retention, view retention policies and legal hold capabilities (SEC-AGG-003)
10. Help Center, search for a topic and view contextual guidance
11. Import Wizard, upload CSV, map fields, preview validation results

## Requirement Validation Crosswalk

| To validate...                  | Requirement | Demo path                                                             |
| ------------------------------- | ----------- | --------------------------------------------------------------------- |
| Form building                   | DM-AGG-001  | Dashboard -> Forms -> Create Form                                     |
| File uploads                    | DM-AGG-001  | Form Builder -> Add File Field -> Submit                              |
| Import and rollback             | DM-AGG-006  | Dashboard -> Imports -> New Import                                    |
| Submission tracking             | RP-AGG-003  | Dashboard -> Reporting                                                |
| Self-service analytics          | RP-AGG-005  | Analytics -> New Query -> Pivot                                       |
| Export with access control      | RP-AGG-005  | Pivot -> Export -> Verify scoping                                     |
| MFA authentication              | SEC-AGG-001 | Login flow                                                            |
| Role-based access               | SEC-AGG-001 | Compare admin vs reporter dashboards                                  |
| Monitoring and threat detection | SEC-AGG-002 | Admin -> Security -> Events / Account Locks                           |
| Privacy and compliance controls | SEC-AGG-003 | Admin -> Privacy -> Retention Policies / Legal Holds, plus Appendix D |
| Audit trail                     | SEC-AGG-004 | Admin -> Audit Logs -> Filter                                         |
| Hash chain verification         | SEC-AGG-004 | Audit Logs -> Verify Integrity                                        |
| Guided walkthroughs             | TO-AGG-002  | Help -> Guided Walkthroughs                                           |
| Help center search              | TO-AGG-003  | Help -> Search                                                        |
| Support requests                | UI-AGG-006  | Help -> Support Request                                               |

Where evidence is platform-level (for example AWS compliance reports), we provide supporting artifacts through AWS Artifact and standard AWS compliance documentation upon request.

## Prototype Positioning

We built this prototype to prove feasibility and reduce delivery risk. Discovery remains mandatory to validate workflows, templates, and migration realities. The prototype is not a substitute for stakeholder alignment, it is an accelerator.
