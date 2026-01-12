# Project Plan, Timeline, and Delivery Schedule

## Timeline and Milestones

Austin Wallace Tech proposes a 30-week implementation timeline targeting Fall 2026 launch. This timeline prioritizes comprehensive UX research and community engagement to ensure the platform truly meets user needs.

| Phase                         | Duration | Key Activities                                                                      | Milestone           |
| :---------------------------- | :------- | :---------------------------------------------------------------------------------- | :------------------ |
| Discovery and Research        | 6 weeks  | User research, user observation sessions, legacy system analysis                    | Research Synthesis  |
| Information Architecture (IA) | 4 weeks  | User-driven categorization exercises, navigation validation testing                 | IA Approval         |
| Design and Prototyping        | 8 weeks  | Wireframes, high-fidelity design, interactive prototyping                           | Design Finalization |
| User Acceptance Testing       | 4 weeks  | Usability testing, accessibility validation, Assistive Technology (AT) user testing | UAT Sign-Off        |
| Remediation and Refinement    | 4 weeks  | Address UAT findings, design QA, launch preparation                                 | Launch Approval     |
| Training and Launch           | 4 weeks  | Training materials, soft launch, phased rollout                                     | Full Rollout        |

**Total Duration:** 30 weeks

**Target Dates:**

- Project Start: Upon contract award (estimated Q1 2026)
- Soft Launch: Week 29 (pilot cohort)
- Full Rollout: Week 30 (Fall 2026\)

### Why This Timeline

The timeline reflects our commitment to getting the user experience right. The core platform already covers the majority of system requirements, so the additional time focuses on:

- **Proper user research** with viaSport staff and PSO representatives across British Columbia
- **Community-informed design** with Soleil Heaney as system navigator connecting the team to sport sector needs
- **Comprehensive UAT** including assistive technology user testing
- **Phased rollout** with pilot cohorts before full deployment

| Phase                       | Status           | Remaining Work                        |
| :-------------------------- | :--------------- | :------------------------------------ |
| Architecture                | Complete         | None                                  |
| Authentication and Security | Complete         | Production hardening                  |
| Core Features               | Largely complete | UX refinements per community research |
| Analytics Platform          | Complete         | Dataset tuning with viaSport          |
| Migration Tooling           | Complete         | Extraction from BCAR and BCSI         |

## Phase Details

**Phase 1: Discovery and Research (Weeks 1-6)**

- Finalize UX team engagement and research protocols
- Stakeholder alignment workshop with viaSport
- User observation sessions in work environment (12-15 participants)
- Jobs-to-be-Done interviews (15-20 participants)
- Diary studies during actual reporting periods (6-8 participants)
- Legacy system analytics audit (support tickets, usage patterns)
- Migration discovery (legacy access, schema documentation)
- Brand asset collection

**Deliverables:** User personas, current-state journey maps, research synthesis report, design principles

**Milestone:** Week 6 \- Research Findings Presentation

**Phase 2: Information Architecture (Weeks 7-10)**

- User-driven categorization exercises to inform navigation (25-30 participants)
- Analysis and navigation structure options
- Navigation validation testing with 2-3 navigation variants (25-30 participants)
- Findability measurement and label refinement
- Information Architecture (IA) documentation and stakeholder review
- Migration mapping and transformation begins

**Deliverables:** Validated navigation taxonomy, site map with role-based views, findability report

**Milestone:** Week 10 - Information Architecture (IA) Approval Gate

**Phase 3: Design and Prototyping (Weeks 11-18)**

- Low-fidelity wireframes for priority screens (\~25-30 screens)
- Core workflow mapping
- viaSport branding application
- Design system expansion (components, patterns, tokens)
- High-fidelity mockups for core modules
- Interactive design prototyping with working interactions
- Edge cases, error states, empty states
- Data migration execution with validation
- Production environment preparation

**Deliverables:** High-fidelity designs, interactive prototype, design system documentation, development handoff specifications

**Milestone:** Week 18 - Design Finalization and UAT Ready

**Phase 4: User Acceptance Testing (Weeks 19-22)**

- UAT preparation and test scenario finalization
- Participant recruitment (10-12 users across roles)
- Moderated usability testing sessions (60 min each)
- System Usability Scale (SUS) measurement
- Accessibility audit of prototype
- Assistive Technology (AT) testing (3-5 AT users)
  - Screen reader users (NVDA, JAWS)
  - Keyboard-only users
- Quantitative and qualitative analysis
- Prioritized recommendations

**Deliverables:** UAT Report, prioritized remediation backlog, success metrics baseline, accessibility validation

**Milestone:** Week 22 \- Remediation Planning Workshop

**Phase 5: Remediation and Refinement (Weeks 23-26)**

- Fix critical and high-severity issues
- Design refinements based on feedback
- Accessibility remediations
- Development QA and regression testing
- Final validation and launch readiness assessment

**Deliverables:** Remediated design and implementation, regression test results, launch readiness recommendation

**Milestone:** Week 26 \- Launch Approval Gate

**Phase 6: Training and Launch (Weeks 27-30)**

- Training material finalization
- Video tutorial production
- Help center content review
- Train-the-trainer preparation
- Soft launch with pilot cohort (10-15 PSOs)
- Intensive monitoring and rapid response
- Full rollout with phased PSO onboarding
- Legacy systems archived

**Deliverables:** Training materials package, launch monitoring plan, post-launch UX roadmap

See **Service Approach: Data Migration** for the detailed cutover plan, including data freeze window, hypercare period, and rollback criteria.

## Governance and Communications

### Communication Cadence

| Frequency | Participants                                | Purpose                           |
| :-------- | :------------------------------------------ | :-------------------------------- |
| Weekly    | Austin Wallace and viaSport Project Manager | Status updates and blockers       |
| Bi-weekly | Steering committee                          | Milestone review and escalations  |
| As needed | Technical stakeholders                      | UX reviews and migration planning |
| Monthly   | Research readouts                           | Share findings with broader team  |

### Reporting

viaSport will receive:

- Weekly status reports
- Research synthesis reports at phase gates
- Milestone completion reports with sign-off
- Defect status reports during UAT
- Post-go-live support reports (monthly)

### Decision-Making

| Decision Type              | Authority                         |
| :------------------------- | :-------------------------------- |
| Day-to-day implementation  | Austin Wallace                    |
| Requirements clarification | viaSport Project Manager          |
| UX research direction      | Ruslan Hétu with viaSport input   |
| Scope changes              | Mutual agreement via change order |
| Go-live readiness          | viaSport Project Sponsor          |

## Risks, Assumptions, and Dependencies

### Dependencies on viaSport

| Dependency                               | Timing      | Impact if Delayed           |
| :--------------------------------------- | :---------- | :-------------------------- |
| Legacy data access                       | Week 1      | Migration timeline at risk  |
| Brand assets                             | Week 11     | Branding work delayed       |
| Subject Matter Expert (SME) availability | Weeks 1-6   | Research quality reduced    |
| Research participants                    | Weeks 1-10  | User research scope limited |
| UAT testers                              | Weeks 19-22 | UAT duration extended       |
| PSO coordination                         | Weeks 27-30 | Rollout schedule impacted   |

### Assumptions

- viaSport can provide export capability or schema documentation for BCAR and BCSI
- viaSport staff and PSO representatives are available for research and reviews
- Participants can be recruited for user research sessions (we will work with Soleil as system navigator)
- No major scope changes after design finalization
- PSOs are responsive to onboarding communications

### Risk Register

| Risk                       | Likelihood | Impact | Mitigation                             |
| :------------------------- | :--------- | :----- | :------------------------------------- |
| Legacy data access delayed | Medium     | High   | Begin migration discovery in Week 1    |
| Data quality issues        | Medium     | Medium | Validation tooling and pilot migration |
| Research recruitment slow  | Medium     | Medium | Leverage Soleil's sector relationships |
| viaSport SME availability  | Low        | Medium | Schedule interviews early              |
| Scope creep                | Low        | High   | Weekly check-ins and change control    |
| PSO adoption resistance    | Low        | Medium | Train-the-trainer and PSO champions    |

## Timeline Commitment

This timeline reflects our assessment based on the existing prototype, the need for comprehensive user research, and assumed collaboration with the sport sector community. We will identify blockers early and communicate any required adjustments.

---
