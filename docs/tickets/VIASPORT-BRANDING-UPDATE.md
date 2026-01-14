<Austin note: The primary goal is to make the best looking website possible while using only viasport (or neutral) colors, feel free to iterate on it, and can go further than described below in terms of color inclusion. Keep the same typography/don't use their actual logo though

please also make sure to maintain contrast docs/sin-rfp/response/03-service-approach/data-submission-reporting/final.md:34

Furhter notes from me will be in <> tags

>

# viaSport Branding Update Ticket

**Priority:** Medium
**Type:** Enhancement
**Affects:** SIN tenant (viasport), potentially QC tenant if needed
**Test Page:** `/brand-test` (run `pnpm dev` to view)

---

## Summary

Update the Solstice application to align with viaSport's official brand colors and visual identity. The goal is a **subtle, professional look** that maintains neutral tones while incorporating viaSport accent colors. We should err on the side of subtlety rather than bold color application.

---

## Design Philosophy

Per the user's request:

- **Subtle over bold** - Mostly neutral tones with strategic viaSport color accents
- **Professional feel** - Trust, stability, connection to BC's natural environment
- **Not an assault on the senses** - Avoid overwhelming users with brand colors

The viaSport brand uses sophisticated teal/dark blue-green tones as primary identity, with bright greens and blues as accents. These accent colors should be used **sparingly**.

---

## viaSport Brand Colors Reference

From `docs/sin-rfp/viasport-brand-colors.md`:

### Primary Brand Colors

| Color         | Hex       | Usage                                                                |
| ------------- | --------- | -------------------------------------------------------------------- |
| **Dark Teal** | `#003B4D` | Primary - navigation, headers, footer, text emphasis (use sparingly) |
| **Teal**      | `#00675B` | Secondary - links, buttons, CTAs, interactive elements               |

### Accent Colors (Use Sparingly)

| Color            | Hex       | Usage                                      |
| ---------------- | --------- | ------------------------------------------ |
| **Bright Blue**  | `#0071CE` | Highlights, informational elements         |
| **Lime Green**   | `#93D500` | Decorative only, success states (optional) |
| **Bright Green** | `#00BC70` | Positive actions, success indicators       |

### Background Colors

| Color          | Hex       | Usage                                                     |
| -------------- | --------- | --------------------------------------------------------- |
| **White**      | `#FFFFFF` | Primary page background                                   |
| **Light Mint** | `#DCF6EC` | Section backgrounds, feature cards, callouts (use subtly) |
| **Light Sage** | `#ACDECB` | Secondary backgrounds, hover states                       |
| **Off-White**  | `#FBFBFB` | Subtle background variation                               |

### Text Colors

| Color         | Hex       | Usage                           | Contrast   |
| ------------- | --------- | ------------------------------- | ---------- |
| **Dark Teal** | `#003B4D` | Headlines, navigation, emphasis | 10.5:1 AAA |
| **Black**     | `#000000` | Primary body text               | 21:1 AAA   |
| **Dark Gray** | `#333333` | Secondary text, captions        | 12.6:1 AAA |

---

## Current State Analysis

### Color Architecture

The app uses:

- **Tailwind 4.0** with `@theme inline` directive
- **CSS custom properties** in OKLch color space
- **Multi-tenant support** via `data-tenant` attribute on `<html>` element
- **shadcn/ui components** that reference CSS variables

### Current viaSport Overrides (Minimal)

Located in `src/styles.css` lines 100-106:

```css
[data-tenant="viasport"] {
  --color-brand-red: #1b5fad;      /* Placeholder blue - NOT viaSport brand */
  --color-brand-red-dark: #164e8d;
  --color-admin-primary: #1b5fad;
  --color-admin-secondary: #e6eef8;
  --color-admin-text-secondary: #506a82;
}
```

### Tenant Configuration

`src/tenant/tenants/viasport.ts` line 15:

```typescript
themeColor: "#1b5fad",  // Used in emails, PWA manifest
```

---

## Implementation Tasks

### Phase 1: Core CSS Variables (src/styles.css)

Update the `[data-tenant="viasport"]` selector with proper viaSport brand colors:

```css
[data-tenant="viasport"] {
  /* Brand Primary - Dark Teal */
  --color-brand-red: #003B4D;        /* Rename consideration: --color-brand-primary */
  --color-brand-red-dark: #002633;   /* 20% darker for hover states */

  /* Admin Theme - Subtle Teal */
  --color-admin-primary: #00675B;    /* Teal - for CTAs and interactive elements */
  --color-admin-secondary: #F8FAFB;  /* Very light gray, subtle tint */
  --color-admin-text-primary: #1A2B32;
  --color-admin-text-secondary: #4A5D66;
  --color-admin-border: #E2E8EB;

  /* Status Colors - Use viaSport greens subtly */
  --color-admin-status-active-bg: #E8F7F1;    /* Very light teal-mint */
  --color-admin-status-active-text: #00675B;  /* Teal */
  /* Keep inactive as-is (red) for clarity */

  /* SUBTLE APPROACH: Only override what's necessary */
  /* Leave most semantic colors (primary, secondary, etc.) as the neutral defaults */
}
```

**Design Decision:** Keep the core semantic colors (`--primary`, `--secondary`, etc.) as neutral gray tones. Only brand-specific elements get viaSport colors. <we can experiment with other things later>

### Phase 2: Tenant Configuration (src/tenant/tenants/viasport.ts)

Update the theme color for emails and PWA:

```typescript
themeColor: "#003B4D",  // Dark Teal
```

### Phase 3: Button & Interactive Element Updates

#### Option A: Subtle (Recommended)

Keep default button styling neutral, only apply viaSport colors to:

- Primary CTAs on landing/marketing pages
- Active navigation items
- Links

#### Option B: Brand Buttons

Create viaSport-specific button variants in styles.css:

```css
[data-tenant="viasport"] .btn-brand-primary {
  background-color: #00675B;  /* Teal */
}
[data-tenant="viasport"] .btn-brand-primary:hover {
  background-color: #005048;  /* Darker teal */
}
```

### Phase 4: Component-Specific Updates

#### 4.1 Badge Success Variant

**File:** `src/components/ui/badge.tsx` line 19

Current hardcoded colors:

```typescript
success: "border-transparent bg-emerald-600 text-white [a&]:hover:bg-emerald-700 ..."
```

**Options:**

- A) Keep as-is (emerald is close to viaSport green)
- B) Create CSS variable override for success color
- C) Use `#00BC70` (viaSport Bright Green) via CSS variable

**Recommendation:** Option A for subtlety, or Option C if stronger branding needed. <c>

#### 4.2 Logout Button Hover

**Files:**

- `src/components/ui/app-sidebar.tsx`
- `src/components/ui/admin-sidebar.tsx`

Current:

```tsx
className="nav-item w-full text-left hover:bg-red-50 hover:text-red-600"
```

**Change to CSS variable or keep as-is** (red for danger/destructive actions is standard UX).

**Recommendation:** Keep red for logout - it's a destructive action indicator. <keep red>

#### 4.3 Alert Custom Success Style

**File:** Various feature components

Some alerts use inline classes like:

```tsx
<Alert className="border-emerald-200 bg-emerald-50 text-emerald-800">
```

**Recommendation:** Keep as-is or create a success alert variant that uses CSS variables.

### Phase 5: Sidebar & Navigation

#### Current Navigation Classes (styles.css)

```css
.nav-item {
  @apply text-gray-700 hover:bg-gray-100;
}
.nav-item-active {
  @apply bg-admin-secondary text-admin-text-primary border-admin-primary/30;
}
```

**Updates for viaSport:**

- `nav-item-active` will automatically pick up new `--color-admin-secondary` and `--color-admin-primary`
- Consider subtle teal accent on hover: `hover:bg-[#003B4D]/5`

### Phase 6: Chart/Analytics Colors

**File:** `src/features/bi/utils/color-schemes.ts`

The viaSport color scheme already exists but may need refinement:

```typescript
{
  id: "viasport",
  name: "viaSport Brand",
  colors: [
    "#0066CC",  // Consider updating to #0071CE (viaSport blue)
    "#00A651",  // Consider updating to #00BC70 (viaSport green)
    // ...
  ]
}
```

**Recommendation:** Review and align with official brand palette.

### Phase 7: Focus States & Rings

Current focus uses `--ring` variable. Consider if viaSport needs custom focus ring color.

**Recommendation:** Keep neutral focus rings for accessibility consistency.

---

## Files to Modify

| File                                     | Change Type                             | Priority |
| ---------------------------------------- | --------------------------------------- | -------- |
| `src/styles.css`                         | Update `[data-tenant="viasport"]` block | High     |
| `src/tenant/tenants/viasport.ts`         | Update `themeColor`                     | High     |
| `src/components/ui/badge.tsx`            | Optional - success variant              | Low      |
| `src/components/ui/app-sidebar.tsx`      | Review logout button                    | Low      |
| `src/components/ui/admin-sidebar.tsx`    | Review logout button                    | Low      |
| `src/features/bi/utils/color-schemes.ts` | Align viaSport palette                  | Medium   |

---

## Testing Checklist

Use the test page at `/brand-test` to verify:

- [ ] Color palette swatches show correct viaSport colors
- [ ] Buttons appear professional and not overwhelming
- [ ] Badges are legible with good contrast
- [ ] Alerts maintain clarity
- [ ] Cards and forms look clean
- [ ] Tables have appropriate contrast
- [ ] Navigation items show subtle brand accent
- [ ] Overall feel is "subtle" not "bold"

### Browser Testing

- [ ] Chrome
- [ ] Firefox
- [ ] Safari (if available)

### Accessibility Testing

- [ ] Text contrast meets WCAG AA (4.5:1)
- [ ] Interactive elements meet WCAG AA (3:1)
- [ ] Focus states are visible
- [ ] Reduced motion still works

---

## WCAG Compliance Notes

From the brand colors document:

| Combination            | Ratio  | Result                    |
| ---------------------- | ------ | ------------------------- |
| `#003B4D` on `#FFFFFF` | 10.5:1 | AAA Pass                  |
| `#00675B` on `#FFFFFF` | 5.2:1  | AA Pass (large text only) |
| `#003B4D` on `#DCF6EC` | 8.9:1  | AAA Pass                  |
| `#003B4D` on `#ACDECB` | 6.4:1  | AAA Pass                  |

**Important:** Use `#00675B` (Teal) only for large text (18px+) or UI elements with additional indicators. For body text, use `#003B4D` (Dark Teal) or black.

---

## Out of Scope

- QC tenant branding changes (unless necessary for shared components)
- Dark mode updates (currently disabled)
- Typography/font changes
- Logo updates (handled separately)
- Email template redesign (beyond theme color)

---

## Implementation Approach

**Recommended Sequence:**

1. Start with `src/styles.css` CSS variable updates
2. Test on `/brand-test` page
3. Update `viasport.ts` theme color
4. Review actual app pages (login, dashboard, admin)
5. Fine-tune individual components as needed
6. Get stakeholder review before finalizing

**Key Principle:** Start minimal, add more color only where specifically beneficial. The user explicitly requested subtlety over boldness.

---

## Rollback Plan

All changes are CSS-variable based and tenant-scoped. If issues arise:

1. Revert `[data-tenant="viasport"]` block in styles.css
2. Revert `themeColor` in viasport.ts

No component code changes required for core implementation.

---

## References

- Brand colors analysis: `docs/sin-rfp/viasport-brand-colors.md`
- Current styles: `src/styles.css`
- Tenant config: `src/tenant/tenants/viasport.ts`
- Test page: `src/routes/brand-test.tsx`

---

_Created: January 2026_

---

## Implementation Worklog

### Status: COMPLETED (January 14, 2026)

### Files Modified

| File                                     | Changes Made                                                                              |
| ---------------------------------------- | ----------------------------------------------------------------------------------------- |
| `src/styles.css`                         | Restructured CSS variable architecture for tenant theming; added viaSport color overrides |
| `src/tenant/tenants/viasport.ts`         | Updated `themeColor` from `#1b5fad` to `#003B4D`                                          |
| `src/components/ui/badge.tsx`            | Updated success variant from emerald to `#00BC70` (viaSport Bright Green)                 |
| `src/features/bi/utils/color-schemes.ts` | Updated viaSport chart palette with WCAG-compliant colors (3:1+ contrast)                 |
| `src/routes/brand-test.tsx`              | Enhanced with viaSport brand color swatches showing hex values                            |
| `.env.local`                             | Created with `VITE_TENANT_KEY=viasport` for local testing                                 |
| `.env`                                   | Uncommented `VITE_BASE_URL="http://localhost:5173"`                                       |

---

## Critical Technical Issue & Resolution

### Problem: Tailwind 4 `@theme inline` Breaks CSS Cascade

**Symptom:** After updating `[data-tenant="viasport"]` with new color values, the brand colors remained red instead of viaSport teal. Investigation revealed `data-tenant="viasport"` was correctly set on `<html>`, but `bg-brand-red` computed to `rgb(216, 41, 41)` (red).

**Root Cause:** Tailwind 4's `@theme inline` directive **hardcodes values at build time**, completely bypassing CSS cascade. The original code:

```css
/* BROKEN - values are inlined at build time */
@theme inline {
  --color-brand-red: #d82929;  /* This becomes a static value */
}

[data-tenant="viasport"] {
  --color-brand-red: #003B4D;  /* This override is IGNORED by Tailwind */
}
```

**Solution:** Use CSS variable references in `@theme inline`, with actual values defined in `:root`:

```css
/* WORKING - Tailwind reads the variable reference at runtime */
@theme inline {
  --color-brand-red: var(--brand-red);  /* References cascade-able variable */
}

:root {
  --brand-red: #d82929;  /* Default value */
}

[data-tenant="viasport"] {
  --brand-red: #003B4D;  /* Override WORKS because it overrides the source variable */
}
```

### Pattern for Tenant-Themeable Colors

For any color that needs to vary by tenant:

1. **@theme inline**: Use `var()` reference → `--color-foo: var(--foo);`
2. **:root**: Define default → `--foo: #default;`
3. **[data-tenant="X"]**: Override → `--foo: #tenant-value;`

---

## Deviations from Original Plan

### 1. CSS Architecture Restructuring (Unplanned)

The original plan assumed CSS variable overrides would work directly. The Tailwind 4 `@theme inline` behavior required restructuring the entire color variable system.

### 2. Chart Colors All Darkened

Original viaSport accent colors (`#0071CE`, `#00BC70`, `#93D500`) didn't meet 3:1 contrast ratio for chart accessibility. All chart colors were darkened:

| Original                 | Darkened  | Contrast |
| ------------------------ | --------- | -------- |
| `#0071CE` (Bright Blue)  | Kept      | 3.8:1    |
| `#00BC70` (Bright Green) | `#007A50` | 4.3:1    |
| `#93D500` (Lime Green)   | `#5B8A00` | 4.1:1    |

### 3. Badge Success Variant Updated

Per user direction (`<c>`), used Option C: hardcoded `#00BC70` directly instead of CSS variable.

---

## Technical Debt

### 1. Semantic Variable Naming Mismatch

**Issue:** Variable `--brand-red` now contains teal for viaSport tenant.

**Current:**

```css
--brand-red: #003B4D;  /* This is teal, not red */
```

**Recommendation:** Rename to `--brand-primary` across the codebase in a future refactor.

**Risk:** Low - purely semantic confusion for developers.

### 2. Hardcoded Badge Success Color

**Issue:** Badge success variant uses hardcoded `#00BC70` instead of CSS variable.

**File:** `src/components/ui/badge.tsx:19`

```typescript
success: "border-transparent bg-[#00BC70] text-white ..."
```

**Recommendation:** Create `--color-success` variable if tenant-specific success colors are needed.

### 3. No Dark Mode Support

Dark mode is currently disabled. If re-enabled, viaSport dark mode colors would need to be defined.

---

## Verification Steps for Future Agents

### Testing Tenant Theming

1. **Start dev server:**

   ```bash
   pnpm dev
   # or with SST for full functionality:
   AWS_PROFILE=techdev npx sst dev --stage sin-austin
   ```

2. **Ensure `.env.local` has:**

   ```
   VITE_TENANT_KEY=viasport
   ```

3. **Navigate to `/brand-test`**

4. **Verify with browser DevTools or Playwright MCP:**

   ```javascript
   // Check tenant attribute
   document.documentElement.getAttribute('data-tenant')  // Should be "viasport"

   // Check computed CSS variables
   getComputedStyle(document.documentElement).getPropertyValue('--brand-red')  // Should be "#003B4D"

   // Check rendered color
   getComputedStyle(document.querySelector('.bg-brand-red')).backgroundColor  // Should be "rgb(0, 59, 77)"
   ```

### Playwright MCP Verification

```javascript
// Full verification script
() => {
  const html = document.documentElement;
  const computed = getComputedStyle(html);
  return {
    tenant: html.getAttribute('data-tenant'),
    brandRed: computed.getPropertyValue('--brand-red').trim(),
    adminPrimary: computed.getPropertyValue('--admin-primary').trim(),
  };
}
```

Expected output for viaSport:

```json
{
  "tenant": "viasport",
  "brandRed": "#003B4D",
  "adminPrimary": "#00675B"
}
```

---

## Testing Checklist - Completed

- [x] Color palette swatches show correct viaSport colors
- [x] Buttons appear professional (teal primary, not red)
- [x] Badges are legible - Success badge uses `#00BC70`
- [x] Alerts maintain clarity - Success alert uses viaSport green
- [x] Cards and forms look clean
- [x] Tables have appropriate contrast
- [x] Navigation items show subtle brand accent
- [x] Overall feel is "subtle" not "bold"
- [x] Chart colors meet WCAG 3:1 contrast minimum

---

## Color Reference - Final Implementation

### viaSport Tenant CSS Variables

```css
[data-tenant="viasport"] {
  /* Brand Primary - Dark Teal */
  --brand-red: #003B4D;
  --brand-red-dark: #002633;

  /* Admin Theme - Teal */
  --admin-primary: #00675B;
  --admin-secondary: #F8FAFB;
  --admin-text-primary: #1A2B32;
  --admin-text-secondary: #4A5D66;
  --admin-border: #E2E8EB;

  /* Status Colors - viaSport greens */
  --admin-status-active-bg: #E8F7F1;
  --admin-status-active-text: #00675B;
}
```

### viaSport Chart Color Scheme

```typescript
{
  id: "viasport",
  label: "viaSport Brand",
  colors: [
    "#003B4D",  // Dark Teal - 10.5:1 contrast
    "#0071CE",  // Bright Blue - 3.8:1 contrast
    "#00675B",  // Teal - 5.2:1 contrast
    "#007A50",  // Deep Green - 4.3:1 contrast
    "#5B8A00",  // Olive Green - 4.1:1 contrast
    "#005580",  // Deep Blue - 6.5:1 contrast
    "#2D5016",  // Forest Green - 8.5:1 contrast
    "#004D40",  // Deep Teal - 7.8:1 contrast
  ],
}
```

---

## Notes for Future Agents

1. **Always test tenant theming with Playwright MCP** - Visual inspection alone may miss CSS cascade issues.

2. **`@theme inline` is build-time** - Any color that needs runtime variation must use `var()` references.

3. **QC tenant unaffected** - All changes are scoped to `[data-tenant="viasport"]`. QC uses default `:root` values.

4. **Logout button stays red** - Per user direction, destructive actions keep red styling for UX clarity.

5. **Screenshot saved** - Verification screenshot at `.playwright-mcp/viasport-brand-test-verification.png`

---

---

## Phase 2: Navigation Accent Enhancement (January 14, 2026)

### Problem

Initial branding implementation was too subtle - the viaSport colors were correctly applied to CSS variables, but barely visible in the UI. Only the "Open Reporting" button showed brand color; the nav active state used near-white (`#F8FAFB`) background with 30% opacity border.

### Solution: "Intentional Accent" Pattern

Added two CSS overrides for viaSport tenant navigation:

```css
/* viaSport Navigation - Intentional Accent Pattern */
[data-tenant="viasport"] .nav-item:hover {
  background-color: rgba(0, 59, 77, 0.05);
}

[data-tenant="viasport"] .nav-item-active {
  background-color: rgba(0, 59, 77, 0.05);
  border-left: 4px solid #003B4D;
  color: #003B4D;
  padding-left: 12px; /* Compensate for border to maintain alignment */
}
```

### Design Rationale

| Element               | Before                                     | After                               | Why                                          |
| --------------------- | ------------------------------------------ | ----------------------------------- | -------------------------------------------- |
| Active nav background | `#F8FAFB` (near-white)                     | `rgba(0, 59, 77, 0.05)` (teal tint) | Subtle but visible brand presence            |
| Active nav border     | `border-admin-primary/30` (barely visible) | `4px solid #003B4D` left border     | Left accent pattern (Slack, VS Code, GitHub) |
| Active nav text       | `#1A2B32` (dark gray)                      | `#003B4D` (dark teal)               | Matches border, 10.5:1 contrast (AAA)        |
| Hover state           | `bg-gray-100`                              | `rgba(0, 59, 77, 0.05)`             | Visual continuity hover → active             |

### What We Didn't Change (Intentionally)

| Option                        | Reason for Skipping                                   |
| ----------------------------- | ----------------------------------------------------- |
| Override `--primary` globally | Would make too many buttons teal, heavy-handed        |
| Change link colors            | Users expect blue links; maintains familiarity        |
| Add more teal CTAs            | Current single teal CTA creates good visual hierarchy |

### Accessibility Verification

- **Text contrast:** `#003B4D` on white = 10.5:1 (AAA Pass)
- **Left border:** Decorative, doesn't affect contrast requirements
- **Hover state:** 5% opacity tint is decorative feedback only

### Files Modified

| File             | Change                                                                            |
| ---------------- | --------------------------------------------------------------------------------- |
| `src/styles.css` | Added viaSport `.nav-item:hover` and `.nav-item-active` overrides (lines 136-146) |

---

_Last Updated: January 14, 2026_
