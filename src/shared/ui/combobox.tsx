import { Check } from "lucide-react";
import { useState } from "react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import { Label } from "~/components/ui/label";
import { cn } from "~/shared/lib/utils";

export interface ComboboxProps {
  options: { value: string; label: string }[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  emptyMessage?: string;
  noResultsMessage?: string;
  label?: string;
  onSearchChange?: (query: string) => void;
  isLoading?: boolean;
  error?: string[];
  disabled?: boolean;
  "data-testid"?: string; // Add data-testid to the interface
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Select option...",
  emptyMessage = "No option found.",
  noResultsMessage = "No results found.",
  onSearchChange,
  isLoading,
  label,
  disabled,
  ...rest // Destructure rest of the props
}: ComboboxProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // Find the label of the selected option
  const selectedLabel = options.find((option) => option.value === value)?.label || "";

  // Use the search term if it's not empty, otherwise use the selected label
  const displayValue = searchTerm || selectedLabel;

  const handleSearchChange = (query: string) => {
    setSearchTerm(query);
    if (onSearchChange) {
      onSearchChange(query);
    }
  };

  const handleSelect = (currentValue: string) => {
    const selectedOption = options.find((option) => option.value === currentValue);
    if (selectedOption) {
      setSearchTerm(selectedOption.label);
    } else {
      setSearchTerm("");
    }
    onValueChange(currentValue === value ? "" : currentValue);
  };

  return (
    <Command shouldFilter={false} {...rest}>
      {" "}
      {/* Pass rest props to Command */}
      {label && <Label>{label}</Label>}
      <div className="relative">
        <CommandInput
          placeholder={placeholder}
          value={displayValue}
          onValueChange={handleSearchChange}
          disabled={disabled}
        />
      </div>
      {!disabled && (
        <CommandList>
          <CommandEmpty>
            {isLoading
              ? "Loading..."
              : searchTerm.length > 0
                ? noResultsMessage
                : emptyMessage}
          </CommandEmpty>
          <CommandGroup>
            {options.map((option) => (
              <CommandItem
                key={option.value}
                value={option.value}
                onSelect={handleSelect}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === option.value ? "opacity-100" : "opacity-0",
                  )}
                />
                {option.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      )}
    </Command>
  );
}
