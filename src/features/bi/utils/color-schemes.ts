export interface ColorScheme {
  id: string;
  label: string;
  colors: string[];
  isColorblindSafe?: boolean;
  isHighContrast?: boolean;
}

export const COLOR_SCHEMES: ColorScheme[] = [
  {
    id: "echarts",
    label: "ECharts Default",
    colors: [
      "#5470c6",
      "#91cc75",
      "#fac858",
      "#ee6666",
      "#73c0de",
      "#3ba272",
      "#fc8452",
      "#9a60b4",
      "#ea7ccc",
    ],
  },
  {
    id: "viasport",
    label: "viaSport Brand",
    colors: [
      "#003B4D", // Dark Teal (primary) - 10.5:1 contrast
      "#0071CE", // Bright Blue (accent) - 3.8:1 contrast
      "#00675B", // Teal (secondary) - 5.2:1 contrast
      "#007A50", // Deep Green (from Bright Green family) - 4.3:1 contrast
      "#5B8A00", // Olive Green (from Lime Green family) - 4.1:1 contrast
      "#005580", // Deep Blue - 6.5:1 contrast
      "#2D5016", // Forest Green - 8.5:1 contrast
      "#004D40", // Deep Teal - 7.8:1 contrast
    ],
  },
  {
    id: "colorblind",
    label: "Colorblind Safe",
    colors: [
      "#0072B2",
      "#E69F00",
      "#009E73",
      "#CC79A7",
      "#F0E442",
      "#56B4E9",
      "#D55E00",
      "#000000",
    ],
    isColorblindSafe: true,
  },
  {
    id: "high-contrast",
    label: "High Contrast (WCAG)",
    colors: [
      "#0072B2", // Blue - 4.5:1 contrast
      "#D55E00", // Vermillion - 4.7:1 contrast
      "#009E73", // Teal - 3.9:1 contrast
      "#000000", // Black - 21:1 contrast
      "#8B4570", // Dark pink - 4.5:1 contrast
      "#996600", // Dark gold - 4.2:1 contrast
      "#1A5276", // Dark cyan - 6.5:1 contrast
      "#6B3E26", // Dark brown - 7.5:1 contrast
    ],
    isColorblindSafe: true,
    isHighContrast: true,
  },
];

export const getColorScale = (schemeId: string) => {
  const scheme = COLOR_SCHEMES.find((item) => item.id === schemeId) ?? COLOR_SCHEMES[0];
  const colorMap = new Map<string, string>();

  return (value: string, index?: number): string => {
    if (colorMap.has(value)) return colorMap.get(value)!;
    const colorIndex = index ?? colorMap.size;
    const color = scheme.colors[colorIndex % scheme.colors.length];
    colorMap.set(value, color);
    return color;
  };
};
