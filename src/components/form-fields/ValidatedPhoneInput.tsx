import { useMemo } from "react";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { FieldComponentProps } from "~/lib/form-shared";
import { cn } from "~/shared/lib/utils";

interface ValidatedPhoneInputProps extends FieldComponentProps {
  countryCode?: string;
  description?: string;
  disabled?: boolean;
  required?: boolean;
  maxDigits?: number;
}

const DEFAULT_COUNTRY_CODE = "+49";
const DEFAULT_MAX_DIGITS = 11;

export function ValidatedPhoneInput(props: ValidatedPhoneInputProps) {
  const {
    field,
    label,
    placeholder = "+49 1512 3456789",
    className,
    countryCode = DEFAULT_COUNTRY_CODE,
    description,
    disabled,
    required,
    maxDigits = DEFAULT_MAX_DIGITS,
  } = props;

  const inputId = `${field.name}-phone-input`;
  const meta = field.state.meta;
  const normalizedDigits = useMemo(
    () => extractDigits(field.state.value as string | null, countryCode, maxDigits),
    [field.state.value, countryCode, maxDigits],
  );
  const formattedValue = formatForDisplay(normalizedDigits, countryCode);

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
            digits.length === 0 ? "" : ensureCountryCode(digits, countryCode, maxDigits);
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

function extractDigits(
  value: string | null | undefined,
  countryCode: string,
  maxDigits: number,
) {
  if (!value) return "";
  const digitsOnly = value.replace(/\D/g, "");
  const normalizedCountry = countryCode.replace(/\D/g, "");
  if (digitsOnly.startsWith(normalizedCountry)) {
    return digitsOnly.slice(normalizedCountry.length).slice(0, maxDigits);
  }
  return digitsOnly.slice(0, maxDigits);
}

function ensureCountryCode(digits: string, countryCode: string, maxDigits: number) {
  const normalizedCountry = countryCode.replace(/\D/g, "");
  const trimmed = digits.startsWith(normalizedCountry)
    ? digits.slice(normalizedCountry.length)
    : digits;
  const limited = trimmed.slice(0, maxDigits);
  return `${countryCode}${limited}`;
}

function formatForDisplay(digits: string, countryCode: string) {
  if (!digits) return "";

  const part1 = digits.slice(0, 4);
  const part2 = digits.slice(4, 7);
  const part3 = digits.slice(7, 11);

  if (digits.length <= 4) {
    return `${countryCode} ${part1}`;
  }

  if (digits.length <= 7) {
    return `${countryCode} ${part1} ${part2}`;
  }

  return `${countryCode} ${part1} ${part2} ${part3}`.trim();
}
