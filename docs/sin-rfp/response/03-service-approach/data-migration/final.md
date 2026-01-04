# Service Approach: Data Migration

## Migration Methodology

### Approach

Data migration follows a phased approach that minimizes risk and allows validation at each stage. The legacy systems (BCAR and BCSI) remain in read-only mode until migration is verified and signed off by viaSport.

### Migration Phases

| Phase                      | Duration  | Activities                                                                                             | Exit Criteria                    |
| -------------------------- | --------- | ------------------------------------------------------------------------------------------------------ | -------------------------------- |
| Discovery                  | Weeks 1-2 | Obtain sample exports, document legacy schemas, assess data quality, identify transformation rules     | Schema mapping document approved |
| Mapping and Transformation | Weeks 2-3 | Build mapping templates, define validation rules, create transformation scripts, test with sample data | Mapping templates validated      |
| Pilot Migration            | Weeks 3-4 | Migrate subset (one PSO), validate accuracy, refine mappings                                           | Pilot data verified by viaSport  |
| Full Migration             | Weeks 4-6 | Migrate in sequence: organizations, users, submissions, documents                                      | Reconciliation checks pass       |
| Validation and Cutover     | Weeks 6-7 | Full reconciliation, UAT on migrated data, viaSport sign-off, legacy set to archive                    | Sign-off received                |

### Migration Sequence

Data is migrated in dependency order to maintain referential integrity:

1. **Organizations:** Hierarchy of viaSport, PSOs, and clubs
2. **Users:** User accounts and role assignments
3. **Historical Submissions:** Form data linked to organizations
4. **Documents:** Files linked to submissions

### Mapping Process

Each data type requires a mapping template that defines:

- Source field in legacy system
- Target field in Solstice
- Transformation rules (format conversion, enum mapping, null handling)
- Validation rules (required fields, format checks, referential integrity)

Mapping templates are reviewed and approved by viaSport before migration execution.

### Cleansing

Data quality issues identified during Discovery are addressed through:

- **Format normalization:** Standardize date formats, phone numbers, postal codes
- **Enum mapping:** Map legacy values to new system values
- **Null handling:** Define defaults or flag for manual review
- **Duplicate detection:** Identify and flag potential duplicates for viaSport review

### Validation

Every imported record passes through validation:

- Schema validation (required fields, data types)
- Business rule validation (valid date ranges, referential integrity)
- Format validation (email format, postal code format)

Records that fail validation are logged with specific error messages for triage.

### Rollback

All imported records are tagged with an `import_job_id`. If issues are discovered after import:

- Entire import job can be rolled back by job ID
- Partial rollbacks supported for specific record types
- Legacy system remains available as source of truth until sign-off

## Audit Trail and Success Verification

### Audit Trail

Every migration action is logged:

| Event                    | Logged Information                             |
| ------------------------ | ---------------------------------------------- |
| Import job created       | Job ID, source, target, initiator, timestamp   |
| Mapping template applied | Template version, field mappings               |
| Record imported          | Source ID, target ID, transformation applied   |
| Validation error         | Record ID, field, error type, error message    |
| Rollback executed        | Job ID, records affected, initiator, timestamp |

Logs are stored in S3 and retained for 7 years, consistent with the platform's audit retention policy.

### Success Verification

Migration success is verified through reconciliation:

| Check                 | Method                                             |
| --------------------- | -------------------------------------------------- |
| Row counts            | Source count matches target count (per table)      |
| Checksums             | Hash comparison of key fields                      |
| Spot checks           | Manual verification of sample records by viaSport  |
| Referential integrity | All foreign key relationships valid                |
| Business rules        | Sample queries confirm expected data relationships |

### Sign-Off Process

Migration is not considered complete until viaSport provides formal sign-off. Sign-off criteria:

1. All reconciliation checks pass
2. Spot checks verified by viaSport staff
3. UAT completed on migrated data
4. No blocking issues in defect log

## Data Quality Targets and Defect Workflow

### Data Quality Targets

| Metric                 | Target                           |
| ---------------------- | -------------------------------- |
| Successful import rate | 99%+ of records                  |
| Validation pass rate   | 95%+ on first attempt            |
| Duplicate detection    | 100% of exact duplicates flagged |
| Referential integrity  | 100% of relationships valid      |

### Defect Classification

| Severity | Definition                                            | Response                                     |
| -------- | ----------------------------------------------------- | -------------------------------------------- |
| Critical | Data loss or corruption risk                          | Block migration, immediate resolution        |
| High     | Significant data quality issue affecting many records | Resolve before proceeding to next phase      |
| Medium   | Data quality issue affecting subset of records        | Queue for resolution, proceed with migration |
| Low      | Minor formatting or cosmetic issues                   | Log for post-migration cleanup               |

### Defect Workflow

1. **Detection:** Automated validation or manual review identifies issue
2. **Classification:** Assign severity based on impact
3. **Triage:** Determine resolution approach (automated fix, manual correction, accept as-is)
4. **Resolution:** Apply fix or document acceptance rationale
5. **Verification:** Confirm fix resolves issue
6. **Closure:** Update defect log with resolution

### Defect Reporting

viaSport receives regular defect reports during migration:

- Daily summary during active migration phases
- Detailed report before each phase sign-off
- Final reconciliation report at migration completion

## Technical Infrastructure

### Import Processing

Large-scale imports are processed using AWS ECS Fargate:

| Parameter  | Value                |
| ---------- | -------------------- |
| Compute    | 2 vCPU               |
| Memory     | 4 GB RAM             |
| Storage    | 50 GB                |
| Chunk size | 1,000 rows per batch |

### Checkpointing

Long-running imports use checkpointing for resumability:

- Progress saved after each chunk
- Failed imports can resume from last successful checkpoint
- No need to restart from beginning after transient failures

### Error Handling

- Row-level errors logged to S3
- Error reports include source row, error type, and suggested resolution
- Failed rows can be corrected and re-imported without affecting successful rows

## Dependencies on viaSport

Migration methodology will be finalized based on viaSport's legacy system capabilities. Key questions to resolve during Discovery:

1. **Export format:** Can BCAR/BCSI export to CSV/Excel, or is direct database access required?
2. **Schema documentation:** Does documentation exist for legacy data models?
3. **Data quality:** Are there known issues (duplicates, inconsistent formats) to plan for?
4. **Access:** Who maintains legacy systems and will be available during migration?

Our import infrastructure is production-ready. The extraction approach will be determined collaboratively based on legacy system capabilities.
