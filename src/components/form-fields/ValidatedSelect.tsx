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

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={selectId}>{label}</Label>
      <Select
        value={field.state.value || ""}
        onValueChange={(value) => field.handleChange(value)}
        disabled={field.form.state.isSubmitting}
      >
        <SelectTrigger
          id={selectId}
          aria-invalid={!!meta.errors.length}
          aria-required={required}
          aria-describedby={meta.errors.length ? `${selectId}-errors` : undefined}
        >
          <SelectValue placeholder={placeholderText} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
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
