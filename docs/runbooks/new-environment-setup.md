# Runbook: Standing Up a New Environment

**Purpose:** Step-by-step guide for deploying and configuring a new environment (e.g., sin-uat, qc-perf)
**Last Updated:** 2026-01-07
**Lessons Learned From:** sin-uat setup issues documented in `docs/worklog-sin-uat-db-connection.md`

---

## Prerequisites

- AWS CLI configured with appropriate profile (`techdev` for dev/perf, `techprod` for prod)
- SST tunnel installed: `sudo npx sst tunnel install`
- Node.js and pnpm installed
- Access to SST secrets for the new stage

---

## Phase 1: Initial Deployment

### 1.1 Deploy Infrastructure

```bash
# Login to AWS SSO
aws sso login --profile techdev  # or techprod for production

# Deploy all infrastructure
AWS_PROFILE=techdev npx sst deploy --stage <new-stage>

# Example for sin-uat:
AWS_PROFILE=techdev npx sst deploy --stage sin-uat
```

### 1.2 Set Required Secrets

```bash
# List existing secrets (if cloned from another stage)
AWS_PROFILE=techdev npx sst secret list --stage <new-stage>

# Set required secrets
AWS_PROFILE=techdev npx sst secret set BetterAuthSecret "<generate-new-secret>" --stage <new-stage>
AWS_PROFILE=techdev npx sst secret set GoogleClientId "<client-id>" --stage <new-stage>
AWS_PROFILE=techdev npx sst secret set GoogleClientSecret "<client-secret>" --stage <new-stage>
AWS_PROFILE=techdev npx sst secret set BaseUrl "<cloudfront-url>" --stage <new-stage>

# For payment-enabled environments:
AWS_PROFILE=techdev npx sst secret set SquareAccessToken "<token>" --stage <new-stage>
# ... other Square secrets
```

**Generate a new auth secret:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 1.3 Verify Deployment

```bash
# Get CloudFront URL
AWS_PROFILE=techdev aws cloudfront list-distributions \
  --query 'DistributionList.Items[*].{Id:Id,DomainName:DomainName,Comment:Comment}' \
  --output table

# Verify the deployment is accessible
curl -s https://<cloudfront-domain>/api/health
```

---

## Phase 2: Database Setup

### 2.1 Start SST Tunnel

**CRITICAL:** Only run ONE tunnel at a time. Multiple tunnels for different stages will conflict (same VPC subnets, different bastion hosts).

```bash
# Kill any existing tunnels first
pkill -f "sst" 2>/dev/null
sudo pkill -f "tunnel" 2>/dev/null

# Start tunnel for the new stage
AWS_PROFILE=techdev npx sst tunnel --stage <new-stage>

# Verify tunnel shows correct bastion IP
# The IP should match a running EC2 instance in the VPC
```

### 2.2 Verify Tunnel Connectivity

```bash
# Get database credentials
AWS_PROFILE=techdev npx sst shell --stage <new-stage> -- printenv | grep SST_RESOURCE_Database

# Test connection (extract host and password from above)
PGPASSWORD="<password>" psql -h <db-proxy-host> -U postgres -d solstice -c "SELECT 1;"
```

**Troubleshooting: Connection Failures**

If connection fails with "server closed the connection unexpectedly":

1. Check if bastion IP is stale:

```bash
# List running EC2 instances
AWS_PROFILE=techdev aws ec2 describe-instances --region ca-central-1 \
  --filters "Name=instance-state-name,Values=running" \
  --query 'Reservations[*].Instances[*].{Name:Tags[?Key==`Name`].Value|[0],PublicIP:PublicIpAddress}'
```

2. If tunnel IP doesn't match any instance, redeploy to fix:

```bash
AWS_PROFILE=techdev npx sst deploy --stage <new-stage>
```

### 2.3 Push Database Schema

```bash
# Option A: Via SST shell (preferred)
AWS_PROFILE=techdev npx sst shell --stage <new-stage> -- npx drizzle-kit push --force

# Option B: With explicit DATABASE_URL (if SST shell has issues)
DATABASE_URL="postgresql://postgres:<password>@<db-proxy-host>:5432/solstice?sslmode=require" \
  npx drizzle-kit push --force
```

---

## Phase 3: Data Seeding

### 3.1 Get Required Environment Variables

**CRITICAL:** Both `DATABASE_URL` AND `BETTER_AUTH_SECRET` are required for MFA to work properly.

```bash
# Get database URL
AWS_PROFILE=techdev npx sst shell --stage <new-stage> -- printenv | grep SST_RESOURCE_Database

# Get BETTER_AUTH_SECRET
AWS_PROFILE=techdev npx sst secret list --stage <new-stage> | grep BetterAuthSecret
```

**WARNING: SST Shell Stage Linking Bug**

`sst shell --stage X` may return environment variables from a DIFFERENT stage (e.g., sin-dev instead of sin-uat). This is a known SST bug related to stage linking.

**Always verify the host in DATABASE_URL matches the stage you expect:**

- sin-dev: `solstice-sin-dev-databaseproxy-*`
- sin-uat: `solstice-sin-uat-databaseproxy-*`

If wrong, get credentials directly from the SST Resource output or Secrets Manager.

### 3.2 Run Seed Script

**CRITICAL:** The seed script encrypts TOTP secrets using `BETTER_AUTH_SECRET`. Without it, MFA verification will silently fail (returns 200 with empty body, no navigation).

```bash
# For SIN environments (viaSport)
DATABASE_URL="postgresql://postgres:<password>@<db-proxy-host>:5432/solstice?sslmode=require" \
BETTER_AUTH_SECRET="<secret-from-step-3.1>" \
npx tsx scripts/seed-sin-data.ts --force

# For QC environments (Quadball Canada)
DATABASE_URL="postgresql://postgres:<password>@<db-proxy-host>:5432/solstice?sslmode=require" \
BETTER_AUTH_SECRET="<secret-from-step-3.1>" \
npx tsx scripts/seed-e2e-data.ts
```

### 3.3 Verify Seed Data

```bash
PGPASSWORD="<password>" psql -h <db-proxy-host> -U postgres -d solstice -c "
SELECT
  (SELECT COUNT(*) FROM \"user\") as users,
  (SELECT COUNT(*) FROM organizations) as orgs,
  (SELECT COUNT(*) FROM \"twoFactor\") as mfa_enrollments,
  (SELECT COUNT(*) FROM roles) as roles;
"
```

Expected for SIN environments:

- users: 5
- orgs: 10
- mfa_enrollments: 2 (admin + viasport-staff)
- roles: 4+

---

## Phase 4: Verification

### 4.1 Test Non-MFA Login

1. Navigate to `https://<cloudfront-domain>/auth/login`
2. Login with: `pso-admin@example.com` / `testpassword123`
3. Verify dashboard loads with organization selector

### 4.2 Test MFA Login

1. Navigate to `https://<cloudfront-domain>/auth/login`
2. Login with: `viasport-staff@example.com` / `testpassword123`
3. When MFA prompt appears, generate TOTP:

```bash
npx tsx -e "import { authenticator } from 'otplib'; console.log(authenticator.generate(process.env.SIN_UI_TOTP_SECRET ?? ''));"
```

4. Enter the 6-digit code
5. Verify navigation to dashboard with Admin Console visible

**If MFA fails (200 with empty body, no navigation):**

- Re-run seed with `BETTER_AUTH_SECRET` set (see Phase 3.2)

### 4.3 Verify Admin Access

After MFA login as `viasport-staff@example.com`, verify sidebar shows:

- Portal section (SIN Portal, Reporting, Forms, etc.)
- Admin Console section (Admin Home, Roles, SIN Admin)
- Account section (Profile, Settings, Privacy)

---

## Quick Reference

### Test Users (password: `testpassword123`)

| Email                      | Role           | MFA | Access                          |
| -------------------------- | -------------- | --- | ------------------------------- |
| admin@example.com          | Platform Admin | Yes | Platform admin pages only       |
| viasport-staff@example.com | viaSport Admin | Yes | Full access including Analytics |
| pso-admin@example.com      | PSO Admin      | No  | BC Hockey org features          |
| club-reporter@example.com  | Club Reporter  | No  | Club reporting                  |
| member@example.com         | Member         | No  | View-only                       |

### TOTP Secret for Testing

- Set `SIN_UI_TOTP_SECRET` in your environment (base32-encoded).
- Stored in SST secrets (sin-dev): `SIN_UI_TOTP_SECRET`.

### Common Issues

| Issue                             | Cause                                  | Fix                          |
| --------------------------------- | -------------------------------------- | ---------------------------- |
| Tunnel connection refused         | Stale bastion IP                       | `sst deploy --stage <stage>` |
| MFA returns 200 but no navigation | Missing BETTER_AUTH_SECRET during seed | Re-seed with both env vars   |
| Wrong DATABASE_URL from SST shell | SST shell bug with stage linking       | Pass DATABASE_URL explicitly |
| Multiple tunnel conflicts         | Two tunnels running                    | Kill all, run only one       |
| Login page downloads as file      | Session cookie from different stage    | Clear browser cookies        |

---

## Environment URLs

| Stage   | CloudFront URL                | Bastion IP  |
| ------- | ----------------------------- | ----------- |
| sin-dev | d21gh6khf5uj9x.cloudfront.net | 3.99.23.199 |
| sin-uat | d2c0wrkbra0j3p.cloudfront.net | 3.99.82.171 |

_Update this table when adding new environments_
