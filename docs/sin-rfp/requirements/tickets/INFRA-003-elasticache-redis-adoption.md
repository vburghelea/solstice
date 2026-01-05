# INFRA-003: ElastiCache Redis Adoption (Rate Limiting + Shared Caches)

**Priority:** P2
**Effort:** 2-3 weeks
**Status:** ✅ Verified (2026-01-05)

---

## Summary

Introduce AWS ElastiCache Redis in ca-central-1 to provide shared caching,
server-side rate limiting, and cross-instance guardrails for the SIN
application. This closes the distributed rate limiting gap, improves BI query
performance, and reduces repeated authorization reads while keeping data
short-lived.

---

## Requirements Addressed

| Requirement     | Description                                     | How Redis Helps                             |
| --------------- | ----------------------------------------------- | ------------------------------------------- |
| **GA-009**      | Configure rate limiting and security thresholds | Server-side limiter with shared counters    |
| **SEC-AGG-002** | Security events, lockouts, and abuse prevention | Distributed throttling for auth/export APIs |
| **BI Spec 6.3** | Query caching for analytics                     | 5-min shared cache for pivot/SQL results    |

---

## Current State

- Redis-backed server-side rate limiting is active with fail-open fallback.
- Redis client + key registry are in place with stage-scoped prefixes.
- BI pivot cache, query guardrails, and SQL workbench gate are Redis-backed.
- Permission/org access lookups are cached in Redis with short TTLs.
- `/api/health` includes Redis status and ping latency.
- Observability includes CloudWatch Redis alarms and app metrics for cache hits + 429s.

---

## Target State

- Redis is deployed in the ca-central-1 VPC (dev/perf single node, prod Multi-AZ
  replication group).
- All Redis access happens via server-only helpers with a stage-scoped key
  prefix (avoid cross-stage collisions).
- Server-side rate limiting enforces shared counters and emits audit events.
- BI caches and concurrency guardrails are shared across instances with TTL
  safety.
- Permission/org access caches reduce DB reads without cross-user leakage.
- Observability: CloudWatch alarms + app metrics for cache hit rate and 429s.

---

## Proposed Use Cases + Work Required

### A) Foundation (Overall)

- Add ElastiCache Redis in ca-central-1 VPC (dev/perf single node, prod Multi-AZ).
- Restrict SG access to Lambda/SST VPC; enable TLS and AUTH token.
- Add env values:
  - `REDIS_TLS=true`, `REDIS_PREFIX=sin:${stage}`, `REDIS_ENABLED=true`
- Use node-redis (`redis` package) and document the choice.
- Create `src/lib/redis/client.ts` with server-only `getRedis()` using
  `createServerOnlyFn()` or dynamic imports to avoid client bundling.
- Add `src/lib/redis/keys.ts` for key naming + TTL constants.
- Add a lightweight Redis health check for `/api/health` and internal probes.
- Decide and document fail-open vs fail-closed behavior if Redis is down.
- Normalize REDIS boolean env parsing to avoid `"false"` evaluating as true.
- Add monitoring/alerts (memory, evictions, connections, CPU, replication lag).

### B) Server-side Rate Limiting (Security + Abuse)

- Implement Redis-backed limiter in `src/lib/security/rate-limiter.ts`
  (token bucket or sliding window).
- Align defaults with `securityConfig.rateLimit` and Pacer presets.
- Wire middleware at `src/start.ts` or per-route for:
  - Auth endpoints (login, MFA, password reset)
  - Export endpoints (reports, audit, BI exports)
  - Join requests + invite links
  - High-risk admin APIs
- Key by `{ipHash}:{userId?}:{route}` and log exceed events to the security log.
- Return 429 with `Retry-After`; record metrics for 429 rate and limiter errors.
- Add unit tests for limiter behavior + integration tests for throttled flows.

### C) BI Pivot/Query Cache (Performance)

- Replace `src/features/bi/cache/pivot-cache.ts` with Redis-backed cache:
  - Key: `bi:pivot:{orgId}:{userId}:{datasetId}:{queryHash}`
  - TTL: 5 minutes (align with BI spec)
  - Use dataset index sets for targeted invalidation
  - Use a stable query hash (avoid oversized keys)
- Update `invalidatePivotCache` and keep existing invalidation calls in:
  - `src/features/events/events.mutations.ts`
  - `src/features/forms/forms.mutations.ts`
  - `src/features/organizations/organizations.mutations.ts`
  - `src/features/reporting/reporting.mutations.ts`
- Add cache hit/miss metrics to BI query logging.

### D) BI Concurrency Guardrails (Fairness + Protection)

- Replace in-memory counters in `src/features/bi/governance/query-guardrails.ts`
  with Redis counters and TTL.
- Use a Lua script for atomic check+increment to prevent race conditions.
- Add TTL safety to auto-release slots if a Lambda dies.
- Base TTL on `statementTimeoutMs` + buffer (avoid stale locks).

### E) SQL Workbench Readiness Cache (Shared Warm-Up)

- Move `cachedGate` in `src/features/bi/governance/sql-workbench-gate.ts` to Redis.
- Key by `{datasetIds}:{orgId}:{isGlobalAdmin}` and keep 5-minute TTL.
- Cache last error message to provide consistent feedback across instances.

### F) Permission + Org Access Caching (Latency + DB Load)

- Cache in Redis with 1-5 minute TTL:
  - `PermissionService.isGlobalAdmin`
  - `PermissionService.getUserRoles`
  - `resolveOrganizationAccess` and `listAccessibleOrganizationsForUser`
- Invalidate on role/membership changes in:
  - `src/features/roles/roles.mutations.ts`
  - `src/features/organizations/organizations.mutations.ts`

---

## Failure Modes + Fallbacks

- Default to fail-open for caches (return uncached data) with a short in-memory
  fallback where possible.
- For rate limiting, log a security event when Redis is unavailable. Default to
  fail-open (avoid blocking auth) unless `REDIS_REQUIRED=true`, in which case
  reject with 429s and emit a `rate_limit_unavailable` event.
- Emit metrics when fallback paths are used to support alerting.

---

## Implementation Plan (Suggested Order)

1. Foundation: infra, secrets, client, key registry, health check, alerts.
2. Rate limiting: shared limiter + audit logging + 429 metrics.
3. BI cache + guardrails: pivot cache, concurrency slots, workbench gate.
4. Permission/org access caching + invalidation hooks.
5. Documentation updates and rollout checklist.

---

## Acceptance Criteria

- ElastiCache Redis deployed in ca-central-1 with TLS + auth token and restricted SG.
- Server-side rate limiting enforced on auth, export, and join-request flows.
- BI pivot caching shared across instances with 5-minute TTL and targeted invalidation.
- BI concurrency limits enforced across instances without false positives.
- Permission/org access caching reduces DB reads without cross-user leakage.
- Security and performance documentation updated with Redis evidence.

---

## Implementation Notes (Done)

- Infra: `sst.config.ts` provisions Redis and exports env wiring.
- Client: `src/lib/redis/client.ts`, `src/lib/redis/keys.ts`.
- Health: `src/routes/api/health.ts`.
- Rate limiting: `src/lib/security/rate-limiter.ts`, `src/lib/auth/auth-rate-limit.ts`.
- BI caches/guardrails: `src/features/bi/cache/pivot-cache.ts`,
  `src/features/bi/governance/query-guardrails.ts`,
  `src/features/bi/governance/sql-workbench-gate.ts`.
- Permission/org caching: `src/features/roles/permission.service.ts`,
  `src/features/organizations/organizations.access.ts`.
- Observability: `src/lib/observability/metrics.ts` + CloudWatch alarms in `sst.config.ts`.
- Docs: `docs/SECURITY.md`, `src/features/bi/docs/PERF-bi-dashboard-benchmark.md`.

---

## Dependencies

- SST support for ElastiCache/Redis in the target stack.
- VPC/subnet capacity for Redis nodes in ca-central-1.
- Client library decision (`redis` vs `ioredis`) and package addition.

---

## Decisions

1. Client: node-redis (`redis` package).
2. Cluster mode: single node in dev/perf; Multi-AZ replication group in prod.
3. Fail-open by default; set `REDIS_REQUIRED=true` to fail-closed for rate limiting
   (emit `rate_limit_unavailable` events).
4. Use a single `REDIS_REQUIRED` toggle (no per-feature overrides).

---

## Notes

- Keep Redis data short-lived; avoid storing long-lived PII.
- All Redis access must stay in server-only modules to avoid client bundling.

---

## Verification Results (2026-01-05)

**Test Environment:** `AWS_PROFILE=techdev npx sst dev --stage sin-dev --mode mono`

### Health Check Verification

```json
{
  "services": {
    "redis": {
      "status": "connected",
      "latencyMs": 169
    }
  }
}
```

### Rate Limiting Verification

Triggered rapid auth requests to test rate limiting:

- ✅ 429 responses returned after threshold exceeded
- ✅ `Retry-After` header present in responses
- ✅ 19 `rate_limit_exceeded` events logged to `security_events` table
- ✅ CloudWatch metrics emitted (`RateLimitExceeded` counter)
- ✅ Fail-open behavior works when Redis unavailable (tested in plain `pnpm dev` mode)

### Security Events Logged

```sql
SELECT event_type, COUNT(*) FROM security_events
WHERE created_at > NOW() - INTERVAL '1 hour' GROUP BY event_type;

     event_type      | count
---------------------+-------
 login_fail          |     9
 rate_limit_exceeded |    19
 login_success       |     1
 mfa_success         |     1
```

### SST Tunnel Verification

Redis access works via SST tunnel in dev mode:

```
[Tunnel] |  Tunneling tcp 10.0.15.225:6379
```

**Note:** When running `pnpm dev` directly (without SST dev), Redis shows "disabled"
because `REDIS_ENABLED` and connection env vars are only injected by SST. This is
expected behavior - use `sst dev` for full Redis functionality in local development.

## References

- `docs/SECURITY.md` (rate limiting guidance)
- `docs/rate-limiting-with-pacer.md` (client-side limiter presets)
