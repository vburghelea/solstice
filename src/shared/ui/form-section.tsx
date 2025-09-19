import { useId } from "react";

import { cn } from "~/shared/lib/utils";

interface FormSectionProps extends React.ComponentProps<"section"> {
  title: string;
  description?: string;
  contentClassName?: string;
}

export function FormSection({
  title,
  description,
  className,
  contentClassName,
  children,
  ...props
}: FormSectionProps) {
  const headingId = useId();

  return (
    <section
      aria-labelledby={headingId}
      className={cn(
        "bg-card text-card-foreground border-border rounded-2xl border shadow-sm",
        className,
      )}
      {...props}
    >
      <header className="border-border/70 flex flex-col gap-1 border-b px-4 py-3 sm:px-6">
        <h2 id={headingId} className="text-foreground text-base leading-6 font-semibold">
          {title}
        </h2>
        {description ? (
          <p className="text-muted-foreground text-sm leading-6">{description}</p>
        ) : null}
      </header>
      <div className={cn("px-4 py-4 sm:px-6 sm:py-6", contentClassName)}>{children}</div>
    </section>
  );
}
