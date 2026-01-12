import { ArrowDownRight, ArrowUpRight, Plus } from "lucide-react";
import { Button } from "~/components/ui/button";

type FieldMoveButtonsProps = {
  label: string;
  interactionMode: "drag" | "buttons";
  onAddToRows?: () => void;
  onAddToColumns?: () => void;
  onAddToMeasures?: () => void;
};

export function FieldMoveButtons({
  label,
  interactionMode,
  onAddToRows,
  onAddToColumns,
  onAddToMeasures,
}: FieldMoveButtonsProps) {
  const isAlwaysVisible = interactionMode === "buttons";
  const visibilityClass = isAlwaysVisible
    ? "flex"
    : "hidden group-hover:flex group-focus-within:flex";

  return (
    <div className={`${visibilityClass} items-center gap-1`}>
      {onAddToRows ? (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={onAddToRows}
          aria-label={`Add ${label} to rows`}
        >
          <ArrowDownRight className="h-3.5 w-3.5" aria-hidden />
          Rows
        </Button>
      ) : null}
      {onAddToColumns ? (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={onAddToColumns}
          aria-label={`Add ${label} to columns`}
        >
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
          Cols
        </Button>
      ) : null}
      {onAddToMeasures ? (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={onAddToMeasures}
          aria-label={`Add ${label} to measures`}
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          Measure
        </Button>
      ) : null}
    </div>
  );
}
