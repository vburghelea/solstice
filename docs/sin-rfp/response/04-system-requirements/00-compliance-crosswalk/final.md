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
| DM-AGG-004 | Data Quality and Integrity            | Built   | Validation, alerting with thresholds            | Threshold tuning with viaSport          |
| DM-AGG-005 | Data Storage and Retention            | Built   | Backups, archiving, retention enforcement       | Final DR and retention validation (TBD) |
| DM-AGG-006 | Legacy Data Migration and Bulk Import | Partial | Import wizard, file imports, ECS batch worker   | Legacy extraction and mapping           |

## Reporting (RP-AGG)

| Req ID     | Title                                  | Status  | Built Today                                  | Remaining                       |
| ---------- | -------------------------------------- | ------- | -------------------------------------------- | ------------------------------- |
| RP-AGG-001 | Data Validation and Submission Rules   | Built   | Validation rules and error messaging         | None                            |
| RP-AGG-002 | Reporting Information Management       | Partial | Reporting metadata schema, delegated access  | viaSport metadata configuration |
| RP-AGG-003 | Reporting Flow and Support             | Built   | Reminders, resubmission tracking, dashboards | None                            |
| RP-AGG-004 | Reporting Configuration and Collection | Built   | Form builder, file management                | None                            |
| RP-AGG-005 | Self-Service Analytics and Data Export | Built   | Native BI, pivots, charts, export            | None                            |

## Security (SEC-AGG)

| Req ID      | Title                             | Status | Built Today                                   | Remaining                             |
| ----------- | --------------------------------- | ------ | --------------------------------------------- | ------------------------------------- |
| SEC-AGG-001 | Authentication and Access Control | Built  | MFA, RBAC, password policy, org scoping       | None                                  |
| SEC-AGG-002 | Monitoring and Threat Detection   | Built  | Redis rate limiting, pre-auth lockout, alerts | None                                  |
| SEC-AGG-003 | Privacy and Regulatory Compliance | Built  | Encryption, residency, retention controls     | Compliance package and pen test (TBD) |
| SEC-AGG-004 | Audit Trail and Data Lineage      | Built  | Immutable audit log, hash chain               | None                                  |

## Training and Onboarding (TO-AGG)

| Req ID     | Title                            | Status | Built Today                           | Remaining                  |
| ---------- | -------------------------------- | ------ | ------------------------------------- | -------------------------- |
| TO-AGG-001 | Template Support and Integration | Built  | Template hub with preview, versioning | viaSport templates         |
| TO-AGG-002 | Guided Learning and Walkthroughs | Built  | Auto-launch tours, progress tracking  | Final content review (TBD) |
| TO-AGG-003 | Reference Materials and Support  | Built  | Role-scoped help, support with SLA    | Content refinement         |

## User Interface (UI-AGG)

| Req ID     | Title                                   | Status | Built Today                               | Remaining                |
| ---------- | --------------------------------------- | ------ | ----------------------------------------- | ------------------------ |
| UI-AGG-001 | User Access and Account Control         | Built  | Login, MFA, recovery, RBAC                | None                     |
| UI-AGG-002 | Personalized Dashboard                  | Built  | Role-aware dashboards                     | None                     |
| UI-AGG-003 | Responsive and Inclusive Design         | Built  | Responsive UI, accessibility scans        | Formal audit (TBD)       |
| UI-AGG-004 | Task and Notification Management        | Built  | Notifications and reminders               | None                     |
| UI-AGG-005 | Content Navigation and Interaction      | Built  | Search, filtering, command palette        | None                     |
| UI-AGG-006 | User Support and Feedback               | Built  | Support with priority, SLA, notifications | None                     |
| UI-AGG-007 | Consistent Visual Language and Branding | Built  | Design system and theming                 | viaSport branding assets |

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
