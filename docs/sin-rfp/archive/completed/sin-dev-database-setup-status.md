# sin-dev Database Setup Status

**Date:** 2025-12-25 (Updated: 2025-12-26)
**Stage:** sin-dev
**Deployed URL:** https://dt1wroatpfxxl.cloudfront.net

## Current State

### What's Working

- **Deployment:** sin-dev is successfully deployed to AWS Lambda + CloudFront
- **App Loading:** The frontend loads correctly at https://dt1wroatpfxxl.cloudfront.net
- **Lambda → Database Connection:** The Lambda can connect to the RDS database (confirmed via `/api/health` endpoint showing `"database": {"status": "connected"}`)
- **RDS Resources:** Both RDS instance and RDS Proxy are available and healthy:
  - Instance: `solstice-sin-dev-databaseinstance-bdckvktk` (status: available)
  - Proxy: `solstice-sin-dev-databaseproxy-dkekckou` (status: available)
  - Proxy Target Health: AVAILABLE

### What's Not Working

- All major issues resolved as of 2025-12-26

### Recently Fixed

1. **Database Schema:** ✅ FIXED (2025-12-26)
   - Schema pushed successfully via `drizzle-kit push`
   - All 46 tables created
   - viaSport-specific roles seeded: `Solstice Admin`, `viaSport Admin`, `Team Admin`, `Event Admin`
   - Note: E2E seed script (`seed-e2e-data.ts`) is NOT appropriate for sin-dev as it creates QC-specific test data

2. **SST Tunnel:** ✅ FIXED (2025-12-26)
   - Was: Routes disappeared within seconds, causing connection timeouts
   - **Fix applied:** NAT toggle workaround from [SST Issue #5657](https://github.com/sst/sst/issues/5657)
   - Tunnel now works: `[Tunnel] | Tunneling tcp 10.0.15.246:5432`
   - Database connection validated: `Connection validated successfully, durationMs: 908`

## Database Connection Details

```
Host: solstice-sin-dev-databaseproxy-dkekckou.proxy-cx20ui4g0b7v.ca-central-1.rds.amazonaws.com
Port: 5432
Database: solstice
Username: postgres
Password: WJ7cHVKPLdLdo9BMP2eF4MKf6lIItWxk
```

## Things Tried

### 1. SST Tunnel Approaches

- Started `sst tunnel --stage sin-dev` - tunnel starts but connections reset
- Killed and restarted tunnel multiple times
- Tried `sudo sst tunnel install` - requires interactive password
- Verified tunnel shows correct VPC CIDR ranges (10.0.x.0/22)

### 2. Direct Database Connections

- `psql` direct connection - `ECONNRESET`
- Node.js postgres client via SST shell - `CONNECT_TIMEOUT`
- drizzle-kit push - `ECONNRESET`

### 3. SST Shell Commands

- `sst shell --stage sin-dev` works for getting environment variables
- Database queries through SST shell timeout (tunnel issue)
- drizzle-kit within SST shell also fails

### 4. SST Dev Mode

- `sst dev --stage sin-dev --mode basic` - starts but drizzle-kit still can't connect
- Regular `sst dev` crashes (needs TTY for interactive UI)

### 5. Environment Configuration

- Updated `.env` to point to sin-dev database (was pointing to qc-dev)
- Verified `SST_RESOURCE_Database` contains correct sin-dev credentials

## Root Cause Analysis (2025-12-26 Deep Debug Session)

### Investigation Results

1. **Tunnel Daemon Not Installed**
   - No LaunchDaemon plist at `/Library/LaunchDaemons/dev.sst.tunnel.plist`
   - No `sst-tunnel` binary in SST bin directory
   - `sudo npx sst tunnel install` did not complete successfully
   - Without the daemon, routes are ephemeral and disappear

2. **Route Behavior Observed**
   - When tunnel starts: Routes added to routing table (e.g., `10.0.4/22 → utun69`)
   - After ~30 seconds: Routes disappear, `utun69` interface removed
   - SST UI shows "Tunnel connected" but system has no routes

3. **Two Distinct Failure Modes**
   - **With routes (ECONNRESET):** TCP connects but TLS/auth rejected in 6-67ms
   - **Without routes (Timeout):** No response for 10s, packets going to default gateway

4. **AWS Resources Verified Healthy**
   - RDS Instance: `available`
   - RDS Proxy: `available`
   - Proxy Target Health: `AVAILABLE`
   - Security Group: Allows all traffic from `10.0.0.0/16`
   - Password in Secrets Manager matches SST config

5. **DNS Resolution Works**
   - Proxy resolves to VPC private IPs: `10.0.5.194`, `10.0.15.246`
   - These IPs are within the tunnel's advertised ranges

6. **The ECONNRESET Mystery** (Likely RDS Proxy Issue)
   When routes exist, connections are rejected immediately. Possible causes:
   - RDS Proxy TLS handshake failure (OpenSSL test showed "no peer certificate")
   - Auth mechanism mismatch (proxy uses SCRAM-SHA-256)
   - Traffic appears from unexpected source IP after tunnel relay

   **Key finding from [SST Issue #5326](https://github.com/sst/sst/issues/5326):**
   User had identical issue - tunnel connected but proxy rejected connections.
   **Solution:** Disable proxy and connect directly to RDS instance.

### Related GitHub Issues

- [#5657 - Tunnel not working after upgrade](https://github.com/sst/sst/issues/5657) - NAT/bastion IP resolution issues (**THIS FIX WORKED**)
- [#5326 - Tunnel doesn't work for Postgres](https://github.com/sst/sst/issues/5326) - Proxy rejection issue
- [#5008 - Tunnel immediately exits](https://github.com/sst/sst/issues/5008) - macOS permission issues, usernames with periods
- [#5026 - Tunnel exits due to tuntap not cleaned up](https://github.com/sst/sst/issues/5026) - Linux/WSL2 specific

## ✅ FIX APPLIED (2025-12-26)

The NAT toggle workaround from [SST Issue #5657](https://github.com/sst/sst/issues/5657) fixed the tunnel:

```bash
# 1. Change nat from "ec2" to "managed" in sst.config.ts
# 2. Run refresh and deploy (deploy will fail - expected)
AWS_PROFILE=techdev npx sst refresh --stage sin-dev
AWS_PROFILE=techdev npx sst deploy --stage sin-dev  # Fails with EIP conflict

# 3. Change nat back to "ec2" in sst.config.ts
# 4. Deploy again (works!)
AWS_PROFILE=techdev npx sst deploy --stage sin-dev

# 5. Start dev mode - tunnel now works
AWS_PROFILE=techdev npx sst dev --stage sin-dev --mode mono
```

**Result:** Tunnel routes traffic correctly, database connection succeeds in ~900ms.

## Recommended Next Steps

### Option 1: Properly Install SST Tunnel Daemon (Try First)

```bash
# 1. Kill any running sst processes
pkill -f sst

# 2. Run tunnel install with verbose output in interactive terminal
sudo npx sst tunnel install --verbose --print-logs

# 3. Verify daemon installed
ls -la /Library/LaunchDaemons/dev.sst.tunnel.plist
launchctl list | grep sst

# 4. Start sst dev again
AWS_PROFILE=techdev npx sst dev --stage sin-dev --mode mono

# 5. Verify routes persist
netstat -rn | grep '10\.0\.'
```

### Option 2: Connect Directly to RDS Instance (Bypass Proxy)

Based on [SST Issue #5326](https://github.com/sst/sst/issues/5326), the proxy may be rejecting tunnel connections.
Try connecting directly to the RDS instance instead:

```bash
# Direct RDS instance endpoint (bypasses proxy):
Host: solstice-sin-dev-databaseinstance-bdckvktk.cx20ui4g0b7v.ca-central-1.rds.amazonaws.com
IP: 10.0.15.182 (in 10.0.12.0/22 range - within tunnel)

# Test connection (when tunnel routes exist):
PGPASSWORD="WJ7cHVKPLdLdo9BMP2eF4MKf6lIItWxk" psql -h solstice-sin-dev-databaseinstance-bdckvktk.cx20ui4g0b7v.ca-central-1.rds.amazonaws.com -U postgres -d solstice -c "SELECT 1;"

# If this works, update DATABASE_URL in .env to use direct instance endpoint
```

### Option 3: Lambda-Based Migration (Most Reliable)

Since Lambda already has working VPC connectivity, create a migration Lambda:

```bash
# The Lambda can connect - use it to run migrations
# Create a script that the existing Lambda can execute
# Or add drizzle-kit push to the deploy pipeline
```

### Option 4: EC2 Bastion in VPC

```bash
# Create small EC2 instance in same VPC
# SSH in and run drizzle-kit push from there
aws ec2 run-instances --image-id ami-xxx --instance-type t3.micro \
  --subnet-id <private-subnet> --security-group-ids <sg-id>
```

### Option 5: AWS CloudShell with VPC Connector

- CloudShell doesn't have direct VPC access
- Would need a VPC connector or bastion

### Option 6: Try Different Machine/Network

- The tunnel issue may be macOS-specific or network-specific
- Try from a Linux machine or different network

## Commands Reference

```bash
# Start tunnel for sin-dev
AWS_PROFILE=techdev npx sst tunnel --stage sin-dev

# Get database credentials
AWS_PROFILE=techdev npx sst shell --stage sin-dev -- printenv | grep SST_RESOURCE_Database

# Push schema (requires working tunnel)
npx drizzle-kit push --force

# Check CloudWatch logs
LOG_GROUP="/aws/lambda/solstice-sin-dev-WebServerCacentral1Function-bbnokeeh"
AWS_PROFILE=techdev aws logs filter-log-events \
  --log-group-name "$LOG_GROUP" \
  --start-time $(($(date +%s) * 1000 - 600000)) \
  --region ca-central-1

# Health check
curl https://dt1wroatpfxxl.cloudfront.net/api/health
```

## Files Modified

- `.env` - Updated DATABASE_URL to point to sin-dev (was qc-dev)
- `check-users-simple.mjs` - Temporary script for testing (can be deleted)
- `check-users.ts` - Temporary script for testing (can be deleted)
