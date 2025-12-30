# Solstice BI Platform Specification - V2 Addendum (ARCHIVED)

Status: Archived (merged into bi/ directory)
Date: 2025-12-30
Author: Technical Architecture

> **ARCHIVED**: This addendum has been merged into the consolidated BI documentation at:
>
> **[docs/sin-rfp/decisions/bi/](./bi/)**
>
> - [SPEC-bi-platform.md](./bi/SPEC-bi-platform.md) - Consolidated specification
> - [PLAN-bi-implementation.md](./bi/PLAN-bi-implementation.md) - Implementation approach
> - [GUIDE-bi-testing.md](./bi/GUIDE-bi-testing.md) - Testing strategy
> - [CHECKLIST-sql-workbench-gate.md](./bi/CHECKLIST-sql-workbench-gate.md) - SQL Workbench prerequisites
>
> **Do not use this document for new work.** It is retained for historical reference only.

---

_Original content below for reference:_

---

## Table of Contents

1. [Executive Summary (Revised)](#1-executive-summary-revised)
2. [Scope, Personas, and Non-Goals](#2-scope-personas-and-non-goals)
3. [Current-State Baseline](#3-current-state-baseline)
4. [Requirements Traceability](#4-requirements-traceability)
5. [Governance Enforcement Model](#5-governance-enforcement-model)
6. [Query Guardrails and Platform Limits](#6-query-guardrails-and-platform-limits)
7. [Access Control Reconciliation](#7-access-control-reconciliation)
8. [SQL Workbench Constraints](#8-sql-workbench-constraints)
9. [Corrections to V1 Spec](#9-corrections-to-v1-spec)
10. [Migration Path](#10-migration-path)
11. [Open Questions](#11-open-questions)

---

## 1. Executive Summary (Revised)

This specification defines the target architecture for Solstice Analytics (BI) to
satisfy viaSport "Strength in Numbers" requirements for:

- **Self-service analytics + export with field-level access controls** (RP-AGG-005)
- **Dashboards for reporting visualization** (RP-AGG-003)
- **Immutable / tamper-evident audit trail of actions, queries, and exports** (SEC-AGG-004)

Solstice is the **sole analytics platform** for end users and analysts. The Evidence
POC option (ADR D0.19) has been **withdrawn**—we are building native BI capabilities
from scratch to maintain full control over governance, tenancy, and audit requirements.

This spec is "end-state," but implementation is incremental:

1. Strengthen the existing pivot + chart builder
2. Introduce a semantic layer (datasets/metrics)
3. Add dashboards and governed sharing
4. Introduce a governed SQL Workbench only if it can be constrained to curated
   datasets/views and enforced at the database boundary

### Key Constraints

| Constraint               | Requirement                                                                                  |
| ------------------------ | -------------------------------------------------------------------------------------------- |
| **Data Residency**       | All production data and query execution in AWS `ca-central-1` (Canada) for PIPEDA compliance |
| **Organization Scoping** | Enforced by default; cross-org queries require Global Admin                                  |
| **Field-Level Access**   | ACL rules and PII masking across UI + export paths                                           |
| **Export Controls**      | Step-up authentication required; all exports audited                                         |
| **Audit Trail**          | Tamper-evident logging with integrity verification (SEC-AGG-004)                             |

---

## 2. Scope, Personas, and Non-Goals

### 2.1 Personas

| Persona                   | Description                                                                      | Analytics Access                   |
| ------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| **End User (Org Member)** | Consumes dashboards/reports shared with them; may run ad-hoc pivots if permitted | View shared reports, limited pivot |
| **Reporter / Power User** | Creates reports/pivots for their org; exports require step-up auth               | Full pivot builder, exports        |
| **Admin / Owner**         | Manages org-wide sharing, may configure datasets if granted                      | Org-wide sharing, dataset admin    |
| **Global Admin**          | Cross-org access for support/governance; all actions audited                     | Unrestricted (audited)             |

> **Note**: "Analyst" is treated as a **permission set** (e.g., `analytics.author`,
> `analytics.sql`) rather than a new standalone role. This aligns with the existing
> org role model (`owner`, `admin`, `reporter`) already enforced in
> `reports.mutations.ts`.

### 2.2 In-Scope (End-User Solstice-Native)

- **Visual Pivot Builder**: Pivot tables, chart presets, saved reports, governed sharing
- **Dashboard Canvas**: Layout, widgets, cross-filtering (phase-gated), governed sharing
- **Exports**: CSV/XLSX (JSON optional), step-up auth, audit events, field-level controls
- **Semantic Layer**: Curated datasets, metrics definitions, calculated fields

### 2.3 Out of Scope (Explicitly Not Committed in MVP)

| Feature                              | Status                   | Notes                                    |
| ------------------------------------ | ------------------------ | ---------------------------------------- |
| Alerts / Scheduled Reports           | Phase 5+ or separate ADR | Requires Celery/scheduler infrastructure |
| Plugin Ecosystem / Chart Marketplace | Not planned              | ECharts covers chart types               |
| Arbitrary Raw-Table SQL Access       | Prohibited               | SQL Workbench constrained to datasets    |
| Public / Anonymous Dashboard Links   | Not planned              | All access requires authentication       |
| PDF/PNG Dashboard Export             | Optional/Future          | Mark as stretch goal if needed           |
| Real-time Streaming Analytics        | Not planned              | Batch/on-demand queries only             |

### 2.4 Relationship to ADRs

| ADR                                       | Status        | Implication for This Spec                     |
| ----------------------------------------- | ------------- | --------------------------------------------- |
| **D0.16** (Analytics charts/pivots scope) | Accepted      | ECharts + pivot builder is the committed path |
| **D0.19** (BI platform direction)         | **Withdrawn** | Evidence POC not pursued; building native BI  |

**Decision rationale**: Building native BI provides full control over governance,
tenancy enforcement, audit logging, and Canada residency requirements without the
integration complexity and governance gaps of external tools.

---

## 3. Current-State Baseline

Solstice already has a working analytics implementation in `src/features/reports/`.
This spec **extends** the baseline rather than replacing it.

### 3.1 What's Already Implemented

| Capability                   | Implementation                           | Location                                            |
| ---------------------------- | ---------------------------------------- | --------------------------------------------------- |
| **Pivot Builder UI**         | Drag-and-drop with @dnd-kit              | `report-pivot-builder.tsx`                          |
| **Server-Side Aggregation**  | In-memory pivot computation              | `reports.mutations.ts:buildPivotResult`             |
| **Aggregation Functions**    | `count`, `sum`, `avg`, `min`, `max`      | `reports.mutations.ts:buildPivotResult`             |
| **Column Allowlists**        | Per-data-source restrictions             | `reports.config.ts:DATA_SOURCE_CONFIG`              |
| **Filter Allowlists**        | Per-field operator restrictions          | `reports.config.ts:DATA_SOURCE_CONFIG`              |
| **Organization Scoping**     | Automatic org filter injection           | `reports.mutations.ts:applyOrganizationScope`       |
| **Field-Level ACL**          | PII masking for sensitive fields         | `reports.mutations.ts:applyFieldLevelAcl`           |
| **PII Redaction**            | Form payload redaction by classification | `reports.mutations.ts:redactFormSubmissionPayloads` |
| **Step-Up Auth for Exports** | Recent auth required                     | `reports.mutations.ts:requireRecentAuth`            |
| **Export Formats**           | CSV, XLSX                                | `reports.mutations.ts:exportPivotData`              |
| **Saved Reports**            | CRUD with sharing                        | `reports.mutations.ts`                              |
| **Audit Logging**            | Export events logged                     | `logExportEvent`, `logDataChange`                   |
| **Chart Rendering**          | ECharts integration                      | `report-pivot-builder.tsx`                          |

### 3.2 Current Filter Operators

The existing implementation supports these operators only:

```typescript
// src/features/reports/reports.config.ts
export type FilterOperator =
  | "eq" // equals
  | "neq" // not equals
  | "gt" // greater than
  | "gte" // greater than or equal
  | "lt" // less than
  | "lte" // less than or equal
  | "in" // in array
  | "between"; // between two values
```

**V1 Spec Correction**: The v1 spec lists `contains`, `starts_with`, `ends_with`,
`not_in`, `is_null`, `is_not_null`. These are **Phase 2+** enhancements, not current
capabilities.

### 3.3 Current Data Sources

```typescript
// src/features/reports/reports.config.ts
export const DATA_SOURCE_CONFIG = {
  organizations: {
    /* ... */
  },
  reporting_submissions: {
    /* ... */
  },
  form_submissions: {
    /* ... */
  },
} as const;
```

### 3.4 Current Role-Based Access

```typescript
// src/features/reports/reports.mutations.ts
const ANALYTICS_ROLES: OrganizationRole[] = ["owner", "admin", "reporter"];
const ORG_WIDE_ROLES: OrganizationRole[] = ["owner", "admin"];
```

Global Admin check via `PermissionService.isGlobalAdmin(userId)`.

### 3.5 Existing Database Tables

| Table            | Purpose                         |
| ---------------- | ------------------------------- |
| `saved_reports`  | Persisted report configurations |
| `export_history` | Export audit trail              |

---

## 4. Requirements Traceability

### 4.1 Traceability Matrix

| Requirement                          | ID          | Spec Coverage                               | Acceptance Criteria                                                                | Implementation Notes                                                     |
| ------------------------------------ | ----------- | ------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Self-Service Analytics & Data Export | RP-AGG-005  | Visual Builder + Exports + Field ACL        | User builds custom chart, exports to CSV; export respects field-level access rules | Already partially implemented; enhance with semantic layer               |
| Reporting Flow & Dashboards          | RP-AGG-003  | Dashboard Canvas + Widgets + Sharing        | Users view data in dashboard format; track resubmissions                           | Dashboard canvas is Phase 4                                              |
| Audit Trail & Data Lineage           | SEC-AGG-004 | Query/Export audit + tamper evidence        | Auditors filter logs by user/record ID; tamper-evident hashing verifies integrity  | Extend existing `logExportEvent`; add `biQueryLog` for query-level audit |
| Data Governance & Access Control     | DM-AGG-003  | Org scoping + Field ACL + Role-based access | Users can only access data based on permission                                     | Already implemented via allowlists                                       |
| Privacy & Regulatory Compliance      | SEC-AGG-003 | PII masking + ca-central-1 residency        | All sensitive data encrypted and stored securely                                   | Already implemented; ensure no data leaves ca-central-1                  |

### 4.2 Acceptance Test Scenarios

**RP-AGG-005 - Self-Service Analytics**:

1. Reporter creates pivot table with organization filter
2. Reporter switches chart type to bar chart
3. Reporter exports to CSV - step-up auth triggered
4. Export excludes PII fields (masked as `***`)
5. Export logged in `export_history` with filters used

**SEC-AGG-004 - Audit Trail**:

1. User runs pivot query - `biQueryLog` entry created
2. User exports data - `export_history` + `logExportEvent` triggered
3. Admin queries audit logs by user ID - results returned
4. Admin exports audit logs - integrity checksum verified

---

## 5. Governance Enforcement Model

### 5.1 Enforcement Layers

Governance is enforced at **multiple layers** to provide defense-in-depth:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ENFORCEMENT LAYERS                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Layer 1: APPLICATION ALLOWLISTS (Visual Builder)                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ • Only approved datasets/fields/filters/sorts can be constructed    │   │
│  │ • Server validates and normalizes queries prior to execution        │   │
│  │ • DATA_SOURCE_CONFIG defines column/filter/sort allowlists          │   │
│  │ • Implementation: reports.validation.ts, reports.config.ts          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    ↓                                        │
│  Layer 2: DATABASE BOUNDARY ENFORCEMENT (Required for SQL Workbench)        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ • SQL execution targets curated views/datasets ONLY                 │   │
│  │ • Tenancy enforced via RLS or tenant-scoped views/roles             │   │
│  │ • Restricted columns excluded from SQL-visible views                │   │
│  │ • Database roles with least-privilege access                        │   │
│  │ • Implementation: bi_datasets views, Postgres RLS (Postgres 15+)    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    ↓                                        │
│  Layer 3: OUTPUT CONTROLS                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ • Masking/redaction applied post-query for UI display               │   │
│  │ • Exports use strictest rules and require step-up auth              │   │
│  │ • All exports logged with filters, row counts, user context         │   │
│  │ • Implementation: applyFieldLevelAcl, requireRecentAuth             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Tenancy Enforcement

| Query Path     | Tenancy Enforcement                                                | Notes                      |
| -------------- | ------------------------------------------------------------------ | -------------------------- |
| Visual Builder | Application-level filter injection                                 | `applyOrganizationScope()` |
| SQL Workbench  | Database views with `WHERE org_id = current_setting('app.org_id')` | RLS or view-level          |
| Exports        | Same as query path + step-up auth                                  | Audited                    |

### 5.3 Field-Level Access Control

```typescript
// Existing implementation in reports.mutations.ts
const SENSITIVE_FIELDS = [
  "email",
  "phone",
  "dateOfBirth",
  "emergencyContact",
  "emergencyContactPhone",
  "emergencyContactEmail",
];

// Permission check
const canViewPii =
  permissions.has("*") ||
  permissions.has("pii.read") ||
  permissions.has("pii:read") ||
  permissions.has("data.pii.read");
```

For SQL Workbench, sensitive fields are **excluded from curated views** unless the
user has explicit PII permissions. This is enforced at the database level, not just
application level.

---

## 6. Query Guardrails and Platform Limits

### 6.1 Runtime Limits

| Limit                           | Visual Builder | SQL Workbench | Export  | Notes                        |
| ------------------------------- | -------------- | ------------- | ------- | ---------------------------- |
| **Statement Timeout**           | 30s            | 30s           | 60s     | Postgres `statement_timeout` |
| **Max Rows Returned (UI)**      | 10,000         | 10,000        | N/A     | Truncate with warning        |
| **Max Rows Exported**           | 100,000        | 100,000       | 100,000 | Hard limit                   |
| **Max Export File Size**        | 50 MB          | 50 MB         | 50 MB   | Reject if exceeded           |
| **Concurrent Queries per User** | 3              | 2             | 1       | Rate limit                   |
| **Concurrent Queries per Org**  | 10             | 5             | 3       | Fair share                   |

### 6.2 Query Cost Estimation (Future)

For SQL Workbench, implement `EXPLAIN` analysis before execution:

```typescript
// Reject queries with excessive estimated cost
const MAX_ESTIMATED_COST = 100000;

async function validateQueryCost(sql: string): Promise<void> {
  const [{ "QUERY PLAN": plan }] = await db.execute(sql`EXPLAIN (FORMAT JSON) ${sql}`);
  const totalCost = plan[0]["Plan"]["Total Cost"];
  if (totalCost > MAX_ESTIMATED_COST) {
    throw new Error(`Query cost ${totalCost} exceeds limit ${MAX_ESTIMATED_COST}`);
  }
}
```

### 6.3 Query Caching

| Cache Type         | TTL    | Invalidation                  | Notes                                     |
| ------------------ | ------ | ----------------------------- | ----------------------------------------- |
| Query result cache | 5 min  | On data write to source table | Hash: `SHA256(normalized_query + org_id)` |
| Metadata cache     | 1 hour | Manual refresh                | Dataset schemas, metrics                  |

---

## 7. Access Control Reconciliation

### 7.1 V1 Spec vs. Actual Implementation

The v1 spec introduces "Analyst" as a first-class role. The actual implementation
uses org roles. Here's the reconciliation:

| V1 Spec Role | Actual Implementation                           | Permissions                      |
| ------------ | ----------------------------------------------- | -------------------------------- |
| End User     | Org member (any role)                           | View shared reports              |
| Analyst      | `reporter` role + `analytics.author` permission | Create reports, SQL access       |
| Admin        | `admin` or `owner` role                         | Org-wide sharing, dataset config |
| Global Admin | `PermissionService.isGlobalAdmin()`             | Cross-org, all access            |

### 7.2 Revised Access Matrix

| Feature               | Org Member | Reporter                  | Admin/Owner          | Global Admin |
| --------------------- | ---------- | ------------------------- | -------------------- | ------------ |
| View shared reports   | Yes        | Yes                       | Yes                  | Yes          |
| Create visual reports | No         | Yes                       | Yes                  | Yes          |
| SQL Workbench         | No         | With `analytics.sql` perm | Yes                  | Yes          |
| Create dashboards     | No         | Yes                       | Yes                  | Yes          |
| Share org-wide        | No         | No                        | Yes                  | Yes          |
| Export data           | Step-up    | Step-up                   | Step-up              | Step-up      |
| View PII fields       | No         | With `pii.read` perm      | With `pii.read` perm | Yes          |
| Define datasets       | No         | No                        | Yes                  | Yes          |
| Cross-org queries     | No         | No                        | No                   | Yes          |

### 7.3 Permission Sets

```typescript
// New permission sets for analytics
const ANALYTICS_PERMISSIONS = {
  "analytics.view": "View shared reports and dashboards",
  "analytics.author": "Create and edit reports",
  "analytics.sql": "Access SQL Workbench (constrained to datasets)",
  "analytics.share": "Share reports org-wide",
  "analytics.export": "Export data (still requires step-up)",
  "analytics.admin": "Configure datasets and metrics",
} as const;
```

---

## 8. SQL Workbench Constraints

### 8.1 Security Model

**Critical**: SQL Workbench is **NOT** unrestricted database access. It is constrained
as follows:

| Constraint               | Implementation                                                        |
| ------------------------ | --------------------------------------------------------------------- |
| **Target datasets only** | SQL executes against curated views, not raw tables                    |
| **Tenancy at DB level**  | Views include `WHERE organization_id = current_setting('app.org_id')` |
| **Column restrictions**  | Views exclude PII columns unless user has permission                  |
| **Read-only**            | Database role has `SELECT` only, no DML                               |
| **Blocked statements**   | Parser rejects INSERT, UPDATE, DELETE, DDL                            |
| **No arbitrary JOINs**   | Can only JOIN tables defined in dataset configuration                 |

### 8.2 Implementation Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SQL WORKBENCH EXECUTION                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  User SQL Query                                                             │
│       │                                                                     │
│       ▼                                                                     │
│  ┌─────────────────┐                                                        │
│  │ SQL Parser      │  1. Validate syntax                                   │
│  │ & Validator     │  2. Check for blocked patterns (DML, DDL)             │
│  │                 │  3. Extract table references                           │
│  └────────┬────────┘                                                        │
│           │                                                                 │
│           ▼                                                                 │
│  ┌─────────────────┐                                                        │
│  │ Dataset         │  4. Verify tables are in approved dataset             │
│  │ Authorization   │  5. Check user has access to dataset                  │
│  │                 │  6. Check column-level permissions                    │
│  └────────┬────────┘                                                        │
│           │                                                                 │
│           ▼                                                                 │
│  ┌─────────────────┐                                                        │
│  │ Query Rewriter  │  7. Rewrite FROM clauses to use curated views         │
│  │                 │  8. Inject org_id context via SET app.org_id          │
│  │                 │  9. Add LIMIT if missing                              │
│  └────────┬────────┘                                                        │
│           │                                                                 │
│           ▼                                                                 │
│  ┌─────────────────┐                                                        │
│  │ Guardrails      │  10. Check query cost (EXPLAIN)                       │
│  │ Check           │  11. Verify within rate limits                        │
│  │                 │  12. Apply statement timeout                          │
│  └────────┬────────┘                                                        │
│           │                                                                 │
│           ▼                                                                 │
│  ┌─────────────────┐                                                        │
│  │ Execute via     │  13. Run against read-replica if available            │
│  │ Read-Only Role  │  14. Database role: bi_readonly                       │
│  └────────┬────────┘                                                        │
│           │                                                                 │
│           ▼                                                                 │
│  ┌─────────────────┐                                                        │
│  │ Audit Log       │  15. Log query, user, org, execution time             │
│  │                 │  16. Add to tamper-evident chain                      │
│  └─────────────────┘                                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 8.3 Curated Views Example

```sql
-- Create tenant-scoped view for organizations dataset
CREATE VIEW bi_v_organizations AS
SELECT
  id,
  name,
  slug,
  type,
  status,
  parent_org_id,
  created_at,
  updated_at
  -- NOTE: No sensitive columns exposed
FROM organizations
WHERE organization_id = current_setting('app.org_id', true)::uuid
   OR current_setting('app.is_global_admin', true)::boolean = true;

-- Set session context before query execution
SET app.org_id = '123e4567-e89b-12d3-a456-426614174000';
SET app.is_global_admin = false;
```

### 8.4 SQL Workbench: Hard Prerequisites (Blocking)

> **CRITICAL**: SQL Workbench is **DISABLED BY DEFAULT** and **MUST NOT** be enabled
> until ALL prerequisites below are validated. This is a **hard gate**, not a
> recommendation.

#### Prerequisites Checklist

| #   | Prerequisite                  | Validation                                              | Owner    | Status      |
| --- | ----------------------------- | ------------------------------------------------------- | -------- | ----------- |
| 1   | **Database views created**    | All `bi_v_*` views exist and exclude PII columns        | DBA      | Not started |
| 2   | **RLS policies active**       | `SELECT` from views returns only tenant-scoped rows     | DBA      | Not started |
| 3   | **Read-only role created**    | `bi_readonly` role with `SELECT`-only on `bi_v_*` views | DBA      | Not started |
| 4   | **Session context injection** | `SET app.org_id` executed before every query            | Backend  | Not started |
| 5   | **Query rewriter deployed**   | Table names rewritten to view names                     | Backend  | Not started |
| 6   | **Guardrails enforced**       | Timeout, row limit, cost check all active               | Backend  | Not started |
| 7   | **Audit logging active**      | All queries logged to `bi_query_log` with checksums     | Backend  | Not started |
| 8   | **Security review complete**  | Penetration test of SQL injection vectors               | Security | Not started |

#### Enablement Process

1. All 8 prerequisites marked "Complete" in this checklist
2. Sign-off from: Engineering Lead, Security, Product
3. Feature flag `sql_workbench_enabled` set to `true` per tenant
4. Initial rollout to admin users only; expand after 2-week soak

#### Failure Mode

If SQL Workbench is enabled without prerequisites:

- Direct table access bypasses tenancy → **data breach**
- PII columns exposed → **PIPEDA violation**
- No audit trail → **compliance failure**

**Do not shortcut this gate.**

---

## 9. Corrections to V1 Spec

### 9.1 Filter Operators

**V1 spec states** (Section 3, FilterOperator type):

```typescript
export type FilterOperator =
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "in"
  | "not_in"
  | "between"
  | "contains"
  | "starts_with"
  | "ends_with"
  | "is_null"
  | "is_not_null";
```

**Correction**: Current implementation supports only:

```typescript
export type FilterOperator =
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "in"
  | "between";
```

**Action**: Mark `not_in`, `contains`, `starts_with`, `ends_with`, `is_null`,
`is_not_null` as **Phase 2** features.

### 9.2 Aggregation Functions

**V1 spec states** (Section 3, AggregationType):

```typescript
export type AggregationType =
  | "count"
  | "count_distinct"
  | "sum"
  | "avg"
  | "min"
  | "max"
  | "median"
  | "percentile"
  | "stddev"
  | "variance"
  | "first"
  | "last"
  | "percent_of_total"
  | "percent_of_row"
  | "percent_of_column";
```

**Correction**: Current implementation supports only:

```typescript
type PivotMeasureMeta["aggregation"] = "count" | "sum" | "avg" | "min" | "max";
```

**Action**: Mark advanced aggregations as **Phase 2** features.

### 9.3 Export Formats

**V1 spec states**: PDF/PNG export for dashboards.

**Correction**: viaSport requirements (RP-AGG-005) specify CSV, Excel, JSON (optional).
PDF/PNG are **optional/future** unless explicitly committed.

### 9.4 Audit Logging Integration

**V1 spec ambiguity**: Proposes `bi_query_log` table but doesn't clarify relationship
to existing `export_history` and audit system.

**Correction**: Clarify integration:

| Event Type      | Storage                                        | Tamper-Evident Chain | Notes                              |
| --------------- | ---------------------------------------------- | -------------------- | ---------------------------------- |
| Query execution | `bi_query_log` (new)                           | **Own chain**        | All pivot/SQL queries              |
| Data export     | `export_history` (existing) + `logExportEvent` | Existing audit chain | Exports only                       |
| Report CRUD     | `logDataChange` (existing)                     | Existing audit chain | Create/update/delete saved reports |

**Chain Ownership Decision**:

`bi_query_log` maintains its **own tamper-evident chain**, separate from the existing
`audit_logs` chain. Rationale:

1. **Volume**: Query logs are high-volume (every pivot/SQL execution); mixing with
   general audit logs would bloat the main chain and slow integrity verification.
2. **Retention**: Query logs may have different retention policies (shorter) than
   compliance audit logs.
3. **Verification scope**: Auditors verifying BI activity don't need to traverse
   the entire system audit chain.

**Implementation**: Each `bi_query_log` entry includes:

- `previous_log_id`: UUID of prior entry in the BI query chain
- `checksum`: HMAC-SHA256 of `(entry_data || previous_checksum || secret)`

The BI query chain is anchored to the main audit chain via periodic "checkpoint"
entries in `audit_logs` that record the latest `bi_query_log.id` and its checksum.

### 9.5 Table of Contents

**V1 spec omission**: "Implementation Phases" section not in TOC.

**Correction**: Add to TOC:

```markdown
8. [Implementation Phases](#implementation-phases)
```

---

## 10. Migration Path

### 10.1 Module Transition

Phase 1 builds on the existing `features/reports` pivot+export capability.
The `features/bi` module becomes the long-term home for:

- Semantic datasets/metrics
- Dashboards
- Governed SQL workbench (if approved)

```
Current State:                    Target State:
─────────────                     ─────────────
src/features/reports/             src/features/bi/
├── reports.config.ts             ├── bi.schemas.ts
├── reports.mutations.ts  ──────► ├── bi.queries.ts
├── reports.schemas.ts            ├── bi.mutations.ts
├── reports.validation.ts         ├── semantic/
└── components/                   │   ├── datasets.config.ts (replaces reports.config.ts)
    └── report-pivot-builder.tsx  │   └── metrics.config.ts
                                  ├── engine/
                                  │   ├── pivot-aggregator.ts (from reports.mutations.ts)
                                  │   └── sql-executor.ts (new)
                                  ├── governance/
                                  │   └── (extract from reports.mutations.ts)
                                  └── components/
                                      └── pivot-builder/ (from reports/components)
```

### 10.2 Data Migration

| Step | Action                                            | Risk   |
| ---- | ------------------------------------------------- | ------ |
| 1    | Introduce `bi_*` tables alongside `saved_reports` | Low    |
| 2    | Dual-write to both tables during transition       | Medium |
| 3    | Migrate existing `saved_reports` to `bi_reports`  | Low    |
| 4    | Deprecate `saved_reports` (keep for rollback)     | Low    |
| 5    | Remove `saved_reports` table                      | Low    |

### 10.3 API Compatibility

Existing `runPivotQuery`, `exportPivotData`, etc. remain functional during transition.
New BI endpoints are added in parallel:

```typescript
// Existing (maintain compatibility)
export const runPivotQuery = createServerFn({ method: "POST" }); // ...

// New (BI module)
export const runBiQuery = createServerFn({ method: "POST" }); // ...
```

---

## 11. Open Questions

### 11.1 Decisions Needed

| Question                                                             | Options                   | Recommendation                 | Status |
| -------------------------------------------------------------------- | ------------------------- | ------------------------------ | ------ |
| Should `bi_query_log` use same tamper-evident chain as `audit_logs`? | Separate chain vs. shared | Separate chain for query audit | Open   |
| When should SQL Workbench be phase-gated?                            | Phase 3 vs. Phase 5       | Phase 3 with strict guardrails | Open   |
| Should dashboard cross-filtering be MVP?                             | MVP vs. Phase 5           | Phase 5 (complexity)           | Open   |
| Read replica for analytics queries?                                  | Same DB vs. replica       | Replica if available           | Open   |

### 11.2 Dependencies

| Dependency                      | Required For  | Status             |
| ------------------------------- | ------------- | ------------------ |
| Postgres 15+ (for RLS on views) | SQL Workbench | Verify RDS version |
| Read-only DB role               | SQL Workbench | To be created      |

---

## Appendix A: viaSport Requirements Reference

### RP-AGG-005 (Self-Service Analytics & Data Export)

> Enable authorized users to build ad-hoc charts, pivot tables, and export raw or
> aggregated datasets in CSV, Excel, or JSON (optional) without developer intervention.
>
> **Acceptance Criteria**: User builds a custom chart and exports underlying dataset
> to CSVs; export respects field-level access rules.

### RP-AGG-003 (Reporting Flow & Support)

> The system shall support automated reporting reminders, allow users to track data
> resubmissions, and visualize submitted data through dashboards.
>
> **Acceptance Criteria**: Users are reminded, track changes, and view data in a
> dashboard format.

### SEC-AGG-004 (Audit Trail & Data Lineage)

> The system shall maintain an immutable audit log of user actions, data changes,
> authentication events, and administrative configurations, supporting forensic
> review and regulatory reporting.
>
> **Acceptance Criteria**: Auditors can filter logs by user or record ID and export
> results; tamper-evident hashing verifies integrity of log entries.

### DM-AGG-003 (Data Governance & Access Control)

> The system shall enforce role-based access to data and provide administrators with
> secure database access, along with data cataloging and indexing capabilities for
> discoverability.
>
> **Acceptance Criteria**: Users can only access data based on permission.

### SEC-AGG-003 (Privacy & Regulatory Compliance)

> The system shall comply with relevant data protection laws (e.g., PIPEDA) to ensure
> secure handling, storage, and access to personal information.
>
> **Acceptance Criteria**: All sensitive data is encrypted and stored securely.

---

## Appendix B: Revised Implementation Phases

### Phase 1: Foundation (6-8 weeks)

**Goal**: Strengthen existing pivot builder to production quality.

- [ ] Add totals/subtotals to pivot table renderer
- [ ] Implement typed filter builder component (replace JSON input)
- [ ] Add `count_distinct` aggregation
- [ ] Improve chart formatting and options
- [ ] Add query result caching (5-min TTL)
- [ ] Document existing governance in codebase

**Acceptance**: Pivot builder usable without JSON filter input; exports work reliably.

### Phase 2: Semantic Layer (4-6 weeks)

**Goal**: Introduce curated datasets and metrics.

- [ ] Dataset definition schema & storage (`bi_datasets` table)
- [ ] Field metadata configuration (labels, types, formatting)
- [ ] Reusable metrics library (`bi_metrics` table)
- [ ] Advanced filter operators (`contains`, `is_null`, etc.)
- [ ] Advanced aggregations (`median`, `stddev`, `percentile`)
- [ ] Multi-table joins in query builder

**Acceptance**: Admins can define datasets; users select from curated fields.

### Phase 3: SQL Workbench (4-6 weeks)

**Goal**: Provide governed SQL access for power users.

**Prerequisites**: Database views, read-only role, RLS verified.

- [ ] SQL parser & validator (block DML/DDL)
- [ ] Query rewriter (table → view substitution)
- [ ] Parameter substitution (`{{param}}` syntax)
- [ ] Schema-aware autocomplete
- [ ] Query history
- [ ] Query cost guardrails
- [ ] `bi_query_log` audit table

**Acceptance**: Power users can write SELECT queries against curated datasets; all
queries audited; tenancy enforced at DB level.

### Phase 4: Dashboards (4-6 weeks)

**Goal**: Enable dashboard composition.

- [ ] Dashboard canvas with react-grid-layout
- [ ] Widget types (chart, pivot, KPI, text)
- [ ] Global filter controls (date range, org selector)
- [ ] Dashboard sharing (user, org-wide)
- [ ] Dashboard CRUD with audit logging

**Acceptance**: Users can create dashboards with multiple widgets; sharing works.

### Phase 5: Advanced Features (3-4 weeks)

**Goal**: Scale and polish.

- [ ] Cross-filtering between widgets
- [ ] SQL-side `GROUP BY ROLLUP` for large pivots
- [ ] Export scheduling (requires scheduler infrastructure)
- [ ] Dashboard PDF/PNG export (stretch goal)
- [ ] Query performance monitoring

**Acceptance**: Large datasets perform well; scheduled exports functional.

---

## Links

- [SPEC-solstice-bi-platform.md](./SPEC-solstice-bi-platform.md) (v1 spec - superseded, use for file structure reference only)
- [ADR-2025-12-26-d0-16](./ADR-2025-12-26-d0-16-analytics-charts-pivots-scope.md) (Accepted: ECharts pivot builder)
- [ADR-2025-12-30-d0-19](./ADR-2025-12-30-d0-19-bi-analytics-platform-direction.md) (Withdrawn: Evidence POC not pursued)
- [viaSport System Requirements](../source/VIASPORT-PROVIDED-system-requirements-addendum.md)
- [Current Implementation](../../../src/features/reports/reports.mutations.ts)
