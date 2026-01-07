# Executive Summary

Austin Wallace Tech responds to viaSport British Columbia's Request for Proposal for the Strength in Numbers Project. We built a working prototype that aligns to the System Requirements Addendum and demonstrates delivery feasibility before contract award.

## Response Overview

| Section                                                        | Summary                                                                           |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| **Vendor Fit to viaSport's Needs**                             | Team structure, delivery model, and security posture tailored to viaSport.        |
| **Solution Overview**                                          | Workflow summary, admin and PSO capabilities, and migration overview.             |
| **Service Approach: Data Submission and Reporting Web Portal** | Methodology for the full service approach, from data submission through training. |
| **System Requirements Compliance Crosswalk**                   | Requirement-by-requirement status with built and partial items.                   |
| **Capabilities and Experience**                                | Relevant delivery history and case studies.                                       |
| **Cost and Value of Services**                                 | Implementation and operations pricing with key assumptions.                       |
| **Project Plan, Timeline, and Delivery Schedule**              | 18-week plan, milestones, risks, and cutover focus.                               |
| **Prototype Evaluation Guide**                                 | Live demo access and a 15-minute validation path tied to requirement IDs.         |
| **Appendices**                                                 | Performance, security, and supporting evidence.                                   |

## Standard Assumptions and Security Posture

The statements below apply across this response unless noted.

### 1.1 Data Residency and Privacy Summary

Primary data stores (RDS PostgreSQL, S3 object storage, backups, and audit
archives) are hosted in AWS Canada (Central) (ca-central-1). Authenticated
content is configured to avoid edge caching. Email notifications are delivered
to recipients and may traverse external networks.

### 1.2 Security Model Summary

The security model follows the AWS shared responsibility approach: AWS secures
the underlying cloud infrastructure, and we implement and operate the
application controls, configuration, and monitoring required for viaSport's use
case. The platform implements MFA, role-based access control, organization
scoping, encryption in transit and at rest, and an immutable audit log with
tamper-evident hashing. Security evidence is summarized in **Appendix D:
Security Architecture Summary**. AWS compliance reports (SOC, ISO) are available
via AWS Artifact upon request.

### 1.3 Prototype and Data Provenance Summary

A working prototype is available for evaluation in the sin-uat environment. No
viaSport confidential data was used. Performance testing is run in sin-perf
using synthetic data designed to match the scale characteristics described in
the RFP. Performance and accessibility evidence is summarized in **Appendix C:
Performance Evidence**. Demo credentials are listed in **Appendix A: Live Demo
Access**, and a 15-minute validation path is provided in the **Prototype
Evaluation Guide**.

## At a Glance

| Dimension    | Status                                                                                                     |
| ------------ | ---------------------------------------------------------------------------------------------------------- |
| Prototype    | Working system available for evaluation (See Section 1.3)                                                  |
| Requirements | 22 of 25 built today; 3 partial pending viaSport inputs (See **System Requirements Compliance Crosswalk**) |
| Data Used    | See Section 1.3                                                                                            |
| Performance  | 20.1M rows, sub-250ms p95 latency, final validation run TBD                                                |
| Security     | See Section 1.2                                                                                            |
| Timeline     | 18 weeks from contract to full rollout (See **Project Plan, Timeline, and Delivery Schedule**)             |
| Investment   | $600K implementation + $200K/year operations (See **Cost and Value of Services**)                          |

## Key Highlights

**De-risked Delivery**
A working prototype is available for evaluation. This reduces delivery risk and
allows evaluators to validate requirements directly. Access details are in
**Appendix A: Live Demo Access**. The **Prototype Evaluation Guide** provides a
15-minute validation path tied to requirement IDs. See Section 1.3 for the
standard prototype and data provenance summary.

**Requirements Coverage**
The prototype covers the majority of the System Requirements Addendum today. Three requirements remain partial and are explicitly scoped with viaSport dependencies and delivery approach. The **System Requirements Compliance Crosswalk** provides the requirement-by-requirement view.

**Security and Residency**
See Section 1.1 for data residency and privacy, and Section 1.2 for the
security model summary and evidence references.

**Delivery Timeline**
The proposed 18-week timeline is achievable because the core platform is already built. Remaining work is discovery, migration execution, viaSport-specific configuration, and production hardening.

## Proposed Team

| Role                              | Name                                        |
| --------------------------------- | ------------------------------------------- |
| Project Lead / Solution Architect | Austin Wallace                              |
| Sport Sector Advisor              | Soleil Heaney                               |
| Technical Advisor                 | Will Siddall                                |
| UX and Accessibility Advisor      | Ruslan Hétu                                 |
| Security Advisory                 | Parul Kharub, Michael Casinha, Tyler Piller |

Austin Wallace leads delivery directly. Advisory partners provide domain
expertise, technical review, and validation. Details on each advisor are in
**Vendor Fit to viaSport's Needs**.

## Evaluator Navigation Map

| RFP Evaluation Criterion            | Our Response Section                                                                                                 | Notes                                       |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| Vendor Fit to viaSport's Needs      | **Vendor Fit to viaSport's Needs**                                                                                   | Company profile, team, differentiators      |
| Solution Overview                   | **Solution Overview**                                                                                                | Non-technical workflow summary              |
| Service Approach and Responsiveness | **Service Approach: Data Submission and Reporting Web Portal** through **Service Approach: Training and Onboarding** | Methodology for each scope item             |
| System Requirements Addendum        | **System Requirements Compliance Crosswalk** and detailed requirement sections                                       | Requirement-by-requirement compliance       |
| Capabilities and Experience         | **Capabilities and Experience**                                                                                      | Case studies, automation/AI approach        |
| Cost and Value                      | **Cost and Value of Services**                                                                                       | Pricing, breakdown, change management       |
| Timeline and Delivery Schedule      | **Project Plan, Timeline, and Delivery Schedule**                                                                    | Milestones, risks, dependencies             |
| Prototype Validation                | **Prototype Evaluation Guide** and **Appendices**                                                                    | Demo access, performance/security summaries |

Austin Wallace Tech welcomes the opportunity to present the prototype and review the approach with viaSport's evaluation team.
