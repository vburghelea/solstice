# Executive Summary

viaSport seeks a new foundational digital layer for sport in British Columbia. Austin Wallace Tech Corporation, a proudly local digital solutions provider, has developed the perfect solution in Solstice.

Solstice is a modern information management platform designed for league and event management. The technology is user-friendly and designed to make day-to-day operations like membership signups, payment, team management, and event registration powerful yet intuitive. The system is designed for easy analytics generation, and data can be integrated and responsibly shared across open-source technologies. APIs can securely push reports on data ranging from tournament attendance estimates to league financial projections to third-party applications in near-real time.

Austin Wallace Tech Corporation is uniquely fit to lead this work. Its founder, Austin Wallace, brings real-world experience as a former member of the Canadian National Quadball team to maximize the system's value for amateur sports leagues. As a British Columbian in sports, Wallace also has a personal stake in the success of viaSport's modernization. Wallace and his team are dedicated to bringing the enthusiasm and passion that propelled Wallace to the top tier of Canadian quadball to its client partnerships.

Solstice is an out-of-the-box solution with the ability to handle all 25 requirements in the System Requirements Addendum from Day 1. Austin Wallace Tech Corporation does anticipate customization work to align the product with viaSport's needs, but the underlying capabilities will be available immediately. By procuring Solstice, viaSport will be investing in a solution in which its specific needs, rather than foundational build work, will be the focus of development. viaSport and Austin Wallace Tech will be free to jointly invest their effort and project time on user experience, discovery, migration accuracy, accessibility validation, operational reliability, and adoption.

Solstice is a Software-as-a-Service (SaaS) solution which allows for easy scaling and AI-native integration. The initial subscription will last for a three-year base term with two optional one-year extensions. A one-time implementation fee will be charged to complete initial viaSport configuration, data migration, User Acceptance Testing (UAT), and rollout. The platform subscription and managed service provisions include hosting, monitoring, security patching, support, ongoing product updates, and up to 200 hours/year of enhancement capacity, with additional hours available on a supplemental basis.

Solstice's Service Level Agreement will provide viaSport clear accountability under its integrated, single-vendor delivery and operations model. Implementation and managed services are bundled into a single package, avoiding annual procurements for hosting and support.

## What viaSport is Buying

Solstice is proposed as a **term subscription with managed service**, structured to reduce ongoing procurement overhead and provide clear operational accountability:

- **3-year base term**, with two optional 1-year extensions at viaSport's discretion
- **One-time Implementation** to complete viaSport configuration, data migration, User Acceptance Testing (UAT), and rollout
- **Platform Subscription \+ Managed Service** covering hosting, monitoring, security patching, support, ongoing product updates, and 200 hours/year of enhancement capacity

This integrated, single-vendor delivery and operations model enables viaSport to procure implementation and ongoing managed service under one agreement, avoiding separate annual procurements for hosting and support and ensuring clear accountability through a single Service Level Agreement (SLA).

## What Implementation Focuses On (Enabled by the Pre-Built Baseline)

Most system replacements slip not because teams cannot build features, but because the hardest work happens after the feature checklist is complete:

- Aligning workflows and terminology across diverse organizations
- Validating migration rules against real data and edge cases
- Ensuring accessibility and usability under deadline pressure
- Training and rollout with predictable support load
- Operating reliably during reporting cycles

Because Solstice already implements the requirement set, the implementation phase focuses on these adoption-critical activities.

## Response Overview

| Section                                                        | Summary                                                                                                                   |
| :------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------ |
| **Vendor Fit to viaSport's Needs**                             | Team structure, delivery model, and security posture tailored to viaSport.                                                |
| **Solution Overview**                                          | Workflow summary, admin and PSO capabilities, and migration overview.                                                     |
| **Service Approach: Data Submission and Reporting Web Portal** | Methodology for the full service approach, from data submission through training.                                         |
| **System Requirements Compliance Crosswalk**                   | Requirement-by-requirement status, including finalization scope (viaSport configuration and production data confirmation) |
| **Service Levels, Support, and Reliability**                   | SLAs, monitoring, incident response, and operational commitments.                                                         |
| **Capabilities and Experience**                                | Relevant delivery history and case studies.                                                                               |
| **Commercial Model and Pricing**                               | Term subscription pricing (3+1+1), one-time implementation fee, included services, and options.                           |
| **Project Plan, Timeline, and Delivery Schedule**              | 30-week plan targeting Fall 2026 with UX research, milestones, and cutover.                                               |
| **Prototype Evaluation Guide**                                 | Prototype access and a 15-minute validation path tied to requirement IDs.                                                 |
| **Appendices**                                                 | Performance, security, service levels, exit/portability options, and supporting evidence.                                 |

## Standard Assumptions and Security Posture

The statements below apply across this response unless noted.

### 1.1 Data Residency and Privacy Summary

Primary data stores (RDS PostgreSQL, S3 object storage, backups, and audit archives) are hosted in AWS Canada (Central) (ca-central-1). Authenticated content is configured to avoid edge caching. Email notifications are sent via AWS Simple Email Service (SES) in AWS Canada (Central) (ca-central-1). Once delivered to recipients, messages may transit or be stored by external email providers outside AWS.

### 1.2 Security Model Summary

The security model follows the AWS shared responsibility approach: AWS secures the underlying cloud infrastructure, and we implement and operate the application controls, configuration, and monitoring required for viaSport's use case. The platform implements MFA, role-based access control, organization scoping, and an immutable audit log with tamper-evident hashing.

**Encryption layers:**

- **At rest:** AES-256 via AWS KMS for RDS, S3, and backups
- **In transit:** TLS 1.2+ for all API endpoints and database connections
- **Processing controls:** Application-level field encryption for highly sensitive authentication secrets (TOTP/backup codes), stored as encrypted values in PostgreSQL

Security evidence is summarized in **Appendix D: Security Architecture Summary**. AWS compliance reports (SOC, ISO) are available via AWS Artifact upon request.

### 1.3 Prototype and Data Provenance Summary

A working prototype is available for evaluation in the sin-uat environment. No viaSport confidential data was used. Performance testing is run in sin-perf using synthetic data designed to match the scale characteristics described in the RFP. Performance and accessibility evidence is summarized in **Appendix C: Performance Evidence**. Demo access is provided via a secure Evaluator Access Pack (see **Appendix A**), and a 15-minute validation path is provided in the **Prototype Evaluation Guide**.

## At a Glance

| Dimension              | Status                                                                                                         |
| :--------------------- | :------------------------------------------------------------------------------------------------------------- |
| Evaluation environment | Working system available for evaluator validation (See Section 1.3)                                            |
| Requirements coverage  | 25/25 requirements implemented; finalization scope is documented in the Compliance Crosswalk                   |
| Data Used              | See Section 1.3                                                                                                |
| Performance            | 20M rows, p95 162ms, 25 concurrent users, 0 server errors                                                      |
| Security               | See Section 1.2                                                                                                |
| Timeline               | 30 weeks targeting Fall 2026 launch, including a 6-week discovery and UX research phase (See **Project Plan**) |
| Commercial Model       | 3-year base term \+ two optional 1-year extensions (3+1+1)                                                     |
| Total Cost             | 3-year: **$1.2M** / 5-year: **$1.6M** (implementation + subscription)                                          |

## Key Highlights

**Working Evaluation Environment** Evaluators can log into a working system to validate key workflows and requirements prior to award. Access details are in **Appendix A: Prototype Evaluation Access**. The **Prototype Evaluation Guide** provides a 15-minute, requirement-linked walkthrough. See Section 1.3 for the evaluation environment and data provenance summary.

**Requirements Coverage (January 2026 Evaluation Environment)** The evaluation environment fully implements all 25 System Requirements Addendum items. Finalization scope items (viaSport-specific configuration and inputs) are documented in the **System Requirements Compliance Crosswalk**.

**Security and Residency** See Section 1.1 for data residency and privacy, and Section 1.2 for the security model summary and evidence references.

**Managed Service Model** viaSport is procuring an SLA-backed managed service covering uptime, support response targets, and reliability, with Austin Wallace Tech responsible for day-to-day operations. The subscription includes availability/performance/security monitoring, ticket-based support and incident response, security patching, quarterly DR exercises, and 200 hours/year for ongoing enhancements. See **Commercial Model and Pricing** for details.

**Delivery Timeline** The proposed 30-week timeline targets Fall 2026 launch. The timeline is intentionally structured around discovery gates, IA approval, UAT sign-off, and launch readiness—not feature build completion. Because the baseline system is already built, the timeline is allocated to user research, migration accuracy, accessibility validation, and operational readiness.

## Proposed Team

| Role                              | Name                                        |
| :-------------------------------- | :------------------------------------------ |
| Project Lead / Solution Architect | Austin Wallace                              |
| UX and Accessibility Lead         | Ruslan Hétu                                 |
| System Navigator                  | Soleil Heaney                               |
| Technical Advisor                 | Will Siddall                                |
| Security Advisory                 | Parul Kharub, Michael Casinha, Tyler Piller |

Austin Wallace and Ruslan Hétu lead delivery together throughout the project. Soleil Heaney serves as system navigator, connecting the team to PSO community needs during research and rollout. Details on each team member are in **Vendor Fit to viaSport's Needs**.

## Evaluator Navigation Map

| RFP Evaluation Criterion            | Our Response Section                                                                                                 | Notes                                       |
| :---------------------------------- | :------------------------------------------------------------------------------------------------------------------- | :------------------------------------------ |
| Vendor Fit to viaSport's Needs      | **Vendor Fit to viaSport's Needs**                                                                                   | Company profile, team, differentiators      |
| Solution Overview                   | **Solution Overview**                                                                                                | Non-technical workflow summary              |
| Service Approach and Responsiveness | **Service Approach: Data Submission and Reporting Web Portal** through **Service Approach: Training and Onboarding** | Methodology for each scope item             |
| System Requirements Addendum        | **System Requirements Compliance Crosswalk** and detailed requirement sections                                       | Requirement-by-requirement compliance       |
| Service Levels and Reliability      | **Service Levels, Support, and Reliability** (new section)                                                           | SLAs, monitoring, ops commitments           |
| Capabilities and Experience         | **Capabilities and Experience**                                                                                      | Case studies, automation/AI approach        |
| Cost and Value                      | **Commercial Model and Pricing**                                                                                     | Term pricing, TCO, change management        |
| Timeline and Delivery Schedule      | **Project Plan, Timeline, and Delivery Schedule**                                                                    | Milestones, risks, dependencies             |
| Prototype Validation                | **Prototype Evaluation Guide** and **Appendices**                                                                    | Demo access, performance/security summaries |

Austin Wallace Tech welcomes the opportunity to present the prototype and review the approach with viaSport's evaluation team.

---
