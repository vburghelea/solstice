import { Input } from "~/components/ui/input";
import type { FilterOperator, FilterValue } from "../../bi.schemas";

export function DateFilter({
  operator,
  value,
  onChange,
  includeTime = false,
  label,
}: {
  operator: FilterOperator;
  value: FilterValue | undefined;
  onChange: (next: FilterValue | undefined) => void;
  includeTime?: boolean;
  label?: string;
}) {
  const inputType = includeTime ? "datetime-local" : "date";
  const typeLabel = includeTime ? "date and time" : "date";
  const labelPrefix = label ? `${label} ` : "";

  if (operator === "between") {
    const range = Array.isArray(value) ? value : ["", ""];
    return (
      <div className="flex items-center gap-2">
        <Input
          type={inputType}
          value={String(range[0] ?? "")}
          aria-label={`${labelPrefix}start ${typeLabel}`}
          onChange={(event) => onChange([event.target.value, range[1] ?? ""])}
        />
        <span className="text-muted-foreground text-xs">to</span>
        <Input
          type={inputType}
          value={String(range[1] ?? "")}
          aria-label={`${labelPrefix}end ${typeLabel}`}
          onChange={(event) => onChange([range[0] ?? "", event.target.value])}
        />
      </div>
    );
  }

  return (
    <Input
      type={inputType}
      value={typeof value === "string" ? value : ""}
      aria-label={`${labelPrefix}${typeLabel}`}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
