# Austin's Notes - Cost & Value

## Pricing Model

| Component             | Amount        | Notes                                             |
| --------------------- | ------------- | ------------------------------------------------- |
| **Implementation**    | $600,000      | One-time, covers all delivery phases              |
| **Annual Operations** | $200,000/year | Support, maintenance, hosting, minor enhancements |

**Total Year 1**: $800,000
**Ongoing (Year 2+)**: $200,000/year

## Payment Terms

| Milestone        | Percentage | Amount   | Trigger                     |
| ---------------- | ---------- | -------- | --------------------------- |
| Contract signing | 25%        | $150,000 | Signed agreement            |
| UAT sign-off     | 25%        | $150,000 | Acceptance testing complete |
| Go-live          | 50%        | $300,000 | Production deployment       |

Annual operations billed quarterly in advance ($50,000/quarter).

## What's Included

### Implementation ($600k)

- All RFP requirements (DM-AGG, RP-AGG, SEC-AGG, TO-AGG, UI-AGG)
- Planning & UX interviews
- Development & migration
- UAT support
- viaSport admin training
- PSO rollout support
- Production deployment

### Annual Operations ($200k/year)

- Hosting & infrastructure (AWS ca-central-1)
- Security monitoring & updates
- Bug fixes & maintenance
- Support (24h response standard, 4h critical - business hours)
- Minor enhancements within existing feature scope
- Quarterly security reviews

## What's NOT Included (Change Orders)

Large features beyond the stated requirements are not included. Examples:

- New integrations not specified in RFP
- Major new feature modules
- Custom API development for third parties

## Optional Add-Ons

### 1. Operations Portal (Events & Team Management)

**Estimated**: $50-100k implementation + ongoing support TBD

Enables event registration, team management, and membership features for viaSport and PSOs. Currently built for Quadball Canada tenant.

**Value to viaSport:**

- Single source of truth: reporting + operations in one system
- Reduced duplicate entry for PSOs
- Better analytics: participation data linked to reporting
- Faster compliance: reporting validated against real event data

**Considerations:**

- Expands user base (players, parents, club admins)
- Increases support volume
- Requires data model extension to tie operations to SIN organizations

See: `/docs/sin-rfp/requirements/sin-dual-portal-considerations.md`

### 2. 24/7 Support Coverage

**Estimated**: $30-50k/year additional

Extended support coverage outside business hours via subcontractor.

**Includes:**

- After-hours monitoring and response
- Critical issue escalation
- Weekend/holiday coverage

**Note:** Would require subcontracting arrangement.

## Infrastructure Cost Breakdown (Internal Reference)

| Component                      | Monthly       | Annual            |
| ------------------------------ | ------------- | ----------------- |
| RDS PostgreSQL (production)    | ~$250         | ~$3,000           |
| Lambda / compute               | ~$50-100      | ~$600-1,200       |
| S3 storage                     | ~$20-50       | ~$240-600         |
| CloudFront CDN                 | ~$20-50       | ~$240-600         |
| SES email                      | ~$10-20       | ~$120-240         |
| Other (SQS, EventBridge, etc.) | ~$20          | ~$240             |
| **Total Infrastructure**       | **~$400-500** | **~$5,000-6,000** |

_Note: These are internal costs. Pricing is value-based, not cost-plus._

## Change Order Triggers

Changes that would trigger a scope discussion and potential change order:

1. **Scope changes** - New features or functionality not in the RFP requirements
2. **Major infrastructure changes** - If data volumes require switching to e.g. Redshift (unlikely given PostgreSQL's capacity for 500M+ rows)
3. **Additional integrations** - External system integrations beyond what's specified

## Change Management Process

1. Change request submitted (either party)
2. Impact assessment (scope, timeline, cost)
3. Proposal with options
4. Mutual agreement before work begins
5. Documentation in decision log

## In-Kind / Value-Add

**Philosophy:** We believe in giving the best honest price upfront rather than inflating prices to offer discounts. The pricing above represents our best value - no hidden margins to negotiate away.

## Value-Based Pricing Philosophy

This pricing reflects **value to viaSport**, not cost-plus:

- Replacing 15-year-old systems that no longer meet needs
- Enabling 60 PSOs to submit data efficiently
- Modern analytics for policy and funding decisions
- Reduced staff time on manual data wrangling
- Risk reduction from proven, load-tested platform
- Canadian data residency for PIPEDA compliance

**The prototype de-risks this engagement significantly.** viaSport is not paying for greenfield development - they're paying for a proven solution adapted to their needs.

## Comparison Context

Traditional government IT projects of this scope often run $1-2M+. Our pricing reflects:

- Efficient modern development practices
- Working prototype (90% built)
- Lean team without enterprise overhead
- Value-based, not hourly billing
