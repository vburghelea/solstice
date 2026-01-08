# Comprehensive RFP Update Guide

This document consolidates all peer feedback, expert comments, and implementation guidance for updating the Strength in Numbers RFP response.

---

## Table of Contents

1. [Executive Summary of Required Changes](#executive-summary-of-required-changes)
2. [What Peer Comments Are Really Saying](#what-peer-comments-are-really-saying)
3. [High-Priority Changes (P0)](#high-priority-changes-p0)
4. [Canonical Wording Standards](#canonical-wording-standards)
5. [Global Edits (Apply Everywhere)](#global-edits-apply-everywhere)
6. [File-by-File Update Checklist](#file-by-file-update-checklist)
7. [Copy-Paste Rewrites for Key Sections](#copy-paste-rewrites-for-key-sections)
8. [Gaps We Haven't Addressed Yet](#gaps-we-havent-addressed-yet)
9. [Guardrails and Constraints](#guardrails-and-constraints)
10. [Final QA Checklist](#final-qa-checklist)
11. [Assembly Instructions](#assembly-instructions)

---

## Executive Summary of Required Changes

**19 final.md files** exist with strong technical content. The core problem is **presentation, navigation, and missing "procurement signals"** that evaluators expect.

### Critical Gaps Summary

| Gap                                                         | Severity | Files Affected                                     |
| ----------------------------------------------------------- | -------- | -------------------------------------------------- |
| Section references don't exist ("Section 01-B")             | P0       | 01-executive-summary                               |
| Will's title wrong ("Senior Developer")                     | P0       | 3+ files                                           |
| Evaluator nav map uses folder names                         | P0       | 01-executive-summary                               |
| No shared responsibility model                              | P0       | 02-vendor-fit, security-sec-agg                    |
| SEC-AGG-002/003 not in demo crosswalk                       | P0       | 01-B-prototype-evaluation-guide                    |
| Security testing is "Pre-release" only                      | P0       | testing-qa                                         |
| No cutover plan                                             | P0       | data-migration                                     |
| Data residency claim is risky                               | P1       | 4+ files                                           |
| Data Catalog undefined                                      | P1       | data-management-dm-agg                             |
| Security Expert TBD                                         | P1       | 02-vendor-fit, appendices                          |
| ~~CloudTrail listed but not provisioned~~                   | ~~P1~~   | ~~platform-design, appendices~~ (FIXED 2026-01-06) |
| ~~Security events with CloudWatch metrics not implemented~~ | ~~P1~~   | ~~security-sec-agg~~ (FIXED 2026-01-06)            |
| Secrets storage references wrong service                    | P1       | platform-design, data-warehousing, appendices      |
| Performance metrics lack linked artifacts                   | P1       | testing-qa, appendices                             |
| Evidence paths are internal repo paths                      | P2       | Multiple                                           |
| No OWASP Top 10 mapping                                     | P2       | testing-qa                                         |
| Tool costs unclear                                          | P2       | 06-cost-value                                      |

**Note**: Both CloudTrail and security metrics have been implemented (2026-01-06):

- **CloudTrail**: Management events trail with CIS Benchmark alarms (root usage, IAM changes, security group changes, etc.) enabled for prod/perf/uat stages in `sst.config.ts`. Logs to S3 with 7-year retention (prod) or 1-year retention (perf/uat) and CloudWatch Logs for alerting.
- **Security metrics**: High-severity events (`account_locked`, `account_flagged`, `login_anomaly`) emit CloudWatch metrics to `Solstice/App` namespace with `EventType` and `Severity` dimensions.

**Note**: UAT environment (`sin-uat`) is now deployed (2026-01-06):

- Dedicated environment for viaSport evaluator access with production-like configuration
- CloudTrail with CIS alarms enabled (same as prod/perf)
- Demo credentials will be provided in Appendix A for evaluator access
- Canonical stages: `sin-dev`, `sin-perf`, `sin-uat`, `sin-prod`

---

## What Peer Comments Are Really Saying

### 1. Navigation and Cross-Referencing is Currently Brittle

Peers flagged that "Section 01-B / 04 / 06 / 07" references do not exist in the compiled doc, and that the "Evaluator Navigation Map" uses folder-ish names instead of the actual header titles.

**Why this matters:** Evaluators will skim, click around, and sanity-check internal consistency. If the doc feels hard to navigate, they'll assume delivery will be hard to manage.

### 2. Security Story is Strong, but Presentation is Missing Key "Procurement Signals"

Security reviewers are asking for:

- A clear "shared responsibility model" statement (what AWS guarantees vs what you implement)
- A more explicit "secure by design" section, not just a list of controls
- A clearer vulnerability testing plan (SAST/SCA/DAST cadence, OWASP mapping)
- Better demo alignment: right now the 15-minute demo and crosswalk do not explicitly validate SEC-AGG-003 (privacy/compliance) and are light on SEC-AGG-002 demo evidence

### 3. Structure and Perceived Credibility

One reviewer thinks the response is "jumbled and repetitive" and recommends:

- Cleaner outline / table of contents with short overviews
- Less resume-like content in the main body
- Make the org feel like a delivery team (even if you're principal-led) rather than "one person with helpers"

That doesn't mean pretending to be bigger than you are. It means presenting delivery capacity, continuity, and service operations in a way procurement expects.

### 4. Missing a Real Cutover / Transition Plan

This is a legit gap: you describe migration and UAT, but not "what happens the week of go-live," including parallel run, data freeze, downtime expectations, comms, rollback criteria, and hypercare.

### 5. The "Data Catalog" Concept is Unclear

If an expert peer can't quickly understand it, evaluators won't either. You need one crisp paragraph that defines what it is and what it is not.

### 6. The Proposal Reads Like Developer's Notes

The folder-name references, internal paths, and jumbled structure signal "work in progress" not "polished submission."

### 7. You Look Like One Person with TBDs

Adding Parul's bio and changing Will to "Technical Lead" signals a real team. The "train-the-trainer" and "continuity of services" sections help but the TBDs undercut credibility.

---

## High-Priority Changes (P0)

### P0-1: Fix Navigation and Section References

**Decision made:** We will **not** add header numbering. References must use exact header titles only.

Replace all "see Section XX" references with exact header titles:

| Current            | Replace With                                                              |
| ------------------ | ------------------------------------------------------------------------- |
| "see Section 01-B" | "See **Prototype Evaluation Guide** and **Appendix A: Live Demo Access**" |
| "see Section 04"   | "See **System Requirements Compliance Crosswalk**"                        |
| "see Section 07"   | "See **Project Plan, Timeline, and Delivery Schedule**"                   |
| "see Section 06"   | "See **Cost and Value of Services**"                                      |

In the "Evaluator Navigation Map", replace repo/folder names with actual header titles verbatim.

### P0-2: Update Will's Role Title Everywhere

Change "Senior Developer" to **"Technical Lead"** in:

- Executive Summary "Proposed Team" table
- Capabilities/partners table
- Appendix F biography heading and first sentence

### P0-3: Add "Security and Privacy by Design" Section

You already have strong controls, but they're spread across the doc. Add a short section after "Key Differentiators" in vendor-fit (or make it Differentiator #6).

### P0-4: Make Security Testing Credible and Continuous

Your current testing table implies security is mostly a late-stage activity. That's a red flag for security reviewers.

Update to:

- SAST/SCA every commit
- DAST on a schedule and pre-release
- Independent pen test pre go-live and annually

**Important:** Tool names should be examples unless already implemented with evidence. Don't overcommit to specific vendors (SonarQube/Snyk/Burp) unless you can back them up.

### P0-5: Add a Real Cutover Plan

Add a new "Cutover and Change Management" subsection under data-migration or delivery-schedule.

### P0-6: Update Demo Crosswalk for SEC-AGG-002 and SEC-AGG-003

Add demo steps and crosswalk rows for:

- SEC-AGG-002: Monitoring and threat detection
- SEC-AGG-003: Privacy and compliance controls

---

## Canonical Wording Standards

### Residency Standard Language (Use Everywhere)

> Primary data stores (RDS PostgreSQL, S3 object storage, backups, and audit archives) are hosted in AWS Canada (Central) (ca-central-1). Authenticated content is configured to avoid edge caching. Email notifications are delivered to recipients and may traverse external networks.

**Do not use:**

- "No data leaves Canadian jurisdiction"
- "No data is stored or processed outside Canadian jurisdiction"

### AWS Compliance / SOC References

When referencing SOC reports, say:

> "AWS compliance reports (SOC, ISO) available via AWS Artifact upon request"

**Do not say:**

- "our system is SOC 2 certified"
- "viaSport automatically inherits SOC 2"

AWS's shared responsibility model language is real and citeable: https://aws.amazon.com/compliance/shared-responsibility-model/

### OWASP References

Use OWASP Top 10:2025 terminology (A01:2025 through A10:2025). Do not reference older numbering unless needed.

Reference: https://owasp.org/Top10/2025/0x00_2025-Introduction/

### Secrets Storage

SST secrets are managed in AWS Secrets Manager and injected at deploy time.
Do not refer to SSM Parameter Store unless you explicitly use it for those
secrets.

### Performance Evidence

Performance claims should be backed by artifacts in:

- `performance/PERFORMANCE-REPORT.md`
- `performance/reports/20260102-sin-perf-summary.md`
- `docs/tickets/PERF-001-performance-optimizations.md`

### Solution Description

Use "purpose-built, reliable, and secure" (with Oxford comma for consistency).

---

## Global Edits (Apply Everywhere)

1. **Replace Will Siddal role title** with "Technical Lead" in every section and bio

2. **Replace residency claims** with the canonical safer wording above

3. **Replace internal evidence paths** (`docs/sin-rfp/...` and `src/...`) with appendix references or "Evidence Pack (Attachment)"
   - Keep code/evidence paths only in Evidence Pack appendix if needed
   - Don't reference appendices that don't exist yet

4. **Replace all "Section XX" references** with exact header titles

5. **Remove em dashes** (use commas, periods, or parentheses instead per WRITING-STYLE-GUIDE.md)

6. **CloudTrail and security metrics are now implemented** (2026-01-06). RFP claims can reference actual infrastructure.

---

## File-by-File Update Checklist

### `01-executive-summary/final.md`

- [ ] **[a-d]** Replace "Section XX" references with actual header titles
- [ ] **[e]** Change "Senior Developer" to "Technical Lead" for Will Siddal
- [ ] **[f-m]** Update Evaluator Navigation Map to use actual section titles instead of folder names
- [ ] Add a short table of contents with 1-2 line summaries after the opening paragraph
- [ ] Update the Security row to mention monitoring and lockout controls and use safer residency wording
- [ ] Update the Proposed Team table
- [ ] Add sentence: "Specialist roles provide security review, penetration testing coordination, and UX/accessibility validation during delivery."

**Constraint:** TOC must stay within exec summary page limit (RFP asks for <=3 pages). If it risks overflow, move TOC immediately after Executive Summary.

### `01-B-prototype-evaluation-guide/final.md`

- [ ] **[n-o]** Add AWS shared responsibility model context; consider GuardDuty demo for SEC-AGG-002
- [ ] **[p]** Add row for SEC-AGG-003 (Canadian data residency) with demo path
- [ ] **[q-r]** Add SEC-AGG-002 to crosswalk
- [ ] Add demo steps 8-9 to 15-Minute Demo Script
- [ ] Add paragraph: "Where evidence is platform-level (for example AWS compliance reports), we provide supporting artifacts through AWS Artifact upon request."
- [ ] Update any residency phrasing to match the safer wording standard

### `02-vendor-fit/final.md`

- [ ] **[s]** Add Parul Kharub as Security Expert (see bio below)
- [ ] **[t]** Clarify that automated testing includes security vulnerability testing
- [ ] **[u]** Add "reliable and secure" to solution description
- [ ] **[v]** Add "6. Security and Privacy by Design" as a Key Differentiator
- [ ] **[w-z]** Add new "Security and Privacy by Design" section (see copy-paste section below)
- [ ] Update Proposed Solution Statement to "purpose-built, reliable, and secure"
- [ ] Replace Will Siddal title and shorten bios to 3-5 lines each
- [ ] Adjust the data residency differentiator to use the safer wording
- [ ] Reduce resume duplication by moving full bios to Appendix F
- [ ] Replace the accessibility evidence path with an appendix reference

### `03-service-approach/data-submission-reporting/final.md`

- [ ] Replace the accessibility evidence path with an appendix reference

### `03-service-approach/data-warehousing/final.md`

- [ ] Replace data residency language with the safer phrasing
- [ ] Add a short shared responsibility statement
- [ ] Replace evidence paths with appendix references
- [ ] Replace secrets storage wording with AWS Secrets Manager (SST secrets)

### `03-service-approach/data-migration/final.md`

- [ ] Add a Cutover and Change Management subsection (see copy-paste section below)
- [ ] Add a short note on downtime and parallel run expectations
- [ ] Update cross references to use exact header titles

### `03-service-approach/platform-design/final.md`

- [ ] Review for data residency phrasing and align with safer wording if needed
- [ ] Replace secrets storage wording with AWS Secrets Manager (SST secrets)
- [x] ~~Confirm CloudTrail is actually enabled before stating it is in use~~ (FIXED 2026-01-06: CloudTrail with CIS alarms added to sst.config.ts)

### `03-service-approach/testing-qa/final.md`

- [ ] **[aa]** Add specific security tools as examples (not commitments)
- [ ] **[ab]** Expand security testing scope to include "application vulnerabilities"
- [ ] **[ac]** Change frequency from "Pre-release" to "Every commit" for automated + add continuous monitoring
- [ ] **[ad]** Add OWASP Top 10:2025 mapping to security testing section
- [ ] Replace the Testing Layers table with the updated security tooling and frequency
- [ ] Add continuous monitoring language
- [ ] Replace evidence paths with appendix references
- [ ] Replace performance tables with values from the latest performance artifacts

### `03-service-approach/training-onboarding/final.md`

- [ ] Review for data residency phrasing and align with safer wording if needed

### `04-system-requirements/00-compliance-crosswalk/final.md`

- [ ] Ensure SEC-AGG-003 wording aligns with safer residency language

### `04-system-requirements/data-management-dm-agg/final.md`

- [ ] Add a short definition for the Data Catalog and what it is not (see copy-paste section)
- [ ] Add a discovery note on structured data vs document-centric reporting
- [ ] Replace evidence paths with appendix references

### `04-system-requirements/reporting-rp-agg/final.md`

- [ ] Replace evidence paths with appendix references

### `04-system-requirements/security-sec-agg/final.md`

- [ ] **[ae]** Add shared responsibility model language and AWS built-in control summary
- [ ] Replace data residency language with safer wording
- [ ] Replace evidence paths with appendix references
- [x] ~~Remove or qualify the CloudWatch metrics claim unless metrics are emitted~~ (FIXED 2026-01-06: High-severity events now emit CloudWatch metrics)

### `04-system-requirements/training-onboarding-to-agg/final.md`

- [ ] Replace evidence paths with appendix references

### `04-system-requirements/user-interface-ui-agg/final.md`

- [ ] Replace evidence paths with appendix references

### `05-capabilities-experience/final.md`

- [ ] Update Will Siddal title to "Technical Lead"
- [ ] Reduce resume repetition by focusing on case studies and delivery capacity
- [ ] Align team structure wording with the updated Security Expert role
- [x] ~~Expand AI section with foundation layer, feature candidates, and prioritization approach~~ (UPDATED 2026-01-07: Added AI Enablement Foundation, AI Feature Candidates table, Prioritization Approach with UX research, and expanded Responsible AI table)

### `06-cost-value/final.md`

- [ ] **[af]** Add a Security Tooling line item under Annual Operations
- [ ] Add a clarifying sentence that routine scanning is included and independent pen testing is included pre go-live or priced as an annual add-on

### `07-delivery-schedule/final.md`

- [ ] Add a short reference to the new cutover plan section
- [ ] Add explicit mention of data freeze and hypercare timing

### `08-appendices/final.md`

- [ ] **Update Appendix A with UAT environment** (see copy-paste section for full rewrite):
  - Update Demo URL to `sin-uat` CloudFront URL
  - Add "Environment: sin-uat (User Acceptance Testing)" note
  - Add monitoring note: "CloudTrail with CIS Benchmark alarms"
  - Add demo steps 8-9 for SEC-AGG-002 and SEC-AGG-003
- [ ] Update data residency language in Appendix D
- [ ] Replace Will Siddal title and add Security Expert bio in Appendix F
- [ ] Add an Evidence Pack appendix with 2-3 key screenshots, then reference it from the body sections
- [ ] Replace secrets storage wording with AWS Secrets Manager (SST secrets)
- [ ] Update performance tables with values from the latest performance artifacts

---

## Copy-Paste Rewrites for Key Sections

### Appendix A: Live Demo Access (UAT Environment)

The `sin-uat` environment is deployed and available for viaSport evaluator access. Update Appendix A to use the UAT URL and credentials.

```markdown
## Appendix A: Live Demo Access

A working prototype is available for viaSport evaluation in a dedicated UAT environment. Credentials are listed below to reduce reviewer friction.

**Demo URL:** https://sin-uat.solstice.viasport.ca (or CloudFront URL TBD)

**Environment:** `sin-uat` (User Acceptance Testing environment with production-like configuration)

### Data and Monitoring

- Synthetic data only, no confidential viaSport data
- Environment monitoring enabled (CloudTrail with CIS Benchmark alarms)
- Production-equivalent security controls

### Test Accounts

| Persona        | Email                      | Password        | Access Level                                      |
| -------------- | -------------------------- | --------------- | ------------------------------------------------- |
| viaSport Staff | viasport-staff@example.com | testpassword123 | viaSport admin with full org access (MFA enabled) |
| PSO Admin      | pso-admin@example.com      | testpassword123 | BC Hockey organization admin                      |
| Club Reporter  | club-reporter@example.com  | testpassword123 | North Shore Club reporter                         |
| Viewer         | member@example.com         | testpassword123 | View-only access                                  |

**Note:** MFA-enabled accounts use TOTP authentication. Other demo accounts have MFA disabled for faster evaluation.

### Suggested Demo Walkthrough

1. Login as viaSport Staff to see full admin capabilities
2. Explore the role-based dashboard
3. Create a test form using the form builder
4. Submit data using the form
5. View submission in the analytics platform
6. Build a pivot table and export to CSV
7. Review audit logs for recent actions
8. Security Dashboard: review recent security events and account lockouts (SEC-AGG-002)
9. Privacy and Retention: view retention policies and legal hold capabilities (SEC-AGG-003)
10. Explore help center and guided walkthroughs
```

### Executive Summary: At a Glance Table (Fixed References)

```markdown
| Dimension    | Status                                                                                                            |
| ------------ | ----------------------------------------------------------------------------------------------------------------- |
| Prototype    | Working system available for evaluation (See **Prototype Evaluation Guide** and **Appendix A: Live Demo Access**) |
| Requirements | 22 of 25 built today; 3 partial pending viaSport inputs (See **System Requirements Compliance Crosswalk**)        |
| Data Used    | Synthetic only, no confidential viaSport data                                                                     |
| Performance  | 20.1M rows, sub-250ms p95 latency, final validation run TBD                                                       |
| Security     | MFA, RBAC, audit chain, monitoring and lockout controls, Canadian hosting region                                  |
| Timeline     | 30 weeks from contract to full rollout (See **Project Plan, Timeline, and Delivery Schedule**)                    |
| Investment   | $600K implementation + $200K/year operations (See **Cost and Value of Services**)                                 |
```

### Executive Summary: Proposed Team Table

```markdown
| Role                         | Team Member    |
| ---------------------------- | -------------- |
| Project Lead / Data Engineer | Austin Wallace |
| Technical Lead               | Will Siddal    |
| Security Expert              | Parul Kharub   |
| UX Designer                  | TBD            |

Specialist roles provide security review, penetration testing coordination, and UX/accessibility validation during delivery.
```

### Executive Summary: Evaluator Navigation Map (Fixed)

```markdown
| RFP Evaluation Criterion            | Our Response Section                                                                                                 | Notes                                       |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| Vendor Fit to viaSport's Needs      | **Vendor Fit to viaSport's Needs**                                                                                   | Company profile, team, differentiators      |
| Service Approach and Responsiveness | **Service Approach: Data Submission and Reporting Web Portal** through **Service Approach: Training and Onboarding** | Methodology for each scope item             |
| System Requirements Addendum        | **System Requirements Compliance Crosswalk** and detailed requirement sections                                       | Requirement-by-requirement compliance       |
| Capabilities and Experience         | **Capabilities and Experience**                                                                                      | Case studies, automation/AI approach        |
| Cost and Value                      | **Cost and Value of Services**                                                                                       | Pricing, breakdown, change management       |
| Timeline and Delivery Schedule      | **Project Plan, Timeline, and Delivery Schedule**                                                                    | Milestones, risks, dependencies             |
| Prototype Validation                | **Prototype Evaluation Guide** and **Appendices**                                                                    | Demo access, performance/security summaries |
```

### Prototype Evaluation Guide: Additional Demo Steps

Add to 15-Minute Demo Script (after Audit Logs):

```markdown
8. Security Dashboard, review recent security events and account lockouts (SEC-AGG-002)
9. Privacy and Retention, view retention policies and legal hold capabilities (SEC-AGG-003)
```

### Prototype Evaluation Guide: Additional Crosswalk Rows

```markdown
| To validate...                  | Requirement | Demo path                                                             |
| ------------------------------- | ----------- | --------------------------------------------------------------------- |
| Monitoring and threat detection | SEC-AGG-002 | Admin -> Security -> Events / Account Locks                           |
| Privacy and compliance controls | SEC-AGG-003 | Admin -> Privacy -> Retention Policies / Legal Holds, plus Appendix D |
```

Add paragraph after crosswalk:

> Where evidence is platform-level (for example AWS compliance reports), we provide supporting artifacts through AWS Artifact and standard AWS compliance documentation upon request.

### Vendor Fit: Security Expert Bio (Parul Kharub)

Short version for main body (3-5 lines):

```markdown
### Parul Kharub, Senior Cybersecurity and Digital Risk Advisor

Parul Kharub is a Vancouver-based Cybersecurity and Risk Leader with over 16 years of experience driving enterprise-scale digital transformations. She offers viaSport deep expertise in securing cloud-hosted ecosystems while ensuring strict adherence to Canadian privacy statutes like PIPEDA and PIPA.
```

Full version for Appendix F:

```markdown
### Parul Kharub, Senior Cybersecurity and Digital Risk Advisor

Parul Kharub is a Vancouver-based Cybersecurity and Risk Leader with over 16 years of experience driving enterprise-scale digital transformations and protecting $1 billion in asset value with zero material breaches. A trusted advisor to executives, she specializes in aligning complex security architectures with business strategy to deliver resilient, audit-ready environments.

She offers viaSport deep expertise in securing cloud-hosted ecosystems while ensuring strict adherence to Canadian privacy statutes like PIPEDA and PIPA, and helping the application achieve certifications like SOC II Type 2 and ISO 27001.

**Key Experience Highlights:**

- **Secure Transformation Leadership (Teck Resources Limited):** Directed security architecture and governance for a $1B digital transformation, ensuring secure product development, legacy-to-cloud migration and overall robust security controls.
- **Canadian Regulatory Expertise (Public Sector):** Managed large-scale cloud transformations in the Canadian public sector, aligning over 350 security controls with PIPEDA and ISO 27001 standards.
- **Big 4 Consulting (Deloitte):** As a strategic partner in building a global Application Security practice across 43 countries, Parul spearheaded the development of a DevSecOps practice that embedded "Shift Left" security from requirements to production into the CI/CD pipeline.
```

### Vendor Fit: New "Security and Privacy by Design" Section

Insert after "Key Differentiators" (as Differentiator #6 or its own section):

```markdown
### 6. Security and Privacy by Design

Security and privacy are built into delivery from discovery through operations. The security model follows the AWS shared responsibility approach: AWS secures the underlying cloud infrastructure, and we implement and operate the application controls, configuration, and monitoring required for viaSport's use case.

Our approach aligns with OWASP application security practices, including the OWASP Top 10 and OWASP ASVS as a verification framework.

**Security by Design Approach**

- **Security requirements up front:** Define security and privacy requirements during discovery (access control, retention, audit, monitoring), then validate them in the prototype and UAT.
- **Threat modeling:** Run threat modeling for the core workflows (authentication, imports, exports, delegated access) and track mitigations as delivery items.
- **Shift-left DevSecOps:** Automated code and dependency scanning in CI so issues are found before deployment.
- **Zero-trust access model:** MFA, RBAC, and organization scoping enforced server-side for all data access.
- **Data protection and Canadian hosting region:** Encrypt data in transit and at rest, and host primary data stores in AWS Canada (Central).
- **Monitoring and anomaly response:** Detect suspicious authentication patterns, alert administrators, and apply automated lockout controls.
- **Immutable audit and integrity:** Tamper-evident audit logging and retention controls to support forensic review and regulatory reporting.
```

### Testing and QA: Updated Testing Layers Table

```markdown
| Layer                  | Tooling (examples)                                       | Purpose                                  | Frequency                                      |
| ---------------------- | -------------------------------------------------------- | ---------------------------------------- | ---------------------------------------------- |
| Unit and Integration   | Vitest + Testing Library                                 | Component and function testing           | Every commit                                   |
| End-to-End             | Playwright                                               | Full user flow testing                   | Every commit                                   |
| Property-Based         | fast-check                                               | Access control and audit integrity       | Every commit                                   |
| Performance            | Lighthouse, k6                                           | Load testing and Core Web Vitals         | Pre-release and before major reporting periods |
| Security (Automated)   | SAST + SCA (for example CodeQL/Semgrep, Dependabot/Snyk) | Find code and dependency vulnerabilities | Every commit                                   |
| Security (Dynamic)     | DAST (for example OWASP ZAP)                             | Detect runtime web vulnerabilities       | Scheduled and pre-release                      |
| Security (Independent) | Third-party penetration test                             | Independent validation                   | Pre go-live (and annually if selected)         |
```

### Testing and QA: Security Testing Subsection Rewrite

```markdown
#### Security Testing

Security testing covers authentication, authorization, and audit integrity, plus application vulnerability testing.

**Automated security checks**

- SAST and dependency scanning run in CI on each change to identify common vulnerabilities early.
- DAST runs against a staging environment on a schedule and again prior to major releases.

**OWASP Top 10:2025 coverage**

Our security testing program maps to the OWASP Top 10 categories:

- **A01: Broken Access Control** - Attackers bypassing authorization to access other users' data (Critical for SEC-AGG-001)
- **A02: Security Misconfiguration** - Unsecured S3 buckets, default passwords, or overly permissive cloud settings
- **A03: Software Supply Chain Failures** - Vulnerabilities in 3rd party libraries or compromised build pipeline
- **A04: Cryptographic Failures** - Weak encryption or plain-text data storage (Directly impacts PIPEDA compliance)
- **A05: Injection** - SQL, NoSQL, or Command Injection
- **A06: Insecure Design** - Architectural flaws that can't be fixed by coding
- **A07: Authentication Failures** - Weak MFA, credential stuffing, or session hijacking (Directly impacts SEC-AGG-001)
- **A08: Software and Data Integrity Failures** - Tampering with updates or data without verification
- **A09: Security Logging and Alerting Failures** - Lack of real-time monitoring (Directly impacts SEC-AGG-002/004)
- **A10: Mishandling of Exceptional Conditions** - Error messages that leak sensitive info or systems that "fail open"

**Operational monitoring**

In production, application-level detection is combined with AWS monitoring and logging (CloudWatch/CloudTrail) to support detection, alerting, and incident response.
```

### Data Migration: Cutover and Change Management Section

```markdown
## Cutover and Change Management

A successful migration includes technical data movement and a managed transition for viaSport staff and PSOs.

### Cutover Approach (Recommended)

| Step                  | Description                                                 | Outcome                                              |
| --------------------- | ----------------------------------------------------------- | ---------------------------------------------------- |
| Pilot org migration   | Migrate one PSO end-to-end, validate workflow and reporting | Validated templates, mappings, and training approach |
| Migration waves       | Migrate remaining orgs in planned cohorts                   | Manageable support load, reduced risk                |
| Data freeze window    | Short read-only or limited update window on legacy systems  | Prevents last-minute divergence                      |
| Final delta migration | Import changes since last full migration                    | Production data is current                           |
| Go-live               | Solstice becomes system of record, support team on standby  | Controlled launch                                    |
| Hypercare             | Elevated support and daily check-ins for a defined period   | Fast issue resolution, adoption support              |
| Rollback plan         | Predefined rollback criteria and steps                      | Risk control if a blocking issue occurs              |

### Sector Communication and Training

- Publish a cutover calendar (freeze window, go-live date, support contacts).
- Provide role-based quick-start guides and live training sessions.
- Use a ticketing workflow and escalation path during hypercare.

### Downtime and Continuity Expectations

- Document expected downtime (if any) during final cutover.
- If parallel run is required, define duration and responsibilities (who submits where, what is source of truth).
```

### Data Management: Data Catalog Definition

Add to DM-AGG-003:

```markdown
### Data Catalog (What It Is)

In Solstice, the Data Catalog is a searchable inventory of forms, fields, templates, reports, and saved analytics views, with permission-aware access. It helps users discover what data exists and where it is used. It is not a document management system. Uploaded files are stored in S3 and referenced from submissions and catalog entries through secure links and access controls.

During discovery, we will confirm the proportion of structured submission data versus document-centric reporting and adjust catalog tagging and search priorities accordingly.
```

### Cost Section: Security Tooling Addition

Add to Annual Operations table:

```markdown
| Category         | Scope                                                                                               |
| ---------------- | --------------------------------------------------------------------------------------------------- |
| Security Tooling | Automated vulnerability scanning (SAST/SCA) and scheduled DAST execution, plus remediation workflow |
```

Add clarifying sentence below the operations table:

> Security tooling and routine scanning effort are included in the annual operations fee. Independent penetration testing is included as a delivery milestone pre go-live (or can be priced as an annual add-on if viaSport prefers recurring third-party testing).

---

## Gaps We Haven't Addressed Yet

### 1. Cutover and Change Management Plan

This is a legit gap. See copy-paste section above for the recommended addition.

### 2. Data Catalog Definition

See copy-paste section above.

### 3. Evidence Pack Appendix

Define what "2-3 key screenshots" are:

1. **Prototype dashboard** (role-based view showing admin vs reporter)
2. **Audit log + integrity verification** (hash chain check)
3. **Import wizard preview/validation** (showing mapping and error handling)

These should live in a new **Appendix I: Evidence Pack** and be referenced from body sections instead of internal file paths.

---

## Guardrails and Constraints

### Page Limits

- Executive summary must be <=3 pages per RFP requirement
- If TOC pushes it over, move TOC immediately after Executive Summary

### Tool Claims

- Tool names should be **examples** unless already implemented with evidence
- Use "for example" before tool lists: "SAST + SCA (for example CodeQL/Semgrep, Dependabot/Snyk)"

### AWS / SOC Claims

- AWS compliance reports are AWS-level, not application-level
- Never say "our system is SOC 2 certified"
- Always say "AWS compliance reports (SOC, ISO) available via AWS Artifact upon request"

### Evidence Paths

- Remove all `docs/sin-rfp/...` and `src/...` file references from body text
- Replace with appendix references or "Evidence Pack (Attachment)"
- Don't reference appendices that don't exist yet

### Style Guide Compliance

Per `WRITING-STYLE-GUIDE.md`:

- Never use em dashes (--)
- Use commas, periods, or parentheses instead
- Prefer direct, concrete statements
- Avoid flowery adjectives or marketing superlatives

---

## Final QA Checklist

Run these searches before finalizing:

```
Search for broken references:     "Section "
Search for internal paths:        "docs/sin-rfp/" and "src/"
Search for em dashes:             "—"
Search for risky residency:       "No data leaves" and "jurisdiction"
Search for tool over-claims:      "SOC 2 certified"
Search for wrong title:           "Senior Developer"
Search for CloudTrail claims:     "CloudTrail"
Search for CloudWatch metrics:    "CloudWatch metrics"
Search for Parameter Store:       "SSM Parameter Store"
Search for perf claims:           "p95 latency" and "Lighthouse"
```

### Manual Checks

- [ ] All cross-references use exact header titles
- [ ] No internal file paths remain in body text
- [ ] No em dashes were introduced
- [ ] Data residency language uses the safer phrasing consistently
- [ ] Will's title is "Technical Lead" everywhere
- [ ] Security Expert is named (Parul Kharub)
- [ ] OWASP mapping uses 2025 terminology
- [ ] Tool names are preceded by "for example"
- [ ] Executive summary is <=3 pages
- [x] CloudTrail language matches actual configuration (FIXED 2026-01-06: CIS-aligned trail with alarms)
- [x] Security metrics language matches actual implementation (FIXED 2026-01-06)
- [ ] Secrets storage uses AWS Secrets Manager wording
- [ ] Performance claims cite the latest artifacts

---

## Assembly Instructions

### Step 1: Apply All Edits to final.md Files

Work through the file-by-file checklist above.

### Step 2: Rebuild Master Response

```bash
# Rebuild the master response in manifest order
cat docs/sin-rfp/response/01-executive-summary/final.md \
    docs/sin-rfp/response/01-B-prototype-evaluation-guide/final.md \
    docs/sin-rfp/response/02-vendor-fit/final.md \
    docs/sin-rfp/response/03-service-approach/data-submission-reporting/final.md \
    docs/sin-rfp/response/03-service-approach/data-warehousing/final.md \
    docs/sin-rfp/response/03-service-approach/data-migration/final.md \
    docs/sin-rfp/response/03-service-approach/platform-design/final.md \
    docs/sin-rfp/response/03-service-approach/testing-qa/final.md \
    docs/sin-rfp/response/03-service-approach/training-onboarding/final.md \
    docs/sin-rfp/response/04-system-requirements/00-compliance-crosswalk/final.md \
    docs/sin-rfp/response/04-system-requirements/data-management-dm-agg/final.md \
    docs/sin-rfp/response/04-system-requirements/reporting-rp-agg/final.md \
    docs/sin-rfp/response/04-system-requirements/security-sec-agg/final.md \
    docs/sin-rfp/response/04-system-requirements/training-onboarding-to-agg/final.md \
    docs/sin-rfp/response/04-system-requirements/user-interface-ui-agg/final.md \
    docs/sin-rfp/response/05-capabilities-experience/final.md \
    docs/sin-rfp/response/06-cost-value/final.md \
    docs/sin-rfp/response/07-delivery-schedule/final.md \
    > docs/sin-rfp/response/full-proposal-response.md
```

### Step 3: Rebuild Appendices

```bash
cat docs/sin-rfp/response/08-appendices/final.md \
    > docs/sin-rfp/response/full-proposal-response-appendices.md
```

### Step 4: Run Final Checks

Execute the QA checklist above.

---

## Recommended Execution Order

### Day 1: Global Find-Replace Operations

1. Will "Senior Developer" -> "Technical Lead" (all files)
2. Residency claims -> safer wording (all files)
3. All "Section XX" references -> exact header titles

### Day 2: Executive Summary and Navigation

1. Add TOC with summaries
2. Rewrite Evaluator Navigation Map
3. Update At a Glance table references

### Day 3: Security Presentation

1. Add Security and Privacy by Design section to vendor-fit
2. Update testing-qa with new layers table and OWASP mapping
3. Add shared responsibility to security-sec-agg
4. Add Parul Kharub bio

### Day 4: Demo Coverage and Cutover

1. Add SEC-AGG-002 and SEC-AGG-003 to prototype crosswalk
2. Add cutover plan to data-migration
3. Add Data Catalog definition

### Day 5: Evidence and Polish

1. Replace all internal evidence paths with appendix references
2. Add Security Tooling to cost section
3. Create Evidence Pack appendix with key screenshots
4. Final pass for em dashes and style guide compliance

### Day 6: Assembly

1. Rebuild full-proposal-response.md from final.md files
2. Rebuild appendices
3. Final checks per QA checklist

---

## Source Documents Reference

This guide was compiled from:

1. **Google Doc Comments** - `doc-comments.md` (32 comments mapped to files)
2. **Expert Peer Review** - Comprehensive feedback on structure, security, and procurement signals
3. **Update Plan Review** - Feedback on `final-md-update-plan.md` with guardrails
4. **Writing Style Guide** - `WRITING-STYLE-GUIDE.md` (anti-AI rules, tone)
5. **Original RFP** - `VIASPORT-PROVIDED-viasport-sin-rfp.md`
6. **System Requirements** - `VIASPORT-PROVIDED-system-requirements-addendum.md`
7. **Example RFP** - `example-rfp-sample.md` (reference for professional tone)

---

_Last updated: 2026-01-06_ (CloudTrail + security metrics + UAT environment deployed)
