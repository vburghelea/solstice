# Final.md Update Plan

## Scope

- Apply peer feedback and doc-comments across all `final.md` sections.
- Follow `docs/sin-rfp/response/WRITING-STYLE-GUIDE.md` tone rules.
- Avoid em dashes and remove internal repo file paths from the body text.

## Global edits (apply everywhere)

- Replace Will Siddal role title with "Technical Lead" in every section and bio.
- Replace claims like "No data leaves Canadian jurisdiction" with precise
  residency language (primary data stores in AWS ca-central-1, CDN caching rules,
  outbound notifications may traverse external networks).
- Replace internal evidence paths with appendix references or "Evidence Pack
  (Attachment)" and move a small set of screenshots into appendices.
- Replace all "Section XX" references with exact header titles.

## File-level updates

### `docs/sin-rfp/response/01-executive-summary/final.md`

- Add a short table of contents with 1 to 2 line summaries after the opening
  paragraph.
- Update the At a Glance references to exact section titles.
- Update the Security row to mention monitoring and lockout controls and use
  safer residency wording.
- Update the Proposed Team table and add a short sentence about specialist roles
  supporting security review, pen testing coordination, and UX accessibility.
- Update the Evaluator Navigation Map to use header titles verbatim.

### `docs/sin-rfp/response/01-B-prototype-evaluation-guide/final.md`

- Add shared responsibility model language and AWS Artifact reference for
  compliance artifacts.
- Add demo steps for SEC-AGG-002 and SEC-AGG-003.
- Add crosswalk rows for SEC-AGG-002 and SEC-AGG-003 with clear demo paths.
- Update any residency phrasing to match the safer wording standard.

### `docs/sin-rfp/response/02-vendor-fit/final.md`

- Update Proposed Solution Statement to "purpose-built, reliable and secure".
- Replace Will Siddal title and shorten bios to 3 to 5 lines each.
- Add Security Expert name and a short bio in the main body.
- Add a "Security and Privacy by Design" section with shared responsibility and
  OWASP alignment.
- Adjust the data residency differentiator to use the safer wording.
- Reduce resume duplication by moving full bios to Appendix F.

### `docs/sin-rfp/response/03-service-approach/data-submission-reporting/final.md`

- Replace the accessibility evidence path with an appendix reference.

### `docs/sin-rfp/response/03-service-approach/data-warehousing/final.md`

- Replace data residency language with the safer phrasing.
- Add a short shared responsibility statement.
- Replace evidence paths with appendix references.

### `docs/sin-rfp/response/03-service-approach/data-migration/final.md`

- Add a Cutover and Change Management subsection with pilot, migration waves,
  data freeze, delta migration, go-live, hypercare, and rollback steps.
- Add a short note on downtime and parallel run expectations.
- Update cross references to use exact header titles.

### `docs/sin-rfp/response/03-service-approach/platform-design/final.md`

- Review for data residency phrasing and align with safer wording if needed.

### `docs/sin-rfp/response/03-service-approach/testing-qa/final.md`

- Replace the Testing Layers table with the updated security tooling and
  frequency (SAST, SCA, DAST, independent pen test).
- Update Security Testing to include vulnerability testing and OWASP Top 10
  mapping.
- Add continuous monitoring language.
- Replace evidence paths with appendix references.

### `docs/sin-rfp/response/03-service-approach/training-onboarding/final.md`

- Review for data residency phrasing and align with safer wording if needed.

### `docs/sin-rfp/response/04-system-requirements/00-compliance-crosswalk/final.md`

- Ensure SEC-AGG-003 wording aligns with safer residency language.

### `docs/sin-rfp/response/04-system-requirements/data-management-dm-agg/final.md`

- Add a short definition for the Data Catalog and what it is not.
- Add a discovery note on structured data vs document-centric reporting.
- Replace evidence paths with appendix references.

### `docs/sin-rfp/response/04-system-requirements/reporting-rp-agg/final.md`

- Replace evidence paths with appendix references.

### `docs/sin-rfp/response/04-system-requirements/security-sec-agg/final.md`

- Add shared responsibility model language and AWS built-in control summary.
- Replace data residency language with safer wording.
- Replace evidence paths with appendix references.

### `docs/sin-rfp/response/04-system-requirements/training-onboarding-to-agg/final.md`

- Replace evidence paths with appendix references.

### `docs/sin-rfp/response/04-system-requirements/user-interface-ui-agg/final.md`

- Replace evidence paths with appendix references.

### `docs/sin-rfp/response/05-capabilities-experience/final.md`

- Update Will Siddal title to "Technical Lead".
- Reduce resume repetition by focusing on case studies and delivery capacity.
- Align team structure wording with the updated Security Expert role.

### `docs/sin-rfp/response/06-cost-value/final.md`

- Add a Security Tooling line item under Annual Operations.
- Add a clarifying sentence that routine scanning is included and independent
  pen testing is included pre go-live or priced as an annual add-on.

### `docs/sin-rfp/response/07-delivery-schedule/final.md`

- Add a short reference to the new cutover plan section.
- Add explicit mention of data freeze and hypercare timing.

### `docs/sin-rfp/response/08-appendices/final.md`

- Update data residency language in Appendix D.
- Replace Will Siddal title and add Security Expert bio in Appendix F.
- Add an Evidence Pack appendix with 2 to 3 key screenshots, then reference it
  from the body sections.

## Assembly

- Rebuild the master response in manifest order:

  `cat $(sed -n 's/^\d\+\. `\(.\*\)`$/\1/p' docs/sin-rfp/response/manifest.md) > docs/sin-rfp/response/full-proposal-response.md`

- Rebuild appendices as a separate concatenation of appendix sections:

  `cat docs/sin-rfp/response/08-appendices/final.md > docs/sin-rfp/response/full-proposal-response-appendices.md`

## Final checks

- Confirm all cross references use exact header titles.
- Confirm no internal file paths remain in body text.
- Confirm no em dashes were introduced.
- Confirm data residency language uses the safer phrasing consistently.
