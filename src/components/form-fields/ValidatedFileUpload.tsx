import { useEffect, useMemo, useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { FieldComponentProps } from "~/lib/form";
import { cn } from "~/shared/lib/utils";

interface ValidatedFileUploadProps extends FieldComponentProps {
  accept?: string;
  maxSizeMb?: number;
  description?: string;
  helperText?: string;
  previewAlt?: string;
}

export function ValidatedFileUpload(props: ValidatedFileUploadProps) {
  const {
    field,
    label,
    placeholder,
    className,
    accept = "image/*",
    maxSizeMb = 5,
    description,
    helperText,
    previewAlt = "Uploaded file preview",
  } = props;

  const inputId = `${field.name}-file-input`;
  const meta = field.state.meta;
  const currentValue = field.state.value as File | string | null | undefined;

  const [sizeError, setSizeError] = useState<string | null>(null);

  const objectUrl = useMemo(() => {
    if (currentValue instanceof File) {
      return URL.createObjectURL(currentValue);
    }
    if (typeof currentValue === "string" && currentValue.length > 0) {
      return currentValue;
    }
    return null;
  }, [currentValue]);

  useEffect(() => {
    if (currentValue instanceof File && objectUrl) {
      const revoke =
        typeof URL.revokeObjectURL === "function" ? URL.revokeObjectURL.bind(URL) : null;
      if (revoke) {
        return () => revoke(objectUrl);
      }
    }
    return undefined;
  }, [currentValue, objectUrl]);

  const humanReadableSize = useMemo(() => {
    if (currentValue instanceof File) {
      return formatFileSize(currentValue.size);
    }
    return null;
  }, [currentValue]);

  return (
    <div className={cn("space-y-3", className)}>
      <Label htmlFor={inputId}>{label}</Label>
      <div className="flex flex-col gap-3">
        <Input
          id={inputId}
          type="file"
          accept={accept}
          placeholder={placeholder}
          onBlur={field.handleBlur}
          disabled={field.form.state.isSubmitting}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) {
              field.handleChange(null);
              setSizeError(null);
              return;
            }

            if (maxSizeMb && file.size > maxSizeMb * 1024 * 1024) {
              setSizeError(`File is too large. Maximum size is ${maxSizeMb}MB.`);
              event.target.value = "";
              return;
            }

            setSizeError(null);
            field.handleChange(file);
          }}
        />
        {helperText && <p className="text-xs text-gray-500">{helperText}</p>}
        {sizeError && <p className="text-destructive text-sm font-medium">{sizeError}</p>}

        {objectUrl && (
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4">
            <p className="text-sm font-semibold text-gray-900">Selected file</p>
            <p className="text-xs text-gray-500">
              {currentValue instanceof File ? currentValue.name : "Existing upload"}
              {humanReadableSize ? ` · ${humanReadableSize}` : ""}
            </p>
            {accept.startsWith("image") && (
              <img
                src={objectUrl}
                alt={previewAlt}
                className="mt-3 max-h-48 w-full rounded-md object-cover"
                loading="lazy"
              />
            )}
            <div className="mt-3 flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  field.handleChange(null);
                  setSizeError(null);
                }}
              >
                Remove file
              </Button>
            </div>
          </div>
        )}
      </div>
      {description && <p className="text-muted-foreground text-sm">{description}</p>}
      {meta.isTouched && meta.errors.length > 0 && (
        <div className="text-destructive text-sm font-medium">
          {meta.errors.join(", ")}
        </div>
      )}
    </div>
  );
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
