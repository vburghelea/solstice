import React, { useState } from "react";
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
import { cn } from "~/shared/lib/utils";

interface ValidatedComboboxProps extends FieldComponentProps {
  options: Array<{ value: string; label: string }>;
  searchPlaceholder?: string;
  emptyText?: string;
}

export const ValidatedCombobox: React.FC<ValidatedComboboxProps> = (props) => {
  const {
    field,
    label,
    placeholder = "Select an option...",
    className,
    options,
    searchPlaceholder = "Search...",
    emptyText = "No option found.",
  } = props;

  const [open, setOpen] = useState(false);

  if (!isFieldApi(field)) {
    console.error("ValidatedCombobox requires a valid field prop.", { field, props });
    return null;
  }

  const inputId = `${field.name}-combobox`;
  const meta = field.state.meta;
  const selectedOption = options.find((option) => option.value === field.state.value);

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={inputId}>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
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
              !selectedOption && "text-muted-foreground",
            )}
            disabled={field.form.state.isSubmitting}
          >
            {selectedOption ? selectedOption.label : placeholder}
            <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              <CommandEmpty>{emptyText}</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => {
                      field.handleChange(option.value);
                      setOpen(false);
                    }}
                  >
                    <CheckIcon
                      className={cn(
                        "mr-2 h-4 w-4",
                        field.state.value === option.value ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {meta.isTouched && meta.errors.length > 0 && (
        <div id={`${inputId}-errors`} className="text-destructive text-sm font-medium">
          {meta.errors.join(", ")}
        </div>
      )}
    </div>
  );
};
