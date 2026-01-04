# Austin's Notes - 05 Capabilities & Experience

## What the RFP Asks For

1. Demonstrated success with information management system implementation
2. Partners/subcontractors and their roles, oversight, continuity
3. List of services to non-profit, charity, amateur sport, or public clients
4. Case studies of comparable projects (preferably Canadian NPO/public sector)
5. How the solution uses automation and/or AI
6. Responsible AI approach (transparency, privacy, bias mitigation, human-in-the-loop)
7. Use of open standards, APIs, open-source for interoperability

## 1. Demonstrated Success - Information Management Systems

### Austin's Direct Experience

- **New Jersey Devils**: Sole Data Developer, built end-to-end data platform
  - 10M rows/game NHL tracking data
  - 40+ dbt models
  - Supported multi-million dollar decisions
- **Clio**: 10+ Databricks pipelines, $1M+ value unlocked
- **Teck Resources**: Transformed legacy systems to modern testable architecture

### The Prototype as Proof

- Solstice: 20k+ lines of tested TypeScript
- Built to viaSport's spec
- Load tested
- 90% of requirements already implemented
- "This IS the case study - a working system built for viaSport"

## 2. Partners/Subcontractors

| Role             | Person         | Responsibilities                                             | Status      |
| ---------------- | -------------- | ------------------------------------------------------------ | ----------- |
| Lead / Architect | Austin Wallace | Architecture, data engineering, project management, delivery | Committed   |
| Full Stack Dev   | Will Siddal    | Frontend/backend development, feature implementation         | Committed   |
| Security Expert  | TBD            | Security review, penetration testing, compliance validation  | In progress |
| UX Designer      | TBD            | User research, interface design, accessibility               | Reached out |

### Oversight Mechanisms

- (TBD - how will Austin oversee contractors?)

### Continuity of Services

- (TBD - what happens if a contractor leaves?)

## 3. Non-profit/Public Sector Clients

### Direct Experience

- **International Quidditch Association** (as Chair, not vendor)
  - Led governance for 30+ national governing bodies
  - Understands NPO operations from the inside

### Team Experience

- (To be updated based on Will + other team members' backgrounds)

## 4. Case Studies

### Primary Case Study: Solstice Platform (for viaSport)

- Purpose-built for this RFP
- Working prototype available for demo
- Covers: data submission, reporting, user management, security, analytics
- (Frame as "proof of capability" not "already done")

### Supporting: Qdrill

- Production app used by real athletes (including Team Canada)
- 87k+ LOC
- Demonstrates ability to ship user-facing sports software

### Supporting: Devils Data Platform

- Enterprise-scale sports data
- 10M rows/game ingestion
- Real-time analytics supporting million-dollar decisions

## 5. Automation & AI in the Solution

### AUTOMATION (Strong - Production Ready)

| Feature                     | Schedule     | Purpose                                           |
| --------------------------- | ------------ | ------------------------------------------------- |
| **Scheduled Notifications** | Every 5 min  | Process queued notifications, send digests        |
| **Retention Enforcement**   | Daily        | Purge old data, archive audit logs to S3          |
| **Data Quality Monitor**    | Daily        | Scan submissions, track completeness, flag issues |
| **Notification Queue**      | Event-driven | Async email delivery with retry + DLQ             |
| **Batch Import Worker**     | On-demand    | Process large CSV/Excel imports via ECS Fargate   |
| **Health Monitoring**       | On-demand    | Database & service health checks                  |
| **Audit Logging**           | Real-time    | Immutable log of all automated actions            |

### Technical Infrastructure

- AWS EventBridge (cron scheduling)
- AWS Lambda (serverless jobs)
- AWS SQS FIFO (notification queue with deduplication)
- AWS ECS Fargate (batch processing - 2 vCPU, 4 GB RAM)
- AWS S3 (artifact storage with KMS encryption)
- AWS SES (email delivery)
- AWS CloudWatch (metrics, alarms, logs)

### Data Quality Features

- Schema-based validation during import
- Completeness scoring (% of fields filled)
- Missing field detection
- Error classification (parse vs validation)
- Per-organization quality metrics dashboard

### Compliance Automation

- Legal hold support (prevents purging held data)
- Immutable audit log with hash chain
- Automatic archival to S3 DEEP_ARCHIVE

### AI Features

**Current state: None implemented**

The RFP asks for "potential AI-enabled features" and "AI-enabled insights" - this is listed as desirable, not required.

### Decision: Propose AI in Year 1 Roadmap

See `/docs/sin-rfp/tickets/AI-FEATURE-OPTIONS.md` for full details.

**Recommended Year 1 AI features to propose:**

1. AI Report Narratives - generate board-ready summaries from data
2. Natural Language Query - ask questions in plain English
3. Semantic Document Search - find submissions by meaning
4. AI Dashboard Builder - describe charts, get visualizations
5. Data Quality AI - auto-detect anomalies and errors
6. Submission Assistant - help PSOs fill forms correctly

**Framing for proposal:**

- "AI-ready architecture with specific features prioritized in collaboration with viaSport"
- Leverage Austin's Clio experience (wrote AI best practices, 20x responsible AI adoption)
- Emphasize responsible AI: human-in-the-loop, transparency, privacy protection

## 6. Responsible AI Approach

(TBD based on what AI features exist)

### Principles to include:

- Transparency about what AI does
- Human-in-the-loop for decisions
- Privacy protection
- Bias awareness

## 7. Open Standards, APIs, Open Source

### Open Standards

- (What standards does Solstice use?)

### APIs

- (What APIs does Solstice expose/consume?)

### Open Source

- Built on open source stack: React, TanStack, PostgreSQL, etc.
- (Is any of Solstice itself open source?)

## Open Questions

- What's Will Siddal's relevant background?
- Who is the security expert and what's their background?
- What specific AI/automation features should we highlight?
