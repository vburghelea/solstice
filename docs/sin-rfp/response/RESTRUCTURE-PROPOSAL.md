# RFP Response Restructure Proposal

## Problem Statement

The current RFP response structure has redundancy and clarity issues:

1. **Redundancy**: The same capabilities are described in both `03-service-approach/` and `04-system-requirements/` (e.g., form builder appears in `data-submission-reporting/` AND in `DM-AGG-001`)

2. **Blurred status**: Hard to tell what's built today vs. planned vs. depends on viaSport

3. **Mapping mismatch**: The RFP's "Service Approach" items don't map cleanly to the Addendum's requirement sections

---

## Source Documents

The response must address two separate viaSport documents:

### 1. RFP Document (`VIASPORT-PROVIDED-viasport-sin-rfp.md`)

Asks for:

- Executive Summary (≤3 pages)
- Vendor Fit to viaSport's Needs
- **Service Approach and Responsiveness** (methodology for 6 scope items)
- Capabilities and Experience
- Cost and Value of Services

The "Service Approach" section asks about:

1. Data Submission & Reporting Web Portal (UX, tech stack)
2. Data Warehousing (hosting, tenancy, backup, encryption)
3. Data Migration (methodology, audit trail, defect workflow)
4. Platform Design (cloud services, dev process)
5. Testing & QA (approach, UAT strategy)
6. Training & Onboarding (delivery model, resources, help desk)

### 2. System Requirements Addendum (`VIASPORT-PROVIDED-system-requirements-addendum.md`)

Defines specific requirements organized as:

- 2.1 Data Management (DM-AGG-001 through DM-AGG-006)
- 2.2 Reporting (RP-AGG-001 through RP-AGG-005)
- 2.3 Security (SEC-AGG-001 through SEC-AGG-004)
- 2.4 Training & Onboarding (TO-AGG-001 through TO-AGG-003)
- 2.5 User Interface (UI-AGG-001 through UI-AGG-007)

---

## The Mapping Problem

The RFP's "Service Approach" items don't map 1:1 to the Addendum's sections:

| RFP Service Approach                   | Addendum Section(s) Touched                                       |
| -------------------------------------- | ----------------------------------------------------------------- |
| Data Submission & Reporting Web Portal | 2.2 Reporting + parts of 2.1 Data Management + 2.5 User Interface |
| Data Warehousing                       | 2.1 DM-AGG-005 (storage) + 2.3 Security (encryption)              |
| Data Migration                         | 2.1 DM-AGG-006 only                                               |
| Platform Design                        | Cross-cutting (no specific addendum section)                      |
| Testing & QA                           | Cross-cutting (not in addendum at all)                            |
| Training & Onboarding                  | 2.4 Training & Onboarding                                         |

And the reverse:

- **2.3 Security (SEC-AGG)** has no direct "Service Approach" counterpart
- **2.5 User Interface (UI-AGG)** has no direct "Service Approach" counterpart

Forcing a 1:1 mapping creates redundancy and confusion.

---

## Proposed Structure

### Section 03 - Service Approach (Methodology-Focused)

**Purpose**: Answer the RFP's "how will you do it?" questions. High-level methodology, not per-requirement detail.

**Length**: ~15-20 pages total

**Files**:

```
03-service-approach/
  platform-infrastructure.md    # Combines "Data Warehousing" + "Platform Design"
  development-deployment.md     # Quality gates, environments, workflow
  testing-qa.md                 # QA approach, UAT strategy
  migration-methodology.md      # Phases, validation, rollback, audit trail
  training-delivery.md          # Audiences, delivery model, help desk
```

**Content style**: Process, philosophy, approach. References Section 04 for implementation details.

---

### Section 04 - System Requirements (Compliance-Focused)

**Purpose**: Demonstrate compliance with each requirement from the Addendum. Per-requirement detail with clear built/planned status.

**Length**: ~35-40 pages total

**Files**:

```
04-system-requirements/
  data-management.md           # 2.1: DM-AGG-001 through DM-AGG-006
  reporting.md                 # 2.2: RP-AGG-001 through RP-AGG-005
  security.md                  # 2.3: SEC-AGG-001 through SEC-AGG-004
  training-onboarding.md       # 2.4: TO-AGG-001 through TO-AGG-003
  user-interface.md            # 2.5: UI-AGG-001 through UI-AGG-007
```

**Content style**: Each file has:

1. Brief section introduction (2-3 paragraphs of context)
2. Per-requirement blocks following the pattern below

---

## Per-Requirement Block Pattern

Each requirement in Section 04 follows this structure:

```markdown
### DM-AGG-001: Data Collection & Submission

**Requirement:**
> The system shall enable customizable form building, support flexible data entry
> through variable formats (forms, file uploads), with capabilities for real-time
> submission tracking, editing, and historical data migration.

**Built Today:**
- Form builder with drag-and-drop field ordering (8 field types)
- File uploads with type/size validation, stored in S3 with encryption
- Submission status tracking: draft → submitted → under review → approved
- Version history with change attribution
- Import wizard for CSV/Excel with mapping, preview, and rollback

**Remaining Scope:**
- viaSport-specific form templates
- UX refinements per stakeholder interviews

**Approach:**
Form templates will be created during Planning based on BCAR/BCSI review.
UX refinements will follow the interview process described in Section 03.

**Evidence:** Form submission workflow functional in prototype; import wizard
tested with multi-million row datasets.
```

### Pattern Rationale

| Element             | Purpose                                                         |
| ------------------- | --------------------------------------------------------------- |
| **Requirement**     | Quote directly from addendum - shows we understand what's asked |
| **Built Today**     | Our differentiator - working prototype, not promises            |
| **Remaining Scope** | Honest about gaps - builds trust                                |
| **Approach**        | How we'll close gaps - references Section 03 methodology        |
| **Evidence**        | Proof points - testable claims                                  |

### Why This Order?

1. **Lead with proof, not promises** - "Built Today" comes before "Remaining Scope"
2. **Evaluators skim** - They see what's real before reading about plans
3. **Matches demo flow** - "Here's what you asked for, here's how it works"
4. **Honest risk assessment** - Clear what depends on viaSport

---

## What Goes Where?

| Topic                          | Section 03 (Methodology) | Section 04 (Per-Requirement)           |
| ------------------------------ | ------------------------ | -------------------------------------- |
| AWS services, hosting, tenancy | ✅ Platform overview     | Referenced in DM-AGG-005, SEC-AGG-003  |
| Form builder capabilities      | —                        | ✅ DM-AGG-001, RP-AGG-004              |
| Import/migration process       | ✅ Phased methodology    | ✅ DM-AGG-006 (specific capabilities)  |
| UAT strategy                   | ✅ Overall approach      | —                                      |
| MFA, auth, access control      | —                        | ✅ SEC-AGG-001                         |
| Help desk model                | ✅ Support tiers, SLAs   | ✅ TO-AGG-003 (implementation details) |

**Key distinction**:

- **Section 03**: "Our methodology is..." (process, philosophy)
- **Section 04**: "For requirement X, we built Y, still need Z" (compliance)

---

## Example: How Migration Spans Both Sections

### In 03-service-approach/migration-methodology.md (~4 pages)

```markdown
# Migration Methodology

## Phased Approach

| Phase | Duration | Activities | Exit Criteria |
|-------|----------|------------|---------------|
| Discovery | Weeks 1-2 | Schema mapping, data quality assessment | Mapping approved |
| Extraction | Weeks 3-4 | Legacy data export, format conversion | Data files staged |
| Validation | Weeks 5-6 | Row-level validation, error resolution | <1% error rate |
| Import | Week 7 | Production import, verification | Sign-off |

## Validation & Rollback Strategy

- Row-level validation with detailed error reporting
- Job-wide rollback via import_job_id tagging
- 7-day rollback window before permanent commit
- Legacy systems remain read-only until sign-off

## Defect Workflow

[Classification, triage, reporting process]

## Dependencies on viaSport

- Legacy system export capability or direct database access
- Schema documentation for BCAR/BCSI
- Subject matter experts for field mapping review
```

### In 04-system-requirements/data-management.md (DM-AGG-006 block)

```markdown
### DM-AGG-006: Legacy Data Migration & Bulk Import

**Requirement:**
> The system shall provide tooling and configurable mapping templates to import
> historical data from CSV/Excel, legacy databases, or APIs, including validation,
> error-handling, and rollback.

**Built Today:**
- Import wizard with field mapping, preview, commit
- CSV/Excel parsing with type coercion (numbers, booleans, strings)
- Job-wide rollback within 7-day window
- ECS Fargate batch processing (2 vCPU, 4 GB RAM, checkpointed)
- File field imports with JSON payloads (storageKey/signedUrl)
- Error rows logged to S3 with error type and row data

**Remaining Scope:**
- BCAR/BCSI extraction method (depends on legacy system access)
- Org/user/document import pipelines (form submissions only today)
- Phone/postal normalization rules beyond basic type parsing

**Approach:**
Extraction method will be determined during Discovery based on legacy system
capabilities. See Section 03 for full migration methodology including phased
approach and rollback strategy.

**Evidence:** Import wizard functional in prototype; ECS task deployed; tested
with multi-million row datasets.
```

**No redundancy**: Section 03 explains the process. Section 04 cites it and focuses on what's built.

---

## Full Proposed Structure

```
docs/sin-rfp/response/
├── 01-executive-summary/
│   └── final.md
├── 02-vendor-fit/
│   └── final.md
├── 03-service-approach/                    # ~15 pages, methodology-focused
│   ├── platform-infrastructure.md          # AWS, hosting, tenancy, data residency
│   ├── development-deployment.md           # Workflow, environments, quality gates
│   ├── testing-qa.md                       # QA layers, UAT, defect management
│   ├── migration-methodology.md            # Phases, validation, rollback
│   └── training-delivery.md                # Audiences, delivery model, help desk
├── 04-system-requirements/                 # ~35 pages, per-requirement compliance
│   ├── data-management.md                  # DM-AGG-001 through 006
│   ├── reporting.md                        # RP-AGG-001 through 005
│   ├── security.md                         # SEC-AGG-001 through 004
│   ├── training-onboarding.md              # TO-AGG-001 through 003
│   └── user-interface.md                   # UI-AGG-001 through 007
├── 05-capabilities-experience/
│   └── final.md
├── 06-cost-value/
│   └── final.md
├── 07-delivery-schedule/
│   └── final.md
├── 08-appendices/
│   └── final.md
└── manifest.md                             # Assembly order
```

---

## Migration Path

### Option A: Full Restructure

1. Create new 03/04 structure as described
2. Extract methodology content from current files into new Section 03
3. Rewrite Section 04 with per-requirement pattern
4. Update manifest.md with new assembly order
5. Archive old structure

**Effort**: ~4-6 hours
**Result**: Clean, minimal redundancy

### Option B: Incremental Update

1. Keep current file structure
2. Update each final.md to follow per-requirement pattern where applicable
3. Add cross-references between 03 and 04
4. Accept some remaining redundancy

**Effort**: ~2-3 hours
**Result**: Improved clarity, some redundancy remains

---

## Decision Points

1. **Full restructure vs. incremental?** - Full restructure recommended for clarity

2. **Should Section 03 subsections match RFP exactly?** - No, combine related topics (e.g., "Data Warehousing" + "Platform Design" → "Platform Infrastructure")

3. **Compliance matrix at top of each Section 04 file?** - Optional, but helpful for quick reference

4. **Evidence format?** - Keep brief, reference appendices for detailed test results

---

## Next Steps

1. Review and approve this proposal
2. Create new file structure
3. Migrate content following the per-requirement pattern
4. Update manifest.md
5. Review for consistency and accuracy
6. Archive old structure
