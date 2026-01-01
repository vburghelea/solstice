-- SQL Workbench DBA Setup
-- Curated views + read-only role for governed SQL access.
-- Run in psql as a superuser or migration role.

-- =============================================================================
-- 1) Curated views (no PII)
-- =============================================================================

CREATE OR REPLACE VIEW bi_v_organizations
WITH (security_barrier = true) AS
SELECT
  id,
  name,
  slug,
  type,
  parent_org_id,
  status,
  created_at,
  updated_at
FROM organizations
WHERE
  id = NULLIF(current_setting('app.org_id', true), '')::uuid
  OR COALESCE(NULLIF(current_setting('app.is_global_admin', true), ''), 'false')::boolean = true;

CREATE OR REPLACE VIEW bi_v_reporting_submissions
WITH (security_barrier = true) AS
SELECT
  id,
  task_id,
  organization_id,
  form_submission_id,
  status,
  submitted_at,
  submitted_by,
  reviewed_at,
  reviewed_by,
  review_notes,
  created_at,
  updated_at
FROM reporting_submissions
WHERE
  organization_id = NULLIF(current_setting('app.org_id', true), '')::uuid
  OR COALESCE(NULLIF(current_setting('app.is_global_admin', true), ''), 'false')::boolean = true;

CREATE OR REPLACE VIEW bi_v_form_submissions
WITH (security_barrier = true) AS
SELECT
  id,
  form_id,
  form_version_id,
  organization_id,
  import_job_id,
  submitter_id,
  status,
  completeness_score,
  missing_fields,
  validation_errors,
  submitted_at,
  reviewed_by,
  reviewed_at,
  review_notes,
  created_at,
  updated_at
FROM form_submissions
WHERE
  organization_id = NULLIF(current_setting('app.org_id', true), '')::uuid
  OR COALESCE(NULLIF(current_setting('app.is_global_admin', true), ''), 'false')::boolean = true;

-- Events are not org-scoped (no organization_id in the table).
CREATE OR REPLACE VIEW bi_v_events
WITH (security_barrier = true) AS
SELECT
  id,
  name,
  type,
  status,
  start_date,
  end_date,
  created_at
FROM events;

-- =============================================================================
-- 2) Read-only role + grants
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'bi_readonly') THEN
    CREATE ROLE bi_readonly NOLOGIN;
  END IF;
END $$;

REVOKE CREATE ON SCHEMA public FROM bi_readonly;
REVOKE USAGE ON SCHEMA public FROM bi_readonly;
GRANT USAGE ON SCHEMA public TO bi_readonly;

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM bi_readonly;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM bi_readonly;

GRANT SELECT ON bi_v_organizations TO bi_readonly;
GRANT SELECT ON bi_v_reporting_submissions TO bi_readonly;
GRANT SELECT ON bi_v_form_submissions TO bi_readonly;
GRANT SELECT ON bi_v_events TO bi_readonly;

-- Defense in depth: explicit revokes on raw tables.
REVOKE ALL ON organizations FROM bi_readonly;
REVOKE ALL ON reporting_submissions FROM bi_readonly;
REVOKE ALL ON form_submissions FROM bi_readonly;
REVOKE ALL ON events FROM bi_readonly;
