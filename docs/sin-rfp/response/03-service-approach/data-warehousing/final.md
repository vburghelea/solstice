# Service Approach: Data Warehousing

## Hosting Solution, Tenancy Model, Data Residency, and Regulatory Alignment

### Hosting Solution

The platform is hosted entirely on Amazon Web Services in a serverless architecture that reduces infrastructure overhead.

| Component        | AWS Service         | Purpose                                    |
| ---------------- | ------------------- | ------------------------------------------ |
| Application Tier | Lambda              | Serverless compute, auto-scaling           |
| Database         | RDS PostgreSQL      | Managed relational database                |
| Caching          | ElastiCache Redis   | Rate limiting, BI caching, permissions     |
| Object Storage   | S3                  | Documents, import files, audit archives    |
| CDN              | CloudFront          | Edge caching, static asset delivery        |
| Message Queue    | SQS                 | Asynchronous notification processing       |
| Batch Processing | ECS Fargate         | Large file import processing               |
| Email            | SES                 | Transactional email delivery               |
| Scheduling       | EventBridge         | Scheduled jobs for retention and reminders |
| Secrets          | SSM Parameter Store | Credential storage                         |
| Encryption Keys  | KMS                 | Key management for encryption at rest      |

### Data Residency

All data is hosted in AWS ca-central-1 (Canada). No data is stored or processed outside Canadian jurisdiction.

| Data Type            | Storage Location      | Region       |
| -------------------- | --------------------- | ------------ |
| Application database | RDS PostgreSQL        | ca-central-1 |
| Documents and files  | S3                    | ca-central-1 |
| Audit archives       | S3 Deep Archive       | ca-central-1 |
| Backups              | RDS automated backups | ca-central-1 |

### Tenancy Model

The platform uses a multi-tenant architecture with strict organization scoping:

- Every query is scoped to the user's organization.
- Role-based access control restricts actions by role.
- Field-level permissions control visibility of sensitive data.
- Cross-organization access requires explicit admin privileges.

### Regulatory Alignment

| Requirement         | Implementation                                                      |
| ------------------- | ------------------------------------------------------------------- |
| PIPEDA alignment    | Canadian data residency, encryption, access controls, audit logging |
| Data minimization   | Configurable retention policies and legal holds                     |
| Right to access     | Data export workflows with audit trail                              |
| Breach notification | Audit logging and anomaly detection                                 |

AWS maintains a Data Processing Addendum that covers all services used by the platform, including SES for email delivery: https://d1.awsstatic.com/legal/aws-dpa/aws-dpa.pdf

### Sub-Processors

| Service              | Provider | Purpose                   | Data Residency        |
| -------------------- | -------- | ------------------------- | --------------------- |
| Cloud infrastructure | AWS      | Hosting, compute, storage | Canada (ca-central-1) |
| Email delivery       | AWS SES  | Transactional emails      | Canada (ca-central-1) |

No additional sub-processors are used.

## Backup, Recovery, and Encryption Standards

### Backup Strategy

| Parameter                | Value                                          |
| ------------------------ | ---------------------------------------------- |
| Backup frequency         | Continuous (point-in-time recovery)            |
| Backup retention         | 35 days in production, 7 days in dev and perf  |
| Backup location          | RDS automated backups, ca-central-1            |
| Cross-region replication | Not enabled (single-region for data residency) |

### Recovery Objectives

| Metric                         | Target              | Evidence                               |
| ------------------------------ | ------------------- | -------------------------------------- |
| Recovery Point Objective (RPO) | 1 hour (production) | Final production drill TBD             |
| Recovery Time Objective (RTO)  | 4 hours             | sin-dev drill completed, final run TBD |

Evidence for the latest DR drill is in `docs/sin-rfp/review-plans/evidence/DR-DRILL-sin-dev-20251230.md`.

### High Availability

Production uses Multi-AZ for automatic failover. Dev and perf use single-AZ for cost efficiency.

### Encryption Standards

**In Transit:** TLS 1.2+ for client and service communication.

**At Rest:** AES-256 via AWS KMS for database storage and S3 objects.

Encryption evidence is documented in `docs/sin-rfp/review-plans/evidence/ENCRYPTION-STATUS-sin-dev-20251231.md`.

### Audit Log Retention and Archival

Audit logs are immutable and archived to S3 Deep Archive based on retention policy configuration. Retention durations and archive schedules will be finalized with viaSport (TBD). Legal holds are supported to prevent deletion.

### Why PostgreSQL (Not a Columnar Warehouse)

viaSport's scale of 20M historical rows with 1M rows per year is well within PostgreSQL capability. A dedicated columnar warehouse would add cost and complexity without benefit at this scale.

| Factor                        | PostgreSQL        | Columnar Warehouse          |
| ----------------------------- | ----------------- | --------------------------- |
| Optimal scale                 | Up to 500M+ rows  | Billions of rows            |
| viaSport projected (10 years) | 30M rows          | 30M rows                    |
| Operational complexity        | Low (managed RDS) | Higher (cluster management) |
| Estimated annual cost         | $3,000 to $6,000  | $12,000+ minimum            |
| Data freshness                | Real-time         | Requires ETL, often delayed |

PostgreSQL provides real-time analytics and simplified operations while keeping data resident in Canada.
