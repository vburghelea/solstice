# Performance Testing Plan - SIN Application

## Overview

This plan outlines a comprehensive approach to performance testing the SIN application, focusing on page loading times, API response times, and identifying performance bottlenecks under moderate load.

### Goals

1. **Measure baseline page load times** - All phases: initial load, navigation, data loading
2. **Profile API endpoints** - Response times and throughput
3. **Identify bottlenecks** - Slow queries, render blocking, bundle size issues
4. **Load testing** - Behavior under concurrent users

### Parameters

- **Environment:** Prefer production build on local or a perf/staging stage;
  use sin-dev only for functional smoke checks
- **Load Level:** Moderate (10-25 concurrent users); avoid shared dev unless
  scheduled
- **Scope:** Baseline audit + optional CI/observability setup
- **Data:** Seeded, non-PII test data with reset between runs

### Page Load Phases Measured

1. **Initial Load** - First visit: bundle download, SSR, hydration
2. **Navigation Speed** - Client-side routing between pages
3. **Data Loading** - How quickly data appears after page shell renders
4. **Cache State** - Cold vs warm cache runs for each route

---

## 1. Testing Categories

### A. Frontend Performance (Page Load Times)

**What we measure:**

- **LCP** (Largest Contentful Paint) - When main content loads
- **FCP** (First Contentful Paint) - When first content appears
- **INP** (Interaction to Next Paint) - Responsiveness to user input
- **TBT** (Total Blocking Time) - Main thread blocking
- **CLS** (Cumulative Layout Shift) - Visual stability
- **Bundle sizes** - JS/CSS payload analysis

### B. Backend Performance (API Response Times)

**What we measure:**

- **TTFB** (Time to First Byte) - Server response time
- **API latency** - Per-endpoint response times (p50, p95, p99)
- **Database query time** - Slow query identification
- **Server function overhead** - TanStack Start function timing

### C. Load Testing (Concurrent Users)

**What we measure:**

- **Throughput** - Requests per second at various loads
- **Latency under load** - How response times degrade
- **Error rates** - Failures under concurrent access
- **Resource utilization** - Lambda/RDS capacity

---

## 2. Recommended Tools

### Frontend Performance

| Tool                                                    | Purpose                    | Integration                  |
| ------------------------------------------------------- | -------------------------- | ---------------------------- |
| **Playwright + Lighthouse**                             | Automated lab metrics      | Run against production build |
| **web-vitals**                                          | Real user monitoring (RUM) | Optional prod-only           |
| **rollup-plugin-visualizer** or **source-map-explorer** | Bundle size analysis       | One-time audit               |

### Backend Performance

| Tool                      | Purpose                      | Integration           |
| ------------------------- | ---------------------------- | --------------------- |
| **Server-Timing headers** | Per-request timing breakdown | Add to API middleware |
| **Drizzle query logging** | SQL query timing             | Enable in dev mode    |
| **AWS X-Ray**             | Distributed tracing          | SST integration       |

### Load Testing

| Tool           | Purpose               | Why                                     |
| -------------- | --------------------- | --------------------------------------- |
| **k6**         | Load testing          | Best-in-class, scriptable, good metrics |
| **autocannon** | Quick HTTP benchmarks | Fast Node.js tool for spot checks       |

---

## 3. Pages to Test

### Priority 1: High-Traffic User Pages

| Route                      | Expected Load  | Complexity               |
| -------------------------- | -------------- | ------------------------ |
| `/auth/login`              | Every user     | Auth + form              |
| `/dashboard`               | Every session  | Data fetch + render      |
| `/dashboard/sin/`          | Primary portal | Multiple data sources    |
| `/dashboard/sin/reporting` | Core workflow  | List + status queries    |
| `/dashboard/sin/forms`     | Core workflow  | Form list + metadata     |
| `/dashboard/sin/analytics` | Data-heavy     | Report builder + queries |

### Priority 2: Admin Pages

| Route                                | Expected Load | Complexity              |
| ------------------------------------ | ------------- | ----------------------- |
| `/dashboard/admin/sin/`              | Admin users   | Dashboard cards         |
| `/dashboard/admin/sin/organizations` | Moderate      | Org hierarchy tree      |
| `/dashboard/admin/sin/forms`         | Moderate      | Form builder UI         |
| `/dashboard/admin/sin/audit`         | Low but heavy | Large log queries       |
| `/dashboard/admin/sin/reporting`     | Moderate      | Cycle + task management |

### Priority 3: Data Operations

| Route                          | Expected Load    | Complexity               |
| ------------------------------ | ---------------- | ------------------------ |
| `/dashboard/sin/forms/$formId` | Per submission   | Form render + validation |
| `/dashboard/sin/imports`       | Batch operations | File processing status   |
| Report exports                 | On-demand        | Query + file generation  |

---

## 4. API Endpoints to Profile

### Authentication & Session

- `POST /api/auth/sign-in/email` - Login latency
- `GET /api/auth/get-session` - Session validation (every request)
- `POST /api/auth/two-factor/verify` - MFA verification

### Data Queries (Server Functions)

- `getOrganizations` - Org list for context
- `getReportingTasks` - User's reporting tasks
- `getFormSubmissions` - Submission history
- `getAuditLogs` - Audit log queries (potentially slow)
- `getReportData` - Analytics queries

### Mutations

- `submitForm` - Form submission + validation
- `createReport` - Report generation
- `runImport` - Import batch processing

Confirm actual route paths and auth requirements before profiling.

---

## 5. Implementation Plan

### Phase 1: Lighthouse CI Integration (Day 1)

Add automated Core Web Vitals measurement to CI/CD. Run against a
production build (`pnpm build && pnpm start`) instead of the Vite dev server.

**Setup:**

```bash
pnpm add -D @lhci/cli playwright-lighthouse
```

**Create:** `performance/lighthouse.config.js`

```javascript
const baseUrl = process.env.PERF_BASE_URL || "http://localhost:3000";

module.exports = {
  ci: {
    collect: {
      url: [
        `${baseUrl}/auth/login`,
        `${baseUrl}/dashboard`,
        `${baseUrl}/dashboard/sin/`,
        // ... more routes
      ],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        "first-contentful-paint": ["warn", { maxNumericValue: 2000 }],
        "largest-contentful-paint": ["warn", { maxNumericValue: 2500 }],
        "total-blocking-time": ["warn", { maxNumericValue: 300 }],
        "cumulative-layout-shift": ["warn", { maxNumericValue: 0.1 }],
      },
    },
    upload: {
      target: "filesystem",
      outputDir: "./performance/reports",
    },
  },
};
```

### Phase 2: Playwright Performance Tests (Day 1-2)

Extend existing Playwright setup with performance measurement.

**Create:** `e2e/tests/performance/page-load.perf.spec.ts`

```typescript
import { test, expect } from "@playwright/test";

const baseURL = process.env.BASE_URL ?? "http://localhost:3000";

const routes = [
  { name: "Login", path: "/auth/login", readySelector: "form" },
  { name: "Dashboard", path: "/dashboard", readySelector: "[data-ready]" },
  { name: "SIN Portal", path: "/dashboard/sin/", readySelector: "[data-ready]" },
  // ... more routes
];

for (const route of routes) {
  test(`Performance: ${route.name}`, async ({ page }) => {
    // Start timing
    const startTime = Date.now();

    // Navigate
    await page.goto(`${baseURL}${route.path}`, { waitUntil: "load" });

    // Wait for a route-specific readiness signal (replace selectors as needed)
    await page.waitForSelector(route.readySelector);

    const loadTime = Date.now() - startTime;

    // Get Web Vitals via Performance API
    const metrics = await page.evaluate(() => {
      const entries = performance.getEntriesByType(
        "navigation",
      )[0] as PerformanceNavigationTiming;
      return {
        ttfb: entries.responseStart - entries.requestStart,
        domContentLoaded: entries.domContentLoadedEventEnd - entries.startTime,
        load: entries.loadEventEnd - entries.startTime,
      };
    });

    // Log results
    console.log(`${route.name}: Load=${loadTime}ms, TTFB=${metrics.ttfb}ms`);

    // Assert thresholds
    expect(loadTime).toBeLessThan(3000); // 3s max
    expect(metrics.ttfb).toBeLessThan(500); // 500ms TTFB
  });
}
```

### Phase 3: Server Timing Headers (Day 2)

Add timing breakdown to API responses.

**Create:** `src/lib/server/timing.ts`

```typescript
import { performance } from "node:perf_hooks";

export class ServerTiming {
  private timings: Map<string, number> = new Map();
  private starts: Map<string, number> = new Map();

  start(name: string) {
    this.starts.set(name, performance.now());
  }

  end(name: string) {
    const start = this.starts.get(name);
    if (start) {
      this.timings.set(name, performance.now() - start);
    }
  }

  getHeader(): string {
    return Array.from(this.timings.entries())
      .map(([name, dur]) => `${name};dur=${dur.toFixed(1)}`)
      .join(", ");
  }
}

// Usage in API routes or middleware:
// const timing = new ServerTiming();
// timing.start("db");
// const result = await db.query(...);
// timing.end("db");
// return new Response(body, {
//   headers: { "Server-Timing": timing.getHeader() },
// });
```

### Phase 4: Database Query Logging (Day 2)

Enable query visibility in development and use database tooling for timings.

**Update:** `src/db/connections.ts`

```typescript
const db = drizzle(client, {
  schema,
  logger: process.env.NODE_ENV === "development",
});
```

**Timing options:**

- RDS Performance Insights or `pg_stat_statements` for query durations
- Postgres `log_min_duration_statement` in dev/perf

### Phase 5: k6 Load Testing (Day 3)

Create load test scripts for API endpoints.
Use a perf/staging stage when possible and avoid shared dev during peak hours.

**Install:**

```bash
brew install k6  # or download from k6.io
```

**Create:** `performance/load-tests/api-load.js`

```javascript
import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

// Custom metrics
const errorRate = new Rate("errors");
const apiLatency = new Trend("api_latency");

// Test configuration
export const options = {
  stages: [
    { duration: "30s", target: 10 }, // Ramp up to 10 users
    { duration: "1m", target: 10 }, // Stay at 10
    { duration: "30s", target: 25 }, // Ramp to 25
    { duration: "1m", target: 25 }, // Stay at 25
    { duration: "30s", target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"], // 95% under 500ms
    errors: ["rate<0.01"], // <1% error rate
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
const SESSION_COOKIE = __ENV.SESSION_COOKIE;
const params = SESSION_COOKIE ? { headers: { Cookie: SESSION_COOKIE } } : {};

export default function () {
  // Test session endpoint
  const sessionRes = http.get(`${BASE_URL}/api/auth/get-session`, params);
  check(sessionRes, { "session 200": (r) => r.status === 200 });
  apiLatency.add(sessionRes.timings.duration);
  errorRate.add(sessionRes.status !== 200);

  sleep(1);

  // Test dashboard data
  const dashRes = http.get(`${BASE_URL}/api/dashboard/data`, params);
  check(dashRes, { "dashboard 200": (r) => r.status === 200 });
  apiLatency.add(dashRes.timings.duration);

  sleep(1);
}
```

Note: set `SESSION_COOKIE` from an authenticated browser session; otherwise
requests may return 401 and skew results.

**Run:**

```bash
k6 run performance/load-tests/api-load.js
```

### Phase 6: Bundle Analysis (Day 3)

Analyze JavaScript bundle sizes.

**Install:**

```bash
pnpm add -D source-map-explorer
```

**Add script to package.json:**

```json
{
  "scripts": {
    "analyze:bundle": "pnpm build && npx source-map-explorer dist/assets/*.js"
  }
}
```

Note: adjust the `dist/` path if the build output differs.

---

## 6. Metrics & Thresholds

### Page Load Targets

| Metric    | Good   | Needs Work | Poor   |
| --------- | ------ | ---------- | ------ |
| LCP       | <2.5s  | 2.5-4s     | >4s    |
| INP       | <200ms | 200-500ms  | >500ms |
| FCP       | <1.8s  | 1.8-3s     | >3s    |
| TBT (lab) | <200ms | 200-600ms  | >600ms |
| CLS       | <0.1   | 0.1-0.25   | >0.25  |

Note: INP replaces TTI for responsiveness; treat TTI as legacy if referenced.

### API Response Targets

| Endpoint Type     | p50    | p95    | p99     |
| ----------------- | ------ | ------ | ------- |
| Session/Auth      | <50ms  | <100ms | <200ms  |
| Simple queries    | <100ms | <200ms | <500ms  |
| Complex queries   | <300ms | <500ms | <1000ms |
| Report generation | <1s    | <3s    | <5s     |

### Load Test Targets (techdev/perf - 10-25 users)

| Metric           | Target          |
| ---------------- | --------------- |
| Concurrent users | 10-25 sustained |
| Error rate       | <1%             |
| p95 latency      | <500ms          |
| Throughput       | >30 req/s       |

---

## 7. Bottleneck Identification

### Common Performance Issues to Check

**Frontend:**

- [ ] Large JavaScript bundles (>500KB)
- [ ] Render-blocking CSS/JS
- [ ] Unoptimized images
- [ ] Too many network requests
- [ ] No code splitting
- [ ] Missing caching headers

**Backend:**

- [ ] N+1 query patterns
- [ ] Missing database indexes
- [ ] Large payload responses
- [ ] No response compression
- [ ] Cold start latency (Lambda)
- [ ] Slow external API calls

**Database:**

- [ ] Full table scans
- [ ] Missing indexes on foreign keys
- [ ] Large result sets without pagination
- [ ] Complex joins without optimization
- [ ] Connection pool exhaustion

---

## 8. Output Artifacts

### Performance Dashboard

Create `performance/README.md` with:

- Latest benchmark results
- Historical trends
- Known bottlenecks
- Optimization recommendations
- Link to raw reports in `performance/reports/YYYYMMDD/`

---

## 9. Optional: CI Integration (Regression Prevention)

Add performance checks to pull requests to catch regressions.

### GitHub Actions Workflow

**Create:** `.github/workflows/performance.yml`

```yaml
name: Performance Checks

on:
  pull_request:
    branches: [main]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"

      - run: pnpm install
      - run: pnpm build

      - name: Start server
        run: pnpm start &

      - name: Wait for server
        run: npx wait-on http://localhost:3000

      - name: Run Lighthouse CI
        run: pnpm exec lhci autorun
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
          PERF_BASE_URL: http://localhost:3000

      - name: Upload Lighthouse Report
        uses: actions/upload-artifact@v4
        with:
          name: lighthouse-report
          path: performance/reports/
```

### PR Comment Integration

Lighthouse CI can post performance scores as PR comments:

- Shows LCP, FCP, TBT, CLS changes vs main branch
- Fails PR if metrics exceed thresholds
- Links to full HTML report

---

## 10. Optional: Real-User Monitoring (RUM)

Add client-side performance tracking for production insights.

### web-vitals Integration

**Install:**

```bash
pnpm add web-vitals
```

**Create:** `src/lib/performance/web-vitals.ts`

```typescript
import { onLCP, onFCP, onCLS, onTTFB, onINP } from "web-vitals";

type Metric = {
  name: string;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  navigationType: string;
};

function sendToAnalytics(metric: Metric) {
  // Option 1: Console logging (dev)
  console.log(`[Web Vitals] ${metric.name}: ${metric.value} (${metric.rating})`);

  // Option 2: Send to analytics endpoint
  // navigator.sendBeacon('/api/analytics/vitals', JSON.stringify(metric));

  // Option 3: Send to third-party (Vercel Analytics, Datadog, etc.)
  // window.gtag?.('event', metric.name, { value: metric.value });
}

export function initWebVitals() {
  onLCP(sendToAnalytics);
  onFCP(sendToAnalytics);
  onCLS(sendToAnalytics);
  onTTFB(sendToAnalytics);
  onINP(sendToAnalytics);
}
```

**Add to app entry:** `src/app/providers.tsx`

```typescript
import { useEffect } from 'react';
import { initWebVitals } from '~/lib/performance/web-vitals';

export function Providers({ children }) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      initWebVitals();
    }
  }, []);

  return <>{children}</>;
}
```

### Analytics Endpoint (Optional)

**Create:** `src/routes/api/analytics/vitals.ts`

```typescript
import { createAPIFileRoute } from "@tanstack/react-start/api";

export const APIRoute = createAPIFileRoute("/api/analytics/vitals")({
  POST: async ({ request }) => {
    const metric = await request.json();

    // Store in database or forward to monitoring service
    console.log("[RUM]", metric);

    return new Response(null, { status: 204 });
  },
});
```

### Third-Party Options

| Service                | Pros                  | Cons                      |
| ---------------------- | --------------------- | ------------------------- |
| **Vercel Analytics**   | Easy setup, good UI   | Vercel-only               |
| **Datadog RUM**        | Full observability    | Cost at scale             |
| **Sentry Performance** | Already using Sentry? | Additional feature        |
| **Custom endpoint**    | Full control          | Build dashboards yourself |

---

## 11. Monitoring Tiers Summary

### Tier 1: One-Time Audit (Required)

- Run Lighthouse on all routes
- Run Playwright performance tests
- Run k6 load tests (10-25 users)
- Generate performance report
- **Effort:** 1-2 days

### Tier 2: CI Integration (Recommended)

- Add Lighthouse CI to GitHub Actions
- Block PRs that regress performance
- Track metrics over time
- **Effort:** 2-4 hours setup

### Tier 3: Real-User Monitoring (Optional)

- Add web-vitals to production
- Track actual user experience
- Correlate with backend metrics
- **Effort:** 4-8 hours setup + ongoing

### Report Template

```markdown
# Performance Report - [Date]

## Summary

- Pages tested: X
- API endpoints: Y
- Load test peak: Z concurrent users

## Key Findings

1. [Finding 1]
2. [Finding 2]

## Metrics by Route

| Route       | LCP | FCP | TTFB | Bundle |
| ----------- | --- | --- | ---- | ------ |
| /auth/login | Xms | Xms | Xms  | XKB    |

## Bottlenecks Identified

1. [Issue]: [Impact] → [Recommendation]

## Action Items

- [ ] [Fix 1]
- [ ] [Fix 2]
```

---

## 12. Execution Schedule

### Day 1: Frontend Setup

- [ ] Install Lighthouse CI
- [ ] Create Playwright performance tests
- [ ] Run initial baseline on all routes
- [ ] Analyze bundle sizes

### Day 2: Backend Instrumentation

- [ ] Add Server-Timing headers
- [ ] Enable database query logging
- [ ] Profile key API endpoints
- [ ] Identify slow queries

### Day 3: Load Testing

- [ ] Install and configure k6
- [ ] Write load test scenarios
- [ ] Run load tests at 10, 25 users
- [ ] Analyze results and error rates

### Day 4: Analysis & Report

- [ ] Compile all metrics
- [ ] Identify top 5 bottlenecks
- [ ] Create performance report
- [ ] Prioritize optimization tasks

---

## 13. File Structure

```
performance/
├── README.md                    # Results dashboard
├── lighthouse.config.js         # Lighthouse CI config
├── load-tests/
│   ├── api-load.js             # k6 API load test
│   ├── user-journey.js         # k6 user flow test
│   └── config.json             # Test configuration
├── reports/
│   ├── lighthouse/             # Lighthouse reports
│   ├── k6/                     # k6 results
│   └── [date]-summary.md       # Daily summaries
└── scripts/
    ├── run-lighthouse.sh       # Lighthouse runner
    └── run-load-test.sh        # k6 runner

e2e/tests/performance/
├── page-load.perf.spec.ts      # Page load tests
└── api-timing.perf.spec.ts     # API timing tests

src/lib/server/
└── timing.ts                   # Server timing utility
```

---

## 14. Quick Start Commands

```bash
# Install dependencies
pnpm add -D @lhci/cli playwright-lighthouse

# Run Lighthouse on specific page (production build running)
PERF_BASE_URL=http://localhost:3000 pnpm exec lhci collect \
  --url=http://localhost:3000/dashboard/sin/

# Run Playwright performance tests
BASE_URL=http://localhost:3000 pnpm test:e2e --grep="Performance"

# Run k6 load test
k6 run performance/load-tests/api-load.js

# Analyze bundle
pnpm analyze:bundle

# Full performance suite (optional if script added)
pnpm test:perf
```
