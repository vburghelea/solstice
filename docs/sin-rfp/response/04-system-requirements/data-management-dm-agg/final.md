# System Requirements: Data Management (DM-AGG)

## Compliance Summary

| Req ID     | Title                               | Status | Implementation                                                |
| ---------- | ----------------------------------- | ------ | ------------------------------------------------------------- |
| DM-AGG-001 | Data Collection & Submission        | Comply | Form builder, file uploads, submission tracking               |
| DM-AGG-002 | Data Processing & Integration       | Comply | Format standardization, transformation logging, import/export |
| DM-AGG-003 | Data Governance & Access Control    | Comply | RBAC with org-scoped access, database admin tools             |
| DM-AGG-004 | Data Quality & Integrity            | Comply | Validation rules, automated quality monitoring                |
| DM-AGG-005 | Data Storage & Retention            | Comply | AWS RDS with backups, S3 archival, configurable retention     |
| DM-AGG-006 | Legacy Data Migration & Bulk Import | Comply | Import wizard with mapping, validation, rollback              |

## DM-AGG-001: Data Collection & Submission

**Requirement:** The system shall enable customizable form building, support flexible data entry through variable formats (forms, file uploads), with capabilities for real-time submission tracking, editing, and historical data migration.

**Implementation:**

| Capability           | Description                                                                                                      |
| -------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Form Builder         | Drag-and-drop form creation with field types including text, number, date, select, multi-select, and file upload |
| File Uploads         | Secure file upload with type validation and size limits; stored in S3 with encryption at rest                    |
| Submission Tracking  | Real-time status tracking (draft, submitted, under review, approved, changes requested)                          |
| Edit History         | Full version history with change attribution; users can view and restore previous versions                       |
| Historical Migration | Import wizard supports bulk loading of historical data with field mapping                                        |

**Evidence:** Form submission workflow tested in prototype; submission states visible on user dashboard.

## DM-AGG-002: Data Processing & Integration

**Requirement:** The system shall enable standardization of data formatting, logging of transformation processes, and integration with external platforms through API (optional), and data import/export mechanisms.

**Implementation:**

| Capability             | Description                                                                                          |
| ---------------------- | ---------------------------------------------------------------------------------------------------- |
| Format Standardization | Automatic normalization of dates, phone numbers, postal codes during import                          |
| Transformation Logging | All data transformations recorded in audit log with before/after values                              |
| Import Mechanisms      | CSV and Excel import with configurable field mapping, preview, and rollback                          |
| Export Mechanisms      | CSV, Excel, and JSON export with field-level access control enforcement                              |
| API Integration        | REST API available for future integrations; external platform connections to be scoped with viaSport |

**Note:** External API integrations (such as connections to third-party systems) will be defined collaboratively with viaSport during the Planning phase based on specific integration requirements.

## DM-AGG-003: Data Governance & Access Control

**Requirement:** The system shall enforce role-based access to data and provide administrators with secure database access, along with data cataloging and indexing capabilities for discoverability.

**Implementation:**

| Capability                | Description                                                                                                       |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Role-Based Access Control | Predefined roles (owner, admin, reporter, viewer) with configurable permissions                                   |
| Organization Scoping      | All data queries automatically scoped to user's organization; cross-org access requires explicit admin privileges |
| Field-Level Permissions   | Sensitive fields can be restricted by role; PII visibility controlled at the field level                          |
| Admin Database Access     | Authorized administrators can access database through secure, audited connections                                 |
| Data Cataloging           | Searchable metadata for forms, submissions, and reports; full-text search across platform                         |

**Evidence:** Role-based dashboards show different content by user role; access control tested via property-based tests.

## DM-AGG-004: Data Quality & Integrity

**Requirement:** The system shall ensure relational integrity and continuously monitor data quality using validation rules and automated checks.

**Implementation:**

| Capability              | Description                                                                                               |
| ----------------------- | --------------------------------------------------------------------------------------------------------- |
| Relational Integrity    | Foreign key constraints enforced at the database level; Drizzle ORM ensures type-safe queries             |
| Form Validation         | Client-side and server-side validation with Zod schemas; required fields, format checks, and custom rules |
| Import Validation       | Row-level validation during import with detailed error reporting; invalid rows logged for review          |
| Data Quality Monitoring | Scheduled cron job (daily) analyzes data quality metrics; results visible on admin dashboard              |
| Automated Alerts        | Notifications sent when data quality thresholds are exceeded                                              |

**Evidence:** Validation rules active on all forms; import wizard displays validation errors before commit.

## DM-AGG-005: Data Storage & Retention

**Requirement:** The system shall support regular backups, disaster recovery mechanisms, data archiving, and secure cloud hosting aligned with retention policies.

**Implementation:**

| Capability         | Description                                                                             |
| ------------------ | --------------------------------------------------------------------------------------- |
| Cloud Hosting      | AWS RDS PostgreSQL in ca-central-1 (Montreal) for Canadian data residency               |
| Backups            | Continuous point-in-time recovery with 35-day backup retention                          |
| Disaster Recovery  | Multi-AZ deployment with automatic failover; RPO 1 hour, RTO 4 hours (tested quarterly) |
| Data Archiving     | Audit logs archived to S3 Glacier Deep Archive after 90 days; retained for 7 years      |
| Retention Policies | Configurable retention periods by data type; automated purging per policy               |

**Evidence:** Disaster recovery drill completed December 2025; restore verified within RTO target.

## DM-AGG-006: Legacy Data Migration & Bulk Import

**Requirement:** The system shall provide tooling and configurable mapping templates to import historical data from CSV/Excel, legacy databases, or APIs, including validation, error-handling, and rollback.

**Implementation:**

| Capability        | Description                                                                                             |
| ----------------- | ------------------------------------------------------------------------------------------------------- |
| Import Wizard     | Step-by-step interface for file upload, field mapping, validation preview, and commit                   |
| Mapping Templates | Reusable templates for common import formats; viaSport-specific templates to be created during Planning |
| Validation        | Row-level validation with detailed error reporting; records can be corrected and re-imported            |
| Error Handling    | Failed rows logged to S3 with error type and suggested resolution; successful rows committed            |
| Rollback          | All imported records tagged with job ID; entire import can be rolled back if issues discovered          |
| Batch Processing  | Large imports processed via AWS ECS Fargate (2 vCPU, 4 GB RAM) with checkpointing for resumability      |

**Note:** Migration methodology will be finalized collaboratively with viaSport based on BCAR/BCSI export capabilities. The import infrastructure is production-ready; extraction approach depends on legacy system access.

**Evidence:** Import wizard functional in prototype; tested with multi-million row datasets.
