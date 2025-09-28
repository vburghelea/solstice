import type { HTMLAttributes } from "react";
import { Badge } from "~/components/ui/badge";
import { getLanguageDisplayName } from "~/shared/lib/language";
import { cn } from "~/shared/lib/utils";

interface LanguageTagProps extends HTMLAttributes<HTMLSpanElement> {
  language?: string | null;
}

export function LanguageTag({ language, className, ...props }: LanguageTagProps) {
  const label = getLanguageDisplayName(language);
  if (!label) return null;

  return (
    <Badge
      variant="outline"
      className={cn("rounded-full border-dashed px-3 py-1 text-xs", className)}
      {...props}
    >
      {label}
    </Badge>
  );
}
