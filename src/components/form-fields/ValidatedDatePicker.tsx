import React from "react";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { FieldComponentProps, isFieldApi } from "~/lib/form";
import { cn } from "~/shared/lib/utils";

interface ValidatedDatePickerProps extends FieldComponentProps {
  minAge?: number;
  maxAge?: number;
}

export const ValidatedDatePicker: React.FC<ValidatedDatePickerProps> = (props) => {
  const { field, label, minAge = 13, maxAge = 120, className } = props;

  if (!isFieldApi(field)) {
    console.error("ValidatedDatePicker requires a valid field prop.");
    return null;
  }

  const inputId = `${field.name}-date`;
  const meta = field.state.meta;

  // Calculate min and max dates based on age restrictions
  const today = new Date();
  const maxDate = new Date(
    today.getFullYear() - minAge,
    today.getMonth(),
    today.getDate(),
  );
  const minDate = new Date(
    today.getFullYear() - maxAge,
    today.getMonth(),
    today.getDate(),
  );

  // Format date for input value
  const formatDate = (date: Date | string | undefined): string => {
    if (!date) return "";
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={inputId}>{label}</Label>
      <Input
        id={inputId}
        type="date"
        value={formatDate(field.state.value)}
        onChange={(e) => {
          const value = e.target.value;
          field.handleChange(value ? new Date(value) : undefined);
        }}
        onBlur={field.handleBlur}
        min={formatDate(minDate)}
        max={formatDate(maxDate)}
        disabled={field.form.state.isSubmitting}
        aria-invalid={!!meta.errors.length}
        aria-describedby={meta.errors.length ? `${inputId}-errors` : undefined}
      />
      <p className="text-muted-foreground text-sm">
        You must be between {minAge} and {maxAge} years old
      </p>
      {meta.isTouched && meta.errors.length > 0 && (
        <div id={`${inputId}-errors`} className="text-destructive text-sm font-medium">
          {meta.errors.join(", ")}
        </div>
      )}
    </div>
  );
};
