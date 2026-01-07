# Service Approach: Data Migration

## Migration Methodology

### Approach

Migration follows a phased approach that reduces risk and validates data at each stage. BCAR and BCSI remain the source of truth until viaSport signs off on migrated data.

### Migration Phases

| Phase                      | Duration  | Activities                                                          | Exit Criteria              |
| -------------------------- | --------- | ------------------------------------------------------------------- | -------------------------- |
| Discovery                  | Weeks 1-2 | Obtain sample exports, document legacy schemas, assess data quality | Schema mapping approved    |
| Mapping and Transformation | Weeks 2-3 | Build mapping templates, define validation rules, test with samples | Templates validated        |
| Pilot Migration            | Weeks 3-4 | Migrate subset (one PSO), validate accuracy, refine mappings        | Pilot data verified        |
| Full Migration             | Weeks 4-6 | Migrate organizations, users, submissions, documents                | Reconciliation checks pass |
| Validation and Cutover     | Weeks 6-7 | Full reconciliation, UAT on migrated data                           | Sign-off received          |

### Migration Sequence

1. Organizations and hierarchies
2. Users and role assignments
3. Historical submissions
4. Documents and attachments

### Mapping Process

Mapping templates define source fields, target fields, transformation rules, and validation requirements. Templates are reviewed and approved by viaSport before execution.

### Cleansing

Data quality issues are handled through:

- Format normalization for dates and numeric values
- Enum mapping to align legacy values with new fields
- Duplicate detection and manual review workflows

### Validation

Every imported record is validated against form definitions and required fields. Validation errors are logged with row-level detail for correction.

### Rollback

Imports are tagged with an `import_job_id`. Imports can be rolled back within the configured window (7 days by default) if issues are discovered after load.

## Audit Trail and Success Verification

### Audit Trail

Migration actions are logged with:

- Import job creation, status changes, and completion
- Mapping template creation and updates
- Row-level validation errors
- Rollback events

Import jobs and audit logs provide traceability for each migration run. Retention durations are configurable and will be confirmed with viaSport (TBD).

### Success Verification

Migration success is verified through reconciliation:

| Check                 | Method                                            |
| --------------------- | ------------------------------------------------- |
| Row counts            | Source count matches target count                 |
| Checksums             | Hash comparison of key fields                     |
| Spot checks           | Manual verification of sample records by viaSport |
| Referential integrity | Foreign keys validated                            |

## Data Quality Targets and Defect Workflow

| Metric                 | Target                           |
| ---------------------- | -------------------------------- |
| Successful import rate | 99%+ of records                  |
| Validation pass rate   | 95%+ on first attempt            |
| Duplicate detection    | 100% of exact duplicates flagged |
| Referential integrity  | 100% of relationships valid      |

Defects are classified by severity and resolved before moving to the next migration phase.

## Technical Infrastructure

### Import Processing

Large imports run in two lanes:

- **Interactive lane:** Validation and import for smaller files inside the app.
- **Batch lane:** ECS Fargate worker for large files in perf and prod; local fallback available in dev.

### Checkpointing and Errors

- Checkpointed processing allows resumable jobs.
- Row-level errors are captured and can be reviewed or re-imported.

## Dependencies on viaSport

Migration execution requires:

1. Legacy system access (export capability or direct database access)
2. Schema documentation for BCAR and BCSI
3. Data dictionary and field mapping approval
4. SME availability for validation and sign-off

Import tooling is ready today. Extraction approach will be finalized during Discovery based on legacy system capabilities. See **System Requirements Compliance Crosswalk** (DM-AGG-006) for detailed compliance mapping.

## Cutover and Change Management

A successful migration includes technical data movement and a managed transition for viaSport staff and PSOs.

### Cutover Approach (Recommended)

| Step                  | Description                                                 | Outcome                                              |
| --------------------- | ----------------------------------------------------------- | ---------------------------------------------------- |
| Pilot org migration   | Migrate one PSO end-to-end, validate workflow and reporting | Validated templates, mappings, and training approach |
| Migration waves       | Migrate remaining orgs in planned cohorts                   | Manageable support load, reduced risk                |
| Data freeze window    | Short read-only or limited update window on legacy systems  | Prevents last-minute divergence                      |
| Final delta migration | Import changes since last full migration                    | Production data is current                           |
| Go-live               | Solstice becomes system of record, support team on standby  | Controlled launch                                    |
| Hypercare             | Elevated support and daily check-ins for a defined period   | Fast issue resolution, adoption support              |
| Rollback plan         | Predefined rollback criteria and steps                      | Risk control if a blocking issue occurs              |

### Sector Communication and Training

- Publish a cutover calendar (freeze window, go-live date, support contacts).
- Provide role-based quick-start guides and live training sessions.
- Use a ticketing workflow and escalation path during hypercare.

### Downtime and Continuity Expectations

- Document expected downtime (if any) during final cutover.
- If parallel run is required, define duration and responsibilities (who submits where, what is source of truth).
