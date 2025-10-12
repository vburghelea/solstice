import * as React from "react";

import { cn } from "~/shared/lib/utils";

function ListItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      className={cn(
        "text-card-foreground px-4 py-3 text-sm transition-colors [&:first-child]:rounded-t-lg [&:last-child]:rounded-b-lg",
        className,
      )}
      {...props}
    />
  );
}

const ListBase = ({ className, ...props }: React.ComponentProps<"ul">) => {
  return (
    <ul
      className={cn(
        "divide-border border-border text-card-foreground overflow-hidden rounded-lg border shadow-sm",
        className,
      )}
      {...props}
    />
  );
};

type ListComponent = {
  (props: React.ComponentProps<"ul">): React.ReactElement;
  Item: typeof ListItem;
};

export const List: ListComponent = Object.assign(ListBase, { Item: ListItem });

export { ListItem };
