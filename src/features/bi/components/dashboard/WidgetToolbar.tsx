import type { MouseEvent } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "~/components/ui/button";

export function WidgetToolbar({
  title,
  onEdit,
  onRemove,
  statusLabels,
}: {
  title?: string;
  onEdit?: () => void;
  onRemove?: () => void;
  statusLabels?: string[];
}) {
  const handleEdit = (e: MouseEvent) => {
    e.stopPropagation();
    onEdit?.();
  };

  const handleRemove = (e: MouseEvent) => {
    e.stopPropagation();
    onRemove?.();
  };

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
      <div className="flex gap-1">
        {onEdit ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleEdit}
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
            onClick={handleRemove}
            aria-label="Remove widget"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
