# WCAG 2.1 Level AA Compliance Assessment Plan

**Worklog:** [WCAG-21-COMPLIANCE-WORKLOG.md](./WCAG-21-COMPLIANCE-WORKLOG.md)

## Goal

Systematically evaluate and remediate the Solstice codebase for WCAG 2.1 Level AA compliance, resulting in a documented compliance status for the SIN RFP response.

## WCAG Library Reference

Local WCAG source: `~/dev/_libraries/wcag/`

| Directory                        | Contents                                 |
| -------------------------------- | ---------------------------------------- |
| `guidelines/sc/20/`              | WCAG 2.0 success criteria (61 files)     |
| `guidelines/sc/21/`              | WCAG 2.1 new success criteria (18 files) |
| `understanding/20/`              | Understanding docs for 2.0 criteria      |
| `understanding/21/`              | Understanding docs for 2.1 criteria      |
| `techniques/aria/`               | ARIA techniques (ARIA1-ARIA24)           |
| `techniques/html/`               | HTML techniques (H1-H98)                 |
| `techniques/css/`                | CSS techniques (C1-C47)                  |
| `techniques/general/`            | General techniques (G1-G224)             |
| `techniques/failures/`           | Common failures to avoid (F1-F105)       |
| `techniques/client-side-script/` | JavaScript techniques (SCR1-SCR43)       |

---

## User Impact Protocol

> **IMPORTANT:** Before implementing any change that could affect general user functionality, CHECK WITH USER. This includes:
>
> - Removing or changing animations/transitions
> - Modifying form behavior or validation timing
> - Changing focus behavior or tab order
> - Altering visual hierarchy or contrast
> - Modifying keyboard shortcuts
> - Changing auto-complete or auto-focus behavior

---

## Current State Summary

**Strengths (already implemented):**

- Radix UI primitives provide excellent built-in accessibility
- Form fields have proper labels, `aria-invalid`, `aria-describedby`
- Focus styles well-implemented with `focus-visible:ring-[3px]` pattern
- Admin layouts use semantic nav with `aria-current="page"`
- Breadcrumbs have proper nav/ol structure
- `lang="en"` set on root HTML

**Critical Gaps:**

1. NO skip-to-main-content links
2. NO focus management on route changes
3. NO `aria-live` regions for dynamic content
4. Data tables missing `aria-sort`, labeled sort buttons
5. Many icon-only buttons without `aria-label` (violates 2.5.3 Label in Name)
6. Page titles not dynamically set per route
7. NO accessibility testing infrastructure

**Nice-to-Have (AAA):**

- `prefers-reduced-motion` support (2.3.3 - AAA, not required for AA)

---

## Phase 1: Critical Infrastructure (Foundation)

**Effort:** 2-3 days

### 1.1 Skip Navigation Links

**WCAG:** 2.4.1 Bypass Blocks (A)
**Reference:** `~/dev/_libraries/wcag/understanding/20/bypass-blocks.html`
**Techniques:**

- `techniques/general/G1.html` - Adding a link at the top to go to main content
- `techniques/general/G123.html` - Adding a link at beginning to go to repeated content
- `techniques/general/G124.html` - Adding links at the top to navigate to content areas

**Create:** `src/components/ui/skip-link.tsx`
**Modify:**

- `src/routes/__root.tsx`
- `src/features/layouts/app-layout.tsx`

**Work:**

- Create skip link component (hidden until focused)
- Add `<main id="main-content" tabIndex={-1}>` to layouts
- Support targets: "Skip to main content", "Skip to navigation"

**User Impact:** None - adds functionality without removing anything

---

### 1.2 Focus Management on Route Changes

**WCAG:** 2.4.3 Focus Order (A), 3.2.1 On Focus (A)
**Reference:**

- `~/dev/_libraries/wcag/understanding/20/focus-order.html`
- `~/dev/_libraries/wcag/understanding/20/on-focus.html`
  **Techniques:**
- `techniques/general/G59.html` - Placing interactive elements in order following sequences and relationships
- `techniques/client-side-script/SCR26.html` - Inserting dynamic content into DOM immediately following trigger element

**Create:** `src/hooks/useFocusOnRouteChange.ts`
**Modify:** `src/routes/__root.tsx`

**Work:**

- Listen to TanStack Router navigation events
- Focus main content area on navigation
- Announce page change via live region

**Safeguards (to avoid focus conflicts):**

- **Gate on open modals/drawers**: Skip focus move if a dialog, sheet, or portal is currently open (check for `[role="dialog"][open]`, `[data-state="open"]`, or Radix portal presence)
- **Gate on hash/anchor navigation**: If URL contains `#anchor`, focus the target element instead of main content
- **Respect user-initiated focus**: Don't force focus if user has clicked/focused an element within the last 100ms (use a brief debounce)
- **Skip on back/forward navigation**: Browser already restores scroll position; focus move may be disruptive

**User Impact:** Minor - focus will move on navigation. **CHECK WITH USER** if this behavior is acceptable.

---

### 1.3 Reduced Motion Support (OPTIONAL - AAA)

**WCAG:** 2.3.3 Animation from Interactions **(AAA - out of scope for AA compliance)**
**Reference:** `~/dev/_libraries/wcag/understanding/21/animation-from-interactions.html`
**Techniques:**

- `techniques/css/C39.html` - Using CSS reduce-motion query to prevent motion

> **Note:** This is a Level AAA criterion, not required for our AA compliance goal. Including as a low-priority enhancement since it's simple to implement and improves UX for motion-sensitive users.

**For AA compliance**, the relevant criterion is **2.3.1 Three Flashes or Below Threshold (A)** - we should verify no content flashes more than 3 times per second. Current assessment: **No known flashing content** in the app.

**Modify:** `src/styles.css` (low priority)

**Work:**

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

**Exceptions to preserve:**

- Loading spinners (keep visible, reduce motion)
- Progress bars (keep functional)
- Essential state change indicators

---

### 1.4 Global Live Announcer

**WCAG:** 4.1.3 Status Messages (AA)
**Reference:** `~/dev/_libraries/wcag/understanding/21/status-messages.html`
**Guidelines:** `~/dev/_libraries/wcag/guidelines/sc/21/status-messages.html`
**Techniques:**

- `techniques/aria/ARIA19.html` - Using ARIA role=alert or Live Regions
- `techniques/aria/ARIA22.html` - Using role=status for status messages
- `techniques/aria/ARIA23.html` - Using role=log for chat logs

**Create:**

- `src/components/ui/live-region.tsx`
- `src/hooks/useLiveAnnouncer.ts`

**Modify:** `src/routes/__root.tsx`

**Work:**

- Add polite and assertive live regions to root
- Create hook for programmatic announcements
- Integrate with toast system (Sonner)

**User Impact:** None - adds screen reader announcements without visual changes

---

### 1.5 Dynamic Page Titles

**WCAG:** 2.4.2 Page Titled (A)
**Reference:** `~/dev/_libraries/wcag/understanding/20/page-titled.html`
**Techniques:**

- `techniques/general/G88.html` - Providing descriptive titles for pages
- `techniques/html/H25.html` - Providing a title using the title element

**Modify:** All 75+ route files in `src/routes/`

**Work:**

- Add `head()` export to each route with descriptive title
- Pattern: `"Page Name | Solstice"`

**User Impact:** None - improves browser tab titles

---

## Phase 2: Core UI Components

**Effort:** 3-4 days
**Depends on:** Phase 1.4 (Live Announcer)

### 2.1 Data Table Accessibility

**WCAG:** 1.3.1 Info and Relationships (A), 4.1.2 Name, Role, Value (A)
**Reference:**

- `~/dev/_libraries/wcag/understanding/20/info-and-relationships.html`
- `~/dev/_libraries/wcag/understanding/20/name-role-value.html`
  **Techniques:**
- `techniques/html/H43.html` - Using id and headers attributes
- `techniques/html/H51.html` - Using table markup for tabular information
- `techniques/html/H63.html` - Using scope attribute on th elements
- `techniques/aria/ARIA24.html` - Semantically identifying a table with role="table"

**Failures to avoid:**

- `techniques/failures/F91.html` - Failure due to not correctly marking up table headers
- `techniques/failures/F92.html` - Failure due to use of role presentation on content with semantic meaning

**Modify:** `src/components/ui/data-table.tsx`

**Work:**

- Add `aria-label` to sort buttons: `"Sort by {column}, currently {direction}"`
- Add `aria-sort` to sorted column headers
- Announce pagination changes via live region
- Announce column visibility changes

**User Impact:** None - enhances existing functionality

---

### 2.2 Icon-Only Buttons

**WCAG:** 1.1.1 Non-text Content (A), 4.1.2 Name, Role, Value (A)
**Reference:** `~/dev/_libraries/wcag/understanding/20/non-text-content.html`
**Techniques:**

- `techniques/aria/ARIA6.html` - Using aria-label for objects
- `techniques/aria/ARIA14.html` - Using aria-label for invisible content
- `techniques/html/H30.html` - Providing link text describing purpose of link

**Failures to avoid:**

- `techniques/failures/F89.html` - Failure due to not providing accessible name for image that is only content

**Files to audit and fix:**

- `src/components/ui/mobile-app-header.tsx`
- `src/components/ui/mobile-admin-header.tsx`
- `src/features/notifications/components/notification-bell.tsx`
- `src/features/bi/components/` - Toolbar buttons
- All files using `<Button size="icon">` pattern

**Work:**

- Add `aria-label` to all icon-only buttons
- Pattern: `<Button aria-label="Open menu"><Menu /></Button>`

**User Impact:** None - adds labels without visual changes

---

### 2.3 Form Error Announcements

**WCAG:** 3.3.1 Error Identification (A), 3.3.3 Error Suggestion (AA)
**Reference:**

- `~/dev/_libraries/wcag/understanding/20/error-identification.html`
- `~/dev/_libraries/wcag/understanding/20/error-suggestion.html`
  **Techniques:**
- `techniques/aria/ARIA18.html` - Using aria-alertdialog for alerts
- `techniques/aria/ARIA19.html` - Using ARIA role=alert for errors
- `techniques/aria/ARIA21.html` - Using aria-invalid for errors
- `techniques/general/G83.html` - Providing text descriptions for required fields
- `techniques/general/G85.html` - Providing text description when user input fails

**Modify:** All files in `src/components/form-fields/`

**Work:**

- Add `role="alert"` to error message containers
- Ensure error messages include field name for context
- Add form-level error summary component

> **CHECK WITH USER:** Adding `role="alert"` makes errors immediately announced. This could be disruptive if errors appear during typing. May want to only announce on form submission or field blur.

---

### 2.4 Command Palette (Global Search)

**WCAG:** 4.1.3 Status Messages (AA), 1.3.1 Info and Relationships (A)
**Reference:** `~/dev/_libraries/wcag/understanding/21/status-messages.html`
**Techniques:**

- `techniques/aria/ARIA22.html` - Using role=status for status messages

**Modify:** `src/features/search/components/global-search-command-palette.tsx`

**Work:**

- Announce result count: "6 results found"
- Announce searching state
- Announce no results
- Add `aria-expanded` to trigger

**User Impact:** None - screen reader enhancement only

---

## Phase 3: Complex Component Accessibility

**Effort:** 4-5 days
**Depends on:** Phase 1 and 2

### 3.1 Charts and Data Visualization

**WCAG:** 1.1.1 Non-text Content (A), 1.4.1 Use of Color (A)
**Reference:**

- `~/dev/_libraries/wcag/understanding/20/non-text-content.html`
- `~/dev/_libraries/wcag/understanding/20/use-of-color.html`
  **Techniques:**
- `techniques/general/G14.html` - Ensuring info conveyed by color is also available in text
- `techniques/general/G111.html` - Using color and pattern for graphics
- `techniques/general/G82.html` - Providing text alternative that identifies purpose of non-text content
- `techniques/aria/ARIA10.html` - Using aria-labelledby for non-text content

**Files:**

- `src/features/bi/components/charts/ChartContainer.tsx`
- `src/features/bi/components/charts/BarChart.tsx`
- `src/features/bi/components/charts/LineChart.tsx`
- `src/features/bi/components/charts/PieChart.tsx`

**Work:**

- Verify all chart usages pass meaningful `ariaLabel` and `ariaDescription`
- Add hidden data table alternative option
- Review chart colors for contrast
- Consider pattern/texture differentiation

> **CHECK WITH USER:** Adding data table alternatives to charts will add UI complexity. Verify this is desired - could be toggle, modal, or always-visible option.

---

### 3.2 SQL Workbench

**WCAG:** 1.3.1 Info and Relationships (A), 2.1.1 Keyboard (A)
**Reference:**

- `~/dev/_libraries/wcag/understanding/20/keyboard.html`
  **Techniques:**
- `techniques/general/G202.html` - Ensuring keyboard control for all functionality
- `techniques/client-side-script/SCR20.html` - Using keyboard-triggerable events
- `techniques/aria/ARIA11.html` - Using ARIA landmarks

**Files:**

- `src/features/bi/components/sql-workbench/SqlEditor.tsx`
- `src/features/bi/components/sql-workbench/ResultsTable.tsx`
- `src/features/bi/components/sql-workbench/SchemaBrowser.tsx`

**Work:**

- Add proper labeling to CodeMirror editor
- Implement ARIA tree roles for schema browser
- Apply data table patterns to results
- Document keyboard shortcuts

**User Impact:** None - enhances existing functionality

---

### 3.3 Import Wizard Multi-Step Form

**WCAG:** 1.3.1 Info and Relationships (A), 2.4.6 Headings and Labels (AA)
**Reference:**

- `~/dev/_libraries/wcag/understanding/20/headings-and-labels.html`
  **Techniques:**
- `techniques/general/G131.html` - Providing descriptive labels
- `techniques/aria/ARIA6.html` - Using aria-label

**File:** `src/features/imports/components/smart-import-wizard.tsx`

**Work:**

- Add `aria-current="step"` to step indicator
- Announce step changes via live region
- Ensure proper heading hierarchy in each step
- Label mapping table properly

**User Impact:** None - enhances navigation

---

### 3.4 BI Pivot Builder Accessibility (DETAILED)

**WCAG:** 2.1.1 Keyboard (A), 4.1.2 Name, Role, Value (A), 4.1.3 Status Messages (AA)
**Reference:** `~/dev/_libraries/wcag/understanding/20/keyboard.html`
**Techniques:**

- `techniques/general/G90.html` - Providing keyboard-triggered event handlers
- `techniques/general/G202.html` - Ensuring keyboard control for all functionality
- `techniques/aria/ARIA19.html` - Using ARIA role=alert or Live Regions

**Failures to avoid:**

- `techniques/failures/F54.html` - Failure due to using only pointing-device-specific events
- `techniques/failures/F55.html` - Failure due to using script to remove focus

#### Current Implementation Analysis

**PivotBuilder.tsx** (Lines 162-919):

- Uses `@dnd-kit/core` with `DndContext`, `PointerSensor`, `KeyboardSensor`
- `SortableField` component (lines 124-160) has drag handle on a `<span>` - NOT keyboard accessible
- Four drop zones: "available fields", "rows", "columns", "measures"
- Has sr-only instruction text but drag handle isn't a proper interactive element

**Current Issues:**
| Issue | Location | Severity |
|-------|----------|----------|
| Drag handle on `<span>` (not focusable) | `PivotBuilder.tsx:149-155` | Critical |
| No button-based field movement | All zones | Critical |
| Fields can only be removed by dragging | Row/Column zones | High |
| Measure reorder is drag-only | Measures zone | High |
| No mode toggle for keyboard users | N/A | High |

#### Solution A: Interaction Mode Toggle

Add a toggle between "Drag Mode" and "Button Mode":

```tsx
// Add to PivotBuilder state
const [interactionMode, setInteractionMode] = useState<"drag" | "buttons">("drag");

// UI toggle component
<ToggleGroup type="single" value={interactionMode} onValueChange={setInteractionMode}>
  <ToggleGroupItem value="drag" aria-label="Drag mode">
    <Hand className="h-4 w-4 mr-1" /> Drag
  </ToggleGroupItem>
  <ToggleGroupItem value="buttons" aria-label="Button mode">
    <ListPlus className="h-4 w-4 mr-1" /> Buttons
  </ToggleGroupItem>
</ToggleGroup>
```

#### Solution B: Field Movement Buttons (hover-reveal)

When hovering on available fields, show Add buttons:

```tsx
// For fields in "Available Fields" zone
<div className="group flex items-center gap-1">
  <span>{label}</span>
  <div className="hidden group-hover:flex gap-0.5">
    <Button size="xs" onClick={() => addToRows(id)} aria-label={`Add ${label} to rows`}>
      → Rows
    </Button>
    <Button size="xs" onClick={() => addToColumns(id)} aria-label={`Add ${label} to columns`}>
      → Cols
    </Button>
    <Button size="xs" onClick={() => addToMeasures(id)} aria-label={`Add ${label} to measures`}>
      → Measures
    </Button>
  </div>
</div>

// For fields in Row/Column/Measure zones
<div className="group flex items-center gap-1">
  <span>{label}</span>
  <div className="hidden group-hover:flex">
    <Button size="xs" variant="ghost" onClick={() => removeField(id)} aria-label={`Remove ${label}`}>
      <X className="h-3 w-3" />
    </Button>
  </div>
</div>
```

#### Solution C: Measure Reorder Buttons

**File:** `src/features/bi/components/pivot-builder/MeasureConfig.tsx`

Add up/down buttons alongside existing remove button:

```tsx
// Add props
onMoveUp?: () => void;
onMoveDown?: () => void;

// Add buttons
{onMoveUp && (
  <Button size="icon" variant="ghost" onClick={onMoveUp} aria-label="Move measure up">
    <ChevronUp className="h-4 w-4" />
  </Button>
)}
{onMoveDown && (
  <Button size="icon" variant="ghost" onClick={onMoveDown} aria-label="Move measure down">
    <ChevronDown className="h-4 w-4" />
  </Button>
)}
```

#### Solution D: Replace span with button for drag handle

```tsx
// Instead of (current - line 149-155):
<span {...attributes} {...listeners} aria-label={`Drag ${label}`}>
  {label}
</span>

// Use:
<button
  type="button"
  {...attributes}
  {...listeners}
  aria-label={`Move ${label} (Space to grab, arrows to move)`}
  className="inline-flex items-center gap-1 cursor-grab"
>
  <GripVertical className="h-4 w-4" />
  {label}
</button>
```

#### Files to Modify

| File                                                            | Changes                                                |
| --------------------------------------------------------------- | ------------------------------------------------------ |
| `src/features/bi/components/pivot-builder/PivotBuilder.tsx`     | Mode toggle, field movement handlers, button rendering |
| `src/features/bi/components/pivot-builder/DropZone.tsx`         | Conditional button vs drag rendering                   |
| `src/features/bi/components/pivot-builder/MeasureConfig.tsx`    | Add move up/down buttons                               |
| `src/features/bi/components/pivot-builder/FieldMoveButtons.tsx` | **New component** for hover-reveal buttons             |

> **CHECK WITH USER:** The hover-reveal buttons pattern adds visible UI on hover. Options:
>
> - Always visible in "Button Mode", hover-reveal in "Drag Mode"
> - Always visible for all users (simpler, more discoverable)
> - Keyboard focus also reveals buttons (not just hover)

---

### 3.5 Dashboard Canvas Widget Manipulation

**WCAG:** 2.1.1 Keyboard (A)
**Reference:** `~/dev/_libraries/wcag/understanding/20/keyboard.html`

#### Current Implementation Analysis

**DashboardCanvas.tsx** (uses `react-grid-layout`):

- `isDraggable={editable}` - binary toggle
- `isResizable={editable}` - binary toggle
- No keyboard shortcuts for widget movement/resize
- Library has limited keyboard support

**WidgetToolbar.tsx**:

- Has Edit and Remove buttons with `aria-label` ✓
- Missing: Move up/down/left/right buttons
- Missing: Resize expand/shrink buttons

#### Solution: Widget Manipulation Buttons

Add directional move/resize buttons to widget toolbar in edit mode:

```tsx
// In WidgetToolbar.tsx - add when editable
{editable && (
  <div className="flex gap-1 border-l pl-2 ml-2">
    {/* Move controls */}
    <div className="flex flex-col gap-0.5">
      <Button size="icon" variant="ghost" onClick={onMoveUp}
        aria-label="Move up (Alt+↑)" title="Alt+↑">
        <ArrowUp className="h-3 w-3" />
      </Button>
      <Button size="icon" variant="ghost" onClick={onMoveDown}
        aria-label="Move down (Alt+↓)" title="Alt+↓">
        <ArrowDown className="h-3 w-3" />
      </Button>
    </div>
    <div className="flex flex-col gap-0.5">
      <Button size="icon" variant="ghost" onClick={onMoveLeft}
        aria-label="Move left (Alt+←)" title="Alt+←">
        <ArrowLeft className="h-3 w-3" />
      </Button>
      <Button size="icon" variant="ghost" onClick={onMoveRight}
        aria-label="Move right (Alt+→)" title="Alt+→">
        <ArrowRight className="h-3 w-3" />
      </Button>
    </div>
    {/* Resize controls */}
    <div className="flex gap-0.5 border-l pl-1 ml-1">
      <Button size="icon" variant="ghost" onClick={onShrink}
        aria-label="Shrink" title="Ctrl+Alt+↓">
        <Minimize2 className="h-3 w-3" />
      </Button>
      <Button size="icon" variant="ghost" onClick={onExpand}
        aria-label="Expand" title="Ctrl+Alt+↑">
        <Maximize2 className="h-3 w-3" />
      </Button>
    </div>
  </div>
)}
```

#### Optional: Keyboard Shortcut Hook

```tsx
// New: src/features/bi/hooks/useWidgetKeyboard.ts
export function useWidgetKeyboard(widgetId: string, handlers: {
  onMove?: (dir: "up" | "down" | "left" | "right") => void;
  onResize?: (dir: "shrink" | "expand") => void;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && !e.ctrlKey) {
        // Alt+Arrow = move
        if (e.key === "ArrowUp") { handlers.onMove?.("up"); e.preventDefault(); }
        // ... etc
      } else if (e.altKey && e.ctrlKey) {
        // Ctrl+Alt+Arrow = resize
        if (e.key === "ArrowUp") { handlers.onResize?.("expand"); e.preventDefault(); }
        // ... etc
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlers]);
}
```

#### Files to Modify

| File                                                       | Changes                             |
| ---------------------------------------------------------- | ----------------------------------- |
| `src/features/bi/components/dashboard/WidgetToolbar.tsx`   | Add move/resize buttons             |
| `src/features/bi/components/dashboard/DashboardCanvas.tsx` | Wire up handlers, keyboard hook     |
| `src/features/bi/components/dashboard/DashboardWidget.tsx` | Pass handlers to toolbar            |
| `src/features/bi/hooks/useWidgetKeyboard.ts`               | **New** - keyboard shortcut handler |

> **CHECK WITH USER:** Keyboard shortcuts (Alt+Arrows) may conflict with browser/OS shortcuts. Options:
>
> - Use different modifier (Shift+Arrows)
> - Only enable when widget is focused
> - Document shortcuts prominently

---

### 3.6 BI Accessibility Implementation Summary

**Priority order:**

1. **Critical**: Pivot builder field add/remove buttons (Solution B)
2. **Critical**: Replace drag handle span with button (Solution D)
3. **High**: Interaction mode toggle (Solution A)
4. **High**: Measure reorder buttons (Solution C)
5. **Medium**: Dashboard widget move/resize buttons
6. **Medium**: Keyboard shortcuts for power users

**New files to create:**

- `src/features/bi/components/pivot-builder/FieldMoveButtons.tsx`
- `src/features/bi/hooks/useWidgetKeyboard.ts`

**Screen reader announcements needed:**

- "Field {name} added to rows"
- "Field {name} removed from columns"
- "Measure {name} moved up"
- "Widget {title} moved to row 2, column 1"

---

## Phase 4: Route-by-Route Audit

**Effort:** 3-4 days
**Depends on:** Phases 1-3

**Per-route checklist:**

- [ ] Page title set via `head()` export
- [ ] Heading hierarchy (h1 → h2 → h3, no skipping)
- [ ] All interactive elements keyboard accessible
- [ ] All forms properly labeled
- [ ] All images/icons have alt text or aria-label
- [ ] Focus management correct for any modals/dialogs
- [ ] Color contrast verified

### Route Categories

| Category  | Routes     | Key WCAG Focus                               |
| --------- | ---------- | -------------------------------------------- |
| Auth      | 4 routes   | Form accessibility (3.3.x), keyboard (2.1.1) |
| Dashboard | 10+ routes | Headings (2.4.6), landmarks (1.3.1)          |
| Teams     | 6 routes   | Tables (1.3.1), action buttons (4.1.2)       |
| Events    | 6 routes   | Forms (3.3.x), calendars (2.1.1)             |
| Analytics | 8 routes   | Charts (1.1.1), complex widgets (4.1.2)      |
| SIN       | 15+ routes | Admin patterns, data management              |
| Admin     | 15+ routes | Tables (1.3.1), bulk operations (4.1.2)      |

**Key WCAG Reference Files:**

- `~/dev/_libraries/wcag/understanding/20/info-and-relationships.html`
- `~/dev/_libraries/wcag/understanding/20/headings-and-labels.html`
- `~/dev/_libraries/wcag/understanding/20/consistent-navigation.html`
- `~/dev/_libraries/wcag/understanding/20/consistent-identification.html`

---

## Phase 5: Automated Testing Infrastructure

**Effort:** 2-3 days
**Depends on:** Phases 1-4

### 5.1 Install Dependencies

```bash
pnpm add -D @axe-core/playwright
```

### 5.2 Create A11y Test Utilities

**Create:** `e2e/utils/a11y.ts`

```typescript
import AxeBuilder from '@axe-core/playwright';

export async function checkA11y(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();
  expect(results.violations).toEqual([]);
}
```

### 5.3 Create A11y Test Suite

**Create:**

- `e2e/tests/accessibility/a11y.auth.spec.ts`
- `e2e/tests/accessibility/a11y.dashboard.spec.ts`

**Coverage:**

- Axe scan on each major route
- Keyboard navigation tests
- Skip link functionality
- Focus management on navigation

### 5.4 CI Integration

Add accessibility tests to GitHub Actions workflow.

**User Impact:** None - testing infrastructure only

---

## Phase 6: Playwright MCP Verification

**Effort:** 1-2 days
**Depends on:** All previous phases

### Manual Verification Checklist

1. **Skip Links**
   - [ ] Tab from page load focuses skip link
   - [ ] Skip link visible on focus
   - [ ] Skip link navigates to main content

2. **Focus Management**
   - [ ] Navigate between routes, focus moves to main
   - [ ] Dialog open/close maintains focus
   - [ ] Escape closes modals

3. **Keyboard Navigation**
   - [ ] All elements reachable via Tab
   - [ ] Data tables support arrow keys
   - [ ] Custom widgets fully keyboard accessible

4. **Screen Reader Simulation**
   - [ ] Page titles announced
   - [ ] Form errors announced
   - [ ] Dynamic updates announced
   - [ ] Charts have descriptions

5. **Visual**
   - [ ] Focus indicators visible
   - [ ] Reduced motion works
   - [ ] Text readable at 200% zoom

---

## WCAG 2.1 AA Criteria Reference Matrix

| Criterion | Description                      | Phase | WCAG Ref                                                 | Status  |
| --------- | -------------------------------- | ----- | -------------------------------------------------------- | ------- |
| 1.1.1     | Non-text Content                 | 2, 3  | `understanding/20/non-text-content.html`                 | Gap     |
| 1.3.1     | Info and Relationships           | 2, 3  | `understanding/20/info-and-relationships.html`           | Gap     |
| 1.3.4     | Orientation                      | 6     | `understanding/21/orientation.html`                      | Verify  |
| 1.3.5     | Identify Input Purpose           | 4     | `understanding/21/identify-input-purpose.html`           | Gap     |
| 1.4.1     | Use of Color                     | 3     | `understanding/20/use-of-color.html`                     | Gap     |
| 1.4.3     | Contrast (Minimum)               | 6     | `understanding/20/contrast-minimum.html`                 | Verify  |
| 1.4.10    | Reflow                           | 6     | `understanding/21/reflow.html`                           | Verify  |
| 1.4.11    | Non-text Contrast                | 6     | `understanding/21/non-text-contrast.html`                | Verify  |
| 1.4.12    | Text Spacing                     | 6     | `understanding/21/text-spacing.html`                     | Verify  |
| 1.4.13    | Content on Hover/Focus           | 6     | `understanding/21/content-on-hover-or-focus.html`        | Verify  |
| 2.1.1     | Keyboard                         | 3     | `understanding/20/keyboard.html`                         | Gap     |
| 2.1.4     | Character Key Shortcuts          | 4     | `understanding/21/character-key-shortcuts.html`          | Verify  |
| 2.3.1     | Three Flashes or Below Threshold | -     | `understanding/20/three-flashes-or-below-threshold.html` | Good    |
| 2.4.1     | Bypass Blocks                    | 1     | `understanding/20/bypass-blocks.html`                    | Gap     |
| 2.4.2     | Page Titled                      | 1     | `understanding/20/page-titled.html`                      | Gap     |
| 2.4.3     | Focus Order                      | 1     | `understanding/20/focus-order.html`                      | Gap     |
| 2.4.7     | Focus Visible                    | -     | `understanding/20/focus-visible.html`                    | Good    |
| 2.5.1     | Pointer Gestures                 | 3     | `understanding/21/pointer-gestures.html`                 | Verify  |
| 2.5.2     | Pointer Cancellation             | 6     | `understanding/21/pointer-cancellation.html`             | Verify  |
| 2.5.3     | Label in Name                    | 2     | `understanding/21/label-in-name.html`                    | Gap     |
| 2.5.4     | Motion Actuation                 | 6     | `understanding/21/motion-actuation.html`                 | N/A     |
| 3.1.1     | Language of Page                 | -     | `understanding/20/language-of-page.html`                 | Good    |
| 3.2.1     | On Focus                         | 1     | `understanding/20/on-focus.html`                         | Gap     |
| 3.3.1     | Error Identification             | 2     | `understanding/20/error-identification.html`             | Partial |
| 3.3.3     | Error Suggestion                 | 2     | `understanding/20/error-suggestion.html`                 | Enhance |
| 4.1.2     | Name, Role, Value                | 2, 3  | `understanding/20/name-role-value.html`                  | Gap     |
| 4.1.3     | Status Messages                  | 1, 2  | `understanding/21/status-messages.html`                  | Gap     |

---

## Deliverables

1. **Remediated codebase** - All phases implemented
2. **WCAG Compliance Matrix** - Updated ticket with status of each criterion
3. **Automated test suite** - A11y tests in `e2e/tests/accessibility/`
4. **RFP Statement** - Compliance summary for proposal

---

## Verification

After all phases complete:

1. **Run automated tests:**

   ```bash
   pnpm test:e2e --project=chromium-authenticated
   ```

2. **Run axe accessibility tests:**

   ```bash
   pnpm test:e2e e2e/tests/accessibility/
   ```

3. **Manual Playwright MCP verification:**
   - Navigate to `http://localhost:5173`
   - Test skip links, keyboard nav, focus management
   - Verify with browser accessibility tools

4. **Screen reader testing (manual):**
   - NVDA on Windows
   - VoiceOver on macOS

---

## Total Estimated Effort

| Phase                                  | Days           |
| -------------------------------------- | -------------- |
| Phase 1: Infrastructure                | 2-3            |
| Phase 2: Core Components               | 3-4            |
| Phase 3: Complex Components (incl. BI) | 5-7            |
| Phase 4: Route Audit                   | 3-4            |
| Phase 5: Testing Setup                 | 2-3            |
| Phase 6: MCP Verification              | 1-2            |
| **Total**                              | **16-23 days** |

---

## Critical Files Summary

### Infrastructure (Phase 1)

| File                                  | Changes                                   |
| ------------------------------------- | ----------------------------------------- |
| `src/routes/__root.tsx`               | Skip link, live regions, focus management |
| `src/features/layouts/app-layout.tsx` | Main landmark, skip link target           |
| `src/styles.css`                      | Reduced motion support                    |
| `src/components/ui/skip-link.tsx`     | **New component**                         |
| `src/hooks/useLiveAnnouncer.ts`       | **New hook**                              |
| `src/hooks/useFocusOnRouteChange.ts`  | **New hook**                              |
| `src/components/ui/live-region.tsx`   | **New component**                         |

### Core Components (Phase 2)

| File                                       | Changes                                 |
| ------------------------------------------ | --------------------------------------- |
| `src/components/ui/data-table.tsx`         | aria-sort, button labels, announcements |
| All files in `src/components/form-fields/` | Error role="alert"                      |
| All routes in `src/routes/`                | Dynamic page titles via head()          |

### BI Components (Phase 3 - EXPANDED)

| File                                                            | Changes                                                   |
| --------------------------------------------------------------- | --------------------------------------------------------- |
| `src/features/bi/components/pivot-builder/PivotBuilder.tsx`     | Mode toggle, field movement handlers, replace span→button |
| `src/features/bi/components/pivot-builder/DropZone.tsx`         | Conditional button vs drag rendering                      |
| `src/features/bi/components/pivot-builder/MeasureConfig.tsx`    | Add move up/down buttons                                  |
| `src/features/bi/components/pivot-builder/FieldMoveButtons.tsx` | **New component** - hover-reveal add/remove buttons       |
| `src/features/bi/components/dashboard/WidgetToolbar.tsx`        | Add move/resize buttons                                   |
| `src/features/bi/components/dashboard/DashboardCanvas.tsx`      | Wire up handlers                                          |
| `src/features/bi/components/dashboard/DashboardWidget.tsx`      | Pass handlers to toolbar                                  |
| `src/features/bi/hooks/useWidgetKeyboard.ts`                    | **New hook** - keyboard shortcuts                         |
| `src/features/bi/components/charts/ChartContainer.tsx`          | Verify ariaLabel usage                                    |
| `src/features/bi/components/sql-workbench/SqlEditor.tsx`        | Add proper labeling                                       |
| `src/features/bi/components/sql-workbench/SchemaBrowser.tsx`    | ARIA tree roles                                           |
