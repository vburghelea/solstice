import React from "react";
import { Label } from "~/components/ui/label";
import { FieldComponentProps, isFieldApi } from "~/lib/form-shared";
import { cn } from "~/shared/lib/utils";

interface ValidatedColorPickerProps extends FieldComponentProps {
  description?: string;
}

export const ValidatedColorPicker: React.FC<ValidatedColorPickerProps> = (props) => {
  const { field, label, className, description } = props;

  if (!isFieldApi(field)) {
    console.error("ValidatedColorPicker requires a valid field prop.", { field, props });
    return null;
  }

  const inputId = `${field.name}-color-picker`;
  const meta = field.state.meta;

  // Preset colors for quick selection
  const presetColors = [
    "#E2E2E2", // Light gray
    "#ff75c3", // Pink
    "#ffa647", // Orange
    "#ffe83f", // Yellow
    "#9fff5b", // Light green
    "#70e2ff", // Light blue
    "#cd93ff", // Purple
    "#09203f", // Dark blue
  ];

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={inputId}>{label}</Label>
      {description && <p className="text-muted-foreground text-sm">{description}</p>}
      <div className="flex flex-col gap-3">
        {/* Color input with visual preview */}
        <div className="flex items-center gap-2">
          <input
            type="color"
            id={inputId}
            name={field.name}
            value={field.state.value || "#000000"}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            className="border-input h-10 w-20 cursor-pointer rounded border"
            aria-invalid={!!meta.errors.length}
            aria-describedby={meta.errors.length ? `${inputId}-errors` : undefined}
          />
          <input
            type="text"
            value={field.state.value || "#000000"}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            placeholder="#000000"
            className={cn(
              "border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-32 rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
              meta.isTouched && meta.errors.length > 0 && "border-destructive",
            )}
            disabled={field.form.state.isSubmitting}
          />
          <span className="text-muted-foreground text-sm">
            {field.state.value || "#000000"}
          </span>
        </div>

        {/* Preset color palette */}
        <div className="flex flex-wrap gap-1">
          {presetColors.map((color) => (
            <button
              key={color}
              type="button"
              className={cn(
                "h-6 w-6 rounded-md border border-neutral-200 shadow-sm transition-all hover:scale-110 dark:border-neutral-800",
                field.state.value === color &&
                  "ring-2 ring-neutral-900 ring-offset-1 dark:ring-neutral-400",
              )}
              style={{ backgroundColor: color }}
              onClick={() => field.handleChange(color)}
              aria-label={`Select color ${color}`}
            />
          ))}
        </div>
      </div>
      {meta.isTouched && meta.errors.length > 0 && (
        <div id={`${inputId}-errors`} className="text-destructive text-sm font-medium">
          {meta.errors.join(", ")}
        </div>
      )}
    </div>
  );
};
