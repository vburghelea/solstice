import { cn } from "~/shared/lib/utils";

export interface QuickFilterButton {
  id: string;
  label: string;
  active: boolean;
  onToggle: () => void;
}

interface QuickFiltersBarProps {
  filters: QuickFilterButton[];
  label?: string;
  onClear?: () => void;
  clearLabel?: string;
  className?: string;
}

export function QuickFiltersBar({
  filters,
  label = "Quick filters:",
  onClear,
  clearLabel = "Clear filters",
  className,
}: QuickFiltersBarProps) {
  if (filters.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {label ? (
        <span className="text-muted-foreground text-sm font-medium">{label}</span>
      ) : null}
      {filters.map((filter) => (
        <button
          key={filter.id}
          type="button"
          onClick={filter.onToggle}
          className={cn(
            "border px-3 py-1 text-sm font-medium transition",
            "rounded-full",
            filter.active
              ? "border-primary bg-primary/10 text-primary dark:border-primary/40 dark:bg-primary/20 dark:text-primary-100"
              : "bg-muted/60 text-foreground hover:border-primary/50 border-transparent dark:border-gray-700 dark:bg-gray-900/70 dark:text-gray-200",
          )}
        >
          {filter.label}
        </button>
      ))}
      {onClear ? (
        <button
          type="button"
          onClick={onClear}
          className="text-primary dark:text-primary-200 text-sm font-medium hover:underline"
        >
          {clearLabel}
        </button>
      ) : null}
    </div>
  );
}
