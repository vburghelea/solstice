# Hosting and Compliance Approach (Netlify vs SST on AWS)

This section is written to align with the RFP criteria for hosting, data residency, backup and recovery, encryption, monitoring, and service delivery. It compares the current Netlify-based approach with an SST-on-AWS approach and recommends a baseline for the SIN program.

## RFP Alignment Snapshot

- Cloud hosted, modular, scalable: both Netlify and AWS can satisfy this.
- Data residency and tenancy model: AWS allows explicit region selection (for example, ca-central-1) and clearer controls; Netlify has limited region control for compute and relies on external data stores for residency.
- Backup and disaster recovery: AWS provides native snapshots and multi-AZ patterns; Netlify relies on the storage vendor and custom processes.
- Security and compliance: Both can support TLS and encryption at rest, but AWS provides deeper controls (KMS, IAM, CloudTrail, WAF, VPC).
- Monitoring and audit: AWS offers full-stack observability and audit trails; Netlify has platform logs but less granular control.

## Option A: SST on AWS (Recommended for SIN)

**Hosting model**

- SST provides infrastructure-as-code on AWS for frontend, API, and background workloads.
- Supports a managed-service delivery model with clear environment promotion (dev, test, prod).

**Data residency**

- Data and compute can be pinned to a Canadian region (ca-central-1).
- Residency posture is explicit and defensible in RFP responses.

**Backup and disaster recovery**

- Native snapshots for databases, S3 versioning, and lifecycle policies.
- Clear RTO/RPO definitions using AWS-native mechanisms.

**Encryption and access controls**

- TLS in transit; KMS-backed encryption at rest for data stores and object storage.
- IAM-based least privilege, with audit trails via CloudTrail.

**Monitoring and audit**

- CloudWatch metrics, logs, and alarms for system health and security.
- Centralized retention policy for audit logs (aligns with SEC-AGG-004).

**Scaling and data migration**

- Suitable for large imports and batch processing (Step Functions, ECS, Batch).
- Easier to guarantee throughput and resumable workflows for 20M+ rows.

## Option B: Netlify (Current)

**Hosting model**

- Managed frontend hosting with serverless functions and edge capabilities.
- Very strong developer experience and preview deploys.

**Data residency**

- Compute runs on a global edge network with limited region control.
- Residency is primarily determined by the chosen database and storage vendor.

**Backup and disaster recovery**

- Netlify does not provide data storage for primary data; DR depends on the DB vendor.
- Requires a documented backup and recovery process outside the platform.

**Encryption and access controls**

- TLS in transit is standard; encryption at rest depends on the data vendor.
- IAM-style controls are not part of the platform.

**Monitoring and audit**

- Platform logs exist, but deeper system audit requires external services.
- More effort to meet audit and retention requirements at scale.

**Scaling and data migration**

- Serverless functions can scale for request workloads but are less suitable for long-running imports.
- Large migration and data quality workflows must run outside Netlify.

## Recommendation

For RFP and compliance defensibility, use **SST on AWS** as the production base. This gives clear answers to data residency, backup and DR, encryption, audit logging, and large-scale data migration. Netlify can remain useful for rapid UI prototyping, but the production system should anchor on AWS.

## Open Items to Confirm for the RFP

- Data residency requirement (Canada-only vs best-effort).
- Database selection and region (managed Postgres in ca-central-1).
- RTO and RPO targets.
- Log retention periods and audit export requirements.
- Expected uptime and support SLAs.
