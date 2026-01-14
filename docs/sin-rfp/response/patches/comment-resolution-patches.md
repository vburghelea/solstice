# RFP Comment Resolution Patches

Apply these patches to the Google Doc (Draft RFP) to close comments [a]–[l].

---

## Patch [a]: Evaluator Navigation Map

**Location:** "Evaluator Navigation Map" section (~line 307-324)

**Action:** Remove internal-comment artifact (the @kyleapickett@gmail.com mention). Upgrade table for evaluator scoring.

**REPLACE this section:**

```markdown
# ***Evaluator Navigation Map*** {#evaluator-navigation-map}

This table maps each RFP evaluation criterion to the corresponding section of this response.

| RFP Evaluation Criterion | Our Response Section | Notes |
| :---- | :---- | :---- |
| Vendor Fit to viaSport's Needs | Vendor Fit to viaSport's Needs | Company profile, team, differentiators |
| Solution Overview | Solution Overview | Non-technical workflow summary |
| Service Approach and Responsiveness | Service Approach: Data Submission and Reporting Web Portal through Service Approach: Training and Onboarding | Methodology for each scope item |
| System Requirements Addendum | System Requirements Compliance Matrix and detailed requirement sections | Requirement-by-requirement compliance |
| Service Levels and Reliability | Service Levels, Support, and Reliability | SLAs, monitoring, ops commitments |
| Capabilities and Experience | Capabilities and Experience | Case studies, automation/AI approach |
| Cost and Value | Commercial Model and Pricing | Term pricing, TCO, change management |
| Timeline and Delivery Schedule | Project Plan, Timeline, and Delivery Schedule | Milestones, risks, dependencies |
| Prototype Validation | Prototype Evaluation Guide and Appendices | Demo access, performance/security summaries |

Austin Wallace Tech welcomes the opportunity to present the prototype and review the approach with viaSport's evaluation team.
```

**WITH:**

```markdown
# ***Evaluator Navigation Map*** {#evaluator-navigation-map}

This table maps each RFP evaluation criterion to the corresponding proposal section, with page references for easy navigation.

| RFP Evaluation Criterion | Proposal Section | Page | Key Evidence |
| :---- | :---- | :---- | :---- |
| Vendor Fit | Vendor Fit to viaSport's Needs | 19 | Team qualifications, BC presence, delivery model |
| Solution Overview | Solution Overview | 27 | Workflow summary, multi-tenant model |
| Data Submission Portal | Service Approach: Data Submission and Reporting Web Portal | 28 | UX strategy, technology stack |
| Data Warehousing | Service Approach: Data Warehousing | 32 | AWS hosting, backup/recovery, encryption |
| Data Migration | Service Approach: Data Migration | 36 | 5-phase methodology, rollback support |
| Testing and QA | Service Approach: Testing and Quality Assurance | 44 | WCAG validation, load testing |
| Training and Onboarding | Service Approach: Training and Onboarding | 49 | Role-based training, adoption support |
| Service Levels | Service Levels, Support, and Reliability | 53 | 99.9% uptime, Sev1 60min response |
| System Requirements | System Requirements Compliance Matrix | 58 | 25/25 requirements implemented |
| Capabilities | Capabilities and Experience | 90 | Case studies, AI/automation approach |
| Cost and Value | Commercial Model and Pricing | 98 | 3-year $1.2M, 5-year $1.6M |
| Timeline | Project Plan, Timeline, and Delivery Schedule | 103 | 30-week delivery, Fall 2026 launch |
| Prototype Access | Appendix A: Prototype Evaluation Access | 110 | Demo credentials, 15-min walkthrough |

*Page numbers refer to the PDF export. Section hyperlinks work in the digital version.*
```

---

## Patches [b]–[g] + [h]–[j]: Consolidated Team & Delivery Model Section

**Location:** "Vendor Fit to viaSport's Needs" section, specifically:

- "Delivery Pod" table (~line 412-425)
- "Engagement Model" table (~line 426-434)
- "Advisory Partner Profiles" table (~line 498-510)

**Action:** Collapse all three tables into ONE unified "Delivery Model, Partners, and Continuity" section. Rewrite entries to be outcome-based with decision rights, time commitment, and viaSport relevance.

**DELETE these three subsections:**

1. `### *Delivery Pod*` (lines 412-425)
2. `### *Engagement Model*` (lines 426-434)
3. `## **Advisory Partner Profiles**` (lines 498-511)

**REPLACE WITH this single consolidated section:**

```markdown
## **Delivery Model, Partners, and Continuity**

viaSport receives a stable delivery team with clear ownership, no handoffs between sales and implementation, and direct accountability from proposal through operations.

### *Core Delivery Team*

| Team Member | Outcome Ownership | Decision Authority | Engagement | Why It Matters to viaSport |
| :---- | :---- | :---- | :---- | :---- |
| **Austin Wallace** | Delivery success, architecture, operations | Final technical decisions, scope trade-offs, escalation resolution | Full-time, all phases | Single point of accountability from proposal through steady-state; no project manager handoffs |
| **Ruslan Hétu** | User experience, accessibility compliance | UX design decisions, accessibility validation sign-off | Full-time, all phases | Ensures WCAG AA compliance and adoption-ready interfaces for PSO users with varying technical skills |
| **Soleil Heaney** | PSO adoption, workflow validation | Validates that system matches how sport organizations actually work | Part-time: Discovery, UAT, Rollout | Former PSO Executive Director brings insider perspective on reporting cycles, governance, and change management |
| **Will Siddall** | Technical quality, performance | Architecture review approval, performance benchmarks | Part-time: Weeks 11-22 | Enterprise-grade code review ensures maintainability and scalability |
| **Security Advisors** (Parul Kharub, Michael Casinha, Tyler Piller) | Security posture, compliance readiness | Security checkpoint sign-offs, pen test scope | Checkpoint reviews: Design, UAT, Go-Live | Fortune 100 and BC public sector security expertise validates controls before each phase gate |

### *Engagement Checkpoints*

| Phase | Core Team Activity | Specialist Input | viaSport Involvement |
| :---- | :---- | :---- | :---- |
| Discovery (Weeks 1-6) | Full team: requirements, legacy analysis | Security: threat model review | SME interviews, legacy data access |
| Design (Weeks 7-10) | Wallace + Hétu: UX refinement | Heaney: workflow validation | Brand assets, terminology approval |
| Build (Weeks 11-18) | Wallace + Siddall: development | Security: checkpoint review | Progress demos (bi-weekly) |
| UAT (Weeks 19-24) | Full team: testing support | Security: pre-launch review | UAT testers, sign-off authority |
| Rollout (Weeks 25-30) | Wallace + Heaney: adoption | Security: go-live sign-off | PSO coordination, launch approval |

### *Continuity and Key-Person Risk Mitigation*

| Risk | Mitigation |
| :---- | :---- |
| Principal unavailability | Infrastructure as code, documented runbooks, operational procedures in Git |
| Knowledge concentration | Cross-training during Discovery; Siddall can assume technical lead if needed |
| Vendor dependency | Source code escrow, data portability, transition support commitment |
```

---

## Patch [k]: Proposed Solution Statement (Remove Redundancy)

**Location:** "Proposed Solution Statement" section (~lines 524-575)

**Action:** The full "Proposed Solution Statement" section repeats content from Executive Summary and Solution Overview. Replace it with a compact "Key Differentiators" callout box that adds value without repetition.

**DELETE the entire section from:**

```markdown
## **Proposed Solution Statement**

Austin Wallace Tech proposes the Solstice platform...
```

**THROUGH:**

```markdown
* **Exit Options:** Data portability, escrow, and transition support available.
```

**REPLACE WITH:**

```markdown
## **Key Differentiators**

| Differentiator | What It Means for viaSport |
| :---- | :---- |
| **Working baseline, not wireframes** | Evaluate a functioning system before award; 20M-row load test proves production readiness |
| **Principal-led delivery** | The architect who built the prototype leads delivery—no knowledge transfer gaps |
| **Sport sector expertise** | Team includes former PSO executive leadership; system reflects how sport organizations actually work |
| **BC-based, Canadian data** | Victoria headquarters, AWS ca-central-1 hosting, PIPEDA-aligned |
| **Security by design** | MFA, RBAC, tamper-evident audit, encryption at rest/transit—built in, not bolted on |
| **Predictable costs** | Subscription includes support, patching, 200 hrs/year enhancements—no surprise invoices |
```

---

## Patch [l]: Standardize SLA References

**Action:** All SLA references should link to the canonical section: **"Service Levels, Support, and Reliability"**. Update inconsistent references throughout the document.

### Change 1 (Line 83):

**FROM:**

```
Solstice's Service Level Agreement will provide viaSport clear accountability...
```

**TO:**

```
Solstice's [Service Levels, Support, and Reliability](#service-levels,-support,-and-reliability) commitments provide viaSport clear accountability...
```

### Change 2 (Line 175):

Already correct—links to Commercial Model but mentions SLA-backed. Update to:
**FROM:**

```
See [Commercial Model and Pricing for details](#commercial-model-and-pricing).
```

**TO:**

```
See [Service Levels, Support, and Reliability](#service-levels,-support,-and-reliability) for SLA targets and [Commercial Model and Pricing](#commercial-model-and-pricing) for pricing details.
```

### Change 3 (Line 234 - Implemented Baseline Capabilities):

**FROM:**

```
* Support request system with status tracking and SLA targets
```

**TO:**

```
* Support request system with status tracking (see [Service Levels, Support, and Reliability](#service-levels,-support,-and-reliability))
```

### Change 4 (Line 468 - Procurement Certainty table):

**FROM:**

```
| Operational accountability | Defined SLA targets, continuous monitoring...
```

**TO:**

```
| Operational accountability | [Service-level commitments](#service-levels,-support,-and-reliability) including 99.9% uptime, Sev1 60-min response, continuous monitoring...
```

### Change 5 (Line 993 - if present, table row):

**FROM:**

```
| Mature services | Strong SLAs and documentation |
```

**TO:**

```
| Mature services | Defined [service levels](#service-levels,-support,-and-reliability) and documentation |
```

### Change 6 (Line 1302 - Tier 3 support table):

**FROM:**

```
| Tier 3 | Direct escalation | System incidents | See [SLA](#service-levels,-support,-and-reliability) |
```

**TO:**

```
| Tier 3 | Direct escalation | System incidents | See [Service Levels, Support, and Reliability](#service-levels,-support,-and-reliability) |
```

### Change 7 (All other "SLA" mentions):

Global find-and-replace where standalone "SLA" appears without a link—either:

- Replace "SLA" with "service-level commitments" and add link, OR
- Keep "SLA" but append "(see [Service Levels, Support, and Reliability](#service-levels,-support,-and-reliability))"

---

## Summary: Comment Resolution Checklist

| Comment                          | Status   | Patch Applied                                                                             |
| :------------------------------- | :------- | :---------------------------------------------------------------------------------------- |
| [a] Evaluator Navigation Map     | Resolved | Removed internal artifact, added page numbers and evidence column                         |
| [b]-[g] Team rewording           | Resolved | Merged into single outcome-based table with decision rights, time, and viaSport relevance |
| [h]-[j] Consolidation            | Resolved | Collapsed Delivery Pod + Engagement Model + Advisory Profiles into one section            |
| [k] Redundant Solution Statement | Resolved | Replaced with compact Key Differentiators table                                           |
| [l] SLA reference consistency    | Resolved | All SLA mentions now link to canonical "Service Levels, Support, and Reliability" section |

---

## Application Order

1. Apply Patch [k] first (removes content, simplifies later edits)
2. Apply Patches [b]-[g] + [h]-[j] together (structural change to Vendor Fit section)
3. Apply Patch [a] (navigation map update)
4. Apply Patch [l] changes (find-replace SLA references throughout)
5. Update Table of Contents page numbers after all changes
6. Export to PDF and verify page numbers in Evaluator Navigation Map

---

_Generated 2026-01-14 based on rfp-comment-mapping.md and Draft RFP (5).md_
