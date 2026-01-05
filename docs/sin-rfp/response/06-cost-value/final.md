# Cost and Value of Services

## Pricing Model Overview

Austin Wallace Tech proposes a fixed-price engagement with transparent pricing and milestone-based payments.

| Component         | Amount   | Period   |
| ----------------- | -------- | -------- |
| Implementation    | $600,000 | One-time |
| Annual Operations | $200,000 | Per year |

**Year 1 Total:** $800,000
**Year 2+ Total:** $200,000 per year

This pricing reflects the value delivered to viaSport, not cost-plus billing. The working prototype significantly de-risks this engagement: viaSport is paying for a proven solution adapted to their needs, not greenfield development.

## Cost Breakdown

### Implementation ($600,000)

| Phase                   | Activities                                                        |
| ----------------------- | ----------------------------------------------------------------- |
| Planning & Discovery    | Requirements validation, UX interviews, migration planning        |
| Development             | Remaining feature work, viaSport-specific configuration, branding |
| Data Migration          | Legacy data extraction, mapping, validation, import               |
| User Acceptance Testing | UAT environment, test support, defect resolution                  |
| Training                | viaSport administrator training, train-the-trainer sessions       |
| PSO Rollout             | Cohort-based PSO onboarding, go-live support                      |
| Production Deployment   | Production environment configuration, monitoring setup            |

All RFP requirements (DM-AGG, RP-AGG, SEC-AGG, TO-AGG, UI-AGG) are included, including completion of the remaining gaps identified in this draft.

### Annual Operations ($200,000/year)

| Category                 | Scope                                                            |
| ------------------------ | ---------------------------------------------------------------- |
| Hosting & Infrastructure | AWS ca-central-1, Multi-AZ database, CDN, storage, compute       |
| Security                 | Ongoing monitoring, security patches, quarterly security reviews |
| Maintenance              | Bug fixes, dependency updates, performance optimization          |
| Support                  | Business hours support (24h response standard, 4h critical)      |
| Minor Enhancements       | Small improvements within existing feature scope                 |
| Disaster Recovery        | Maintained backups, quarterly DR drills                          |

### Payment Schedule

| Milestone        | Percentage | Amount   | Trigger                          |
| ---------------- | ---------- | -------- | -------------------------------- |
| Contract Signing | 25%        | $150,000 | Signed agreement                 |
| UAT Sign-Off     | 25%        | $150,000 | User acceptance testing complete |
| Go-Live          | 50%        | $300,000 | Production deployment            |

Annual operations billed quarterly in advance ($50,000 per quarter).

## Factors Affecting Timeline and Price

### Scope Changes

Changes to scope beyond the RFP requirements would trigger a change order process:

| Change Type                  | Process                                               |
| ---------------------------- | ----------------------------------------------------- |
| New features not in RFP      | Scope assessment, proposal, mutual agreement          |
| Additional integrations      | Integration specification, impact assessment, pricing |
| Major infrastructure changes | Architecture review, proposal with options            |

The change management process ensures no work begins without mutual agreement on scope, timeline, and cost.

### Change Management Process

1. Change request submitted (by either party)
2. Impact assessment (scope, timeline, cost implications)
3. Proposal with options presented
4. Mutual agreement documented
5. Work proceeds only after sign-off

### Factors That Would NOT Trigger Price Adjustments

- Normal data volume growth within PostgreSQL capacity (tested to 20M+ rows, with headroom for projected growth)
- Reasonable support request volume
- Standard security updates and patches
- Configuration changes within existing features

## Optional Add-Ons

### Operations Portal (Events & Team Management)

**Estimated:** $50,000 to $100,000 implementation, plus ongoing support

The Solstice platform includes an operations portal (currently deployed for Quadball Canada) that enables event registration, team management, and membership features. This could be extended to viaSport and PSOs.

**Potential Value:**

- Single source of truth: reporting and operations in one system
- Reduced duplicate data entry for PSOs
- Better analytics: participation data linked to reporting
- Faster compliance: reporting validated against real event data

**Considerations:**

- Expands user base beyond reporters (players, parents, club admins)
- Increases support volume
- Requires scoping discussion to define exact requirements

This is offered as an option, not included in the base proposal.

### Extended Support Coverage (24/7)

**Estimated:** $30,000 to $50,000 per year additional

Standard support covers business hours (Monday to Friday, 9am to 5pm Pacific). Extended coverage would add:

- After-hours monitoring and response
- Critical issue escalation outside business hours
- Weekend and holiday coverage

This would be delivered via subcontractor arrangement.

## In-Kind and Value-Add Contributions

### Value-Add: Working Prototype

The most significant value-add is the working prototype itself. Rather than proposing to build a system, Austin Wallace Tech has already built one:

- 20,000+ lines of tested TypeScript
- Majority of system requirements addressed; remaining items scheduled in the implementation plan
- Load tested with 20.1 million rows
- Available for viaSport evaluation before contract signing

This represents substantial pre-investment that de-risks the engagement for viaSport.

### Value-Add: Source Code Access

Source code access can be provided under mutually agreed terms (e.g., escrow or direct access). This supports:

- Transparency: viaSport can audit the code at any time
- Continuity: If the engagement ends, viaSport retains access to the codebase
- Flexibility: Future development can be performed by any qualified team

### Pricing Philosophy

This pricing represents our best honest value. We do not inflate prices to offer discounts during negotiation. The figures above reflect:

- Efficient modern development practices
- Substantial pre-built functionality (prototype)
- Lean team without enterprise overhead
- Value-based pricing tied to outcomes, not hourly billing

Traditional government IT projects of comparable scope often run $1 to $2 million or more. Our pricing reflects the efficiency of a working prototype and a principal-led delivery model.
