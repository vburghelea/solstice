import { useMemo } from "react";
import type { CSSProperties } from "react";
import { ChartContainer } from "./ChartContainer";
import { extractNumericValue } from "../../utils/chart-values";

export interface ChartElementClick {
  rowValues?: Record<string, string>;
  columnValues?: Record<string, string>;
  seriesName?: string;
  value?: number | null;
}

export interface ChartBrushSelection {
  range?: [unknown, unknown];
}

export function ChartWrapper({
  options,
  style,
  onElementClick,
  onBrushSelect,
  ariaLabel,
  ariaDescription,
}: {
  options: unknown;
  style?: CSSProperties;
  onElementClick?: (params: ChartElementClick) => void;
  onBrushSelect?: (params: ChartBrushSelection) => void;
  ariaLabel?: string;
  ariaDescription?: string;
}) {
  const computedAriaLabel = ariaLabel || "Chart visualization";
  const onEvents = useMemo(() => {
    const events: Record<string, (params: unknown) => void> = {};

    if (onElementClick) {
      events["click"] = (params) => {
        const payload = params as {
          data?: {
            rowValues?: Record<string, string>;
            columnValues?: Record<string, string>;
          };
          seriesName?: string;
          value?: unknown;
        };
        const next: ChartElementClick = {
          value: extractNumericValue(payload.value),
        };
        if (payload.data?.rowValues) next.rowValues = payload.data.rowValues;
        if (payload.data?.columnValues) next.columnValues = payload.data.columnValues;
        if (payload.seriesName) next.seriesName = payload.seriesName;
        onElementClick(next);
      };
    }

    if (onBrushSelect) {
      events["brushselected"] = (params) => {
        const payload = params as {
          batch?: Array<{ areas?: Array<{ coordRange?: [unknown, unknown] }> }>;
        };
        const range = payload.batch?.[0]?.areas?.[0]?.coordRange;
        const next: ChartBrushSelection = {};
        if (range) next.range = range;
        onBrushSelect(next);
      };
    }

    return Object.keys(events).length > 0 ? events : undefined;
  }, [onBrushSelect, onElementClick]);

  return (
    <ChartContainer
      option={options}
      {...(style ? { style } : {})}
      {...(onEvents ? { onEvents } : {})}
      ariaLabel={computedAriaLabel}
      {...(ariaDescription ? { ariaDescription } : {})}
    />
  );
}
