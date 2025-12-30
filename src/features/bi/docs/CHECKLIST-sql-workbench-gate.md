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
> - Direct table access bypassing tenancy -> **data breach**
> - PII columns exposed -> **PIPEDA violation**
> - No audit trail -> **compliance failure**
>
> **Do not shortcut this gate.**

---

## What "Enabled" Means (so we don't drift)

SQL Workbench is considered "enabled" only when ALL of the following are true:

1. The route/UI is visible (feature gate on).
2. The backend endpoint accepts SQL requests.
3. SQL executes using **read-only DB privileges** and **DB-level scoping**.
4. Every query is guardrailed + audited.

This checklist gates #2-#4. UI gating is separate but required for rollout.

---

## Prerequisites Checklist

### 0. Feature Gate Exists and Defaults to OFF

| Status | Item                                                    | Validation                                                      | Owner    |
| ------ | ------------------------------------------------------- | --------------------------------------------------------------- | -------- |
| [ ]    | Feature key exists (e.g. `sin_analytics_sql_workbench`) | `src/tenant/tenant.types.ts` contains key                       | Backend  |
| [ ]    | Feature defaults OFF in all tenants                     | `src/tenant/tenants/*.ts`                                       | Backend  |
| [ ]    | Route/server/nav gated by feature key                   | `requireFeatureInRoute`/`assertFeatureEnabled` + nav `feature:` | Frontend |

**Notes**

- This repo uses **code-based tenant feature gates**, not a DB `feature_flags` table.
- If you later add DB-driven feature flags, update this section accordingly.

---

### 1. Curated BI Views Created (No PII)

| Status | Item                                 | Validation                                                   | Owner    |
| ------ | ------------------------------------ | ------------------------------------------------------------ | -------- |
| [ ]    | `bi_v_organizations` view created    | View exists; contains no PII columns                         | DBA      |
| [ ]    | `bi_v_members` view created          | View exists; contains no PII columns                         | DBA      |
| [ ]    | `bi_v_form_submissions` view created | View exists; **no raw payload** unless sanitized/allowlisted | DBA      |
| [ ]    | `bi_v_events` view created           | View exists; contains no PII columns                         | DBA      |
| [ ]    | Views created as `security_barrier`  | `pg_class.reloptions` includes `security_barrier=true`       | Security |

**Rule**: If a field might contain PII (especially JSON payloads), it must be:

- excluded from SQL Workbench views, **or**
- surfaced only through an explicit sanitizer / allowlist mechanism.

**SQL Template (Organizations)**

```sql
CREATE OR REPLACE VIEW bi_v_organizations
WITH (security_barrier = true) AS
SELECT
  id,
  name,
  slug,
  type,
  status,
  parent_org_id,
  created_at,
  updated_at
FROM organizations
WHERE
  -- org-scoped: default is "only my org"
  id = NULLIF(current_setting('app.org_id', true), '')::uuid
  OR COALESCE(NULLIF(current_setting('app.is_global_admin', true), ''), 'false')::boolean = true;
```

> **Why `NULLIF/COALESCE`?**
> `current_setting(..., true)` returns NULL if unset. Casting NULL directly can error.
> This pattern fails closed when app context is missing.

**Evidence**:

- [ ] `\d+ bi_v_organizations` output showing columns
- [ ] `SELECT * FROM bi_v_organizations` as non-admin returns only the scoped org row
- [ ] `SELECT reloptions FROM pg_class WHERE relname='bi_v_organizations'` includes `security_barrier=true`

---

### 2. DB-Level Scoping Proven (Behavioral)

> Postgres RLS applies to tables, not regular views. We require behaviorally-proven scoping
> on curated views (RLS on underlying tables is optional defense-in-depth).
> See: https://www.postgresql.org/docs/current/ddl-rowsecurity.html

| Status | Item                            | Validation                               | Owner    |
| ------ | ------------------------------- | ---------------------------------------- | -------- |
| [ ]    | Non-admin scope enforced        | Scoped session returns only allowed rows | DBA      |
| [ ]    | Global admin scope works        | Admin session can return all rows        | DBA      |
| [ ]    | Missing context returns no rows | Unset context yields zero rows           | Security |

**Validation Query**

```sql
-- Simulate regular user
BEGIN;
  SET LOCAL app.org_id = '00000000-0000-0000-0000-000000000001';
  SET LOCAL app.is_global_admin = 'false';

  -- Should return only that org row
  SELECT * FROM bi_v_organizations;

  -- Attempt cross-org (should return empty)
  SELECT * FROM bi_v_organizations
  WHERE id = '00000000-0000-0000-0000-000000000002';
ROLLBACK;

-- Simulate global admin
BEGIN;
  SET LOCAL app.org_id = '';
  SET LOCAL app.is_global_admin = 'true';

  -- Should return multiple rows
  SELECT COUNT(*) FROM bi_v_organizations;
ROLLBACK;

-- Missing context (non-admin)
BEGIN;
  RESET app.org_id;
  RESET app.is_global_admin;

  -- Should return 0 rows (security default)
  SELECT COUNT(*) FROM bi_v_organizations;
ROLLBACK;
```

**Evidence**:

- [ ] Query outputs captured (copy/paste or screenshots)

---

### 3. Read-Only Execution Role Exists (and is Actually Used)

| Status | Item                                     | Validation                                                       | Owner |
| ------ | ---------------------------------------- | ---------------------------------------------------------------- | ----- |
| [ ]    | `bi_readonly` role exists                | `SELECT 1 FROM pg_roles WHERE rolname='bi_readonly'`             | DBA   |
| [ ]    | Role has SELECT only on `bi_v_*` views   | `\dp bi_v_*` shows SELECT grants                                 | DBA   |
| [ ]    | Role has **no** privileges on raw tables | `SELECT * FROM organizations` fails under `SET ROLE bi_readonly` | DBA   |
| [ ]    | Role cannot create objects               | `CREATE TABLE ...` fails under `SET ROLE bi_readonly`            | DBA   |

**Important Implementation Detail (App Side)**
The application must execute user SQL under **this role** using:

- `SET LOCAL ROLE bi_readonly;` (inside a transaction)

Do **not** rely on "we just won't query tables." Use the DB to enforce.

**SQL to Create Role + Lock Schema**

```sql
-- Group role (no login)
CREATE ROLE bi_readonly NOLOGIN;

-- Ensure it can't create objects in public schema
REVOKE CREATE ON SCHEMA public FROM bi_readonly;
REVOKE USAGE ON SCHEMA public FROM bi_readonly;

-- Allow usage on schema that contains BI views (public if you keep them there)
GRANT USAGE ON SCHEMA public TO bi_readonly;

-- Grant SELECT on curated views only
GRANT SELECT ON bi_v_organizations TO bi_readonly;
GRANT SELECT ON bi_v_members TO bi_readonly;
GRANT SELECT ON bi_v_form_submissions TO bi_readonly;
GRANT SELECT ON bi_v_events TO bi_readonly;

-- Defense in depth: explicitly revoke on raw tables
REVOKE ALL ON organizations FROM bi_readonly;
-- Repeat for other raw tables
```

**Evidence**:

- [ ] `\du bi_readonly` output
- [ ] `\dp bi_v_*` output showing grants
- [ ] Transcript showing `SET ROLE bi_readonly; SELECT * FROM organizations;` fails

---

### 4. Session Context Injection Implemented (and Un-bypassable)

| Status | Item                                                        | Validation                                      | Owner    |
| ------ | ----------------------------------------------------------- | ----------------------------------------------- | -------- |
| [ ]    | `SET LOCAL app.org_id` executed before every query          | Code review                                     | Backend  |
| [ ]    | `SET LOCAL app.is_global_admin` executed before every query | Code review                                     | Backend  |
| [ ]    | Query runs inside a transaction                             | Unit/integration test                           | Backend  |
| [ ]    | User SQL cannot change session/role                         | Parser rejects `SET`, `RESET`, `SET ROLE`, etc. | Security |

**Code Pattern**

```ts
async function executeSqlWorkbenchQuery(
  userSqlText: string,
  user: User,
  orgId: string | null,
): Promise<QueryResult> {
  const isGlobalAdmin = await PermissionService.isGlobalAdmin(user.id);

  return db.transaction(async (tx) => {
    // 1) Run as read-only role
    await tx.execute(sql`SET LOCAL ROLE bi_readonly`);

    // 2) Set scope context
    await tx.execute(sql`SET LOCAL app.org_id = ${orgId ?? ""}`);
    await tx.execute(sql`SET LOCAL app.is_global_admin = ${String(isGlobalAdmin)}`);

    // 3) Execute prepared SQL (after parsing/rewriting/parameterization)
    return tx.execute(userSqlPrepared);
  });
}
```

**Evidence**:

- [ ] Unit test proves `SET LOCAL ROLE` and context are applied
- [ ] Parser test proves user cannot include `SET`, `RESET`, `SET ROLE` statements

---

### 5. AST Parser + Rewriter Deployed (SELECT-only)

| Status | Item                                | Validation  | Owner    |
| ------ | ----------------------------------- | ----------- | -------- |
| [ ]    | Only a single SELECT is allowed     | Unit tests  | Backend  |
| [ ]    | Table names rewritten to view names | Unit tests  | Backend  |
| [ ]    | Disallowed tables rejected          | Unit tests  | Backend  |
| [ ]    | Rewriting is AST-based (not regex)  | Code review | Security |

**Rule**: Only a single SELECT statement is allowed (including WITH/CTE). Everything
else is rejected.

**Minimum Test Cases**

```ts
// Allow only SELECT
expect(isValid("SELECT 1")).toBe(true);
expect(isValid("WITH x AS (SELECT 1) SELECT * FROM x")).toBe(true);

// Reject anything else
expect(isValid("SET app.org_id = 'x'")).toBe(false);
expect(isValid("INSERT INTO x VALUES (1)")).toBe(false);
expect(isValid("SELECT 1; SELECT 2")).toBe(false);

// Rewrite tables -> views
expect(rewrite("SELECT * FROM organizations")).toBe("SELECT * FROM bi_v_organizations");

// Block disallowed tables (post-rewrite validation)
expect(() => validateDataset("SELECT * FROM users")).toThrow();
```

**Evidence**:

- [ ] Test output / CI run
- [ ] Code review sign-off

---

### 6. Query Guardrails Enforced (Timeout, Limit, Cost)

| Status | Item                                              | Validation            | Owner   |
| ------ | ------------------------------------------------- | --------------------- | ------- |
| [ ]    | Timeout applied via `SET LOCAL statement_timeout` | Integration test      | Backend |
| [ ]    | UI row limit enforced (e.g. 10,000)               | Integration test      | Backend |
| [ ]    | Export row limit enforced (e.g. 100,000)          | Integration test      | Backend |
| [ ]    | Cost check via `EXPLAIN (FORMAT JSON)`            | Unit/integration test | Backend |
| [ ]    | Concurrency limit enforced (per user/org)         | Integration test      | Backend |

**Guardrails Config**

```ts
export const QUERY_GUARDRAILS = {
  statementTimeoutMs: 30000,
  maxRowsUi: 10000,
  maxRowsExport: 100000,
  maxEstimatedCost: 100000,
  maxConcurrentPerUser: 2,
  maxConcurrentPerOrg: 5,
};
```

**Evidence**:

- [ ] Timeout test
- [ ] Limit enforcement test
- [ ] Explain cost rejection test

---

### 7. Audit Logging Active (Tamper-Evident Chain)

| Status | Item                                                   | Validation                | Owner    |
| ------ | ------------------------------------------------------ | ------------------------- | -------- |
| [ ]    | `bi_query_log` table exists                            | Drizzle migration applied | Backend  |
| [ ]    | All SQL workbench queries logged                       | Integration test          | Backend  |
| [ ]    | Chain fields populated (`previous_log_id`, `checksum`) | Inspection                | Security |
| [ ]    | Chain verification script passes                       | Script output             | Security |

**Checksum Rule (documented + implemented)**
`checksum = HMAC_SHA256(secret, canonical_json(entry_without_checksum) || prev_checksum)`

**Evidence**:

- [ ] Sample log row
- [ ] Verification output

---

### 8. Security Review Complete

| Status | Item                        | Validation                | Owner    |
| ------ | --------------------------- | ------------------------- | -------- |
| [ ]    | SQL injection suite passed  | All patterns blocked      | Security |
| [ ]    | Query boundary tests passed | No role/session tampering | Security |
| [ ]    | Pen test scheduled          | Date: \_\_\_\_            | Security |
| [ ]    | Pen test complete           | Report attached           | Security |
| [ ]    | Findings remediated         | All critical/high fixed   | Backend  |
| [ ]    | Sign-off obtained           | Signature                 | Security |

**Must-Test Cases (non-exhaustive)**

- Multi-statement: `SELECT 1; DROP TABLE ...`
- Session/role: `SET ROLE ...`, `SET app.is_global_admin = true`, `RESET app.org_id`
- Transaction statements: `BEGIN`, `COMMIT`, `ROLLBACK`
- COPY/DO/CALL/VACUUM/ANALYZE
- Comment + encoding bypass attempts

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

## Enablement Process (Repo-Accurate)

Once all sign-offs are obtained:

1. Add a feature key (example): `sin_analytics_sql_workbench` to:
   - `src/tenant/tenant.types.ts`
   - `src/tenant/tenants/qc.ts` (false)
   - `src/tenant/tenants/viasport.ts` (start false)
2. Gate the route + nav item on that feature key (`requireFeatureInRoute`, nav `feature:`).
3. Gate SQL workbench server functions with `assertFeatureEnabled` + permission `analytics.sql`.
4. Enable **viasport** only by flipping it true in `src/tenant/tenants/viasport.ts`.
5. Rollout to admin users only (timeboxed).
6. Monitor `bi_query_log` for anomalies.
7. Expand rollout after soak period.

---

## Rollback Plan

For internal-only testing, rollback is simply: flip the feature key to `false` and redeploy.

For external/public users:

1. Flip feature key back to `false` in tenant config.
2. Review `bi_query_log` and export history for suspicious activity.
3. Incident report if exposure suspected.
4. Root cause analysis before re-enablement.

---

## Links

- [SPEC-bi-platform.md](./SPEC-bi-platform.md) - Platform specification
- [PLAN-bi-implementation.md](./PLAN-bi-implementation.md) - Implementation plan (Slice 4)
- [GUIDE-bi-testing.md](./GUIDE-bi-testing.md) - SQL parser test cases
- [OWASP SQL Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
- [PostgreSQL Row Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
