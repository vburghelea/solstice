# Cost and Value of Services

## Pricing Model Overview

Austin Wallace Tech proposes a fixed-price engagement with milestone-based payments.

| Component         | Amount   | Period   |
| ----------------- | -------- | -------- |
| Implementation    | $600,000 | One-time |
| Annual Operations | $200,000 | Per year |

**Year 1 Total:** $800,000
**Year 2 and beyond:** $200,000 per year

This pricing reflects the value delivered to viaSport, not cost-plus billing. The working prototype reduces delivery risk because viaSport can evaluate a functioning system before contract award.

## Cost Breakdown

### Implementation ($600,000)

| Phase                   | Activities                                                  |
| ----------------------- | ----------------------------------------------------------- |
| Planning and Discovery  | Requirements validation, UX interviews, migration discovery |
| Development             | viaSport configuration, branding, remaining feature work    |
| Data Migration          | Legacy extraction, mapping, validation, import              |
| User Acceptance Testing | UAT environment, test support, defect resolution            |
| Training                | viaSport admin training, train-the-trainer                  |
| PSO Rollout             | Cohort onboarding and go-live support                       |
| Production Deployment   | Monitoring setup and operational handoff                    |

All RFP requirements are included, including completion of partial items (DM-AGG-002, DM-AGG-006, RP-AGG-002).

### Annual Operations ($200,000 per year)

| Category                   | Scope                                             |
| -------------------------- | ------------------------------------------------- |
| Hosting and Infrastructure | AWS ca-central-1, database, storage, CDN, compute |
| Security                   | Monitoring, patching, quarterly reviews           |
| Maintenance                | Bug fixes, dependency updates, performance tuning |
| Support                    | Business hours support, 24 hour response standard |
| Minor Enhancements         | Small improvements within existing scope          |
| Disaster Recovery          | Backups and quarterly DR drills                   |

### Payment Schedule

| Milestone        | Percentage | Amount   | Trigger                          |
| ---------------- | ---------- | -------- | -------------------------------- |
| Contract Signing | 25%        | $150,000 | Signed agreement                 |
| UAT Sign-Off     | 25%        | $150,000 | User acceptance testing complete |
| Go-Live          | 50%        | $300,000 | Production deployment            |

Annual operations are billed quarterly in advance ($50,000 per quarter).

## Factors Affecting Timeline and Price

### Scope Changes

Changes beyond the RFP scope trigger a change order:

| Change Type                  | Process                               |
| ---------------------------- | ------------------------------------- |
| New features not in RFP      | Scope assessment and proposal         |
| Additional integrations      | Integration specification and pricing |
| Major infrastructure changes | Architecture review and options       |

### Change Management Process

1. Change request submitted
2. Impact assessment (scope, timeline, cost)
3. Proposal with options
4. Mutual agreement documented
5. Work proceeds after sign-off

### Factors That Do Not Trigger Price Adjustments

- Normal data volume growth within PostgreSQL capacity
- Standard security updates and patches
- Configuration changes within existing features

## Optional Add-Ons

### Operations Portal (Events and Team Management)

**Estimated:** $50,000 to $100,000 implementation, plus ongoing support

The Solstice platform includes an operations portal used by Quadball Canada. This could be extended to viaSport and PSOs to unify reporting and operations.

### Extended Support Coverage (24/7)

**Estimated:** $30,000 to $50,000 per year additional

Adds after-hours monitoring and response outside business hours.

## In-Kind and Value-Add Contributions

### Value-Add: Working Prototype

A functional prototype already exists:

- 20.1M rows tested with sub-250ms p95 latency
- Majority of system requirements implemented
- Available for evaluator review before contract award

### Value-Add: Source Code Access

Source code access can be provided under mutually agreed terms to support transparency and continuity.

### Pricing Philosophy

Pricing is based on the value delivered, not on hourly billing. The prototype and principal-led delivery model reduce overhead and accelerate implementation compared to traditional project structures.
