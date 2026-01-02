const baseUrl = process.env.PERF_BASE_URL || "http://localhost:5173";

module.exports = {
  ci: {
    collect: {
      url: [
        `${baseUrl}/auth/login`,
        `${baseUrl}/dashboard`,
        `${baseUrl}/dashboard/sin/`,
        `${baseUrl}/dashboard/sin/reporting`,
        `${baseUrl}/dashboard/sin/forms`,
        `${baseUrl}/dashboard/sin/analytics`,
      ],
      numberOfRuns: 3,
      puppeteerScript: "./performance/lhci-auth.cjs",
      settings: {
        preset: "desktop",
        throttling: {
          cpuSlowdownMultiplier: 1,
        },
      },
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
      outputDir: "./performance/reports/lighthouse",
    },
  },
};
