# System Requirements: Reporting (RP-AGG)

## Compliance Summary

| Req ID     | Title                                | Status | Implementation                                                    |
| ---------- | ------------------------------------ | ------ | ----------------------------------------------------------------- |
| RP-AGG-001 | Data Validation & Submission Rules   | Comply | Form and file validation with error messaging                     |
| RP-AGG-002 | Reporting Information Management     | Comply | Organization metadata, contacts, fiscal periods, delegated access |
| RP-AGG-003 | Reporting Flow & Support             | Comply | Automated reminders, resubmission tracking, dashboards            |
| RP-AGG-004 | Reporting Configuration & Collection | Comply | Form builder, file management, admin configuration                |
| RP-AGG-005 | Self-Service Analytics & Data Export | Comply | Native BI platform with pivots, charts, export                    |

## RP-AGG-001: Data Validation & Submission Rules

**Requirement:** The system shall validate submissions to ensure they are complete, clean, use the correct file types, and contain valid data fields such as dates and contact information.

**Implementation:**

| Capability              | Description                                                                               |
| ----------------------- | ----------------------------------------------------------------------------------------- |
| Completeness Validation | Required field enforcement; submissions cannot be finalized with missing required data    |
| Format Validation       | Date formats, email addresses, phone numbers, and postal codes validated against patterns |
| File Type Validation    | Uploaded files validated against allowed MIME types; configurable per form                |
| Error Messaging         | Clear, actionable error messages displayed inline; users can correct and resubmit         |
| Server-Side Enforcement | All validation rules enforced on the server to prevent bypassing client-side checks       |

**Evidence:** Validation active on all forms in prototype; rejected submissions display specific error messages.

## RP-AGG-002: Reporting Information Management

**Requirement:** The system shall manage metadata related to reporting including but not limited to contribution agreements, NCCP, contact details, fiscal periods, organization profiles, and delegated access rights.

**Implementation:**

| Capability            | Description                                                                                                             |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Organization Profiles | Each organization has a profile with name, address, contact details, and classification                                 |
| Fiscal Periods        | Configurable fiscal year settings per organization; reporting periods aligned to fiscal calendar                        |
| Contact Management    | Primary and secondary contacts stored per organization; contacts linked to user accounts                                |
| Delegated Access      | Owners can delegate reporter or viewer access to other users within their organization                                  |
| Metadata Extensions   | Custom metadata fields can be added via form builder for contribution agreements, NCCP, and other program-specific data |

**Note:** Specific metadata fields for contribution agreements and NCCP will be configured during the Planning phase based on viaSport's data dictionary.

## RP-AGG-003: Reporting Flow & Support

**Requirement:** The system shall support automated reporting reminders, allow users to track data resubmissions, and visualize submitted data through dashboards.

**Implementation:**

| Capability            | Description                                                                                     |
| --------------------- | ----------------------------------------------------------------------------------------------- |
| Automated Reminders   | Scheduled notifications for upcoming deadlines; configurable lead times (7 days, 3 days, 1 day) |
| Resubmission Tracking | Full history of submissions per form; users can view previous versions and track changes        |
| Status Dashboards     | Role-based dashboards showing submission status, pending actions, and overdue items             |
| Email Delivery        | Notifications delivered via AWS SES; delivery verified December 2025                            |
| In-App Notifications  | Real-time notification feed within the platform; unread count displayed in navigation           |

**Evidence:** Email delivery tested December 31, 2025; scheduled notification processed and delivered successfully.

## RP-AGG-004: Reporting Configuration & Collection

**Requirement:** The system shall allow system administrators to configure customizable reporting forms, define required fields, display files for users to read, edit, delete, and download.

**Implementation:**

| Capability      | Description                                                                                          |
| --------------- | ---------------------------------------------------------------------------------------------------- |
| Form Builder    | Administrators can create and modify forms without code changes; drag-and-drop field ordering        |
| Required Fields | Per-field required flag; validation enforced on submission                                           |
| File Display    | Uploaded files displayed with filename, size, and upload date; preview available for supported types |
| File Operations | Users can read, download, and delete their own files; administrators can manage all files            |
| Form Versioning | Forms are versioned; existing submissions retain their original form version                         |

**Evidence:** Form builder functional in prototype; administrators can create forms and configure field requirements.

## RP-AGG-005: Self-Service Analytics & Data Export

**Requirement:** Enable authorized users to build ad-hoc charts, pivot tables, and export raw or aggregated datasets in CSV, Excel, or JSON (optional) without developer intervention.

**Implementation:**

| Capability     | Description                                                                               |
| -------------- | ----------------------------------------------------------------------------------------- |
| Pivot Builder  | Drag-and-drop dimensions and measures; users can create custom pivot tables               |
| Chart Builder  | Bar, line, pie, and other chart types via ECharts; interactive visualization              |
| Export Formats | CSV, Excel (XLSX), and JSON export; exports respect field-level access rules              |
| Access Control | Every query automatically scoped to user's organization; field-level permissions enforced |
| Audit Trail    | All queries and exports logged with user ID, timestamp, and parameters                    |

**Key Differentiator: Native BI Platform**

Rather than integrating a third-party analytics tool such as Metabase or Superset, we built analytics directly into the platform. This approach was chosen after evaluating external tools against viaSport's governance requirements:

| Requirement             | External Tools                          | Native BI                           |
| ----------------------- | --------------------------------------- | ----------------------------------- |
| Tenancy Enforcement     | Requires custom RLS/views per tenant    | Built into query layer              |
| Field-Level Access      | Complex configuration, often bypassed   | Enforced at query time              |
| Audit Logging           | Limited or paid-tier only               | Full integration with audit chain   |
| Canadian Data Residency | Extra configuration for build pipelines | Guaranteed (ca-central-1)           |
| Export Controls         | Often disabled or hard to audit         | Audited with step-up authentication |

This native approach ensures every query respects tenancy boundaries, every export is audited, and every field-level permission is enforced without the complexity and security gaps of integrating external tools.

**Evidence:** BI platform functional in prototype; users can build pivot tables and export data with access controls enforced.
