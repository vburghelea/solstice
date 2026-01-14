# System Requirements Compliance Crosswalk

This table summarizes compliance status for all 25 requirements. Detailed implementation notes follow in subsequent sections.

## Status Legend

| Status                                           | Meaning                                                                                                                              |
| :----------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------- |
| **Implemented (Demoable Now)**                   | Platform capability is fully built and available in the evaluation environment                                                       |
| **Implemented; Requires viaSport Configuration** | Capability is built; final values/content (templates, labels, policies, branding) are configured with viaSport during implementation |
| **Requires Production Data Confirmation**        | Capability is built; final migration mappings and edge cases are validated once BCAR/BCSI access is available                        |
| **Optional / Post-Award**                        | Not required for initial launch unless viaSport elects to scope it in                                                                |

## Data Management (DM-AGG)

| Req ID     | Title                                 | Status                                       | Evaluation Environment (Jan 2026)               | Finalization Scope                                |
| :--------- | :------------------------------------ | :------------------------------------------- | :---------------------------------------------- | :------------------------------------------------ |
| DM-AGG-001 | Data Collection and Submission        | Implemented; Requires viaSport Configuration | Form builder, file uploads, submission tracking | Load viaSport templates during discovery          |
| DM-AGG-002 | Data Processing and Integration       | Optional / Post-Award                        | Import and export, validation, audit logging    | Optional: scope external integrations if required |
| DM-AGG-003 | Data Governance and Access Control    | Implemented (Demoable Now)                   | RBAC, org scoping, data catalog                 | Finalize taxonomy with viaSport during discovery  |
| DM-AGG-004 | Data Quality and Integrity            | Implemented (Demoable Now)                   | Validation, alerting with thresholds            | Configure thresholds during discovery             |
| DM-AGG-005 | Data Storage and Retention            | Implemented; Requires viaSport Configuration | Backups, archiving, retention enforcement       | Confirm durations during discovery                |
| DM-AGG-006 | Legacy Data Migration and Bulk Import | Requires Production Data Confirmation        | Smart import with autofix, dynamic templates    | Confirm extraction method once access granted     |

## Reporting (RP-AGG)

| Req ID     | Title                                  | Status                                       | Evaluation Environment (Jan 2026)            | Finalization Scope                  |
| :--------- | :------------------------------------- | :------------------------------------------- | :------------------------------------------- | :---------------------------------- |
| RP-AGG-001 | Data Validation and Submission Rules   | Implemented (Demoable Now)                   | Validation rules and error messaging         | None                                |
| RP-AGG-002 | Reporting Information Management       | Implemented; Requires viaSport Configuration | Reporting metadata schema, delegated access  | Configure metadata during discovery |
| RP-AGG-003 | Reporting Flow and Support             | Implemented (Demoable Now)                   | Reminders, resubmission tracking, dashboards | None                                |
| RP-AGG-004 | Reporting Configuration and Collection | Implemented (Demoable Now)                   | Form builder, file management                | None                                |
| RP-AGG-005 | Self-Service Analytics and Data Export | Implemented (Demoable Now)                   | Native BI, pivots, charts, export            | None                                |

## Security (SEC-AGG)

| Req ID      | Title                             | Status                     | Evaluation Environment (Jan 2026)                               | Finalization Scope |
| :---------- | :-------------------------------- | :------------------------- | :-------------------------------------------------------------- | :----------------- |
| SEC-AGG-001 | Authentication and Access Control | Implemented (Demoable Now) | MFA, RBAC, password policy, org scoping                         | None               |
| SEC-AGG-002 | Monitoring and Threat Detection   | Implemented (Demoable Now) | AWS WAF, rate limiting, pre-auth lockout, CloudTrail CIS alarms | None               |
| SEC-AGG-003 | Privacy and Regulatory Compliance | Implemented (Demoable Now) | Encryption, Canadian hosting, retention controls                | None               |
| SEC-AGG-004 | Audit Trail and Data Lineage      | Implemented (Demoable Now) | Immutable audit log, hash chain                                 | None               |

## Training and Onboarding (TO-AGG)

| Req ID     | Title                            | Status                                       | Evaluation Environment (Jan 2026)     | Finalization Scope                       |
| :--------- | :------------------------------- | :------------------------------------------- | :------------------------------------ | :--------------------------------------- |
| TO-AGG-001 | Template Support and Integration | Implemented; Requires viaSport Configuration | Template hub with preview, versioning | Load viaSport templates during discovery |
| TO-AGG-002 | Guided Learning and Walkthroughs | Implemented; Requires viaSport Configuration | Auto-launch tours, progress tracking  | Final content review during discovery    |
| TO-AGG-003 | Reference Materials and Support  | Implemented; Requires viaSport Configuration | Role-scoped help, support with SLA    | Refine content during discovery          |

## User Interface (UI-AGG)

| Req ID     | Title                                   | Status                                       | Evaluation Environment (Jan 2026)         | Finalization Scope                       |
| :--------- | :-------------------------------------- | :------------------------------------------- | :---------------------------------------- | :--------------------------------------- |
| UI-AGG-001 | User Access and Account Control         | Implemented (Demoable Now)                   | Login, MFA, recovery, RBAC                | None                                     |
| UI-AGG-002 | Personalized Dashboard                  | Implemented (Demoable Now)                   | Role-aware dashboards                     | None                                     |
| UI-AGG-003 | Responsive and Inclusive Design         | Implemented (Demoable Now)                   | Responsive UI, accessibility scans        | None                                     |
| UI-AGG-004 | Task and Notification Management        | Implemented (Demoable Now)                   | Notifications and reminders               | None                                     |
| UI-AGG-005 | Content Navigation and Interaction      | Implemented (Demoable Now)                   | Search, filtering, command palette        | None                                     |
| UI-AGG-006 | User Support and Feedback               | Implemented (Demoable Now)                   | Support with priority, SLA, notifications | None                                     |
| UI-AGG-007 | Consistent Visual Language and Branding | Implemented; Requires viaSport Configuration | Design system and theming                 | Apply viaSport branding during discovery |

## Summary

| Category                | Total  | Implemented |
| :---------------------- | :----- | :---------- |
| Data Management         | 6      | 6           |
| Reporting               | 5      | 5           |
| Security                | 4      | 4           |
| Training and Onboarding | 3      | 3           |
| User Interface          | 7      | 7           |
| **Total**               | **25** | **25**      |

All 25 requirements are implemented. Finalization scope items (viaSport-specific configuration, templates, branding) are completed during discovery and implementation.

---
