# Austin's Notes - Delivery Schedule

## Realistic Timeline (from contract signing)

| Phase                       | Duration      | Activities                                                        | Milestone             |
| --------------------------- | ------------- | ----------------------------------------------------------------- | --------------------- |
| **Planning**                | 2 weeks       | UX interviews, requirements refinement, migration discovery       | Requirements sign-off |
| **Development & Migration** | 6 weeks       | Gap closure, UX refinements, data migration, production hardening | Code complete         |
| **UAT**                     | 4 weeks       | viaSport testing, bug fixes, acceptance sign-off                  | UAT sign-off          |
| **viaSport Training**       | 2 weeks       | Admin training, documentation handoff                             | **Soft Launch**       |
| **PSO Rollout**             | 4 weeks       | PSO onboarding, tiered training, support ramp-up                  | **Full Rollout**      |
| **TOTAL**                   | **~18 weeks** |                                                                   |                       |

_Note: Development work continues throughout all phases as needed_

## Milestone Definitions

### Soft Launch

- viaSport admins trained and active on platform
- Legacy systems set to read-only
- Support processes in place
- PSO onboarding begins

### Full Rollout

- All 60 PSOs onboarded and trained
- First reporting cycle complete on new platform
- Legacy systems archived
- Steady-state operations

## Dependencies on viaSport

Timeline assumes prompt collaboration from viaSport on:

1. **Legacy data access** - Export capability or schema documentation for BCAR/BCSI
2. **Brand assets** - Logo, colors, style guidelines for platform customization
3. **SME availability** - Staff available for UX interviews and requirements sessions
4. **UAT testers** - Dedicated testers for acceptance testing period
5. **PSO coordination** - Help scheduling and communicating with 60 organizations

## Buffer Philosophy

**No explicit buffer built in.** This is intentional - we believe in honest timelines.

- The working prototype significantly de-risks technical delivery
- 90% of functionality is already built and tested
- Timeline is realistic with prompt viaSport collaboration

**However:** We acknowledge that risks always exist and timelines could change. Factors outside our control (data quality issues, legacy system access, stakeholder availability) could impact delivery. We commit to transparent communication if adjustments are needed.

**Framing for proposal:**

> "This timeline assumes close collaboration with viaSport and prompt access to legacy system data. The working prototype significantly de-risks delivery; remaining work is refinement and migration, not greenfield development. We acknowledge inherent project risks and commit to early, transparent communication if timeline adjustments become necessary."

## What's Already Done (Why Timeline is Accelerated)

Traditional 17-24 week timeline assumes building from scratch. We're not:

| Traditional Phase | Status          | Remaining Work                       |
| ----------------- | --------------- | ------------------------------------ |
| Architecture      | ✅ Done         | None                                 |
| Auth/Security     | ✅ Done         | Production hardening only            |
| Core Features     | ✅ 90% Done     | UX refinements per viaSport feedback |
| Analytics         | ✅ Done         | None                                 |
| Migration Tooling | ✅ Import ready | Extraction depends on legacy systems |

## Governance Cadence (to propose)

| Cadence   | Attendees            | Purpose                          |
| --------- | -------------------- | -------------------------------- |
| Weekly    | Austin + viaSport PM | Status, blockers, decisions      |
| Bi-weekly | Steering committee   | Milestone review, escalations    |
| Ad-hoc    | As needed            | Technical deep-dives, UX reviews |

## Risks to Timeline

| Risk                       | Mitigation                                               |
| -------------------------- | -------------------------------------------------------- |
| Legacy data access delayed | Start migration discovery in Week 1; escalate early      |
| Data quality issues        | Budget time in Development phase; use validation tooling |
| viaSport SME availability  | Schedule interviews in Planning phase; async options     |
| Scope creep                | Weekly check-ins; change request process                 |

## Team Roles

| Role            | Person         | Responsibility                           |
| --------------- | -------------- | ---------------------------------------- |
| Project Lead    | Austin Wallace | Architecture, delivery, viaSport liaison |
| Full Stack Dev  | Will Siddal    | Feature development, bug fixes           |
| Security Expert | TBD            | Security review, compliance validation   |
| UX Designer     | TBD            | User research, interface refinement      |
