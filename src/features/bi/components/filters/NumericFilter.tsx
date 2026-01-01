import { Input } from "~/components/ui/input";
import type { FilterOperator, FilterValue } from "../../bi.schemas";

const toNumberValue = (value: FilterValue | undefined) => {
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return value;
  return "";
};

export function NumericFilter({
  operator,
  value,
  onChange,
}: {
  operator: FilterOperator;
  value: FilterValue | undefined;
  onChange: (next: FilterValue | undefined) => void;
}) {
  if (operator === "between") {
    const range = Array.isArray(value) ? value : ["", ""];
    return (
      <div className="flex items-center gap-2">
        <Input
          type="number"
          value={toNumberValue(range[0] as FilterValue)}
          onChange={(event) => onChange([event.target.value, range[1] ?? ""])}
        />
        <span className="text-muted-foreground text-xs">to</span>
        <Input
          type="number"
          value={toNumberValue(range[1] as FilterValue)}
          onChange={(event) => onChange([range[0] ?? "", event.target.value])}
        />
      </div>
    );
  }

  if (operator === "in" || operator === "not_in") {
    return (
      <Input
        placeholder="Comma-separated values"
        value={Array.isArray(value) ? value.join(", ") : ""}
        onChange={(event) =>
          onChange(
            event.target.value
              .split(",")
              .map((entry) => entry.trim())
              .filter(Boolean),
          )
        }
      />
    );
  }

  return (
    <Input
      type="number"
      value={toNumberValue(value)}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
