# January 10, 2026 - RFP Response Patches

This file contains all patches to be applied. Each patch shows the exact old text and new text.

---

## File: 01-executive-summary/final.md

### Patch 1: Remove informal update note at top

```
OLD:
# Update from Austin:

We have gotten an extension to submit our proposal on Tuesday the 14th. I will be addressing all of these comments today/tomorrow.

#

# Executive Summary

NEW:
# Executive Summary
```

### Patch 2: Replace "batteries included" model

```
OLD:
This "batteries included" model means viaSport procures implementation and operations in a single award, avoiding annual re-procurement of managed services.

NEW:
This integrated, single-vendor delivery and operations model enables viaSport to procure implementation and ongoing managed service under one agreement, avoiding separate annual procurements for hosting and support and ensuring clear accountability through a single Service Level Agreement (SLA).
```

### Patch 3: Replace "standup fee"

```
OLD:
Term subscription pricing (3+1+1), standup fee, included services, and options.

NEW:
Term subscription pricing (3+1+1), one-time implementation fee, included services, and options.
```

### Patch 4: Replace "comprehensive UX research" and fix timeline language

```
OLD:
| Timeline | 30 weeks targeting Fall 2026 launch with comprehensive UX research (See **Project Plan**) |

NEW:
| Timeline | 30 weeks targeting Fall 2026 launch, including a 6-week discovery and UX research phase (See **Project Plan**) |
```

### Patch 5: Reframe "De-risked Delivery" positively

```
OLD:
**De-risked Delivery** A working prototype is available for evaluation. This reduces delivery risk and allows evaluators to validate requirements directly. Access details are in **Appendix A: Prototype Evaluation Access**. The **Prototype Evaluation Guide** provides a 15-minute validation path tied to requirement IDs. See Section 1.3 for the standard prototype and data provenance summary.

NEW:
**Working Prototype for Evaluator Validation** Evaluators can log into a working prototype to validate key workflows and requirements prior to award. Access details are in **Appendix A: Prototype Evaluation Access**. The **Prototype Evaluation Guide** provides a 15-minute, requirement-linked walkthrough. See Section 1.3 for the prototype environment and data provenance summary.
```

### Patch 6: Replace "majority...today" with percentages

```
OLD:
**Requirements Coverage** The prototype covers the majority of the System Requirements Addendum today. Two requirements remain partial and are explicitly scoped with viaSport dependencies and delivery approach. The **System Requirements Compliance Crosswalk** provides the requirement-by-requirement view.

NEW:
**Requirements Coverage (January 2026 Prototype)** The prototype fully implements 23 of 25 (92%) System Requirements Addendum items. Two requirements are partially implemented (8%), with remaining scope documented including dependencies on viaSport inputs. The **System Requirements Compliance Crosswalk** provides the requirement-by-requirement view.
```

### Patch 7: Replace "purchasing an outcome" with SLA language

```
OLD:
**Managed Service Model** viaSport is purchasing an outcome: a reliable platform with clear service levels, operational ownership, and included enhancement capacity. The subscription includes monitoring, support, security patching, DR drills, and 200 hours/year for ongoing improvements. See **Commercial Model and Pricing** for details.

NEW:
**Managed Service Model** viaSport is procuring an SLA-backed managed service covering uptime, support response targets, and reliability, with Austin Wallace Tech responsible for day-to-day operations. The subscription includes availability/performance/security monitoring, ticket-based support and incident response, security patching, quarterly disaster recovery (DR) exercises, and 200 hours/year for ongoing enhancements. See **Commercial Model and Pricing** for details.
```

### Patch 8: Add UAT expansion in "What viaSport is Buying"

```
OLD:
- **Implementation/Standup** to complete viaSport configuration, migration, UAT, and rollout

NEW:
- **One-time Implementation** to complete viaSport configuration, data migration, User Acceptance Testing (UAT), and rollout
```

---

## File: 01-B-prototype-evaluation-guide/final.md

### Patch 1: Replace "What to Ignore" heading

```
OLD:
## What to Ignore in the Prototype

Some elements are placeholders and will be replaced with viaSport-approved content during Discovery:

NEW:
## Prototype Placeholders and Items to Be Finalized Post-Award

The prototype is fully functional for the workflows listed in the Requirements Compliance Crosswalk. The following items are content placeholders that will be finalized with viaSport during Discovery (needs assessment/gap analysis):
```

### Patch 2: Replace placeholder explanations

```
OLD:
- Form labels and field names (will match viaSport terminology)
- Sample templates (will be replaced with viaSport reporting templates)
- Help center content (will be refined per UX interviews)
- Logo and color scheme (will apply viaSport branding assets)

NEW:
- Form labels and field names are representative placeholders and will be aligned to viaSport terminology during Discovery
- Sample templates are illustrative; viaSport's reporting templates will be configured during Discovery
- Help-center content will be refined during Discovery based on needs assessment and user research
- Logo and color scheme are placeholders; viaSport branding assets will be applied during Discovery
```

### Patch 3: Replace "Demo Script" heading

```
OLD:
## 15-Minute Demo Script

NEW:
## 15-Minute Evaluator Walkthrough

This optional walkthrough is provided to help evaluators validate key workflows quickly and consistently.
```

### Patch 4: Replace prototype positioning paragraph

```
OLD:
## Prototype Positioning

We built this prototype to prove feasibility and reduce delivery risk. Discovery remains mandatory to validate workflows, templates, and migration realities. The prototype is not a substitute for stakeholder alignment, it is an accelerator.

NEW:
## Prototype Positioning

We provided a working prototype so evaluators can validate core workflows and requirements now, reducing uncertainty before award. After award, we will still run a Discovery phase to confirm workflows, templates, data definitions, and migration rules with viaSport. The prototype accelerates delivery by starting from proven components, but it does not replace stakeholder alignment.
```

### Patch 5: Replace "Demo credentials"

```
OLD:
Demo credentials are provided via a secure Evaluator Access Pack (see **Appendix A: Prototype Evaluation Access**).

NEW:
Prototype evaluation credentials are provided via a secure Evaluator Access Pack (see **Appendix A: Prototype Evaluation Access**).
```

### Patch 6: Add SME expansion

```
OLD:
| Program-specific fields (NCCP, contribution agreements) | Design (Weeks 11-18) | viaSport SME input |

NEW:
| Program-specific fields (NCCP, contribution agreements) | Design (Weeks 11-18) | viaSport Subject Matter Expert (SME) input |
```

---

## File: 02-vendor-fit/final.md

### Patch 1: Update company description

```
OLD:
Austin Wallace Tech is a British Columbia incorporated technology firm (Victoria, BC) delivering Solstice as a managed platform for sport sector reporting and information management.

NEW:
Austin Wallace Tech is a British Columbia limited company (Victoria, BC; incorporated 2025) delivering Solstice as a managed platform for sport sector reporting and information management.
```

### Patch 2: Update principal-led description

```
OLD:
We operate as a principal-led product team with contracted specialists for security, UX/accessibility, and independent testing. This model provides:

- A single accountable delivery lead (no sales-to-delivery handoff)
- A stable core engineering team
- Elastic specialist capacity for compliance, security testing, and UX validation

NEW:
We operate with a single accountable delivery lead and a small core product team, augmented by specialist advisors for security, UX/accessibility, and independent testing. This model provides:

- A single accountable delivery lead from proposal through delivery (no handoff between sales and implementation teams)
- A stable core delivery pod: 1 full-time principal supported by 6 named contracted specialists
- On-demand specialist capacity for compliance, security testing, and UX validation
```

### Patch 3: Update team size description

```
OLD:
| Team size | 1 principal \+ 6 contracted specialists for this engagement |

NEW:
| Team size | 1 principal (Project Lead/Solution Architect) + 6 specialist advisors (UX/accessibility, sport operations, technical advisory, security/compliance advisory) |
```

### Patch 4: Update System Navigator role

```
OLD:
| System Navigator | Connects team to PSO community needs during research and rollout | Soleil Heaney |

NEW:
| Sports Operations and Governance Advisor | Connects team to Provincial Sport Organization (PSO) community needs during research and rollout; acts as system navigator | Soleil Heaney |
```

### Patch 5: Update Soleil's engagement description

```
OLD:
| Soleil Heaney (System Navigator) | Ongoing community liaison | Research, UAT, rollout |

NEW:
| Soleil Heaney (Sports Operations and Governance Advisor) | Ongoing sector liaison: coordinates with PSOs to validate workflows, templates, and change-management communications | Research, UAT, rollout |
```

### Patch 6: Update checkpoint reviews

```
OLD:
| Security Advisors | Scheduled reviews at checkpoints | Design freeze, pre-UAT, go-live |

NEW:
| Security Advisors | Formal checkpoint reviews at key milestones | Design finalization, UAT readiness, Go-Live readiness |
```

### Patch 7: Replace "purchasing an outcome" in Service Management

```
OLD:
viaSport is purchasing an outcome: a platform that performs reliably during reporting cycles, with clear operational ownership.

NEW:
viaSport is procuring an SLA-backed managed service: a platform that performs reliably during reporting cycles, with clear operational ownership.
```

### Patch 8: Update maintenance notice

```
OLD:
| Release management | Scheduled maintenance windows, versioned releases, and change log reporting to viaSport |

NEW:
| Release management | Scheduled maintenance windows (7 days advance notice; emergency maintenance on shorter notice with immediate viaSport notification), versioned releases, and change log reporting to viaSport |
```

### Patch 9: Update patching cadence

```
OLD:
| Security operations | Regular patching cadence, expedited response for critical vulnerabilities, quarterly security reviews |

NEW:
| Security operations | Monthly routine patching; critical security patches within 2 business days of vendor patch availability; quarterly security reviews |
```

### Patch 10: Update Infrastructure as Code description

```
OLD:
| Continuity | Infrastructure as Code, documented runbooks, tested restore procedures, quarterly DR validation |

NEW:
| Continuity | Infrastructure as code (environment configuration stored as code for reproducibility and disaster recovery), documented runbooks, tested restore procedures, quarterly disaster recovery validation |
```

### Patch 11: Update escalation description

```
OLD:
| Escalation | Clear escalation path for Severity 1 incidents, including immediate triage and customer communications |

NEW:
| Escalation | Defined escalation path for Severity 1 incidents: acknowledgement within 60 minutes, direct phone/text escalation to delivery lead, updates provided to viaSport at least every 60 minutes until mitigation |
```

### Patch 12: Replace "purchasing...outcome" in Low-Risk section

```
OLD:
viaSport is not purchasing a one-time "web project." viaSport is purchasing an outcome: a reliable platform that supports ongoing reporting cycles with predictable support, monitoring, and updates.

NEW:
viaSport is procuring a managed, subscription-based platform service (not a one-time website build). The subscription includes defined service levels, ongoing support and monitoring, security maintenance, and scheduled enhancements.
```

### Patch 13: Update risk mitigation Infrastructure as Code

```
OLD:
| Key person risk | Infrastructure as Code, operational documentation, delivery pod structure |

NEW:
| Key person risk | Infrastructure as code, operational documentation, and a dedicated delivery team structure |
```

### Patch 14: Update delivery risk

```
OLD:
| Delivery risk | 23 of 25 requirements already built; principal-led with no handoffs |

NEW:
| Delivery risk | The prototype demonstrates that 23 of 25 requirements are already built; delivery is led by a single accountable lead with minimal handoffs |
```

### Patch 15: Update operational risk

```
OLD:
| Operational risk | Defined SLAs, 24/7 monitoring, quarterly DR drills |

NEW:
| Operational risk | Defined SLA targets, continuous monitoring of uptime/performance/security events, and quarterly disaster recovery exercises |
```

### Patch 16: Update game scale problem description

```
OLD:
- **Problem:** Process tracking data at game scale for decision support

NEW:
- **Problem:** Process tracking data at game/event scale to support operational decision-making
```

### Patch 17: Update delivered description

```
OLD:
- **Delivered:** End-to-end data pipelines and dbt models supporting decision workflows

NEW:
- **Delivered:** End-to-end data pipelines and dbt models powering analytics and reporting used in operational decision-making
```

### Patch 18: Update Soleil Heaney section title

```
OLD:
### Soleil Heaney, System Navigator

NEW:
### Soleil Heaney, Sports Operations and Governance Advisor
```

### Patch 19: Rewrite Michael Casinha bio

```
OLD:
### Michael Casinha, Security and Infrastructure Advisor

A seasoned 30 year veteran in the technology space, developing early DevOps practices in the dotcom era of the internet. Working with American banking companies like Bank of America, airline industry with Boeing and cutting edge quantum computing at 1Qbit. The one consistent thread with all the large and small enterprises is applying best practices in DevOps, encompassing agile, secure and consistent deployment practices into securely built and cloud environments in a consistent method.

NEW:
### Michael Casinha, Security and Infrastructure Advisor

Michael Casinha is a technology leader with 30 years of experience in DevOps, security, and infrastructure. He has supported teams in regulated and high-security environments—including financial services (Bank of America), aerospace (Boeing), and emerging computing (1QBit)—with a focus on secure, repeatable deployment practices and operational resilience.
```

### Patch 20: Update prototype description in Key Differentiators

```
OLD:
A functional prototype already exists and is available for evaluation. It addresses the majority of System Requirements Addendum items today and has been load-tested at production scale with 20.1 million rows.

NEW:
A functional prototype is available for evaluation and fully implements 23 of 25 (92%) System Requirements Addendum items. It has been load-tested at production scale with 20.1 million rows.
```

### Patch 21: Update team description in Key Differentiators

```
OLD:
The team combines enterprise data engineering with direct sport sector operations experience. Soleil Heaney brings perspective as a PSO executive, ensuring the platform reflects how sport organizations actually work.

NEW:
The team combines enterprise data engineering and security with direct amateur sport sector operations experience, including PSO executive leadership, ensuring the platform reflects how sport organizations actually work.
```

### Patch 22: Update Benefits viaSport - Reduced Risk

```
OLD:
- **Reduced Risk:** Evaluate a working system before committing.

NEW:
- **Evaluator Validation:** Evaluators can review a working prototype prior to award to validate key workflows and requirements.
```

### Patch 23: Update Benefits viaSport - Sector Understanding

```
OLD:
- **Sector Understanding:** Experience leading amateur sport organizations, not just building software.

NEW:
- **Sector Understanding:** Direct experience in the B.C. amateur sport sector (including PSOs and community sport organizations), not just software delivery.
```

---

## File: 07-delivery-schedule/final.md

### Patch 1: Replace UX jargon in table

```
OLD:
| Discovery and Research | 6 weeks | User research, contextual inquiry, legacy system analysis | Research Synthesis |
| Information Architecture | 4 weeks | Card sorting, tree testing, navigation validation | IA Approval |
| Design and Prototyping | 8 weeks | Wireframes, high-fidelity design, interactive prototyping | Design Freeze |
| User Acceptance Testing | 4 weeks | Usability testing, accessibility validation, AT user testing | UAT Sign-Off |

NEW:
| Discovery and Research | 6 weeks | User research, user observation sessions, legacy system analysis | Research Synthesis |
| Information Architecture (IA) | 4 weeks | User-driven categorization exercises, navigation validation testing | IA Approval |
| Design and Prototyping | 8 weeks | Wireframes, high-fidelity design, interactive prototyping | Design Finalization |
| User Acceptance Testing | 4 weeks | Usability testing, accessibility validation, Assistive Technology (AT) user testing | UAT Sign-Off |
```

### Patch 2: Fix TBD for project start

```
OLD:
- Project Start: TBD (contract award)

NEW:
- Project Start: Upon contract award (estimated Q1 2026)
```

### Patch 3: Replace contextual inquiry in Phase 1

```
OLD:
- Contextual inquiry sessions (12-15 participants)

NEW:
- User observation sessions in work environment (12-15 participants)
```

### Patch 4: Replace card sorting in Phase 2

```
OLD:
- Card sorting studies (25-30 participants)

NEW:
- User-driven categorization exercises to inform navigation (25-30 participants)
```

### Patch 5: Replace tree testing in Phase 2

```
OLD:
- Tree testing with 2-3 navigation variants (25-30 participants)

NEW:
- Navigation validation testing with 2-3 navigation variants (25-30 participants)
```

### Patch 6: Replace IA documentation

```
OLD:
- IA documentation and stakeholder review

NEW:
- Information Architecture (IA) documentation and stakeholder review
```

### Patch 7: Replace IA Approval Gate

```
OLD:
**Milestone:** Week 10 \- IA Approval Gate

NEW:
**Milestone:** Week 10 - Information Architecture (IA) Approval Gate
```

### Patch 8: Replace Figma

```
OLD:
- Interactive Figma prototyping with working interactions

NEW:
- Interactive design prototyping with working interactions
```

### Patch 9: Replace Design Freeze milestone

```
OLD:
**Milestone:** Week 18 \- Design Freeze and UAT Ready

NEW:
**Milestone:** Week 18 - Design Finalization and UAT Ready
```

### Patch 10: Expand AT in UAT section

```
OLD:
- Assistive technology testing (3-5 AT users)

NEW:
- Assistive Technology (AT) testing (3-5 AT users)
```

### Patch 11: Expand SME in dependencies

```
OLD:
| SME availability | Weeks 1-6 | Research quality reduced |

NEW:
| Subject Matter Expert (SME) availability | Weeks 1-6 | Research quality reduced |
```

### Patch 12: Replace design freeze in assumptions

```
OLD:
- No major scope changes after design freeze

NEW:
- No major scope changes after design finalization
```

### Patch 13: Expand SME in risk register

```
OLD:
| viaSport SME availability | Low | Medium | Schedule interviews early |

NEW:
| viaSport SME availability | Low | Medium | Schedule interviews early |
```

(Note: SME already expanded above at first use, so this instance is OK)

---

## File: 08-appendices/final.md

### Patch 1: Expand CIS Benchmark (first use)

```
OLD:
- Environment monitoring enabled (CloudTrail with CIS Benchmark alarms)

NEW:
- Environment monitoring enabled (CloudTrail with Center for Internet Security (CIS) Benchmark alarms)
```

### Patch 2: Remove ASCII diagram (lines 55-98)

```
OLD:
## Appendix B: System Architecture

### High-Level Architecture

\+---------------------------------------------------------------+

|                         AWS ca-central-1                      |

\+---------------------------------------------------------------+

|                                                               |

|   \+-----------+    \+-----------+    \+-----------+             |

|   | CloudFront| \-\> |  Lambda   | \-\> |    RDS    |             |

|   |    CDN    |    |  (App)    |    | PostgreSQL|             |

|   \+-----------+    \+-----------+    \+-----------+             |

|        |                  |                 |                 |

|   \+----+-----+      \+-----+-----+     \+-----+-----+           |

|   |    S3    |      |    SQS    |     |   Redis   |           |

|   | Storage  |      |  Queue    |     |  Cache    |           |

|   \+----------+      \+-----------+     \+-----------+           |

|                                                               |

|   \+-----------+    \+------------+    \+-----------+            |

|   |EventBridge|    | CloudWatch |    |    SES    |            |

|   | Scheduler |    | Monitoring |    |   Email   |            |

|   \+-----------+    \+------------+    \+-----------+            |

|                                                               |

\+---------------------------------------------------------------+

### Technology Stack

NEW:
## Appendix B: System Architecture

### High-Level Architecture

A formatted architecture diagram is provided in the Evidence Pack.

The platform runs entirely in AWS Canada (Central) (ca-central-1) using a serverless architecture: CloudFront CDN for edge delivery, Lambda for application compute, RDS PostgreSQL for the database, S3 for object storage, SQS for message queuing, ElastiCache Redis for caching, EventBridge for scheduling, CloudWatch for monitoring, and SES for email delivery.

### Technology Stack
```

### Patch 3: Fix performance TBD

```
OLD:
Load testing was conducted in the sin-perf environment. Final validation runs will be completed before submission (TBD).

NEW:
Load testing was conducted in the sin-perf environment on January 8, 2026. Results: p95 latency of 162ms (target: <500ms), 25 concurrent users, zero server errors.
```

### Patch 4: Fix retention TBD

```
OLD:
| Retention | Retention policies and legal holds (durations TBD) |

NEW:
| Retention | Retention policies and legal holds (durations to be confirmed with viaSport during Discovery) |
```

### Patch 5: Add glossary terms

```
OLD:
| Term | Definition |
| :---- | :---- |
| BCAR | British Columbia Activity Records, legacy system being replaced |
| BCSI | BC Sport Intelligence, legacy system being replaced |
| MFA | Multi-Factor Authentication |
| PSO | Provincial Sport Organization |
| RBAC | Role-Based Access Control |
| RDS | Amazon Relational Database Service |
| SIN | Strength in Numbers (project name) |
| SST | Serverless Stack (infrastructure as code framework) |
| TOTP | Time-based One-Time Password |
| UAT | User Acceptance Testing |

NEW:
| Term | Definition |
| :---- | :---- |
| AT | Assistive Technology |
| BCAR | British Columbia Activity Records, legacy system being replaced |
| BCSI | BC Sport Intelligence, legacy system being replaced |
| CIS | Center for Internet Security |
| IA | Information Architecture |
| MFA | Multi-Factor Authentication |
| PSO | Provincial Sport Organization |
| RBAC | Role-Based Access Control |
| RDS | Amazon Relational Database Service |
| SIN | Strength in Numbers (project name) |
| SME | Subject Matter Expert |
| SST | Serverless Stack (infrastructure as code framework) |
| SUS | System Usability Scale |
| TOTP | Time-based One-Time Password |
| UAT | User Acceptance Testing |
```

---

## File: 03-service-approach/service-levels/final.md

### Patch 1: Replace "purchasing an outcome"

```
OLD:
viaSport is purchasing an outcome: a platform that performs reliably during reporting cycles, with clear operational ownership. This section defines the service level commitments included in the Platform Subscription \+ Managed Service.

NEW:
viaSport is procuring an SLA-backed managed service: a platform that performs reliably during reporting cycles, with clear operational ownership. This section defines the service level commitments included in the Platform Subscription + Managed Service.
```

### Patch 2: Expand CIS Benchmark

```
OLD:
| Security monitoring | CloudTrail audit logging with CIS Benchmark alarms (root usage, IAM changes, security group changes) |

NEW:
| Security monitoring | CloudTrail audit logging with Center for Internet Security (CIS) Benchmark alarms (root usage, IAM changes, security group changes) |
```

### Patch 3: Remove "(Optional)" from Service Credits

```
OLD:
### Service Credits (Optional)

If desired by viaSport, service credits can be included in the contract for availability below target:

NEW:
### Service Credits

Service credits apply when the monthly availability target is missed. Credits are applied to the following quarter's invoice based on the schedule below:
```

---

## File: 05-capabilities-experience/final.md

### Patch 1: Replace "Majority" with percentage

```
OLD:
| Requirements coverage | Majority of System Requirements Addendum implemented |

NEW:
| Requirements coverage | 23 of 25 (92%) System Requirements Addendum items implemented |
```

### Patch 2: Add AI governance language

```
OLD:
### AI Enablement Foundation (Built)

The platform includes a production-ready AI foundation layer that enables rapid delivery of AI features during the engagement. This infrastructure is fully implemented:

NEW:
### AI Enablement Foundation (Built)

Austin Wallace Tech (AWT) provides a pre-configured AI infrastructure within the Solstice platform, designed to enhance data quality and reporting efficiency without compromising viaSport's data residency or governance requirements. The AI foundation is fully implemented in the current prototype and resides exclusively within the AWS Canada (Central) region. This infrastructure includes:
```

### Patch 3: Add AI governance details after usage logging

```
OLD:
| Usage logging and costs | Per-request tracking of tokens, latency, cost estimates by org and user |

NEW:
| Usage logging and costs | Per-request tracking of tokens, latency, cost estimates by org and user. Usage reports/exports available to viaSport for auditability. |
```

### Patch 4: Update AI data residency statement

```
OLD:
AI features use AWS Bedrock with models hosted exclusively in ca-central-1. No AI provider outside Canada will be used without explicit written authorization from viaSport.

NEW:
AI features use AWS Bedrock hosted in AWS Canada (Central) (ca-central-1). We log per-request token usage, latency, and cost estimates by organization/user for auditability, and we can provide usage reports/exports to viaSport. No AI provider outside Canada will be used without explicit written authorization from viaSport, and viaSport data will not be used for model fine-tuning/training without explicit written approval.
```

### Patch 5: Update Responsible AI heading

```
OLD:
## Responsible AI Approach

NEW:
## Responsible AI Governance
```

---

## File: 04-system-requirements/security-sec-agg/final.md

### Patch 1: Add Privacy Officer name

```
OLD:
**Privacy Officer:** Austin Wallace Tech will designate a Privacy Officer responsible for PIPA/PIPEDA compliance. This individual will have access to all information related to personal data processing and will coordinate with viaSport on privacy impact assessments, data handling procedures, and incident response.

NEW:
**Privacy Officer:** Austin Wallace (Delivery Lead) is designated as Privacy Officer responsible for PIPA/PIPEDA compliance. The Privacy Officer has access to all information related to personal data processing and will coordinate with viaSport on privacy impact assessments, data handling procedures, and incident response.
```

---

---

## CONSISTENCY FIXES (Added after review)

These patches address consistency gaps identified in cross-document review.

---

## File: 06-cost-value/final.md

### Patch 1: Replace "Standup" in pricing table

```
OLD:
| Implementation / Standup (one-time) | $600,000 | Discovery, configuration, migration, UAT support, training, rollout, go-live/hypercare |

NEW:
| One-time Implementation | $600,000 | Discovery, configuration, migration, UAT support, training, rollout, go-live/hypercare |
```

### Patch 2: Replace "Standup" in cost element breakdown (multiple rows)

```
OLD:
| Discovery \+ UX research | Standup | Interviews, IA testing, prototypes |
| Configuration (forms, templates, metadata) | Standup | viaSport-specific setup |
| Migration implementation | Standup | Mapping templates, pilot \+ phased waves |
| Training materials \+ sessions | Standup | Cohorts finalized with viaSport |
| UAT support \+ hypercare | Standup | Defect remediation, go-live support |

NEW:
| Discovery + UX research | Implementation | Interviews, IA testing, prototypes |
| Configuration (forms, templates, metadata) | Implementation | viaSport-specific setup |
| Migration implementation | Implementation | Mapping templates, pilot + phased waves |
| Training materials + sessions | Implementation | Cohorts finalized with viaSport |
| UAT support + hypercare | Implementation | Defect remediation, go-live support |
```

### Patch 3: Replace "Standup" section heading

```
OLD:
### Implementation / Standup

NEW:
### One-time Implementation
```

---

## File: 01-executive-summary/final.md

### Patch 9 (NEW): Fix Total Cost parenthetical

```
OLD:
| Total Cost | 3-year: **$1.2M** / 5-year: **$1.6M** (standup \+ subscription) |

NEW:
| Total Cost | 3-year: **$1.2M** / 5-year: **$1.6M** (implementation + subscription) |
```

### Patch 10 (NEW): Align performance numbers with Appendix

```
OLD:
| Performance | 20.1M rows, ≤250ms p95 latency |

NEW:
| Performance | 20.1M rows, p95 latency 162ms (target: <500ms) |
```

---

## File: 03-service-approach/service-levels/final.md

### Patch 4 (NEW): Update maintenance notice from 72 hours to 7 days

```
OLD:
| Scheduled maintenance windows | Communicated 72 hours in advance; typically during low-usage periods |

NEW:
| Scheduled maintenance windows | Communicated 7 days in advance; typically during low-usage periods |
```

### Patch 5 (NEW): Update Sev 1 first response to 60 minutes

```
OLD:
| Sev 1 \- Critical | 4 hours | Same business day | Immediate escalation to delivery lead |

NEW:
| Sev 1 - Critical | 60 minutes | Same business day | Immediate escalation to delivery lead; updates to viaSport every 60 minutes until mitigation |
```

### Patch 6 (NEW): Update critical patching language

```
OLD:
| Security patching (critical) | Within 48 hours of vulnerability disclosure |

NEW:
| Security patching (critical) | Within 2 business days of vendor patch availability |
```

---

## File: 01-executive-summary/final.md

### Patch 11 (NEW): Add explicit SES statement for data residency

```
OLD:
Primary data stores (RDS PostgreSQL, S3 object storage, backups, and audit archives) are hosted in AWS Canada (Central) (ca-central-1). Authenticated content is configured to avoid edge caching. Email notifications are delivered to recipients and may traverse external networks.

NEW:
Primary data stores (RDS PostgreSQL, S3 object storage, backups, and audit archives) are hosted in AWS Canada (Central) (ca-central-1). Authenticated content is configured to avoid edge caching. Email notifications are sent via AWS Simple Email Service (SES) in AWS Canada (Central) (ca-central-1). Once delivered to recipients, messages may transit or be stored by external email providers outside AWS.
```

---

## File: 03-service-approach/data-warehousing/final.md

### Patch 1 (NEW): Add explicit SES statement for data residency

```
OLD:
Primary data stores (RDS PostgreSQL, S3 object storage, backups, and audit archives) are hosted in AWS Canada (Central) (ca-central-1). Authenticated content is configured to avoid edge caching. Email notifications are delivered to recipients and may traverse external networks.

NEW:
Primary data stores (RDS PostgreSQL, S3 object storage, backups, and audit archives) are hosted in AWS Canada (Central) (ca-central-1). Authenticated content is configured to avoid edge caching. Email notifications are sent via AWS Simple Email Service (SES) in AWS Canada (Central) (ca-central-1). Once delivered to recipients, messages may transit or be stored by external email providers outside AWS.
```

---

## File: 08-appendices/final.md

### Patch 6 (NEW): Add explicit SES statement for data residency

```
OLD:
Primary data stores (RDS PostgreSQL, S3 object storage, backups, and audit archives) are hosted in AWS Canada (Central) (ca-central-1). Authenticated content is configured to avoid edge caching. Email notifications are delivered to recipients and may traverse external networks.

NEW:
Primary data stores (RDS PostgreSQL, S3 object storage, backups, and audit archives) are hosted in AWS Canada (Central) (ca-central-1). Authenticated content is configured to avoid edge caching. Email notifications are sent via AWS Simple Email Service (SES) in AWS Canada (Central) (ca-central-1). Once delivered to recipients, messages may transit or be stored by external email providers outside AWS.
```

---

## File: 05-capabilities-experience/final.md

### Patch 6 (NEW): Align performance numbers

```
OLD:
| Load testing | 20.1 million rows, ≤250ms p95 latency |

NEW:
| Load testing | 20.1 million rows, p95 latency 162ms (target: <500ms) |
```

---

## STILL NEEDS INPUT FROM AUSTIN

### Will Siddall bio - needs 1-2 concrete project examples

Current:

> With 15+ years of development and business consulting experience across many industries, Will is ensuring a stable product can be delivered to customers with a focus on customer collaboration and user experience (UX). He's designed, delivered, and trained a variety of products for customers of all types and sizes, with most of his experience developing and delivering products to air-gapped environments.

Need to add specific examples like:

> Notable projects include [PROJECT 1 - what was delivered] for [CLIENT] and [PROJECT 2 - what was delivered] for [CLIENT].

---

## Summary of All Files to Update

| File                                             | Patch Count    |
| ------------------------------------------------ | -------------- |
| 01-executive-summary/final.md                    | 11             |
| 01-B-prototype-evaluation-guide/final.md         | 6              |
| 02-vendor-fit/final.md                           | 23             |
| 07-delivery-schedule/final.md                    | 13             |
| 08-appendices/final.md                           | 6              |
| 03-service-approach/service-levels/final.md      | 6              |
| 05-capabilities-experience/final.md              | 6              |
| 04-system-requirements/security-sec-agg/final.md | 1              |
| 06-cost-value/final.md                           | 3              |
| 03-service-approach/data-warehousing/final.md    | 1              |
| **Total**                                        | **76 patches** |
