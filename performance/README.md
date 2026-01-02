# Performance Testing

This directory contains performance testing infrastructure for the SIN application.

## Quick Start

```bash
# Install dependencies
pnpm install
brew install k6  # if not already installed

# Run baseline tests (requires dev server running)
pnpm dev  # in another terminal

# Lighthouse CI
PERF_BASE_URL=http://localhost:5173 pnpm exec lhci autorun

# Playwright performance tests
pnpm test:e2e --grep="Performance" --workers=1

# k6 load tests
k6 run performance/load-tests/api-load.js
```

## Directory Structure

```
performance/
├── README.md                    # This file
├── lighthouse.config.js         # Lighthouse CI configuration
├── lhci-auth.js                # Lighthouse authentication script
├── load-tests/
│   └── api-load.js             # k6 API load test
├── reports/
│   ├── lighthouse/             # Lighthouse CI reports
│   └── k6/                     # k6 load test results
└── scripts/                    # Helper scripts
```

## Test Types

### 1. Lighthouse CI (Core Web Vitals)

Measures: LCP, FCP, TBT, CLS, INP

```bash
PERF_BASE_URL=http://localhost:5173 \
PERF_EMAIL="test@example.com" \
PERF_PASSWORD="password" \
pnpm exec lhci autorun
```

### 2. Playwright Performance Tests

Located in: `e2e/tests/performance/`

```bash
pnpm test:e2e --grep="Performance" --workers=1
```

### 3. k6 Load Testing

```bash
# Against local dev
k6 run performance/load-tests/api-load.js

# Against sin-perf with auth
BASE_URL=https://<sin-perf-url> \
SESSION_COOKIE="<cookie>" \
k6 run performance/load-tests/api-load.js
```

## Thresholds

### Page Load Targets

| Metric | Good   | Needs Work | Poor   |
| ------ | ------ | ---------- | ------ |
| LCP    | <2.5s  | 2.5-4s     | >4s    |
| FCP    | <1.8s  | 1.8-3s     | >3s    |
| TBT    | <200ms | 200-600ms  | >600ms |
| CLS    | <0.1   | 0.1-0.25   | >0.25  |

### API Response Targets

| Endpoint Type   | p50    | p95    | p99     |
| --------------- | ------ | ------ | ------- |
| Session/Auth    | <50ms  | <100ms | <200ms  |
| Simple queries  | <100ms | <200ms | <500ms  |
| Complex queries | <300ms | <500ms | <1000ms |

## Reports

Reports are saved to:

- Lighthouse: `performance/reports/lighthouse/`
- k6: `performance/reports/k6/`

## See Also

- `docs/sin-rfp/review-plans/performance-testing-plan.md`
- `docs/sin-rfp/review-plans/performance-test-runbook.md`
