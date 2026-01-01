import type { ReactNode } from "react";
import { Label } from "~/components/ui/label";

export function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-2 rounded-md border bg-muted/20 p-3">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">
        {title}
      </Label>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
