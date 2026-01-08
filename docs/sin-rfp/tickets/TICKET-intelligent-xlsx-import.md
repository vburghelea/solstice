# TICKET: Intelligent XLSX/CSV Import with Smart Error Handling

**Priority:** High
**Effort:** Large (8-12 dev days)
**Dependencies:** Existing import infrastructure, forms system, templates system
**RFP Requirements:** DM-AGG-001 (Data Collection), DM-AGG-006 (Bulk Import), RP-AGG-004 (Reporting Configuration)

---

## Summary

Enhance the existing import system with intelligent error categorization and in-app
correction capabilities. Users uploading xlsx/csv data will see grouped, actionable
errors with autofix suggestions instead of hundreds of individual type errors.
Templates are dynamically generated from form definitions, and large inline edit
tables are virtualized for performance.

---

## Problem Statement

Current import flow shows raw row-by-row errors:

```
Row 1: Column C invalid type
Row 2: Column C invalid type
Row 3: Column C invalid type
... (100 more identical errors)
```

Users can't easily identify root causes like:

- Columns in wrong order
- Consistent format mismatches (MM/DD/YYYY vs YYYY-MM-DD)
- Missing required columns
- Schema version mismatches

---

## Solution Overview

### 1. Intelligent Error Categorization

Group errors by root cause with actionable suggestions:

```
Structural Issues (2)
├─ Columns "Date" and "Amount" appear swapped
│  Evidence: Values match opposite column patterns
│  [Autofix: Swap columns] [Ignore]
│
└─ Missing required column: "Organization ID"
   Suggestion: Add column or map existing column
   [Map existing column ▼]

Data Quality Issues (15 rows)
├─ Date format mismatch in "Submission Date"
│  Expected: YYYY-MM-DD | Found: MM/DD/YYYY (15 rows)
│  [Autofix: Convert dates] [Ignore]
│
└─ Invalid email format in "Contact Email" (3 rows)
   Rows: 5, 12, 89
   [View & Edit] [Ignore]
```

### 2. In-App Correction

- **Autofix button**: One-click fixes for confirmed pattern matches
- **Inline editing**: Edit specific cell values without re-upload
- **Bulk operations**: Apply fix to all matching rows
- **Re-upload fallback**: For complex issues, user fixes locally and re-uploads

**Final approach for applying fixes (client-side regenerate + update job):**

```
1. Upload original file -> S3
2. Create import job (sourceFileKey = original)
3. Client parses -> runs analyzer -> shows categorized errors
4. User clicks Autofix / edits inline
5. Client applies fix to in-memory rows
6. Client regenerates XLSX/CSV locally
7. Client uploads corrected file to S3
8. updateImportJobSourceFile(jobId, newKey, newHash, newRowCount)
9. Server updates import_jobs.sourceFileKey/sourceFileHash
10. Repeat 3-9 or proceed to import
11. runInteractiveImport reads corrected file from S3
```

This keeps server logic unchanged (still reads S3), preserves auditability (each
version is a new S3 object), and avoids sending large row payloads to the server.

### 3. Dynamic Template Generation

- Generate xlsx/csv templates from any form definition
- Include field descriptions, validation rules, example values
- Support for dropdown/select fields with data validation lists
- CSV templates include description/example rows and explicit markers so the
  importer can skip them safely (see CSV metadata handling below).

---

## User Stories

### US-1: Smart Error Detection

**As a** user importing data
**I want** errors grouped by root cause with clear explanations
**So that** I can quickly understand what's wrong and how to fix it

**Acceptance Criteria:**

- [ ] Errors categorized into: structural, data_quality, completeness, referential
- [ ] Each category shows affected row count
- [ ] Pattern detection identifies common issues (column swaps, format mismatches)
- [ ] Suggestions provided for each error category

### US-2: Autofix for Common Patterns

**As a** user with a detected pattern error
**I want** to click "Autofix" to apply the suggested correction
**So that** I don't have to manually fix 100+ rows

**Acceptance Criteria:**

- [ ] Autofix available for: column swaps, date format conversion, boolean normalization
- [ ] Preview shows what will change before applying
- [ ] Undo available after autofix
- [ ] Audit log records autofix actions

### US-3: Inline Cell Editing

**As a** user with a few invalid cells
**I want** to edit values directly in the preview table
**So that** I don't have to re-upload for minor fixes

**Acceptance Criteria:**

- [ ] Click cell to edit value
- [ ] Real-time validation feedback
- [ ] Changes tracked separately from original upload
- [ ] Clear visual diff of modified cells

### US-4: Dynamic Template Download

**As a** user preparing data for import
**I want** to download a template generated from the form definition
**So that** my columns match exactly what the system expects

**Acceptance Criteria:**

- [ ] Template includes all form fields as columns
- [ ] Column headers match field labels
- [ ] Second row contains field descriptions/help text
- [ ] Select/multiselect fields have data validation dropdowns
- [ ] Date fields formatted with expected format note
- [ ] Example row with sample valid data
- [ ] CSV templates include explicit marker in row 2 cell A to flag metadata rows

### US-5: Template Self-Service

**As an** admin
**I want** to create custom import templates for my organization
**So that** users get templates tailored to our workflow

**Acceptance Criteria:**

- [ ] Admin can generate template from any form
- [ ] Admin can add/remove columns
- [ ] Admin can set default values
- [ ] Templates versioned and tied to form versions

---

## Technical Design

### Architectural Constraint: S3 Source of Truth

**Current behavior** (`imports.mutations.ts:394-398`):

```typescript
const { loadImportFile } = await import("~/lib/imports/file-utils");
const { rows, hash } = await loadImportFile(
  job.sourceFileKey,
  job.type as "csv" | "excel",
);
```

The server **ignores client-provided rows** and re-reads from S3 for
security/integrity. Any client-side edits must be persisted as a new file.

### Solution: Client-Side Regenerate + Update Job

Apply autofixes/inline edits locally, regenerate a corrected file, upload it to
S3, and update the import job to point at the new file.

```typescript
// src/features/imports/imports.mutations.ts
export const updateImportJobSourceFile = createServerFn({ method: "POST" })
  .inputValidator(updateImportJobSourceFileSchema.parse)
  .handler(async ({ data }) => {
    // Updates import_jobs.sourceFileKey/sourceFileHash/sourceRowCount
    // Logs an audit entry with old/new keys
  });
```

**S3 Versioning Strategy**:

- Original file: `imports/{orgId}/{cuid}-original.xlsx`
- After edit: `imports/{orgId}/{cuid}-v2.xlsx` (update `job.sourceFileKey`)

### Data Flow with Edits

```
┌─────────────────────────────────────────────────────────────────────┐
│  1. Upload original file → S3                                       │
│  2. Create import job (sourceFileKey = original)                    │
│  3. Client parses → runs analyzer → shows categorized errors        │
│  4. User clicks Autofix / edits inline                              │
│  5. Client regenerates XLSX/CSV locally                             │
│  6. Client uploads corrected file to S3                             │
│  7. updateImportJobSourceFile(jobId, newKey, newHash)               │
│  8. Server updates import_jobs.sourceFileKey/sourceFileHash         │
│  9. runInteractiveImport reads corrected file from S3               │
└─────────────────────────────────────────────────────────────────────┘
```

### Error Analyzer Module

```typescript
// src/features/imports/error-analyzer.ts

export type ErrorCategory =
  | "structural"     // Missing columns, mapping mismatches, header issues
  | "data_quality"   // Type errors, format errors, invalid values
  | "completeness"   // Missing required fields in rows
  | "referential";   // Foreign key / lookup validation failures

export type AutofixType =
  | "swap_columns"
  | "convert_date_format"
  | "normalize_boolean"
  | "trim_whitespace"
  | "map_column";

export interface CategorizedError {
  id: string;
  category: ErrorCategory;
  severity: "error" | "warning";
  code: string;                    // e.g., "COLUMNS_SWAPPED", "DATE_FORMAT_MISMATCH"
  summary: string;                 // Human-readable summary
  details: string;                 // Detailed explanation
  affectedRows: number[];          // 1-indexed row numbers
  affectedColumns: string[];       // Column headers
  sampleValues: string[];          // Example problematic values
  autofix?: {
    type: AutofixType;
    confidence: number;            // 0-1, show autofix if > 0.8
    preview: string;               // Description of what will change
    params: Record<string, unknown>; // Parameters for autofix function
  };
}

export interface AnalysisResult {
  errors: CategorizedError[];
  warnings: CategorizedError[];
  stats: {
    totalRows: number;
    validRows: number;
    errorRows: number;
    warningRows: number;
  };
  canProceed: boolean;             // No blocking errors
  suggestedAutofixes: string[];    // Error IDs with high-confidence autofixes
}

// Pattern detection functions (value-based, not structural)
export function detectMappingMismatch(
  rows: JsonRecord[],
  mapping: Record<string, string>,
  fieldLookup: ImportFieldLookup
): CategorizedError | null;
// Detects: column mapped to "email" contains date-like values
// Suggests: "Values in 'Date' look like emails - swap mapping with 'Email'?"

export function detectDateFormatMismatch(
  rows: JsonRecord[],
  mapping: Record<string, string>,
  fieldLookup: ImportFieldLookup
): CategorizedError | null;
// Detects: date columns with non-canonical formats (MM/DD/YYYY vs YYYY-MM-DD)
// Suggests: autofix to convert all dates

export function detectMissingRequiredFields(
  rows: JsonRecord[],
  mapping: Record<string, string>,
  schema: FormDefinition
): CategorizedError | null;
// Detects: required fields not mapped or consistently empty

// Referential validation is scoped to explicit lookup fields defined in the
// form metadata (initially limited to org-scoped references).

// Main analyzer
export function analyzeImport(
  headers: string[],
  rows: JsonRecord[],
  schema: FormDefinition,
  rawErrors: ImportParseError[]
): AnalysisResult;
```

### Dynamic Template Generator

```typescript
// src/features/imports/template-generator.ts

export interface TemplateOptions {
  format: "xlsx" | "csv";
  includeDescriptions: boolean;    // Row 2 with field descriptions
  includeExamples: boolean;        // Row 3 with example values
  includeDataValidation: boolean;  // Excel dropdowns for select fields
  organizationId?: string;         // For org-specific templates
  includeMetadataMarkers?: boolean; // CSV markers for skip detection
}

export async function generateTemplate(
  form: Form,
  version: FormVersion,
  options: TemplateOptions
): Promise<Blob>;

// Server function
export const downloadFormTemplate = createServerFn({ method: "GET" })
  .inputValidator(downloadFormTemplateSchema.parse)
  .handler(async ({ data }) => {
    const { formId, format, options } = data;
    // Generate template and return presigned download URL
  });
```

### CSV Metadata Row Handling

CSV templates can include description/example rows, but the importer should only
skip them when it is explicit and safe.

```
// Skip only when BOTH conditions are met:
// 1. Row 2 first cell starts with a known marker
// 2. Template was generated by the system (tracked via metadata marker)
const SKIP_MARKERS = ["# description", "__meta__", "# example"];
```

User-facing note: CSV templates must include the marker in the first cell of row 2
to be recognized as a description/example row. Otherwise, row 2+ is treated as data.

### Enhanced Import Wizard Component

```typescript
// src/features/imports/components/smart-import-wizard.tsx

interface SmartImportWizardProps {
  formId: string;
  organizationId: string;
  context?: "reporting" | "general";
  reportingCycleId?: string;
  onComplete?: (result: ImportResult) => void;
}

// Steps:
// 1. Template download (optional)
// 2. File upload
// 3. Column mapping (with auto-map)
// 4. Intelligent error analysis
// 5. Autofix / manual correction
// 6. Preview & confirm (virtualized table for large row counts)
// 7. Import execution
// 8. Results summary
```

### Error Display Component

```typescript
// src/features/imports/components/categorized-errors.tsx

interface CategorizedErrorsProps {
  analysis: AnalysisResult;
  rows: JsonRecord[];
  onAutofix: (errorId: string) => Promise<void>;
  onEditCell: (row: number, column: string, value: string) => void;
  onIgnoreError: (errorId: string) => void;
}
```

---

## File Changes

### New Files (10)

| File                                                           | Purpose                                    |
| -------------------------------------------------------------- | ------------------------------------------ |
| `src/features/imports/error-analyzer.ts`                       | Pattern detection and error categorization |
| `src/features/imports/autofix-engine.ts`                       | Client-side autofix implementations        |
| `src/features/imports/template-generator.ts`                   | Dynamic xlsx/csv template generation       |
| `src/features/imports/import-wizard.schemas.ts`                | Zod schemas for enhanced wizard            |
| `src/features/imports/components/smart-import-wizard.tsx`      | New wizard UI                              |
| `src/features/imports/components/categorized-errors.tsx`       | Error display with autofix                 |
| `src/features/imports/components/inline-cell-editor.tsx`       | Cell editing UI                            |
| `src/features/imports/components/virtualized-import-table.tsx` | Virtualized table for large previews       |
| `src/features/imports/__tests__/error-analyzer.test.ts`        | Unit tests for analyzer                    |
| `src/features/imports/__tests__/autofix-engine.test.ts`        | Unit tests for autofix engine              |

### Modified Files (5)

| File                                         | Changes                                            |
| -------------------------------------------- | -------------------------------------------------- |
| `src/features/imports/imports.mutations.ts`  | Add updateImportJobSourceFile mutation             |
| `src/features/imports/imports.queries.ts`    | Add analysis queries                               |
| `src/db/schema/imports.schema.ts`            | Add import_templates table (new file or migration) |
| `src/routes/dashboard/admin/sin/imports.tsx` | Use new SmartImportWizard                          |
| `src/tenant/tenants/viasport.ts`             | Add feature flag if needed                         |

---

## Database Changes

### Required: Admin-Managed Import Templates

```sql
CREATE TABLE import_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  form_id UUID NOT NULL,
  form_version_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  columns JSONB NOT NULL,
  defaults JSONB,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Recommended: Mapping Template Version Tracking

```sql
-- Track which form version a mapping template was created for
ALTER TABLE import_mapping_templates
  ADD COLUMN target_form_version_id UUID REFERENCES form_versions(id);

-- When loading a mapping template, compare target_form_version_id with current latest version
-- If different, show warning: "This mapping was created for form v2, current is v3"
```

### Optional: Detailed Cell Edit Tracking (can defer)

```sql
-- For detailed audit of individual cell changes
CREATE TABLE import_job_cell_edits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES import_jobs(id) ON DELETE CASCADE,
  row_number INTEGER NOT NULL,
  column_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_import_job_cell_edits_job ON import_job_cell_edits(job_id);
```

---

## UI/UX Specifications

### Error Category Colors

- **Structural (red)**: Missing columns or mapping mismatches; blocking until fixed
- **Data Quality (orange)**: Format/type issues, fixable with autofix
- **Completeness (yellow)**: Missing required fields in some rows
- **Referential (red)**: Invalid lookup references; blocking until fixed

### Autofix Confidence Levels

- **High (≥0.9)**: Show prominent "Autofix" button
- **Medium (0.7-0.9)**: Show "Suggested fix" with preview
- **Low (<0.7)**: Show as suggestion only, no autofix button

### Inline Editor

- Click cell → input field appears
- Green border = valid, red border = invalid
- Escape to cancel, Enter to save
- Modified cells highlighted in light blue
- Use TanStack Virtual (`@tanstack/react-virtual`) for large previews (>500 rows)

---

## Testing Strategy

### Unit Tests

- [ ] Error analyzer pattern detection
- [ ] Column swap detection with various patterns
- [ ] Date format detection (10+ format combinations)
- [ ] Autofix transformations
- [ ] Template generation for all field types
- [ ] CSV metadata row detection (skip markers)
- [ ] Virtualized table rendering (large file)

### Integration Tests

- [ ] Full import flow with autofix
- [ ] Template download and re-upload
- [ ] Large file handling (10k+ rows)
- [ ] Edge cases: empty files, single row, all errors

### E2E Tests

- [ ] Upload file → see categorized errors → autofix → import
- [ ] Download template → fill → upload → success
- [ ] Inline edit → import with modifications
- [ ] Error re-upload flow

---

## Rollout Plan

### Phase 1: Error Analyzer (3-4 days)

- Implement `error-analyzer.ts` with pattern detection
- Add `categorized-errors.tsx` component
- Integrate into existing import wizard
- Unit tests for analyzer

### Phase 2: Client Autofix + Update Job (2-3 days)

- Implement `autofix-engine.ts`
- Client-side column swap, date format conversion, boolean normalization
- Regenerate corrected file and upload to S3
- `updateImportJobSourceFile` mutation with audit logging
- Unit tests for autofix engine

### Phase 3: Inline Cell Editing (2-3 days)

- Implement `inline-cell-editor.tsx` UI
- Track cell edits in client state
- Regenerate corrected file after edits
- Virtualized table for large previews
- Visual diff for modified cells
- Validation during editing

### Phase 4: Template Generator (1-2 days)

- Implement `template-generator.ts`
- Add template download to wizard
- Excel data validation for dropdowns
- Include descriptions/examples

---

## Success Metrics

| Metric                      | Target                            |
| --------------------------- | --------------------------------- |
| Time to fix import errors   | 50% reduction                     |
| Re-upload rate              | 30% reduction (more in-app fixes) |
| User-reported import issues | 50% reduction                     |
| Autofix acceptance rate     | >70% when offered                 |

---

## Implementation Updates (2026-01-08)

### Completed

- Client-side analyzer and autofix engine:
  - `src/features/imports/error-analyzer.ts`
  - `src/features/imports/autofix-engine.ts`
- Smart import wizard UI with categorized errors, inline editing, and virtualized
  preview table:
  - `src/features/imports/components/smart-import-wizard.tsx`
  - `src/features/imports/components/categorized-errors.tsx`
  - `src/features/imports/components/inline-cell-editor.tsx`
  - `src/features/imports/components/virtualized-import-table.tsx`
- CSV/XLSX template generation with explicit metadata markers, and CSV metadata
  row skip logic in parsing:
  - `src/features/imports/template-generator.ts`
  - `src/features/imports/imports.utils.ts`
- Server mutations and queries:
  - `updateImportJobSourceFile` mutation
  - `downloadFormTemplate` mutation
  - import template CRUD + list queries
  - mapping template version tracking
  - `src/features/imports/imports.mutations.ts`
  - `src/features/imports/imports.queries.ts`
  - `src/features/imports/imports.schemas.ts`
- Route switch to smart wizard:
  - `src/routes/dashboard/admin/sin/imports.tsx`
- DB schema + migration:
  - `import_templates` table
  - `target_form_version_id` on `import_mapping_templates`
  - `src/db/schema/imports.schema.ts`
  - `src/db/migrations/0005_import_templates.sql`
- Tests:
  - metadata row parsing
  - autofix engine basics
  - analyzer baseline
  - `src/features/imports/__tests__/imports.utils.test.ts`
  - `src/features/imports/__tests__/autofix-engine.test.ts`
  - `src/features/imports/__tests__/error-analyzer.test.ts`

### Follow-up Fixes (2026-01-08)

- Block import execution when there are pending edits; prompt users to save edits
  before importing:
  - `src/features/imports/components/smart-import-wizard.tsx`
- Removed `meta` header exclusion from auto-mapping:
  - `src/features/imports/components/smart-import-wizard.tsx`
- CSV metadata row skipping now applies to CSV only (prevents Excel false positives):
  - `src/features/imports/imports.utils.ts`
- Added `phone` mapping support for analyzer pattern matching:
  - `src/features/imports/error-analyzer.ts`
- Fixed currency detector to treat `CAD` as a token (not a char set):
  - `src/features/imports/pattern-detectors.ts`
- Template downloads now respect admin-managed template columns/defaults via
  `downloadImportTemplate`, and version warnings compare to the latest form version:
  - `src/features/imports/imports.mutations.ts`
  - `src/features/imports/imports.schemas.ts`
  - `src/features/imports/template-generator.ts`
  - `src/features/imports/components/import-templates-panel.tsx`

### In Progress / Open

- Referential checks beyond `organizationId` (needs form metadata contract)

---

## Admin UX Enhancements (2026-01-08)

This section documents the Import Admin UX Enhancement work completed to improve the
admin experience, error confidence calculation, and overall polish.

### Summary

Enhanced the import admin experience with:

1. Centralized pattern detection with 13 pattern types
2. Dynamic confidence calculation replacing hardcoded values
3. Tabbed admin layout with dedicated template and history management
4. Visual progress stepper for import workflow
5. Confidence badges with explanatory tooltips

### New Files Created

| File                                                         | Purpose                                               |
| ------------------------------------------------------------ | ----------------------------------------------------- |
| `src/features/imports/pattern-detectors.ts`                  | Centralized pattern detection module with 13 patterns |
| `src/features/imports/components/import-templates-panel.tsx` | Template CRUD UI with search, download, delete        |
| `src/features/imports/components/import-jobs-panel.tsx`      | Job history with filtering, status badges, rollback   |
| `src/features/imports/__tests__/pattern-detectors.test.ts`   | 54 unit tests for pattern detection                   |

### Modified Files

| File                                                      | Changes                                                                |
| --------------------------------------------------------- | ---------------------------------------------------------------------- |
| `src/features/imports/error-analyzer.ts`                  | Use centralized patterns, dynamic confidence, `confidenceReason` field |
| `src/routes/dashboard/admin/sin/imports.tsx`              | 3-tab layout (Import, Templates, History), URL query param persistence |
| `src/features/imports/components/categorized-errors.tsx`  | Confidence badges, tooltips explaining reasoning                       |
| `src/features/imports/components/smart-import-wizard.tsx` | Progress stepper showing Upload→Map→Review→Import flow                 |

### Pattern Detectors Module

New centralized module (`pattern-detectors.ts`) with 13 pattern types:

```typescript
export const patterns = {
  email: isEmail,           // RFC-compliant email check
  isoDate: isIsoDate,       // YYYY-MM-DD
  usDate: isUsDate,         // M/D/YYYY or MM/DD/YYYY
  euDate: isEuDate,         // D.M.YYYY or DD.MM.YYYY
  dateLike: isDateLike,     // Any common date format
  number: isNumber,         // Integers/decimals with optional thousands separators
  boolean: isBoolean,       // true/false/yes/no/y/n/1/0/on/off/enabled/disabled
  phone: isPhone,           // Various formats, 7-15 digits
  currency: isCurrency,     // $, €, £, ¥, ₹ with proper formatting
  percentage: isPercentage, // 75% or 0.75 decimal form
  url: isUrl,               // http/https links
  postalCode: isPostalCode, // US (12345, 12345-6789) and Canada (A1A 1A1)
  uuid: isUuid,             // Standard UUID format
} as const;
```

**Helper functions:**

- `analyzePatterns(values)` - Returns match ratios for all pattern types
- `detectBestPattern(values, threshold)` - Finds highest matching pattern above threshold
- `getHeaderHint(header)` - Extracts type hints from column headers (e.g., "Email" → email)
- `calculateConfidence(params)` - Dynamic confidence based on multiple factors

### Dynamic Confidence Calculation

Replaced hardcoded confidence values (0.85, 0.9) with a dynamic calculation:

```typescript
export function calculateConfidence(params: {
  patternMatchRatio: number;    // 0-1: % of values matching expected pattern
  headerHintMatch: boolean;     // Column name contains type keyword
  conflictingPatterns: number;  // How many other patterns also match well
  sampleSize: number;           // Number of non-empty values tested
}): number {
  // Base confidence from pattern match ratio (60% weight)
  let confidence = params.patternMatchRatio * 0.6;

  // Bonus for header hint matching (up to +20%)
  if (params.headerHintMatch) confidence += 0.2;

  // Penalty for conflicting patterns (multiple patterns match well)
  if (params.conflictingPatterns > 1) confidence -= 0.15;

  // Sample size adjustment
  if (params.sampleSize < 5) confidence -= 0.1;
  else if (params.sampleSize >= 20) confidence += 0.05;

  return Math.max(0, Math.min(1, confidence));
}
```

**Rationale:**

- Pattern match ratio is the primary signal (60% weight)
- Header hints add confidence when column name matches expected type
- Ambiguous patterns (multiple types match) reduce confidence
- Small samples are less reliable; large samples boost confidence
- Result always clamped to 0-1 range

### Confidence Badges

Added visual confidence indicators to autofix buttons:

- **≥90% (green)**: High confidence with sparkle icon
- **70-90% (secondary)**: Medium confidence, standard button
- **<70% (outline)**: Low confidence, outline button only

Each badge includes a tooltip explaining the reasoning:

```
"85% pattern match, column name matches type, large sample size"
```

### Progress Stepper

Added visual progress indicator to the import wizard showing 4 phases:

1. **Upload** - Select organization, form, and file
2. **Map** - Map columns to form fields
3. **Review** - Review errors and apply autofixes
4. **Import** - Execute the import

Step completion is calculated dynamically:

- Upload complete: org + form + file parsed
- Map complete: mappings defined + import job created
- Review complete: analysis shows no blocking errors
- Import complete: job status is "completed"

### Tabbed Admin Layout

Restructured `/dashboard/admin/sin/imports` with 3 tabs:

**Tab 1: Import Wizard**

- Original SmartImportWizard with progress stepper
- Main workflow for running imports

**Tab 2: Templates**

- Card-based list with search/filter
- Download templates (XLSX/CSV format selector)
- Delete with confirmation dialog
- Version warning badges when form schema has changed

**Tab 3: Import History**

- Table with columns: Status, Type, Rows, Created, Duration, Actions
- Color-coded status badges with icons
- Expandable error details (collapsible inline)
- Rollback button (available within 24 hours of completion)
- Filter by status dropdown

Tab state persisted in URL: `?tab=wizard|templates|history`

### Test Coverage

Created comprehensive test suite with 54 tests covering:

- All 13 pattern detectors (positive and negative cases)
- Pattern analysis functions
- Header hint detection
- Confidence calculation with all factor combinations
- Edge cases (empty arrays, whitespace, case sensitivity)

All 61 import-related tests pass:

```
✓ src/features/imports/__tests__/pattern-detectors.test.ts (54 tests)
✓ src/features/imports/__tests__/error-analyzer.test.ts (1 test)
✓ src/features/imports/__tests__/imports.utils.test.ts (4 tests)
✓ src/features/imports/__tests__/autofix-engine.test.ts (2 tests)
```

### Why These Changes

1. **Pattern detectors module**: Centralizes pattern matching logic that was duplicated
   across error-analyzer. New patterns (phone, currency, percentage, URL, postal code,
   UUID) enable detection of more column type mismatches.

2. **Dynamic confidence**: Hardcoded confidence (0.85, 0.9) didn't account for actual
   data quality signals. Dynamic calculation uses pattern match ratio, header hints,
   conflicting patterns, and sample size to produce more accurate confidence scores.

3. **Tabbed layout**: Original single-page wizard buried template management and had
   no dedicated job history view. Tabs provide clear separation of concerns and make
   template management discoverable.

4. **Progress stepper**: Users had no visual indication of where they were in the
   multi-step import flow. Stepper provides orientation and shows completion status.

5. **Confidence badges**: Users couldn't see why an autofix was suggested. Badges
   with tooltips provide transparency into the system's reasoning.

---

## Suggested Next Steps

1. Run tests:
   - `pnpm test src/features/imports/__tests__/imports.utils.test.ts src/features/imports/__tests__/autofix-engine.test.ts src/features/imports/__tests__/error-analyzer.test.ts`
2. Run typecheck:
   - `pnpm check-types`
3. Apply migration in dev/perf:
   - `pnpm db:migrate`
4. Add admin UI for import templates (create/edit columns + defaults)
5. Define form-level metadata for referential validation and wire into analyzer

## Open Questions (Resolved)

1. ~~PSO-only or general?~~ → **General feature for all import scenarios**
2. ~~Static or dynamic templates?~~ → **Dynamic generation from form definitions**
3. ~~Error correction workflow?~~ → **In-app with autofix, fallback to re-upload**
4. ~~Rollback granularity?~~ → **Entire upload (existing pattern)**
5. ~~Reporting cycle context?~~ → **Optional, pass via context prop**

## Review Findings (Resolved)

### F1: Inline edit/autofix can't reach server

**Resolved**: Client regenerates a corrected file, uploads to S3, then calls
`updateImportJobSourceFile`. Server continues to read S3.

### F2: Column swap is value-pattern based, not structural

**Resolved**: Treated as a structural/mapping mismatch category driven by
value-pattern detection (email vs date, etc.).

### F3: CSV template description rows conflict with parsing

**Resolved**: CSV supports description/example rows only when an explicit marker
is present (row 2 first cell) and the template is system-generated.

### F4: Referential checks don't exist

**Resolved**: Implement referential checks only for explicitly configured lookup
fields in form metadata (initial scope: org-scoped references).

### F5: Template storage/versioning unclear

**Resolved**:

- **Generated templates**: Ephemeral downloads, regenerated from current form definition.
- **Admin templates**: Stored in new `import_templates` table tied to form version.
- **Mapping templates**: Recommended `target_form_version_id` on
  `import_mapping_templates` to warn on drift.

### F6: Route/flag split

**Confirmed intentional**: `sin_imports` = view access, `sin_admin_imports` = write access.

## Review Q&A

| Question                  | Answer                                                                 |
| ------------------------- | ---------------------------------------------------------------------- |
| Template storage          | Ephemeral for generated; `import_templates` table for admin-managed    |
| CSV description rows      | Allowed with explicit markers in row 2 + system-generated flag         |
| Select field values       | Use option values; templates surface labels in descriptions            |
| Canonical date format     | `YYYY-MM-DD` (ISO 8601); analyzer detects others and offers conversion |
| Referential checks        | Only for explicit lookup fields defined in form metadata               |
| Max file size for editing | Virtualized table; warn over 10k rows                                  |
| Audit granularity         | Summary per autofix; per-cell audit optional                           |
| Replace or new route      | Replace in-place at `/dashboard/admin/sin/imports` with feature flag   |

---

## References

- Existing import infrastructure: `src/features/imports/`
- Import wizard shell: `src/features/imports/components/import-wizard-shell.tsx`
- File parsing utilities: `src/features/imports/imports.utils.ts`
- Template system: `src/features/templates/`
- Form validation: `src/features/forms/forms.utils.ts`
