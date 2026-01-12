import type { MouseEvent } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Maximize2,
  Minimize2,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "~/components/ui/button";

export function WidgetToolbar({
  title,
  onEdit,
  onRemove,
  onMoveUp,
  onMoveDown,
  onMoveLeft,
  onMoveRight,
  onExpand,
  onShrink,
  statusLabels,
}: {
  title?: string;
  onEdit?: () => void;
  onRemove?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
  onExpand?: () => void;
  onShrink?: () => void;
  statusLabels?: string[];
}) {
  const handleClick = (e: MouseEvent, handler?: () => void) => {
    e.stopPropagation();
    handler?.();
  };

  const showMoveButtons = onMoveUp || onMoveDown || onMoveLeft || onMoveRight;
  const showResizeButtons = onExpand || onShrink;

  return (
    <div className="dashboard-widget-toolbar flex items-center justify-between gap-2 border-b px-3 py-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{title ?? "Widget"}</span>
        {statusLabels?.length
          ? statusLabels.map((label) => (
              <span
                key={label}
                className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] uppercase tracking-wide text-amber-700"
              >
                {label}
              </span>
            ))
          : null}
      </div>
      <div className="flex items-center gap-1">
        {showMoveButtons ? (
          <div className="flex items-center gap-0.5 border-r pr-1 mr-1">
            {onMoveUp ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => handleClick(e, onMoveUp)}
                aria-label="Move widget up"
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </Button>
            ) : null}
            {onMoveDown ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => handleClick(e, onMoveDown)}
                aria-label="Move widget down"
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </Button>
            ) : null}
            {onMoveLeft ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => handleClick(e, onMoveLeft)}
                aria-label="Move widget left"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
              </Button>
            ) : null}
            {onMoveRight ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => handleClick(e, onMoveRight)}
                aria-label="Move widget right"
              >
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            ) : null}
          </div>
        ) : null}
        {showResizeButtons ? (
          <div className="flex items-center gap-0.5 border-r pr-1 mr-1">
            {onShrink ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => handleClick(e, onShrink)}
                aria-label="Shrink widget"
              >
                <Minimize2 className="h-3.5 w-3.5" />
              </Button>
            ) : null}
            {onExpand ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => handleClick(e, onExpand)}
                aria-label="Expand widget"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </Button>
            ) : null}
          </div>
        ) : null}
        {onEdit ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={(e) => handleClick(e, onEdit)}
            aria-label="Edit widget"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        ) : null}
        {onRemove ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={(e) => handleClick(e, onRemove)}
            aria-label="Remove widget"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
