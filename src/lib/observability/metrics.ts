import { createServerOnlyFn } from "@tanstack/react-start";

type MetricDimensions = Record<string, string>;

type MetricInput = {
  name: string;
  value: number;
  unit?: "Count" | "Milliseconds" | "None";
  namespace?: string;
  dimensions?: MetricDimensions;
};

const resolveStage = createServerOnlyFn(async () => {
  const { getSSTStage, isProduction } = await import("~/lib/env.server");
  return getSSTStage() ?? (isProduction() ? "prod" : "local");
});

const emitMetric = async (input: MetricInput) => {
  try {
    const stage = await resolveStage();
    const dimensions = { Stage: stage, ...input.dimensions };
    const dimensionKeys = Object.keys(dimensions);
    const metricName = input.name;

    const payload = {
      _aws: {
        Timestamp: Date.now(),
        CloudWatchMetrics: [
          {
            Namespace: input.namespace ?? "Solstice/App",
            Dimensions: [dimensionKeys],
            Metrics: [{ Name: metricName, Unit: input.unit ?? "Count" }],
          },
        ],
      },
      ...dimensions,
      [metricName]: input.value,
    };

    console.log(JSON.stringify(payload));
  } catch (error) {
    console.warn("Failed to emit metric", error);
  }
};

export const recordRateLimitMetric = async (params: { bucket: string }) => {
  await emitMetric({
    name: "RateLimitExceeded",
    value: 1,
    dimensions: { Bucket: params.bucket },
  });
};

export const recordPivotCacheMetric = async (params: {
  hit: boolean;
  source: "redis" | "memory";
}) => {
  await emitMetric({
    name: params.hit ? "BiPivotCacheHit" : "BiPivotCacheMiss",
    value: 1,
    dimensions: { CacheSource: params.source },
  });
};

/**
 * Emits CloudWatch metrics for high-severity security events.
 * Only significant events (account_locked, account_flagged, login_anomaly)
 * should emit metrics to avoid noise from individual login failures.
 */
export const recordSecurityEventMetric = async (params: {
  eventType: string;
  riskScore?: number;
}) => {
  const severity =
    params.riskScore !== undefined && params.riskScore >= 60
      ? "high"
      : params.riskScore !== undefined && params.riskScore >= 30
        ? "medium"
        : "low";

  await emitMetric({
    name: "SecurityEvent",
    value: 1,
    dimensions: {
      EventType: params.eventType,
      Severity: severity,
    },
  });
};
