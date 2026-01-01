import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Label } from "~/components/ui/label";

export function DropZone({
  id,
  label,
  items,
  renderItem,
}: {
  id: string;
  label: string;
  items: string[];
  renderItem: (item: string) => React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div
        ref={setNodeRef}
        className={`rounded-md border p-2 ${isOver ? "bg-muted/40" : "bg-muted/20"}`}
        data-testid={`${id}-dropzone`}
      >
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {items.length === 0 ? (
              <p className="text-muted-foreground text-xs">Drop fields here</p>
            ) : (
              items.map((item) => <div key={item}>{renderItem(item)}</div>)
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}
