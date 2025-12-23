# SIN Data Residency Statement

## Document Control

| Item     | Value                       |
| -------- | --------------------------- |
| Document | Data Residency Statement    |
| Audience | viaSport BC Evaluation Team |
| Version  | 1.0                         |
| Scope    | Production SIN platform     |

## 1.0 Statement of Compliance

We confirm that all production SIN data will be stored and processed in Canada,
specifically within AWS ca-central-1. No production PII will be processed
outside Canada without prior written approval from viaSport.

## 2.0 Scope of Data Residency

In scope for residency controls:

- User and organization data
- Reporting submissions and attachments
- Audit logs and security events
- Imports, exports, and operational metadata

Non-production environments may be hosted in the same region to preserve
parity, or isolated as directed by viaSport.

## 3.0 Data Classification

| Classification | Description               | Examples               |
| -------------- | ------------------------- | ---------------------- |
| PII            | Identifies an individual  | name, email, address   |
| Sensitive PII  | Higher-risk personal data | DOB, health notes, IDs |
| Operational    | System and security data  | audit logs, metrics    |

## 4.0 Sub-Processor Inventory

| Service             | Vendor                  | Data Processed          | Region       | DPA Status   |
| ------------------- | ----------------------- | ----------------------- | ------------ | ------------ |
| Database            | AWS RDS                 | All SIN data            | ca-central-1 | AWS DPA      |
| Object Storage      | AWS S3                  | Documents, imports      | ca-central-1 | AWS DPA      |
| Email               | AWS SES                 | Names, org names, links | ca-central-1 | AWS DPA      |
| Auth                | Self-hosted Better Auth | Credentials, sessions   | ca-central-1 | N/A          |
| Monitoring          | CloudWatch/CloudTrail   | Logs, audit trails      | ca-central-1 | AWS DPA      |
| Threat Detection    | GuardDuty               | Security events         | ca-central-1 | AWS DPA      |
| OAuth (optional)    | Google                  | OAuth claims            | Global       | Google terms |
| Payments (optional) | Square                  | Payment tokens          | TBD          | Requires DPA |

## 5.0 Cross-Border Transfer Policy

- Production PII remains in Canada.
- OAuth and payment processors are optional integrations and will be enabled
  only with viaSport approval and documented DPAs.
- If external processors are enabled, the system limits shared data to the
  minimum required for the transaction.

## 6.0 Technical Controls

- AWS services are pinned to ca-central-1 in SST configuration.
- S3 buckets use SSE-KMS and block public access.
- RDS is deployed Multi-AZ within ca-central-1 and does not replicate
  cross-region.
- CloudFront caches static assets only; authenticated responses are set to
  no-store.
- Secrets are stored in AWS Secrets Manager within the same region.

## 7.0 Exceptions and Approvals

Any exception to this residency policy requires:

1. Written approval from viaSport.
2. DPA review and legal sign-off.
3. Documented data flow and risk assessment.

## 8.0 References

- `docs/sin-rfp/hosting-compliance.md`
- `docs/sin-rfp/sst-migration-plan.md`
- `docs/sin-rfp/SIN-REQUIREMENTS.md`
