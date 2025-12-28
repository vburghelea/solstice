# Stream A Technical Debt / Workarounds

## 2025-12-27: SIN dev migration workaround

### Context

While testing with `AWS_PROFILE=techdev npx sst dev --stage sin-dev --mode mono`, login failed with a 500 because the `session.last_activity_at` column did not exist in the SIN dev database. This column is required by Stream A's session policy enforcement.

### What failed

`AWS_PROFILE=techdev npx sst shell --stage sin-dev -- npx drizzle-kit push --force` failed during constraint application:

- `organizations_parent_fk` could not be added due to existing orphaned `organizations.parent_org_id` values.
- This prevented `drizzle-kit push` from completing and blocked applying the new `last_activity_at` column.

### Workaround applied

To unblock testing, I applied the minimal SQL needed for Stream A directly in the SIN dev database:

- `ALTER TABLE session ADD COLUMN IF NOT EXISTS last_activity_at timestamp;`
- `UPDATE session SET last_activity_at = updated_at WHERE last_activity_at IS NULL;`
- `UPDATE "user" SET mfa_required = TRUE WHERE id IN (SELECT user_id FROM user_roles WHERE role_id IN ('solstice-admin','viasport-admin','quadball-canada-admin'));`

### Why this was acceptable

This was limited to SIN dev and was required to test the new session enforcement behavior. It avoids introducing any of the broader schema changes that `drizzle-kit push` attempted (FK constraints, indexes, etc.).

### Follow-up needed

- ~~Resolve orphaned `organizations.parent_org_id` data in SIN dev so constraints can be applied safely.~~ **RESOLVED 2025-12-27**: Cleaned up orphaned data and successfully ran `drizzle-kit push --force`.
- ~~Re-run migrations through the normal workflow (preferably via the migration file `src/db/migrations/0012_session_activity.sql`).~~ **RESOLVED 2025-12-27**: Schema applied via drizzle-kit push.
- ~~Confirm all dev/staging environments have `last_activity_at` and backfilled `mfa_required` before broader testing.~~ **RESOLVED 2025-12-27**: sin-dev now has all schema changes and seeded data with fake MFA.

## 2025-12-27: drizzle-kit push ordering workaround

### Issue

drizzle-kit push attempts to add FK constraints before creating the unique indexes those FKs depend on. This caused failures like:

- `there is no unique constraint matching given keys for referenced table "notification_templates"`

### Workaround

Manually create required unique indexes before running drizzle-kit push:

```sql
CREATE UNIQUE INDEX IF NOT EXISTS notification_templates_key_unique ON notification_templates (key);
-- (and other required indexes)
```

Then run `drizzle-kit push --force`. The indexes will already exist, and the FK constraints will succeed.
