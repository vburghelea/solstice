import type { SafetyRules } from "~/shared/utils/safety-rules";
import { formatSafetyRules } from "~/shared/utils/safety-rules";

export function SafetyRulesView({ safetyRules }: { safetyRules: SafetyRules }) {
  const groups = formatSafetyRules(safetyRules);

  if (!groups.length) {
    return <p className="text-muted-foreground">No safety rules specified</p>;
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div key={group.title}>
          <p className="font-semibold">{group.title}</p>
          <div className="mt-2 grid gap-2">
            {group.items.map((item) => (
              <div key={item.label} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="text-right font-medium break-words">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
