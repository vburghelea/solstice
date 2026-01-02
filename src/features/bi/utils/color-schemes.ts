export interface ColorScheme {
  id: string;
  label: string;
  colors: string[];
  isColorblindSafe?: boolean;
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
      "#0066CC",
      "#00A651",
      "#F7941D",
      "#ED1C24",
      "#662D91",
      "#00B5E2",
      "#8DC63F",
      "#FFC20E",
      "#F15A29",
      "#93278F",
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
