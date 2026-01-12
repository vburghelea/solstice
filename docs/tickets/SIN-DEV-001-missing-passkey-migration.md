# SIN-DEV-001: Missing Passkey Table Migration

**Created**: 2026-01-09
**Resolved**: 2026-01-09
**Status**: Resolved
**Priority**: Medium
**Environment**: sin-dev (sindev.solsticeapp.ca)

## Summary

The `passkey` table does not exist in the sin-dev database, causing 500 errors on every dashboard load. The `getCurrentUserPasskeyCount` server function fails because the migration `0006_add_passkey.sql` has not been applied.

## Symptoms

- **500 errors** in browser console on every authenticated page load
- Server function `getCurrentUserPasskeyCount` (hash: `3d732e0a8e74f7d11243a45128107d7247489e766d0b507758238e8f45656f36`) consistently fails
- Error occurs for all authenticated users (reproduced with `viasport-staff@example.com`)

## Root Cause

The `passkey` table migration was added but not applied to sin-dev. The function queries a non-existent table:

```sql
select count(*) from "passkey" where "passkey"."user_id" = $1
```

### Error from Lambda Logs

```
PostgresError: relation "passkey" does not exist
  severity: 'ERROR',
  code: '42P01',
  file: 'parse_relation.c',
  line: '1449',
  routine: 'parserOpenTable'
```

### Affected Files

- **Server function**: `src/features/auth/auth.queries.ts:179` (`getCurrentUserPasskeyCount`)
- **Consumer**: `src/features/auth/components/passkey-prompt.tsx:58` (React Query hook)
- **Missing migration**: `src/db/migrations/0006_add_passkey.sql`

## Reproduction Steps

1. Navigate to https://sindev.solsticeapp.ca/auth/login
2. Login with `viasport-staff@example.com` / `testpassword123` (with TOTP)
3. Select any organization from the dashboard
4. Open browser DevTools > Console
5. Observe repeated 500 errors for server function requests

## Resolution

Apply the passkey migration to sin-dev:

```bash
# Start tunnel to sin-dev database
AWS_PROFILE=techdev npx sst tunnel --stage sin-dev

# Push schema changes (includes passkey migration)
AWS_PROFILE=techdev npx sst shell --stage sin-dev -- npx drizzle-kit push --force
```

### Verification

After applying migration, verify the table exists:

```bash
AWS_PROFILE=techdev npx sst shell --stage sin-dev -- bash -c 'PGPASSWORD="$( echo $SST_RESOURCE_Database | python3 -c "import sys,json; print(json.load(sys.stdin)[\"password\"])" )" PGHOST="$( echo $SST_RESOURCE_Database | python3 -c "import sys,json; print(json.load(sys.stdin)[\"host\"])" )" psql -U postgres -d solstice -c "\d passkey"'
```

## Impact

- **User-facing**: No visible impact (errors are caught and handled gracefully)
- **Technical**: Wasted Lambda invocations, unnecessary error logs
- **Passkey feature**: Cannot enroll or use passkeys until migration is applied

## Resolution Log

**2026-01-09**: Applied schema migration via `drizzle-kit push --force`. Verified passkey table created and 500 errors no longer occur on dashboard load.

```
[✓] Changes applied
CREATE TABLE "passkey" (...)
```

## Related

- Migration file: `src/db/migrations/0006_add_passkey.sql`
- Schema definition: `src/db/schema/auth.schema.ts`
