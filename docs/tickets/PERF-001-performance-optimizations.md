# PERF-001: Performance Optimizations from Load Testing

**Created**: 2025-12-31
**Updated**: 2026-01-07
**Priority**: High
**Status**: In Progress (5/7 tasks done)
**Labels**: performance, infrastructure, production-readiness

## Implementation Status

| Task                             | Status     | PR  |
| -------------------------------- | ---------- | --- |
| k6 status-code breakdown         | ✅ Done    | -   |
| Provisioned concurrency + memory | ✅ Done    | -   |
| QueryClient retry/backoff        | ✅ Done    | -   |
| Vite manualChunks                | ✅ Done    | -   |
| Verify CloudFront compression    | ✅ Done    | -   |
| Test streaming toggle            | ⏳ Pending | -   |
| Fix Playwright nav test          | ⏳ Pending | -   |

---

## Summary

Performance testing on sin-perf identified several optimizations needed before production deployment. The primary issue is a **9.4% error rate at 25 concurrent users** due to Lambda cold starts, which must be addressed for production traffic.

## Test Results Summary

| Metric              | Target  | Result | Status  |
| ------------------- | ------- | ------ | ------- |
| LCP                 | <2500ms | 2284ms | ✅ PASS |
| FCP                 | <1800ms | 2135ms | ⚠️ WARN |
| TTFB                | <500ms  | 380ms  | ✅ PASS |
| TBT                 | <300ms  | 88ms   | ✅ PASS |
| CLS                 | <0.1    | 0      | ✅ PASS |
| Performance Score   | -       | 93/100 | ✅ PASS |
| p95 Latency         | <2000ms | 269ms  | ✅ PASS |
| Error Rate (10 VUs) | <1%     | 0%     | ✅ PASS |
| Error Rate (25 VUs) | <1%     | 9.4%   | ❌ FAIL |

---

## Tasks

### 1. [HIGH] Add Provisioned Concurrency for Lambda Functions

**Problem**: Lambda cold starts cause 400-500ms TTFB on first requests and contribute to 9.4% error rate under load.

**Solution**: Add provisioned concurrency for production stages.

**File**: `sst.config.ts`

```typescript
// Option A: Add to TanstackStart component
new sst.aws.TanstackStart("Web", {
  // ...existing config
  server: {
    memory: "1024 MB", // Increase memory for faster cold starts
    transform: {
      function: (args) => {
        if ($app.stage.endsWith("-prod")) {
          args.provisionedConcurrency = 2;
        }
      },
    },
  },
});

// Option B: If using separate auth function
const authFunction = new sst.aws.Function("AuthHandler", {
  handler: "src/routes/api/auth/$.handler",
  transform: {
    function: {
      provisionedConcurrency: $app.stage === "sin-prod" ? 2 : 0,
    },
  },
});
```

**Estimated Impact**: Reduces error rate from 9.4% to <1%

**Cost**: ~$15-30/month for 2 provisioned instances

---

### 2. [HIGH] Add Client-Side Retry Logic

**Problem**: Transient Lambda failures (502, 503, 504) cause user-visible errors.

**Solution**: Add retry logic to API calls with exponential backoff.

**File**: `src/shared/lib/fetch-with-retry.ts` (new file)

```typescript
interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  retryOn?: number[];
}

export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  options: RetryOptions = {}
): Promise<Response> {
  const { maxRetries = 3, baseDelayMs = 200, retryOn = [502, 503, 504] } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(input, init);

      // Retry on specific status codes (Lambda cold start failures)
      if (retryOn.includes(response.status) && attempt < maxRetries) {
        await delay(baseDelayMs * Math.pow(2, attempt));
        continue;
      }

      return response;
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries) {
        await delay(baseDelayMs * Math.pow(2, attempt));
      }
    }
  }

  throw lastError ?? new Error("Request failed after retries");
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
```

**File**: `src/app/providers.tsx`

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(200 * 2 ** attemptIndex, 2000),
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
    mutations: {
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(200 * 2 ** attemptIndex, 1000),
    },
  },
});
```

**Estimated Impact**: Masks transient failures, improves perceived reliability

---

### 3. [MEDIUM] Verify CloudFront Compression

**Problem**: Lighthouse flagged "Enable text compression" warning.

**Solution**: Verify compression is enabled in CDN configuration.

**File**: `sst.config.ts`

```typescript
new sst.aws.Cdn("WebCdn", {
  // ...existing config
  transform: {
    distribution: {
      defaultCacheBehavior: {
        compress: true, // Ensure this is enabled
        viewerProtocolPolicy: "redirect-to-https",
      },
    },
  },
});
```

**Verification**: After deploy, check response headers include `content-encoding: gzip` or `br`.

---

### 4. [MEDIUM] Optimize Code Splitting for FCP

**Problem**: FCP is 2135ms, slightly over the 1800ms target.

**Solution**: Split vendor chunks to enable parallel loading.

**File**: `vite.config.ts`

```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor chunks for parallel loading
          "vendor-react": ["react", "react-dom"],
          "vendor-tanstack": [
            "@tanstack/react-router",
            "@tanstack/react-query",
          ],
          "vendor-ui": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-popover",
          ],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
```

**Estimated Impact**: 200-400ms improvement in FCP

---

### 5. [LOW] Optimize Lambda Bundle Size

**Problem**: Larger bundles increase cold start time.

**Solution**: Ensure tree shaking and minification are enabled, exclude dev dependencies.

**Status**: ✅ Implemented in `sst.config.ts` server block.

**Estimated Impact**: 50-100ms reduction in cold start time

---

### 6. [HIGH] Test Lambda Response Streaming Toggle

**Problem**: Lambda response streaming in a VPC may not be supported. AWS docs state: "Lambda function URLs do not support response streaming within a VPC environment."

**Solution**: If k6 error breakdown shows mostly 5xx errors, test disabling streaming.

**File**: `vite.config.ts`

```typescript
// Current (may cause issues in VPC):
awsLambda: {
  streaming: true,
},

// Test this if 5xx errors persist:
awsLambda: {
  streaming: false,
},
```

**Diagnosis**: Run updated k6 test and check error breakdown:

- **Mostly `http_5xx`** → Try disabling streaming
- **Mostly `http_429`** → Need concurrency quota increase
- **Mostly `http_401/403`** → Auth/session issue

**Estimated Impact**: Could eliminate 5xx errors entirely if streaming is the cause

---

### 7. [MEDIUM] Verify CloudFront Compression ✅ VERIFIED

**Problem**: Lighthouse flagged "Enable text compression" warning.

**Solution**: Verify compression is enabled after deploy.

**Verification (2026-01-07 on sin-dev)**:

```bash
$ curl -I -H "Accept-Encoding: br, gzip" https://d21gh6khf5uj9x.cloudfront.net/auth/login

content-encoding: br
content-type: text/html; charset=utf-8
```

**Result**: ✅ Brotli compression (`br`) is enabled and working. No further action needed.

---

## Acceptance Criteria

- [ ] Error rate under 25 concurrent users is <1%
- [ ] FCP is <1800ms
- [ ] TTFB remains <500ms
- [ ] No user-visible errors from Lambda cold starts
- [x] Response compression is verified working (Brotli confirmed 2026-01-07)

## Testing Plan

1. Deploy changes to sin-dev
2. Run k6 load test: `BASE_URL=<url> k6 run --duration 60s --vus 25 performance/load-tests/api-load.js`
3. Verify error rate <1%
4. Run Lighthouse: `npx @lhci/cli collect --url=<url>/auth/login`
5. Verify FCP <1800ms

## Related Files

- `performance/PERFORMANCE-REPORT.md` - Full test report
- `performance/load-tests/api-load.js` - k6 load test script
- `e2e/tests/performance/page-load.perf.spec.ts` - Playwright performance tests
- `.lighthouseci/` - Lighthouse reports

---

## Notes

- sin-perf stage was destroyed after testing to avoid costs
- Provisioned concurrency is the highest-impact change
- Consider implementing all HIGH priority items before production launch
