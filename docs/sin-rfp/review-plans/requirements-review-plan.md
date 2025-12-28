# Systematic Requirements Review Plan - SIN RFP

## Overview

This plan outlines a methodology for systematically reviewing implemented capabilities against the 25 requirements in the SIN RFP (`system-requirements-addendum.md`).

### Goals

1. **Pre-demo validation** - Confirm key features work before stakeholder demos
2. **Compliance audit** - Document evidence trail for formal RFP response
3. **Gap prioritization** - Identify missing items to prioritize Streams L & M

### Parameters

- **Environment:** sin-dev (viaSport) only
- **Depth:** Acceptance criteria verification (not edge case testing)
- **Evidence:** Screenshots, code references, test coverage

### Output

- **Requirements Verification Report**: `docs/sin-rfp/requirements-verification-report.md`

### Entry Criteria

- Requirements addendum and coverage matrix are up to date and agreed
- sin-dev has seeded data and test users for required roles
- Reviewers have access (standard + admin) and MFA configured
- Evidence storage location is ready (screenshots, logs, notes)

### Exit Criteria

- All 25 requirements have status, evidence, and notes in the report
- Gaps logged with priority/owner in the consolidated backlog
- Stakeholder sign-off recorded (date + initials)

### Evidence Standards

- Screenshot naming: `<REQID>-<step>-YYYYMMDD-HHMM.png`
- Code references include file path + line number
- Tests linked by file name or run output

---

## 1. Requirements Summary (25 Total)

### Data Management (6)

| ID         | Title                               | Current Status |
| ---------- | ----------------------------------- | -------------- |
| DM-AGG-001 | Data Collection & Submission        | Partial        |
| DM-AGG-002 | Data Processing & Integration       | Partial        |
| DM-AGG-003 | Data Governance & Access Control    | Partial        |
| DM-AGG-004 | Data Quality & Integrity            | Partial        |
| DM-AGG-005 | Data Storage & Retention            | Partial        |
| DM-AGG-006 | Legacy Data Migration & Bulk Import | Partial        |

### Reporting (5)

| ID         | Title                                | Current Status |
| ---------- | ------------------------------------ | -------------- |
| RP-AGG-001 | Data Validation & Submission Rules   | Partial        |
| RP-AGG-002 | Reporting Information Management     | Partial        |
| RP-AGG-003 | Reporting Flow & Support             | Implemented    |
| RP-AGG-004 | Reporting Configuration & Collection | Partial        |
| RP-AGG-005 | Self-Service Analytics & Data Export | Partial        |

### Security (4)

| ID          | Title                           | Current Status |
| ----------- | ------------------------------- | -------------- |
| SEC-AGG-001 | Authentication & Access Control | Implemented    |
| SEC-AGG-002 | Monitoring & Threat Detection   | Implemented    |
| SEC-AGG-003 | Privacy & Regulatory Compliance | Partial        |
| SEC-AGG-004 | Audit Trail & Data Lineage      | Implemented    |

### Training & Onboarding (3)

| ID         | Title                          | Current Status |
| ---------- | ------------------------------ | -------------- |
| TO-AGG-001 | Template Support & Integration | Planned        |
| TO-AGG-002 | Guided Learning & Walkthroughs | Planned        |
| TO-AGG-003 | Reference Materials & Support  | Planned        |

### User Interface (7)

| ID         | Title                                 | Current Status |
| ---------- | ------------------------------------- | -------------- |
| UI-AGG-001 | User Access & Account Control         | Implemented    |
| UI-AGG-002 | Personalized Dashboard                | Partial        |
| UI-AGG-003 | Responsive and Inclusive Design       | Partial        |
| UI-AGG-004 | Task & Notification Management        | Implemented    |
| UI-AGG-005 | Content Navigation & Interaction      | Partial        |
| UI-AGG-006 | User Support & Feedback Mechanism     | Planned        |
| UI-AGG-007 | Consistent Visual Language & Branding | Implemented    |

Note: "Current Status" is provisional and must be confirmed during review.

---

## 2. Review Methodology

### Per-Requirement Verification Process

For each requirement:

```
1. READ REQUIREMENT
   - Review description and acceptance criteria from system-requirements-addendum.md

2. TRACE TO CODE
   - Identify implementing modules (from requirements-coverage-matrix.md)
   - Read key source files to understand implementation

3. VERIFY FUNCTIONALITY
   - Use Playwright MCP to test the feature in sin-dev
   - Walk through the acceptance criteria manually
   - Document any gaps or deviations

4. CHECK TEST COVERAGE
   - Identify existing tests (unit, integration, E2E)
   - Note missing test coverage

5. VALIDATE DOCUMENTATION
   - Verify evidence in worklogs and implementation docs
   - Check for audit trail documentation

6. RATE COMPLIANCE
   - Full: 100% meets acceptance criteria
   - Partial: Core functionality works, gaps exist
   - Minimal: Basic implementation, significant gaps
   - None: Not implemented

7. DOCUMENT FINDINGS
   - Record in verification report
   - Note action items for gaps

8. LOG ISSUES
   - Create backlog items with severity and owner
   - Link evidence and reproduction steps
   - Track in `docs/sin-rfp/5.2-pro-review-output/consolidated-backlog.md`
```

### Severity Guide

- **P0 Critical**: Blocks core requirement or compliance claim
- **P1 Major**: Significant gap with workaround or partial coverage
- **P2 Minor**: Cosmetic or low-risk deviation
- **P3 Enhancement**: Nice-to-have outside acceptance criteria

---

## 3. Review Categories

### Category A: Implemented Requirements (7)

**Focus:** Verify claimed functionality actually works

| Requirement | Key Test                                    |
| ----------- | ------------------------------------------- |
| SEC-AGG-001 | Login with MFA, role-based access           |
| SEC-AGG-002 | Trigger suspicious activity detection       |
| SEC-AGG-004 | Verify audit log immutability               |
| UI-AGG-001  | Account creation, recovery, role management |
| UI-AGG-004  | Notification delivery and preferences       |
| UI-AGG-007  | Tenant branding consistency                 |
| RP-AGG-003  | Reporting reminders and dashboard           |

### Category B: Partial Requirements (14)

**Focus:** Identify specific gaps and prioritize fixes

| Requirement | Known Gaps                        |
| ----------- | --------------------------------- |
| DM-AGG-001  | File upload array handling        |
| DM-AGG-002  | ECS batch worker infrastructure   |
| DM-AGG-003  | Data catalog, member directory    |
| DM-AGG-004  | Data quality monitoring dashboard |
| DM-AGG-005  | Object Lock, Glacier archival     |
| DM-AGG-006  | Batch job monitoring              |
| RP-AGG-001  | File field import blocking        |
| RP-AGG-002  | Null-org task visibility          |
| RP-AGG-004  | Multi-file upload, template hub   |
| RP-AGG-005  | Full pivot builder, charts        |
| SEC-AGG-003 | Legal holds UI, DSAR retention    |
| UI-AGG-002  | Analytics cards, quality widgets  |
| UI-AGG-003  | Accessibility testing             |
| UI-AGG-005  | Help center integration           |

### Category C: Planned Requirements (4)

**Focus:** Confirm scope and prioritize for Stream M

| Requirement | Stream M Item           |
| ----------- | ----------------------- |
| TO-AGG-001  | M1: Template Hub        |
| TO-AGG-002  | M2: Guided Walkthroughs |
| TO-AGG-003  | M3: Help Center         |
| UI-AGG-006  | M4: Support Requests    |

---

## 4. Verification Checklist

### Data Management Requirements

#### DM-AGG-001: Data Collection & Submission

- [ ] **Forms:** Create form with multiple field types
- [ ] **File Upload:** Upload file via form
- [ ] **Submission Tracking:** View submission status
- [ ] **Edit Submissions:** Modify existing submission
- [ ] **Historical Data:** Import via wizard
- [ ] **Acceptance:** "Users and System Admin can successfully submit, track, and edit data"

#### DM-AGG-002: Data Processing & Integration

- [ ] **Standardization:** Data formats normalized on import
- [ ] **Logging:** Transformation processes logged
- [ ] **Export:** Data exportable in multiple formats
- [ ] **Acceptance:** "Incoming data is processed uniformly, logged for traceability"

#### DM-AGG-003: Data Governance & Access Control

- [ ] **RBAC:** Role-based access enforced
- [ ] **Database Access:** Admins can query data
- [ ] **Catalog:** Data cataloging available (PLANNED)
- [ ] **Acceptance:** "Users can only access data based on permission"

#### DM-AGG-004: Data Quality & Integrity

- [ ] **Relational Integrity:** Foreign keys enforced
- [ ] **Validation Rules:** Client and server validation
- [ ] **Quality Monitoring:** Automated checks (PLANNED)
- [ ] **Acceptance:** "Submitted data meets validation rules"

#### DM-AGG-005: Data Storage & Retention

- [ ] **Backups:** Regular backups configured
- [ ] **DR:** Disaster recovery plan documented
- [ ] **Archiving:** Retention policies enforced
- [ ] **Cloud Hosting:** Secure hosting (ca-central-1)
- [ ] **Acceptance:** "Data is backed up, archived as scheduled"

#### DM-AGG-006: Legacy Data Migration & Bulk Import

- [ ] **Mapping Templates:** Field mapping UI works
- [ ] **Validation:** Import validation catches errors
- [ ] **Rollback:** Failed imports can be rolled back
- [ ] **Audit Logs:** Import logs stored
- [ ] **Acceptance:** "Administrators can map, preview, and execute import"

### Reporting Requirements

#### RP-AGG-001: Data Validation & Submission Rules

- [ ] **Completeness:** Incomplete submissions rejected
- [ ] **File Types:** Invalid types rejected
- [ ] **Field Validation:** Dates, emails validated
- [ ] **Error Messages:** Clear rejection messages
- [ ] **Acceptance:** "Submissions that fail validation are rejected with error messages"

#### RP-AGG-002: Reporting Information Management

- [ ] **Metadata:** Org profiles manageable
- [ ] **Fiscal Periods:** Configurable periods
- [ ] **Delegated Access:** Access delegation works
- [ ] **Acceptance:** "Users can update metadata and access reporting"

#### RP-AGG-003: Reporting Flow & Support

- [ ] **Reminders:** Automated reminders sent
- [ ] **Resubmissions:** Track resubmission history
- [ ] **Dashboard:** Data visualized in dashboard
- [ ] **Acceptance:** "Users are reminded, track changes, view in dashboard"

#### RP-AGG-004: Reporting Configuration & Collection

- [ ] **Form Builder:** Admins can build forms
- [ ] **Required Fields:** Field requirements configurable
- [ ] **File Display:** Uploaded files viewable
- [ ] **CRUD:** Edit, delete, download files
- [ ] **Acceptance:** "System admin can configure reporting forms"

#### RP-AGG-005: Self-Service Analytics & Data Export

- [ ] **Charts:** Build ad-hoc charts
- [ ] **Pivot Tables:** Create pivot views
- [ ] **Export CSV:** Export to CSV works
- [ ] **Export XLSX:** Export to Excel works
- [ ] **Access Rules:** Field-level access respected
- [ ] **Acceptance:** "User builds chart and exports to CSV"

### Security Requirements

#### SEC-AGG-001: Authentication & Access Control

- [ ] **MFA:** Multi-factor authentication works
- [ ] **Password Recovery:** Secure recovery flow
- [ ] **Role-Based Access:** Roles restrict access
- [ ] **Org Management:** Leaders manage members
- [ ] **Acceptance:** "Users log in securely; only authorized individuals access"

#### SEC-AGG-002: Monitoring & Threat Detection

- [ ] **Suspicious Activity:** Anomalies detected
- [ ] **Account Locking:** Auto-lock on failures
- [ ] **Logging:** Events logged
- [ ] **Acceptance:** "Anomalies flagged and result in safeguards"

#### SEC-AGG-003: Privacy & Regulatory Compliance

- [ ] **PIPEDA Compliance:** Data handling compliant
- [ ] **Encryption:** Sensitive data encrypted
- [ ] **Secure Storage:** Data stored securely
- [ ] **Acceptance:** "All sensitive data is encrypted and stored securely"

#### SEC-AGG-004: Audit Trail & Data Lineage

- [ ] **Immutable Logs:** Audit log is tamper-evident
- [ ] **User Actions:** Actions logged
- [ ] **Data Changes:** Changes tracked
- [ ] **Export:** Logs exportable
- [ ] **Acceptance:** "Auditors can filter and export logs; hashing verifies integrity"

### Training & Onboarding Requirements

#### TO-AGG-001: Template Support & Integration

- [ ] **Templates Tab:** Centralized templates (PLANNED)
- [ ] **Contextual Access:** Templates from data entry (PLANNED)
- [ ] **Acceptance:** "Users can locate and access correct template"

#### TO-AGG-002: Guided Learning & Walkthroughs

- [ ] **Onboarding Tutorial:** First-time user guide (PLANNED)
- [ ] **Data Upload Tutorial:** Upload walkthrough (PLANNED)
- [ ] **Acceptance:** "Users complete tasks with walkthrough support"

#### TO-AGG-003: Reference Materials & Support

- [ ] **Guides:** Categorized help guides (PLANNED)
- [ ] **FAQ:** Frequently asked questions (PLANNED)
- [ ] **Acceptance:** "Users find answers without direct support"

### User Interface Requirements

#### UI-AGG-001: User Access & Account Control

- [ ] **Login/Logout:** Secure session management
- [ ] **Registration:** Individual and org registration
- [ ] **Account Recovery:** Password reset works
- [ ] **Admin Management:** Admin can manage accounts
- [ ] **Acceptance:** "Users and admin can perform account tasks securely"

#### UI-AGG-002: Personalized Dashboard

- [ ] **Role-Based Views:** Different roles see different data
- [ ] **Relevant Data:** Dashboard shows role-appropriate info
- [ ] **Actions:** Quick actions available
- [ ] **Progress:** Reporting progress visible
- [ ] **Acceptance:** "Users view personalized dashboards based on role"

#### UI-AGG-003: Responsive and Inclusive Design

- [ ] **Responsive:** Works on all device sizes
- [ ] **Screen Reader:** Compatible with screen readers
- [ ] **Color Contrast:** Meets WCAG AA
- [ ] **Acceptance:** "Functional on all devices and meets accessibility"

#### UI-AGG-004: Task & Notification Management

- [ ] **Automated Notifications:** System sends alerts
- [ ] **Customizable:** Notification preferences
- [ ] **Email Delivery:** Email notifications work
- [ ] **In-App:** Platform notifications visible
- [ ] **Acceptance:** "Users receive timely notifications and reminders"

#### UI-AGG-005: Content Navigation & Interaction

- [ ] **Search:** Search functionality works
- [ ] **Filtering:** Filter options available
- [ ] **Categorization:** Content organized
- [ ] **Acceptance:** "Users retrieve results through search and filter"

#### UI-AGG-006: User Support & Feedback Mechanism

- [ ] **Support Submission:** Users can submit inquiries (PLANNED)
- [ ] **Admin Response:** Admins can respond (PLANNED)
- [ ] **Acceptance:** "Users submit and receive responses within system"

#### UI-AGG-007: Consistent Visual Language & Branding

- [ ] **Design Style:** Consistent across modules
- [ ] **Color Scheme:** Brand colors used
- [ ] **Tenant Branding:** Per-tenant customization
- [ ] **Acceptance:** "All UI follows standardized visual style"

---

## 5. Execution Plan

### Phase 1: Implemented Requirements (Day 1)

Review the 7 "Implemented" requirements to confirm they work:

1. SEC-AGG-001, SEC-AGG-002, SEC-AGG-004 (Security)
2. UI-AGG-001, UI-AGG-004, UI-AGG-007 (UI)
3. RP-AGG-003 (Reporting)

### Phase 2: Partial Requirements - High Priority (Days 2-3)

Deep-dive into 6 critical partial requirements:

1. DM-AGG-001 (Forms/Submissions)
2. DM-AGG-006 (Data Migration)
3. RP-AGG-005 (Analytics/Export)
4. SEC-AGG-003 (Privacy)
5. UI-AGG-002 (Dashboard)
6. UI-AGG-003 (Accessibility)

### Phase 3: Partial Requirements - Lower Priority (Day 4)

Review remaining 8 partial requirements:

1. DM-AGG-002, DM-AGG-003, DM-AGG-004, DM-AGG-005
2. RP-AGG-001, RP-AGG-002, RP-AGG-004
3. UI-AGG-005

### Phase 4: Planned Requirements (Day 5)

Document scope for Stream M requirements:

1. TO-AGG-001, TO-AGG-002, TO-AGG-003
2. UI-AGG-006

### Phase 5: Report Generation (Day 5)

- Compile all findings
- Create gap analysis summary
- Prioritize action items
- Generate final verification report

---

## 6. Tools and Techniques

### Code Review

- Read implementing modules identified in coverage matrix
- Trace acceptance criteria to specific functions
- Check for edge cases and error handling

### Playwright MCP Testing

- Navigate to each feature in sin-dev
- Execute acceptance criteria steps
- Capture screenshots as evidence
- Check console for errors

### Test Coverage Analysis

- Review existing tests for each requirement
- Note missing test scenarios
- Flag untested acceptance criteria

### Documentation Audit

- Verify worklogs contain implementation evidence
- Check for ADR decisions impacting requirements
- Confirm audit trail exists for compliance

---

## 7. Key Files Reference

**Requirements Sources:**

- `docs/sin-rfp/system-requirements-addendum.md`
- `docs/sin-rfp/viasport-sin-rfp.md`

**Tracking Documents:**

- `docs/sin-rfp/requirements-coverage-matrix.md`
- `docs/sin-rfp/5.2-pro-review-output/consolidated-backlog.md`

**Implementation Evidence:**

- `docs/sin-rfp/worklogs/stream-*.md`
- `docs/sin-rfp/decisions/ADR-*.md`

**Code Modules by Category:**

- **Data Management:** `src/features/forms`, `src/features/imports`, `src/features/reports`
- **Reporting:** `src/features/reporting`, `src/features/reports`
- **Security:** `src/lib/auth`, `src/lib/security`, `src/lib/audit`, `src/features/privacy`
- **UI:** `src/routes/dashboard`, `src/features/layouts`, `src/components/ui`

---

## 8. Report Template

```markdown
# Requirements Verification Report - SIN RFP

**Date:** YYYY-MM-DD
**Environment:** sin-dev
**Reviewer:** [name]

## Executive Summary

- Requirements Verified: X/25
- Full Compliance: X
- Partial Compliance: X
- Not Implemented: X

## Detailed Findings

### [Requirement ID]: [Title]

**Status:** Full | Partial | Minimal | None
**Acceptance Criteria:** [quoted from requirements]

**Verification Results:**

- [x] Criterion 1: [result]
- [ ] Criterion 2: [gap description]

**Evidence:**

- Code: `src/features/X/Y.ts:123`
- Test: `e2e/tests/X.spec.ts`
- Screenshot: [link]

**Gaps:**

1. [gap description]
2. [gap description]

**Recommendations:**

1. [action item]

---

[Repeat for each requirement]

## Gap Summary

| Priority | Requirement | Gap | Effort |
| -------- | ----------- | --- | ------ |
| P0       | X           | Y   | Z      |

## Action Items

1. [item]
2. [item]
```
