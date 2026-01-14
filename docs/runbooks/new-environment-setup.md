# Runbook: Standing Up a New Environment

**Purpose:** Step-by-step guide for deploying and configuring a new environment (e.g., sin-uat, qc-perf)
**Last Updated:** 2026-01-12
**Lessons Learned From:** sin-uat setup issues (2026-01-07, 2026-01-09), sin-austin local dev setup (2026-01-12)

---

## TL;DR: When Database/Tunnel Operations Fail

If `sst tunnel` connects but database operations fail with "server closed connection unexpectedly" or similar:

1. **Check if tunnel IP is stale** (see [Stale Bastion IP Recovery](#stale-bastion-ip-recovery) below)
2. **Use SSM workaround** if tunnel is broken (see [SSM Port Forwarding Workaround](#ssm-port-forwarding-workaround))
3. **Verify correct stage** - `sst shell` may return wrong DATABASE_URL due to stage linking bug

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

### 2.4 Create BI Readonly Role

The Analytics/BI features require a `bi_readonly` PostgreSQL role for secure query execution. This role restricts what queries can run during analytics operations.

```bash
# Create the bi_readonly role
PGPASSWORD="<password>" psql -h <db-proxy-host> -U postgres -d solstice -c "
-- Create bi_readonly role for restricted analytics queries
CREATE ROLE bi_readonly NOLOGIN;

-- Grant SELECT on all tables in public schema
GRANT SELECT ON ALL TABLES IN SCHEMA public TO bi_readonly;

-- Grant usage on the public schema
GRANT USAGE ON SCHEMA public TO bi_readonly;

-- Allow postgres to switch to this role
GRANT bi_readonly TO postgres;

-- Grant SELECT on future tables (so new tables are automatically accessible)
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO bi_readonly;
"
```

**Verify the role exists:**

```bash
PGPASSWORD="<password>" psql -h <db-proxy-host> -U postgres -d solstice -c "SELECT rolname FROM pg_roles WHERE rolname = 'bi_readonly';"
```

**Note:** Without this role, NL Query and Pivot Builder features will fail with "Failed query: SET LOCAL ROLE bi_readonly".

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

**For artifact uploads** (PDFs, templates, demo files), you also need `SIN_ARTIFACTS_BUCKET`. See [Finding S3 Bucket Names](#finding-s3-bucket-names) for how to get the bucket name.

```bash
# For SIN environments (viaSport) - with artifact uploads
DATABASE_URL="postgresql://postgres:<password>@<db-proxy-host>:5432/solstice?sslmode=require" \
BETTER_AUTH_SECRET="<secret-from-step-3.1>" \
SIN_ARTIFACTS_BUCKET="<bucket-name>" \
AWS_PROFILE=techdev \
npx tsx scripts/seed-sin-data.ts --force

# For QC environments (Quadball Canada)
DATABASE_URL="postgresql://postgres:<password>@<db-proxy-host>:5432/solstice?sslmode=require" \
BETTER_AUTH_SECRET="<secret-from-step-3.1>" \
npx tsx scripts/seed-e2e-data.ts
```

**Note:** Without `SIN_ARTIFACTS_BUCKET`, the seed completes successfully but skips file uploads. You'll see warnings like `⚠️ SIN_ARTIFACTS_BUCKET not set; skipping submission file upload.`

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
2. Login with: `pso-admin@demo.com` / `demopassword123`
3. Verify dashboard loads with organization selector

### 4.2 Test MFA Login

1. Navigate to `https://<cloudfront-domain>/auth/login`
2. Login with: `viasport-staff@demo.com` / `demopassword123`
3. When MFA prompt appears, generate TOTP:

```bash
# IMPORTANT: Better Auth uses raw string secrets, NOT base32-encoded
npx tsx -e "
import { createOTP } from '@better-auth/utils/otp';
(async () => {
  const secret = process.env.SIN_UI_TOTP_SECRET ?? 'solstice-test-totp-secret-32char';
  const code = await createOTP(secret, { period: 30, digits: 6 }).totp();
  console.log(code);
})();
"
```

4. Enter the 6-digit code immediately (codes expire every 30 seconds)
5. Verify navigation to dashboard with Admin Console visible

**If MFA fails (200 with empty body, no navigation):**

- Re-run seed with `BETTER_AUTH_SECRET` set (see Phase 3.2)

**If MFA fails with "Invalid authentication code":**

- Ensure you're using Better Auth's `createOTP` (not `otplib.authenticator`)
- Better Auth stores **raw strings** as TOTP secrets, not base32-encoded
- Generate a fresh code and enter within 30 seconds

### 4.3 Verify Admin Access

After MFA login as `viasport-staff@example.com`, verify sidebar shows:

- Portal section (SIN Portal, Reporting, Forms, etc.)
- Admin Console section (Admin Home, Roles, SIN Admin)
- Account section (Profile, Settings, Privacy)

---

## Quick Reference

### Test Users (password: `demopassword123`)

| Email                   | Role           | MFA | Access                          |
| ----------------------- | -------------- | --- | ------------------------------- |
| global-admin@demo.com   | Platform Admin | No  | Platform admin pages only       |
| viasport-staff@demo.com | viaSport Admin | No  | Full access including Analytics |
| pso-admin@demo.com      | PSO Admin      | No  | BC Hockey org features          |
| club-reporter@demo.com  | Club Reporter  | No  | Club reporting                  |
| member@demo.com         | Member         | No  | View-only                       |

### TOTP Secret for Testing

**Current test secrets:**

- **Raw string (stored in DB):** `solstice-test-totp-secret-32char`
- **Base32 encoded (for otplib):** `ONXWY43UNFRWKLLUMVZXILLUN52HALLTMVRXEZLUFUZTEY3IMFZA`
- **SST secret name:** `SIN_UI_TOTP_SECRET` (stores the raw string)

**To generate a TOTP code (either method works):**

```bash
# Option 1: Better Auth's createOTP (recommended)
npx tsx -e "
import { createOTP } from '@better-auth/utils/otp';
(async () => {
  const code = await createOTP('solstice-test-totp-secret-32char', { period: 30, digits: 6 }).totp();
  console.log(code);
})();
"

# Option 2: otplib with base32-encoded secret
npx tsx -e "import { authenticator } from 'otplib'; console.log(authenticator.generate('ONXWY43UNFRWKLLUMVZXILLUN52HALLTMVRXEZLUFUZTEY3IMFZA'));"
```

**How it works:** Better Auth stores raw ASCII strings and uses UTF-8 encoding for HMAC. otplib expects base32 input and decodes it first. Both produce the same HMAC key bytes (since ASCII = UTF-8), so both methods generate identical codes.

### Common Issues

| Issue                              | Cause                                  | Fix                                                  |
| ---------------------------------- | -------------------------------------- | ---------------------------------------------------- |
| Tunnel connection refused          | Stale bastion IP                       | `sst deploy --stage <stage>`                         |
| MFA returns 200 but no navigation  | Missing BETTER_AUTH_SECRET during seed | Re-seed with both env vars                           |
| Wrong DATABASE_URL from SST shell  | SST shell bug with stage linking       | Pass DATABASE_URL explicitly                         |
| Multiple tunnel conflicts          | Two tunnels running                    | Kill all, run only one                               |
| Login page downloads as file       | Session cookie from different stage    | Clear browser cookies                                |
| TOTP "Invalid authentication code" | Wrong secret format for the method     | Use raw string with createOTP, or base32 with otplib |

---

## Environment URLs

| Stage   | CloudFront URL                | Custom Domain         |
| ------- | ----------------------------- | --------------------- |
| sin-dev | d21gh6khf5uj9x.cloudfront.net | sindev.solsticeapp.ca |
| sin-uat | (varies after redeploy)       | sinuat.solsticeapp.ca |

_Update this table when adding new environments_

---

## Stale Bastion IP Recovery

### Why This Happens

SST's tunnel configuration is:

1. **Generated once** when the VPC component is first created
2. **Encrypted and stored** in Pulumi state as the `_tunnel` output
3. **NOT regenerated** when NAT instances are replaced

When infrastructure changes cause NAT instance replacement (new public IP), the encrypted tunnel config becomes stale. This has happened multiple times with sin-uat.

### Symptoms

- `sst tunnel` starts and shows an IP address
- Database connections fail with "server closed the connection unexpectedly"
- The tunnel IP doesn't match any running EC2 instance

### Diagnosis

```bash
# 1. Note the IP shown when tunnel starts (e.g., "▤  99.79.69.136")

# 2. List actual NAT instance IPs for the stage
AWS_PROFILE=techdev aws ec2 describe-instances --region ca-central-1 \
  --filters "Name=tag:sst:stage,Values=<stage>" "Name=instance-state-name,Values=running" \
  --query 'Reservations[*].Instances[*].{Name:Tags[?Key==`Name`].Value|[0],PublicIP:PublicIpAddress}' \
  --output table

# 3. If tunnel IP is NOT in the list, it's stale
```

### Known Triggers

| Trigger                          | Description                                  |
| -------------------------------- | -------------------------------------------- |
| Full redeploy after `sst remove` | Creates new VPC/NAT instances with new IPs   |
| SST version upgrades             | May trigger resource recreation              |
| Infrastructure drift             | AWS may replace instances during maintenance |
| Manual VPC changes               | Any change that replaces NAT instances       |

### Recovery Options

**Option 1: SSM Port Forwarding (Recommended - Works Immediately)**

See [SSM Port Forwarding Workaround](#ssm-port-forwarding-workaround) below.

**Option 2: Force Tunnel Regeneration**

This sometimes works, but not always:

```bash
# Kill existing tunnels
pkill -f "sst" && sudo pkill -f "/opt/sst/tunnel"

# Redeploy (may regenerate tunnel config)
AWS_PROFILE=techdev npx sst deploy --stage <stage>

# Try tunnel again
AWS_PROFILE=techdev npx sst tunnel --stage <stage>
```

If the tunnel IP is still wrong after redeploy, use SSM workaround.

---

## SSM Port Forwarding Workaround

When the SST tunnel has a stale bastion IP, use AWS SSM Session Manager to create a port forward directly through a NAT instance.

### Prerequisites

- AWS CLI v2 with Session Manager plugin installed
- NAT instance must be running (check with `aws ec2 describe-instances`)

### Steps

**1. Get the NAT instance ID for your stage:**

```bash
AWS_PROFILE=techdev aws ec2 describe-instances --region ca-central-1 \
  --filters "Name=tag:sst:stage,Values=<stage>" "Name=instance-state-name,Values=running" \
  --query 'Reservations[*].Instances[*].InstanceId' --output text
```

**2. Get the RDS proxy hostname:**

```bash
AWS_PROFILE=techdev npx sst shell --stage <stage> -- printenv | grep SST_RESOURCE_Database
# Extract the "host" field from the JSON output
```

**3. Start SSM port forwarding:**

```bash
AWS_PROFILE=techdev aws ssm start-session \
  --region ca-central-1 \
  --target <nat-instance-id> \
  --document-name AWS-StartPortForwardingSessionToRemoteHost \
  --parameters '{"host":["<rds-proxy-hostname>"],"portNumber":["5432"],"localPortNumber":["15432"]}'
```

**4. Connect via localhost:**

```bash
# Test connection
PGPASSWORD="<password>" psql -h localhost -p 15432 -U postgres -d solstice -c "\dt"

# Push schema
DATABASE_URL="postgresql://postgres:<password>@localhost:15432/solstice?sslmode=require" \
  npx drizzle-kit push --force

# Run seed (remember BETTER_AUTH_SECRET for MFA!)
DATABASE_URL="postgresql://postgres:<password>@localhost:15432/solstice?sslmode=require" \
BETTER_AUTH_SECRET="<secret>" \
SIN_UI_TOTP_SECRET="<totp-secret>" \
  npx tsx scripts/seed-sin-data.ts --force
```

### Example (sin-uat, 2026-01-09)

```bash
# NAT instance
i-08c93cd0f3e081958

# RDS proxy
solstice-sin-uat-databaseproxy-bcwkkanv.proxy-cx20ui4g0b7v.ca-central-1.rds.amazonaws.com

# Full command
AWS_PROFILE=techdev aws ssm start-session \
  --region ca-central-1 \
  --target i-08c93cd0f3e081958 \
  --document-name AWS-StartPortForwardingSessionToRemoteHost \
  --parameters '{"host":["solstice-sin-uat-databaseproxy-bcwkkanv.proxy-cx20ui4g0b7v.ca-central-1.rds.amazonaws.com"],"portNumber":["5432"],"localPortNumber":["15432"]}'
```

---

## Finding S3 Bucket Names

The seed scripts need `SIN_ARTIFACTS_BUCKET` to upload file attachments (PDFs, templates, etc.). Without it, the seed completes but skips artifact uploads.

### Get Bucket Names from SST

```bash
# Get all bucket resources for a stage
AWS_PROFILE=techdev npx sst shell --stage <stage> -- printenv | grep -i bucket

# Example output:
# SST_RESOURCE_SinAuditArchives={"name":"solstice-sin-uat-sinauditarchivesbucket-ceehcemw","type":"sst.aws.Bucket"}
# SST_RESOURCE_SinArtifacts={"name":"solstice-sin-uat-sinartifactsbucket-bcxwdzvt","type":"sst.aws.Bucket"}
```

### Alternative: List S3 Buckets Directly

```bash
AWS_PROFILE=techdev aws s3 ls | grep -i "<stage>"

# Example for sin-uat:
AWS_PROFILE=techdev aws s3 ls | grep -i "sin-uat"
```

### Known Bucket Names

| Stage   | SIN_ARTIFACTS_BUCKET                         |
| ------- | -------------------------------------------- |
| sin-dev | solstice-sin-dev-sinartifactsbucket-smhmnosc |
| sin-uat | solstice-sin-uat-sinartifactsbucket-bcxwdzvt |

### Running Seeds with Artifact Uploads

```bash
# Full seed command with all required env vars
DATABASE_URL="postgresql://postgres:<password>@localhost:15432/solstice?sslmode=require" \
BETTER_AUTH_SECRET="<secret>" \
SIN_UI_TOTP_SECRET="solstice-test-totp-secret-32char" \
SIN_ARTIFACTS_BUCKET="<bucket-name>" \
AWS_PROFILE=techdev \
npx tsx scripts/seed-sin-data.ts --force
```

**What gets uploaded:**

- `submissions/` - Form submission file attachments (PDFs, CSVs)
- `templates/` - Import/export template files
- `imports/` - Demo CSV files for import wizard

**Verify uploads:**

```bash
AWS_PROFILE=techdev aws s3 ls s3://<bucket-name>/ --recursive
```

---

## Preventing Future Issues

1. **After any deployment that may recreate VPC resources**, verify the tunnel works before walking away
2. **Document the current NAT instance IPs** in this runbook when setting up new environments
3. **Consider filing an SST issue** - the `_tunnel` encrypted config should be regenerated when NAT IPs change
4. **Keep SSM as a backup** - it bypasses the tunnel entirely and always works

---

## Database Isolation Between Stages

**IMPORTANT:** Each deployed stage has its **own separate database**. They do NOT share data.

### Current Database Proxies (techdev)

| Stage      | RDS Proxy Host                                                                               |
| ---------- | -------------------------------------------------------------------------------------------- |
| sin-dev    | solstice-sin-dev-databaseproxy-dkekckou.proxy-cx20ui4g0b7v.ca-central-1.rds.amazonaws.com    |
| sin-uat    | solstice-sin-uat-databaseproxy-bcwkkanv.proxy-cx20ui4g0b7v.ca-central-1.rds.amazonaws.com    |
| sin-austin | solstice-sin-austin-databaseproxy-vbfztehn.proxy-cx20ui4g0b7v.ca-central-1.rds.amazonaws.com |

### Verify Database Isolation

```bash
# List all RDS proxies in techdev
AWS_PROFILE=techdev aws rds describe-db-proxies --region ca-central-1 \
  --query 'DBProxies[*].DBProxyName' --output text | tr '\t' '\n' | sort
```

### Why This Matters

- Each stage needs its own seeding
- Data changes in one stage don't affect others
- Secrets (DATABASE_URL) point to stage-specific databases
- When setting up local dev, choose whether to use the stage's own DB or share another stage's DB

---

## Local Development Setup (Personal Stages)

For personal development stages like `sin-austin` or `qc-<yourname>`, you can run locally without deploying to CloudFront.

### Prerequisites

1. **Deploy infrastructure once** to create the database:

   ```bash
   AWS_PROFILE=techdev npx sst deploy --stage sin-austin
   ```

2. **Set all required secrets** (copy from sin-dev as a template):

   ```bash
   # List sin-dev secrets as reference
   AWS_PROFILE=techdev npx sst secret list --stage sin-dev

   # Set secrets for your stage
   AWS_PROFILE=techdev npx sst secret set BetterAuthSecret "<value>" --stage sin-austin
   AWS_PROFILE=techdev npx sst secret set GoogleClientId "<value>" --stage sin-austin
   AWS_PROFILE=techdev npx sst secret set GoogleClientSecret "<value>" --stage sin-austin
   AWS_PROFILE=techdev npx sst secret set BaseUrl "http://localhost:5173" --stage sin-austin
   AWS_PROFILE=techdev npx sst secret set SIN_UI_TOTP_SECRET "solstice-test-totp-secret-32char" --stage sin-austin
   AWS_PROFILE=techdev npx sst secret set SIN_ANALYTICS_TOTP_SECRET "solstice-test-totp-secret-32char" --stage sin-austin
   # ... and all other required secrets (Square, notifications, etc.)
   ```

### Option A: SST Dev Mono Mode (Recommended)

**Best for:** Full local development with Lambda functions and web app.

```bash
AWS_PROFILE=techdev npx sst dev --stage sin-austin --mode mono
```

### Option B: Plain Vite with SSM Port Forwarding

**Best for:** Local web development with your stage's database.

**Step 1: Start SSM port forwarding to your database**

```bash
# Get NAT instance ID
AWS_PROFILE=techdev aws ec2 describe-instances --region ca-central-1 \
  --filters "Name=tag:sst:stage,Values=sin-austin" "Name=instance-state-name,Values=running" \
  --query 'Reservations[*].Instances[*].InstanceId' --output text

# Get database credentials
AWS_PROFILE=techdev npx sst shell --stage sin-austin -- printenv | grep SST_RESOURCE_Database

# Start port forwarding (use port 15433 to avoid conflicts)
AWS_PROFILE=techdev aws ssm start-session \
  --region ca-central-1 \
  --target <nat-instance-id> \
  --document-name AWS-StartPortForwardingSessionToRemoteHost \
  --parameters '{"host":["<rds-proxy-host>"],"portNumber":["5432"],"localPortNumber":["15433"]}'
```

**Step 2: Configure `.env.local`** (git-ignored)

```bash
VITE_TENANT_KEY=viasport

# Local dev - connects via SSM port forwarding on localhost:15433
DATABASE_URL="postgresql://postgres:<password>@localhost:15433/solstice?sslmode=require"
DATABASE_URL_UNPOOLED="postgresql://postgres:<password>@localhost:15433/solstice?sslmode=require"
BETTER_AUTH_SECRET="<your-stage-secret>"
GOOGLE_CLIENT_SECRET="<google-secret>"
```

**Step 3: Push schema and seed**

```bash
# Push schema
DATABASE_URL_UNPOOLED="postgresql://postgres:<password>@localhost:15433/solstice?sslmode=require" \
  npx drizzle-kit push --force

# Seed database
DATABASE_URL="postgresql://postgres:<password>@localhost:15433/solstice?sslmode=require" \
BETTER_AUTH_SECRET="<your-stage-secret>" \
npx tsx scripts/seed-sin-data.ts --force
```

**Step 4: Run Vite directly**

```bash
pnpm dev
```

This loads `.env.local` and connects to your database via the SSM tunnel.

### Example: sin-austin Setup (2026-01-12)

```bash
# NAT instance
i-040039e442edb08d0

# Database
solstice-sin-austin-databaseproxy-vbfztehn.proxy-cx20ui4g0b7v.ca-central-1.rds.amazonaws.com
Password: cbM6ogbCpOWJ2ZHV3sL1ZyHDy3RSjNCW

# SSM port forward command
AWS_PROFILE=techdev aws ssm start-session \
  --region ca-central-1 \
  --target i-040039e442edb08d0 \
  --document-name AWS-StartPortForwardingSessionToRemoteHost \
  --parameters '{"host":["solstice-sin-austin-databaseproxy-vbfztehn.proxy-cx20ui4g0b7v.ca-central-1.rds.amazonaws.com"],"portNumber":["5432"],"localPortNumber":["15433"]}'
```

### Troubleshooting

If `sst tunnel` or `sst dev` doesn't connect to the database, use SSM port forwarding as a fallback (see Option B above).
