import { useMemo } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import type { DatasetConfig, DatasetField } from "../../bi.types";
import type { FilterConfig, FilterOperator } from "../../bi.schemas";
import { buildAllowedFilters } from "../../bi.utils";
import { DateFilter } from "./DateFilter";
import { EnumFilter } from "./EnumFilter";
import { FilterGroup } from "./FilterGroup";
import { NumericFilter } from "./NumericFilter";

const operatorLabels: Record<FilterOperator, string> = {
  eq: "Equals",
  neq: "Not equals",
  gt: ">",
  gte: ">=",
  lt: "<",
  lte: "<=",
  in: "In",
  not_in: "Not in",
  between: "Between",
  contains: "Contains",
  starts_with: "Starts with",
  ends_with: "Ends with",
  is_null: "Is null",
  is_not_null: "Is not null",
};

const buildDatasetStub = (fields: DatasetField[]): DatasetConfig => ({
  id: "filters",
  name: "Filters",
  baseTable: "filters",
  fields,
});

const getDefaultOperator = (operators: FilterOperator[]) => operators[0] ?? "eq";

const isNullOperator = (operator: FilterOperator) =>
  operator === "is_null" || operator === "is_not_null";

const parseList = (value: string) =>
  value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

export function FilterBuilder({
  fields,
  filters,
  onChange,
}: {
  fields: DatasetField[];
  filters: FilterConfig[];
  onChange: (next: FilterConfig[]) => void;
}) {
  const filterableFields = fields.filter((field) => field.allowFilter);
  const allowedFilters = useMemo(
    () => buildAllowedFilters(buildDatasetStub(filterableFields)),
    [filterableFields],
  );

  const updateFilter = (index: number, patch: Partial<FilterConfig>) => {
    onChange(
      filters.map((filter, idx) => (idx === index ? { ...filter, ...patch } : filter)),
    );
  };

  const handleAddFilter = () => {
    const firstField = filterableFields[0];
    if (!firstField) return;
    const operators = allowedFilters[firstField.id]?.operators ?? [];
    onChange([
      ...filters,
      {
        field: firstField.id,
        operator: getDefaultOperator(operators),
        value: "",
      },
    ]);
  };

  const handleRemove = (index: number) => {
    onChange(filters.filter((_, idx) => idx !== index));
  };

  return (
    <FilterGroup title="Filters">
      {filters.length === 0 ? (
        <p className="text-muted-foreground text-xs">No filters applied.</p>
      ) : null}
      {filters.map((filter, index) => {
        const field = filterableFields.find((item) => item.id === filter.field);
        const operators = field ? (allowedFilters[field.id]?.operators ?? []) : [];

        return (
          <div
            key={`${filter.field}-${index}`}
            className="grid gap-2 md:grid-cols-[2fr_1fr_2fr_auto]"
          >
            <div className="space-y-1">
              <Label className="text-xs">Field</Label>
              <Select
                value={filter.field}
                onValueChange={(value) => {
                  const nextField = filterableFields.find((item) => item.id === value);
                  if (!nextField) return;
                  const nextOperators = allowedFilters[nextField.id]?.operators ?? [];
                  updateFilter(index, {
                    field: value,
                    operator: getDefaultOperator(nextOperators),
                    value: "",
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select field" />
                </SelectTrigger>
                <SelectContent>
                  {filterableFields.map((field) => (
                    <SelectItem key={field.id} value={field.id}>
                      {field.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Operator</Label>
              <Select
                value={filter.operator}
                onValueChange={(value) => {
                  const operator = value as FilterOperator;
                  updateFilter(index, {
                    operator,
                    value: isNullOperator(operator) ? undefined : filter.value,
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Operator" />
                </SelectTrigger>
                <SelectContent>
                  {operators.map((operator) => (
                    <SelectItem key={operator} value={operator}>
                      {operatorLabels[operator] ?? operator}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Value</Label>
              {field && !isNullOperator(filter.operator) ? (
                field.dataType === "number" ? (
                  <NumericFilter
                    operator={filter.operator}
                    value={filter.value}
                    onChange={(next) => updateFilter(index, { value: next })}
                  />
                ) : field.dataType === "datetime" || field.dataType === "date" ? (
                  <DateFilter
                    operator={filter.operator}
                    value={filter.value}
                    onChange={(next) => updateFilter(index, { value: next })}
                    includeTime={field.dataType === "datetime"}
                  />
                ) : field.dataType === "enum" ? (
                  <EnumFilter
                    operator={filter.operator}
                    value={filter.value}
                    enumValues={field.enumValues ?? []}
                    onChange={(next) => updateFilter(index, { value: next })}
                  />
                ) : field.dataType === "boolean" ? (
                  <Select
                    value={typeof filter.value === "boolean" ? String(filter.value) : ""}
                    onValueChange={(next) =>
                      updateFilter(index, { value: next === "true" })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">True</SelectItem>
                      <SelectItem value="false">False</SelectItem>
                    </SelectContent>
                  </Select>
                ) : filter.operator === "in" || filter.operator === "not_in" ? (
                  <Input
                    placeholder="Comma-separated values"
                    value={Array.isArray(filter.value) ? filter.value.join(", ") : ""}
                    onChange={(event) =>
                      updateFilter(index, { value: parseList(event.target.value) })
                    }
                  />
                ) : (
                  <Input
                    placeholder="Value"
                    value={typeof filter.value === "string" ? filter.value : ""}
                    onChange={(event) =>
                      updateFilter(index, { value: event.target.value })
                    }
                  />
                )
              ) : (
                <div className="text-muted-foreground text-xs">No value required</div>
              )}
            </div>

            <div className="flex items-end">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemove(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      })}
      <Button type="button" variant="outline" size="sm" onClick={handleAddFilter}>
        <Plus className="mr-2 h-4 w-4" />
        Add filter
      </Button>
    </FilterGroup>
  );
}
