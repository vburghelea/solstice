import { Input } from "~/components/ui/input";
import type { FilterOperator, FilterValue } from "../../bi.schemas";

export function DateFilter({
  operator,
  value,
  onChange,
  includeTime = false,
}: {
  operator: FilterOperator;
  value: FilterValue | undefined;
  onChange: (next: FilterValue | undefined) => void;
  includeTime?: boolean;
}) {
  const inputType = includeTime ? "datetime-local" : "date";

  if (operator === "between") {
    const range = Array.isArray(value) ? value : ["", ""];
    return (
      <div className="flex items-center gap-2">
        <Input
          type={inputType}
          value={String(range[0] ?? "")}
          onChange={(event) => onChange([event.target.value, range[1] ?? ""])}
        />
        <span className="text-muted-foreground text-xs">to</span>
        <Input
          type={inputType}
          value={String(range[1] ?? "")}
          onChange={(event) => onChange([range[0] ?? "", event.target.value])}
        />
      </div>
    );
  }

  return (
    <Input
      type={inputType}
      value={typeof value === "string" ? value : ""}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
