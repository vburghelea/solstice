import { useMemo } from "react";
import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import type { ChartControlPanel, ControlConfig } from "./types";

const getValue = (formData: Record<string, unknown>, control: ControlConfig) =>
  formData[control.name] ?? control.defaultValue;

export function ControlPanel({
  panel,
  value,
  onChange,
}: {
  panel: ChartControlPanel | null;
  value: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
}) {
  const formData = value ?? {};
  const sections = useMemo(() => panel?.sections ?? [], [panel]);

  if (!panel) return null;

  return (
    <div className="space-y-4">
      {sections.map((section) => (
        <div key={section.label} className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {section.label}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {section.controls.map((control) => {
              if (control.visibility && !control.visibility(formData)) {
                return null;
              }

              const current = getValue(formData, control);

              if (control.type === "checkbox") {
                return (
                  <label key={control.name} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={Boolean(current)}
                      onCheckedChange={(checked) =>
                        onChange({ ...formData, [control.name]: Boolean(checked) })
                      }
                    />
                    {control.label}
                  </label>
                );
              }

              if (control.type === "select" || control.type === "color-scheme") {
                return (
                  <div key={control.name} className="space-y-1">
                    <Label className="text-xs">{control.label}</Label>
                    <Select
                      value={String(current)}
                      onValueChange={(next) =>
                        onChange({ ...formData, [control.name]: next })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={control.label} />
                      </SelectTrigger>
                      <SelectContent>
                        {control.options?.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              }

              if (control.type === "slider") {
                const min = control.min ?? 0;
                const max = control.max ?? 100;
                const step = control.step ?? 1;
                return (
                  <div key={control.name} className="space-y-1">
                    <Label className="text-xs">{control.label}</Label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={min}
                        max={max}
                        step={step}
                        value={Number(current)}
                        onChange={(event) =>
                          onChange({
                            ...formData,
                            [control.name]: Number(event.target.value),
                          })
                        }
                        className="h-2 w-full cursor-pointer accent-primary"
                      />
                      <span className="w-10 text-right text-xs text-muted-foreground">
                        {Number(current)}
                      </span>
                    </div>
                  </div>
                );
              }

              return null;
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
