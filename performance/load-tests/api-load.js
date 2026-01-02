import http from "k6/http";
import { check, sleep, group } from "k6";
import { Rate, Trend, Counter } from "k6/metrics";

// Existing metrics
const errorRate = new Rate("errors");
const apiLatency = new Trend("api_latency");
const authLatency = new Trend("auth_latency");

// NEW: categorize failures by status code
const http429 = new Counter("http_429");
const http401 = new Counter("http_401");
const http403 = new Counter("http_403");
const http5xx = new Counter("http_5xx");
const errorSamples = new Counter("error_samples");

// Test configuration
export const options = {
  stages: [
    { duration: "30s", target: 5 }, // Warm-up
    { duration: "30s", target: 10 }, // Ramp up to 10 users
    { duration: "1m", target: 10 }, // Stay at 10
    { duration: "30s", target: 25 }, // Ramp to 25
    { duration: "1m", target: 25 }, // Stay at 25
    { duration: "30s", target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"], // 95% under 500ms
    errors: ["rate<0.01"], // <1% error rate
    auth_latency: ["p(95)<200"], // Auth should be fast
  },
};

// Use IPv6 for local dev (Vite binds to IPv6 localhost)
const BASE_URL = __ENV.BASE_URL || "http://[::1]:5173";
const SESSION_COOKIE = __ENV.SESSION_COOKIE || "";

const headers = SESSION_COOKIE
  ? { Cookie: SESSION_COOKIE, "Content-Type": "application/json" }
  : { "Content-Type": "application/json" };

/**
 * Record result and categorize by status code.
 * This helps identify whether errors are:
 * - 429: Rate limiting / Lambda throttling
 * - 401/403: Auth failures
 * - 5xx: Server errors (cold starts, VPC issues, streaming problems)
 */
function recordResult(res, kind) {
  const status = res.status;

  // "error" for this test means non-2xx
  const isError = status >= 400;
  errorRate.add(isError);

  // Categorize failures
  if (status === 429) http429.add(1);
  if (status === 401) http401.add(1);
  if (status === 403) http403.add(1);
  if (status >= 500) http5xx.add(1);

  // Sample a tiny number of error bodies for debugging (1% of errors)
  if (isError && Math.random() < 0.01) {
    errorSamples.add(1);
    console.log(
      `[k6][${kind}] status=${status} url=${res.url} body=${String(res.body).slice(0, 300)}`,
    );
  }
}

export default function () {
  group("Session Check", () => {
    const res = http.get(`${BASE_URL}/api/auth/get-session`, {
      headers,
      tags: { name: "auth_get_session" },
    });
    check(res, { "session 200": (r) => r.status === 200 });
    authLatency.add(res.timings.duration, { endpoint: "get-session" });
    recordResult(res, "session");
  });

  sleep(0.5);

  group("Health Check", () => {
    const res = http.get(`${BASE_URL}/api/health`, {
      headers,
      tags: { name: "api_health" },
    });
    check(res, { "health 200": (r) => r.status === 200 });
    apiLatency.add(res.timings.duration, { endpoint: "health" });
    recordResult(res, "health");
  });

  sleep(0.5);

  // Only test authenticated endpoints if we have a session
  if (SESSION_COOKIE) {
    group("Dashboard Data", () => {
      const endpoints = [`${BASE_URL}/api/auth/get-session`];

      for (const url of endpoints) {
        const res = http.get(url, { headers, tags: { name: "dashboard_data" } });
        check(res, { [`${url} ok`]: (r) => r.status < 400 });
        apiLatency.add(res.timings.duration, { endpoint: "dashboard" });
        recordResult(res, "dashboard");
        sleep(0.2);
      }
    });
  }

  sleep(1);
}

export function handleSummary(data) {
  const timestamp = new Date().toISOString().split("T")[0];
  return {
    [`performance/reports/k6/${timestamp}-summary.json`]: JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}

function textSummary(data, opts) {
  const metrics = data.metrics;
  let summary = "\n=== K6 Load Test Summary ===\n\n";

  if (metrics.http_req_duration?.values) {
    const vals = metrics.http_req_duration.values;
    summary += `HTTP Request Duration:\n`;
    summary += `  p50: ${vals["p(50)"]?.toFixed(2) ?? "N/A"}ms\n`;
    summary += `  p95: ${vals["p(95)"]?.toFixed(2) ?? "N/A"}ms\n`;
    summary += `  p99: ${vals["p(99)"]?.toFixed(2) ?? "N/A"}ms\n\n`;
  }

  if (metrics.http_reqs?.values) {
    summary += `Total Requests: ${metrics.http_reqs.values.count ?? 0}\n`;
    summary += `Request Rate: ${metrics.http_reqs.values.rate?.toFixed(2) ?? "N/A"}/s\n\n`;
  }

  if (metrics.errors?.values) {
    summary += `Error Rate: ${((metrics.errors.values.rate ?? 0) * 100).toFixed(2)}%\n\n`;
  }

  // NEW: Status code breakdown
  summary += `=== Error Breakdown ===\n`;
  summary += `  429 (Throttled): ${metrics.http_429?.values?.count ?? 0}\n`;
  summary += `  401 (Unauthorized): ${metrics.http_401?.values?.count ?? 0}\n`;
  summary += `  403 (Forbidden): ${metrics.http_403?.values?.count ?? 0}\n`;
  summary += `  5xx (Server Error): ${metrics.http_5xx?.values?.count ?? 0}\n`;
  summary += `  Error Samples Logged: ${metrics.error_samples?.values?.count ?? 0}\n`;

  return summary;
}
