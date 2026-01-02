import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Input } from "~/components/ui/input";
import type { FilterOperator, FilterValue } from "../../bi.schemas";

const parseList = (value: string) =>
  value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

export function EnumFilter({
  operator,
  value,
  enumValues,
  onChange,
  label,
}: {
  operator: FilterOperator;
  value: FilterValue | undefined;
  enumValues?: Array<{ value: string; label: string }>;
  onChange: (next: FilterValue | undefined) => void;
  label?: string;
}) {
  const labelPrefix = label ? `${label} ` : "";

  if (operator === "in" || operator === "not_in") {
    return (
      <Input
        placeholder="Comma-separated values"
        value={Array.isArray(value) ? value.join(", ") : ""}
        aria-label={`${labelPrefix}values`}
        onChange={(event) => onChange(parseList(event.target.value))}
      />
    );
  }

  if (enumValues && enumValues.length > 0) {
    return (
      <Select
        value={typeof value === "string" ? value : ""}
        onValueChange={(next) => onChange(next)}
      >
        <SelectTrigger aria-label={`${labelPrefix}value`}>
          <SelectValue placeholder="Select value" />
        </SelectTrigger>
        <SelectContent>
          {enumValues.map((entry) => (
            <SelectItem key={entry.value} value={entry.value}>
              {entry.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <Input
      placeholder="Value"
      value={typeof value === "string" ? value : ""}
      aria-label={`${labelPrefix}value`}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
