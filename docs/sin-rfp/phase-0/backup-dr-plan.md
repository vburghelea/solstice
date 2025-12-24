# SIN Backup and Disaster Recovery Plan

## Document Control

| Item     | Value                       |
| -------- | --------------------------- |
| Document | Backup and DR Plan          |
| Audience | viaSport BC Evaluation Team |
| Version  | 1.0                         |
| Scope    | Production SIN platform     |

## 1.0 Purpose

This document describes the backup and disaster recovery (DR) strategy for the
SIN platform, aligned with RFP requirements for data protection and
recoverability.

## 2.0 Objectives and Targets

| Objective           | Target    | Mechanism                           |
| ------------------- | --------- | ----------------------------------- |
| RPO                 | 1 hour    | RDS automated backups + PITR        |
| RTO                 | 4 hours   | Multi-AZ failover + restore runbook |
| Backup retention    | 35 days   | RDS automated + manual snapshots    |
| Audit log retention | 7 years   | S3 Glacier + Object Lock            |
| DR testing          | Quarterly | Documented restore drills           |

## 3.0 Backup Strategy

Database (RDS PostgreSQL):

- Automated backups with PITR enabled
- Daily snapshots and pre-release snapshots
- Multi-AZ deployment for high availability

Object storage (S3):

- Versioning enabled for all buckets
- SSE-KMS encryption at rest
- Lifecycle policies for archive and retention

Configuration and secrets:

- Infrastructure-as-code in SST
- Secrets managed in AWS Secrets Manager

## 4.0 Disaster Recovery Architecture

- Single-region, Multi-AZ design in ca-central-1
- Automated failover for RDS
- Stateless application tier supports rapid redeploy
- Queue-based workloads are retry-safe and idempotent

## 5.0 Restore Procedures (Summary)

Database restore:

1. Identify incident scope and target restore time.
2. Perform PITR to a new RDS instance.
3. Validate schema integrity and row counts.
4. Switch application to restored instance.
5. Run smoke tests and confirm service recovery.

Object storage restore:

1. Identify affected objects and versions.
2. Restore from version history or Glacier archive.
3. Validate checksums and permissions.

Application restore:

1. Redeploy via SST using approved build artifacts.
2. Validate health checks and key workflows.
3. Confirm monitoring and alerting are operational.

## 6.0 DR Testing and Evidence

- Quarterly DR restore test in a controlled environment
- Documented test report with RPO/RTO achieved
- Post-test remediation tracked to closure

## 7.0 Roles and Communications

- Incident lead coordinates technical response
- Security lead manages access control and logging
- viaSport is notified per agreed incident policy

## 8.0 References

- `docs/sin-rfp/sst-migration-plan.md`
- `docs/sin-rfp/phase-0/audit-retention-policy.md`

## Appendix A: Backup Restore Test Results (Template)

| Test Date | Environment | Restore Type | RPO Achieved | RTO Achieved | Notes |
| --------- | ----------- | ------------ | ------------ | ------------ | ----- |
|           |             |              |              |              |       |
