import React from "react";
import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";
import { FieldComponentProps, isFieldApi } from "~/lib/form";
import { cn } from "~/shared/lib/utils";

interface ValidatedCheckboxProps extends FieldComponentProps {
  description?: string;
  disabled?: boolean;
}

export const ValidatedCheckbox: React.FC<ValidatedCheckboxProps> = (props) => {
  const { field, label, description, className, disabled = false } = props;

  if (!isFieldApi(field)) {
    console.error("ValidatedCheckbox requires a valid field prop.");
    return null;
  }

  const inputId = `${field.name}-checkbox`;
  const meta = field.state.meta;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center space-x-2">
        <Checkbox
          id={inputId}
          checked={!!field.state.value}
          onCheckedChange={(checked) => field.handleChange(!!checked)}
          onBlur={field.handleBlur}
          disabled={disabled || field.form.state.isSubmitting}
          aria-invalid={!!meta.errors.length}
          aria-describedby={
            [
              description ? `${inputId}-description` : null,
              meta.isTouched && meta.errors.length ? `${inputId}-errors` : null,
            ]
              .filter(Boolean)
              .join(" ") || undefined
          }
        />
        <Label
          htmlFor={inputId}
          className="cursor-pointer text-sm leading-none font-normal peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {label}
        </Label>
      </div>
      {description && (
        <p id={`${inputId}-description`} className="text-muted-foreground ml-6 text-sm">
          {description}
        </p>
      )}
      {meta.isTouched && meta.errors.length > 0 && (
        <div
          id={`${inputId}-errors`}
          className="text-destructive ml-6 text-sm font-medium"
        >
          {meta.errors.join(", ")}
        </div>
      )}
    </div>
  );
};
