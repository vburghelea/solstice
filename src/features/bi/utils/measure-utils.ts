import type { PivotMeasure } from "../bi.schemas";

const fallbackId = () =>
  `measure_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const createMeasureId = (seed?: string) => {
  if (seed) return `metric:${seed}`;
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return fallbackId();
};

export const ensureMeasureId = (
  measure: PivotMeasure,
): PivotMeasure & { id: string } => ({
  ...measure,
  id: measure.id ?? createMeasureId(measure.metricId),
});
