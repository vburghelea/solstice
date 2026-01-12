import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
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
  disabled,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  aggregation: AggregationType;
  options: AggregationType[];
  disabled?: boolean;
  onChange: (next: AggregationType) => void;
  onRemove?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Select
        value={aggregation}
        onValueChange={(value) => onChange(value as AggregationType)}
        disabled={Boolean(disabled)}
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
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          aria-label="Remove measure"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      ) : null}
      {onMoveUp ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onMoveUp}
          aria-label="Move measure up"
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
      ) : null}
      {onMoveDown ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onMoveDown}
          aria-label="Move measure down"
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      ) : null}
    </div>
  );
}
