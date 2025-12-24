import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "~/shared/lib/utils";

export interface MobileCardField {
  label: string;
  value: ReactNode;
  className?: string;
}

export interface MobileDataCardProps {
  /** Primary title/identifier for the card */
  title: ReactNode;
  /** Optional subtitle below the title */
  subtitle?: ReactNode;
  /** Optional status badge displayed next to the title */
  badge?: ReactNode;
  /** Key-value fields to display in the card body */
  fields?: MobileCardField[];
  /** Action button or element */
  action?: ReactNode;
  /** Click handler for the entire card (makes it tappable) */
  onClick?: () => void;
  /** Additional class names */
  className?: string;
}

/**
 * A mobile-optimized card component for displaying data that would
 * normally appear in a table row on desktop.
 */
export function MobileDataCard({
  title,
  subtitle,
  badge,
  fields,
  action,
  onClick,
  className,
}: MobileDataCardProps) {
  const isClickable = Boolean(onClick);

  const content = (
    <>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium break-words">{title}</span>
            {badge ? <span className="shrink-0">{badge}</span> : null}
          </div>
          {subtitle ? (
            <div className="text-muted-foreground mt-0.5 truncate text-sm">
              {subtitle}
            </div>
          ) : null}
        </div>
        {isClickable && (
          <ChevronRight className="text-muted-foreground h-5 w-5 shrink-0" />
        )}
      </div>

      {/* Fields */}
      {fields && fields.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          {fields.map((field) => (
            <div key={field.label} className={cn("min-w-0", field.className)}>
              <dt className="text-muted-foreground text-xs">{field.label}</dt>
              <dd className="mt-0.5 break-words">{field.value}</dd>
            </div>
          ))}
        </div>
      )}

      {/* Action */}
      {!isClickable && action ? <div className="mt-3">{action}</div> : null}
    </>
  );

  if (isClickable) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "w-full rounded-lg border bg-white p-4 text-left shadow-sm transition-colors hover:bg-gray-50 active:bg-gray-100",
          className,
        )}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={cn("rounded-lg border bg-white p-4 shadow-sm", className)}>
      {content}
    </div>
  );
}

interface MobileDataCardsListProps {
  children: ReactNode;
  className?: string;
}

/**
 * Container for a list of MobileDataCard components
 */
export function MobileDataCardsList({ children, className }: MobileDataCardsListProps) {
  return <div className={cn("space-y-3", className)}>{children}</div>;
}

interface ResponsiveDataViewProps {
  /** Desktop table view */
  table: ReactNode;
  /** Mobile cards view */
  cards: ReactNode;
  /** Additional class names for the container */
  className?: string;
}

/**
 * Responsive container that shows a table on desktop and cards on mobile.
 * Uses CSS media queries for zero-JS switching.
 */
export function ResponsiveDataView({ table, cards, className }: ResponsiveDataViewProps) {
  return (
    <div className={className}>
      {/* Desktop: Table view (hidden on mobile) */}
      <div className="hidden lg:block">{table}</div>
      {/* Mobile: Cards view (hidden on desktop) */}
      <div className="lg:hidden">{cards}</div>
    </div>
  );
}
