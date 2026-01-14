# Local Development Setup

This guide covers running SST dev mode locally with database connectivity for personal dev stages (e.g., `sin-austin`, `qc-austin`).

## Prerequisites

- AWS CLI configured with SSO profiles (`techdev` for dev stages)
- SST installed globally or via pnpm
- Node.js 18+ and pnpm

## Quick Start

### 1. Configure `.env` File

Create/update `.env` in the project root with your stage's credentials:

```bash
VITE_BASE_URL="http://localhost:5173"

# Database via SSM tunnel (localhost port forward)
DATABASE_URL="postgresql://postgres:<password>@localhost:15432/solstice"
NETLIFY_DATABASE_URL="postgresql://postgres:<password>@localhost:15432/solstice"

# Auth secret (get from: AWS_PROFILE=techdev npx sst secret list --stage <stage>)
BETTER_AUTH_SECRET="<your-auth-secret>"

# Google OAuth (optional, for Google login)
GOOGLE_CLIENT_ID="<client-id>"
GOOGLE_CLIENT_SECRET="<client-secret>"

# Disable Redis for local dev (avoids VPC connectivity issues)
REDIS_ENABLED=false
```

### 2. Start SSM Tunnel to Database

The RDS database is in a private VPC. Use SSM port forwarding to tunnel through the bastion/NAT instance:

```bash
# Terminal 1: Find your stage's NAT instance
AWS_PROFILE=techdev aws ec2 describe-instances --region ca-central-1 \
  --filters "Name=tag:sst:stage,Values=<your-stage>" "Name=instance-state-name,Values=running" \
  --query 'Reservations[*].Instances[*].[InstanceId,PublicIpAddress,Tags[?Key==`Name`].Value|[0]]' \
  --output text

# Start the tunnel (replace <nat-instance-id> and <rds-proxy-host>)
AWS_PROFILE=techdev aws ssm start-session \
  --region ca-central-1 \
  --target <nat-instance-id> \
  --document-name AWS-StartPortForwardingSessionToRemoteHost \
  --parameters '{"host":["<rds-proxy-host>"],"portNumber":["5432"],"localPortNumber":["15432"]}'
```

**Known configurations:**

| Stage      | NAT Instance        | RDS Proxy Host                                                                               |
| ---------- | ------------------- | -------------------------------------------------------------------------------------------- |
| sin-austin | i-040039e442edb08d0 | solstice-sin-austin-databaseproxy-vbfztehn.proxy-cx20ui4g0b7v.ca-central-1.rds.amazonaws.com |

### 3. Start SST Dev

```bash
# Terminal 2: Start SST dev mode
AWS_PROFILE=techdev npx sst dev --stage <your-stage> --mode mono
```

The server will start at `http://localhost:5173` (or next available port if 5173 is in use).

### 4. Seed Database (First Time Only)

If your database is empty, you need to:

1. **Push the schema** (creates all tables including `bi_nl_query_log`):

```bash
DATABASE_URL="postgresql://postgres:<password>@localhost:15432/solstice" \
npx drizzle-kit push --force
```

2. **Create the BI readonly role** (required for Analytics/NL Query features):

```bash
PGPASSWORD="<password>" psql -h localhost -p 15432 -U postgres -d solstice -c "
CREATE ROLE bi_readonly NOLOGIN;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO bi_readonly;
GRANT USAGE ON SCHEMA public TO bi_readonly;
GRANT bi_readonly TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO bi_readonly;
"
```

3. **Seed demo data**:

```bash
DATABASE_URL="postgresql://postgres:<password>@localhost:15432/solstice" \
BETTER_AUTH_SECRET="<secret>" \
npx tsx scripts/seed-sin-data.ts --force
```

4. **Seed AI prompt templates** (required for NL Query):

```bash
DATABASE_URL="postgresql://postgres:<password>@localhost:15432/solstice" \
AI_PROMPT_PRESET=nl-data-query \
npx tsx scripts/seed-ai-prompts.ts
```

**Demo accounts after seeding (all use password: `demopassword123`):**
| Email | Password | Role |
|-------|----------|------|
| global-admin@demo.com | demopassword123 | Solstice Admin |
| viasport-staff@demo.com | demopassword123 | viaSport Admin + Org Owner |
| pso-admin@demo.com | demopassword123 | BC Hockey Admin |
| club-reporter@demo.com | demopassword123 | Club Reporter |
| member@demo.com | demopassword123 | Viewer |

## Troubleshooting

### "Connection validation timed out"

**Cause:** SSM tunnel not running or wrong port.

**Fix:** Ensure the SSM tunnel is active in another terminal and using port 15432.

### "Invalid input: expected string, received undefined" for BETTER_AUTH_SECRET

**Cause:** Auth secret not in `.env` or SST passing empty values.

**Fix:** The code now auto-loads `.env` when secrets are missing. Ensure `BETTER_AUTH_SECRET` is set in `.env`.

### Redis Connection Timeout (but login eventually works)

**Cause:** Redis is in VPC and not accessible locally.

**Fix:** Set `REDIS_ENABLED=false` in `.env`. Rate limiting will use in-memory fallback.

### Port Already in Use

**Cause:** Previous SST dev processes still running.

**Fix:**

```bash
pkill -f "vite dev"
pkill -f "sst dev"
```

### SST Tunnel Command Fails with "No tunnels found"

**Cause:** Personal dev stages don't have SST tunnel infrastructure. Use SSM port forwarding instead (Step 2 above).

### NL Query / Analytics Returns 500 Error

**Cause:** Missing `bi_readonly` PostgreSQL role or `bi_nl_query_log` table.

**Fix:**

1. Push schema to create the table: `npx drizzle-kit push --force`
2. Create the role (see Step 4.2 above)
3. Seed the AI prompt templates (see Step 4.4 above)

### NL Query Interpretation Fails

**Cause:** Missing `nl-data-query` prompt template in database.

**Fix:** Run `AI_PROMPT_PRESET=nl-data-query npx tsx scripts/seed-ai-prompts.ts`

## How It Works

### Why SSM Instead of SST Tunnel?

SST's `sst tunnel` command requires specific tunnel infrastructure deployed with the stage. Personal dev stages (`*-austin`) may not have this configured. SSM port forwarding works with any stage that has a NAT/bastion instance.

### Environment Variable Loading

In local dev, SST passes empty strings for secrets (a known limitation). The codebase handles this by:

1. **vite.config.ts**: Loads `.env` and overrides empty strings in `process.env`
2. **env.server.ts**: Falls back to dotenv loading when critical secrets are missing

These changes only affect local development - deployed Lambda functions use SST-injected values normally.

## See Also

- [New Environment Setup](./new-environment-setup.md) - Standing up new stages
- [Database Connections](../database-connections.md) - Connection pooling details
