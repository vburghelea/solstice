# Austin's Notes - Data Warehousing

## Status: Strong - mostly ready

The existing notes.md has comprehensive documentation. Key points already covered:

## What's Already Documented

### Hosting & Data Residency

- AWS ca-central-1 (Montreal) - all data stays in Canada
- PIPEDA compliant
- Sub-processor inventory documented

### Infrastructure

- RDS PostgreSQL (primary data store)
- S3 for documents/import artifacts
- Multi-tenant with org-scoped access controls

### Backup & Recovery

- RPO: 1 hour
- RTO: 4 hours
- 35-day backup retention
- Multi-AZ failover (production)
- Quarterly restore drills - EVIDENCE EXISTS

### Encryption

- TLS 1.2+ in transit
- KMS encryption at rest (RDS + S3)
- Secrets in AWS Secrets Manager

### Audit & Compliance

- 7-year audit log retention
- Tamper-evident hash chain
- Legal hold support
- Object Lock for immutability

## Questions for Austin

1. Anything you want to add or change about the data warehousing approach?
2. Any concerns about the current setup?
3. Is the analytics layer (BI platform) something you want to highlight here or in Reporting?

## Evidence Available

- DR drill results: `/docs/sin-rfp/review-plans/evidence/DR-DRILL-sin-dev-20251230.md`
- Encryption status: `/docs/sin-rfp/review-plans/evidence/ENCRYPTION-STATUS-sin-dev-20251231.md`
- Backup test results: `/docs/sin-rfp/review-plans/backup-restore-test-results.md`

## Why PostgreSQL (not Redshift/Snowflake)

### The Question

Will viaSport expect a "real" data warehouse like Redshift? Should we justify PostgreSQL?

### The Answer: PostgreSQL is the right choice

**Scale context:**

- 20M rows historical
- ~1M rows/year growth
- 30M rows in 10 years

**PostgreSQL sweet spot:** Up to 500M-1B rows - viaSport is well within this.

### Comparison

| Factor                           | PostgreSQL          | Redshift                      |
| -------------------------------- | ------------------- | ----------------------------- |
| Sweet spot                       | Up to ~500M-1B rows | Billions+ rows                |
| viaSport scale (30M in 10 years) | Easy                | Overkill                      |
| Operational complexity           | Low (managed RDS)   | Higher (cluster mgmt)         |
| Cost                             | ~$200-500/mo        | ~$1,000-3,000/mo min          |
| Data freshness                   | Real-time (same DB) | Requires ETL, often stale     |
| Concurrent users                 | Fine for 60 PSOs    | Designed for 100s of analysts |

### Why NOT Redshift

- Adds ~$12k+/year minimum cost
- Adds ETL complexity and data sync
- Adds latency (data not real-time)
- Provides zero benefit at this scale

### Framing for Proposal

> "The platform uses PostgreSQL, a proven enterprise database trusted by organizations processing billions of transactions. At viaSport's data scale (~20M rows, growing ~1M/year), PostgreSQL delivers excellent analytical performance without the operational complexity and cost of a dedicated columnar warehouse. This architecture keeps data fresh (no ETL delays), simplifies operations, and reduces costs—while leaving headroom to scale 10x or more if needed. For future growth beyond PostgreSQL's practical limits, the architecture supports seamless migration to analytical layers like TimescaleDB or DuckDB."

### Future-Proofing Options (if ever needed)

- TimescaleDB extension for time-series optimization
- DuckDB for analytical queries
- Materialized views for complex aggregations
- Read replicas for analytical workload isolation

None of these are needed now, but the architecture doesn't preclude them.
