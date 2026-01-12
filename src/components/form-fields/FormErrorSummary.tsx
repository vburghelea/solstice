import { useEffect, useRef } from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "~/shared/lib/utils";

type FormErrorSummaryProps = {
  errors: string[];
  title?: string;
  className?: string;
};

export function FormErrorSummary({ errors, title, className }: FormErrorSummaryProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (errors.length > 0) {
      containerRef.current?.focus();
    }
  }, [errors]);

  if (!errors.length) return null;

  return (
    <div
      ref={containerRef}
      className={cn(
        "rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive shadow-sm",
        className,
      )}
      role="alert"
      aria-live="assertive"
      tabIndex={-1}
    >
      <div className="flex items-start gap-2">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <div className="space-y-1">
          {title ? <p className="font-semibold">{title}</p> : null}
          <ul className="list-disc space-y-1 pl-4">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
