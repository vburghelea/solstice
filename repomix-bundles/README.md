# viaSport SIN Repomix Bundles

This directory contains context bundles for implementing viaSport Strength in Numbers (SIN) requirements.

## Quick Start

Each bundle is designed to be **self-contained** with all context needed to implement its covered requirements. Run any bundle command from the project root.

```bash
# Generate all 3 bundles
./repomix-bundles/generate-all.sh

# Or generate individually (from project root)
npx repomix@latest --config repomix-bundles/bundle-1-security.json
npx repomix@latest --config repomix-bundles/bundle-2-data.json
npx repomix@latest --config repomix-bundles/bundle-3-ui-reporting.json
```

---

## Bundle Overview

| Bundle | Focus                                    | Token Est. | Requirements Covered                           |
| ------ | ---------------------------------------- | ---------- | ---------------------------------------------- |
| **1**  | Security, Auth & Access Control          | ~54k       | SEC-AGG-001-004, DM-AGG-003, UI-AGG-001        |
| **2**  | Data Collection, Forms & Validation      | ~55k       | DM-AGG-001-002, DM-AGG-004-006, RP-AGG-001     |
| **3**  | Dashboard, UI/UX, Reporting & Onboarding | ~60k       | RP-AGG-002-005, UI-AGG-002-007, TO-AGG-001-003 |

---

## Bundle 1: Security, Auth & Access Control

**File:** `bundle-1-security.xml`
**Tokens:** ~54,000

### Requirements Covered

| Req ID      | Title                            | Current Status                                |
| ----------- | -------------------------------- | --------------------------------------------- |
| SEC-AGG-001 | Authentication & Access Control  | 75% - Better Auth, OAuth, password validation |
| SEC-AGG-002 | Monitoring & Threat Detection    | 30% - Rate limiting via Pacer                 |
| SEC-AGG-003 | Privacy & Regulatory Compliance  | 50% - Secure cookies, HTTPS                   |
| SEC-AGG-004 | Audit Trail & Data Lineage       | 25% - Timestamps exist, no audit log          |
| DM-AGG-003  | Data Governance & Access Control | 70% - Role-based access, team permissions     |
| UI-AGG-001  | User Access & Account Control    | 85% - Full auth flow, profile management      |

### Key Implementation Gaps

1. **MFA** - Add TOTP/SMS second factor to Better Auth
2. **Audit Logging** - Create audit_logs table and middleware
3. **Anomaly Detection** - Track login patterns, flag suspicious activity
4. **Privacy Consent** - Add consent flows for PIPEDA compliance

---

## Bundle 2: Data Collection, Forms & Validation

**File:** `bundle-2-data.xml`
**Tokens:** ~55,000

### Requirements Covered

| Req ID     | Title                               | Current Status                           |
| ---------- | ----------------------------------- | ---------------------------------------- |
| DM-AGG-001 | Data Collection & Submission        | 40% - Forms exist, no dynamic builder    |
| DM-AGG-002 | Data Processing & Integration       | 30% - Zod schemas, no bulk import/export |
| DM-AGG-004 | Data Quality & Integrity            | 75% - Drizzle ORM, Zod validation        |
| DM-AGG-005 | Data Storage & Retention            | 80% - Neon PostgreSQL, managed backups   |
| DM-AGG-006 | Legacy Data Migration & Bulk Import | 0% - Not implemented                     |
| RP-AGG-001 | Data Validation & Submission Rules  | 80% - Zod schemas validate inputs        |

### Key Implementation Gaps

1. **Dynamic Form Builder** - Admin UI to create custom forms
2. **Bulk Import** - CSV/Excel upload with field mapping UI
3. **Data Export** - Export to CSV/Excel/JSON with field selection
4. **Migration Tooling** - Scripts for legacy data import with rollback

---

## Bundle 3: Dashboard, UI/UX, Reporting & Onboarding

**File:** `bundle-3-ui-reporting.xml`
**Tokens:** ~60,000

### Requirements Covered

| Req ID     | Title                                 | Current Status                       |
| ---------- | ------------------------------------- | ------------------------------------ |
| RP-AGG-002 | Reporting Information Management      | 35% - Events have metadata           |
| RP-AGG-003 | Reporting Flow & Support              | 40% - Dashboard exists, no reminders |
| RP-AGG-004 | Reporting Configuration & Collection  | 10% - No admin form builder          |
| RP-AGG-005 | Self-Service Analytics & Data Export  | 5% - CSV export utility exists       |
| UI-AGG-002 | Personalized Dashboard                | 70% - Role-based dashboards          |
| UI-AGG-003 | Responsive and Inclusive Design       | 80% - Tailwind, shadcn/ui            |
| UI-AGG-004 | Task & Notification Management        | 25% - Email exists, no in-app        |
| UI-AGG-005 | Content Navigation & Interaction      | 40% - Data tables, basic filtering   |
| UI-AGG-006 | User Support & Feedback Mechanism     | 0% - Not implemented                 |
| UI-AGG-007 | Consistent Visual Language & Branding | 85% - Component library              |
| TO-AGG-001 | Template Support & Integration        | 0% - Not implemented                 |
| TO-AGG-002 | Guided Learning & Walkthroughs        | 20% - Onboarding flow exists         |
| TO-AGG-003 | Reference Materials & Support         | 0% - Not implemented                 |

### Key Implementation Gaps

1. **Analytics Dashboard** - Charts, visualizations, aggregations
2. **In-App Notifications** - Real-time notification system
3. **Help Center** - FAQ, guides, contextual help
4. **Onboarding Walkthroughs** - Step-by-step tutorials
5. **Feedback System** - Support ticket submission
6. **Report Builder** - Admin-configurable reports

---

## Requirements Coverage Matrix

```
                          Bundle 1   Bundle 2   Bundle 3
                          Security   Data       UI/Report
─────────────────────────────────────────────────────────
DATA MANAGEMENT
  DM-AGG-001 Forms                      X
  DM-AGG-002 Processing                 X
  DM-AGG-003 Access Control    X
  DM-AGG-004 Quality                    X
  DM-AGG-005 Storage                    X
  DM-AGG-006 Migration                  X

REPORTING
  RP-AGG-001 Validation                 X
  RP-AGG-002 Metadata                              X
  RP-AGG-003 Flow/Dashboards                       X
  RP-AGG-004 Configuration                         X
  RP-AGG-005 Analytics                             X

SECURITY
  SEC-AGG-001 Auth             X
  SEC-AGG-002 Monitoring       X
  SEC-AGG-003 Privacy          X
  SEC-AGG-004 Audit Trail      X

TRAINING & ONBOARDING
  TO-AGG-001 Templates                             X
  TO-AGG-002 Walkthroughs                          X
  TO-AGG-003 Reference                             X

USER INTERFACE
  UI-AGG-001 Account Control   X
  UI-AGG-002 Dashboard                             X
  UI-AGG-003 Responsive                            X
  UI-AGG-004 Notifications                         X
  UI-AGG-005 Navigation                            X
  UI-AGG-006 Support                               X
  UI-AGG-007 Branding                              X
```

---

## Overall Progress Summary

| Category            | Progress | Notes                                         |
| ------------------- | -------- | --------------------------------------------- |
| Data Management     | ~50%     | Strong validation, missing bulk import/export |
| Reporting           | ~34%     | Basic dashboards, no analytics                |
| Security            | ~45%     | Auth solid, missing MFA & audit logs          |
| Training/Onboarding | ~7%      | Minimal, needs help system                    |
| User Interface      | ~64%     | Strong UI components, missing notifications   |
| **OVERALL**         | **~40%** | Solid foundation, key gaps identified         |
