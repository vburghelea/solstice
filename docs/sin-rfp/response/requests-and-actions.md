# Requests and Actions

## Requests

- Read all `final.md` files in the repo for reference.
- Reduce repetition by adding a Standard Assumptions and Security Posture block
  early and reference it instead of repeating.
- Read `docs/sin-rfp/response/WRITING-STYLE-GUIDE.md` and follow the tone.
- Update only the final docs, then concatenate into
  `docs/sin-rfp/response/full-proposal-response.md`,
  `docs/sin-rfp/response/full-proposal-response-appendices.md`, and
  `docs/sin-rfp/response/full-proposal-response-combined.md`.
- Replace resume format with project-based relevant delivery work in Vendor Fit
  and Appendix F. Keep short bios in the appendix only if required.
- Reframe team size language to avoid "1 principal plus contracted specialists."
- Resolve UAT naming. sin-uat is UAT and demo, sin-perf is load testing.
- Add a Solution Overview section for non-technical evaluators.
- Move the OWASP Top 10 list into an appendix.
- Name the UX lead as Ruslan Hétu (bio to be supplied).

## Actions Taken

- Added the Standard Assumptions and Security Posture block and Section 1.3,
  1.4, 1.5 references in `docs/sin-rfp/response/01-executive-summary/final.md`,
  then updated references across related sections.
- Rewrote Vendor Fit to project-based delivery portfolios and reframed team
  size language in `docs/sin-rfp/response/02-vendor-fit/final.md`.
- Added a Solution Overview section at
  `docs/sin-rfp/response/03-solution-overview/final.md` and inserted it into
  `docs/sin-rfp/response/manifest.md`.
- Aligned UAT and performance environment wording in
  `docs/sin-rfp/response/01-executive-summary/final.md`,
  `docs/sin-rfp/response/01-B-prototype-evaluation-guide/final.md`,
  `docs/sin-rfp/response/03-service-approach/testing-qa/final.md`,
  `docs/sin-rfp/response/03-service-approach/platform-design/final.md`,
  `docs/sin-rfp/response/07-delivery-schedule/final.md`, and
  `docs/sin-rfp/response/08-appendices/final.md`.
- Moved the OWASP Top 10 mapping into Appendix J in
  `docs/sin-rfp/response/08-appendices/final.md` and replaced the long list in
  `docs/sin-rfp/response/03-service-approach/testing-qa/final.md` with a
  reference.
- Replaced resume content in Appendix F with short bios and placeholders in
  `docs/sin-rfp/response/08-appendices/final.md`.
- Regenerated `docs/sin-rfp/response/full-proposal-response.md`,
  `docs/sin-rfp/response/full-proposal-response-appendices.md`, and
  `docs/sin-rfp/response/full-proposal-response-combined.md`.
- Restructured team as advisory model: Austin leads delivery, six advisory
  partners provide expertise (Soleil Heaney for sport sector, Will Siddall for
  technical architecture, Ruslan Hétu for UX, Parul Kharub/Michael Casinha/Tyler
  Piller for security). Updated `01-executive-summary/final.md`,
  `02-vendor-fit/final.md`, `05-capabilities-experience/final.md`, and
  `08-appendices/final.md`. Removed MSA language as inaccurate.
- Fixed name spellings: Siddal → Siddall, Hetu → Hétu.
- Renumbered Standard Assumptions sections: 1.3→1.1 (Data Residency), 1.4→1.2
  (Security Model), 1.5→1.3 (Prototype). Updated all cross-references.
- Fixed contact email in Appendix H (was TBD, now austin@austinwallace.tech).
- Added assembly notes to manifest for section dividers.
- Added Solution Overview to Evaluator Navigation Map.

## Open Items

- Collect short bios from all advisory partners (Soleil Heaney, Will Siddall,
  Ruslan Hétu, Parul Kharub, Michael Casinha, Tyler Piller) for
  `docs/sin-rfp/response/02-vendor-fit/final.md` and
  `docs/sin-rfp/response/08-appendices/final.md`.
- Have Soleil confirm wording in Key Differentiator #3 (Domain Expertise).

## Session: Reviewer Feedback Adjustments

### Requests

- Align SEC-AGG-002 narrative with actual implementation (no WAF currently
  deployed, use accurate language about heuristic threat detection).
- Update architecture diagram to show Private Subnet around RDS.
- Add S3 Glacier Archive icon to diagrams for anti-ransomware capability.

### Actions Taken

- Updated SEC-AGG-002 in `04-system-requirements/security-sec-agg/final.md`:
  - Changed from "AI/Anomaly detection" language to "Heuristic threat detection"
  - Added CloudTrail CIS Benchmark alarms as key monitoring capability
  - Documented actual implementation: rate limiting, pre-auth lockout,
    CloudWatch alarms, CloudTrail with CIS alarms
  - Verified WAF is not currently in sst.config.ts, kept documentation accurate
- Updated compliance crosswalk tables to match SEC-AGG-002 changes.
- Updated architecture diagram (`create_architecture_diagram.py`):
  - Added Private Subnet container around RDS with "No Internet Access" label
  - Added S3 Glacier Archive icon showing 7-year retention
- Updated security diagram (`create_security_diagram.py`):
  - Changed edge layer from WAF to CloudFront with security headers
  - Added rate limiting, HSTS, CSP, X-Frame-Options detail
  - Updated monitoring section to show CloudTrail CIS Benchmark alarms
  - Added S3 Glacier Archive with "anti-ransomware" label
  - Removed GuardDuty (not in current config)
- Regenerated all diagrams (PNG and SVG).
- Regenerated assembled proposal files.

### WAF Implementation Complete

- Created `TICKET-waf-edge-protection.md` (now in `complete/`)
- WAF implemented in `sst.config.ts` with:
  - Rate limiting rule (1000 req/5min per IP)
  - AWS Managed Rules: Common Rule Set, Known Bad Inputs, SQL Injection
  - Count mode for non-prod, block mode for prod
  - CloudWatch alarm for blocked requests
- Updated SEC-AGG-002 documentation and compliance crosswalk to include WAF
- Updated security diagram to show WAF + CloudFront in edge layer
- Architecture diagram already showed WAF (no change needed)
- Regenerated all diagrams and assembled proposal files
