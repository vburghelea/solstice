import React from "react";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { FieldComponentProps, isFieldApi } from "~/lib/form";
import { cn } from "~/shared/lib/utils";

interface ValidatedSelectProps extends FieldComponentProps {
  options: Array<{ value: string; label: string }>;
  placeholderText?: string;
  required?: boolean;
}

export const ValidatedSelect: React.FC<ValidatedSelectProps> = (props) => {
  const {
    field,
    label,
    options,
    placeholderText = "Select an option",
    className,
    required,
  } = props;

  if (!isFieldApi(field)) {
    console.error("ValidatedSelect requires a valid field prop.");
    return null;
  }

  const selectId = `${field.name}-select`;
  const meta = field.state.meta;
  const EMPTY_OPTION_VALUE = "__empty_option__";
  const placeholderOption = options.find((option) => option.value === "");
  const normalizedOptions = options.map((option) =>
    option.value === "" ? { ...option, value: EMPTY_OPTION_VALUE } : option,
  );
  // Always compute a value for controlled behavior
  // If no value is set and no placeholder option exists, use empty string to keep it controlled
  const currentValue = field.state.value as string | undefined;
  const selectValue =
    currentValue === "" || currentValue === undefined
      ? placeholderOption
        ? EMPTY_OPTION_VALUE
        : ""
      : currentValue;

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={selectId}>{label}</Label>
      <Select
        value={selectValue}
        onValueChange={(value) => {
          const normalizedValue =
            placeholderOption && value === EMPTY_OPTION_VALUE ? "" : value;
          field.handleChange(normalizedValue);
        }}
        disabled={field.form.state.isSubmitting}
      >
        <SelectTrigger
          id={selectId}
          aria-invalid={!!meta.errors.length}
          aria-required={required}
          aria-describedby={meta.errors.length ? `${selectId}-errors` : undefined}
        >
          <SelectValue placeholder={placeholderOption?.label ?? placeholderText} />
        </SelectTrigger>
        <SelectContent>
          {normalizedOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {meta.isTouched && meta.errors.length > 0 && (
        <div id={`${selectId}-errors`} className="text-destructive text-sm font-medium">
          {meta.errors.join(", ")}
        </div>
      )}
    </div>
  );
};
