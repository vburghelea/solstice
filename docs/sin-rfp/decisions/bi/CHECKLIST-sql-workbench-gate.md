# SQL Workbench Prerequisites Checklist

**Status**: Not Started
**Last Updated**: 2025-12-30
**Owner**: Technical Architecture

---

> **CRITICAL**: SQL Workbench is **DISABLED BY DEFAULT** and **MUST NOT** be enabled
> until ALL prerequisites below are validated. This is a **hard gate**, not a
> recommendation.
>
> **Failure to complete these prerequisites before enabling SQL Workbench will result in:**
>
> - Direct table access bypassing tenancy → **data breach**
> - PII columns exposed → **PIPEDA violation**
> - No audit trail → **compliance failure**
>
> **Do not shortcut this gate.**

---

## Prerequisites Checklist

### 1. Database Views Created

| Status | Item                                                                   | Validation                                      | Owner    |
| ------ | ---------------------------------------------------------------------- | ----------------------------------------------- | -------- |
| [ ]    | `bi_v_organizations` view created                                      | View exists and excludes PII columns            | DBA      |
| [ ]    | `bi_v_members` view created                                            | View exists and excludes PII columns            | DBA      |
| [ ]    | `bi_v_form_submissions` view created                                   | View exists; payload filtered by classification | DBA      |
| [ ]    | `bi_v_events` view created                                             | View exists and excludes PII columns            | DBA      |
| [ ]    | All views exclude `email`, `phone`, `dateOfBirth`, `emergencyContact*` | Manual review complete                          | Security |

**SQL Template**:

```sql
CREATE OR REPLACE VIEW bi_v_organizations AS
SELECT
  id,
  name,
  slug,
  type,
  status,
  parent_org_id,
  created_at,
  updated_at
  -- EXCLUDED: No PII columns
FROM organizations
WHERE
  -- Tenant scoping via session variable
  organization_id = current_setting('app.org_id', true)::uuid
  OR current_setting('app.is_global_admin', true)::boolean = true;
```

**Evidence**:

- [ ] Screenshot of `\d bi_v_organizations` showing columns
- [ ] Query result showing tenant isolation works

---

### 2. Row-Level Security (RLS) Active

| Status | Item                                  | Validation                                                                  | Owner    |
| ------ | ------------------------------------- | --------------------------------------------------------------------------- | -------- |
| [ ]    | RLS enabled on all `bi_v_*` views     | `SELECT relrowsecurity FROM pg_class WHERE relname = 'bi_v_*'` returns true | DBA      |
| [ ]    | RLS policy enforces org scoping       | Query from user context returns only their org's data                       | DBA      |
| [ ]    | Global admin bypass works             | Query with `app.is_global_admin = true` returns all data                    | DBA      |
| [ ]    | Cross-org query blocked for non-admin | Query attempting cross-org access returns empty or errors                   | Security |

**Validation Query**:

```sql
-- Set context as regular user
SET app.org_id = 'org-uuid-1';
SET app.is_global_admin = false;

-- Should return only org-uuid-1 data
SELECT * FROM bi_v_organizations;

-- Attempt cross-org (should return empty)
SELECT * FROM bi_v_organizations WHERE organization_id = 'org-uuid-2';
```

**Evidence**:

- [ ] Query output showing tenant isolation
- [ ] Query output showing global admin access

---

### 3. Read-Only Database Role Created

| Status | Item                                     | Validation                                             | Owner |
| ------ | ---------------------------------------- | ------------------------------------------------------ | ----- |
| [ ]    | `bi_readonly` role exists                | `SELECT 1 FROM pg_roles WHERE rolname = 'bi_readonly'` | DBA   |
| [ ]    | Role has `SELECT` only on `bi_v_*` views | `\dp bi_v_*` shows SELECT grant                        | DBA   |
| [ ]    | Role cannot INSERT/UPDATE/DELETE         | Attempt fails with permission denied                   | DBA   |
| [ ]    | Role cannot access raw tables            | `SELECT * FROM organizations` fails                    | DBA   |
| [ ]    | Role cannot create objects               | `CREATE TABLE test_evil (id INT)` fails                | DBA   |

**SQL to Create**:

```sql
-- Create role
CREATE ROLE bi_readonly NOLOGIN;

-- Grant SELECT on views only
GRANT SELECT ON bi_v_organizations TO bi_readonly;
GRANT SELECT ON bi_v_members TO bi_readonly;
GRANT SELECT ON bi_v_form_submissions TO bi_readonly;
GRANT SELECT ON bi_v_events TO bi_readonly;

-- Explicitly deny on raw tables (defense in depth)
REVOKE ALL ON organizations FROM bi_readonly;
REVOKE ALL ON users FROM bi_readonly;
-- etc.
```

**Evidence**:

- [ ] `\du bi_readonly` output
- [ ] `\dp bi_v_*` output showing grants
- [ ] Screenshot of INSERT attempt failing

---

### 4. Session Context Injection Implemented

| Status | Item                                                  | Validation               | Owner    |
| ------ | ----------------------------------------------------- | ------------------------ | -------- |
| [ ]    | `SET app.org_id` executed before every query          | Code review complete     | Backend  |
| [ ]    | `SET app.is_global_admin` executed before every query | Code review complete     | Backend  |
| [ ]    | Context cleared after query                           | Code review complete     | Backend  |
| [ ]    | Context injection cannot be bypassed by user input    | Security review complete | Security |

**Code Pattern**:

```typescript
async function executeUserQuery(
  sql: string,
  user: User,
  orgId: string | null,
): Promise<QueryResult> {
  const isGlobalAdmin = await PermissionService.isGlobalAdmin(user.id);

  return await db.transaction(async (tx) => {
    // Set session context BEFORE any user query
    await tx.execute(sql`SET LOCAL app.org_id = ${orgId}`);
    await tx.execute(sql`SET LOCAL app.is_global_admin = ${isGlobalAdmin}`);

    // Execute user query with context set
    const result = await tx.execute(userSql);

    // Context automatically cleared when transaction ends
    return result;
  });
}
```

**Evidence**:

- [ ] Code review sign-off
- [ ] Unit test showing context is set

---

### 5. Query Rewriter Deployed

| Status | Item                                   | Validation       | Owner   |
| ------ | -------------------------------------- | ---------------- | ------- |
| [ ]    | Table names rewritten to view names    | Unit tests pass  | Backend |
| [ ]    | `organizations` → `bi_v_organizations` | Test case passes | Backend |
| [ ]    | `users` → blocked (no view)            | Test case passes | Backend |
| [ ]    | JOINs to non-dataset tables blocked    | Test case passes | Backend |
| [ ]    | Subqueries rewritten correctly         | Test case passes | Backend |

**Test Cases**:

```typescript
// Should rewrite
expect(rewrite("SELECT * FROM organizations")).toBe("SELECT * FROM bi_v_organizations");

// Should rewrite JOINs
expect(rewrite("SELECT * FROM organizations o JOIN members m ON ...")).toBe(
  "SELECT * FROM bi_v_organizations o JOIN bi_v_members m ON ...",
);

// Should block disallowed tables
expect(() => rewrite("SELECT * FROM users")).toThrow("Table 'users' not in dataset");
```

**Evidence**:

- [ ] Test results screenshot
- [ ] Code review sign-off

---

### 6. Query Guardrails Enforced

| Status | Item                                | Validation                           | Owner   |
| ------ | ----------------------------------- | ------------------------------------ | ------- |
| [ ]    | Statement timeout configured (30s)  | `SHOW statement_timeout` in session  | Backend |
| [ ]    | Max rows returned enforced (10,000) | Query with >10K rows truncates       | Backend |
| [ ]    | Max export rows enforced (100,000)  | Export with >100K rows rejected      | Backend |
| [ ]    | Query cost check implemented        | High-cost query rejected             | Backend |
| [ ]    | Concurrent query limit (2 per user) | 3rd concurrent query queued/rejected | Backend |

**Configuration**:

```typescript
const QUERY_GUARDRAILS = {
  statementTimeoutMs: 30000,
  maxRowsUi: 10000,
  maxRowsExport: 100000,
  maxEstimatedCost: 100000,
  maxConcurrentPerUser: 2,
  maxConcurrentPerOrg: 5,
};
```

**Evidence**:

- [ ] Test showing timeout works
- [ ] Test showing row limit works
- [ ] Test showing cost rejection works

---

### 7. Audit Logging Active

| Status | Item                                                | Validation                               | Owner   |
| ------ | --------------------------------------------------- | ---------------------------------------- | ------- |
| [ ]    | `bi_query_log` table created                        | Table exists in schema                   | Backend |
| [ ]    | All queries logged                                  | Integration test passes                  | Backend |
| [ ]    | Log includes: user, org, query hash, execution time | Log entry inspection                     | Backend |
| [ ]    | Tamper-evident chain implemented                    | `previous_log_id` + `checksum` populated | Backend |
| [ ]    | Chain integrity verifiable                          | Verification script passes               | Backend |

**Schema**:

```sql
CREATE TABLE bi_query_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES "user"(id),
  organization_id UUID REFERENCES organizations(id),
  query_type TEXT NOT NULL,  -- 'pivot' | 'sql' | 'export'
  query_hash TEXT NOT NULL,
  dataset_id UUID,
  sql_query TEXT,
  parameters JSONB,
  rows_returned INTEGER,
  execution_time_ms INTEGER,
  previous_log_id UUID,  -- Tamper-evident chain
  checksum TEXT,          -- HMAC-SHA256
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Evidence**:

- [ ] Sample log entry
- [ ] Chain verification output

---

### 8. Security Review Complete

| Status | Item                            | Validation                     | Owner    |
| ------ | ------------------------------- | ------------------------------ | -------- |
| [ ]    | SQL injection test suite passed | All injection patterns blocked | Security |
| [ ]    | Penetration test scheduled      | Date: **\_\_\_\_**             | Security |
| [ ]    | Penetration test completed      | Report attached                | Security |
| [ ]    | Findings remediated             | All critical/high fixed        | Backend  |
| [ ]    | Security sign-off obtained      | Signature below                | Security |

**Test Suite Requirements**:

- Test against OWASP SQL injection cheatsheet
- Test against common bypass techniques
- Test parameter injection
- Test encoding-based injection
- Test multi-statement injection

**Evidence**:

- [ ] Penetration test report
- [ ] Remediation evidence

---

## Sign-Off Section

SQL Workbench may be enabled only when ALL prerequisites are complete and signed off.

| Role             | Name | Date | Signature |
| ---------------- | ---- | ---- | --------- |
| Engineering Lead |      |      |           |
| Security Lead    |      |      |           |
| Product Owner    |      |      |           |
| DBA              |      |      |           |

---

## Enablement Process

Once all sign-offs are obtained:

1. **Create ticket** for SQL Workbench enablement
2. **Set feature flag** per tenant:
   ```sql
   INSERT INTO feature_flags (tenant_id, flag_name, enabled)
   VALUES ('tenant-uuid', 'sql_workbench_enabled', true);
   ```
3. **Initial rollout** to admin users only (2 weeks)
4. **Monitor audit logs** for anomalies
5. **Expand rollout** after soak period

---

## Rollback Plan

If issues discovered after enablement:

1. **Disable feature flag immediately**:
   ```sql
   UPDATE feature_flags SET enabled = false
   WHERE flag_name = 'sql_workbench_enabled';
   ```
2. **Audit log review** for suspicious queries
3. **Incident report** if data exposure suspected
4. **Root cause analysis** before re-enablement

---

## Links

- [SPEC-bi-platform.md](./SPEC-bi-platform.md) - Platform specification
- [PLAN-bi-implementation.md](./PLAN-bi-implementation.md) - Implementation plan (Slice 4)
- [GUIDE-bi-testing.md](./GUIDE-bi-testing.md) - SQL parser test cases
- [OWASP SQL Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
