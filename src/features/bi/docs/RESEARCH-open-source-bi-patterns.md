# BI Improvement Research: Open Source Patterns

**Date:** 2026-01-02
**Purpose:** Analyze Metabase and Apache Superset for patterns and code we can adopt to accelerate BI feature development.

---

## License Analysis

| Project             | License               | Implications                                                                                                  |
| ------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Apache Superset** | Apache 2.0            | **Can use code directly** with attribution. Permissive for commercial use.                                    |
| **Metabase**        | AGPL (non-enterprise) | **Can learn patterns** but direct code copying requires AGPL licensing. Enterprise folder is commercial-only. |

**Recommendation:** Prioritize Superset patterns for direct code adoption. Use Metabase for inspiration on UX patterns only.

---

## Current System Architecture

Our BI feature already has solid foundations:

```
src/features/bi/
├── components/
│   ├── charts/           # ECharts wrappers (bar, line, pie, heatmap, scatter, kpi)
│   ├── dashboard/        # react-grid-layout based canvas
│   ├── filters/          # Filter components
│   ├── pivot-builder/    # Drag-drop query builder
│   └── pivot-table/      # Table rendering
├── engine/               # Query building, aggregations, sorting
├── governance/           # Org-scoping, field ACL, PII masking
├── semantic/             # Dataset configs, metrics, calculated fields
└── hooks/                # React Query hooks
```

**Existing Chart Types:** table, bar, line, area, pie, donut, heatmap, scatter, kpi

**Key Gap:** We have the charts but lack the **configuration UI** and **data transformation sophistication** that makes them truly useful.

---

## Pattern Analysis: Apache Superset

### Architecture Overview

Superset's ECharts plugin system follows a clean pattern:

```
plugin-chart-echarts/src/Pie/
├── index.ts              # Plugin registration with metadata
├── types.ts              # TypeScript types
├── controlPanel.tsx      # Configuration UI specification
├── buildQuery.ts         # Query construction
├── transformProps.ts     # Data → ECharts options transformation
├── EchartsPie.tsx        # React component
└── images/               # Thumbnails and examples
```

### Key Pattern 1: `transformProps` (Data Transformation Layer)

**What it does:** Converts raw query data + form configuration → ECharts options

**Superset's approach (`Pie/transformProps.ts`):**

```typescript
export default function transformProps(chartProps: EchartsPieChartProps): PieChartTransformedProps {
  const { formData, queriesData, height, width, theme } = chartProps;
  const { colorScheme, donut, groupby, innerRadius, showLabels, ... } = formData;

  // 1. Extract and validate data
  const rawData = queriesData[0].data;

  // 2. Apply color scheme
  const colorFn = CategoricalColorNamespace.getScale(colorScheme);

  // 3. Transform to ECharts series format
  const transformedData = rawData.map(datum => ({
    value: datum[metricLabel],
    name: extractGroupbyLabel({ datum, groupby }),
    itemStyle: { color: colorFn(name) }
  }));

  // 4. Build complete ECharts option
  const echartOptions: EChartsCoreOption = {
    tooltip: { ... },
    legend: getLegendProps(legendType, legendOrientation, showLegend),
    series: [{ type: 'pie', data: transformedData, ... }]
  };

  return { echartOptions, formData, width, height, ... };
}
```

**What we can adopt:**

- Structured transformation pipeline
- Color scheme management via namespace
- Legend/tooltip utilities
- Theme integration

### Key Pattern 2: Control Panel Configuration

**What it does:** Declarative specification of chart configuration UI

**Superset's approach (`Pie/controlPanel.tsx`):**

```typescript
const config: ControlPanelConfig = {
  controlPanelSections: [
    {
      label: t('Query'),
      expanded: true,
      controlSetRows: [
        ['groupby'],
        ['metric'],
        ['adhoc_filters'],
        ['row_limit'],
      ],
    },
    {
      label: t('Chart Options'),
      expanded: true,
      controlSetRows: [
        ['color_scheme'],
        [{ name: 'donut', config: { type: 'CheckboxControl', ... }}],
        [{ name: 'innerRadius', config: { type: 'SliderControl', min: 0, max: 100, ... }}],
        [{ name: 'show_labels', config: { type: 'CheckboxControl', ... }}],
      ],
    },
  ],
};
```

**What we can adopt:**

- Declarative control definitions
- Sections for organization (Query, Chart Options, Labels, etc.)
- Control types: CheckboxControl, SliderControl, SelectControl, TextControl
- Visibility rules for conditional controls
- Validation integration

### Key Pattern 3: ECharts Wrapper Component

**Superset's `Echart.tsx`:**

```typescript
function Echart({ width, height, echartOptions, eventHandlers, refs }: EchartsProps) {
  const chartRef = useRef<EChartsType>();

  useEffect(() => {
    chartRef.current = init(divRef.current);
    chartRef.current.setOption(themedEchartOptions, true);
  }, [echartOptions]);

  // Resize handling
  useLayoutEffect(() => {
    chartRef.current?.resize({ width, height });
  }, [width, height]);

  // Event binding
  useEffect(() => {
    Object.entries(eventHandlers || {}).forEach(([name, handler]) => {
      chartRef.current?.on(name, handler);
    });
  }, [eventHandlers]);

  return <Styles ref={divRef} height={height} width={width} />;
}
```

**What we can adopt:**

- Direct ECharts core usage (vs echarts-for-react wrapper)
- Proper resize handling
- Event handler binding for interactivity
- Theme integration via options merge

### Key Pattern 4: Color Schemes

**Superset has a CategoricalColorNamespace:**

```typescript
const colorFn = CategoricalColorNamespace.getScale(colorScheme);
const color = colorFn(categoryName, sliceId);
```

**Built-in schemes:** d3Category10, d3Category20, googleCategory20c, etc.

---

## Pattern Analysis: Metabase (Patterns Only - AGPL)

### Architecture Overview

Metabase uses a registration-based visualization system:

```
visualizations/
├── visualizations/       # Chart implementations
│   ├── BarChart/
│   ├── LineChart/
│   ├── PieChart/
│   ├── Table/
│   ├── Scalar/          # KPI equivalent
│   └── SmartScalar/     # KPI with trend
├── echarts/              # ECharts utilities
├── lib/                  # Shared utilities
└── shared/               # Common components
```

### Key Pattern 1: Smart Scalar (Enhanced KPI)

**What it does:** Shows a KPI value with automatic trend comparison

```
┌─────────────────────────────┐
│  $1,234,567                 │
│  Total Revenue              │
│  ↑ 12.5% vs last period     │
└─────────────────────────────┘
```

**Pattern to adopt:**

- Auto-calculate period-over-period comparison
- Show trend indicator (up/down arrow)
- Show percentage change
- Smart number formatting (1.2M vs 1,234,567)

### Key Pattern 2: Click Behaviors / Drill-Down

**Metabase's approach:**

- Click on bar → filter dashboard by that dimension
- Click on data point → drill to detail
- Cross-filtering between charts

**What we should implement:**

1. `onClick` handler on chart elements
2. Emit filter events that dashboard can consume
3. Update other widgets based on selection

### Key Pattern 3: Dashboard Filter Parameters

**Metabase's DashboardParameterPanel:**

- Global filter widgets at top of dashboard
- Date range pickers with presets
- Multi-select dropdowns
- Search/typeahead filters

---

## Improvement Roadmap

Based on this research, here's a prioritized implementation plan:

### Phase 1: Quick Wins (1-2 weeks)

#### 1.1 Adopt Superset's Color Scheme System

- [ ] Create `src/features/bi/utils/color-schemes.ts`
- [ ] Port Superset's categorical color scales (Apache 2.0)
- [ ] Add color scheme selector to pivot builder

**Code to adapt from:**

- `superset-frontend/packages/superset-ui-core/src/color/CategoricalColorNamespace.ts`

#### 1.2 Improve Empty States

- [ ] Add sample queries per dataset
- [ ] Show "Try this" buttons
- [ ] Link to documentation

#### 1.3 Auto-Run on Field Drop

- [ ] Debounce field changes
- [ ] Auto-execute query after 500ms of no changes
- [ ] Show loading indicator during execution

### Phase 2: Chart Configuration UI (2-3 weeks)

#### 2.1 Port Control Panel Pattern

- [ ] Create `src/features/bi/components/chart-config/ControlPanel.tsx`
- [ ] Implement control types: Checkbox, Slider, Select, Text
- [ ] Create declarative config per chart type

**Structure:**

```typescript
interface ControlPanelConfig {
  sections: Array<{
    label: string;
    controls: Array<{
      name: string;
      type: 'checkbox' | 'slider' | 'select' | 'text';
      label: string;
      defaultValue: unknown;
      options?: Array<{ value: string; label: string }>;
      min?: number;
      max?: number;
      visibility?: (formData: Record<string, unknown>) => boolean;
    }>;
  }>;
}
```

#### 2.2 Enhanced Pie Chart Config

- [ ] Donut toggle
- [ ] Inner/outer radius sliders
- [ ] Label position options
- [ ] "Show total" option
- [ ] Rose chart variant

#### 2.3 Enhanced Bar/Line Config

- [ ] Stacked/grouped toggle
- [ ] Axis labels
- [ ] Show legend toggle
- [ ] Data labels toggle
- [ ] Line smoothing (for line charts)

### Phase 3: Enhanced ECharts Wrapper (1-2 weeks)

#### 3.1 Replace echarts-for-react with Direct ECharts

- [ ] Create `src/features/bi/components/charts/EchartsCore.tsx`
- [ ] Handle resize properly
- [ ] Add event handler support
- [ ] Add theme integration

**Benefit:** Better control, smaller bundle, interactivity support

#### 3.2 Add Click Event Handlers

- [ ] Bar click → emit filter event
- [ ] Pie slice click → emit filter event
- [ ] Create event bus for dashboard cross-filtering

### Phase 4: Smart KPI Card (1 week)

#### 4.1 Enhanced KPI with Trends

- [ ] Calculate period-over-period change
- [ ] Show trend arrow and percentage
- [ ] Smart number formatting
- [ ] Configurable comparison periods

**UI:**

```
┌─────────────────────────────┐
│        156                  │  ← Primary value
│   Total Submissions         │  ← Label
│   ↑ 23% vs last month       │  ← Trend (optional)
└─────────────────────────────┘
```

### Phase 5: Dashboard Enhancements (2-3 weeks)

#### 5.1 Global Filter Widgets

- [ ] Add filter widget type to dashboard
- [ ] Date range picker with presets (This week, Last 30 days, etc.)
- [ ] Multi-select dropdown for enum fields
- [ ] Wire filters to query execution

#### 5.2 Cross-Filtering

- [ ] Click on chart element → filter other charts
- [ ] Visual indication of active filters
- [ ] Clear filters button

#### 5.3 Pre-Built Dashboard Templates

- [ ] Create 3-4 common dashboard layouts
- [ ] "New from template" option
- [ ] SIN-specific templates (Submissions Overview, Organization Health, etc.)

---

## Specific Code to Port

### From Superset (Apache 2.0 - Direct Use Allowed)

1. **Color Schemes**
   - Location: `superset-frontend/packages/superset-ui-core/src/color/`
   - Files: `CategoricalColorScale.ts`, `CategoricalColorNamespace.ts`
   - Contains: d3 color schemes, categorical scales

2. **Number Formatting**
   - Location: `superset-frontend/packages/superset-ui-core/src/number-format/`
   - Contains: Smart number formatting, currency, percentages

3. **ECharts Utilities**
   - Location: `superset-frontend/plugins/plugin-chart-echarts/src/utils/`
   - Files: `series.ts`, `tooltip.ts`
   - Contains: Legend helpers, tooltip formatters, theming

4. **Pie Chart Transform** (as reference)
   - Location: `superset-frontend/plugins/plugin-chart-echarts/src/Pie/transformProps.ts`
   - Pattern: How to transform data → ECharts options with full config

### From Metabase (AGPL - Patterns Only)

1. **Smart Scalar Logic** (pattern only, don't copy code)
   - Concept: Period comparison calculation
   - Concept: Trend indicators

2. **Click Behavior Pattern** (pattern only)
   - Concept: How click events propagate to dashboard
   - Concept: Cross-filtering mechanism

---

## Bundle Size Considerations

| Current                   | Proposed                              | Delta                             |
| ------------------------- | ------------------------------------- | --------------------------------- |
| echarts-for-react (~50KB) | echarts/core (~200KB with components) | +150KB initial, but tree-shakable |

**Mitigation:**

- Use ECharts component imports (not full bundle)
- Dynamic import for chart types not on initial load
- Code-split dashboard page

---

## Implementation Estimate

| Phase                    | Effort    | Dependencies              |
| ------------------------ | --------- | ------------------------- |
| Phase 1: Quick Wins      | 1-2 weeks | None                      |
| Phase 2: Chart Config UI | 2-3 weeks | Phase 1                   |
| Phase 3: ECharts Wrapper | 1-2 weeks | Can parallel with Phase 2 |
| Phase 4: Smart KPI       | 1 week    | Phase 3                   |
| Phase 5: Dashboard       | 2-3 weeks | Phases 1-4                |

**Total:** ~8-11 weeks for full parity improvement

---

## Decision Points

### 1. Keep echarts-for-react or Switch to Direct ECharts?

**Option A: Keep echarts-for-react**

- Pro: Simpler, less work
- Con: Limited event handling, no theming control

**Option B: Direct ECharts (Superset's approach)**

- Pro: Full control, event handling, theming, smaller bundle potential
- Con: More code to maintain

**Recommendation:** Switch to direct ECharts for better long-term flexibility.

### 2. Build vs. Embed External BI Tool?

For the current SIN use case (governed data explorer), building makes sense because:

- We need tight integration with org-scoping
- Security/compliance controls are custom
- The governance layer is our differentiator

For general-purpose BI needs, consider embedded Metabase/Superset in future.

### 3. Priority: More Chart Types or Better Configuration?

**Recommendation:** Better configuration first. Having well-configured bar/line/pie charts is more valuable than 20 poorly-configured chart types.

---

## Next Steps

1. **Immediate:** Port color scheme system from Superset (1-2 days)
2. **This week:** Implement auto-run on field drop
3. **Next sprint:** Control panel UI for chart configuration
4. **Following sprint:** Enhanced ECharts wrapper with click events

---

## Appendix: Superset Files to Study

```bash
# Core ECharts plugin structure
~/dev/superset/superset-frontend/plugins/plugin-chart-echarts/src/

# Color utilities (Apache 2.0 - can port)
~/dev/superset/superset-frontend/packages/superset-ui-core/src/color/

# Number formatting (Apache 2.0 - can port)
~/dev/superset/superset-frontend/packages/superset-ui-core/src/number-format/

# Control panel types
~/dev/superset/superset-frontend/packages/superset-ui-chart-controls/src/

# Dashboard components
~/dev/superset/superset-frontend/src/dashboard/components/
```

## Appendix: Metabase Files to Study (Patterns Only)

```bash
# Visualization architecture
~/dev/metabase/frontend/src/metabase/visualizations/

# Smart Scalar (KPI with trends)
~/dev/metabase/frontend/src/metabase/visualizations/visualizations/SmartScalar/

# Click behaviors
~/dev/metabase/frontend/src/metabase/dashboard/components/ClickBehaviorSidebar/
```

---

## Appendix: Ready-to-Use Code Patterns

### Color Scheme System (Port from Superset)

Create `src/features/bi/utils/color-schemes.ts`:

```typescript
/**
 * Color schemes ported from Apache Superset (Apache 2.0 License)
 * https://github.com/apache/superset
 */

export interface ColorScheme {
  id: string;
  label: string;
  colors: string[];
}

export const COLOR_SCHEMES: ColorScheme[] = [
  {
    id: 'd3Category10',
    label: 'D3 Category 10',
    colors: [
      '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
      '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
    ],
  },
  {
    id: 'd3Category20',
    label: 'D3 Category 20',
    colors: [
      '#1f77b4', '#aec7e8', '#ff7f0e', '#ffbb78', '#2ca02c',
      '#98df8a', '#d62728', '#ff9896', '#9467bd', '#c5b0d5',
      '#8c564b', '#c49c94', '#e377c2', '#f7b6d2', '#7f7f7f',
      '#c7c7c7', '#bcbd22', '#dbdb8d', '#17becf', '#9edae5',
    ],
  },
  {
    id: 'echarts',
    label: 'ECharts Default',
    colors: [
      '#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de',
      '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc',
    ],
  },
  {
    id: 'viasport',
    label: 'viaSport Brand',
    colors: [
      '#0066CC', '#00A651', '#F7941D', '#ED1C24', '#662D91',
      '#00B5E2', '#8DC63F', '#FFC20E', '#F15A29', '#93278F',
    ],
  },
];

export function getColorScale(schemeId: string): (value: string, index?: number) => string {
  const scheme = COLOR_SCHEMES.find(s => s.id === schemeId) ?? COLOR_SCHEMES[0];
  const colorMap = new Map<string, string>();

  return (value: string, index?: number): string => {
    if (colorMap.has(value)) {
      return colorMap.get(value)!;
    }

    const colorIndex = index ?? colorMap.size;
    const color = scheme.colors[colorIndex % scheme.colors.length];
    colorMap.set(value, color);
    return color;
  };
}
```

### Enhanced Transform Pattern

Create `src/features/bi/utils/chart-transform.ts`:

```typescript
import { getColorScale } from './color-schemes';
import type { PivotResult, ChartType } from '../bi.schemas';

export interface ChartTransformOptions {
  colorScheme?: string;
  showLegend?: boolean;
  showLabels?: boolean;
  showTooltip?: boolean;
  donut?: boolean;
  innerRadius?: number;
  outerRadius?: number;
}

export function transformPivotToChart(
  pivot: PivotResult,
  chartType: ChartType,
  measureKey: string,
  options: ChartTransformOptions = {}
) {
  const {
    colorScheme = 'd3Category10',
    showLegend = true,
    showLabels = true,
    showTooltip = true,
    donut = false,
    innerRadius = 40,
    outerRadius = 70,
  } = options;

  const colorFn = getColorScale(colorScheme);

  // ... rest of transformation logic
  // Apply colors via colorFn(categoryName, index)
}
```

### Control Panel Definition

Create `src/features/bi/components/chart-config/types.ts`:

```typescript
export type ControlType =
  | 'checkbox'
  | 'slider'
  | 'select'
  | 'text'
  | 'color-scheme';

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
  renderTrigger?: boolean; // true = re-render chart on change
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
```

Example Pie Chart Control Panel:

```typescript
export const pieChartControlPanel: ChartControlPanel = {
  chartType: 'pie',
  sections: [
    {
      label: 'Chart Options',
      expanded: true,
      controls: [
        {
          name: 'colorScheme',
          type: 'color-scheme',
          label: 'Color Scheme',
          defaultValue: 'd3Category10',
        },
        {
          name: 'donut',
          type: 'checkbox',
          label: 'Donut',
          description: 'Show as donut chart instead of pie',
          defaultValue: false,
        },
        {
          name: 'innerRadius',
          type: 'slider',
          label: 'Inner Radius',
          min: 0,
          max: 100,
          step: 5,
          defaultValue: 40,
          visibility: (fd) => fd.donut === true,
        },
        {
          name: 'showLabels',
          type: 'checkbox',
          label: 'Show Labels',
          defaultValue: true,
        },
        {
          name: 'labelType',
          type: 'select',
          label: 'Label Type',
          defaultValue: 'key_percent',
          options: [
            { value: 'key', label: 'Category Name' },
            { value: 'value', label: 'Value' },
            { value: 'percent', label: 'Percentage' },
            { value: 'key_percent', label: 'Name + Percentage' },
          ],
          visibility: (fd) => fd.showLabels === true,
        },
      ],
    },
    {
      label: 'Legend',
      controls: [
        {
          name: 'showLegend',
          type: 'checkbox',
          label: 'Show Legend',
          defaultValue: true,
        },
        {
          name: 'legendPosition',
          type: 'select',
          label: 'Legend Position',
          defaultValue: 'right',
          options: [
            { value: 'top', label: 'Top' },
            { value: 'bottom', label: 'Bottom' },
            { value: 'left', label: 'Left' },
            { value: 'right', label: 'Right' },
          ],
          visibility: (fd) => fd.showLegend === true,
        },
      ],
    },
  ],
};
```
