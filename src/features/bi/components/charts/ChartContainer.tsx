import {
  useEffect,
  useId,
  useState,
  type CSSProperties,
  type ComponentType,
} from "react";
import { Loader2 } from "lucide-react";

export function ChartContainer({
  option,
  style,
  onEvents,
  ariaLabel,
  ariaDescription,
}: {
  option: unknown;
  style?: CSSProperties;
  onEvents?: Record<string, (params: unknown) => void>;
  ariaLabel?: string;
  ariaDescription?: string;
}) {
  type ChartComponentProps = {
    option: unknown;
    style: CSSProperties;
    onEvents?: Record<string, (params: unknown) => void>;
    "aria-label"?: string;
    "aria-describedby"?: string;
    role?: string;
    echarts?: unknown;
  };
  type ChartModule = {
    Component: ComponentType<ChartComponentProps>;
    echarts: unknown;
  };
  const [chartModule, setChartModule] = useState<ChartModule | null>(null);
  const descriptionId = useId();

  useEffect(() => {
    let active = true;
    Promise.all([import("echarts-for-react"), import("echarts")])
      .then(([reactModule, echartsModule]) => {
        if (!active) return;
        const Component =
          reactModule.default as unknown as ComponentType<ChartComponentProps>;
        const echarts =
          "default" in echartsModule ? echartsModule.default : echartsModule;
        setChartModule({ Component, echarts });
      })
      .catch(() => {
        if (active) setChartModule(null);
      });
    return () => {
      active = false;
    };
  }, []);

  if (!chartModule) {
    return (
      <div
        className={
          "flex h-64 items-center justify-center rounded-md " + "border border-dashed"
        }
      >
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading chart...
        </div>
      </div>
    );
  }

  const descriptionKey = ariaDescription ? descriptionId : undefined;
  const ChartComponent = chartModule.Component;

  return (
    <div className="relative">
      {ariaDescription ? (
        <p id={descriptionId} className="sr-only">
          {ariaDescription}
        </p>
      ) : null}
      <ChartComponent
        option={option}
        style={style ?? { height: 320 }}
        role="img"
        aria-label={ariaLabel ?? "Chart"}
        {...(descriptionKey ? { "aria-describedby": descriptionKey } : {})}
        {...(onEvents ? { onEvents } : {})}
        echarts={chartModule.echarts}
      />
    </div>
  );
}
