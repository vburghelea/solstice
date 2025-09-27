import { useMemo, useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import { CheckIcon, ChevronsUpDownIcon } from "~/components/ui/icons";
import { Label } from "~/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { FieldComponentProps, isFieldApi } from "~/lib/form-shared";
import { COUNTRIES } from "~/shared/hooks/useCountries";
import { useDebounce } from "~/shared/hooks/useDebounce";
import { cn } from "~/shared/lib/utils";

interface ValidatedCountryComboboxProps extends FieldComponentProps {
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  valueFormat?: "iso" | "label";
  allowClear?: boolean;
  disabled?: boolean;
}

const DEFAULT_PLACEHOLDER = "Select a country";
const DEFAULT_SEARCH_PLACEHOLDER = "Search countries";
const DEFAULT_EMPTY_TEXT = "No countries found.";

export function ValidatedCountryCombobox(props: ValidatedCountryComboboxProps) {
  const {
    field,
    label,
    placeholder = DEFAULT_PLACEHOLDER,
    className,
    searchPlaceholder = DEFAULT_SEARCH_PLACEHOLDER,
    emptyText = DEFAULT_EMPTY_TEXT,
    valueFormat = "iso",
    allowClear = true,
    disabled,
  } = props;

  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm.toLowerCase(), 200);

  const filteredOptions = useMemo(() => {
    if (!debouncedSearchTerm) {
      return COUNTRIES;
    }

    return COUNTRIES.filter((country) => {
      const labelMatch = country.label.toLowerCase().includes(debouncedSearchTerm);
      const valueMatch = country.value.toLowerCase().includes(debouncedSearchTerm);
      return labelMatch || valueMatch;
    });
  }, [debouncedSearchTerm]);

  const isValidField = isFieldApi(field);
  const rawValue =
    isValidField && typeof field.state.value === "string" ? field.state.value : "";
  const selectedOption = useMemo(() => {
    if (!rawValue) return undefined;

    if (valueFormat === "label") {
      const normalizedValue = rawValue.toLowerCase();
      return COUNTRIES.find(
        (country) =>
          country.label.toLowerCase() === normalizedValue ||
          country.value.toLowerCase() === normalizedValue,
      );
    }

    return COUNTRIES.find((country) => country.value === rawValue);
  }, [rawValue, valueFormat]);

  if (!isValidField) {
    console.error("ValidatedCountryCombobox requires a valid field prop.", {
      field,
      props,
    });
    return null;
  }

  const displayLabel = selectedOption?.label ?? rawValue ?? "";
  const meta = field.state.meta;
  const inputId = `${field.name}-country-combobox`;
  const isDisabled = disabled || field.form.state.isSubmitting;

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={inputId}>{label}</Label>
      <Popover
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) {
            setSearchTerm("");
          }
        }}
      >
        <PopoverTrigger asChild>
          <Button
            id={inputId}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-invalid={!!meta.errors.length}
            aria-describedby={meta.errors.length ? `${inputId}-errors` : undefined}
            className={cn(
              "w-full justify-between",
              !displayLabel && "text-muted-foreground",
            )}
            disabled={isDisabled}
          >
            {displayLabel || placeholder}
            <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={searchPlaceholder}
              value={searchTerm}
              onValueChange={setSearchTerm}
              disabled={isDisabled}
            />
            <CommandList>
              <CommandEmpty>{emptyText}</CommandEmpty>
              <CommandGroup>
                {allowClear && rawValue ? (
                  <CommandItem
                    value="__clear__"
                    onSelect={() => {
                      field.handleChange("");
                      setSearchTerm("");
                      setOpen(false);
                    }}
                  >
                    Clear selection
                  </CommandItem>
                ) : null}
                {filteredOptions.map((country) => (
                  <CommandItem
                    key={country.value}
                    value={country.value}
                    onSelect={() => {
                      const nextValue =
                        valueFormat === "label" ? country.label : country.value;
                      field.handleChange(nextValue);
                      setSearchTerm("");
                      setOpen(false);
                    }}
                  >
                    <CheckIcon
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedOption?.value === country.value
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                    {country.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {meta.isTouched && meta.errors.length > 0 ? (
        <div id={`${inputId}-errors`} className="text-destructive text-sm font-medium">
          {meta.errors.join(", ")}
        </div>
      ) : null}
    </div>
  );
}
