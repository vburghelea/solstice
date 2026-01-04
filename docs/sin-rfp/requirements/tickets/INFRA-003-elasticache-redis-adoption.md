# INFRA-003: ElastiCache Redis Adoption (Rate Limiting + Shared Caches)

**Priority:** P2  
**Effort:** 2-3 weeks  
**Status:** Proposed

---

## Summary

Introduce AWS ElastiCache Redis in ca-central-1 to provide shared caching and
server-side rate limiting for the SIN application. This closes the distributed
rate limiting gap, improves BI query performance, and enables cross-instance
concurrency guardrails.

---

## Requirements Addressed

| Requirement     | Description                                     | How Redis Helps                             |
| --------------- | ----------------------------------------------- | ------------------------------------------- |
| **GA-009**      | Configure rate limiting and security thresholds | Server-side limiter with shared counters    |
| **SEC-AGG-002** | Security events, lockouts, and abuse prevention | Distributed throttling for auth/export APIs |
| **BI Spec 6.3** | Query caching for analytics                     | 5-min shared cache for pivot/SQL results    |

---

## Current State

- Client-side rate limiting only (TanStack Pacer); no server-side limiter.
- In-memory caches are per-Lambda instance:
  - `src/features/bi/cache/pivot-cache.ts` (60s TTL, Map-based)
  - `src/features/bi/governance/query-guardrails.ts` (concurrency counters)
  - `src/features/bi/governance/sql-workbench-gate.ts` (5-min readiness cache)
- Permission and org access checks are DB-backed every time:
  - `src/features/roles/permission.service.ts`
  - `src/features/organizations/organizations.access.ts`

---

## Proposed Use Cases + Work Required

### A) Foundation (Overall)

- Add ElastiCache Redis in ca-central-1 VPC (dev/perf single node, prod Multi-AZ).
- Restrict SG access to Lambda/SST VPC; enable TLS and AUTH token.
- Add secrets/env values (example):
  - `RedisHost`, `RedisPort`, `RedisAuthToken`
  - `REDIS_TLS=true`, `REDIS_PREFIX=sin`
- Create `src/lib/redis/client.ts` with server-only `getRedis()` using
  `serverOnly()` or dynamic imports to avoid client bundling.
- Add `src/lib/redis/keys.ts` for key naming and TTL constants.
- Decide and document fail-open vs fail-closed behavior if Redis is down.
- Add monitoring/alerts (memory, evictions, connections, CPU, replication lag).

### B) Server-side Rate Limiting (Security + Abuse)

- Implement Redis-backed limiter in `src/lib/security/rate-limiter.ts`
  (token bucket or sliding window).
- Wire middleware at `src/start.ts` or per-route for:
  - Auth endpoints (login, MFA, password reset)
  - Export endpoints (reports, audit, BI exports)
  - Join requests + invite links
  - High-risk admin APIs
- Key by `{ip}:{userId?}:{route}` and log exceed events to security audit log.
- Add unit tests for limiter behavior + integration tests for throttled flows.

### C) BI Pivot/Query Cache (Performance)

- Replace `src/features/bi/cache/pivot-cache.ts` with Redis-backed cache:
  - Key: `bi:pivot:{orgId}:{userId}:{datasetId}:{queryHash}`
  - TTL: 5 minutes (align with BI spec)
  - Use dataset index sets for targeted invalidation
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

## Acceptance Criteria

- ElastiCache Redis deployed in ca-central-1 with TLS + auth token and restricted SG.
- Server-side rate limiting enforced on auth, export, and join-request flows.
- BI pivot caching shared across instances with 5-minute TTL and targeted invalidation.
- BI concurrency limits enforced across instances without false positives.
- Permission/org access caching reduces DB reads without cross-user leakage.
- Security and performance documentation updated with Redis evidence.

---

## Notes

- Keep Redis data short-lived; avoid storing long-lived PII.
- All Redis access must stay in server-only modules to avoid client bundling.
