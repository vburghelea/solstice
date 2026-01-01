import type { DatasetField } from "../../bi.types";
import { DropZone } from "./DropZone";

export function FieldPalette({
  availableFields,
  fieldsById,
  renderItem,
}: {
  availableFields: string[];
  fieldsById: Map<string, DatasetField>;
  renderItem: (fieldId: string, label: string) => React.ReactNode;
}) {
  return (
    <DropZone
      id="available"
      label="Available fields"
      items={availableFields}
      renderItem={(item) => renderItem(item, fieldsById.get(item)?.name ?? item)}
    />
  );
}
