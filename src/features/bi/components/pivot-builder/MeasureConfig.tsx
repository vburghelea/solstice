import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Button } from "~/components/ui/button";
import { Trash2 } from "lucide-react";
import type { AggregationType } from "../../bi.schemas";

const aggregationLabels: Record<AggregationType, string> = {
  count: "Count",
  sum: "Sum",
  avg: "Average",
  min: "Min",
  max: "Max",
  count_distinct: "Count distinct",
  median: "Median",
  stddev: "Std dev",
  variance: "Variance",
};

export function MeasureConfig({
  aggregation,
  options,
  onChange,
  onRemove,
}: {
  aggregation: AggregationType;
  options: AggregationType[];
  onChange: (next: AggregationType) => void;
  onRemove?: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Select
        value={aggregation}
        onValueChange={(value) => onChange(value as AggregationType)}
      >
        <SelectTrigger className="h-7 w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {aggregationLabels[option] ?? option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {onRemove ? (
        <Button type="button" variant="ghost" size="icon" onClick={onRemove}>
          <Trash2 className="h-4 w-4" />
        </Button>
      ) : null}
    </div>
  );
}
