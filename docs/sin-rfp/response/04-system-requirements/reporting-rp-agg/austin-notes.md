# Austin's Notes - Reporting Requirements (RP-AGG)

## Status Summary

| Req ID     | Title                                | Status    | Notes                                                  |
| ---------- | ------------------------------------ | --------- | ------------------------------------------------------ |
| RP-AGG-001 | Data Validation & Submission Rules   | ✅ Comply | Form/file validation works                             |
| RP-AGG-002 | Reporting Information Management     | Partial   | Metadata fields for agreements/NCCP/fiscal periods TBD |
| RP-AGG-003 | Reporting Flow & Support             | ✅ Comply | Email delivery verified 2025-12-31                     |
| RP-AGG-004 | Reporting Configuration & Collection | ✅ Comply | Form builder, file management working                  |
| RP-AGG-005 | Self-Service Analytics & Data Export | ✅ Comply | Native BI platform with pivots, charts, export         |

## Key Differentiator: Native BI Platform

### Why We Built It Ourselves

Evaluated Evidence, Metabase, and Superset - all failed to meet SIN governance requirements:

| Requirement         | External Tools                       | Native BI                         |
| ------------------- | ------------------------------------ | --------------------------------- |
| Tenancy enforcement | Requires custom RLS/views per tenant | Built into queries                |
| Field-level access  | Complex config, often bypassed       | Enforced at query layer           |
| Audit logging       | Limited or paid-tier only            | Full integration with audit chain |
| Canada residency    | Extra config for build pipelines     | Guaranteed (ca-central-1)         |
| Export controls     | Often disabled or hard to audit      | Audited with step-up auth         |

See ADR: `/docs/sin-rfp/decisions/ADR-2025-12-30-d0-19-bi-analytics-platform-direction.md`

### What We Built

- **Pivot builder**: Drag-and-drop dimensions/measures
- **Chart builder**: Bar, line, pie, etc. (ECharts)
- **Export**: CSV, XLSX, JSON with PII-aware redaction
- **Access control**: Org-scoped, field-level permissions enforced
- **Audit trail**: All queries and exports logged

### Framing for Proposal

> "Rather than bolting on a third-party BI tool, we built analytics directly into the platform. This ensures every query respects tenancy, every export is audited, and every field-level permission is enforced - without the complexity and security gaps of integrating external tools like Metabase or Superset."

## Multi-File Uploads: NOT a Gap

Reviewed viaSport requirements - multi-file uploads are NOT explicitly required:

- DM-AGG-001: "support flexible data entry through variable formats (forms, file uploads)" - no "multi" specified
- RP-AGG-004: "display files for users to read, edit, delete, and download" - no "multi" specified
- RFP: "documents in the hundreds per year" - low volume

**Decision**: Single-file uploads meet the stated requirements. Multi-file can be a future enhancement if viaSport requests it.

## Email Delivery: Verified ✅

Real email delivery tested 2025-12-31:

- SES identity verified
- Scheduled notification processed
- messageId: `010d019b7335d080-ec0707e9-2486-4a16-8f0e-65af0cb1323f-000000`
- Delivery confirmed to recipient

Evidence: `/docs/sin-rfp/review-plans/evidence/NOTIFICATIONS-DELIVERY-sin-dev-20251231.md`

## Questions Addressed

1. ✅ BI platform highlighted as differentiator
2. ✅ Multi-file confirmed NOT a requirement
3. ✅ Email delivery docs updated
