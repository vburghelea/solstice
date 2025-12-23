import React from "react";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { FieldComponentProps, isFieldApi } from "~/lib/form";
import { cn } from "~/shared/lib/utils";

interface ValidatedDatePickerProps extends FieldComponentProps {
  minAge?: number;
  maxAge?: number;
}

type DateSegments = {
  year: string;
  month: string;
  day: string;
};

const emptySegments: DateSegments = {
  year: "",
  month: "",
  day: "",
};

const formatDateValue = (value: Date | string | undefined | null): string => {
  if (value === undefined || value === null || value === "") return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDateSegments = (value: Date | string | undefined | null): DateSegments => {
  const formatted = formatDateValue(value);
  if (!formatted) return { ...emptySegments };
  const [year, month, day] = formatted.split("-");
  if (!year || !month || !day) return { ...emptySegments };
  return { year, month, day };
};

const isCompleteSegments = (segments: DateSegments) =>
  segments.year.length === 4 && segments.month.length === 2 && segments.day.length === 2;

const isValidDateParts = (year: number, month: number, day: number) => {
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return false;
  }
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

const splitDateDigits = (value: string): DateSegments => ({
  year: value.slice(0, 4),
  month: value.slice(4, 6),
  day: value.slice(6, 8),
});

export const ValidatedDatePicker: React.FC<ValidatedDatePickerProps> = (props) => {
  const { field, label, minAge = 13, maxAge = 120, className } = props;
  const isValidField = isFieldApi(field);

  if (!isValidField) {
    console.error("ValidatedDatePicker requires a valid field prop.");
  }

  const fieldName = isValidField ? field.name : "date";
  const fieldValue = isValidField ? field.state.value : undefined;
  const meta = isValidField
    ? field.state.meta
    : {
        errors: [],
        isTouched: false,
      };
  const isSubmitting = isValidField ? field.form.state.isSubmitting : false;
  const handleChange = isValidField ? field.handleChange : () => {};
  const handleBlur = isValidField ? field.handleBlur : () => {};

  const inputId = `${fieldName}-date`;
  const labelId = `${inputId}-label`;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-errors`;

  const today = new Date();
  const maxDate = new Date(
    Date.UTC(today.getUTCFullYear() - minAge, today.getUTCMonth(), today.getUTCDate()),
  );
  const minDate = new Date(
    Date.UTC(today.getUTCFullYear() - maxAge, today.getUTCMonth(), today.getUTCDate()),
  );
  const rangeHint = `Enter a date between ${formatDateValue(minDate)} and ${formatDateValue(
    maxDate,
  )}.`;

  const [segments, setSegments] = React.useState<DateSegments>(() =>
    parseDateSegments(fieldValue),
  );
  const [internalError, setInternalError] = React.useState<string | null>(null);
  const segmentsRef = React.useRef<DateSegments>(segments);
  const lastValueRef = React.useRef<string>(formatDateValue(fieldValue));
  const yearRef = React.useRef<HTMLInputElement>(null);
  const monthRef = React.useRef<HTMLInputElement>(null);
  const dayRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    segmentsRef.current = segments;
  }, [segments]);

  React.useEffect(() => {
    const normalized = formatDateValue(fieldValue);
    if (normalized === lastValueRef.current) return;
    lastValueRef.current = normalized;
    // Sync external field updates into the segmented inputs.
    // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
    setInternalError(null);
    // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
    setSegments(parseDateSegments(fieldValue));
  }, [fieldValue]);

  const commitValue = (value: string | undefined) => {
    const normalized = value ?? "";
    if (normalized === lastValueRef.current) return;
    lastValueRef.current = normalized;
    handleChange(value);
  };

  const commitFromSegments = (nextSegments: DateSegments) => {
    if (!isCompleteSegments(nextSegments)) {
      setInternalError(null);
      commitValue(undefined);
      return;
    }

    const year = Number(nextSegments.year);
    const month = Number(nextSegments.month);
    const day = Number(nextSegments.day);

    if (!isValidDateParts(year, month, day)) {
      setInternalError("Invalid date");
      commitValue(undefined);
      return;
    }

    setInternalError(null);
    commitValue(`${nextSegments.year}-${nextSegments.month}-${nextSegments.day}`);
  };

  const moveFocus = (target: React.RefObject<HTMLInputElement | null>) => {
    if (!target.current) return;
    target.current.focus();
    target.current.setSelectionRange(
      target.current.value.length,
      target.current.value.length,
    );
  };

  const handleSegmentChange =
    (
      segment: keyof DateSegments,
      maxLength: number,
      nextRef?: React.RefObject<HTMLInputElement | null>,
    ) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const digits = event.target.value.replace(/\D/g, "");
      const previousLength = segmentsRef.current[segment].length;
      const nextSegments: DateSegments = {
        ...segmentsRef.current,
        [segment]: digits.slice(0, maxLength),
      };

      segmentsRef.current = nextSegments;
      setSegments(nextSegments);
      setInternalError(null);
      commitFromSegments(nextSegments);

      if (digits.length === maxLength && previousLength < maxLength && nextRef) {
        moveFocus(nextRef);
      }
    };

  const handleSegmentPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const digits = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 8);
    if (digits.length < 6) return;
    event.preventDefault();
    const nextSegments = splitDateDigits(digits);

    segmentsRef.current = nextSegments;
    setSegments(nextSegments);
    setInternalError(null);
    commitFromSegments(nextSegments);

    if (nextSegments.day.length === 2) {
      moveFocus(dayRef);
    } else if (nextSegments.month.length === 2) {
      moveFocus(dayRef);
    } else if (nextSegments.year.length === 4) {
      moveFocus(monthRef);
    }
  };

  const handleSegmentKeyDown =
    (segment: keyof DateSegments, prevRef?: React.RefObject<HTMLInputElement | null>) =>
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== "Backspace") return;
      if (segmentsRef.current[segment].length > 0) return;
      if (prevRef) {
        event.preventDefault();
        moveFocus(prevRef);
      }
    };

  const handleGroupBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    const nextTarget = event.relatedTarget as Node | null;
    if (nextTarget && event.currentTarget.contains(nextTarget)) return;
    handleBlur();
  };

  const errorMessages =
    meta.isTouched && (internalError || meta.errors.length > 0)
      ? [internalError, ...meta.errors].filter(Boolean)
      : [];
  const hasErrors = Boolean(internalError) || meta.errors.length > 0;
  const showErrors = errorMessages.length > 0;
  const describedBy = showErrors ? `${hintId} ${errorId}` : hintId;

  if (!isValidField) {
    return null;
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Label id={labelId} htmlFor={`${inputId}-year`}>
        {label}
      </Label>
      <div
        className="flex items-center gap-2"
        role="group"
        aria-labelledby={labelId}
        onBlur={handleGroupBlur}
      >
        <Input
          ref={yearRef}
          id={`${inputId}-year`}
          type="text"
          inputMode="numeric"
          autoComplete="bday-year"
          pattern="[0-9]*"
          maxLength={4}
          placeholder="YYYY"
          value={segments.year}
          onChange={handleSegmentChange("year", 4, monthRef)}
          onKeyDown={handleSegmentKeyDown("year")}
          onPaste={handleSegmentPaste}
          disabled={isSubmitting}
          aria-invalid={hasErrors}
          aria-describedby={describedBy}
          aria-label="Year"
          className="w-20 text-center tabular-nums"
        />
        <span className="text-muted-foreground">/</span>
        <Input
          ref={monthRef}
          id={`${inputId}-month`}
          type="text"
          inputMode="numeric"
          autoComplete="bday-month"
          pattern="[0-9]*"
          maxLength={2}
          placeholder="MM"
          value={segments.month}
          onChange={handleSegmentChange("month", 2, dayRef)}
          onKeyDown={handleSegmentKeyDown("month", yearRef)}
          onPaste={handleSegmentPaste}
          disabled={isSubmitting}
          aria-invalid={hasErrors}
          aria-describedby={describedBy}
          aria-label="Month"
          className="w-14 text-center tabular-nums"
        />
        <span className="text-muted-foreground">/</span>
        <Input
          ref={dayRef}
          id={`${inputId}-day`}
          type="text"
          inputMode="numeric"
          autoComplete="bday-day"
          pattern="[0-9]*"
          maxLength={2}
          placeholder="DD"
          value={segments.day}
          onChange={handleSegmentChange("day", 2)}
          onKeyDown={handleSegmentKeyDown("day", monthRef)}
          onPaste={handleSegmentPaste}
          disabled={isSubmitting}
          aria-invalid={hasErrors}
          aria-describedby={describedBy}
          aria-label="Day"
          className="w-14 text-center tabular-nums"
        />
      </div>
      <span id={hintId} className="sr-only">
        {rangeHint}
      </span>
      {errorMessages.length > 0 && (
        <div id={errorId} className="text-destructive text-sm font-medium">
          {errorMessages.join(", ")}
        </div>
      )}
    </div>
  );
};
