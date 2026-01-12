# January 10, 2026 - RFP Response Update Plan

This document captures all updates needed based on reviewer comments and additional stakeholder feedback.

## Summary

- **89 reviewer comments** from the Excel spreadsheet
- **36 "likely future comments"** identified for proactive fixes
- **6 additional comments** from stakeholder review not captured in Excel
- **21 final.md files** to update

## Document Update Strategy

The combined proposal (`full-proposal-response-combined.md`) will be replaced with the new Draft RFP.md from Google Docs. Then we will back-propagate changes to individual `final.md` files.

---

## Part 1: Reviewer Comments Resolution Summary

### Category A: Style and Jargon (Global Fixes)

| ID        | Issue                            | Action                                                                         |
| --------- | -------------------------------- | ------------------------------------------------------------------------------ |
| [a]       | Informal jargon and quoted terms | Remove "batteries included", "skin in the game", quoted descriptors throughout |
| [j][k][l] | "Batteries included" model       | Replace with "integrated, single-vendor delivery and operations model"         |
| [o]       | "Standup fee"                    | Replace with "one-time implementation fee"                                     |
| [q]       | "edge caching" jargon            | Replace with plain-language description                                        |
| [ad]      | "delivery approach" jargon       | Replace with explicit descriptions                                             |
| [aj]      | "What to Ignore" heading         | Replace with "Prototype Placeholders and Items to Be Finalized Post-Award"     |
| [ao]      | "Demo Script"                    | Replace with "Evaluator Walkthrough" and add purpose statement                 |

### Category B: Acronym Expansion (First Use)

All acronyms must be spelled out on first use:

| Acronym | Full Form                            | Location                |
| ------- | ------------------------------------ | ----------------------- |
| UAT     | User Acceptance Testing              | What viaSport is Buying |
| PSO     | Provincial Sport Organization        | Response Overview       |
| SLA     | Service Level Agreement              | Response Overview       |
| MFA     | Multi-Factor Authentication          | Security section        |
| RBAC    | Role-Based Access Control            | Security section        |
| DR      | Disaster Recovery                    | Risk Mitigation         |
| SME     | Subject Matter Expert                | Dependencies            |
| IA      | Information Architecture             | Timeline section        |
| CIS     | Center for Internet Security         | Security section        |
| TOTP    | Time-based One-Time Password         | Auth section            |
| AT      | Assistive Technology                 | UAT section             |
| SAST    | Static Application Security Testing  | QA section              |
| SCA     | Software Composition Analysis        | QA section              |
| DAST    | Dynamic Application Security Testing | QA section              |

### Category C: Quantitative Specificity

| ID           | Original                       | Replacement                                              |
| ------------ | ------------------------------ | -------------------------------------------------------- |
| [aa][ab][ac] | "majority" and "today"         | "23 of 25 (92%)" with explicit prototype date            |
| [ay]         | "stable core engineering team" | "1 full-time principal + 6 named contracted specialists" |
| [bv]         | "majority of requirements"     | "23 of 25 (92%) System Requirements Addendum items"      |

### Category D: Explanation Requests

| ID   | Item                           | Resolution                                                                                                |
| ---- | ------------------------------ | --------------------------------------------------------------------------------------------------------- |
| [g]  | "Monitoring what?"             | "availability/performance/security monitoring"                                                            |
| [h]  | "What kind of support?"        | "ticket-based support and incident response"                                                              |
| [s]  | Security model                 | Add specific controls: MFA, RBAC, org scoping, hash chain                                                 |
| [w]  | "comprehensive UX research"    | "6-week discovery and UX research phase (interviews, workflow mapping, usability testing)"                |
| [be] | "community liaison"            | "coordinates with PSOs to validate workflows, templates, and change-management"                           |
| [bf] | "checkpoint reviews"           | "formal checkpoint reviews at Discovery sign-off, UAT readiness, and Go-Live readiness"                   |
| [bg] | Maintenance notice             | "7 days advance notice; emergency on shorter notice with immediate viaSport notification"                 |
| [bh] | Patching cadence               | "monthly routine patching; critical patches within 48 hours"                                              |
| [bi] | "Infrastructure as Code"       | Define: "environment configuration stored as code for reproducibility and disaster recovery"              |
| [bj] | "Clear escalation"             | "60-minute acknowledgement, direct phone/text to delivery lead, 60-minute updates"                        |
| [bo] | "24/7 monitoring"              | "continuous monitoring of uptime/performance/security events"                                             |
| [bp] | "DR drills"                    | "quarterly disaster recovery exercises"                                                                   |
| [cb] | "query scoped to organization" | "server-side role-based access control and organization-level scoping (organization_id filtering)"        |
| [cc] | Multi-AZ failover              | "fail over automatically to a standby instance in a second Availability Zone within AWS Canada (Central)" |

### Category E: Prototype Positioning

| ID               | Issue                           | Resolution                                                                                                                                                                                                               |
| ---------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [x][y]           | "De-risked Delivery"            | Reframe positively: "Working Prototype for Evaluator Validation: Evaluators can log into a working prototype to validate key workflows"                                                                                  |
| [ar][as][at][au] | Prototype positioning paragraph | Replace with: "We provided a working prototype so evaluators can validate core workflows and requirements now, reducing uncertainty before award. After award, Discovery will confirm workflows and migration approach." |
| [ag][ah]         | "Synthetic data"                | "Only synthetic (simulated) data is used; no viaSport confidential data or personal information"                                                                                                                         |
| [ai]             | "Demo credentials"              | "Prototype evaluation credentials"                                                                                                                                                                                       |
| [ak][al][am][an] | Placeholder explanations        | Add explanatory notes that these are functional demos with content placeholders                                                                                                                                          |

### Category F: Team and Company Description

| ID       | Issue                          | Resolution                                                                                                                                                                                              |
| -------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [av]     | "incorporated technology firm" | "British Columbia limited company (Victoria, BC; incorporated 2025)"                                                                                                                                    |
| [aw][ax] | "principal-led"                | "single accountable delivery lead from proposal through delivery (no handoff between sales and implementation teams)"                                                                                   |
| [az]     | "Elastic specialist"           | "On-demand specialist capacity"                                                                                                                                                                         |
| [ba][bb] | Team size description          | List roles explicitly: "1 principal (Project Lead/Solution Architect) + 6 specialist advisors (UX/accessibility, sport operations/system navigation, technical advisory, security/compliance advisory)" |
| [bc][bd] | System Navigator role          | "Sports Operations and Governance Advisor/Expert; who also acts as a system navigator"                                                                                                                  |
| [bw][bx] | Team description               | "The team combines enterprise data engineering and security with direct amateur sport sector operations experience" (remove Soleil's name for consistency)                                              |

### Category G: Bios and Experience

| ID       | Issue                   | Resolution                                                                                                                   |
| -------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| [bs]     | Will Siddall bio        | Add 1-2 concrete project examples (pending Austin input)                                                                     |
| [bt][bu] | Michael Casinha bio     | Rewrite: "30 years of experience in DevOps, security, and infrastructure" (remove "seasoned veteran" and dotcom era details) |
| [bn]     | Delivery risk statement | "The prototype demonstrates that 23 of 25 requirements are already built"                                                    |

### Category H: Commercial and Service Level

| ID       | Issue                        | Resolution                                                                    |
| -------- | ---------------------------- | ----------------------------------------------------------------------------- |
| [ae][af] | "purchasing an outcome"      | "procuring a performance-based Service Level Agreement (SLA)"                 |
| [bk][bl] | "one-time web project"       | "managed, subscription-based platform service (not a one-time website build)" |
| [cf]     | "Service Credits (Optional)" | Remove "(Optional)" - make service credits standard                           |

### Category I: AI and Technical Content

| ID       | Issue                | Resolution                                                                                                                                                                                                                                  |
| -------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [cg]     | AI foundation intro  | Use suggested language: "AWT provides a pre-configured AI infrastructure within the Solstice platform, designed to enhance data quality and reporting efficiency without compromising viaSport's data residency or governance requirements" |
| [ch]     | AI governance        | Add: "AI features use AWS Bedrock hosted in AWS Canada (Central). We log per-request token usage, latency, and cost estimates for auditability and can provide usage reports to viaSport."                                                  |
| [ci]     | Responsible AI       | Reframe as "Responsible AI Governance" with documented governance controls                                                                                                                                                                  |
| [cj][ck] | Project Plan section | Review and tighten based on Google Doc rewrite                                                                                                                                                                                              |

---

## Part 2: Additional Stakeholder Comments (Not in Excel)

### 1. CORS and WAF Configuration

**Comment on:** "All APIs served over HTTPS (TLS 1.2+); no unencrypted endpoints"

**Required update:**

> Either configure the WAF to allow CORS preflight requests to pass through or explain why CORS isn't being used.

**Resolution:** Add clarification in SEC-AGG-002 and Data Warehousing sections:

```
CORS Configuration: The application uses a same-origin architecture where the frontend
and API are served from the same domain (CloudFront distribution), eliminating the need
for CORS preflight requests. AWS WAF rules are configured to allow standard HTTPS traffic
without requiring cross-origin exceptions.
```

### 2. KMS for Encryption in Transit

**Comment on:** "Encryption Keys - KMS - Key management for encryption at rest"

**Required update:**

> You can/should also use KMS sets for encryption in transit. You likely already are encrypting on the Lambda layer before data hits the db.

**Resolution:** Update encryption section to clarify:

```
Encryption layers:
- **At rest:** AES-256 via AWS KMS for RDS, S3, and backups
- **In transit:** TLS 1.2+ for all client-server and server-database connections
- **Application layer:** Sensitive fields (e.g., TOTP secrets) are encrypted using application-level symmetric encryption with secrets managed in AWS Secrets Manager
- **Processing controls:** PostgreSQL column-level encryption for highly sensitive fields
```

### 3. WAF IP Restriction

**Comment on:** "CloudFront edge security provides DDoS protection, security headers, and AWS WAF managed rules with rate limiting."

**Required update:**

> "AWS WAF and establish a rule set that restricts traffic to a list of IP addresses to enforce network isolation."

**Resolution:** Add to SEC-AGG-002:

```
For production environments requiring enhanced network isolation, AWS WAF can be configured
with IP-based allow lists to restrict access to authorized networks. The current configuration
uses rate limiting and managed rule sets for DDoS protection; IP allow lists can be added
if required by viaSport's security policy.
```

### 4. PIPA/PIPEDA Compliance Details

**Comment on:** SEC-AGG-003: Privacy and Regulatory Compliance

**Required updates:**

1. Clarify data minimization: "limited the collection of personal information to what is necessary for the identified purpose, ensuring data accuracy and completeness, and retaining information only as long as necessary"
2. Add security measures statement: "reasonable security measures to protect personal information from unauthorized access, collection, use, disclosure, copying, modification, disposal, or destruction"
3. Explicitly state: "compliant with PIPA and PIPEDA"

**Resolution:** Update SEC-AGG-003:

```
**How We Meet It:**
- Compliant with PIPA (Personal Information Protection Act, BC) and PIPEDA (federal)
- Data minimization: Collection limited to information necessary for identified purposes
- Data accuracy: Validation ensures completeness and correctness at submission
- Retention controls: Data retained only as long as necessary; configurable retention
  policies with legal hold support
- Security safeguards: Reasonable security measures protect personal information from
  unauthorized access, collection, use, disclosure, copying, modification, disposal,
  or destruction
- Data residency: Canadian hosting (ca-central-1) for all primary data stores
```

### 5. Privacy Officer Designation

**Comment on:** PIPA compliance

**Required update:**

> Under PIPA, organizations are required to designate a privacy officer responsible for ensuring compliance, and this individual must have access to all information related to personal data processing. Be prepared to designate one of your team members for this role.

**Resolution:** Add to Vendor Fit or SEC-AGG-003:

```
**Privacy Officer:** Austin Wallace Tech will designate a Privacy Officer responsible
for PIPA/PIPEDA compliance. This individual will have access to all information related
to personal data processing and will coordinate with viaSport on privacy impact
assessments, data handling procedures, and incident response.
```

### 6. Data Residency - Multi-AZ

**Comment on:** "Primary data stores... are hosted in AWS Canada (Central) (ca-central-1)"

**Required update:**

> For system availability/fault tolerance/scalability you will want to use 2 zones. ca-west-1 and ca-central-1. It's possible you can either just leave this info out or include both.

**Resolution:** Clarify Multi-AZ vs Multi-Region:

```
**Data Residency:**
All production data is hosted in AWS Canada (Central) (ca-central-1). Production
infrastructure uses Multi-AZ deployment within ca-central-1 for automatic failover
and high availability. This provides fault tolerance across multiple data centers
within the same Canadian region while maintaining data residency compliance.
```

---

## Part 3: Likely Future Comments (Proactive Fixes)

The Excel "Likely Future Comments" sheet identified 36 items reviewers would likely flag. After validating against current documents, the following are still present and should be fixed:

### UX/IA Jargon to Replace

| Term                         | Location                           | Plain Language Replacement                                        |
| ---------------------------- | ---------------------------------- | ----------------------------------------------------------------- |
| Contextual inquiry           | delivery-schedule:9, 47            | "user observation sessions in the work environment"               |
| Card sorting                 | delivery-schedule:10, 60           | "user-driven categorization exercises to inform navigation"       |
| Tree testing                 | delivery-schedule:10, 62           | "navigation validation testing"                                   |
| IA Approval                  | delivery-schedule:10, 64, 69       | "Information Architecture (IA) Approval" (spell out on first use) |
| Design Freeze                | delivery-schedule:11, 85, 116, 180 | "Design Finalization"                                             |
| Figma                        | delivery-schedule:78               | "interactive design prototype"                                    |
| System Usability Scale (SUS) | delivery-schedule:92               | Already spelled out - OK as is                                    |

### Acronyms to Spell Out (First Use)

| Acronym       | Location                   | Fix                                                         |
| ------------- | -------------------------- | ----------------------------------------------------------- |
| AT            | delivery-schedule:12, 94   | "Assistive Technology (AT)" on first use                    |
| SME           | delivery-schedule:170, 190 | "Subject Matter Expert (SME)" on first use                  |
| CIS Benchmark | appendices:14, 65, 79, 194 | "Center for Internet Security (CIS) Benchmark" on first use |

**Add to Glossary (Appendix G):**

- AT: Assistive Technology
- CIS: Center for Internet Security
- IA: Information Architecture
- SME: Subject Matter Expert
- SUS: System Usability Scale

### TBD Items to Finalize

| TBD Item                              | Location             | Resolution                                                                                                           |
| ------------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------- |
| "Project Start: TBD (contract award)" | delivery-schedule:20 | "Project Start: Upon contract award (estimated Q1 2026)"                                                             |
| "Final validation runs... (TBD)"      | appendices:113       | **Remove TBD** - Performance testing completed Jan 8, 2026 (k6 load test: p95=162ms, Lighthouse accessibility: 100%) |
| "Retention... (durations TBD)"        | appendices:188       | "Retention policies and legal holds (durations to be confirmed with viaSport during Discovery)"                      |
| "final run TBD"                       | data-warehousing:85  | **Remove TBD** - DR drill evidence available from sin-dev testing                                                    |

### ASCII Diagram

**Action:** Remove the ASCII architecture diagram from `appendices:59-97` completely. A formatted diagram will be provided separately in the v2 docs/Evidence Pack.

### Items NOT Requiring Changes

| Item                                          | Reason                                                              |
| --------------------------------------------- | ------------------------------------------------------------------- |
| Names in operational content (Soleil, Ruslan) | Keeping names is fine for consistency                               |
| Raw URL in Appendix A                         | Credentials delivered via Evaluator Access Pack - already clarified |
| Technology stack table                        | Keep as-is for technical evaluators                                 |
| Image filename captions                       | Will be addressed when evidence images are finalized                |

---

## Part 4: File-by-File Back-Propagation Plan

### Files to Update

| File                                                         | Primary Changes                                                                  |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| `01-executive-summary/final.md`                              | Style fixes, acronym expansion, quantitative specificity, prototype positioning  |
| `01-B-prototype-evaluation-guide/final.md`                   | Placeholder explanations, demo script rename, synthetic data clarification       |
| `02-vendor-fit/final.md`                                     | Company description, team bios, role clarifications, Privacy Officer designation |
| `03-solution-overview/final.md`                              | Tenancy model explanation, acronym expansion                                     |
| `03-service-approach/data-submission-reporting/final.md`     | UX jargon cleanup, acronym expansion                                             |
| `03-service-approach/data-warehousing/final.md`              | CORS/WAF explanation, Multi-AZ clarification, KMS details                        |
| `03-service-approach/data-migration/final.md`                | Acronym expansion                                                                |
| `03-service-approach/platform-design/final.md`               | Technical jargon cleanup                                                         |
| `03-service-approach/testing-qa/final.md`                    | SAST/DAST acronym expansion, AT expansion                                        |
| `03-service-approach/training-onboarding/final.md`           | Minor cleanup                                                                    |
| `03-service-approach/service-levels/final.md`                | Service credits (remove Optional), escalation details, DR exercises              |
| `04-system-requirements/00-compliance-crosswalk/final.md`    | Percentage specificity                                                           |
| `04-system-requirements/data-management-dm-agg/final.md`     | Minor cleanup                                                                    |
| `04-system-requirements/reporting-rp-agg/final.md`           | Minor cleanup                                                                    |
| `04-system-requirements/security-sec-agg/final.md`           | PIPA/PIPEDA compliance, CORS, WAF IP restriction, Privacy Officer                |
| `04-system-requirements/training-onboarding-to-agg/final.md` | Minor cleanup                                                                    |
| `04-system-requirements/user-interface-ui-agg/final.md`      | Minor cleanup                                                                    |
| `05-capabilities-experience/final.md`                        | AI governance language, team description                                         |
| `06-cost-value/final.md`                                     | Outcome language, pricing philosophy tightening                                  |
| `07-delivery-schedule/final.md`                              | UX jargon replacements, TBD fixes, acronym expansion                             |
| `08-appendices/final.md`                                     | Glossary additions, remove ASCII diagram, fix TBDs, Evidence Pack descriptions   |

---

## Part 5: Code Updates Required

### 1. No Immediate Code Changes Required

The reviewer comments are all documentation-focused. However, the following should be verified/documented in code:

| Area               | Verification Needed                                                       |
| ------------------ | ------------------------------------------------------------------------- |
| CORS Configuration | Verify same-origin architecture eliminates CORS needs                     |
| KMS Usage          | Verify TOTP secrets use application-level encryption with Secrets Manager |
| WAF Rules          | Document current rule configuration                                       |
| Privacy Officer    | Consider adding privacy officer field to organization settings (future)   |

### 2. Potential Future Enhancements

Based on comments, consider for roadmap:

- IP allow list configuration UI for WAF
- Privacy Officer designation in admin settings

---

## Part 6: Completed Updates (Jan 10, 2026)

### Files Modified

1. **`full-proposal-response-combined.md`** - Replaced with Draft RFP.md content from Google Docs

2. **`04-system-requirements/security-sec-agg/final.md`**
   - Added CORS and network architecture explanation to SEC-AGG-002
   - Added WAF IP restriction option to SEC-AGG-002
   - Rewrote SEC-AGG-003 with explicit PIPA/PIPEDA compliance
   - Added Privacy Officer designation
   - Added application-layer encryption details (corrected from KMS to Secrets Manager)

3. **`03-service-approach/data-warehousing/final.md`**
   - Updated KMS description to include application-layer encryption
   - Added Multi-AZ architecture clarification for data residency
   - Updated encryption standards with application-layer encryption
   - Updated regulatory alignment table with PIPA, security safeguards

---

## Codex Review Corrections (Jan 10)

### HIGH: KMS Application-Layer Encryption Claim - FIXED

**Issue:** Documentation claimed KMS-backed encryption for TOTP secrets, but Better Auth uses symmetric encryption with `BETTER_AUTH_SECRET` stored in AWS Secrets Manager.

**Resolution:** Updated language in both `security-sec-agg/final.md` and `data-warehousing/final.md`:

- Removed "KMS-backed keys" claim
- Changed to: "application-level symmetric encryption with secrets managed in AWS Secrets Manager"

### MEDIUM: CORS/WAF Architecture - VERIFIED CORRECT

**Issue:** Concern that same-origin claim conflicts with CORS headers.

**Verification:** The architecture IS same-origin:

- CloudFront serves both frontend AND API from the same distribution
- `src/lib/security/config.ts` CORS config is for Better Auth's internal handling only
- S3 bucket CORS is for development file uploads (localhost only)
- No separate API domain = no cross-origin requests

The claim is accurate. No change needed.

### MEDIUM: Data Residency Language - CLARIFIED

The documentation correctly states:

- All primary data in ca-central-1 (production)
- Multi-AZ within ca-central-1 for high availability

This is consistent and accurate.

---

## ca-west-1 Decision: NOT INCLUDED

**Decision:** Multi-AZ within ca-central-1 only. No multi-region.

**Rationale:**

- 20M rows is well within single-region PostgreSQL capability
- Multi-AZ provides 99.95%+ availability (meets SLA)
- Operational simplicity (single region to monitor/deploy)
- Cost-effective (multi-region would ~2x infrastructure cost)
- Adding ca-west-1 would add significant complexity for marginal benefit

---

## Execution Checklist

### Completed

- [x] Replace `full-proposal-response-combined.md` with Draft RFP.md content
- [x] Back-propagation to final.md files (done by Austin)
- [x] Update `03-service-approach/data-warehousing/final.md` with CORS/WAF/Multi-AZ/KMS
- [x] Update `04-system-requirements/security-sec-agg/final.md` with PIPA/PIPEDA + Privacy Officer

### Remaining (from Draft RFP Google Doc back-propagation)

- [ ] Update `01-executive-summary/final.md`:
  - [ ] Replace "batteries included" with integrated delivery language
  - [ ] Replace "standup fee" with "one-time implementation fee"
  - [ ] Replace "majority...today" with "23 of 25 (92%)"
  - [ ] Replace "purchasing an outcome" with SLA language
  - [ ] Reframe "De-risked Delivery" positively
- [ ] Update `01-B-prototype-evaluation-guide/final.md`:
  - [ ] Replace "What to Ignore" heading
  - [ ] Replace "15-Minute Demo Script" with "Evaluator Walkthrough"
  - [ ] Rewrite prototype positioning paragraph
- [ ] Update `02-vendor-fit/final.md`:
  - [ ] Update company description (BC limited company)
  - [ ] Update Soleil's role to "Sports Operations and Governance Advisor/Expert"
  - [ ] Rewrite Michael Casinha bio
- [ ] Update `07-delivery-schedule/final.md`:
  - [ ] Replace UX jargon (contextual inquiry, card sorting, tree testing, etc.)
  - [ ] Fix TBD items
  - [ ] Add acronym expansions (IA, AT, SME)
- [ ] Update `08-appendices/final.md`:
  - [ ] Remove ASCII architecture diagram
  - [ ] Fix TBD items (retention, performance runs)
  - [ ] Add missing acronyms to glossary
- [ ] Update `03-service-approach/service-levels/final.md`:
  - [ ] Remove "(Optional)" from service credits
- [ ] Update `05-capabilities-experience/final.md`:
  - [ ] Add AI governance language
- [ ] Regenerate combined document after all updates

---

## Notes for Austin

1. **Will Siddall bio** - Reviewer asked for 1-2 concrete project examples. Please provide client names (if allowed) and what was delivered.

2. **Privacy Officer** - Need to confirm who will be designated as Privacy Officer for PIPA compliance.

3. **IP Allow Lists** - Confirm if viaSport requires IP-based WAF restrictions or if rate limiting + managed rules are sufficient.

4. **Service Credits** - Reviewer recommended making service credits mandatory (not optional) to be more competitive. Please confirm this is acceptable.

5. **Performance Numbers** - Verified. The k6 load test from Jan 8 shows p95=162ms (better than the 250ms in Appendix C). The Lighthouse Lambda tests show 97-100% performance (close to the 93% in Appendix C). The lower CloudFront scores (63-67%) reflect edge/cold-start latency, not application performance. Accessibility is 95-100% across all tests.

6. **Soleil Heaney Title** - Updated throughout to "Sports Operations and Governance Advisor/Expert; who also acts as a system navigator"
