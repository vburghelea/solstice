# INFRA-001: Migrate from Neon to AWS RDS PostgreSQL

## Status

**PLANNED** - Required for SIN RFP compliance

## Summary

Migrate the production database from Neon (serverless PostgreSQL) to AWS RDS PostgreSQL in `ca-central-1` to meet SIN data residency, backup/DR, and compliance requirements.

## Requirements Addressed

| Requirement     | Description                                 | How RDS Satisfies                           |
| --------------- | ------------------------------------------- | ------------------------------------------- |
| **ADR-001**     | All production data in AWS `ca-central-1`   | RDS deployed in ca-central-1                |
| **DM-AGG-005**  | Backup, DR, archiving, secure cloud hosting | Multi-AZ, PITR, automated backups           |
| **SEC-AGG-003** | PIPEDA compliance, encryption               | KMS encryption at rest, TLS in transit      |
| **SEC-AGG-004** | Audit log retention (7 years)               | RDS + S3 Glacier for archive                |
| **DR Plan**     | RPO: 1 hour, RTO: 4 hours                   | PITR (5-min granularity), Multi-AZ failover |

## Current State

- **Database**: Neon PostgreSQL (serverless)
- **Region**: US (Neon's default)
- **Connection**: Via `@neondatabase/serverless` driver
- **Backup**: Neon-managed (limited control)
- **Compliance Gap**: Data not in Canada, no explicit PIPEDA controls

## Target State

### Production Environment

```
SST Postgres Component (RDS PostgreSQL)
├── Region: ca-central-1
├── Instance: t4g.large (2 vCPU, 8GB RAM)
├── Storage: 200 GB gp3 (expandable to 64 TB)
├── Multi-AZ: Enabled (RTO requirement)
├── Proxy: Enabled (Lambda connection pooling)
├── Encryption: KMS at rest, TLS in transit
├── Backup retention: 35 days
├── PITR: Enabled (RPO requirement)
└── Estimated cost: ~$200-250/month
```

### Dev Environment (RDS Postgres)

```
SST Postgres Component (RDS PostgreSQL)
├── Region: ca-central-1
├── Instance: t4g.micro (small, low cost)
├── Storage: 50 GB gp3
├── Multi-AZ: Disabled
├── Proxy: Enabled (Lambda connection pooling)
├── Encryption: KMS at rest, TLS in transit
├── Backup retention: 7 days
└── Estimated cost: ~$15-25/month
```

### Perf Environment (RDS Postgres, ephemeral)

```
SST Postgres Component (RDS PostgreSQL)
├── Region: ca-central-1
├── Instance: t4g.large (stress testing)
├── Storage: 200 GB gp3
├── Multi-AZ: Disabled by default (enable if needed)
├── Proxy: Enabled (Lambda connection pooling)
├── Encryption: KMS at rest, TLS in transit
├── Backup retention: 7 days
└── Usage: created for 20M-row tests, removed when idle
```

## Implementation Plan

### Phase 1: Infrastructure Setup (Week 1)

#### 1.1 Update SST Configuration

```typescript
// sst.config.ts
export default $config({
  app(input) {
    return {
      name: "solstice",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage ?? ""),
      home: "aws",
      providers: {
        aws: { region: "ca-central-1" },
        "aws-native": { region: "ca-central-1" },
      },
    };
  },
  async run() {
    const stage = $app.stage ?? "dev";
    const isProd = stage === "production";
    const isPerf = stage === "perf";

    // VPC required for RDS (NAT allows outbound calls from Lambdas)
    const vpc = new sst.aws.Vpc("Vpc", {
      bastion: true, // For direct DB access during migrations
      nat: "ec2",
    });

    const dbVersion = "16.11";
    const dbConfig = isProd
      ? { instance: "t4g.large", storage: "200 GB", multiAz: true }
      : isPerf
        ? { instance: "t4g.large", storage: "200 GB", multiAz: false }
        : { instance: "t4g.micro", storage: "50 GB", multiAz: false };

    const database = new sst.aws.Postgres("Database", {
      vpc,
      version: dbVersion,
      instance: dbConfig.instance,
      storage: dbConfig.storage,
      multiAz: dbConfig.multiAz,
      proxy: true,
    });

    // Existing secrets
    const secrets = {
      baseUrl: new sst.Secret("BaseUrl"),
      betterAuthSecret: new sst.Secret("BetterAuthSecret"),
      googleClientId: new sst.Secret("GoogleClientId"),
      googleClientSecret: new sst.Secret("GoogleClientSecret"),
      squareEnv: new sst.Secret("SquareEnv"),
      squareApplicationId: new sst.Secret("SquareApplicationId"),
      squareAccessToken: new sst.Secret("SquareAccessToken"),
      squareLocationId: new sst.Secret("SquareLocationId"),
      squareWebhookSignatureKey: new sst.Secret("SquareWebhookSignatureKey"),
    };

    // Note: DatabaseUrl secret no longer needed (use linked database resource)

    const web = new sst.aws.TanStackStart("Web", {
      buildCommand: "pnpm build",
      link: [database, ...Object.values(secrets)],
      vpc,
      environment: {
        SST_STAGE: stage,
        NODE_ENV: isProd || isPerf ? "production" : "development",
        VITE_BASE_URL: secrets.baseUrl.value,
      },
    });

    return {
      url: web.url,
      dbHost: database.host,
      dbPort: database.port,
    };
  },
});
```

#### 1.2 Update Database Connection Code

```typescript
// src/db/connections.ts
import { createServerOnlyFn } from "@tanstack/react-start";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type LinkedDatabase = {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
};

const getConnectionString = async () => {
  const { Resource } = await import("sst");
  const resource = Resource as typeof Resource & { Database?: LinkedDatabase };
  if (resource.Database) {
    const { username, password, host, port, database } = resource.Database;
    return `postgres://${username}:${password}@${host}:${port}/${database}`;
  }

  const { getPooledDbUrl } = await import("../lib/env.server");
  return getPooledDbUrl();
};

/**
 * Pooled connection for serverless workloads (RDS Proxy).
 */
export const pooledDb = createServerOnlyFn(async () => {
  const sql = postgres(await getConnectionString(), {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  return drizzle(sql, {
    schema,
    casing: "snake_case",
  });
});

/**
 * For migrations and batch imports - uses unpooled connection.
 * Note: In production, connect via bastion host or SST tunnel.
 */
export const getUnpooledDb = createServerOnlyFn(async () => {
  const sql = postgres(await getConnectionString(), {
    max: 1,
    idle_timeout: 0,
    connect_timeout: 30,
  });

  return drizzle({
    client: sql,
    schema,
    casing: "snake_case",
  });
});

export const closeConnections = createServerOnlyFn(async () => {
  if (sqlInstance) {
    await sqlInstance.end({ timeout: 3 });
    sqlInstance = null;
    dbInstance = null;
  }
});
```

#### 1.3 Update Drizzle Config

```typescript
// drizzle.config.ts
import { defineConfig } from "drizzle-kit";
import { Resource } from "sst";

const resource = Resource as typeof Resource & {
  Database?: {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
  };
};

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: resource.Database
    ? {
        host: resource.Database.host,
        port: resource.Database.port,
        user: resource.Database.username,
        password: resource.Database.password,
        database: resource.Database.database,
      }
    : {
        // Set via environment when running migrations
        url: process.env.DATABASE_URL_UNPOOLED!,
      },
  casing: "snake_case",
});
```

### Phase 2: Deploy Dev Environment (Week 1)

Use the `sin-*` stages for viaSport stacks.

```bash
# Deploy dev stage with RDS
AWS_PROFILE=techdev npx sst deploy --stage qc-dev

# Verify connection
AWS_PROFILE=techdev npx sst shell --stage qc-dev
# Then in shell: node -e "console.log(Resource.Database)"
```

**Verification:**

- [ ] RDS instance created in ca-central-1
- [ ] RDS Proxy configured
- [ ] Can run migrations via SST tunnel
- [ ] Application connects successfully

### Phase 2b: Deploy Perf Environment (Week 1)

```bash
# Deploy perf stage on demand for stress tests
AWS_PROFILE=techdev npx sst deploy --stage qc-perf
```

**Verification:**

- [ ] RDS perf instance created in ca-central-1
- [ ] Can run migrations and bulk imports

### Phase 3: Data Migration (Week 2)

#### 3.1 Export from Neon

```bash
# Export schema and data from Neon
pg_dump --no-owner --no-privileges \
  -h ep-xxx.us-east-2.aws.neon.tech \
  -U neondb_owner \
  -d neondb \
  -F c -f neon_backup.dump
```

#### 3.2 Import to RDS

```bash
# Connect via SST tunnel or bastion
AWS_PROFILE=techprod npx sst tunnel --stage qc-prod

# In another terminal, restore to RDS
pg_restore --no-owner --no-privileges \
  -h localhost -p 5432 \
  -U postgres \
  -d solstice \
  neon_backup.dump
```

#### 3.3 Data Validation

```sql
-- Compare row counts
SELECT 'users' as table_name, COUNT(*) FROM "user"
UNION ALL
SELECT 'sessions', COUNT(*) FROM session
UNION ALL
SELECT 'accounts', COUNT(*) FROM account
UNION ALL
SELECT 'teams', COUNT(*) FROM teams
UNION ALL
SELECT 'events', COUNT(*) FROM events
UNION ALL
SELECT 'memberships', COUNT(*) FROM memberships;

-- Verify foreign key integrity
SELECT conname, conrelid::regclass, confrelid::regclass
FROM pg_constraint
WHERE contype = 'f' AND NOT convalidated;
```

### Phase 4: Deploy Production (Week 2-3)

```bash
# Deploy production with RDS
AWS_PROFILE=techprod npx sst deploy --stage qc-prod
AWS_PROFILE=techprod npx sst deploy --stage sin-prod

# Verify deployment
curl -s https://your-cloudfront-url/api/health
```

**Verification:**

- [ ] RDS instance created with Multi-AZ
- [ ] RDS Proxy configured
- [ ] KMS encryption enabled
- [ ] Automated backups configured (35 days)
- [ ] PITR enabled
- [ ] Application health check passes

### Phase 5: Cutover (Week 3)

1. **Maintenance window announcement** (24hr notice)
2. **Set Neon to read-only** (prevent writes)
3. **Final data sync** (incremental if possible)
4. **Update DNS/CloudFront** to new deployment
5. **Smoke test** all critical flows
6. **Monitor** for 24-48 hours
7. **Decommission Neon** after 7-day holding period

## Rollback Plan

If issues arise after cutover:

1. **Immediate** (< 1 hour): Revert CloudFront to old deployment
2. **Short-term** (< 24 hours): Re-enable Neon, update connection strings
3. **Data sync**: Export changes from RDS, import to Neon

## Testing Checklist

### Functional Tests

- [ ] User registration and login
- [ ] OAuth flows (Google, GitHub)
- [ ] Team CRUD operations
- [ ] Event CRUD operations
- [ ] Membership purchases (Square integration)
- [ ] Email notifications (SendGrid)

### Performance Tests

- [ ] Page load times < 3s
- [ ] API response times < 500ms
- [ ] Concurrent user simulation (100 users)

### DR Tests

- [ ] Simulate AZ failure (Multi-AZ failover)
- [ ] Point-in-time recovery to 1 hour ago
- [ ] Backup restore to new instance

## Cost Comparison

| Component | Neon (Current) | RDS Production     | RDS Dev          | RDS Perf (Ephemeral) |
| --------- | -------------- | ------------------ | ---------------- | -------------------- |
| Compute   | ~$25/month     | ~$120/month        | ~$15/month       | ~$120/month          |
| Storage   | Included       | ~$23/month (200GB) | ~$6/month (50GB) | ~$23/month (200GB)   |
| Proxy     | N/A            | ~$22/month         | ~$22/month       | ~$22/month           |
| Multi-AZ  | N/A            | +$120/month        | N/A              | N/A                  |
| Backup    | Included       | Included           | Included         | Included             |
| **Total** | **~$25/month** | **~$285/month**    | **~$43/month**   | **~$165/month**      |

**Notes:**

- Production cost increase justified by compliance requirements
- Reserved Instances (1-year) reduce production cost by ~30%
- Perf stage is deployed only for stress tests to control cost

## Dependencies

- [ ] AWS VPC created in ca-central-1
- [ ] IAM permissions for RDS management
- [ ] SST v3 with Postgres component
- [ ] Bastion host or SST tunnel for migrations
- [ ] AWS SSO login completed for the target account (see Deployment Notes)

## Deployment Notes

- Use `techdev` for synthetic data in `dev` and `perf`.
- Use `techprod` for `production` only.
- Before any deploy: `aws sso login --profile techdev` or
  `aws sso login --profile techprod`.
- **Cost control:** Any `perf` or `production` deploy requires explicit
  double-approval before running `sst deploy`.

## Open Questions

1. **Custom domain**: Should we set up Route 53 + ACM before or after migration?
2. **Reserved Instances**: Commit to 1-year RI immediately or wait?
3. **Read replicas**: Need for reporting/analytics workloads?
4. **Connection string rotation**: How to handle RDS credential rotation?

## References

- [SST Postgres Documentation](https://sst.dev/docs/component/aws/postgres/)
- [SST Postgres Documentation](https://sst.dev/docs/component/aws/postgres/)
- [SIN Implementation Backlog v2](../SIN-IMPLEMENTATION-BACKLOG-V2.md)
- [Hosting Compliance](../hosting-compliance.md)
- [SST Migration Plan](../sst-migration-plan.md)
- [AWS RDS Multi-AZ](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.MultiAZ.html)
- [RDS Backup and Restore](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_WorkingWithAutomatedBackups.html)

## Acceptance Criteria

- [ ] Production database running in AWS ca-central-1
- [ ] Multi-AZ enabled with automatic failover
- [ ] Automated backups with 35-day retention
- [ ] PITR enabled with 5-minute granularity
- [ ] KMS encryption at rest verified
- [ ] TLS encryption in transit verified
- [ ] RDS Proxy handling Lambda connections
- [ ] All existing data migrated with integrity verified
- [ ] Application passing all E2E tests
- [ ] DR runbook documented and tested
- [ ] Neon decommissioned after holding period
