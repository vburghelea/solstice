# F-004 Migration Status - RESOLVED

## Summary

The sin-dev database migration system has been reset to a clean baseline and the
foreign key names that previously exceeded Postgres's 63-character limit now
have explicit short names. `drizzle-kit push` no longer reports constraint-name
drift once the DB matches the updated baseline.

## What Was Done

1. **Cleared old migrations** - Deleted all 0000-0019 migration files and journal
2. **Truncated migrations table** - `TRUNCATE drizzle.__drizzle_migrations`
3. **Generated fresh baseline** - `0000_secret_stingray.sql` contains the full schema
4. **Recorded baseline** - Inserted migration record so Drizzle knows schema is applied
5. **Named long FKs explicitly** - Added short, stable FK names and updated the baseline

## Current State

- `pnpm db:migrate` works correctly (no pending migrations)
- New migrations can be generated and applied normally
- `drizzle-kit push` stays clean once constraints use the explicit names below

## Fix: Explicit FK Names (No Drift)

PostgreSQL truncates identifiers longer than 63 characters. These foreign keys
now have explicit names that stay under the limit:

| Table                           | FK Name                                                   |
| ------------------------------- | --------------------------------------------------------- |
| `reporting_submission_history`  | `reporting_submission_history_reporting_submission_fk`    |
| `reporting_submission_history`  | `reporting_submission_history_form_submission_version_fk` |
| `event_payment_sessions`        | `event_payment_sessions_registration_fk`                  |
| `membership_payment_sessions`   | `membership_payment_sessions_type_fk`                     |
| `scheduled_notifications`       | `scheduled_notifications_template_fk`                     |
| `organization_invite_link_uses` | `organization_invite_link_uses_link_fk`                   |

## Align Existing Databases

If your database was created before the explicit FK names were added, you need
to rebuild or rename those constraints so they match the names above.

1. **Rebuild (simplest for dev):** Drop the database, recreate it, and rerun
   `pnpm db:migrate`.
2. **Rename in place (advanced):** Drop and re-add the six FKs using the names
   above, then run `drizzle-kit push` to confirm no drift.

### Rebuild Script (Dev)

Use the reset script to drop/recreate the DB and rerun migrations:

```bash
scripts/reset-db.sh sin-dev --profile techdev
```

## Commands Reference

```bash
# Apply migrations (use this)
AWS_PROFILE=techdev npx sst shell --stage sin-dev -- pnpm db:migrate

# Generate new migration after schema changes
AWS_PROFILE=techdev npx sst shell --stage sin-dev -- npx drizzle-kit generate

# Check migration status
AWS_PROFILE=techdev npx sst shell --stage sin-dev -- bash -c 'psql "$DATABASE_URL" -c "SELECT * FROM drizzle.__drizzle_migrations;"'
```
