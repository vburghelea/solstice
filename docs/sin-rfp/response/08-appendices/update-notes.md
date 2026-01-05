# Update Notes

## 2026-01-04 13:44 PST

- Appendix scope mismatch: current Appendix A-H differs from the internal A-I
  checklist (requirements matrix, architecture diagrams, migration plan, security
  docs, training materials, case studies, team bios, pricing worksheets, optional
  add-ons). Decide whether to re-number or add missing appendices, and update
  cross-references like Appendix A in the executive summary. Evidence:
  `docs/sin-rfp/response/08-appendices/notes.md`,
  `docs/sin-rfp/response/08-appendices/concerns.md`,
  `docs/sin-rfp/response/08-appendices/final.md`,
  `docs/sin-rfp/response/01-executive-summary/final.md`.
- Appendix A demo access: add `admin@example.com` platform admin and clarify MFA
  details (TOTP secret + backup codes). The appendix says credentials are
  placeholders, but the seed script defines concrete accounts and MFA enrollment.
  Evidence: `scripts/seed-sin-data.ts`, `CLAUDE.md`,
  `docs/sin-rfp/response/08-appendices/austin-notes.md`.
- Appendix A demo environment: decide whether to point to `sin-perf` (CloudFront
  URLs documented in performance reports) or create the planned `sin-uat`
  environment, then update the demo URL accordingly. Evidence:
  `performance/reports/20260102-sin-perf-summary.md`,
  `performance/PERFORMANCE-REPORT.md`,
  `docs/sin-rfp/response/08-appendices/austin-notes.md`.
- Appendix B architecture: add infra components that are in IaC but not called
  out (VPC, RDS Proxy, S3 artifacts bucket with Object Lock + Glacier lifecycle,
  SQS notifications queue + DLQ, EventBridge cron jobs, ECS Fargate import-batch
  task, CloudWatch alarms + SNS). Evidence: `sst.config.ts`,
  `src/workers/import-batch.ts`, `src/cron/process-notifications.ts`,
  `src/cron/enforce-retention.ts`, `src/cron/data-quality-monitor.ts`.
- Appendix B security tooling: GuardDuty/CloudTrail are referenced in security
  docs, but not provisioned in IaC; confirm account-level setup or mark as
  planned. Evidence: `sst.config.ts`,
  `docs/sin-rfp/phase-0/security-controls.md`,
  `docs/sin-rfp/phase-0/data-residency.md`.
- Appendix C load tests: replace "date TBD" with actual run dates and reconcile
  metrics between the 2025-12-31 report (25 VUs, p95 269ms, 9.4% error rate) and
  the 2026-01-02 summary (15 VUs, p95 250ms, 6.73% 429 rate limiting). Also note
  rate-limiter errors instead of implying zero errors. Evidence:
  `performance/PERFORMANCE-REPORT.md`,
  `performance/reports/20260102-sin-perf-summary.md`.
- Appendix C metrics are repeated elsewhere; once Appendix C is finalized, sync
  the numbers and wording in other sections. Evidence:
  `docs/sin-rfp/response/01-executive-summary/final.md`,
  `docs/sin-rfp/response/02-vendor-fit/final.md`,
  `docs/sin-rfp/response/03-service-approach/testing-qa/final.md`,
  `docs/sin-rfp/response/05-capabilities-experience/final.md`,
  `docs/sin-rfp/response/06-cost-value/final.md`.
- Appendix D data residency/compliance: phase-0 docs mark some controls as
  partial (SES-only enforcement, DPA verification, DR evidence), so update
  Appendix D wording to indicate targets vs implemented controls. Evidence:
  `docs/sin-rfp/phase-0/data-residency.md`,
  `docs/sin-rfp/phase-0/security-controls.md`.
- Appendix D audit retention: code now archives audit logs to S3 Deep Archive
  and tracks archive rows, while the audit-retention policy doc still says
  archival is pending. Align Appendix D and/or update the policy status.
  Evidence: `src/lib/privacy/retention.ts`, `src/db/schema/audit.schema.ts`,
  `sst.config.ts`, `docs/sin-rfp/phase-0/audit-retention-policy.md`.
- Appendix D field-level permissions: BI field ACL + step-up export enforcement
  exist, but the data classification guide still marks field-level PII
  enforcement as pending. Clarify scope to analytics exports or update the
  guide. Evidence: `src/features/bi/governance/field-acl.ts`,
  `src/features/bi/bi.mutations.ts`,
  `docs/sin-rfp/phase-0/data-classification-guide.md`.
- Appendix D security controls: consider adding account lockout and anomaly
  detection (already implemented) to the security summary. Evidence:
  `src/lib/security/detection.ts`, `src/lib/security/lockout.ts`,
  `src/lib/security/config.ts`.
- Appendix E personas: org role enum includes `member` and there is no explicit
  `auditor` role; clarify mapping for the Auditor persona and whether "member"
  should be listed. Evidence: `src/db/schema/organizations.schema.ts`,
  `docs/sin-rfp/requirements/sin-dual-portal-considerations.md`.
- Appendix artifacts: the appendices evidence folder is still empty; add
  screenshots/diagrams/matrix exports before final packaging. Evidence:
  `docs/sin-rfp/response/08-appendices/evidence/`,
  `docs/sin-rfp/response/08-appendices/concerns.md`.
