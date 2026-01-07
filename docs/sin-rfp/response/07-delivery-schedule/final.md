# Project Plan, Timeline, and Delivery Schedule

## Timeline and Milestones

Austin Wallace Tech proposes an 18-week implementation timeline from contract signing to full rollout.

| Phase                     | Duration | Key Activities                                              | Milestone             |
| ------------------------- | -------- | ----------------------------------------------------------- | --------------------- |
| Planning and Discovery    | 2 weeks  | UX interviews, requirements refinement, migration discovery | Requirements Sign-Off |
| Development and Migration | 6 weeks  | Feature refinement, viaSport configuration, data migration  | Code Complete         |
| User Acceptance Testing   | 4 weeks  | viaSport testing, defect resolution, acceptance sign-off    | UAT Sign-Off          |
| viaSport Training         | 2 weeks  | Admin training, documentation handoff                       | Soft Launch           |
| PSO Rollout               | 4 weeks  | PSO onboarding, training, support ramp-up                   | Full Rollout          |

**Total Duration:** 18 weeks

### Why This Timeline is Achievable

The core platform already covers the majority of system requirements (see
Section 1.3), so remaining work focuses on discovery, migration, and production
hardening.

| Phase                       | Status           | Remaining Work                          |
| --------------------------- | ---------------- | --------------------------------------- |
| Architecture                | Complete         | None                                    |
| Authentication and Security | Complete         | Production hardening and pen test (TBD) |
| Core Features               | Largely complete | UX refinements per viaSport feedback    |
| Analytics Platform          | Complete         | Dataset tuning with viaSport            |
| Migration Tooling           | Complete         | Extraction from BCAR and BCSI           |

## Phase Details

**Planning and Discovery (Weeks 1-2)**

- Kickoff and project plan confirmation
- UX interviews with viaSport stakeholders
- Requirements validation against prototype
- Migration discovery (legacy access, schema documentation)
- Brand asset collection (logo, colors, style guidelines)

**Development and Migration (Weeks 3-8)**

- viaSport specific configuration and branding
- UX refinements based on interview findings
- Legacy data extraction and mapping
- Data migration with validation
- Production environment preparation

**User Acceptance Testing (Weeks 9-12)**

- UAT in sin-uat with evaluator access
- Test scenarios mapped to requirement IDs
- Defect identification and resolution
- Performance validation and security review (final runs TBD)

**viaSport Training (Weeks 13-14)**

- Administrator training sessions
- Train-the-trainer preparation
- Documentation and runbook handoff
- Support process activation

**PSO Rollout (Weeks 15-18)**

- Cohort based PSO onboarding (cohort size TBD with viaSport)
- Live training sessions with Q and A
- Support ramp-up and monitoring
- Legacy systems archived

See **Service Approach: Data Migration** for the detailed cutover plan, including data freeze window, hypercare period, and rollback criteria.

## Governance and Communications

### Communication Cadence

| Frequency | Participants                                | Purpose                           |
| --------- | ------------------------------------------- | --------------------------------- |
| Weekly    | Austin Wallace and viaSport Project Manager | Status updates and blockers       |
| Bi-weekly | Steering committee                          | Milestone review and escalations  |
| As needed | Technical stakeholders                      | UX reviews and migration planning |

### Reporting

viaSport will receive:

- Weekly status reports
- Milestone completion reports with sign-off
- Defect status reports during UAT
- Post-go-live support reports (monthly)

### Decision-Making

| Decision Type              | Authority                         |
| -------------------------- | --------------------------------- |
| Day-to-day implementation  | Austin Wallace                    |
| Requirements clarification | viaSport Project Manager          |
| Scope changes              | Mutual agreement via change order |
| Go-live readiness          | viaSport Project Sponsor          |

## Risks, Assumptions, and Dependencies

### Dependencies on viaSport

| Dependency         | Timing      | Impact if Delayed          |
| ------------------ | ----------- | -------------------------- |
| Legacy data access | Week 1      | Migration timeline at risk |
| Brand assets       | Week 2      | Branding work delayed      |
| SME availability   | Weeks 1-2   | UX refinements delayed     |
| UAT testers        | Weeks 9-12  | UAT duration extended      |
| PSO coordination   | Weeks 15-18 | Rollout schedule impacted  |

### Assumptions

- viaSport can provide export capability or schema documentation for BCAR and BCSI
- viaSport staff are available for interviews and reviews
- No major scope changes after requirements sign-off
- PSOs are responsive to onboarding communications

### Risk Register

| Risk                       | Likelihood | Impact | Mitigation                             |
| -------------------------- | ---------- | ------ | -------------------------------------- |
| Legacy data access delayed | Medium     | High   | Begin migration discovery in Week 1    |
| Data quality issues        | Medium     | Medium | Validation tooling and pilot migration |
| viaSport SME availability  | Low        | Medium | Schedule interviews early              |
| Scope creep                | Low        | High   | Weekly check-ins and change control    |
| PSO adoption resistance    | Low        | Medium | Train-the-trainer and PSO champions    |

## Timeline Commitment

This timeline reflects our assessment based on the existing prototype and assumed collaboration. We will identify blockers early and communicate any required adjustments.
