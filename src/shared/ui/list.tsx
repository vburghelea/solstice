import * as React from "react";
import { cn } from "~/shared/lib/utils";

export function List({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      className={cn(
        "divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white",
        className,
      )}
      {...props}
    />
  );
}

export function ListItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      className={cn(
        "px-4 py-3 text-gray-900 [&:first-child]:rounded-t-lg [&:last-child]:rounded-b-lg",
        className,
      )}
      {...props}
    />
  );
}

List.Item = ListItem;
