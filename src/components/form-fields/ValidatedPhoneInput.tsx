import { useMemo } from "react";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { FieldComponentProps } from "~/lib/form";
import { cn } from "~/shared/lib/utils";

interface ValidatedPhoneInputProps extends FieldComponentProps {
  countryCode?: string;
  description?: string;
  disabled?: boolean;
  required?: boolean;
}

const DEFAULT_COUNTRY_CODE = "+1";

export function ValidatedPhoneInput(props: ValidatedPhoneInputProps) {
  const {
    field,
    label,
    placeholder = "(555) 123-4567",
    className,
    countryCode = DEFAULT_COUNTRY_CODE,
    description,
    disabled,
    required,
  } = props;

  const inputId = `${field.name}-phone-input`;
  const meta = field.state.meta;
  const normalizedDigits = useMemo(
    () => extractDigits(field.state.value as string | null, countryCode),
    [field.state.value, countryCode],
  );
  const formattedValue = formatForDisplay(normalizedDigits);

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={inputId}>{label}</Label>
      <Input
        id={inputId}
        name={field.name}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        value={formattedValue}
        placeholder={placeholder}
        onBlur={field.handleBlur}
        onChange={(event) => {
          const digits = event.target.value.replace(/\D/g, "");
          const canonical =
            digits.length === 0 ? "" : ensureCountryCode(digits, countryCode);
          field.handleChange(canonical);
        }}
        disabled={field.form.state.isSubmitting || disabled}
        aria-invalid={!!meta.errors.length}
        aria-describedby={meta.errors.length ? `${inputId}-errors` : undefined}
        required={required}
      />
      {description && <p className="text-muted-foreground text-sm">{description}</p>}
      {meta.isTouched && meta.errors.length > 0 && (
        <div id={`${inputId}-errors`} className="text-destructive text-sm font-medium">
          {meta.errors.join(", ")}
        </div>
      )}
    </div>
  );
}

function extractDigits(value: string | null | undefined, countryCode: string) {
  if (!value) return "";
  const digitsOnly = value.replace(/\D/g, "");
  const normalizedCountry = countryCode.replace(/\D/g, "");
  if (digitsOnly.startsWith(normalizedCountry)) {
    return digitsOnly.slice(normalizedCountry.length).slice(0, 10);
  }
  return digitsOnly.slice(0, 10);
}

function ensureCountryCode(digits: string, countryCode: string) {
  const normalizedCountry = countryCode.replace(/\D/g, "");
  const trimmed = digits.startsWith(normalizedCountry)
    ? digits.slice(normalizedCountry.length)
    : digits;
  const limited = trimmed.slice(0, 10);
  return `${countryCode}${limited}`;
}

function formatForDisplay(digits: string) {
  if (!digits) return "";
  const part1 = digits.slice(0, 3);
  const part2 = digits.slice(3, 6);
  const part3 = digits.slice(6, 10);

  if (digits.length <= 3) {
    return `(${part1}`;
  }

  if (digits.length <= 6) {
    return `(${part1}) ${part2}`;
  }

  return `(${part1}) ${part2}-${part3}`;
}
