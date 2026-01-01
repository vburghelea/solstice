import type { MouseEvent } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "~/components/ui/button";

export function WidgetToolbar({
  title,
  onEdit,
  onRemove,
}: {
  title?: string;
  onEdit?: () => void;
  onRemove?: () => void;
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
      <span className="text-sm font-medium">{title ?? "Widget"}</span>
      <div className="flex gap-1">
        {onEdit ? (
          <Button type="button" variant="ghost" size="icon" onClick={handleEdit}>
            <Pencil className="h-4 w-4" />
          </Button>
        ) : null}
        {onRemove ? (
          <Button type="button" variant="ghost" size="icon" onClick={handleRemove}>
            <Trash2 className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
