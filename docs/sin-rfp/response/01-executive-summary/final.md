# Executive Summary

Austin Wallace Tech responds to viaSport British Columbia's Request for Proposal for the Strength in Numbers Project. We built a working prototype that aligns to the System Requirements Addendum and demonstrates delivery feasibility before contract award.

**Data Provenance:** The prototype was built using synthetic test data designed to match viaSport's scale characteristics. No viaSport confidential data was accessed or used in development or testing.

## At a Glance

| Dimension    | Status                                                                    |
| ------------ | ------------------------------------------------------------------------- |
| Prototype    | Working system available for evaluation (see Section 01-B and Appendix A) |
| Requirements | 22 of 25 built today; 3 partial pending viaSport inputs (see Section 04)  |
| Data Used    | Synthetic only, no confidential viaSport data                             |
| Performance  | 20.1M rows, sub-250ms p95 latency, final validation run TBD               |
| Security     | MFA, RBAC, audit chain, S3 Object Lock, Canadian data residency           |
| Timeline     | 18 weeks from contract to full rollout (see Section 07)                   |
| Investment   | $600K implementation + $200K/year operations (see Section 06)             |

## Key Highlights

**De-risked Delivery**
A working prototype already exists and is available for evaluation. This reduces delivery risk and allows evaluators to validate requirements directly, not through a promise. Access details are in Appendix A. The Prototype Evaluation Guide in Section 01-B provides a 15-minute validation path tied to requirement IDs.

**Requirements Coverage**
The prototype covers the majority of the System Requirements Addendum today. Three requirements remain partial and are explicitly scoped with viaSport dependencies and delivery approach. The compliance crosswalk in Section 04 provides the requirement-by-requirement view.

**Security and Residency**
All data is hosted in AWS ca-central-1 (Canada). The platform implements MFA, role-based access control, organization scoping, encryption in transit and at rest, and an immutable audit log with tamper-evident hashing. Security evidence is summarized in Appendix D.

**Delivery Timeline**
The proposed 18-week timeline is achievable because the core platform is already built. Remaining work is discovery, migration execution, viaSport-specific configuration, and production hardening.

## Proposed Team

| Role                         | Team Member    |
| ---------------------------- | -------------- |
| Project Lead / Data Engineer | Austin Wallace |
| Senior Developer             | Will Siddal    |
| Security Expert              | TBD            |
| UX Designer                  | TBD            |

Austin Wallace, the architect and primary developer of the prototype, will lead delivery directly to maintain continuity and accountability.

## Evaluator Navigation Map

| RFP Evaluation Criterion            | Our Response Section                         | Notes                                 |
| ----------------------------------- | -------------------------------------------- | ------------------------------------- |
| Vendor Fit to viaSport's Needs      | 02-vendor-fit                                | Company profile, team, differentiator |
| Service Approach and Responsiveness | 03-service-approach (6 files)                | Methodology for each scope item       |
| System Requirements Addendum        | 04-system-requirements (5 files + crosswalk) | Per-requirement compliance            |
| Capabilities and Experience         | 05-capabilities-experience                   | Case studies, AI approach, team       |
| Cost and Value                      | 06-cost-value                                | Pricing, breakdown, change management |
| Timeline and Delivery Schedule      | 07-delivery-schedule                         | Milestones, risks, dependencies       |
| Prototype Validation                | 01-B-prototype-evaluation-guide + Appendices | Demo access, test results             |

Austin Wallace Tech welcomes the opportunity to present the prototype and review the approach with viaSport's evaluation team.
