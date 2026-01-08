# TICKET: RFP Commercial Reframe and Enterprise Positioning

**Created:** 2026-01-07
**Priority:** High
**Status:** Planning
**Context:** Feedback from RFP advisor Brad Edwards on pricing model and enterprise positioning

---

## Executive Summary

viaSport's ~$1.275M restricted fund and "batteries included" RFP language suggest they want a **3-5 year managed service contract**, not a project-based engagement. Current proposal framing ("$600K implementation + $200K/year operations") doesn't match how public sector buyers think about term procurements.

**Core change:** Repackage existing pricing as a **3-year base term subscription with two optional 1-year extensions (3+1+1)**, present TCO tables, and strengthen the managed service / SLA narrative to compete with enterprise platforms (Adobe Experience Manager, Salesforce).

---

## Brad's Key Points (Summarized)

1. **Term structure matters**: "They're going to want to buy on a 3-5 year term... Otherwise they have to do an RFP for the managed services part each year"

2. **Expect enterprise competition**: "At that budget level... competition will probably be pitching things like Adobe Experience Manager"

3. **They're buying an outcome**: "You need a really good story around ongoing support, monitoring and updates, availability and reliability. They're buying an outcome."

4. **Sell SaaS, not a web project**: "Think of pre-existing work as what goes on licensing. Sell SaaS... Licensing covers infra/support/monitoring/patching/new non-custom features. Standup costs are customization."

5. **New vendor risk offset**: "Could give them a perpetual on the source at end of contract so they renew or maintain internally"

---

## Current State Issues

### Commercial Framing

| Issue                     | Location                           | Problem                                                          |
| ------------------------- | ---------------------------------- | ---------------------------------------------------------------- |
| No term structure         | `06-cost-value/final.md:7`         | "$600K + $200K/year" doesn't signal term commitment              |
| Wrong language            | `06-cost-value/final.md:35`        | "Annual Operations" vs "Platform Subscription + Managed Service" |
| No TCO view               | `01-executive-summary/final.md:61` | Evaluators want 3-year and 5-year totals                         |
| Unclear enhancement scope | `06-cost-value/final.md:44`        | "Minor Enhancements" reads as unlimited scope                    |

### Credibility Issues

| Issue                   | Location                                                          | Problem                                                              |
| ----------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------- |
| Plaintext passwords     | `08-appendices/final.md:21`                                       | Security anti-pattern in a security-focused proposal                 |
| Unfilled bios           | `02-vendor-fit/final.md:98-135`                                   | "[To be provided...]" placeholders undermine professionalism         |
| Claims vs code mismatch | `02-vendor-fit/final.md:217`                                      | "Security scanning in CI / scheduled DAST" not in actual CI workflow |
| Timeline inconsistency  | `02-vendor-fit/final.md:230` vs `07-delivery-schedule/final.md:5` | "18 weeks to rollout" vs "30-week implementation timeline"           |
| TBD artifacts           | `08-appendices/final.md:84`                                       | "Final validation run TBD" in scoring-critical claims                |

### Missing Enterprise Elements

| Gap                           | What Enterprise Buyers Expect                           |
| ----------------------------- | ------------------------------------------------------- |
| No explicit SLAs              | Severity definitions, response targets, service credits |
| No exit/escrow options        | Continuity plan for "new vendor risk"                   |
| No rate card                  | Enhancement pricing for future work                     |
| Resume-focused vendor section | Delivery organization + service management              |

---

## What Supports the "Enterprise" Claim (Already Built)

The codebase actually supports the managed service story:

| Capability                                                | Evidence Location                    |
| --------------------------------------------------------- | ------------------------------------ |
| WAF on CloudFront                                         | `sst.config.ts:487`                  |
| CloudTrail audit + CIS alarms                             | `sst.config.ts:892`                  |
| Object Lock retention buckets                             | `sst.config.ts:262`                  |
| Scheduled ops jobs (retention/notifications/data quality) | `sst.config.ts:606`                  |
| Immutable audit hash chain                                | `src/db/schema/audit.schema.ts:15`   |
| In-app support requests with SLA timestamps               | `src/db/schema/support.schema.ts:35` |
| ElastiCache Redis for caching/rate limiting               | `sst.config.ts` (INFRA-003 complete) |

---

## Counter-Positioning vs Adobe Experience Manager

**AEM bid structure:**

- Adobe licensing (subscription, quote-based)
- SI implementation (Deloitte/Accenture, big team, long Gantt)
- Managed services (3-5 year term)

**AEM story:** "Enterprise platform, proven vendor, managed cloud service"

**AEM weakness for this RFP:** AEM is a CMS/digital experience platform. viaSport needs structured data submission, multi-tenant reporting, and analytics. AEM would require integrating a separate data platform.

**Our counter-story:**

> "Same procurement shape (term subscription + managed service), but purpose-built for secure multi-tenant data submission → validation → audit → self-serve analytics/export, already running as a working prototype; plus explicit continuity/exit options."

---

## Detailed Change Plan

### Phase 1: Commercial Model Rewrite (Highest Impact)

#### 1.1 `docs/sin-rfp/response/06-cost-value/final.md` - Major Rewrite

**Rename section:** "Cost and Value of Services" → "Commercial Model and Pricing"

**Add procurement structure paragraph:**

```markdown
## Procurement Structure

Austin Wallace Tech proposes Solstice as a 3-year base term subscription with two optional 1-year extensions at viaSport's discretion (3+1+1). This structure avoids a separate annual RFP for operations and provides predictable multi-year budgeting.
```

**Rename pricing components:**

- "Implementation" → "Implementation / Standup (one-time)"
- "Annual Operations" → "Platform Subscription + Managed Service (annual)"

**Add TCO table:**

```markdown
## Total Cost View

| Term | Total |
|------|-------|
| 3-year base term | $1,200,000 |
| 5-year total (if extensions exercised) | $1,600,000 |
```

**Add explicit "What's Included" lists:**

For Implementation / Standup:

- Discovery and requirements confirmation against the prototype
- viaSport-specific configuration (forms/templates/metadata)
- Legacy data extraction + pilot migration + full migration + reconciliation
- UAT support and defect remediation
- Training delivery (admin + train-the-trainer + PSO rollout enablement)
- Go-live support and defined hypercare period

For Subscription + Managed Service:

- Canadian-hosted production infrastructure and routine operations
- Monitoring, alerting, and incident response coordination
- Security patching and dependency updates
- Routine backups and quarterly DR validation drills (results reported)
- Support channels (in-app and email) with severity-based response targets
- Ongoing product updates and non-custom feature improvements
- **200 hours per year** for enhancements, minor feature requests, and configuration changes

**Add enhancement clarity:**

```markdown
## Enhancements and Change Requests

viaSport will have evolving needs. The subscription includes **200 hours per year** for enhancements, minor feature requests, and configuration changes beyond routine operations.

Additional work beyond the included hours is available at **$175/hour** with prior approval. A change control process is provided in the Appendices.
```

**Add renewal and exit language:**

```markdown
## Renewal and Price Protection

Renewal years can be priced:
- At the same annual rate, or
- With a mutually agreed inflation cap (e.g., CPI-capped adjustments)

## Optional Risk Reduction: Exit and Continuity

To reduce vendor risk, viaSport may select one of the following continuity options (see Exit & Portability Appendix):
- Data portability + runbooks (baseline)
- Source code escrow with release conditions
- Perpetual license to viaSport-specific customizations/configuration at end of term (optional)
```

---

#### 1.2 `docs/sin-rfp/response/01-executive-summary/final.md` - Updates

**Add "What viaSport is buying" after intro:**

```markdown
## What viaSport is Buying

Solstice is proposed as a term subscription with "batteries included" managed service, structured to reduce ongoing procurement overhead and operational risk:

- **3-year base term**, with two optional 1-year extensions at viaSport's discretion
- **Implementation/Standup** to complete viaSport configuration, migration, UAT, and rollout
- **Platform Subscription + Managed Service** covering hosting, monitoring, security patching, support, and ongoing product updates
```

**Update "At a Glance" table:**

```markdown
| Dimension        | Status                                                                                                     |
| ---------------- | ---------------------------------------------------------------------------------------------------------- |
| Prototype        | Working system available for evaluation (See Section 1.3)                                                  |
| Requirements     | 22 of 25 built today; 3 partial pending viaSport inputs (See **System Requirements Compliance Crosswalk**) |
| Data Used        | See Section 1.3                                                                                            |
| Performance      | 20.1M rows, sub-250ms p95 latency                                                                          |
| Security         | See Section 1.2                                                                                            |
| Timeline         | 30 weeks targeting Fall 2026 launch with comprehensive UX research                                         |
| Commercial Model | 3-year base term + two optional 1-year extensions (3+1+1)                                                  |
| Total Cost       | 3-year: $1.2M (standup + 3 years subscription) / 5-year: $1.6M                                             |
```

**Update Response Overview table** - add row:

```markdown
| **Commercial Model & Service Levels** | Term subscription pricing (3+1+1), standup fee, included services, and SLAs. |
```

---

### Phase 2: Vendor Fit Restructure

#### 2.1 `docs/sin-rfp/response/02-vendor-fit/final.md` - Major Restructure

**New structure:**

1. **Company Overview** (brief - 1 paragraph)
2. **Operating Model** (how we deliver and operate)
3. **Delivery Pod** (table: function, responsibilities, primary person)
4. **Service Management and Coverage** (support model, monitoring, release management, escalation)
5. **What Makes This a Low-Risk Choice** (frame as platform + managed service)
6. **Data Ownership and Portability** (keep existing)
7. **Key Differentiators** (keep existing but tighten)

**Remove:** Long resume-style bios. Replace with short role summaries + "Full resumes available upon request"

**Fix:** Remove all "[To be provided...]" placeholders - either get the content or remove the sections

**Fix timeline inconsistency:** The document says "18 weeks to rollout" but the delivery schedule says 30 weeks. Pick one and make it consistent everywhere. (Recommend: keep 30 weeks, update all "18 weeks" references)

---

### Phase 3: Service Levels Section

#### 3.1 Create dedicated SLA content

Either add to `03-service-approach/training-onboarding/final.md` OR create new section.

**Content:**

```markdown
## Service Levels, Support, and Reliability

viaSport is purchasing an outcome: a platform that performs reliably during reporting cycles, with clear operational ownership.

### Service Targets (Summary)

| Area | Target / Commitment |
|------|---------------------|
| Availability target | 99.9% monthly availability for production (excluding scheduled maintenance) |
| Monitoring | 24/7 automated monitoring and alerting |
| Maintenance windows | Scheduled maintenance communicated in advance; emergency maintenance only for critical security or stability issues |
| Incident communications | Severity 1 incidents: immediate acknowledgement and ongoing updates to viaSport stakeholders |
| Backups & recovery | Point-in-time recovery enabled; restore procedures validated through scheduled drills |
| Security updates | Regular patching cadence; expedited patching for high-severity vulnerabilities |

### Support Response Targets

| Severity | Example | First Response Target |
|----------|---------|----------------------|
| Sev 1 | System down, security incident, data loss risk | 4 hours (business hours) |
| Sev 2 | Major function impaired during reporting | 8 hours |
| Sev 3 | Issue with workaround | 24 hours |
| Sev 4 | Minor bug / cosmetic | 48 hours |

24/7 response coverage is available as an optional add-on if required by viaSport.

Full details (definitions, escalation path, service credits if desired) can be included as a formal SLA schedule in the contract.
```

---

### Phase 4: Appendix Updates

#### 4.1 `docs/sin-rfp/response/08-appendices/final.md` - Security and Cleanup

**Appendix A - Remove plaintext passwords:**

```markdown
## Appendix A: Prototype Evaluation Access

A working prototype is available for evaluator review in a dedicated UAT environment using synthetic data only.

To protect evaluator accounts and align with good security practice, credentials are provided via a secure **Evaluator Access Pack** issued to viaSport's evaluation lead upon request.

### Access Process

1. viaSport provides evaluator names and email addresses
2. Austin Wallace Tech issues time-bound accounts with role-based access
3. Optional MFA can be enabled for evaluator accounts to validate authentication flow
4. Credentials are rotated periodically and disabled after the evaluation window closes

### Environment Notes

- UAT environment is isolated from production
- Synthetic data only
- Monitoring enabled for security and stability validation

**Contact for access pack:** austin@austinwallace.tech
```

**Appendix F - Shorten bios:**

```markdown
## Appendix F: Key Personnel (Summary)

| Name | Role | Summary |
|------|------|---------|
| Austin Wallace | Program & Delivery Lead | Accountable for delivery execution, migration, and operational readiness through go-live and steady state. |
| Ruslan Hétu | UX & Accessibility Lead | UX research lead, design, and accessibility validation. |
| Soleil Heaney | System Navigator | Connects team to PSO community needs during research and rollout. |
| Will Siddall | Technical Advisor | Architecture review and development support. |
| Parul Kharub | Security & Risk Advisor | Security architecture review, control mapping, penetration test coordination, and incident readiness. |
| Michael Casinha | Security & Infrastructure Advisor | Infrastructure security and DevOps review. |
| Tyler Piller | Security & Compliance Advisor | Security operations and compliance validation. |

Full resumes available upon request.
```

**Add new appendices:**

- **Appendix K: Service Levels & Support Details** (expanded SLA schedule)
- **Appendix L: Exit & Portability Options** (data export, escrow, perpetual license options, transition support)
- **Appendix M: Enhancement Rate Card** (sample rates, change control process)

---

### Phase 5: Claims vs Code Alignment

> **STATUS: IN PROGRESS** - Austin is working on implementing security scanning in CI. Will either update claims to match implementation or soften claims if implementation doesn't land in time.

---

### Phase 6: Data Warehousing Cleanup

#### 6.1 `docs/sin-rfp/response/03-service-approach/data-warehousing/final.md`

**Remove or reframe the PostgreSQL cost comparison:**

The table showing "PostgreSQL annual cost $3k-$6k" creates cognitive dissonance with the $200k/year managed service fee. Evaluators will think "why am I paying $200k for $6k of infrastructure?"

**Option A (Remove):** Delete the cost comparison table entirely. Keep the technical justification for PostgreSQL vs columnar warehouse.

**Option B (Reframe):** Add context that the subscription covers the full managed service outcome, not just infrastructure:

```markdown
> Note: The subscription fee covers the complete managed service outcome (reliable hosting, monitoring, on-call operational ownership, security patching, backups, DR drills, support, and ongoing product updates), not just infrastructure costs.
```

---

### Phase 7: TBD Cleanup Pass

Search and address all "TBD" references:

| Location                                              | Current                                                                              | Action                                                                                      |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| `08-appendices/final.md:84`                           | "Final validation runs will be completed before submission (TBD)"                    | Either link to evidence OR commit to schedule: "Final validation runs scheduled for [date]" |
| `03-service-approach/training-onboarding/final.md:33` | "Cohort sizing and scheduling will be confirmed with viaSport during Planning (TBD)" | Keep as-is (appropriate dependency)                                                         |
| `03-service-approach/data-warehousing/final.md:101`   | "Retention durations and archive schedules will be finalized with viaSport (TBD)"    | Keep as-is (appropriate dependency)                                                         |

**Rule:** TBDs are acceptable for items that genuinely require viaSport input. TBDs are NOT acceptable for evidence/validation claims where we control the timing.

---

## Implementation Priority

| Priority | Task                                                       | Impact                               | Effort                     |
| -------- | ---------------------------------------------------------- | ------------------------------------ | -------------------------- |
| P0       | Rewrite `06-cost-value/final.md` with term structure + TCO | Highest - matches buyer expectations | Medium                     |
| P0       | Update `01-executive-summary/final.md` At a Glance         | Highest - first impression           | Low                        |
| P1       | Remove plaintext passwords from `08-appendices/final.md`   | High - credibility                   | Low                        |
| P1       | Fix timeline inconsistency (18 vs 30 weeks)                | High - internal consistency          | Low                        |
| P1       | Fill or remove "[To be provided...]" placeholders          | High - professionalism               | Medium                     |
| P2       | Restructure `02-vendor-fit/final.md` as operating model    | Medium - vendor credibility          | High                       |
| P2       | Add explicit SLA section                                   | Medium - enterprise expectations     | Medium                     |
| P2       | Add exit/escrow appendix                                   | Medium - new vendor risk             | Medium                     |
| P3       | ~~Align security claims to CI~~                            | ~~Medium~~                           | **IN PROGRESS (separate)** |
| P3       | Remove PostgreSQL cost comparison or reframe               | Low - cognitive dissonance           | Low                        |
| P3       | TBD cleanup for evidence items                             | Low - polish                         | Low                        |

---

## Files to Modify (Summary)

| File                                                                     | Action                                             | Priority                   |
| ------------------------------------------------------------------------ | -------------------------------------------------- | -------------------------- |
| `docs/sin-rfp/response/06-cost-value/final.md`                           | Major rewrite                                      | P0                         |
| `docs/sin-rfp/response/01-executive-summary/final.md`                    | Update At a Glance + add commercial section        | P0                         |
| `docs/sin-rfp/response/08-appendices/final.md`                           | Remove passwords, shorten bios, add new appendices | P1                         |
| `docs/sin-rfp/response/02-vendor-fit/final.md`                           | Restructure, fix placeholders, fix timeline        | P1/P2                      |
| `docs/sin-rfp/response/03-service-approach/training-onboarding/final.md` | Add or reference SLA section                       | P2                         |
| `docs/sin-rfp/response/03-service-approach/data-warehousing/final.md`    | Remove/reframe cost comparison                     | P3                         |
| `docs/sin-rfp/response/05-capabilities-experience/final.md`              | Minor - add ownership/relevance framing            | P3                         |
| `.github/workflows/ci.yml`                                               | ~~Add CodeQL/ZAP~~                                 | **IN PROGRESS (separate)** |

---

## Decisions (Resolved)

1. **Timeline:** **30 weeks** with full UX research. Update all "18 weeks" references to be consistent.

2. **Advisory bios:** Will collect 2-3 sentence bios from Soleil, Ruslan, Will, Michael, Tyler before submission.

3. **Rate card:** **$175/hour** for enhancements beyond included scope. **200 hours/year included** in subscription.

4. **Escrow:** **Yes**, offer source code escrow as a vendor-risk reducer. Need to identify escrow provider (e.g., Iron Mountain, NCC Group, Escrow London).

## Remaining Open Questions

1. **Escrow provider:** Which escrow agent to use/reference?

---

## Next Steps

1. [ ] Decision on timeline (30 vs 18 weeks)
2. [ ] Collect advisory partner bios or decide to remove
3. [ ] Draft replacement text for P0 items
4. [ ] Review and approve
5. [ ] Update all files
6. [ ] Final consistency check
