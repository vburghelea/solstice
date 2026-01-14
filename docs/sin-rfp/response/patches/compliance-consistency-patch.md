# Compliance Story Consistency Patch

This patch creates ONE unified compliance framing and applies it consistently across all sections.

---

## Unified Compliance Framework

### Three-Tier Status Model

| Status                                           | Definition                                                                                       | Count |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------ | ----- |
| **Implemented (Demoable Now)**                   | Fully built and working in the evaluation environment                                            | 18    |
| **Implemented; Requires viaSport Configuration** | Capability is built; viaSport provides templates, labels, policies, or branding during Discovery | 6     |
| **Implemented; Requires Production Data**        | Capability is built; final mappings validated once BCAR/BCSI access is available                 | 1     |

**Total: 25 requirements addressed**

### Requirement-by-Requirement Mapping

| Req ID      | Title                              | Status                                               |
| ----------- | ---------------------------------- | ---------------------------------------------------- |
| DM-AGG-001  | Data Collection and Submission     | Implemented; Requires viaSport Configuration         |
| DM-AGG-002  | Data Processing and Integration    | Implemented (Demoable Now); external APIs post-award |
| DM-AGG-003  | Data Governance and Access Control | Implemented (Demoable Now)                           |
| DM-AGG-004  | Data Quality and Integrity         | Implemented (Demoable Now)                           |
| DM-AGG-005  | Data Storage and Retention         | Implemented; Requires viaSport Configuration         |
| DM-AGG-006  | Legacy Data Migration              | Implemented; Requires Production Data                |
| RP-AGG-001  | Data Validation Rules              | Implemented (Demoable Now)                           |
| RP-AGG-002  | Reporting Information Mgmt         | Implemented; Requires viaSport Configuration         |
| RP-AGG-003  | Reporting Flow and Support         | Implemented (Demoable Now)                           |
| RP-AGG-004  | Reporting Configuration            | Implemented (Demoable Now)                           |
| RP-AGG-005  | Analytics and Insights             | Implemented (Demoable Now)                           |
| SEC-AGG-001 | Authentication and Access          | Implemented (Demoable Now)                           |
| SEC-AGG-002 | Monitoring and Detection           | Implemented (Demoable Now)                           |
| SEC-AGG-003 | Privacy and Compliance             | Implemented (Demoable Now)                           |
| SEC-AGG-004 | Audit Trail                        | Implemented (Demoable Now)                           |
| TO-AGG-001  | Template Support                   | Implemented; Requires viaSport Configuration         |
| TO-AGG-002  | Guided Walkthroughs                | Implemented; Requires viaSport Configuration         |
| TO-AGG-003  | Reference Materials                | Implemented; Requires viaSport Configuration         |
| UI-AGG-001  | User Access Control                | Implemented (Demoable Now)                           |
| UI-AGG-002  | Personalized Dashboard             | Implemented (Demoable Now)                           |
| UI-AGG-003  | Responsive Design                  | Implemented (Demoable Now)                           |
| UI-AGG-004  | Notifications                      | Implemented (Demoable Now)                           |
| UI-AGG-005  | Navigation and Search              | Implemented (Demoable Now)                           |
| UI-AGG-006  | User Support                       | Implemented (Demoable Now)                           |
| UI-AGG-007  | Visual Branding                    | Implemented; Requires viaSport Configuration         |

---

## Patch 1: Executive Summary "At a Glance" Table

**Location:** Line ~150

**REPLACE:**

```markdown
| Requirements coverage | 25/25 requirements implemented pending finalization with viaSport | [System Requirements Compliance Matrix](#system-requirements-compliance-matrix) |
```

**WITH:**

```markdown
| Requirements coverage | 25/25 addressed: 18 demoable now, 6 require viaSport configuration, 1 requires production data | [System Requirements Compliance Matrix](#system-requirements-compliance-matrix) |
```

---

## Patch 2: Scoring Summary - Compliance Overview

**Location:** Lines ~329-338

**REPLACE entire "Compliance Overview" section:**

```markdown
## **Compliance Overview**

| Category | Total  | Fully Implemented | Finalization scope |
| :---- | :---- | :---- | :---- |
| Data Management (DM-AGG) | 6 | 6 | 0 |
| Reporting (RP-AGG) | 5 | 5 | 0 |
| Security (SEC-AGG) | 4 | 4 | 0 |
| Training and Onboarding (TO-AGG) | 3 | 2 | 1 |
| User Interface (UI-AGG) | 7 | 6 | 1 |
| **Total** | **25** | **23** | **2** |
```

**WITH:**

```markdown
## **Compliance Overview**

All 25 requirements are addressed. The table below shows readiness status by category.

| Category | Total | Demoable Now | Requires viaSport Configuration | Requires Production Data |
| :---- | :---- | :---- | :---- | :---- |
| Data Management (DM-AGG) | 6 | 3 | 2 | 1 |
| Reporting (RP-AGG) | 5 | 4 | 1 | 0 |
| Security (SEC-AGG) | 4 | 4 | 0 | 0 |
| Training and Onboarding (TO-AGG) | 3 | 0 | 3 | 0 |
| User Interface (UI-AGG) | 7 | 6 | 1 | 0 |
| **Total** | **25** | **18** | **6** | **1** |

**Status definitions:**

| Status | Meaning |
| :---- | :---- |
| Implemented (Demoable Now) | Fully built and working in the evaluation environment |
| Implemented; Requires viaSport Configuration | Capability is built; viaSport provides templates, labels, or branding during Discovery |
| Implemented; Requires Production Data | Capability is built; migration mappings finalized once BCAR/BCSI access is available |
```

---

## Patch 3: Scoring Summary - Items Requiring Finalization

**Location:** Lines ~352-361

**REPLACE entire "Items Requiring Finalization" section:**

```markdown
## **Items Requiring Finalization**

Two requirements require viaSport-specific configuration during the Discovery phase:

| Requirement | Description | Finalization Scope |
| :---- | :---- | :---- |
| TO-AGG-002 | Guided onboarding walkthrough | Content and role-specific paths defined with viaSport during Discovery |
| UI-AGG-005 | Search and filter navigation | Filter presets configured based on viaSport terminology and workflows |

All other requirements are fully met with working implementation in the evaluation environment.
```

**WITH:**

```markdown
## **Items Requiring viaSport Input**

Seven requirements need viaSport input during Discovery; one requires production data access.

### Requires viaSport Configuration (6)

| Req ID | What Is Built | What viaSport Provides |
| :---- | :---- | :---- |
| DM-AGG-001 | Form builder, file uploads, submission tracking | Form templates, field labels, validation rules |
| DM-AGG-005 | Backup infrastructure, retention enforcement | Retention durations by data type |
| RP-AGG-002 | Reporting metadata schema, delegated access | Metadata taxonomy, access policies |
| TO-AGG-001 | Template hub with preview and versioning | Template content files |
| TO-AGG-002 | Auto-launch tours, progress tracking | Walkthrough scripts, role-specific paths |
| TO-AGG-003 | Role-scoped help, support request system | Help center content, FAQ entries |
| UI-AGG-007 | Design system and theming engine | Logo, brand colors, typography |

### Requires Production Data (1)

| Req ID | What Is Built | What Is Needed |
| :---- | :---- | :---- |
| DM-AGG-006 | Smart import wizard with validation, autofix, rollback | BCAR/BCSI export access for field mapping |

### Post-Award Scope (DM-AGG-002 External APIs Only)

DM-AGG-002 core functionality (import/export, validation, audit logging) is fully implemented and demoable. External platform API integrations are scoped post-award pending viaSport identification of target systems and credentials.

**All 18 "Demoable Now" requirements can be validated in the evaluation environment today.**
```

---

## Patch 4: System Requirements Compliance Matrix - Status Legend

**Location:** Lines ~1492-1496

**REPLACE:**

```markdown
| Status | Meaning |
| :---- | :---- |
| Implemented (Demoable Now) | Platform capability is fully built and available in the evaluation environment |
| Implemented; Requires viaSport Configuration | Capability is built; final values/content (templates, labels, policies, branding) are configured with viaSport during implementation |
| Requires Production Data Confirmation | Capability is built; final migration mappings and edge cases are validated once BCAR/BCSI access is available |
| Optional / Post-Award | Not required for initial launch unless viaSport elects to scope it in |
```

**WITH:**

```markdown
| Status | Meaning |
| :---- | :---- |
| Implemented (Demoable Now) | Fully built and working in the evaluation environment |
| Implemented; Requires viaSport Configuration | Capability is built; viaSport provides templates, labels, policies, or branding during Discovery |
| Implemented; Requires Production Data | Capability is built; migration mappings validated once BCAR/BCSI access is available |

**Summary:** 18 demoable now, 6 require viaSport configuration, 1 requires production data = **25 total addressed**
```

---

## Patch 5: System Requirements Compliance Matrix - DM-AGG Table

**Location:** Lines ~1500-1507

**REPLACE:**

```markdown
| Req ID | Title | Status | Evaluation Environment (Jan 2026\) | Finalization Scope |
| :---- | :---- | :---- | :---- | :---- |
| DM-AGG-001 | Data Collection and Submission | Implemented; Requires viaSport Configuration | Form builder, file uploads, submission tracking | Load viaSport templates during discovery |
| DM-AGG-002 | Data Processing and Integration | Implemented; external integrations scoped post-award | Import and export, validation, audit logging | Optional: scope external integrations if required |
| DM-AGG-003 | Data Governance and Access Control | Implemented (Demoable Now) | RBAC, org scoping, data catalog | Finalize taxonomy with viaSport during discovery |
| DM-AGG-004 | Data Quality and Integrity | Implemented (Demoable Now) | Validation, alerting with thresholds | Configure thresholds during discovery |
| DM-AGG-005 | Data Storage and Retention | Implemented; Requires viaSport Configuration | Backups, archiving, retention enforcement | Confirm durations during discovery |
| DM-AGG-006 | Legacy Data Migration and Bulk Import | Requires Production Data Confirmation | Smart import with autofix, dynamic templates | Confirm extraction method once access granted |
```

**WITH:**

```markdown
| Req ID | Title | Status | Evaluation Environment (Jan 2026) | Finalization Scope |
| :---- | :---- | :---- | :---- | :---- |
| DM-AGG-001 | Data Collection and Submission | Implemented; Requires viaSport Configuration | Form builder, file uploads, submission tracking | viaSport templates and field definitions |
| DM-AGG-002 | Data Processing and Integration | Implemented (Demoable Now) | Import/export, validation, audit logging | External APIs scoped post-award |
| DM-AGG-003 | Data Governance and Access Control | Implemented (Demoable Now) | RBAC, org scoping, data catalog | None |
| DM-AGG-004 | Data Quality and Integrity | Implemented (Demoable Now) | Validation rules, quality alerting | None |
| DM-AGG-005 | Data Storage and Retention | Implemented; Requires viaSport Configuration | Backups, archiving, retention enforcement | Retention durations |
| DM-AGG-006 | Legacy Data Migration and Bulk Import | Implemented; Requires Production Data | Smart import wizard with autofix, rollback | BCAR/BCSI export access |
```

---

## Patch 6: System Requirements Compliance Matrix - RP-AGG Table

**Location:** Lines ~1511-1517

**REPLACE:**

```markdown
| Req ID | Title | Status | Evaluation Environment (Jan 2026\) | Finalization Scope |
| :---- | :---- | :---- | :---- | :---- |
| RP-AGG-001 | Data Validation and Submission Rules | Implemented (Demoable Now) | Validation rules and error messaging | None |
| RP-AGG-002 | Reporting Information Management | Implemented; Requires viaSport Configuration | Reporting metadata schema, delegated access | Configure metadata during discovery |
| RP-AGG-003 | Reporting Flow and Support | Implemented (Demoable Now) | Reminders, resubmission tracking, dashboards | None |
| RP-AGG-004 | Reporting Configuration and Collection | Implemented (Demoable Now) | Form builder, file management | None |
| RP-AGG-005 | Analytics and Business Insights | Implemented (Demoable Now) | Pivot builder, charts, export | None |
```

**WITH:**

```markdown
| Req ID | Title | Status | Evaluation Environment (Jan 2026) | Finalization Scope |
| :---- | :---- | :---- | :---- | :---- |
| RP-AGG-001 | Data Validation and Submission Rules | Implemented (Demoable Now) | Validation rules and error messaging | None |
| RP-AGG-002 | Reporting Information Management | Implemented; Requires viaSport Configuration | Reporting metadata schema, delegated access | Metadata taxonomy |
| RP-AGG-003 | Reporting Flow and Support | Implemented (Demoable Now) | Reminders, resubmission tracking, dashboards | None |
| RP-AGG-004 | Reporting Configuration and Collection | Implemented (Demoable Now) | Form builder, file management | None |
| RP-AGG-005 | Analytics and Business Insights | Implemented (Demoable Now) | Pivot builder, charts, export | None |
```

---

## Patch 7: System Requirements Compliance Matrix - SEC-AGG Table

**Location:** Lines ~1521-1527

**No changes required.** Current table is accurate:

```markdown
| Req ID | Title | Status | Evaluation Environment (Jan 2026) | Finalization Scope |
| :---- | :---- | :---- | :---- | :---- |
| SEC-AGG-001 | Authentication and Access Control | Implemented (Demoable Now) | MFA, RBAC, password policy, org scoping | None |
| SEC-AGG-002 | Monitoring and Threat Detection | Implemented (Demoable Now) | AWS WAF, rate limiting, pre-auth lockout, CloudTrail CIS alarms | None |
| SEC-AGG-003 | Privacy and Regulatory Compliance | Implemented (Demoable Now) | Encryption, Canadian hosting, retention controls | None |
| SEC-AGG-004 | Audit Trail and Data Lineage | Implemented (Demoable Now) | Immutable audit log, hash chain | None |
```

---

## Patch 8: System Requirements Compliance Matrix - TO-AGG Table

**Location:** Lines ~1530-1535

**REPLACE:**

```markdown
| Req ID | Title | Status | Evaluation Environment (Jan 2026\) | Finalization Scope |
| :---- | :---- | :---- | :---- | :---- |
| TO-AGG-001 | Template Support and Integration | Implemented; Requires viaSport Configuration | Template hub with preview, versioning | Load viaSport templates during discovery |
| TO-AGG-002 | Guided Learning and Walkthroughs | Implemented; Requires viaSport Configuration | Auto-launch tours, progress tracking | Final content review during discovery |
| TO-AGG-003 | Reference Materials and Support | Implemented; Requires viaSport Configuration | Role-scoped help, support with SLA | Refine content during discovery |
```

**WITH:**

```markdown
| Req ID | Title | Status | Evaluation Environment (Jan 2026) | Finalization Scope |
| :---- | :---- | :---- | :---- | :---- |
| TO-AGG-001 | Template Support and Integration | Implemented; Requires viaSport Configuration | Template hub with preview, versioning | Template files |
| TO-AGG-002 | Guided Learning and Walkthroughs | Implemented; Requires viaSport Configuration | Auto-launch tours, progress tracking | Walkthrough scripts |
| TO-AGG-003 | Reference Materials and Support | Implemented; Requires viaSport Configuration | Role-scoped help, support request system | Help center content |
```

---

## Patch 9: System Requirements Compliance Matrix - UI-AGG Table

**Location:** Lines ~1538-1547

**REPLACE:**

```markdown
| Req ID | Title | Status | Evaluation Environment (Jan 2026\) | Finalization Scope |
| :---- | :---- | :---- | :---- | :---- |
| UI-AGG-001 | User Access and Account Control | Implemented (Demoable Now) | Login, MFA, recovery, RBAC | None |
| UI-AGG-002 | Personalized Dashboard | Implemented (Demoable Now) | Role-aware dashboards | None |
| UI-AGG-003 | Responsive and Inclusive Design | Implemented (Demoable Now) | Responsive UI, accessibility scans | None |
| UI-AGG-004 | Task and Notification Management | Implemented (Demoable Now) | Notifications and reminders | None |
| UI-AGG-005 | Content Navigation and Interaction | Implemented (Demoable Now) | Search, filtering, command palette | None |
| UI-AGG-006 | User Support and Feedback | Implemented (Demoable Now) | Support with priority, SLA, notifications | None |
| UI-AGG-007 | Consistent Visual Language and Branding | Implemented; Requires viaSport Configuration | Design system and theming | Apply viaSport branding during discovery |
```

**WITH:**

```markdown
| Req ID | Title | Status | Evaluation Environment (Jan 2026) | Finalization Scope |
| :---- | :---- | :---- | :---- | :---- |
| UI-AGG-001 | User Access and Account Control | Implemented (Demoable Now) | Login, MFA, recovery, RBAC | None |
| UI-AGG-002 | Personalized Dashboard | Implemented (Demoable Now) | Role-aware dashboards | None |
| UI-AGG-003 | Responsive and Inclusive Design | Implemented (Demoable Now) | Responsive UI, accessibility compliance | None |
| UI-AGG-004 | Task and Notification Management | Implemented (Demoable Now) | Automated reminders and notifications | None |
| UI-AGG-005 | Content Navigation and Interaction | Implemented (Demoable Now) | Search, filtering, command palette | None |
| UI-AGG-006 | User Support and Feedback | Implemented (Demoable Now) | Support requests with priority and SLA | None |
| UI-AGG-007 | Consistent Visual Language and Branding | Implemented; Requires viaSport Configuration | Design system and theming engine | Logo, colors |
```

---

## Patch 10: 15-Minute Evaluator Walkthrough - Demo Validation Guide

**Location:** Lines ~287-304

**REPLACE:**

```markdown
| Req ID | Requirement Description | Validation Steps |
| :---- | :---- | :---- |
| DM-AGG-001 | Form building | Dashboard \-\> Forms \-\> Create Form |
| DM-AGG-001 | File uploads | Form Builder \-\> Add File Field \-\> Submit |
| DM-AGG-006 | Import and rollback | Dashboard \-\> Admin \-\> Imports \-\> New Import (Smart wizard) |
| RP-AGG-003 | Submission tracking | Dashboard \-\> Reporting |
| RP-AGG-005 | Self-service analytics | Analytics \-\> New Query \-\> Pivot |
| RP-AGG-005 | Export with access control | Pivot \-\> Export \-\> Verify scoping |
| SEC-AGG-001 | MFA authentication | Settings → Security → Enable MFA |
| SEC-AGG-001 | Role-based access | Compare admin vs reporter dashboards |
| SEC-AGG-002 | Monitoring and threat detection | Admin \-\> Security \-\> Events / Account Locks |
| SEC-AGG-003 | Privacy and compliance controls | Admin \-\> Privacy \-\> Retention Policies / Legal Holds, plus Appendix D |
| SEC-AGG-004 | Audit trail | Admin \-\> Audit Logs \-\> Filter |
| SEC-AGG-004 | Hash chain verification | Audit Logs \-\> Verify Integrity |
| TO-AGG-002 | Guided walkthroughs | Help \-\> Guided Walkthroughs |
| TO-AGG-003 | Help center search | Help \-\> Search |
| UI-AGG-006 | Support requests | Help \-\> Support Request |
```

**WITH:**

```markdown
| Req ID | What to Validate | Status | Validation Steps |
| :---- | :---- | :---- | :---- |
| DM-AGG-001 | Form building | Requires Configuration | Dashboard -> Forms -> Create Form |
| DM-AGG-001 | File uploads | Requires Configuration | Form Builder -> Add File Field -> Submit |
| DM-AGG-002 | Import/export and validation | Demoable Now | Admin -> Imports -> New Import |
| DM-AGG-006 | Import wizard and rollback | Requires Production Data | Admin -> Imports -> New Import (wizard) |
| RP-AGG-003 | Submission tracking | Demoable Now | Dashboard -> Reporting |
| RP-AGG-005 | Self-service analytics | Demoable Now | Analytics -> New Query -> Pivot |
| RP-AGG-005 | Export with access control | Demoable Now | Pivot -> Export -> Verify scoping |
| SEC-AGG-001 | MFA authentication | Demoable Now | Settings -> Security -> Enable MFA |
| SEC-AGG-001 | Role-based access | Demoable Now | Compare admin vs reporter dashboards |
| SEC-AGG-002 | Monitoring and detection | Demoable Now | Admin -> Security -> Events / Account Locks |
| SEC-AGG-003 | Privacy and compliance | Demoable Now | Admin -> Privacy -> Retention / Legal Holds |
| SEC-AGG-004 | Audit trail and integrity | Demoable Now | Admin -> Audit Logs -> Filter -> Verify |
| TO-AGG-002 | Guided walkthroughs | Requires Configuration | Help -> Guided Walkthroughs |
| TO-AGG-003 | Help center search | Requires Configuration | Help -> Search |
| UI-AGG-006 | Support requests | Demoable Now | Help -> Support Request |
```

---

## Patch 11: Compliance Matrix Summary Section

**Location:** Lines ~1548-1552

**REPLACE:**

```markdown
## **Summary**

All 25 requirements are addressed with working implementations in the evaluation environment. Requirements marked "Requires viaSport Configuration" have full platform capability built; only content and configuration await viaSport input during Discovery.
```

**WITH:**

```markdown
## **Summary**

| Category | Count | Meaning |
| :---- | :---- | :---- |
| Implemented (Demoable Now) | 18 | Validate in evaluation environment today |
| Implemented; Requires viaSport Configuration | 6 | Capability built; viaSport provides templates, labels, or branding during Discovery |
| Implemented; Requires Production Data | 1 | Import wizard built; field mappings finalized once BCAR/BCSI access granted |
| **Total** | **25** | **All requirements addressed** |

All 25 requirements have working code. The 7 items requiring input are configuration and content, not development work.
```

---

## Application Checklist

| Patch | Section                                        | Change Type     |
| ----- | ---------------------------------------------- | --------------- |
| 1     | Executive Summary "At a Glance"                | Update row      |
| 2     | Scoring Summary - Compliance Overview          | Replace table   |
| 3     | Scoring Summary - Items Requiring Finalization | Replace section |
| 4     | Compliance Matrix - Status Legend              | Replace legend  |
| 5     | Compliance Matrix - DM-AGG table               | Replace table   |
| 6     | Compliance Matrix - RP-AGG table               | Replace table   |
| 7     | Compliance Matrix - SEC-AGG table              | No change       |
| 8     | Compliance Matrix - TO-AGG table               | Replace table   |
| 9     | Compliance Matrix - UI-AGG table               | Replace table   |
| 10    | 15-Minute Walkthrough - Demo Validation Guide  | Replace table   |
| 11    | Compliance Matrix - Summary                    | Replace section |

**Apply in order 1-11 for consistency.**

---

## Before/After Summary

| Metric                      | Before                  | After                                          |
| --------------------------- | ----------------------- | ---------------------------------------------- |
| Claimed "Fully Implemented" | 23                      | 18 (Demoable Now)                              |
| Claimed "Finalization"      | 2                       | 6 (Requires Configuration) + 1 (Requires Data) |
| DM-AGG-002 status           | "Optional / Post-Award" | "Demoable Now" (external APIs post-award)      |
| Internal consistency        | 3 conflicting claims    | 1 unified framework                            |

---

_Generated 2026-01-14_
