import React from "react";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { FieldComponentProps, isFieldApi } from "~/lib/form";
import { cn } from "~/shared/lib/utils";

// Type specifically for ValidatedInput, extending the base props
interface ValidatedInputProps extends FieldComponentProps {
  type?: React.HTMLInputTypeAttribute; // Allow passing input type (text, password, email, etc.)
  maxLength?: number;
  min?: string | number;
  max?: string | number;
  step?: string | number;
  autoComplete?: string;
  autoFocus?: boolean;
  pattern?: string;
  required?: boolean;
  readOnly?: boolean;
}

// Correctly define the component receiving props
export const ValidatedInput: React.FC<ValidatedInputProps> = (props) => {
  const {
    field,
    label,
    type = "text",
    placeholder,
    className,
    ...rest // Collect rest of props here
  } = props;

  // Ensure field is correctly passed
  if (!isFieldApi(field)) {
    console.error("ValidatedInput requires a valid field prop.", { field, props });
    return null;
  }

  const inputId = `${field.name}-input`;
  const meta = field.state.meta;

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={inputId}>{label}</Label>
      <Input
        id={inputId}
        name={field.name}
        type={type}
        value={field.state.value ?? ""}
        onBlur={field.handleBlur}
        // Explicitly type the event object
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          field.handleChange(e.target.value)
        }
        placeholder={placeholder}
        disabled={field.form.state.isSubmitting}
        // Add aria-invalid for accessibility based on errors
        aria-invalid={!!meta.errors.length}
        aria-describedby={meta.errors.length ? `${inputId}-errors` : undefined}
        {...rest}
      />
      {/* Show errors only if the field has been touched and has errors */}
      {meta.isTouched && meta.errors.length > 0 && (
        <div id={`${inputId}-errors`} className="text-destructive text-sm font-medium">
          {meta.errors.join(", ")}
        </div>
      )}
    </div>
  );
};
