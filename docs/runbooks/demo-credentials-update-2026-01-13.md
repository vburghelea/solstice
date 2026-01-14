# Demo Credentials Update - 2026-01-13

## Summary

Updated all SIN environment test users from `@example.com` to `@demo.com` email addresses.

## Status: ✅ COMPLETED

## Environments Updated

- [x] sin-dev (sindev.solsticeapp.ca)
- [x] sin-uat (sinuat.solsticeapp.ca)

## New Credentials

| Email                     | Password          | Platform Role  | Org Membership             | MFA |
| ------------------------- | ----------------- | -------------- | -------------------------- | --- |
| `global-admin@demo.com`   | `demopassword123` | Solstice Admin | None                       | Yes |
| `viasport-staff@demo.com` | `testpassword123` | viaSport Admin | viaSport BC: owner         | Yes |
| `pso-admin@demo.com`      | `testpassword123` | None           | BC Hockey: admin           | No  |
| `club-reporter@demo.com`  | `testpassword123` | None           | North Shore Club: reporter | No  |
| `member@demo.com`         | `testpassword123` | None           | Vancouver Minor: viewer    | No  |

## Files Modified

1. **`scripts/seed-sin-data.ts`**
   - Updated `testUsers` array with new `@demo.com` email addresses
   - Changed global admin password from `testpassword123` to `demopassword123`
   - Added per-user password field to support different passwords
   - Updated summary message at end of script

2. **`CLAUDE.md`**
   - Updated "Test Users and Access Rights" table with new credentials
   - Updated "MFA Authentication for Agents" section with new emails/passwords

## How Seeding Was Done

Used **SSM port forwarding workaround** (not `sst tunnel`) to connect to databases:

```bash
# 1. Get NAT instance ID
AWS_PROFILE=techdev aws ec2 describe-instances --region ca-central-1 \
  --filters "Name=tag:sst:stage,Values=<stage>" "Name=instance-state-name,Values=running" \
  --query 'Reservations[*].Instances[*].InstanceId' --output text

# 2. Get database connection info
AWS_PROFILE=techdev npx sst shell --stage <stage> -- printenv | grep SST_RESOURCE_Database

# 3. Get BetterAuthSecret
AWS_PROFILE=techdev npx sst secret list --stage <stage> | grep BetterAuthSecret

# 4. Start SSM port forwarding (run in background)
AWS_PROFILE=techdev aws ssm start-session \
  --region ca-central-1 \
  --target <nat-instance-id> \
  --document-name AWS-StartPortForwardingSessionToRemoteHost \
  --parameters '{"host":["<db-proxy-host>"],"portNumber":["5432"],"localPortNumber":["15433"]}'

# 5. Run seed script (in another terminal)
DATABASE_URL="postgresql://postgres:<password>@localhost:15433/solstice?sslmode=require" \
BETTER_AUTH_SECRET="<secret>" \
SIN_UI_TOTP_SECRET="solstice-test-totp-secret-32char" \
npx tsx scripts/seed-sin-data.ts --force
```

## Connection Details Used

### sin-dev

- NAT Instance: `i-04b2f274d00704c95`
- DB Host: `solstice-sin-dev-databaseproxy-dkekckou.proxy-cx20ui4g0b7v.ca-central-1.rds.amazonaws.com`
- Local Port: `15433`

### sin-uat

- NAT Instance: `i-08c93cd0f3e081958`
- DB Host: `solstice-sin-uat-databaseproxy-bcwkkanv.proxy-cx20ui4g0b7v.ca-central-1.rds.amazonaws.com`
- Local Port: `15434`

## Things to Be Aware Of (For Future Agents)

### 1. SSM Workaround vs SST Tunnel

- The `sst tunnel` command can have stale bastion IPs that cause connection failures
- SSM port forwarding is more reliable and bypasses the tunnel entirely
- See `docs/runbooks/new-environment-setup.md` for detailed SSM workaround instructions

### 2. MFA Secrets Must Be Encrypted

- `BETTER_AUTH_SECRET` is required for MFA to work properly
- Without it, TOTP secrets are stored unencrypted and verification fails silently
- Always include `BETTER_AUTH_SECRET` when running seed scripts

### 3. TOTP Secret for Testing

- Raw string: `solstice-test-totp-secret-32char`
- Base32 encoded: `ONXWY43UNFRWKLLUMVZXILLUN52HALLTMVRXEZLUFUZTEY3IMFZA`
- Generate codes with:
  ```bash
  npx tsx -e "import { authenticator } from 'otplib'; console.log(authenticator.generate('ONXWY43UNFRWKLLUMVZXILLUN52HALLTMVRXEZLUFUZTEY3IMFZA'))"
  ```

### 4. Password Differences

- Global admin (`global-admin@demo.com`) uses `demopassword123`
- All other users use `testpassword123`
- This is intentional for demo/presentation purposes

### 5. Artifact Uploads Skipped

- The seed script warned about `SIN_ARTIFACTS_BUCKET not set`
- This means PDF attachments and template files weren't uploaded
- Add `SIN_ARTIFACTS_BUCKET` env var if file uploads are needed

### 6. Re-running the Seed

- The seed script uses `--force` flag and `onConflictDoUpdate` for idempotency
- Safe to re-run without data corruption
- Existing audit logs are preserved

## Verification Steps

To verify credentials work after seeding:

1. Navigate to https://sindev.solsticeapp.ca/auth/login (or sinuat)
2. Enter `global-admin@demo.com` / `demopassword123`
3. Complete MFA with TOTP code (generate fresh code)
4. Verify dashboard loads

For full access testing, use `viasport-staff@demo.com` / `testpassword123` (has org membership).
