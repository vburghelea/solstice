# BI Dashboard Crash Report: Chart Widgets + Grid Layout

## Executive Summary

Dashboard edit mode crashed when adding chart widgets, dragging, or resizing.
Two root issues were involved:

- `react-resizable` assumes `children.props.children` is iterable, which breaks
  when `react-grid-layout` renders its drag placeholder with `<div />`.
- `ChartContainer` stored the ECharts component incorrectly, causing React to
  call it as a state updater and crash.

The durable fix is upgrading to `react-resizable@3.1.1`, which normalizes
children via `React.Children.toArray` before spreading. The Edit Widget UI is
now restored.

## Impact

- Edit mode drag/resize threw `children.props.children is not iterable`.
- Clicking the Edit Widget button could trigger a drag start and crash.
- Chart widgets crashed on render with `Cannot set properties of undefined`.
- The route error boundary rendered a full-page failure state.

## Environment

- Local Vite dev server on `http://localhost:5173`.
- Verified with MCP browser automation.

## Reproduction (Before Fix)

1. Navigate to `/dashboard/analytics/dashboards/new`.
2. Create a dashboard.
3. Click **Add widget** and choose **Chart**.
4. Toggle **Edit layout** on.
5. Drag or resize the widget.
6. (Alternate) Click the Edit Widget pencil icon while in edit mode.

## Errors Observed

- `TypeError: children.props.children is not iterable` (from `react-resizable`).
- `Cannot set properties of undefined (setting 'props')` (from `ChartContainer`).
- Error boundary message: "SOMETHING WENT WRONG" on
  `/dashboard/analytics/dashboards/$dashboardId`.

## Root Cause Analysis

### A) Chart Component State Misuse

`ChartContainer` used `setChartComponent(mod.default)`. React treats a function
passed to `setState` as an updater and invokes it, which passed invalid data
into the ECharts component and caused a crash.

### B) Drag Placeholder + `react-resizable` Assumption

During drag/resize, `react-grid-layout` renders a placeholder `GridItem` with
`children: <div />`. `react-resizable` then spreads
`children.props.children` directly:

```js
children: [...children.props.children, ...resizeHandles.map(...)];
```

When `children.props.children` is `undefined`, the spread throws. Because
`react-grid-layout` uses a drag threshold of `0`, even a click can start a drag,
so clicking the edit button could trigger the same crash.

## Evidence (Library Sources)

- `react-resizable` spread logic:
  - `/Users/austin/dev/solstice/node_modules/react-resizable/build/Resizable.js`
- Placeholder render with `children: <div />`:
  - `/Users/austin/dev/solstice/node_modules/react-grid-layout/dist/chunk-KEM2G3LX.js`
- Legacy wrapper in use:
  - `/Users/austin/dev/solstice/node_modules/react-grid-layout/dist/legacy.js`

## Fix Applied

### Chart Rendering Fix

- Wrapped the component setter in a function to avoid React treating it as a
  state updater:
  - `/Users/austin/dev/solstice/src/features/bi/components/charts/ChartContainer.tsx`

### Edit Mode Stabilization

- Paused pivot queries and chart rendering while editing to reduce reflow and
  re-renders during drag/resize:
  - `/Users/austin/dev/solstice/src/features/bi/components/dashboard/DashboardWidget.tsx`

### React-Resizable Upgrade (Upstream Fix)

- Upgraded `react-resizable` to `3.1.1`, which uses
  `React.Children.toArray(children.props.children)` internally before spreading:
  - `/Users/austin/dev/solstice/package.json`
  - `/Users/austin/dev/solstice/pnpm-lock.yaml`

### Shim Cleanup

- Removed the local shim and type declarations now that the upstream fix exists:
  - `/Users/austin/dev/solstice/src/shims/react-resizable.tsx` (deleted)
  - `/Users/austin/dev/solstice/src/types/react-resizable.d.ts` (deleted)
- Removed the Vite alias that pointed to the shim:
  - `/Users/austin/dev/solstice/vite.config.ts`

### UI Restoration

- Re-enabled Edit Widget dialog wiring:
  - `/Users/austin/dev/solstice/src/routes/dashboard/analytics/dashboards/$dashboardId.tsx`
  - `/Users/austin/dev/solstice/src/features/bi/components/dashboard/EditWidgetDialog.tsx`
- Restored toolbar edit button and prevented accidental drag on icon clicks:
  - `/Users/austin/dev/solstice/src/features/bi/components/dashboard/WidgetToolbar.tsx`
  - `/Users/austin/dev/solstice/src/features/bi/components/dashboard/DashboardCanvas.tsx`

## Validation

- `pnpm check-types` (pass).
- Manual MCP verification:
  - Add widget, enter edit mode, drag widget, open Edit Widget dialog, close it,
    continue dragging without crash.

## Current Status

- Drag/resize no longer crashes in edit mode.
- Edit Widget button and dialog are enabled again.
- Chart widget rendering no longer crashes on mount.

## Related Files (Full Paths)

- `/Users/austin/dev/solstice/src/features/bi/components/charts/ChartContainer.tsx`
- `/Users/austin/dev/solstice/src/features/bi/components/dashboard/DashboardCanvas.tsx`
- `/Users/austin/dev/solstice/src/features/bi/components/dashboard/DashboardWidget.tsx`
- `/Users/austin/dev/solstice/src/features/bi/components/dashboard/EditWidgetDialog.tsx`
- `/Users/austin/dev/solstice/src/features/bi/components/dashboard/WidgetToolbar.tsx`
- `/Users/austin/dev/solstice/src/routes/dashboard/analytics/dashboards/$dashboardId.tsx`
- `/Users/austin/dev/solstice/vite.config.ts`
- `/Users/austin/dev/solstice/package.json`
- `/Users/austin/dev/solstice/pnpm-lock.yaml`

## Removed Files (Historical)

- `/Users/austin/dev/solstice/src/shims/react-resizable.tsx`
- `/Users/austin/dev/solstice/src/types/react-resizable.d.ts`

## Third-Party Files Reviewed (Full Paths)

- `/Users/austin/dev/solstice/node_modules/react-resizable/build/Resizable.js`
- `/Users/austin/dev/solstice/node_modules/react-grid-layout/dist/chunk-KEM2G3LX.js`
- `/Users/austin/dev/solstice/node_modules/react-grid-layout/dist/legacy.js`
