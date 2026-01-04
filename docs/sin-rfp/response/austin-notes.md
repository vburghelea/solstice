# Austin's Notes - RFP Response Strategy

## Timeline

- **Deadline**: January 9th (6 days)
- **Reviewer time needed**: Yes - need solid draft in 3-4 days
- **viaSport follow-up**: Monday Jan 5th - ask for interview, budget, questions from viasport-questions.md

## Competition & Budget

- Unknown who else is bidding
- Budget guess: ~$1M/year (need to confirm in interview)
- Requested interview Dec 24, waiting for post-holiday response

## Strongest Angles

### 1. Working Prototype (MAJOR differentiator)

- Fully functional, load-tested website
- 90% meets 90% of their requirements already
- Built to their spec in a few weeks
- **Position as**: Major de-risking prototype
- **Action item**: Consider deploying to prod with smaller infra, provide login/link
- "I am sure nobody else will have that"

### 2. Local + Domain Expertise

- Lives in BC
- Bachelor's degree in Analytical Sports Management from UBC
- Started building event management platform out of passion for quidditch (may not mention)
- Knows and cares about sports management and information

### 3. Speed of Delivery (implicit)

- Built prototype in weeks
- AI-assisted development (won't disclose)
- Put in "ton of effort" on security, quality

## Key Concerns

### 1. Pricing Strategy

- Don't know viaSport's budget
- Wants VALUE-BASED pricing, not hourly
- Reasoning: AI makes hours misleading; charge for outcomes/features
- Need help estimating what features are worth to viaSport

### 2. Experience Gap

- First RFP response ever
- Never led a project like this
- Professional background: Data Engineer

### 3. Team Not Finalized

- Bringing on: Security expert, Full stack dev, Maybe UX designer
- Worried it looks bad without them signed on
- Need to figure out how to present this

## Pricing Deep Dive

### Cost Structure (Austin's estimates)

- **Infra**: $10-30k/year (depends on tier)
- **Labor**: ~$36k rough estimate (3 people × $100/hr × 10hr/week × 3 months)
- **Total floor**: ~$50-70k if going lean

### Pricing Strategy

- Want VALUE-BASED pricing, not hourly
- Concern: Bidding $200k when others bid $1M could be disqualifying
- Need to estimate what features are worth to viaSport
- Budget guess ~$1M/year for full build + Year 1 ops (need to confirm)

### Questions for viaSport Interview (Monday Jan 5)

- What's the budget range?
- Questions from viasport-questions.md
- Support expectations - business hours or 24/7?
- What external integrations are needed?
- How many orgs/users need training?

**Migration-critical (high priority):**

- What systems hold the data? (BCAR, BCSI - what tech stack?)
- Can you export to CSV/Excel? Or do we need direct DB access?
- Do you have schema documentation for BCAR/BCSI?
- Can you share schemas (not data) before contract finalization?
- Are there APIs we can use, or is it export-only?
- Who maintains the legacy systems? Will they be available during migration?
- What's the data quality like? Known issues?

### Austin's Gut Pricing

- **Year 1**: $800k (vast majority is margin - value-based pricing)
- **Ongoing**: $200k/year (support + infra, feature dev extra)
- **Floor**: ~$300k (minimum viable for Austin)

### Pricing Philosophy

- Pricing for VALUE to viaSport, not cost-plus
- Feature development beyond initial scope = extra (need to confirm if standard)

### Key Risks to Price In

1. Data access during migration - how will it work?
2. Data quality unknowns in 20M+ rows
3. Training/support expectations (24h? business hours?)
4. External integration requirements (unknown scope)

## Value to viaSport (Need to Research/Ask)

### Known: User Base Scale

- **60 sport organizations** submit data to viaSport
  - 54 Accredited (49 Provincial/Disability + 5 Multi-sport)
  - 2 Recognized
  - 4 Affiliated
- Examples: Basketball BC, BC Soccer, Swim BC, Gymnastics BC

### Unknown - Questions for Interview

- How many viaSport staff work with data currently?
- How many users per PSO typically access the system?
- What are the biggest pain points with current BCAR/BCSI systems?
- How much staff time is spent on manual data wrangling?
- What decisions are they NOT able to make today due to data limitations?
- What's their current annual spend on the legacy systems?
- Are there compliance/reporting deadlines they struggle to meet?

### Value Arguments to Develop

- Staff time savings (viaSport + 60 PSOs)
- Faster reporting cycles
- Better decision-making from analytics
- Reduced support burden with modern UX
- Risk reduction from replacing 15-year-old systems
- Enabling AI-powered insights (they explicitly want this)

## Team Status

| Role                 | Person                     | Status                             |
| -------------------- | -------------------------- | ---------------------------------- |
| Lead / Data Engineer | Austin                     | Committed                          |
| Security Expert      | TBD (referral in progress) | In progress                        |
| Full Stack Dev       | Will Siddal                | Committed (worked together before) |
| UX Designer          | TBD                        | Reached out, waiting               |

### Commitment Level

- Verbal commitment
- Named in proposal
- Available for interviews
- Contracts negotiated if awarded

### Austin's Assessment

- "Couldn't get the contract without them" (credibility)
- "Could build it solidly without them" (capability)
- "They will raise the ceiling and floor both on quality"

## Demo/Prototype Deployment

### Current Blockers

- Login issues still happening sometimes
- Prod stage spins up expensive resources (t4g.large, multi-AZ, etc.)

### Options

- Deploy to `sin-perf` (t4g.large but no multi-AZ)
- Create custom `sin-demo` stage with dev-level resources
- Fix login issues first

### SST Infra Tiers (from sst.config.ts)

- dev: t4g.micro, 50GB
- perf: t4g.large, 200GB, no multi-AZ
- prod: t4g.large, 200GB, multi-AZ, 35-day backups

## Open Questions for Austin

- (to be filled in during interview)
