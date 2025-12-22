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

  // Calculate min and max dates based on age restrictions, using UTC for consistency
  const today = new Date();
  const maxDate = new Date(
    Date.UTC(today.getUTCFullYear() - minAge, today.getUTCMonth(), today.getUTCDate()),
  );
  const minDate = new Date(
    Date.UTC(today.getUTCFullYear() - maxAge, today.getUTCMonth(), today.getUTCDate()),
  );

  // Format date for input value using UTC components
  const formatDate = (date: Date | string | undefined | null): string => {
    if (date === undefined || date === null || date === "") return "";
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "";
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
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
          if (value) {
            // Parse the date string as UTC to prevent timezone shifts
            const [year, month, day] = value.split("-").map(Number);
            const date = new Date(Date.UTC(year, month - 1, day));
            // Always store a UTC midnight ISO string so client & server match
            field.handleChange(date.toISOString().split("T")[0]);
          } else {
            field.handleChange(undefined);
          }
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
