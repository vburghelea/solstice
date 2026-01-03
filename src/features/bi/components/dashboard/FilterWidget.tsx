import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import type { FilterConfig, FilterOperator } from "~/features/bi/bi.schemas";
import type { DatasetField, WidgetConfig } from "~/features/bi/bi.types";
import { DateFilter } from "~/features/bi/components/filters/DateFilter";
import { getFieldValueSuggestions } from "~/features/bi/bi.queries";
import { formatDimensionValue } from "~/features/bi/utils/formatting";

const isEmptyValue = (value: FilterConfig["value"]) => {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) {
    if (value.length === 0) return true;
    return value.every(
      (item) =>
        item === null ||
        item === undefined ||
        (typeof item === "string" && item.trim().length === 0),
    );
  }
  return false;
};

const buildFilter = (params: {
  fieldId: string;
  datasetId?: string;
  operator: FilterOperator;
  value: FilterConfig["value"];
}): FilterConfig => ({
  field: params.fieldId,
  operator: params.operator,
  value: params.value,
  ...(params.datasetId ? { datasetId: params.datasetId } : {}),
});

const resolveOperator = (
  filterType: WidgetConfig["filterType"],
  operator?: FilterOperator,
): FilterOperator => {
  if (operator) return operator;
  if (filterType === "search") return "contains";
  if (filterType === "date_range") return "between";
  return "in";
};

type FilterPrimitive = string | number | boolean | null;

const toKey = (value: FilterPrimitive) => `${typeof value}:${String(value)}`;

const parseManualValue = (
  rawValue: string,
  dataType?: DatasetField["dataType"],
): { ok: true; value: FilterPrimitive } | { ok: false; error: string } => {
  const trimmed = rawValue.trim();
  if (!trimmed) {
    return { ok: false, error: "Enter at least one value." };
  }
  if (dataType === "number") {
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed)) {
      return { ok: false, error: "Enter valid numbers (comma-separated)." };
    }
    return { ok: true, value: parsed };
  }
  if (dataType === "boolean") {
    const normalized = trimmed.toLowerCase();
    if (normalized === "true" || normalized === "false") {
      return { ok: true, value: normalized === "true" };
    }
    return { ok: false, error: 'Use "true" or "false" for boolean values.' };
  }
  return { ok: true, value: trimmed };
};

const parseManualValues = (input: string, dataType?: DatasetField["dataType"]) => {
  const entries = input
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  if (entries.length === 0) {
    return { values: [] as FilterPrimitive[], error: null as string | null };
  }
  const values: FilterPrimitive[] = [];
  for (const entry of entries) {
    const parsed = parseManualValue(entry, dataType);
    if (!parsed.ok) {
      return { values, error: parsed.error };
    }
    values.push(parsed.value);
  }
  return { values, error: null as string | null };
};

export function FilterWidget({
  config,
  field,
  value,
  onChange,
  disabled,
  filters,
}: {
  config: WidgetConfig;
  field?: DatasetField;
  value?: FilterConfig | null;
  onChange?: (next: FilterConfig | null) => void;
  disabled?: boolean;
  filters?: FilterConfig[];
}) {
  const filterType = config.filterType ?? "select";
  const operator = resolveOperator(filterType, config.filterOperator);
  const fieldId = config.filterField ?? field?.id ?? "";
  const fieldLabel = field?.name ?? fieldId;
  const datasetId = config.filterDatasetId;
  const valuesInputId = fieldId ? `filter-values-${fieldId}` : "filter-values";

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [manualInput, setManualInput] = useState("");
  const [manualError, setManualError] = useState<string | null>(null);

  useEffect(() => {
    setSearch("");
    setDebouncedSearch("");
  }, [datasetId, fieldId]);

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 250);
    return () => clearTimeout(handle);
  }, [search]);

  const enumValues = field?.enumValues ?? [];
  const selectedValues = useMemo<FilterPrimitive[]>(() => {
    if (value?.value === undefined || value?.value === null) return [];
    const entries = Array.isArray(value.value) ? value.value : [value.value];
    return entries.filter(
      (entry): entry is FilterPrimitive =>
        entry === null ||
        typeof entry === "string" ||
        typeof entry === "number" ||
        typeof entry === "boolean",
    );
  }, [value?.value]);
  const selectedKeys = useMemo(
    () => new Set(selectedValues.map(toKey)),
    [selectedValues],
  );
  const selectedDisplayValue = useMemo(
    () => selectedValues.map((entry) => String(entry)).join(", "),
    [selectedValues],
  );

  useEffect(() => {
    setManualInput(selectedDisplayValue);
    setManualError(null);
  }, [fieldId, selectedDisplayValue]);

  const updateValue = (nextValue: FilterConfig["value"]) => {
    if (!fieldId) return;
    if (isEmptyValue(nextValue)) {
      onChange?.(null);
      return;
    }
    onChange?.(
      buildFilter({
        fieldId,
        operator,
        value: nextValue,
        ...(datasetId ? { datasetId } : {}),
      }),
    );
  };

  const toggleValue = (nextValue: FilterPrimitive) => {
    const key = toKey(nextValue);
    const values = selectedValues.filter((entry) => toKey(entry) !== key);
    if (!selectedKeys.has(key)) {
      values.push(nextValue);
    }
    updateValue(values);
  };

  const suggestionFilters = useMemo(() => {
    if (!filters || filters.length === 0) return [];
    return filters.filter((filter) => {
      if (filter.field === fieldId) return false;
      if (datasetId && filter.datasetId && filter.datasetId !== datasetId) {
        return false;
      }
      return true;
    });
  }, [datasetId, fieldId, filters]);

  const suggestionStrategy =
    field?.suggestions?.strategy ??
    (field?.dataType === "uuid" || field?.dataType === "number"
      ? "require_search"
      : "auto");
  const minSearchLength = field?.suggestions?.minSearchLength ?? 2;
  const requiresSearch = suggestionStrategy === "require_search";
  const requiresFilters = suggestionStrategy === "require_filters";
  const hasSearch = debouncedSearch.length >= minSearchLength;
  const hasFilters = suggestionFilters.length > 0;
  const suggestionsAllowed = suggestionStrategy !== "disabled";
  const suggestionsReady =
    suggestionsAllowed &&
    (!requiresSearch || hasSearch) &&
    (!requiresFilters || hasFilters || hasSearch);
  const suggestionHint = !suggestionsAllowed
    ? "Suggestions disabled for this field."
    : requiresSearch && !hasSearch
      ? `Type at least ${minSearchLength} characters to see values.`
      : requiresFilters && !hasFilters && !hasSearch
        ? "Add a filter or search to see values."
        : null;

  const suggestionQuery = useQuery({
    queryKey: [
      "bi-field-suggestions",
      datasetId,
      fieldId,
      debouncedSearch,
      suggestionFilters,
    ],
    queryFn: () =>
      getFieldValueSuggestions({
        data: {
          datasetId: datasetId ?? "",
          fieldId,
          ...(debouncedSearch ? { search: debouncedSearch } : {}),
          filters: suggestionFilters,
          limit: 25,
        },
      }),
    enabled:
      suggestionsReady &&
      filterType === "select" &&
      Boolean(fieldId) &&
      Boolean(datasetId) &&
      enumValues.length === 0 &&
      !disabled,
    staleTime: 60_000,
  });

  type SuggestionEntry = { value: string | number | boolean; count: number };
  const suggestionValues = (suggestionQuery.data?.values ?? []) as SuggestionEntry[];

  if (!fieldId) {
    return (
      <div
        className={
          "flex h-full flex-col items-center justify-center gap-2 " +
          "text-muted-foreground"
        }
      >
        <p className="text-sm">No filter configured</p>
        <p className="text-xs">Edit this widget to select a field.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <p
          className={
            "text-xs font-semibold uppercase tracking-wide " + "text-muted-foreground"
          }
        >
          Filter
        </p>
        <p className="text-sm font-medium">{field?.name ?? fieldId}</p>
      </div>

      {filterType === "date_range" ? (
        <DateFilter
          operator={operator}
          value={value?.value}
          label={fieldLabel || "Date"}
          onChange={updateValue}
          includeTime={field?.dataType === "datetime"}
        />
      ) : filterType === "search" ? (
        <Input
          disabled={disabled}
          placeholder="Search..."
          value={typeof value?.value === "string" ? value.value : ""}
          aria-label={`Search ${fieldLabel || "values"}`}
          onChange={(event) => updateValue(event.target.value)}
        />
      ) : enumValues.length > 0 ? (
        <div className="space-y-2">
          {enumValues.map((entry) => (
            <label key={entry.value} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={selectedKeys.has(toKey(entry.value))}
                onCheckedChange={() => toggleValue(entry.value)}
                disabled={disabled}
              />
              {entry.label}
            </label>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="text-xs">Search values</Label>
            <Input
              disabled={disabled}
              placeholder="Type to search..."
              value={search}
              aria-label={`Search ${fieldLabel || "values"}`}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="space-y-2 rounded-md border bg-muted/20 p-2">
            <p
              className={
                "text-[11px] font-semibold uppercase tracking-wide " +
                "text-muted-foreground"
              }
            >
              Top values
            </p>
            {suggestionHint ? (
              <p className="text-xs text-muted-foreground">{suggestionHint}</p>
            ) : suggestionQuery.isLoading ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading values...
              </div>
            ) : suggestionQuery.isError ? (
              <p className="text-xs text-destructive">Could not load values.</p>
            ) : suggestionValues.length === 0 ? (
              <p className="text-xs text-muted-foreground">No values found.</p>
            ) : (
              <div className="max-h-40 space-y-2 overflow-auto">
                {suggestionValues.map((entry) => {
                  const entryKey = toKey(entry.value);
                  return (
                    <label key={entryKey} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={selectedKeys.has(entryKey)}
                        onCheckedChange={() => toggleValue(entry.value)}
                        disabled={disabled}
                      />
                      <span>{formatDimensionValue(entry.value, field)}</span>
                      {Number.isFinite(entry.count) ? (
                        <span className="ml-auto text-[11px] text-muted-foreground">
                          {entry.count}
                        </span>
                      ) : null}
                    </label>
                  );
                })}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-xs" htmlFor={valuesInputId}>
              Other values (comma-separated)
            </Label>
            <Input
              id={valuesInputId}
              disabled={disabled}
              placeholder="e.g. Active, Pending"
              value={manualInput}
              aria-label={`${fieldLabel || "Filter"} values`}
              onChange={(event) => {
                const next = event.target.value;
                setManualInput(next);
                const parsed = parseManualValues(next, field?.dataType);
                setManualError(parsed.error);
                if (!parsed.error) {
                  updateValue(parsed.values);
                }
              }}
            />
            {manualError ? (
              <p className="text-xs text-destructive">{manualError}</p>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
