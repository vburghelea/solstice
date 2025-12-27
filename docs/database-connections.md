# Database Connection Guide

This guide explains how to use database connections with proper pooling in Solstice.

## Overview

Solstice uses AWS RDS PostgreSQL for production (deployed via SST) and provides two types of database connections:

1. **Pooled Connection** - For serverless functions and API routes (via RDS Proxy)
2. **Unpooled Connection** - For migrations and long-running operations

## Connection Types

### Pooled Connection (via `pooledDb`)

The pooled connection uses RDS Proxy to efficiently handle concurrent requests in serverless environments.

**When to use:**

- API routes and serverless functions
- Short-lived queries
- High-concurrency scenarios
- Lambda functions

**Example:**

```typescript
import { pooledDb } from "~/db/connections";

export async function loader() {
  const db = await pooledDb();
  const users = await db.select().from(users);
  return { users };
}
```

### Unpooled Connection (via `unpooledDb`)

The unpooled connection creates a direct connection to the database, bypassing the proxy.

**When to use:**

- Database migrations
- Batch import/export operations
- Long-running queries
- Operations requiring session-level features (prepared statements, advisory locks)
- Development and debugging

**Example:**

```typescript
import { unpooledDb } from "~/db/connections";

// In a migration script
export async function runMigration() {
  const db = await unpooledDb();
  await db.transaction(async (tx) => {
    // Long-running migration logic
  });
}
```

### Automatic Connection Selection (via `getDb`)

The `getDb` export automatically selects the appropriate connection type based on your environment:

```typescript
import { getDb } from "~/db/connections";

const db = await getDb();
// Automatically uses:
// - Pooled connection in serverless environments (Lambda)
// - Unpooled connection in development or traditional servers
```

## Connection Resolution

### SST Linked Resources (Production)

When deployed via SST, the database credentials are automatically linked:

```typescript
// SST injects Resource.Database with:
// - host, port, username, password, database
// Connection string is built automatically
```

### Environment Variables (Local Development)

For local development, configure these environment variables:

```bash
# Primary database URL (used as fallback)
DATABASE_URL="postgresql://user:pass@host/db"

# Direct connection for migrations (optional)
DATABASE_URL_UNPOOLED="postgresql://user:pass@direct.host/db"
```

### Priority Order

**For Pooled Connections:**

1. SST linked `Resource.Database` (production)
2. `DATABASE_POOLED_URL` (explicit override)
3. `NETLIFY_DATABASE_URL` (legacy)
4. `DATABASE_URL` (fallback)

**For Unpooled Connections:**

1. SST linked `Resource.Database` (production)
2. `DATABASE_UNPOOLED_URL` (explicit override)
3. `DATABASE_URL_UNPOOLED` (manual setup)
4. `NETLIFY_DATABASE_URL_UNPOOLED` (legacy)
5. `DATABASE_URL` (fallback)

## Running Migrations

### Via SST Tunnel (Production)

```bash
# Open tunnel to RDS via bastion host
AWS_PROFILE=techprod npx sst tunnel --stage qc-prod
AWS_PROFILE=techprod npx sst tunnel --stage sin-prod

# In another terminal, run migrations
DATABASE_URL="postgres://..." pnpm db migrate
```

### Via SST Shell

```bash
# Run drizzle-kit with SST context
AWS_PROFILE=techprod npx sst shell --stage qc-prod -- pnpm db migrate
AWS_PROFILE=techprod npx sst shell --stage sin-prod -- pnpm db migrate
```

### Local Development

```bash
# Set DATABASE_URL in .env, then:
pnpm db migrate
```

## Best Practices

1. **Use the default `getDb` export** for most cases - it automatically selects the right connection type

2. **Explicitly use `pooledDb`** when you know you're in a serverless function:

   ```typescript
   import { pooledDb } from "~/db/connections";

   export const myServerFn = createServerFn().handler(async () => {
     const db = await pooledDb();
     // API route logic
   });
   ```

3. **Explicitly use `unpooledDb`** for migrations and maintenance scripts

4. **Monitor connection usage** - RDS Proxy has connection limits based on instance size

5. **Use transactions appropriately** - RDS Proxy pins connections during transactions

## Troubleshooting

### "Too many connections" error

- You're likely hitting RDS Proxy or instance limits
- Check CloudWatch metrics for connection counts
- Ensure idle connections are released

### "Connection timeout" in migrations

- Migrations should use `unpooledDb` for longer timeouts
- Check security groups allow access from your IP/bastion
- Verify VPC configuration

### Different behavior between environments

- Check which connection type is being used (console logs show this)
- Verify SST linked resources are properly configured
- Check environment variables in Lambda console

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Lambda         │────▶│  RDS Proxy      │────▶│  RDS PostgreSQL │
│  Functions      │     │  (Connection    │     │  (Multi-AZ in   │
│                 │     │   Pooling)      │     │   Production)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
┌─────────────────┐     ┌─────────────────┐            │
│  Bastion Host   │────▶│  Direct         │────────────┘
│  (Migrations)   │     │  Connection     │
└─────────────────┘     └─────────────────┘
```
