# Service Approach: Data Warehousing

## Hosting Solution, Tenancy Model, Data Residency, and Regulatory Alignment

### Hosting Solution

The platform is hosted entirely on Amazon Web Services (AWS), using a serverless architecture that eliminates infrastructure management overhead.

| Component        | AWS Service     | Purpose                                 |
| ---------------- | --------------- | --------------------------------------- |
| Application Tier | Lambda          | Serverless compute, auto-scaling        |
| Database         | RDS PostgreSQL  | Managed relational database             |
| Object Storage   | S3              | Documents, import files, audit archives |
| CDN              | CloudFront      | Edge caching, static asset delivery     |
| Message Queue    | SQS             | Asynchronous notification processing    |
| Email            | SES             | Transactional email delivery            |
| Scheduling       | EventBridge     | Cron jobs for automated tasks           |
| Secrets          | Secrets Manager | Credential storage                      |
| Encryption Keys  | KMS             | Key management for encryption at rest   |

### Data Residency

All data is hosted exclusively in AWS ca-central-1 (Montreal, Canada). No data is stored, processed, or transmitted outside Canadian jurisdiction.

| Data Type            | Storage Location        | Region       |
| -------------------- | ----------------------- | ------------ |
| Application database | RDS PostgreSQL          | ca-central-1 |
| Documents and files  | S3                      | ca-central-1 |
| Audit log archives   | S3 Glacier Deep Archive | ca-central-1 |
| Backups              | RDS automated backups   | ca-central-1 |

### Tenancy Model

The platform uses a multi-tenant architecture with organization-scoped access controls. All tenants share the same application infrastructure, but data isolation is enforced at the application layer:

- Every database query is scoped to the user's organization.
- Role-based access control (RBAC) restricts actions based on user permissions.
- Field-level permissions control visibility of sensitive data elements.
- Cross-organization access requires explicit administrative privileges.

This model provides cost efficiency (shared infrastructure) while maintaining strict data isolation between organizations.

### Regulatory Alignment

| Requirement         | Implementation                                                      |
| ------------------- | ------------------------------------------------------------------- |
| PIPEDA compliance   | Canadian data residency, encryption, access controls, audit logging |
| Data minimization   | Configurable retention policies, automated purging                  |
| Right to access     | User data export functionality                                      |
| Breach notification | Audit logging, anomaly detection, alerting                          |

AWS maintains a Data Processing Addendum (DPA) that covers all services used by the platform, including SES for email delivery. The DPA is available at: https://d1.awsstatic.com/legal/aws-dpa/aws-dpa.pdf

### Sub-Processors

| Service              | Provider | Purpose                   | Data Residency        |
| -------------------- | -------- | ------------------------- | --------------------- |
| Cloud Infrastructure | AWS      | Hosting, compute, storage | Canada (ca-central-1) |
| Email Delivery       | AWS SES  | Transactional emails      | Canada (ca-central-1) |

No additional sub-processors are used. All services are provided directly by AWS within Canadian jurisdiction.

## Backup, Recovery, and Encryption Standards

### Backup Strategy

| Parameter                | Value                                          |
| ------------------------ | ---------------------------------------------- |
| Backup frequency         | Continuous (point-in-time recovery)            |
| Backup retention         | 35 days                                        |
| Backup location          | AWS RDS automated backups, ca-central-1        |
| Cross-region replication | Not enabled (single-region for data residency) |

### Recovery Objectives

| Metric                         | Target  | Tested |
| ------------------------------ | ------- | ------ |
| Recovery Point Objective (RPO) | 1 hour  | Yes    |
| Recovery Time Objective (RTO)  | 4 hours | Yes    |

### High Availability

Production environment uses Multi-AZ deployment for automatic failover:

- Primary database instance in one Availability Zone
- Synchronous standby replica in a separate Availability Zone
- Automatic failover in case of primary instance failure
- No data loss during failover (synchronous replication)

### Disaster Recovery Testing

Disaster recovery drills are scheduled quarterly. The most recent drill on file confirmed:

- Point-in-time restore completed successfully
- Application reconnection automated
- RTO achieved within target (4 hours)
- No data loss observed

Evidence available: `/docs/sin-rfp/review-plans/evidence/DR-DRILL-sin-dev-20251230.md`

### Encryption Standards

**In Transit:**

| Protocol | Version | Scope                           |
| -------- | ------- | ------------------------------- |
| TLS      | 1.2+    | All client-server communication |
| TLS      | 1.2+    | All inter-service communication |

**At Rest:**

| Data Type  | Encryption Method | Key Management                  |
| ---------- | ----------------- | ------------------------------- |
| Database   | AES-256           | AWS KMS (customer-managed keys) |
| S3 objects | AES-256           | AWS KMS (customer-managed keys) |
| Backups    | AES-256           | AWS KMS (customer-managed keys) |

**Secrets Management:**

Application secrets (database credentials, API keys, authentication secrets) are stored in AWS Secrets Manager with automatic rotation capability.

### Audit Log Retention

| Log Type               | Retention Period | Storage Tier                                     |
| ---------------------- | ---------------- | ------------------------------------------------ |
| Application audit logs | 7 years          | RDS (recent), S3 Glacier Deep Archive (archived) |
| Infrastructure logs    | 90 days          | CloudWatch Logs                                  |
| Access logs            | 90 days          | CloudWatch Logs                                  |

Audit logs are protected by a tamper-evident hash chain. Each log entry includes a hash of the previous entry, enabling detection of any modification or deletion.

### Why PostgreSQL (Not a Columnar Data Warehouse)

viaSport's data scale (20M historical rows, approximately 1M rows per year growth) is well within PostgreSQL's optimal range. A dedicated columnar warehouse such as Redshift or Snowflake would add unnecessary cost and complexity:

| Factor                        | PostgreSQL        | Columnar Warehouse          |
| ----------------------------- | ----------------- | --------------------------- |
| Optimal scale                 | Up to 500M+ rows  | Billions of rows            |
| viaSport projected (10 years) | 30M rows          | 30M rows                    |
| Operational complexity        | Low (managed RDS) | Higher (cluster management) |
| Estimated annual cost         | $3,000 to $6,000  | $12,000+ minimum            |
| Data freshness                | Real-time         | Requires ETL, often delayed |

PostgreSQL provides excellent analytical query performance at viaSport's scale while keeping data fresh (no ETL delays) and costs low. The architecture supports future migration to analytical extensions (TimescaleDB, DuckDB) if growth significantly exceeds projections.
