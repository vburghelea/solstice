# RFP Response Restructure Plan

This document defines the structure, patterns, and actionable steps to finalize the viaSport SIN RFP response.

---

## Goals

1. **Make compliance obvious** — Evaluators can quickly confirm we meet each requirement
2. **Make prototype advantage unmissable** — "Built Today" is prominent in every requirement
3. **Eliminate redundancy** — Service Approach = methodology; System Requirements = compliance
4. **Be honest about gaps** — Clear "Remaining Scope" and "viaSport Dependencies" for every requirement
5. **Professional polish** — Keep "TBD" placeholders intentionally for the next couple of days, then replace before submission; include demo credentials with clear data provenance

---

## Source Documents

The response addresses two viaSport documents:

| Document                                            | Purpose                                    | Our Response          |
| --------------------------------------------------- | ------------------------------------------ | --------------------- |
| `VIASPORT-PROVIDED-viasport-sin-rfp.md`             | RFP structure, evaluation criteria         | Sections 01-04, 06-09 |
| `VIASPORT-PROVIDED-system-requirements-addendum.md` | 25 specific requirements (DM/RP/SEC/TO/UI) | Section 05            |

---

## Final Document Structure

The structure mirrors the RFP and Addendum exactly. Two new sections to be added.

```
01-executive-summary/final.md           # ≤3 pages, includes at-a-glance panel

    # NEW: Insert prototype evaluation guide after executive summary
    01-B-prototype-evaluation-guide/final.md  # NEW - 1-2 pages, the "bridge" section

02-vendor-fit/final.md                  # Company profile, team, continuity plan

03-service-approach/                    # ~18 pages total — mirrors RFP "Service Approach" (6 items)
    data-submission-reporting/final.md  # RFP item 1: UX strategy, tech stack
    data-warehousing/final.md           # RFP item 2: Hosting, tenancy, backup, encryption
    data-migration/final.md             # RFP item 3: Methodology, mapping, validation, rollback
    platform-design/final.md            # RFP item 4: Cloud services, dev workflow
    testing-qa/final.md                 # RFP item 5: QA approach, UAT strategy
    training-onboarding/final.md        # RFP item 6: Audiences, delivery, help desk

04-system-requirements/                 # ~35 pages total — mirrors Addendum (5 sections, 25 reqs)
    00-compliance-crosswalk/final.md    # NEW - Master compliance table (1 page)
    data-management-dm-agg/final.md     # DM-AGG-001 through DM-AGG-006 (6 requirements)
    reporting-rp-agg/final.md           # RP-AGG-001 through RP-AGG-005 (5 requirements)
    security-sec-agg/final.md           # SEC-AGG-001 through SEC-AGG-004 (4 requirements)
    training-onboarding-to-agg/final.md # TO-AGG-001 through TO-AGG-003 (3 requirements)
    user-interface-ui-agg/final.md      # UI-AGG-001 through UI-AGG-007 (7 requirements)

05-capabilities-experience/final.md     # Case studies, team, AI approach
06-cost-value/final.md                  # Pricing, breakdown, change management
07-delivery-schedule/final.md           # Timeline, milestones, risks
08-appendices/final.md                  # Demo access, architecture, load tests, security
```

### Why This Structure

| Section                | Source Document                           | Purpose                                         |
| ---------------------- | ----------------------------------------- | ----------------------------------------------- |
| 03 Service Approach    | RFP "Service Approach and Responsiveness" | Answer the 6 methodology questions              |
| 04 System Requirements | System Requirements Addendum              | Demonstrate compliance with all 25 requirements |

This 1:1 mapping means evaluators can find our response to any RFP item or Addendum requirement without hunting.

---

## Detailed RFP → Response Mapping

### RFP "Service Approach and Responsiveness" Sub-Questions

Each RFP item has specific sub-questions. Section 03 files must address these explicitly.

| RFP Item                                       | Sub-Question                                               | Our Response File                       | Notes                                      |
| ---------------------------------------------- | ---------------------------------------------------------- | --------------------------------------- | ------------------------------------------ |
| **2.1 Data Submission & Reporting Web Portal** |                                                            | `03/data-submission-reporting/final.md` |                                            |
|                                                | (a) UX Strategy and approach                               | ✓                                       | User research, accessibility, mobile-first |
|                                                | (b) Tech stack and benefits                                | ✓                                       | React, TanStack, shadcn/ui justification   |
| **2.2 Data Warehousing**                       |                                                            | `03/data-warehousing/final.md`          |                                            |
|                                                | (a) Hosting, tenancy, data residency, regulatory alignment | ✓                                       | AWS ca-central-1, org isolation, PIPEDA    |
|                                                | (b) Backup, recovery, encryption standards                 | ✓                                       | RDS snapshots, S3 Object Lock, AES-256     |
| **2.3 Data Migration**                         |                                                            | `03/data-migration/final.md`            |                                            |
|                                                | (a) Methodology: mapping, cleansing, validation, rollback  | ✓                                       | Phased approach, import wizard             |
|                                                | (b) Audit trail and success process                        | ✓                                       | Import logs, job-level tracking            |
|                                                | (c) Data quality targets and defect-handling               | ✓                                       | Acceptance criteria, error handling        |
| **2.4 Platform Design and Customization**      |                                                            | `03/platform-design/final.md`           |                                            |
|                                                | (a) Cloud provider services                                | ✓                                       | AWS service inventory                      |
|                                                | (b) Dev → Test → Prod workflow                             | ✓                                       | CI/CD, environment promotion               |
| **2.5 Testing and Quality Assurance**          |                                                            | `03/testing-qa/final.md`                |                                            |
|                                                | (a) QA approach (performance, security)                    | ✓                                       | Load testing, security scanning            |
|                                                | (b) UAT strategy                                           | ✓                                       | Acceptance criteria, user groups           |
| **2.6 Training and Onboarding**                |                                                            | `03/training-onboarding/final.md`       |                                            |
|                                                | (a) Audience-based approach and delivery                   | ✓                                       | PSO admins, reporters, viaSport staff      |
|                                                | (b) Resources and sample materials                         | ✓                                       | Help center, tutorials                     |
|                                                | (c) Help desk and ticketing model                          | ✓                                       | Support request system, SLAs               |

### System Requirements Addendum → Section 04 Mapping

| Addendum Section          | Requirements                    | Our Response File                        |
| ------------------------- | ------------------------------- | ---------------------------------------- |
| 2.1 Data Management       | DM-AGG-001 through DM-AGG-006   | `04/data-management-dm-agg/final.md`     |
| 2.2 Reporting             | RP-AGG-001 through RP-AGG-005   | `04/reporting-rp-agg/final.md`           |
| 2.3 Security              | SEC-AGG-001 through SEC-AGG-004 | `04/security-sec-agg/final.md`           |
| 2.4 Training & Onboarding | TO-AGG-001 through TO-AGG-003   | `04/training-onboarding-to-agg/final.md` |
| 2.5 User Interface        | UI-AGG-001 through UI-AGG-007   | `04/user-interface-ui-agg/final.md`      |

### Cross-Section References

To avoid duplication while maintaining compliance, use these cross-reference patterns:

**From Section 03 → Section 04:**

> "See Section 04 DM-AGG-006 for detailed import wizard capabilities and built-today status."

**From Section 04 → Section 03:**

> "See Section 03 Data Migration for phased methodology and rollback procedures."

**From Section 04 → Appendix:**

> "See Appendix C for load test results demonstrating sub-250ms p95 latency."

---

## New Sections to Create

### 02-prototype-evaluation-guide.md

This is the "bridge" that makes the prototype strategy feel intentional. Place it early so evaluators understand how to use the prototype for validation.

```markdown
# Prototype Evaluation Guide

## Purpose

This prototype exists to de-risk delivery and demonstrate requirement alignment
before contract award. viaSport can evaluate a working system, not a proposal.

## Data Provenance

**No viaSport confidential data was used.** Performance testing used synthetic
data designed to match the scale characteristics described in the RFP:

| Table | Rows | Purpose |
|-------|------|---------|
| form_submissions | 10.0M | Simulates 10+ years of PSO submissions |
| audit_logs | 7.0M | Realistic audit trail volume |
| notifications | 2.0M | Email/in-app notification history |
| bi_query_log | 1.0M | Analytics query patterns |
| **Total** | **20.1M** | Matches RFP "20+ million rows" context |

## What's Production-Ready Today

- Authentication with TOTP MFA and backup codes
- Role-based access control (owner, admin, reporter, viewer)
- Organization-scoped data isolation
- Tamper-evident audit log with hash chain verification
- Form builder with 8 field types including file uploads
- Submission tracking with version history
- Native BI platform (pivot tables, charts, export)
- Import wizard with field mapping, preview, rollback
- S3 storage with Object Lock for immutability
- Automated data retention and archival
- Help center with searchable guides and FAQ
- Support request system with priority and SLA tracking

## What Will Be Finalized With viaSport

| Item | Timing | Dependency |
|------|--------|------------|
| BCAR/BCSI extraction method | Discovery (Weeks 1-2) | Legacy system access |
| Form templates and reporting metadata | Discovery (Weeks 1-2) | viaSport data dictionary |
| Branding (logo, colors) | Development (Week 3) | Brand assets from viaSport |
| Program-specific fields (NCCP, contribution agreements) | Development (Weeks 3-8) | viaSport SME input |
| Independent penetration test | Pre-UAT (Week 8) | Security specialist |

## Demo Access

Demo credentials are included in the response to reduce reviewer friction.

**To request access:** Contact Austin Wallace at [email]

**Environment:** sin-perf (performance testing environment with production-like data)

**MFA:** The viaSport Staff account has MFA enabled to demonstrate the full
authentication flow. Other demo accounts have MFA disabled for faster evaluation.

**Data:** Synthetic only, with monitoring enabled.

## What to Ignore in the Prototype

Some elements are placeholder and will be replaced with viaSport-approved
content during Discovery:

- Form labels and field names (will match viaSport terminology)
- Sample templates (will be replaced with viaSport reporting templates)
- Help center content (will be refined per UX interviews)
- Logo and color scheme (will apply viaSport branding assets)

## 15-Minute Demo Script

1. **Login & MFA** — Authenticate with email/password, complete TOTP challenge
2. **Dashboard** — Observe role-based content (admin vs reporter view)
3. **Form Builder** — Create a test form with required fields and file upload
4. **Submit Data** — Complete and submit the form, observe status tracking
5. **Version History** — Edit submission, view change history with attribution
6. **Analytics** — Navigate to BI, build pivot table, export to CSV
7. **Audit Logs** — Review recent actions, verify hash chain integrity
8. **Help Center** — Search for a topic, view contextual guidance
9. **Import Wizard** — Upload CSV, map fields, preview validation results

## Requirement Validation Crosswalk

| To validate... | Requirement | Demo path |
|----------------|-------------|-----------|
| Form building | DM-AGG-001 | Dashboard → Forms → Create Form |
| File uploads | DM-AGG-001 | Form Builder → Add File Field → Submit |
| Import/rollback | DM-AGG-006 | Dashboard → Imports → New Import |
| Submission tracking | RP-AGG-003 | Dashboard → My Submissions |
| Self-service analytics | RP-AGG-005 | Analytics → New Query → Pivot |
| Export with access control | RP-AGG-005 | Pivot → Export → Verify scoping |
| MFA authentication | SEC-AGG-001 | Login flow |
| Role-based access | SEC-AGG-001 | Compare admin vs reporter dashboards |
| Audit trail | SEC-AGG-004 | Admin → Audit Logs → Filter |
| Hash chain verification | SEC-AGG-004 | Audit Logs → Verify Integrity |
| Guided walkthroughs | TO-AGG-002 | Help → Start Tour |
| Help center search | TO-AGG-003 | Help → Search |
| Support requests | UI-AGG-006 | Help → Submit Request |

## Prototype Positioning

> We built this prototype to prove feasibility and de-risk delivery. We still
> treat Discovery as mandatory to validate workflows, templates, and migration
> realities. The prototype is not a substitute for stakeholder alignment—it's
> an accelerator.
```

---

### 05/00-compliance-crosswalk.md

One-page master table for quick compliance verification.

```markdown
# System Requirements Compliance Crosswalk

This table summarizes compliance status for all 25 requirements. Detailed
implementation notes follow in subsequent sections.

## Status Legend

Use words rather than emojis for consistent PDF rendering:

| Status | Meaning |
|--------|---------|
| **Built** | Functional in production environment, verified |
| **Partial** | Core functionality built, specific items remaining |
| **Depends** | Requires viaSport input to complete |

## Data Management (DM-AGG)

| Req ID | Title | Status | Built Today | Remaining |
|--------|-------|--------|-------------|-----------|
| DM-AGG-001 | Data Collection & Submission | Built | Form builder, file uploads, submission tracking, version history | viaSport-specific templates |
| DM-AGG-002 | Data Processing & Integration | Partial | Import/export, basic normalization, audit logging | External API integrations (scope with viaSport) |
| DM-AGG-003 | Data Governance & Access Control | Built | RBAC, org scoping, field-level permissions | Data catalog indexing configuration |
| DM-AGG-004 | Data Quality & Integrity | Built | Validation rules, quality monitoring, automated alerts | Per-org threshold configuration |
| DM-AGG-005 | Data Storage & Retention | Built | Multi-AZ RDS, 35-day backups, S3 Object Lock, retention automation | — |
| DM-AGG-006 | Legacy Data Migration | Partial | Import wizard, batch processing, rollback | BCAR/BCSI extraction (Depends on legacy access) |

## Reporting (RP-AGG)

| Req ID | Title | Status | Built Today | Remaining |
|--------|-------|--------|-------------|-----------|
| RP-AGG-001 | Data Validation & Submission Rules | Built | Client/server validation, file type checks, error messaging | — |
| RP-AGG-002 | Reporting Information Management | Partial | Org profiles, fiscal periods, delegated access | NCCP/contribution fields (Depends on viaSport) |
| RP-AGG-003 | Reporting Flow & Support | Built | Automated reminders, resubmission tracking, dashboards | — |
| RP-AGG-004 | Reporting Configuration & Collection | Built | Form builder, required fields, file management | — |
| RP-AGG-005 | Self-Service Analytics & Data Export | Built | Native BI, pivots, charts, CSV/Excel/JSON export | — |

## Security (SEC-AGG)

| Req ID | Title | Status | Built Today | Remaining |
|--------|-------|--------|-------------|-----------|
| SEC-AGG-001 | Authentication & Access Control | Built | MFA (TOTP), password policy, RBAC, org scoping, step-up auth | — |
| SEC-AGG-002 | Monitoring & Threat Detection | Built | Anomaly detection, account lockout, security alerts | — |
| SEC-AGG-003 | Privacy & Regulatory Compliance | Built | Canadian data residency, encryption (rest/transit), S3 Object Lock, retention automation | — |
| SEC-AGG-004 | Audit Trail & Data Lineage | Built | Immutable audit log, hash chain, filtering, 7-year retention | — |

## Training & Onboarding (TO-AGG)

| Req ID | Title | Status | Built Today | Remaining |
|--------|-------|--------|-------------|-----------|
| TO-AGG-001 | Template Support & Integration | Built | Templates hub, contextual access, preview/download | viaSport-specific templates |
| TO-AGG-002 | Guided Learning & Walkthroughs | Built | Onboarding tour, step-by-step tutorials, progress tracking | Content refinement per UX interviews |
| TO-AGG-003 | Reference Materials & Support | Built | Help center, FAQ, role-based content, support requests with SLA | — |

## User Interface (UI-AGG)

| Req ID | Title | Status | Built Today | Remaining |
|--------|-------|--------|-------------|-----------|
| UI-AGG-001 | User Access & Account Control | Built | Login/MFA, registration, recovery, admin management | — |
| UI-AGG-002 | Personalized Dashboard | Built | Role-aware dashboards, quick actions | — |
| UI-AGG-003 | Responsive & Inclusive Design | Built | Mobile-responsive, Radix UI (accessible), WCAG-aligned | Formal accessibility audit |
| UI-AGG-004 | Task & Notification Management | Built | Automated notifications, email delivery, task reminders | — |
| UI-AGG-005 | Content Navigation & Interaction | Built | Command palette, search, filtering, pagination | — |
| UI-AGG-006 | User Support & Feedback | Built | Support request form, status tracking, admin interface, SLA | — |
| UI-AGG-007 | Consistent Visual Language | Built | Design system (shadcn/ui), tenant branding config | viaSport branding assets |

## Summary

| Category | Total | Built | Partial |
|----------|-------|-------|---------|
| Data Management | 6 | 4 | 2 |
| Reporting | 5 | 4 | 1 |
| Security | 4 | 4 | 0 |
| Training & Onboarding | 3 | 3 | 0 |
| User Interface | 7 | 7 | 0 |
| **Total** | **25** | **22** | **3** |

All 25 requirements have implementations. Three have "Partial" status
indicating viaSport dependencies or scope to be determined.
```

---

## Per-Requirement Block Pattern

Every requirement in Section 04 follows this structure:

```markdown
### XX-AGG-NNN: Title

**Requirement:**
> Quoted verbatim from the System Requirements Addendum.

**Acceptance Criteria:**
> Quoted verbatim from the System Requirements Addendum.

**How We Meet It:**
- 1–3 bullets that explicitly address the acceptance criteria
- Maps directly to what evaluators are checking

**Built Today:**
- Bullet points describing what exists in the prototype
- Be specific: "8 field types" not "multiple field types"
- Include technical details where relevant

**Remaining Scope:**
- What's left to build (be honest)
- Or "None — fully implemented" if complete

**viaSport Dependencies:**
- What we need from viaSport to complete this
- Or omit section if no dependencies

**Approach:**
Brief description of how remaining scope will be addressed. Cross-reference
Section 03 methodology where applicable.

**Evidence:**
- Demo path: Dashboard → Forms → Create Form
- Appendix reference: See Appendix C for load test results
```

### Example Block

```markdown
### DM-AGG-006: Legacy Data Migration & Bulk Import

**Requirement:**
> The system shall provide tooling and configurable mapping templates to import
> historical data from CSV/Excel, legacy databases, or APIs, including validation,
> error-handling, and rollback.

**Acceptance Criteria:**
> Administrators can map legacy fields to system fields, preview results, and
> execute import; import logs stored for audit.

**How We Meet It:**
- Administrators access import wizard with field mapping interface
- Preview shows mapped data before commit; validation errors highlighted
- Import job ID tracked in audit log with complete lineage

**Built Today:**
- Import wizard with step-by-step interface (upload → map → preview → commit)
- CSV and Excel parsing with automatic type detection
- Field mapping with reusable templates
- Row-level validation with detailed error reporting
- Failed rows logged to S3 with error type and source data
- Job-wide rollback within 7-day window via import_job_id tagging
- Batch processing via AWS ECS Fargate (2 vCPU, 4 GB RAM)
- Checkpointed processing for resumability on large imports
- File field imports with JSON payloads (storageKey/signedUrl)

**Remaining Scope:**
- BCAR/BCSI extraction method (depends on legacy system capabilities)
- Organization and user import pipelines (form submissions only today)
- Phone/postal format normalization beyond basic type parsing

**viaSport Dependencies:**
- Legacy system export capability or direct database access
- Schema documentation for BCAR/BCSI field mapping
- SME availability for field mapping review and approval

**Approach:**
Extraction method will be determined during Discovery (Weeks 1-2) based on
legacy system capabilities. See Section 03 Data Migration for phased
approach, validation strategy, and rollback procedures.

**Evidence:**
- Demo: Dashboard → Imports → New Import → Upload CSV
- Tested with multi-million row datasets in sin-perf environment
- ECS task deployed and verified operational
```

---

## Section 03: Service Approach (Methodology Focus)

Section 03 answers the RFP's "Service Approach and Responsiveness" questions. Each file maps 1:1 to an RFP item for easy evaluation.

### File Structure (Mirrors RFP Section 2.1-2.6)

| File                                 | RFP Item                                   | Content Focus                                                     |
| ------------------------------------ | ------------------------------------------ | ----------------------------------------------------------------- |
| `data-submission-reporting/final.md` | 2.1 Data Submission & Reporting Web Portal | UX strategy, tech stack (React, TanStack), user flows             |
| `data-warehousing/final.md`          | 2.2 Data Warehousing                       | AWS hosting, tenancy, data residency, backup/recovery, encryption |
| `data-migration/final.md`            | 2.3 Data Migration                         | Phased methodology, mapping, validation, rollback, audit trail    |
| `platform-design/final.md`           | 2.4 Platform Design and Customization      | Cloud services, dev workflow, environments, CI/CD                 |
| `testing-qa/final.md`                | 2.5 Testing and Quality Assurance          | QA layers, UAT strategy, defect management, acceptance criteria   |
| `training-onboarding/final.md`       | 2.6 Training and Onboarding                | Audiences, delivery model, help desk, SLAs                        |

### Content Guidelines

- **Length:** ~3 pages per file, ~18 pages total
- **Focus:** Process, philosophy, approach — "how we work"
- **Cross-references:** "See Section 04 DM-AGG-006 for import wizard capabilities"
- **No per-requirement detail:** That belongs in Section 04
- **Answer RFP sub-questions:** Each RFP item has lettered sub-questions (a, b, c) — address each explicitly

---

## Updates to Existing Sections

### 01-executive-summary.md

Add "At-a-Glance" panel near the top:

```markdown
## At a Glance

| Dimension | Status |
|-----------|--------|
| **Prototype** | Working system available for evaluation |
| **Requirements** | 22 of 25 fully built; 3 partial (viaSport-dependent) |
| **Data Used** | Synthetic only — no viaSport data |
| **Performance** | 20.1M rows, sub-250ms p95 latency, zero errors |
| **Security** | MFA, RBAC, audit chain, S3 Object Lock, Canadian data residency |
| **Timeline** | 30 weeks from contract to full rollout |
| **Investment** | $600K implementation + $200K/year operations |
```

Add data provenance statement:

```markdown
**Data Provenance:** The prototype was built using synthetic test data designed
to match viaSport's scale characteristics. No viaSport confidential data was
accessed or used in development or testing.
```

---

### 09-appendices.md

Update Appendix A (Demo Access):

```markdown
## Appendix A: Demo Access

### Access Process

Demo access is provided via secure channel upon request. To protect the
evaluation environment:

1. Contact Austin Wallace to request demo credentials (if needed)
2. Demo credentials are listed in the response to reduce reviewer friction
3. Demo data is synthetic only, with monitoring enabled

### Test Personas Available

| Persona | Role | Access Level |
|---------|------|--------------|
| viaSport Staff | Platform admin | Full access, cross-org analytics |
| PSO Admin | Organization admin | Organization-scoped admin |
| Club Reporter | Reporter | Data submission, limited analytics |
| Viewer | Read-only | Dashboard viewing only |

### Environment

**URL:** Provided with credentials
**Environment:** sin-perf (performance testing, production-like configuration)
**Data:** Synthetic test data (20.1M rows)
```

---

## Evaluator Navigation Map

Add this 1-page table to help evaluators quickly locate responses to each evaluation criterion:

```markdown
# Evaluator Navigation Map

| RFP Evaluation Criterion | Our Response Section | Notes |
|--------------------------|---------------------|-------|
| Vendor Fit to viaSport's Needs | 02-vendor-fit | Company profile, team, differentiator |
| Service Approach and Responsiveness | 03-service-approach (6 files) | Methodology for each RFP item |
| System Requirements Addendum | 04-system-requirements (5 files + crosswalk) | Per-requirement compliance |
| Capabilities and Experience | 05-capabilities-experience | Case studies, AI approach, team |
| Cost and Value | 06-cost-value | Pricing, breakdown, change management |
| Timeline and Delivery Schedule | 07-delivery-schedule | Milestones, risks, dependencies |
| Prototype Validation | 01-B-prototype-evaluation-guide + Appendices | Demo access, test results |
```

---

## Implementation Plan

### Phase 1: Create New Sections (2 hours)

- [ ] Create `01-B-prototype-evaluation-guide/final.md` using template above
- [ ] Create `04-system-requirements/00-compliance-crosswalk/final.md` using template above
- [ ] Update manifest.md with new assembly order

### Phase 2: Refine Section 03 — Service Approach (3 hours)

Each file should answer the RFP's specific sub-questions. Keep methodology focus, move requirement details to Section 04.

| File                                    | RFP Sub-Questions to Answer                                                                      | Current State   |
| --------------------------------------- | ------------------------------------------------------------------------------------------------ | --------------- |
| `03/data-submission-reporting/final.md` | (a) UX Strategy, (b) Tech stack benefits                                                         | Exists — refine |
| `03/data-warehousing/final.md`          | (a) Hosting, tenancy, residency, (b) Backup, recovery, encryption                                | Exists — refine |
| `03/data-migration/final.md`            | (a) Methodology (mapping, cleansing, validation, rollback), (b) Audit trail, (c) Quality targets | Exists — refine |
| `03/platform-design/final.md`           | (a) Cloud services, (b) Dev workflow                                                             | Exists — refine |
| `03/testing-qa/final.md`                | (a) QA approach (performance, security), (b) UAT strategy                                        | Exists — refine |
| `03/training-onboarding/final.md`       | (a) Audience-based approach, (b) Resources/samples, (c) Help desk model                          | Exists — refine |

Tasks:

- [ ] Review each file against RFP sub-questions
- [ ] Remove per-requirement detail (belongs in Section 04)
- [ ] Add cross-references to Section 04 where appropriate
- [ ] Ensure each file is ~3 pages, methodology-focused

### Phase 3: Rewrite Section 04 — System Requirements (4 hours)

Apply per-requirement block pattern to all 25 requirements:

| File                                     | Requirements            | Estimated Time |
| ---------------------------------------- | ----------------------- | -------------- |
| `04/data-management-dm-agg/final.md`     | DM-AGG-001 through 006  | 60 min         |
| `04/reporting-rp-agg/final.md`           | RP-AGG-001 through 005  | 50 min         |
| `04/security-sec-agg/final.md`           | SEC-AGG-001 through 004 | 40 min         |
| `04/training-onboarding-to-agg/final.md` | TO-AGG-001 through 003  | 30 min         |
| `04/user-interface-ui-agg/final.md`      | UI-AGG-001 through 007  | 70 min         |

Tasks:

- [ ] Rewrite `04/data-management-dm-agg/final.md` (6 requirements)
- [ ] Rewrite `04/reporting-rp-agg/final.md` (5 requirements)
- [ ] Rewrite `04/security-sec-agg/final.md` (4 requirements)
- [ ] Rewrite `04/training-onboarding-to-agg/final.md` (3 requirements)
- [ ] Rewrite `04/user-interface-ui-agg/final.md` (7 requirements)

### Phase 4: Polish Existing Sections (1 hour)

- [ ] Update `01-executive-summary.md` with at-a-glance panel
- [ ] Update `03-vendor-fit.md` — add continuity plan subsection
- [ ] Update `09-appendices.md` — demo access section (password reset on first login)
- [ ] Keep "TBD" placeholders through the next couple of days, then replace before submission
- [ ] Add data provenance statements (3 locations)

### Phase 5: Assembly and Review (1 hour)

- [ ] Update `manifest.md` with final assembly order
- [ ] Compile into single `full-proposal-response.md`
- [ ] Review for consistency and cross-reference accuracy
- [ ] Final read-through for professional polish

---

## Assembly Order (Updated Manifest)

```
1.  docs/sin-rfp/response/01-executive-summary/final.md
2.  docs/sin-rfp/response/01-B-prototype-evaluation-guide/final.md      # NEW
3.  docs/sin-rfp/response/02-vendor-fit/final.md

    # Section 03: Service Approach (mirrors RFP items 2.1-2.6)
4.  docs/sin-rfp/response/03-service-approach/data-submission-reporting/final.md
5.  docs/sin-rfp/response/03-service-approach/data-warehousing/final.md
6.  docs/sin-rfp/response/03-service-approach/data-migration/final.md
7.  docs/sin-rfp/response/03-service-approach/platform-design/final.md
8.  docs/sin-rfp/response/03-service-approach/testing-qa/final.md
9.  docs/sin-rfp/response/03-service-approach/training-onboarding/final.md

    # Section 04: System Requirements (mirrors Addendum sections 2.1-2.5)
10. docs/sin-rfp/response/04-system-requirements/00-compliance-crosswalk/final.md  # NEW
11. docs/sin-rfp/response/04-system-requirements/data-management-dm-agg/final.md
12. docs/sin-rfp/response/04-system-requirements/reporting-rp-agg/final.md
13. docs/sin-rfp/response/04-system-requirements/security-sec-agg/final.md
14. docs/sin-rfp/response/04-system-requirements/training-onboarding-to-agg/final.md
15. docs/sin-rfp/response/04-system-requirements/user-interface-ui-agg/final.md

16. docs/sin-rfp/response/05-capabilities-experience/final.md
17. docs/sin-rfp/response/06-cost-value/final.md
18. docs/sin-rfp/response/07-delivery-schedule/final.md
19. docs/sin-rfp/response/08-appendices/final.md
```

### Section/RFP Mapping Reference

| Our Section            | RFP/Addendum Source                                 | Notes                      |
| ---------------------- | --------------------------------------------------- | -------------------------- |
| 03-service-approach    | RFP "Service Approach and Responsiveness" items 1-6 | Methodology focus          |
| 04-system-requirements | System Requirements Addendum sections 2.1-2.5       | Per-requirement compliance |

---

## Estimated Effort

| Phase                        | Hours        | Notes                         |
| ---------------------------- | ------------ | ----------------------------- |
| Phase 1: Create new sections | 2            | Use templates in this doc     |
| Phase 2: Refine Section 03   | 3            | 6 files × 30 min each         |
| Phase 3: Rewrite Section 04  | 4            | 25 requirements × 10 min each |
| Phase 4: Polish existing     | 1            | Search/replace + additions    |
| Phase 5: Assembly and review | 1            | Final compilation             |
| **Total**                    | **11 hours** |                               |

Phases 2-4 can run in parallel after Phase 1 completes.

---

## Success Criteria

The restructured response should make it effortless for evaluators to:

1. **Confirm requirement compliance** — Master crosswalk table answers this in 60 seconds
2. **Understand what's real vs. planned** — Every requirement has explicit "Built Today" and "Remaining Scope"
3. **Validate claims via demo** — Prototype Evaluation Guide provides exact demo paths
4. **Assess delivery risk** — viaSport dependencies are explicit and scoped
5. **Navigate the document** — Clear structure matches RFP while eliminating redundancy

---

## Final Pre-Submission Checklist

Before assembling the final PDF:

- [ ] **Demo credentials included** — note synthetic data, scope, and monitoring
- [ ] **Consistent status claims** — "Built" vs "Partial" used consistently
- [ ] **Every system requirement includes:**
  - Requirement text (quoted)
  - Acceptance criteria (quoted)
  - "How We Meet It" bullets
  - Evidence (demo path or appendix reference)
- [ ] **Prototype claims tied to evidence:**
  - Demo path, OR
  - Appendix artifact (load test, Lighthouse, DR drill), OR
  - "Depends on viaSport" label
- [ ] **Evaluator Navigation Map** included near front
- [ ] **Data provenance statements** in key locations
- [ ] **Cross-references accurate** — Section 03/04 references updated throughout

---

## Key Messaging to Maintain

Throughout the document, reinforce these themes:

1. **Prototype as accelerator, not substitute for discovery**

   > "We built this prototype to prove feasibility and de-risk delivery. We still treat Discovery as mandatory to validate workflows, templates, and migration realities."

2. **Data provenance**

   > "No viaSport confidential data was used. Performance testing used synthetic data designed to match RFP scale characteristics."

3. **Honest about gaps**

   > "Three requirements have remaining scope that depends on viaSport input or legacy system access."

4. **Security is production-ready**
   > "S3 Object Lock, tamper-evident audit logs, MFA, Canadian data residency, and encryption at rest/in-transit are all implemented."

---

## Next Steps

1. Review and approve this plan
2. Execute Phase 1 (create new sections)
3. Execute Phases 2-4 in parallel
4. Execute Phase 5 (assembly)
5. Share compiled document for review
6. Convert to PDF/DOCX for submission
