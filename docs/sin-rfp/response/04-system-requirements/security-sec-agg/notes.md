# Context Notes - System Requirements Compliance - Security (SEC-AGG)

## Requirement Definitions

- SEC-AGG-001 Authentication and Access Control
  - Description: MFA, password recovery, role restrictions, admission control.
  - Acceptance: Users log in securely and access is role based.
- SEC-AGG-002 Monitoring and Threat Detection
  - Description: Detect suspicious activity and lock accounts as needed.
  - Acceptance: Anomalies are logged and safeguarded.
- SEC-AGG-003 Privacy and Regulatory Compliance
  - Description: Align with PIPEDA and secure handling of personal data.
  - Acceptance: Sensitive data is encrypted and stored securely.
- SEC-AGG-004 Audit Trail and Data Lineage
  - Description: Immutable audit log of actions and configs.
  - Acceptance: Auditors can filter and export logs with integrity checks.

## Evidence Targets

- Screenshots or exports demonstrating each requirement.
- References to supporting docs or code as needed.

## Sources

- docs/sin-rfp/source/VIASPORT-PROVIDED-viasport-sin-rfp.md
- docs/sin-rfp/source/initial-template-rfp-response.md
- docs/sin-rfp/source/DO-NOT-COMMIT-CONFIDENTIAL-example-rfp-real.txt
- docs/sin-rfp/source/VIASPORT-PROVIDED-system-requirements-addendum.md
- docs/sin-rfp/requirements/SIN-REQUIREMENTS.md

## Draft Notes (for final.md)

- SEC-AGG-001 Authentication and Access Control
  - Response: Comply.
  - How requirement is met: Better Auth email/password + MFA (TOTP/backup), session policies, step-up auth, and org-scoped RBAC with admin gating.
  - Evidence: `src/lib/auth`, `src/features/auth`, `src/lib/auth/guards/step-up.ts`, `docs/sin-rfp/phase-0/security-controls.md`, `e2e/tests/unauthenticated/auth-flow.unauth.spec.ts`.
  - Notes: Self-service org registration is admin-only per decision log.
- SEC-AGG-002 Monitoring and Threat Detection
  - Response: Comply.
  - How requirement is met: Security events + anomaly detection with account lock workflows and admin dashboard visibility.
  - Evidence: `src/lib/security/detection.ts`, `src/features/security/components/security-dashboard.tsx`, `docs/sin-rfp/archive/streams/stream-g.md`.
  - Notes: Capture verification evidence for detection/lock events.
- SEC-AGG-003 Privacy and Regulatory Compliance
  - Response: Partial.
  - How requirement is met: Privacy/DSAR workflows, retention policies + legal holds, and Canada-only data residency documentation; encryption at rest/in transit via AWS controls.
  - Evidence: `src/features/privacy`, `src/lib/privacy/retention.ts`, `docs/sin-rfp/phase-0/data-residency.md`, `docs/sin-rfp/phase-0/audit-retention-policy.md`.
  - Notes: Object Lock/archival infra + retention automation evidence pending; SES-only enforcement and processor DPAs still need verification.
- SEC-AGG-004 Audit Trail and Data Lineage
  - Response: Comply.
  - How requirement is met: Append-only audit log with tamper-evident hash chain, admin audit UI, and export.
  - Evidence: `src/lib/audit/index.ts`, `src/features/audit`, `src/lib/audit/__tests__/audit-utils.test.ts`, `docs/sin-rfp/archive/streams/stream-g.md`.
  - Notes: DB role immutability hardening still noted as technical debt.
