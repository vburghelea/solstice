# viaSport Questions for SIN RFP Verification

## Goal

Collect decisions needed to close remaining verification gaps and finalize the response.

## Integrations and Data Exchange

- Which external platforms must we import from or export to at launch? Please list vendors/systems.
- For each target, which data objects and cadence are required (real-time, nightly, quarterly)?
- Do you expect Solstice to expose an API for partners? If yes, preferred auth model and endpoints.
- Should Solstice consume partner APIs directly, or is export-only acceptable?
- Are CSV/Excel exports sufficient as the baseline when no target platform is named?

## Reporting Metadata (Fiscal, Agreements, NCCP)

- Which metadata fields are mandatory versus optional?
- Are these fields org-wide, or do they vary by reporting cycle/period?
- Any validation rules or authoritative sources we must enforce?

## Retention, Legal Hold, and DR Evidence

- Required retention periods by data type?
- Legal hold triggers, approval process, and expected scope (user/org/record)?
- Acceptable environment for DR drill evidence (sin-dev, staging, or production)?
- Required RPO/RTO targets and evidence format?

## Accessibility

- Confirm WCAG version/level and acceptance criteria for sign-off.
- Is automated-only auditing acceptable, or is manual testing required?

## Notifications and Reminders

- Required delivery channels (email, in-app, SMS) and reminder cadence?
- Approved sender domain/from name and test recipients?
- Any logging or audit expectations for reminders?

## Guided Walkthroughs

- Which top 3 workflows need in-context guided tours?
- Do you have existing training material or scripts we should follow?

## Global Search

- Which entity types must appear in global search results?
- Which actions should be included in the command palette?

## File Handling

- Is multi-file upload required for any form field?
- Who can delete or replace uploaded files (admin only vs end users)?
- Any retention or legal-hold constraints for attachments?

## Data Quality and Audit

- Required data quality metrics or thresholds?
- Any audit export requirements (format, cadence, stakeholder review)?

## Templates and Content

- Which templates are mandatory to seed for verification?
- Approval process for template content and updates?

## Performance and Scale

- Expected data volumes for imports, reporting tasks, and analytics?
- Performance targets for key workflows (import, reporting, search, export)?

## Support Workflow

- Support response SLAs and required statuses?
- Should support responses live entirely in Solstice, or link to external tooling?
