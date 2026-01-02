-- Performance Test Data Generation Script
-- Generates ~20M rows of synthetic data for load testing
-- Run against sin-perf database only
--
-- Target distribution (reduced for practical perf testing):
-- - 5M form_submissions
-- - 3M audit_logs
-- - 2M form_submission_versions
--
-- Run via: AWS_PROFILE=techdev npx sst shell --stage sin-perf -- psql ... -f scripts/generate-perf-data.sql

-- Ensure pgcrypto is available
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Pre-load arrays of IDs for efficient lookups (avoids slow subqueries)
DO $$
DECLARE
  form_ids uuid[];
  form_version_ids uuid[];
  org_ids uuid[];
  user_ids text[];
  batch_size int := 500000;
  total_submissions int;
  total_audits int;
  i int;
BEGIN
  -- Load existing IDs into arrays
  SELECT array_agg(id) INTO form_ids FROM forms;
  SELECT array_agg(id) INTO form_version_ids FROM form_versions;
  SELECT array_agg(id) INTO org_ids FROM organizations;
  SELECT array_agg(id) INTO user_ids FROM "user";

  -- Safety check
  IF form_ids IS NULL OR array_length(form_ids, 1) = 0 THEN
    RAISE EXCEPTION 'No forms found. Run seed script first.';
  END IF;

  RAISE NOTICE '=== Performance Data Generation ===';
  RAISE NOTICE 'Using % forms, % versions, % orgs, % users',
    array_length(form_ids, 1),
    array_length(form_version_ids, 1),
    array_length(org_ids, 1),
    array_length(user_ids, 1);

  -- ===========================================
  -- Phase 1: Generate form_submissions (5M rows in 10 batches of 500k)
  -- ===========================================
  RAISE NOTICE '';
  RAISE NOTICE 'Phase 1: Generating form_submissions...';

  FOR i IN 1..10 LOOP
    INSERT INTO form_submissions (
      id, form_id, form_version_id, organization_id, submitter_id, status,
      payload, completeness_score, submitted_at, created_at, updated_at
    )
    SELECT
      gen_random_uuid(),
      form_ids[1 + (g % array_length(form_ids, 1))],
      form_version_ids[1 + (g % array_length(form_version_ids, 1))],
      org_ids[1 + (g % array_length(org_ids, 1))],
      user_ids[1 + (g % array_length(user_ids, 1))],
      (ARRAY['draft', 'submitted', 'under_review', 'approved', 'rejected']::form_submission_status[])[1 + (g % 5)],
      jsonb_build_object(
        'participant_count', 50 + (g % 950),
        'revenue', 10000 + (g % 90000),
        'expenses', 8000 + (g % 72000),
        'fiscal_year', 2020 + (g % 6),
        'batch', i
      ),
      50 + (g % 51),
      NOW() - ((g % 1825) * interval '1 day'),
      NOW() - ((g % 1825) * interval '1 day'),
      NOW() - ((g % 1095) * interval '1 day')
    FROM generate_series(1, batch_size) g;

    GET DIAGNOSTICS total_submissions = ROW_COUNT;
    RAISE NOTICE '  Batch %/10 complete (% rows inserted)', i, total_submissions;
  END LOOP;

  -- ===========================================
  -- Phase 2: Generate audit_logs (3M rows in 6 batches of 500k)
  -- ===========================================
  RAISE NOTICE '';
  RAISE NOTICE 'Phase 2: Generating audit_logs...';

  FOR i IN 1..6 LOOP
    INSERT INTO audit_logs (
      id, occurred_at, actor_user_id, action, action_category,
      target_type, target_id, metadata, request_id, prev_hash, entry_hash, created_at
    )
    SELECT
      gen_random_uuid(),
      NOW() - ((g % 1095) * interval '1 day') - ((g % 86400) * interval '1 second'),
      user_ids[1 + (g % array_length(user_ids, 1))],
      (ARRAY['view', 'create', 'update', 'delete', 'submit', 'approve', 'reject', 'login', 'export'])[1 + (g % 9)],
      (ARRAY['auth', 'form', 'report', 'org', 'user', 'system'])[1 + (g % 6)],
      (ARRAY['form_submission', 'organization', 'user', 'report', 'form'])[1 + (g % 5)],
      gen_random_uuid()::text,
      jsonb_build_object(
        'ip', '10.' || (g % 256) || '.' || ((g / 256) % 256) || '.' || ((g / 65536) % 256),
        'session_id', 'sess_' || ((i - 1) * batch_size + g)
      ),
      'req_' || gen_random_uuid()::text,
      NULL,
      encode(sha256(('entry_' || ((i - 1) * batch_size + g))::bytea), 'hex'),
      NOW() - ((g % 1095) * interval '1 day')
    FROM generate_series(1, batch_size) g;

    GET DIAGNOSTICS total_audits = ROW_COUNT;
    RAISE NOTICE '  Batch %/6 complete (% rows inserted)', i, total_audits;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '=== Data generation complete ===';
END $$;

-- Analyze tables for query optimization
VACUUM (ANALYZE) form_submissions;
VACUUM (ANALYZE) audit_logs;

-- Show final counts
SELECT
  'form_submissions' as table_name, count(*) as row_count FROM form_submissions
UNION ALL SELECT
  'audit_logs', count(*) FROM audit_logs
UNION ALL SELECT
  'form_submission_versions', count(*) FROM form_submission_versions
UNION ALL SELECT
  'reporting_submissions', count(*) FROM reporting_submissions
ORDER BY row_count DESC;
