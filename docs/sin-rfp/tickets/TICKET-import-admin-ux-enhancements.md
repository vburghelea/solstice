# TICKET: Import Admin UX Enhancements

**Priority:** Medium
**Effort:** Medium (6-8 hours)
**Dependencies:** TICKET-intelligent-xlsx-import (completed)
**Related:** Import templates, error analyzer, pattern detection

---

## Summary

Enhance the import admin experience with:

1. Tabbed admin layout with dedicated template management
2. Improved error confidence calculation with new pattern detectors
3. Foundation for referential validation
4. Polish overall UX/design

---

## Problem Statement

Current import admin page is a single monolithic wizard (1,048 lines) with:

- Template management buried inline (no dedicated UI)
- Import history minimal (basic list, no filtering)
- Hardcoded error confidence (0.85, 0.9)
- Limited pattern detectors (only email, dates, numbers, booleans)
- No visual confidence indicators for users

---

## Solution Overview

### 1. Tabbed Admin Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Import Administration                                          │
├──────────────────┬─────────────────┬────────────────────────────┤
│ [Import Wizard]  │ [Templates]     │ [Import History]           │
└──────────────────┴─────────────────┴────────────────────────────┘
```

**Tab 1: Import Wizard** - Streamlined wizard with progress indicator
**Tab 2: Templates** - Full CRUD for mapping templates with versioning warnings
**Tab 3: Import History** - Searchable/filterable job list with status badges

### 2. Enhanced Pattern Detection

New patterns to detect:

- Phone numbers (US/international formats)
- Currency ($, €, £ with proper formatting)
- Percentages (75%, 0.75)
- URLs (http/https links)
- Postal codes (US/Canada)

### 3. Dynamic Confidence Calculation

Calculate confidence based on:

- Pattern match ratio (0-100%)
- Header hint bonus (column name contains type)
- Sample size adequacy
- Conflicting patterns penalty

### 4. UX Polish

- Confidence badges on autofix buttons
- Progress stepper for wizard steps
- Empty states with helpful guidance
- Tooltips explaining confidence reasoning

---

## Technical Design

### Pattern Detectors Module

```typescript
// src/features/imports/pattern-detectors.ts

export const patterns = {
  email: (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),

  phone: (v: string) =>
    /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/.test(v) &&
    v.replace(/\D/g, "").length >= 7,

  currency: (v: string) =>
    /^[$€£¥₹]?\s*-?\d{1,3}(,\d{3})*(\.\d{1,2})?$/.test(v.trim()),

  percentage: (v: string) =>
    /^-?\d+(\.\d+)?%?$/.test(v.trim()),

  url: (v: string) =>
    /^https?:\/\/.+\..+/.test(v.toLowerCase()),

  postalCode: (v: string) => {
    const cleaned = v.trim().toUpperCase();
    return /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/.test(cleaned) || // Canada
           /^\d{5}(-\d{4})?$/.test(cleaned);             // US
  },

  isoDate: (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v),
  usDate: (v: string) => /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(v),
  number: (v: string) => /^-?\d+(\.\d+)?$/.test(v.trim()),
  boolean: (v: string) =>
    ["true","false","yes","no","y","n","1","0"].includes(v.toLowerCase()),
};
```

### Dynamic Confidence Calculation

```typescript
// In error-analyzer.ts

interface ConfidenceParams {
  patternMatchRatio: number;    // % of values matching expected pattern
  headerHintMatch: boolean;     // Column name contains type keyword
  conflictingPatterns: number;  // Other patterns that also match well
  sampleSize: number;           // Number of non-empty values tested
}

const calculateConfidence = (params: ConfidenceParams): number => {
  let confidence = params.patternMatchRatio * 0.6;

  // Bonus for header matching (e.g., column "Email" for email field)
  if (params.headerHintMatch) confidence += 0.2;

  // Penalty for ambiguous patterns
  if (params.conflictingPatterns > 1) confidence -= 0.15;

  // Penalty for small sample size
  if (params.sampleSize < 5) confidence -= 0.1;

  return Math.max(0, Math.min(1, confidence));
};
```

### Referential Validation Schema

```typescript
// In forms.schemas.ts

export const importValidationSchema = z.object({
  type: z.enum(["lookup", "unique_in_import"]),
  lookupTable: z.enum(["organizations", "users", "teams"]).optional(),
  lookupColumn: z.string().optional(),
  errorMessage: z.string().optional(),
}).optional();

// Add to formFieldSchema
importValidation: importValidationSchema,
```

### Batch Reference Validator

```typescript
// src/features/imports/reference-validator.ts

export async function validateReferences(params: {
  values: string[];
  table: "users" | "organizations" | "teams";
  column: string;
  organizationId?: string;
}): Promise<Set<string>> {
  // Single query to validate all values
  const results = await db.select({ value: schema[params.column] })
    .from(tables[params.table])
    .where(inArray(schema[params.column], params.values));
  return new Set(results.map(r => r.value));
}
```

---

## File Changes

### New Files (5)

| File                                                         | Purpose                                 |
| ------------------------------------------------------------ | --------------------------------------- |
| `src/features/imports/components/import-templates-panel.tsx` | Template CRUD UI with search/filter     |
| `src/features/imports/components/import-jobs-panel.tsx`      | Job history with status filtering       |
| `src/features/imports/pattern-detectors.ts`                  | Centralized pattern detection functions |
| `src/features/imports/reference-validator.ts`                | Batch lookup validation service         |
| `src/features/imports/__tests__/pattern-detectors.test.ts`   | Pattern detection tests                 |

### Modified Files (5)

| File                                                      | Changes                             |
| --------------------------------------------------------- | ----------------------------------- |
| `src/routes/dashboard/admin/sin/imports.tsx`              | Add tabbed layout                   |
| `src/features/imports/error-analyzer.ts`                  | Dynamic confidence, new patterns    |
| `src/features/imports/components/categorized-errors.tsx`  | Confidence badges, tooltips         |
| `src/features/imports/components/smart-import-wizard.tsx` | Progress stepper, cleaner flow      |
| `src/features/forms/forms.schemas.ts`                     | Add `importValidation` field schema |

---

## UI/UX Specifications

### Tab Navigation

- Use shadcn `Tabs` component
- Persist active tab in URL query param
- Show count badges (e.g., "Templates (5)")

### Confidence Display

```tsx
// Show confidence badge next to autofix button
{error.autofix && (
  <div className="flex items-center gap-2">
    <Badge variant={confidence >= 0.9 ? "default" : "secondary"}>
      {Math.round(confidence * 100)}%
    </Badge>
    <Button size="sm" onClick={() => onAutofix(error)}>
      Autofix
    </Button>
  </div>
)}
```

### Progress Stepper

```tsx
// Visual progress through wizard steps
<div className="flex gap-1 mb-6">
  {["Upload", "Map", "Review", "Import"].map((step, i) => (
    <div key={step} className={cn(
      "flex-1 h-1.5 rounded-full transition-colors",
      i <= currentStep ? "bg-primary" : "bg-muted"
    )}>
      <span className="sr-only">{step}</span>
    </div>
  ))}
</div>
```

### Template Management Panel

- Card-based list with search input
- Each template shows: name, form name, created date, version warning
- Actions: Edit (dialog), Archive, Delete
- "Create Template" button opens dialog with form selection

### Import History Panel

- Table with columns: Status, Type, Rows, Created, Duration, Actions
- Status badges: pending (yellow), completed (green), failed (red)
- Filter by status dropdown
- "View Errors" expands inline or opens dialog
- "Rollback" button (if within window)

---

## Implementation Phases

### Phase 1: Admin Layout (2-3 hours)

- [ ] Create tabbed layout in imports.tsx
- [ ] Extract template panel component
- [ ] Extract job history panel component
- [ ] Add URL query param for active tab

### Phase 2: Pattern Detection (1-2 hours)

- [ ] Create pattern-detectors.ts with all patterns
- [ ] Implement calculateConfidence function
- [ ] Update error-analyzer to use new system
- [ ] Add pattern detector tests

### Phase 3: Referential Validation Foundation (1-2 hours)

- [ ] Add importValidation to form field schema
- [ ] Create reference-validator.ts
- [ ] Wire into error-analyzer (opt-in per field)
- [ ] Document usage for form builders

### Phase 4: UX Polish (1-2 hours)

- [ ] Add confidence badges to categorized-errors
- [ ] Add progress stepper to wizard
- [ ] Add empty states with guidance
- [ ] Add tooltips for confidence explanation

---

## Testing Strategy

### Unit Tests

- [ ] Pattern detector accuracy (positive/negative cases)
- [ ] Confidence calculation with various inputs
- [ ] Reference validator batch queries

### Integration Tests

- [ ] Tab navigation persists state
- [ ] Template CRUD operations
- [ ] Import job filtering

### Manual Testing

- [ ] Upload file with phone numbers, currency, percentages
- [ ] Verify confidence badges appear correctly
- [ ] Test template creation/editing flow
- [ ] Test import history filtering

---

## Verification

```bash
# Run tests
pnpm test src/features/imports/__tests__/pattern-detectors.test.ts

# Type check
pnpm check-types

# Visual verification
# 1. Navigate to /dashboard/admin/sin/imports
# 2. Test all 3 tabs render correctly
# 3. Upload test CSV with various data types
# 4. Verify confidence badges show on autofix buttons
# 5. Create/edit/delete a mapping template
# 6. Filter import history by status
```

---

## Success Metrics

| Metric                     | Target                                            |
| -------------------------- | ------------------------------------------------- |
| Pattern detection coverage | +5 new patterns (phone, currency, %, URL, postal) |
| Confidence accuracy        | Dynamic calculation vs hardcoded                  |
| Admin UX                   | 3 dedicated tabs vs 1 monolithic page             |
| Template management        | Full CRUD with version warnings                   |

---

## Future Enhancements (Out of Scope)

- ML-based pattern detection
- Template versioning history
- Scheduled/recurring imports
- Import templates marketplace
- Cross-field validation rules
