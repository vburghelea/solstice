# Performance Test Report - SIN Application

**Date:** 2026-01-01
**Stage:** sin-perf (isolated performance testing environment)
**Environment:** AWS ca-central-1, techdev account

## Executive Summary

This performance test run encountered significant infrastructure challenges that limited our ability to complete the full test suite. The sin-perf environment was successfully deployed but subsequent database connectivity and DNS resolution issues prevented completion of the planned tests.

## Test Phases Completed

### Phase 1: Infrastructure Deployment

**Status:** Completed with issues

- SST deployment to sin-perf stage completed successfully
- Resources created:
  - RDS PostgreSQL database with RDS Proxy
  - Lambda functions (main web handler + scheduled tasks)
  - CloudFront distribution
  - VPC with NAT instances
  - ECS cluster for batch imports
  - SQS queues for notifications

**Initial Health Check:** Passed

```json
{
  "status": "degraded",
  "services": {
    "database": {
      "status": "connected",
      "latencyMs": 562
    }
  }
}
```

The "degraded" status was expected due to empty membership types table.

### Phase 2: Database Schema & Seeding

**Status:** Failed - VPC connectivity issues

**Issue:** SST tunnel failed to establish proper connectivity to the RDS Proxy within the VPC. Multiple attempts with different approaches all resulted in `ECONNRESET` errors:

1. `sst shell` - Connection reset
2. `sst tunnel` - Tunnel started but connections failed
3. `sst dev` - Same connectivity issues

**Root Cause Analysis:**

- The Lambda functions had working VPC connectivity (health check succeeded from Lambda)
- Local-to-VPC tunnel routing was not functioning correctly
- Possible issues with NAT instance routing or security group rules for the tunnel

### Phase 3: Lighthouse CI Tests

**Status:** Failed - DNS resolution issues

After the SST dev/tunnel processes were started, DNS resolution for the CloudFront distribution failed consistently:

```
nslookup d1hdo86oj583yd.cloudfront.net
*** Can't find d1hdo86oj583yd.cloudfront.net: No answer
```

This prevented Lighthouse from accessing the deployed application.

### Phase 4: Playwright Performance Tests

**Status:** Not executed

Due to DNS resolution issues, automated browser tests could not reach the sin-perf environment.

### Phase 5: k6 Load Tests

**Status:** Not executed

Load testing requires both:

1. Working API endpoints (blocked by DNS issues)
2. Seeded test data (blocked by VPC connectivity)

## Playwright Tests Against sin-dev (Local)

Prior to the sin-perf deployment attempt, Playwright performance tests were successfully run against sin-dev via SST tunnel:

### Results (sin-dev with SST tunnel latency)

| Test                    | Status | Load Time                  | TTFB    | Notes                          |
| ----------------------- | ------ | -------------------------- | ------- | ------------------------------ |
| Login Page - Load Time  | Pass   | ~200ms                     | ~50ms   | Public route                   |
| Signup Page - Load Time | Pass   | ~200ms                     | ~50ms   | Public route                   |
| Profile - Load Time     | Pass   | ~5000ms                    | ~5500ms | SST tunnel latency             |
| Settings - Load Time    | Pass   | ~4800ms                    | ~5400ms | SST tunnel latency             |
| Cold vs Warm Cache      | Pass   | Cold: ~200ms, Warm: ~100ms | -       | 50% improvement                |
| SPA Navigation          | Pass   | ~53ms avg                  | -       | 99% faster than full page load |

**Key Finding:** SPA navigation (53ms) is dramatically faster than full page loads (4956ms) due to SST tunnel latency to remote database.

**Threshold Notes:**

- Local dev thresholds are generous (10s) due to SST tunnel adding 3-6s latency
- Production targets should be:
  - Page load: <3000ms
  - TTFB: <500ms
  - SPA navigation: <1000ms

## Build Performance Analysis

The latest production build shows:

### Bundle Sizes

| Asset                  | Size     | Gzipped |
| ---------------------- | -------- | ------- |
| main-\*.js             | 700 KB   | 191 KB  |
| echarts (index-\*.js)  | 1,136 KB | 377 KB  |
| sql-\*.js (CodeMirror) | 383 KB   | 127 KB  |
| xlsx-\*.js             | 333 KB   | 113 KB  |
| vendor-tanstack        | 150 KB   | 47 KB   |
| vendor-ui (Radix)      | 108 KB   | 34 KB   |

**Recommendation:** Consider lazy-loading echarts and xlsx bundles as they're only needed for BI/analytics features.

## Infrastructure Recommendations

### For Future Performance Test Runs:

1. **VPC Connectivity:**
   - Investigate SST tunnel routing issues
   - Consider using AWS Session Manager or Bastion host as alternative
   - Document the working configuration for future reference

2. **Seeding Strategy:**
   - Create a Lambda-based seeding endpoint for VPC-internal execution
   - Or run seed scripts during deployment via custom resources

3. **Test Data:**
   - Pre-seed the sin-perf database during deployment
   - Use smaller representative datasets (1M rows instead of 20M)

4. **DNS Stability:**
   - Ensure SST dev/tunnel processes don't interfere with system DNS
   - Test DNS resolution before and after starting SST processes

## Action Items

- [ ] Investigate SST tunnel VPC routing
- [ ] Create Lambda-based database seeding endpoint
- [ ] Add DNS health checks to performance test preflight
- [ ] Document working VPC connectivity patterns
- [ ] Consider dedicated performance test automation pipeline

## Environment Cleanup

sin-perf infrastructure was torn down after the test run to avoid unnecessary costs.

---

**Report Generated:** 2026-01-01
**Test Framework:** Playwright 1.57, Lighthouse CI 0.15
