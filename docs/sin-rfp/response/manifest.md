# SIN RFP Response Manifest

## Pipeline (ETL Framing)

- **Extract**: RFP prompts, system requirements, and tone references.
- **Transform**: Map prompts to section folders and normalize requirements by ID.
- **Enrich**: Add evidence, examples, and notes per section.
- **Load**: Draft `final.md` per section and assemble into `full-proposal-response.md`.
- **Validate**: Coverage check, evidence references, tone consistency.

## Assembly Order (Source of Truth)

1. `docs/sin-rfp/response/01-executive-summary/final.md`
2. `docs/sin-rfp/response/02-vendor-fit/final.md`
3. `docs/sin-rfp/response/03-service-approach/data-submission-reporting/final.md`
4. `docs/sin-rfp/response/03-service-approach/data-warehousing/final.md`
5. `docs/sin-rfp/response/03-service-approach/data-migration/final.md`
6. `docs/sin-rfp/response/03-service-approach/platform-design/final.md`
7. `docs/sin-rfp/response/03-service-approach/testing-qa/final.md`
8. `docs/sin-rfp/response/03-service-approach/training-onboarding/final.md`
9. `docs/sin-rfp/response/04-system-requirements/data-management-dm-agg/final.md`
10. `docs/sin-rfp/response/04-system-requirements/reporting-rp-agg/final.md`
11. `docs/sin-rfp/response/04-system-requirements/security-sec-agg/final.md`
12. `docs/sin-rfp/response/04-system-requirements/training-onboarding-to-agg/final.md`
13. `docs/sin-rfp/response/04-system-requirements/user-interface-ui-agg/final.md`
14. `docs/sin-rfp/response/05-capabilities-experience/final.md`
15. `docs/sin-rfp/response/06-cost-value/final.md`
16. `docs/sin-rfp/response/07-delivery-schedule/final.md`
17. `docs/sin-rfp/response/08-appendices/final.md`

## Assembly Target

- `docs/sin-rfp/response/full-proposal-response.md`
