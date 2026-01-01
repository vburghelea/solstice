# SQL Workbench Crash Report: SET LOCAL Parameterization

## Summary

Running a SQL Workbench query returned HTTP 500 and the UI stayed on "No rows
returned." Server logs showed a `DrizzleQueryError` caused by a parameterized
`SET LOCAL app.org_id = $1` statement.

## Reproduction (Before Fix)

1. Log in as an org user with SQL access.
2. Select an organization.
3. Navigate to `/dashboard/analytics/sql`.
4. Enter `SELECT * FROM organizations LIMIT 5`.
5. Click **Run query**.

**Observed:**

- Network request to `executeSqlQuery` returns 500.
- UI shows no results or query history update.
- Server log error:
  `syntax error at or near "$1"` for `SET LOCAL app.org_id = $1`.

## Root Cause

`executeSqlWorkbenchQuery` used prepared statements for `SET LOCAL`:

- `SET LOCAL app.org_id = $1`
- `SET LOCAL app.is_global_admin = $1`
- `SET LOCAL statement_timeout = $1`

Postgres does not accept bind parameters in `SET LOCAL`, so the server threw a
syntax error before executing the user query.

## Fix Applied

Switch `SET LOCAL` statements to `sql.raw(...)` with safe literal formatting so
the values are inlined (escaped) instead of parameterized.

## Relevant Files

- `src/features/bi/bi.sql-executor.ts`
  - Uses `sql.raw` + `formatSettingValue` to inline session settings.
