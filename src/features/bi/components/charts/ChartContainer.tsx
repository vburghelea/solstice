import { useEffect, useState, type CSSProperties, type ComponentType } from "react";
import { Loader2 } from "lucide-react";

export function ChartContainer({
  option,
  style,
}: {
  option: unknown;
  style?: CSSProperties;
}) {
  type ChartComponentProps = { option: unknown; style: CSSProperties };
  const [ChartComponent, setChartComponent] =
    useState<ComponentType<ChartComponentProps> | null>(null);

  useEffect(() => {
    let active = true;
    import("echarts-for-react")
      .then((mod) => {
        if (active) {
          setChartComponent(() => mod.default as ComponentType<ChartComponentProps>);
        }
      })
      .catch(() => {
        if (active) setChartComponent(null);
      });
    return () => {
      active = false;
    };
  }, []);

  if (!ChartComponent) {
    return (
      <div className="flex h-64 items-center justify-center rounded-md border border-dashed">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading chart...
        </div>
      </div>
    );
  }

  return <ChartComponent option={option} style={style ?? { height: 320 }} />;
}
