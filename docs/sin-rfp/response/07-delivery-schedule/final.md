# Project Plan, Timeline, and Delivery Schedule

## Timeline and Milestones

Austin Wallace Tech proposes an 18-week implementation timeline from contract signing to full rollout.

| Phase                   | Duration | Key Activities                                              | Milestone             |
| ----------------------- | -------- | ----------------------------------------------------------- | --------------------- |
| Planning & Discovery    | 2 weeks  | UX interviews, requirements refinement, migration discovery | Requirements Sign-Off |
| Development & Migration | 6 weeks  | Feature refinement, viaSport configuration, data migration  | Code Complete         |
| User Acceptance Testing | 4 weeks  | viaSport testing, defect resolution, acceptance sign-off    | UAT Sign-Off          |
| viaSport Training       | 2 weeks  | Admin training, documentation handoff, support preparation  | Soft Launch           |
| PSO Rollout             | 4 weeks  | PSO onboarding, tiered training, support ramp-up            | Full Rollout          |

**Total Duration:** 18 weeks

### Why This Timeline is Achievable

Traditional information management system implementations of this scope typically require 24 to 36 weeks. Our accelerated timeline is possible because the working prototype already addresses all 25 system requirements:

| Traditional Phase         | Status   | Remaining Work                       |
| ------------------------- | -------- | ------------------------------------ |
| Architecture              | Complete | None                                 |
| Authentication & Security | Complete | Production hardening                 |
| Core Features             | Complete | UX refinements per viaSport feedback |
| Analytics Platform        | Complete | None                                 |
| Migration Tooling         | Complete | Extraction depends on legacy systems |

Remaining work is refinement and migration, not greenfield development.

### Phase Details

**Planning & Discovery (Weeks 1-2)**

- Kickoff meeting and project plan confirmation
- UX interviews with viaSport stakeholders
- Requirements validation against prototype
- Migration discovery (legacy system access, schema documentation)
- Brand asset collection (logo, colors, style guidelines)

**Development & Migration (Weeks 3-8)**

- viaSport-specific configuration and branding
- UX refinements based on interview findings
- Legacy data extraction and mapping
- Data migration with validation
- Production environment preparation

**User Acceptance Testing (Weeks 9-12)**

- UAT environment with production-like data
- viaSport test scenarios executed
- Defect identification and resolution
- Performance validation
- Security review

**viaSport Training (Weeks 13-14)**

- Administrator training sessions
- Train-the-trainer preparation
- Documentation and runbook handoff
- Support process activation
- **Soft Launch:** viaSport administrators active on platform

**PSO Rollout (Weeks 15-18)**

- Cohort-based PSO onboarding (15 PSOs per week)
- Live training sessions with Q&A
- Support ramp-up and monitoring
- Legacy systems archived
- **Full Rollout:** All 60 PSOs onboarded

## Governance and Communications

### Communication Cadence

| Frequency | Participants                              | Purpose                                            |
| --------- | ----------------------------------------- | -------------------------------------------------- |
| Weekly    | Austin Wallace + viaSport Project Manager | Status updates, blockers, decisions                |
| Bi-weekly | Steering committee                        | Milestone review, escalations, strategic decisions |
| As needed | Technical stakeholders                    | Deep-dives, UX reviews, migration planning         |

### Reporting

viaSport will receive:

- Weekly status reports summarizing progress, risks, and upcoming work
- Milestone completion reports with deliverable sign-off
- Defect status reports during UAT
- Post-go-live support reports (monthly)

### Decision-Making

| Decision Type              | Authority                               |
| -------------------------- | --------------------------------------- |
| Day-to-day implementation  | Austin Wallace (Project Lead)           |
| Requirements clarification | viaSport Project Manager                |
| Scope changes              | Mutual agreement (change order process) |
| Go-live readiness          | viaSport Project Sponsor                |

## Project Team and Roles

| Role                     | Team Member     | Responsibilities                                                     |
| ------------------------ | --------------- | -------------------------------------------------------------------- |
| Project Lead / Architect | Austin Wallace  | Architecture, delivery oversight, viaSport liaison, data engineering |
| Senior Developer         | Will Siddal     | Feature development, bug fixes, frontend implementation              |
| Security Expert          | TBD (confirmed) | Security review, penetration testing, compliance validation          |
| UX Designer              | TBD (confirmed) | User research, interface refinement, accessibility audit             |

All team members are based in British Columbia.

### viaSport Roles (Requested)

| Role                   | Responsibilities                               |
| ---------------------- | ---------------------------------------------- |
| Project Manager        | Day-to-day coordination, decision facilitation |
| Project Sponsor        | Sign-off authority, escalation point           |
| Subject Matter Experts | UX interviews, requirements clarification      |
| UAT Testers            | Acceptance testing execution                   |
| PSO Coordinator        | PSO communication and scheduling               |

## Risks, Assumptions, and Dependencies

### Dependencies on viaSport

The proposed timeline assumes prompt collaboration from viaSport on:

| Dependency         | Timing      | Impact if Delayed                   |
| ------------------ | ----------- | ----------------------------------- |
| Legacy data access | Week 1      | Migration timeline at risk          |
| Brand assets       | Week 2      | Branding work delayed               |
| SME availability   | Weeks 1-2   | UX refinements based on assumptions |
| UAT testers        | Weeks 9-12  | UAT duration extended               |
| PSO coordination   | Weeks 15-18 | Rollout schedule impacted           |

### Assumptions

- viaSport can provide export capability or schema documentation for BCAR/BCSI
- viaSport staff are available for scheduled interviews and reviews
- No major scope changes after requirements sign-off
- PSOs are responsive to onboarding communications

### Risk Register

| Risk                       | Likelihood | Impact | Mitigation                                                    |
| -------------------------- | ---------- | ------ | ------------------------------------------------------------- |
| Legacy data access delayed | Medium     | High   | Begin migration discovery in Week 1; escalate early           |
| Data quality issues        | Medium     | Medium | Validation tooling built in; budget time in Development phase |
| viaSport SME availability  | Low        | Medium | Schedule interviews early; provide async options              |
| Scope creep                | Low        | High   | Weekly check-ins; formal change request process               |
| PSO adoption resistance    | Low        | Medium | Train-the-trainer approach; viaSport champions                |

### Timeline Commitment

This timeline represents our realistic assessment based on the working prototype and assumed collaboration. We acknowledge that external factors (data quality, legacy system access, stakeholder availability) could impact delivery.

We commit to:

- Early identification of risks and blockers
- Transparent communication if timeline adjustments become necessary
- Collaborative problem-solving to maintain schedule where possible

The working prototype significantly de-risks technical delivery. Remaining work is refinement and migration, not building from scratch.
