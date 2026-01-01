-- SQL Workbench Evidence Collection
-- Use in psql. Replace the UUID placeholders before running, or pass:
--   psql -v org_id=<uuid> -f src/features/bi/docs/sql-workbench-evidence.sql

\set ON_ERROR_STOP 0
\if :{?org_id}
\else
\set org_id '00000000-0000-0000-0000-000000000001'
\endif

\echo '0) Role + grants'
\du bi_readonly
\dp bi_v_*

\echo '1) View definitions'
\d+ bi_v_organizations
\d+ bi_v_reporting_submissions
\d+ bi_v_form_submissions
\d+ bi_v_events

\echo '2) security_barrier verification'
SELECT relname, reloptions
FROM pg_class
WHERE relname IN (
  'bi_v_organizations',
  'bi_v_reporting_submissions',
  'bi_v_form_submissions',
  'bi_v_events'
);

\echo '3) Non-admin scoping (should return only scoped rows)'
BEGIN;
  SET LOCAL app.org_id = :'org_id';
  SET LOCAL app.is_global_admin = 'false';

  SELECT COUNT(*) AS org_count FROM bi_v_organizations;
  SELECT COUNT(*) AS reporting_count FROM bi_v_reporting_submissions;
  SELECT COUNT(*) AS form_count FROM bi_v_form_submissions;

  SELECT COUNT(*) AS org_cross_check
  FROM bi_v_organizations
  WHERE id <> :'org_id';

  SELECT COUNT(*) AS reporting_cross_check
  FROM bi_v_reporting_submissions
  WHERE organization_id <> :'org_id';

  SELECT COUNT(*) AS form_cross_check
  FROM bi_v_form_submissions
  WHERE organization_id <> :'org_id';
ROLLBACK;

\echo '4) Global admin scoping (should return multiple rows)'
BEGIN;
  SET LOCAL app.org_id = '';
  SET LOCAL app.is_global_admin = 'true';

  SELECT COUNT(*) AS org_count FROM bi_v_organizations;
  SELECT COUNT(*) AS reporting_count FROM bi_v_reporting_submissions;
  SELECT COUNT(*) AS form_count FROM bi_v_form_submissions;
ROLLBACK;

\echo '5) Missing context (should return zero rows for scoped views)'
BEGIN;
  RESET app.org_id;
  RESET app.is_global_admin;

  SELECT COUNT(*) AS org_count FROM bi_v_organizations;
  SELECT COUNT(*) AS reporting_count FROM bi_v_reporting_submissions;
  SELECT COUNT(*) AS form_count FROM bi_v_form_submissions;
ROLLBACK;

\echo '6) Read-only role verification (should fail on raw tables)'
BEGIN;
  SET LOCAL ROLE bi_readonly;

  SELECT COUNT(*) AS org_count FROM bi_v_organizations;
  SELECT COUNT(*) AS reporting_count FROM bi_v_reporting_submissions;
  SELECT COUNT(*) AS form_count FROM bi_v_form_submissions;
  SELECT COUNT(*) AS events_count FROM bi_v_events;

  -- Expected failures
  SAVEPOINT raw_table_check;
  SELECT * FROM organizations LIMIT 1;
  ROLLBACK TO SAVEPOINT raw_table_check;

  SAVEPOINT create_table_check;
  CREATE TABLE bi_should_fail(id integer);
  ROLLBACK TO SAVEPOINT create_table_check;
ROLLBACK;
