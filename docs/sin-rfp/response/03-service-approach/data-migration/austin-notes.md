# Austin's Notes - Data Migration

## Status: Documented but has unknowns

Migration is inherently risky - depends heavily on viaSport's legacy data quality and format.

## What's Already Documented

### Methodology

- Pre-migration inventory + data quality assessment
- Field mapping documents and transformation rules
- Phased migration order:
  1. Organization hierarchy
  2. Users
  3. Historical submissions
  4. Documents
- Import mapping templates with preview before commit
- Checkpointed batch processing (can resume on failure)

### Technical Infrastructure

- ECS Fargate for batch imports (2 vCPU, 4GB RAM, 50GB storage)
- Chunked processing (1000 rows at a time)
- Error reports written to S3
- Checkpoint persistence for resumable imports

### Rollback Strategy

- All imported records tagged with `import_job_id`
- Can roll back entire import by job ID
- Legacy system stays READ-ONLY until reconciliation passes
- No "big bang" cutover - phased approach

### Audit Trail

- Import jobs logged with status, timestamps, actor
- Mapping template changes audited
- Error reports preserved in S3
- Reconciliation sign-off documented

### Data Quality

- Null/duplicate checks
- Format normalization
- Enum mapping rules
- Row-level error reports for triage

## Key Unknowns (Questions for viaSport)

1. **Data format**: What format can they export from BCAR/BCSI? (CSV, SQL dump, API?)
2. **Data access**: Direct database access or exports only?
3. **Data quality**: Known issues? Duplicates? Inconsistent formats?
4. **Schema documentation**: Do they have docs on their current data model?
5. **Dependencies**: Are there foreign key relationships we need to preserve?
6. **Documents**: Where are files stored? How many? What formats?
7. **Timeline**: Can we do migration in parallel with system build, or must it wait?

## Risks to Address in Proposal

### Risk 1: Unknown Data Quality

- **Mitigation**: Discovery phase includes data quality assessment
- **Mitigation**: Budget time for data cleansing
- Propose: viaSport provides sample data exports for assessment

### Risk 2: Schema Mismatch

- **Mitigation**: Field mapping phase with viaSport sign-off before migration
- **Mitigation**: Preview mode shows exactly what will be imported

### Risk 3: Missing/Corrupt Data

- **Mitigation**: Row-level error reports for triage
- **Mitigation**: Checkpointed imports can retry failed rows
- **Mitigation**: Original legacy system preserved until sign-off

### Risk 4: Scale (20M+ rows)

- **Mitigation**: ECS Fargate handles large batches
- **Mitigation**: Chunked processing prevents memory issues
- **Mitigation**: Checkpoints allow multi-day migrations if needed

## Migration Phases (for proposal)

### Phase 1: Discovery (Week 1-2)

- Obtain sample data exports from viaSport
- Document current BCAR/BCSI schema
- Assess data quality (nulls, duplicates, format issues)
- Create field mapping document
- Identify transformation rules needed

### Phase 2: Mapping & Transformation (Week 2-3)

- Build mapping templates in Solstice
- Define validation rules
- Create transformation scripts for format normalization
- Test with sample data

### Phase 3: Pilot Migration (Week 3-4)

- Migrate subset (e.g., one PSO's historical data)
- Validate accuracy with viaSport
- Refine mappings based on issues found

### Phase 4: Full Migration (Week 4-6)

- Migrate in order: orgs → users → submissions → documents
- Run reconciliation checks after each phase
- Generate sign-off report

### Phase 5: Validation & Cutover (Week 6-7)

- Full reconciliation: row counts, checksums, spot checks
- User acceptance testing on migrated data
- viaSport sign-off
- Legacy system set to read-only archive

## Austin's Answers

### Have you seen their data?

No - nothing. Need to interview them.

### Migration tooling confidence?

Gap exists: External API/DB imports not implemented because we don't know what their systems/APIs are like. Current tooling handles CSV/Excel imports well.

### Biggest concern?

**How to get data OUT of their legacy systems.** The import side is ready; the export/extraction side is unknown.

### Pre-contract de-risking?

Getting their **schemas** before contract could be enough. Don't necessarily need sample data, just structure.

## Critical Interview Questions for viaSport

**Add to Monday interview list:**

1. What systems hold the data? (BCAR, BCSI - what tech stack?)
2. Can you export to CSV/Excel? Or do we need direct DB access?
3. Do you have schema documentation for BCAR/BCSI?
4. Can you share schemas (not data) before contract finalization?
5. Are there APIs we can use, or is it export-only?
6. Who maintains the legacy systems? Will they be available during migration?

## Framing for Proposal

### What we know

- Import tooling is production-ready (CSV/Excel, batch processing, validation)
- Can handle 20M+ rows via ECS Fargate
- Checkpointed, resumable, audited

### What depends on viaSport

- Export/extraction method depends on their legacy system capabilities
- Schema mapping requires their documentation
- Timeline depends on data quality

### Proposed approach

> "Migration methodology adapts to viaSport's legacy system capabilities. We propose a Discovery phase where we assess export options, obtain schema documentation, and determine the optimal extraction approach. Our import infrastructure is production-ready and tested at scale; the extraction approach will be finalized collaboratively based on BCAR/BCSI system capabilities."

This is honest: you're not pretending to know their systems, but you're ready on your end.
