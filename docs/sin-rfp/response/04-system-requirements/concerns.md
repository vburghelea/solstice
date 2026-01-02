# System Requirements Drafting Concerns

- Evidence gap: no consolidated screenshots/exports/log captures for the system requirements matrix yet (most evidence is code + docs only).
- Accessibility verification missing for UI-AGG-003 (no WCAG audit or automated scan results on record).
- Notification delivery evidence missing for UI-AGG-004 / RP-AGG-003 (real email delivery test still pending).
- Reporting metadata fields (agreements, NCCP, fiscal periods, contacts) not finalized or implemented; RP-AGG-002 remains partial until schema/UI decisions land.
- External integration/API PoC not implemented; DM-AGG-002 only covers CSV/Excel import/export and internal processing.
- Retention automation + Object Lock/Glacier archival infra not fully verified; SEC-AGG-003 / DM-AGG-005 evidence still partial.
- Import batch worker deployment verification pending; file-field imports blocked by design (DM-AGG-006).
- Multi-file uploads explicitly not supported (DM-AGG-001 / RP-AGG-004).
- Global search/command palette is feature gated; needs enablement and evidence for UI-AGG-005.
- SQL Workbench is gated by a DBA checklist and must remain disabled until prerequisites are verified (DM-AGG-003).
- Template, tutorial, help, and support features exist but need seeded content + evidence captures (TO-AGG-001/2/3, UI-AGG-006).
- PII export visibility depends on `pii.read` role permission; seeded roles may redact analytics outputs (RP-AGG-005).
- Audit log immutability has technical debt around DB role ownership; enforce read-only role to avoid UPDATE/DELETE risk (SEC-AGG-004).
