# Commercial Model and Pricing

## Procurement Structure

Austin Wallace Tech proposes Solstice as a **3-year base term subscription** with two optional 1-year extensions at viaSport's discretion (3+1+1). This structure avoids a separate annual RFP for operations and provides predictable multi-year budgeting.

## Pricing Summary

| Component                                         | Price           | Notes                                                                                                  |
| :------------------------------------------------ | :-------------- | :----------------------------------------------------------------------------------------------------- |
| One-time Implementation                           | $600,000        | Discovery, configuration, migration, UAT support, training, rollout, go-live/hypercare                 |
| Platform Subscription \+ Managed Service (annual) | $200,000 / year | Hosting, monitoring, patching, support, reliability management, product updates, 200 enhancement hours |

## Total Cost View

| Term                                   | Total      |
| :------------------------------------- | :--------- |
| 3-year base term                       | $1,200,000 |
| 5-year total (if extensions exercised) | $1,600,000 |

## What is Included

### Cost Element Breakdown

| Cost Element                               | Included In    | Notes                                         |
| :----------------------------------------- | :------------- | :-------------------------------------------- |
| Discovery + UX research                    | Implementation | Interviews, IA testing, prototypes            |
| Configuration (forms, templates, metadata) | Implementation | viaSport-specific setup                       |
| Migration implementation                   | Implementation | Mapping templates, pilot + phased waves       |
| Training materials + sessions              | Implementation | Cohorts finalized with viaSport               |
| UAT support + hypercare                    | Implementation | Defect remediation, go-live support           |
| Hosting \+ monitoring                      | Subscription   | AWS infrastructure, logging, on-call response |
| Security patching \+ dependency updates    | Subscription   | Monthly \+ expedited for critical vulns       |
| Support channels                           | Subscription   | In-app \+ email with SLA-based response       |
| DR exercises \+ backups                    | Subscription   | Quarterly validation, 35-day retention        |
| Enhancement hours (200/year)               | Subscription   | Feature requests, configuration changes       |

### One-time Implementation

- Discovery and requirements confirmation against the prototype
- viaSport-specific configuration (forms, templates, metadata, branding)
- Legacy data extraction approach, pilot migration, full migration, and reconciliation
- UAT support and defect remediation
- Training delivery (viaSport admin, train-the-trainer, PSO rollout enablement)
- Go-live support and defined hypercare period

### Platform Subscription \+ Managed Service

- Canadian-hosted production infrastructure and routine operations
- Monitoring, alerting, and incident response coordination
- Security patching and dependency updates
- Routine backups and quarterly DR exercises (results reported to viaSport)
- Support channels (in-app and email) with severity-based response targets
- Ongoing product updates and non-custom feature improvements
- **200 hours per year** for enhancements, minor feature requests, and configuration changes

## Enhancements and Change Requests

viaSport will have evolving needs. The subscription includes **200 hours per year** for enhancements, minor feature requests, and configuration changes beyond routine operations.

Additional work beyond the included hours is available at **$175/hour** with prior approval. A change control process ensures transparency:

1. Change request submitted
2. Impact assessment (scope, timeline, hours)
3. Proposal with options
4. Mutual agreement documented
5. Work proceeds after sign-off

## Payment Schedule

| Milestone        | Percentage | Amount   | Trigger                          |
| :--------------- | :--------- | :------- | :------------------------------- |
| Contract Signing | 25%        | $150,000 | Signed agreement                 |
| UAT Sign-Off     | 25%        | $150,000 | User acceptance testing complete |
| Go-Live          | 50%        | $300,000 | Production deployment            |

Annual subscriptions are billed quarterly in advance ($50,000 per quarter).

## Factors That Do Not Trigger Price Adjustments

- Normal data volume growth within PostgreSQL capacity
- Standard security updates and patches
- Configuration changes within existing features
- Work within the included 200 enhancement hours

## Factors That May Trigger Cost Adjustments

The following scope changes may require adjustment to pricing or timeline:

- Net-new integrations or real-time API requirements beyond agreed scope
- Mandatory SSO integration at launch (depends on IdP and coordination effort)
- Material increase in migration scope (attachment volume, additional legacy systems)
- 24/7 response coverage (optional add-on, already priced below)
- Third-party penetration testing (optional add-on, already priced below)

Any scope changes will be handled through the change control process described above, with transparent impact assessment before proceeding.

## Renewal and Price Protection

Renewal years can be priced:

- At the same annual rate ($200,000), or
- With a mutually agreed inflation cap (e.g., CPI-capped adjustments)

Renewal terms will be discussed no later than 90 days before the end of each contract year.

## Optional Risk Reduction: Exit and Continuity

To reduce vendor risk, viaSport may select from the following continuity options:

| Option                              | Description                                                                                                              | Included                    |
| :---------------------------------- | :----------------------------------------------------------------------------------------------------------------------- | :-------------------------- |
| Data portability \+ runbooks        | Full data export (CSV, JSON, database dump) plus operational runbooks                                                    | Baseline (included)         |
| Source code escrow                  | Source code deposited with escrow agent, released upon defined trigger conditions (insolvency, failure to support, etc.) | Optional                    |
| Perpetual license to customizations | At end of contract, viaSport receives perpetual license to viaSport-specific configuration and customizations            | Optional                    |
| Transition support                  | Support for transition to a replacement system if viaSport chooses not to renew                                          | Available at standard rates |

Details on escrow and perpetual license options are provided in the Exit and Portability Appendix.

## Optional Add-Ons

### Third-Party Penetration Testing

**Estimated:** $10,000 to $20,000 per assessment

Independent penetration testing by a qualified third-party security firm. Can be scheduled pre-go-live or annually. Austin Wallace Tech coordinates with the testing firm and remediates findings.

### Extended Support Coverage (24/7)

**Estimated:** $30,000 to $50,000 per year additional

Adds after-hours monitoring and response outside business hours. After-hours Sev 1 response target: 2 hours (with 24/7 add-on).

### Operations Portal (Events and Team Management)

**Estimated:** $50,000 to $100,000 implementation, plus ongoing support

The Solstice platform includes an operations portal used by Quadball Canada. This could be extended to viaSport and PSOs to unify reporting and operations.

## Pricing Philosophy

Pricing is based on the 30-week delivery plan described in **Project Plan, Timeline, and Delivery Schedule**.

- The **one-time implementation** covers discovery, viaSport configuration, migration execution and reconciliation, UAT support, training, rollout, and go-live/hypercare to operationalize the existing baseline.
- The **annual subscription + managed service** covers hosting, monitoring, support, security patching, backups/DR validation, ongoing product updates, and 200 hours/year of enhancement capacity.

---
