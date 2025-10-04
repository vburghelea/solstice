import type { ReactNode } from "react";

export function InfoItem({ label, value }: { label: string; value: ReactNode }) {
  if (value == null || (typeof value === "string" && value.trim().length === 0)) {
    return null;
  }

  return (
    <div className="space-y-1">
      <p className="text-muted-foreground text-xs tracking-wide uppercase">{label}</p>
      <div className="text-foreground font-medium">{value}</div>
    </div>
  );
}
