# VPC Tunnel Connectivity Issue - sin-perf Performance Testing

**Date:** 2026-01-01
**Stage:** sin-perf
**Environment:** AWS ca-central-1, techdev account

## Executive Summary

During performance testing setup, we encountered a persistent issue where the SST tunnel cannot establish working PostgreSQL connections to the RDS database, despite the Lambda functions inside the VPC being able to connect successfully.

## What Works

1. **Lambda-to-RDS Connectivity**: Lambda functions deployed inside the VPC can connect to the RDS Proxy successfully
   - Health check response shows `database.status: "connected"` with ~536-948ms latency
   - CloudFront URL: `https://d3t531uzjt9ny0.cloudfront.net`

2. **SST Tunnel Initialization**: The tunnel starts correctly and reports:

   ```
   Tunnel
   ▤  35.182.147.24
   ➜  Ranges
      10.0.4.0/22
      10.0.12.0/22
      10.0.0.0/22
      10.0.8.0/22
   Waiting for connections...
   ```

3. **TCP Connectivity Through Tunnel**: Raw TCP connections (via `nc`) succeed:

   ```bash
   nc -zv -w 5 10.0.4.172 5432
   # Connection to 10.0.4.172 port 5432 [tcp/postgresql] succeeded!
   ```

4. **DNS Resolution**: RDS Proxy resolves correctly to VPC private IPs:
   - `10.0.4.172` (within 10.0.4.0/22 range)
   - `10.0.15.193` (within 10.0.12.0/22 range)

## What Doesn't Work

1. **PostgreSQL Protocol Through Tunnel**: All attempts to establish PostgreSQL connections fail:
   - `psql` connections result in "server closed the connection unexpectedly"
   - `drizzle-kit push` times out with `CONNECT_TIMEOUT` or fails with `ECONNRESET`

2. **SST Shell Database Operations**: Even `sst shell` which should inject correct environment variables fails with the same timeout errors

## Attempts Made

### Attempt 1: SST Dev Mono Mode (Built-in Tunnel)

```bash
AWS_PROFILE=techdev npx sst dev --stage sin-perf --mode mono
```

- **Result**: Tunnel started but database connections from local dev server timed out
- **Note**: This mode switches to localhost:5173 and removes production Lambda

### Attempt 2: Explicit SST Tunnel

```bash
AWS_PROFILE=techdev npx sst tunnel --stage sin-perf
```

- **Result**: Tunnel starts, TCP works, PostgreSQL fails

### Attempt 3: Direct RDS Connection (Bypassing Proxy)

```bash
DATABASE_URL="postgresql://postgres:***@solstice-sin-perf-databaseinstance-vwfkexrd.cx20ui4g0b7v.ca-central-1.rds.amazonaws.com:5432/solstice?sslmode=require"
npx drizzle-kit push --force
```

- **Result**: Same `ECONNRESET` error

### Attempt 4: Different SSL Modes

Tested with `PGSSLMODE=require`, `prefer`, `allow`, and `disable`

- **Result**: All fail with "server closed the connection unexpectedly"

### Attempt 5: SST Shell for In-VPC Execution

```bash
AWS_PROFILE=techdev npx sst shell --stage sin-perf -- npx drizzle-kit push --force
```

- **Result**: Also times out - appears to route through tunnel, not Lambda

## Infrastructure Details

### VPC Configuration

- **VPC ID**: `vpc-0bdcef5d5b87ae0be`
- **CIDR**: `10.0.0.0/16`
- **NAT**: EC2 instances (not NAT Gateway)
- **Bastion**: Enabled (`bastion: true` in sst.config.ts)

### RDS Configuration

- **Instance**: `solstice-sin-perf-databaseinstance-vwfkexrd`
- **Engine**: PostgreSQL 16.11
- **Status**: Available

### RDS Proxy Configuration

- **Proxy Name**: `solstice-sin-perf-databaseproxy-mfmbxrxo`
- **Endpoint**: `solstice-sin-perf-databaseproxy-mfmbxrxo.proxy-cx20ui4g0b7v.ca-central-1.rds.amazonaws.com`
- **Status**: Available
- **Target Health**: AVAILABLE
- **Auth**: SECRETS (Secrets Manager)
- **IAM Auth**: Disabled
- **Client Password Auth**: POSTGRES_SCRAM_SHA_256
- **Require TLS**: false
- **Debug Logging**: Enabled (for troubleshooting)

### Security Groups

#### RDS Security Group (sg-0953f83575da98840)

- **Inbound**: All protocols from 10.0.0.0/16
- **Outbound**: All protocols to 0.0.0.0/0

#### NAT Instance Security Group (sg-02c8706bc1234a048)

- **Inbound**: All protocols from 0.0.0.0/0
- **Outbound**: All protocols to 0.0.0.0/0

### NAT Instances in sin-perf VPC

| Instance ID         | Private IP | Public IP    | State   |
| ------------------- | ---------- | ------------ | ------- |
| i-0c4706e313ecd9dac | 10.0.3.110 | 15.223.94.20 | running |
| i-041cc1bc139e42716 | 10.0.8.213 | 16.52.16.202 | running |

**Note**: The tunnel reports bastion IP `35.182.147.24` which doesn't match any NAT instance public IPs.

## Suspected Root Causes

1. **SCRAM-SHA-256 Authentication Issue**: The PostgreSQL protocol negotiation may be failing during SCRAM authentication handshake through the WireGuard tunnel

2. **TLS/SSL Handshake Failure**: Despite TCP working, the SSL negotiation required by RDS may be failing through the tunnel

3. **Tunnel MTU/Fragmentation**: WireGuard tunnels can have MTU issues that affect protocols with larger handshake packets

4. **NAT Instance Routing**: Traffic through the bastion may not be properly NATed for return PostgreSQL packets

5. **RDS Proxy Connection Pooling**: The proxy may be detecting the tunnel as an untrusted connection source

## Potential Solutions to Investigate

1. **Use AWS Session Manager** instead of SST tunnel for database operations

2. **Create Lambda-based seeding endpoint** that runs within VPC

3. **Pre-seed database during deployment** using custom CloudFormation/SST resources

4. **Use AWS Database Migration Service** or RDS snapshot for initial data

5. **Debug RDS Proxy logs** (now enabled) to see connection rejection reasons

6. **Check if bastion host needs explicit PostgreSQL port forwarding rules**

7. **Try direct EC2 bastion SSH tunnel** instead of SST WireGuard tunnel

## Current State

- **Infrastructure**: UP and running
- **CloudFront URL**: https://d3t531uzjt9ny0.cloudfront.net
- **Database**: Connected (from Lambda)
- **Schema**: Not pushed (blocked by tunnel issue)
- **Test Data**: Not seeded

## Commands to Resume

```bash
# Check infrastructure status
curl -s https://d3t531uzjt9ny0.cloudfront.net/api/health | jq .

# Check RDS Proxy logs (debug logging enabled)
AWS_PROFILE=techdev aws logs filter-log-events \
  --log-group-name "/aws/rds/proxy/solstice-sin-perf-databaseproxy-mfmbxrxo" \
  --region ca-central-1 --limit 50

# Teardown when done
AWS_PROFILE=techdev npx sst remove --stage sin-perf
```

## Update - NAT Toggle Fix Applied (2026-01-01)

Applied the same NAT toggle workaround that fixed `sin-dev`, and the tunnel now
successfully carries PostgreSQL traffic again.

### Actions Taken

1. **Temporarily switched NAT to managed**
   - Updated `sst.config.ts` `nat: "ec2"` → `nat: "managed"`.
   - Ran:
     ```bash
     AWS_PROFILE=techdev npx sst refresh --stage sin-perf
     AWS_PROFILE=techdev npx sst deploy --stage sin-perf
     ```
   - **Expected failure** occurred due to EIP already associated (this is the
     trigger used to force VPC/NAT resources to reattach).

2. **Switched NAT back to EC2**
   - Reverted `sst.config.ts` `nat: "managed"` → `nat: "ec2"`.
   - Ran:
     ```bash
     AWS_PROFILE=techdev npx sst deploy --stage sin-perf
     ```
   - Deploy completed successfully.

3. **Restarted tunnel and verified routes**
   - Started:
     ```bash
     AWS_PROFILE=techdev npx sst tunnel --stage sin-perf
     ```
   - Tunnel reported bastion `15.223.94.20` and expected `10.0.x.0/22` ranges.
   - Verified routes:
     ```bash
     netstat -rn | rg '10\.0\.'
     ```

4. **PostgreSQL protocol test**
   - With tunnel routes present, the following test succeeded:
     ```bash
     AWS_PROFILE=techdev npx sst shell --stage sin-perf -- \
       psql -h <proxy-host> -U <user> -d <db> -c "SELECT 1;"
     ```
   - When the tunnel drops routes, the same test times out; restarting the
     tunnel restores connectivity.

### Current State

- Tunnel routes appear stable after the NAT toggle.
- PostgreSQL protocol negotiation succeeds through the tunnel.
- Ready to proceed with perf test runbook once perf auth credentials are set.
