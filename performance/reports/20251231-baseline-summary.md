# Performance Report - Local Baseline

## Summary

- **Date**: $(date +%Y-%m-%d)
- **Commit SHA**: $(git rev-parse --short HEAD)
- **Stage**: localhost (sin-dev database)
- **Environment**: Development (Vite + SST dev mode)

## Local Baseline Results

### k6 Load Test (10 VUs, 1 minute)

| Metric               | Value     | Target | Status |
| -------------------- | --------- | ------ | ------ |
| Session endpoint p95 | 12ms      | <200ms | PASS   |
| Health endpoint p95  | 318ms     | <500ms | PASS   |
| Error rate           | 0.00%     | <1%    | PASS   |
| Throughput           | 8.4 req/s | -      | -      |

### Playwright Performance Tests

| Route      | Load Time | TTFB | DOM Ready | Status |
| ---------- | --------- | ---- | --------- | ------ |
| Login Page | 58ms      | 8ms  | 15ms      | PASS   |

### Cache Behavior

- **Cold Load**: ~30ms
- **Warm Load**: ~32ms
- **Delta**: Negligible (fast local dev)

## Notes

- Local dev server with Vite HMR
- Database: sin-dev RDS via SST tunnel
- All targets within acceptable thresholds

## Next Steps

- [ ] Deploy sin-perf stage
- [ ] Seed 20M synthetic rows
- [ ] Run full load tests at 25 concurrent users
- [ ] Generate production performance report
