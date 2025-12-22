# Bundle 2: Data Collection, Forms & Validation

> **Your Task:** Implement or enhance the 6 requirements below for the viaSport Strength in Numbers (SIN) system.

---

## Requirements You Must Address

### DM-AGG-001: Data Collection & Submission

**Description:** The system shall enable customizable form building, support flexible data entry through variable formats (forms, file uploads), with capabilities for real-time submission tracking, editing, and historical data migration.

**Acceptance Criteria:** Users and System Admin can successfully submit, track, and edit data.

**Current Status:** 40% complete

- Form components exist (ValidatedInput, ValidatedSelect, ValidatedFileUpload, etc.)
- Zod schema validation
- No dynamic/customizable form builder

**Gaps to Implement:**

- [ ] Admin UI to create custom forms (drag-and-drop field builder)
- [ ] Form template system (save/load form configurations)
- [ ] Real-time submission tracking dashboard
- [ ] Submission editing with version history
- [ ] File upload with multiple format support

---

### DM-AGG-002: Data Processing & Integration

**Description:** The system shall enable standardization of data formatting, logging of transformation processes, and integration with external platforms through API (optional), and data import/export mechanisms.

**Acceptance Criteria:** Incoming data is processed uniformly, logged for traceability, and exchanged with external platforms.

**Current Status:** 30% complete

- Zod schemas standardize data formats
- CSV export utility exists
- No bulk import or API integration

**Gaps to Implement:**

- [ ] Data transformation logging (track what changed during processing)
- [ ] Bulk data import from CSV/Excel
- [ ] Field mapping UI for imports
- [ ] Export to multiple formats (CSV, Excel, JSON)
- [ ] Optional: REST API for external platform integration

---

### DM-AGG-004: Data Quality & Integrity

**Description:** The system shall ensure relational integrity and continuously monitor data quality using validation rules and automated checks.

**Acceptance Criteria:** Submitted data meets validation rules.

**Current Status:** 75% complete

- Drizzle ORM enforces relational integrity
- Zod schemas validate all inputs
- Foreign key constraints in database

**Gaps to Implement:**

- [ ] Data quality dashboard (show validation errors, missing fields)
- [ ] Automated data quality checks (scheduled jobs)
- [ ] Custom validation rules per form/field
- [ ] Data completeness scoring

---

### DM-AGG-005: Data Storage & Retention

**Description:** The system shall support regular backups, disaster recovery mechanisms, data archiving, and secure cloud hosting aligned with retention policies.

**Acceptance Criteria:** Data is backed up, archived as scheduled, and securely hosted in the cloud.

**Current Status:** 80% complete

- Neon PostgreSQL with managed backups
- Netlify cloud hosting
- Connection pooling for reliability

**Gaps to Implement:**

- [ ] Data retention policy configuration (per data type)
- [ ] Automated archiving of old data
- [ ] Archive retrieval workflow
- [ ] Backup verification/testing procedures

---

### DM-AGG-006: Legacy Data Migration & Bulk Import

**Description:** The system shall provide tooling and configurable mapping templates to import historical data from CSV/Excel, legacy databases, or APIs, including validation, error-handling, and rollback.

**Acceptance Criteria:** Administrators can map legacy fields to system fields, preview results, and execute import; import logs stored for audit.

**Current Status:** 0% complete

- No migration tooling exists

**Gaps to Implement:**

- [ ] CSV/Excel file upload for bulk import
- [ ] Field mapping UI (source field → target field)
- [ ] Data preview before import execution
- [ ] Validation with error reporting per row
- [ ] Import rollback capability
- [ ] Import audit logs (who, when, what, success/failure)
- [ ] Configurable mapping templates (save/reuse mappings)

---

### RP-AGG-001: Data Validation & Submission Rules

**Description:** The system shall validate submissions to ensure they are complete, clean, use the correct file types, and contain valid data fields such as dates and contact information.

**Acceptance Criteria:** Submissions that fail validation are rejected with appropriate error messages.

**Current Status:** 80% complete

- Zod schemas validate all server function inputs
- Form-level validation with error messages
- File type validation in ValidatedFileUpload

**Gaps to Implement:**

- [ ] Configurable validation rules per submission type
- [ ] Enhanced date/contact validation helpers
- [ ] Validation rule builder for admins
- [ ] Submission completeness checker

---

## Context: viaSport SIN Project

viaSport BC is replacing legacy systems (BC Activity Reporter and BC Sport Information System) with a modern platform for B.C. amateur sport data management.

**Key Context:**

- Historical data: 20+ million rows to migrate
- Growth: ~1M rows per year
- Object storage: Hundreds of documents per year
- File formats: CSV, Excel from legacy systems

## Existing Patterns to Follow

The codebase uses these patterns for data handling:

```typescript
// Schema pattern (see events.schemas.ts, teams.schemas.ts)
export const mySchema = z.object({
  field: z.string().min(1),
  // ...
});

// Server function pattern (see events.mutations.ts)
export const myServerFn = createServerFn({ method: "POST" })
  .inputValidator(mySchema.parse)
  .handler(async ({ data }) => {
    // Implementation
  });

// Form component pattern (see ValidatedInput.tsx)
<ValidatedInput form={form} name="fieldName" label="Field Label" />
```
