import * as React from "react";
import { cn } from "~/shared/lib/utils";

interface StickyActionBarProps extends React.ComponentProps<"div"> {
  /**
   * If true, the bar is hidden on large screens (default: true)
   */
  mobileOnly?: boolean;
}

/**
 * StickyActionBar renders a fixed bottom container for primary actions on mobile.
 * Place near the end of the page markup to keep in DOM-order.
 */
export function StickyActionBar({
  className,
  mobileOnly = true,
  ...props
}: StickyActionBarProps) {
  return (
    <div
      className={cn(
        mobileOnly ? "lg:hidden" : undefined,
        "fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur",
        "px-4 py-3",
        className,
      )}
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)" }}
      {...props}
    />
  );
}
