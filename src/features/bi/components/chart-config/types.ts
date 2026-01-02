export type ControlType = "checkbox" | "slider" | "select" | "color-scheme";

export interface ControlConfig {
  name: string;
  type: ControlType;
  label: string;
  description?: string;
  defaultValue: unknown;
  options?: Array<{ value: string; label: string }>;
  min?: number;
  max?: number;
  step?: number;
  visibility?: (formData: Record<string, unknown>) => boolean;
}

export interface ControlSection {
  label: string;
  expanded?: boolean;
  controls: ControlConfig[];
}

export interface ChartControlPanel {
  chartType: string;
  sections: ControlSection[];
}
