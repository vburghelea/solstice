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
        "border-border bg-background/95 supports-[backdrop-filter]:bg-background/75 fixed inset-x-0 z-50 border-t px-4 py-3 shadow-lg backdrop-blur",
        mobileOnly
          ? undefined
          : "lg:bg-background/95 lg:bottom-6 lg:left-1/2 lg:max-w-2xl lg:-translate-x-1/2 lg:rounded-full lg:border lg:px-6 lg:py-4 lg:shadow-xl",
        className,
      )}
      style={{
        paddingBottom:
          "calc(var(--admin-mobile-safe-area, env(safe-area-inset-bottom)) + 0.75rem)",
        bottom: "var(--admin-sticky-offset, calc(env(safe-area-inset-bottom) + 4.25rem))",
      }}
      {...props}
    />
  );
}
