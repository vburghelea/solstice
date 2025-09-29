# Role-Based Scaffolding Execution Plan

_This execution plan operationalizes the value blueprint outlined in `docs/role-personas-plan.md`, providing phase-by-phase guidance for engineering, product design, and QA teams. Each phase includes checklists engineered for low-level delivery, centered on mobile-first, role-aware UX._

## Phase 0 — Foundation & Persona Resolution

- _JTBD (Jordan, the Systems Steward): When I certify the platform for role-aware experiences, I want provable guardrails so I can trust future iterations to respect access boundaries._
- **Objectives**
  - Establish deterministic persona resolution and role-switching infrastructure.
  - Prepare shared tooling that downstream phases rely upon (telemetry, design tokens, coming-soon patterns).
- **Engineering Checklist**
- [x] Extend permission service to emit persona descriptors for guests, players, event managers, game masters, and platform administrators with caching for session hydration.
- [x] Implement role-switching context provider with persisted preference (local storage + server fallback) and ensure safe default to highest-privilege persona.
- [x] Add optimistic role switch UI skeleton (button + sheet) with loading states and error recovery for permission drift.
- [x] Scaffold route namespaces (`/visit`, `/player`, `/ops`, `/gm`, `/admin`) with TanStack Router layout components and suspense boundaries.
  - Established persona-aware layout shells with hero copy, role switcher access, and suspense fallbacks while routing persona resolution through server functions.
  - [x] Introduce shared "Coming Soon" component supporting persona-specific messaging, telemetry hooks, and feature-flag-driven visibility.
    - Landing placeholders now compose a gated feedback card that records PostHog events for likes, dislikes, and persona-specific suggestions.
  - [x] Define design token updates (spacing, typography scale, color variables) to meet WCAG AA on mobile and desktop.
    - Introduced responsive spacing and typography scales with WCAG AA-compliant foreground/background pairings and applied them to persona namespace surfaces.
- [x] Set up centralized analytics events for persona switch, navigation impressions, and coming-soon feedback submissions.
- **Design & Content Checklist**
  - [x] Create navigation information architecture diagrams for each persona with primary/secondary actions prioritized for mobile.
    - Documented in `docs/persona-navigation-ia.md` outlining mobile-first hierarchies and desktop enhancements.
  - [x] Deliver responsive wireframe templates for layout shells, role switcher, and coming-soon modules.
    - Responsive breakpoints and layout sequencing captured in `docs/persona-wireframe-templates.md`.
  - [x] Draft copy guidelines per persona (tone, terminology, calls to action).
    - Persona-specific tone and CTA rules codified in `docs/persona-copy-guidelines.md` for implementation parity.
- **QA & Validation Checklist**
  - [x] Define acceptance criteria for persona resolution scenarios (single-role, multi-role, revoked role, guest fallback).
    - Acceptance matrix recorded in `docs/persona-qa-validation.md` to drive development and review.
  - [x] Write automated tests (Vitest + Playwright smoke) covering namespace access control and role switching state persistence.
    - `persona-resolution-acceptance.test.tsx` verifies persona availability rules and RoleSwitcher persistence behaviors.
  - [x] Establish telemetry dashboards validating analytics event firing and include alert thresholds for switch errors.
    - Phase 0 dashboard expectations and alert thresholds documented in `docs/persona-qa-validation.md` for data ops setup.

## Phase 1 — Visitor Experience Refresh

- _JTBD (Maya, the Curious Explorer): When I browse public content, I want a guided narrative so I can decide whether to become a Player._
- **Objectives**
  - Elevate the `/visit` namespace with compelling storytelling and frictionless RSVP flows.
- **Engineering Checklist**
- [x] Build `/visit` layout with hero, featured events carousel (mobile swipe optimized), and story highlights.
  - The refreshed `/visit` experience now mirrors the unauthenticated homepage data flows while layering persona-aware narratives, responsive carousels, and CTAs tailored for Maya in `src/routes/visit/index.tsx`.
  - Shared city preference heuristics now live in `src/features/profile/location-preferences.ts`, keeping the visitor namespace in lockstep with the public homepage while enabling reusable storage keys and memoized selectors.
  - Maya-focused trust cues surface safety tools, facilitator bios, and venue vetting via a new "Confidence signals" section so the workspace reflects her decision criteria.
  - [ ] Integrate lightweight RSVP form gated by persona check (non-auth visitors) with rate limiting and analytics.
  - [ ] Implement contextual CTAs prompting registration when privileged actions are attempted.
  - [ ] Instrument SEO metadata and schema.org tags for public discoverability.
- **Design & Content Checklist**
- [x] Produce component-level designs for spotlight reels, testimonials, and CTA patterns respecting 12-column responsive grid.
  - Visitor spotlight, campaign showcase, and CTA stack patterns are codified through the new namespace composition so designers can reference live token usage for the responsive grid.
  - Confidence signal tiles reinforce persona copy guidance for safety-forward messaging with accessible card patterns ready for brand refinement.
  - [ ] Curate content schedule (events, stories, GM spotlights) with cadence for updates.
  - [ ] Author accessibility guidelines for imagery alt text and copywriting inclusive language.
- **QA & Validation Checklist**
  - [x] Add unit coverage for visitor city preference heuristics to guarantee location persistence parity between `/visit` and the unauthenticated homepage (`src/features/profile/__tests__/location-preferences.test.ts`).
  - [ ] Run mobile device lab tests (Chrome DevTools + responsive viewer) to confirm tap target sizes and load performance.
  - [ ] Validate RSVP flow using form automation with both valid and blocked scenarios.
  - [ ] Monitor visitor conversion funnel metrics post-launch (page dwell time, CTA click-through, registration starts).

## Phase 2 — Player Hub Evolution

- _JTBD (Leo, the Connected Participant): When I log in, I want an organized command center so I can manage play effortlessly._
- **Objectives**
  - Deliver a personalized `/player` workspace with actionable insights and privacy control surface area.
- **Engineering Checklist**
- [x] Create `/player/dashboard` route fetching sessions, invitations, and recommended campaigns with skeleton loaders.
  - `/player` now renders `PlayerDashboard`, repackaging the legacy `/dashboard` data queries into Leo-focused sections for sessions, invites, and curated campaigns while we wire a `/player/dashboard` alias in navigation.
  - [x] Implement quick actions panel (privacy toggles, profile completion, notification preferences) backed by optimistic server mutations.
    - `PlayerDashboard` now ships a control center card with privacy and notification toggles wired to optimistic mutations that update cached profile state and persist to local storage for instant rollback-safe feedback.
  - [x] Develop reusable cards for social graph highlights and integrate feature flag to enable advanced recommendations.
    - Added a "Connections radar" card that surfaces top teams with PostHog-gated beta messaging so design can iterate on advanced recommendation pilots without regressions.
  - [x] Ensure offline-friendly caching for key dashboard data (TanStack Query persistent storage).
    - Core player queries persist snapshots to `localStorage`, providing consistent data when reconnecting and reducing cache misses between visits.
  - [x] Hook telemetry for dashboard widget interaction and privacy toggle success/failure.
    - PostHog captures now fire on toggle success and key CTA presses to inform experimentation cadence for Leo's persona journey.
- **Design & Content Checklist**
- [x] Finalize dashboard layout for small, medium, and large breakpoints with focus order mapping.
  - Responsive grids and focusable quick actions are implemented in `src/features/player/components/player-dashboard.tsx`, giving design a production-ready reference.
  - [ ] Produce microcopy for tooltips, empty states, and safety guidelines around messaging/social features.
  - [ ] Coordinate with marketing on personalization strategy (interest tags, cross-promotions).
- **QA & Validation Checklist**
  - [ ] Automated tests covering permission boundaries (Players only) and multi-role switch ensuring state resets appropriately.
  - [ ] Usability test with representative Players (remote moderated) to validate comprehension of privacy controls.
  - [ ] Monitor engagement metrics (dashboard dwell time, quick action completion, recommendation click-through) and compare to baseline.

## Phase 3 — Event Operations Workspace

- _JTBD (Priya, the Operations Strategist): When I coordinate events, I want real-time operational context so I can keep everything on track._
- **Objectives**
  - Provide analytics-rich `/ops` namespace tailored to event managers with scoped permissions.
- **Engineering Checklist**
- [x] Construct `/ops/overview` dashboard with modular widgets (registration funnel, marketing attribution, staffing) and data freshness indicators.
  - `/ops` now renders an operations mission control that mirrors the legacy events review workflow while layering Priya-focused metrics, approval actions, logistics watchlists, and marketing hotspot insights for upcoming events.
  - Introduced a reusable ops data hook (`useOpsEventsData`) that reuses event review queries, powers a mission focus banner, and keeps approval queues, pipeline health, and marketing hotspots synchronized for Priya's workspace.
  - Recent approvals history now lives alongside the approvals queue, bringing forward the `/dashboard/admin/events-review` context with instant links back to preview and manage published experiences from the ops surface.
  - [x] Implement event detail route `/ops/events/$eventId` with tabbed navigation for logistics, marketing, staffing, and finances.
    - `/ops/events/$eventId` now renders `OpsEventDetail`, giving Priya persona-aware logistics snapshots, a drill-down timeline, and quick links back to the legacy dashboards while keeping navigation within the ops namespace.
- [x] Add task management subsystem (assignment, due dates, statuses) with optimistic updates and audit logging.
  - The new ops task board derives persona-tuned checklists from event data, persists status updates to local storage for offline-friendly tracking, and surfaces blocked workstreams through attention signals.
  - Priya can now reassign owners, capture inline notes, and filter the board by status so the `/ops/events/$eventId` workspace doubles as a lightweight runbook for day-of coordination.
  - [ ] Integrate permission middleware ensuring Priya sees only authorized events; include degraded experience messaging when access denied.
  - [ ] Provide CSV/ICS export utilities respecting localization and timezone.
- **Design & Content Checklist**
  - [ ] Deliver responsive widget guidelines balancing glanceable KPIs with drill-down controls.
  - [ ] Define color semantics for status indicators (traffic light scheme with accessible contrast).
  - [ ] Create templates for standard operating procedures and attach to task flows.
- **QA & Validation Checklist**
  - [ ] Performance profiling on data-heavy widgets to maintain <1s interaction latency on mid-tier mobile devices.
  - [ ] Scenario testing for limited-scope admins (single event) versus global operations to confirm guardrails.
  - [ ] Stakeholder review sessions with event staff to validate terminology and insights usefulness.

## Phase 4 — Game Master Studio

- _JTBD (Alex, the Story Guide): When I prep campaigns, I want a unified studio so I can craft premium experiences without tool friction._
- **Objectives**
  - Launch the `/gm` workspace centered on campaign management, feedback loops, and bespoke pipeline visibility.
- **Engineering Checklist**
  - [ ] Develop `/gm/dashboard` summarizing campaign health, upcoming sessions, and player feedback trends.
  - [ ] Implement campaign workspace `/gm/campaigns/$campaignId` with tabs for narrative assets, player dossiers, marketing briefs, and session history.
  - [ ] Create feedback triage board consolidating surveys, safety tools, and follow-up tasks.
  - [ ] Introduce B2B pipeline module with stages, assignments, and escalation hooks to Platform Admin namespace.
  - [ ] Ensure offline-friendly note editing with conflict resolution strategy and background sync indicators.
- **Design & Content Checklist**
  - [ ] Provide modular card/table systems adaptable to portrait tablet workflows.
  - [ ] Design iconography and color coding for campaign status, session readiness, and bespoke pipeline stages.
  - [ ] Develop voice-and-tone guide for player feedback messaging and safety reminders.
- **QA & Validation Checklist**
  - [ ] Conduct stress tests on campaign data volume (multi-year logs) to ensure performant rendering.
  - [ ] Playwright flows for note editing, offline toggles (simulated), and conflict resolution warnings.
  - [ ] Collect qualitative feedback from certified GMs on navigation clarity and asset organization.

## Phase 5 — Platform Administration Console

- _JTBD (Jordan, the Systems Steward): When I govern the platform, I want comprehensive controls so I can ensure compliance and operational excellence._
- **Objectives**
  - Deliver the `/admin` namespace with robust governance tooling and cross-persona oversight.
- **Engineering Checklist**
  - [ ] Build `/admin/insights` featuring system KPIs, incident timeline, and alert configuration with role-based access enforcement.
  - [ ] Implement `/admin/users` for role management, including bulk operations, audit trails, and MFA enforcement UI.
  - [ ] Integrate feature flag management console with rollout analytics and persona impact notes.
  - [ ] Provide export services for compliance reporting (PDF/CSV) with scheduled delivery.
  - [ ] Harden security (CSP updates, critical action confirmation modals, logging).
- **Design & Content Checklist**
  - [ ] Produce dense-data layouts optimized for desktop while maintaining responsive fallbacks.
  - [ ] Draft policy-aligned copy for warnings, confirmations, and audit logs.
  - [ ] Collaborate with legal/compliance stakeholders on reporting templates.
- **QA & Validation Checklist**
  - [ ] Security review including penetration testing, permission spoof scenarios, and logging verification.
  - [ ] Regression suite covering user role CRUD, feature flag toggles, and export scheduling.
  - [ ] Governance stakeholder sign-off on data accuracy and audit readiness.

## Phase 6 — Cross-Persona Collaboration Enhancements

- _JTBD (Leo, Priya, Alex, and Jordan collectively): When we collaborate across roles, we want consistent shared surfaces so we can stay aligned._
- **Objectives**
  - Introduce shared communication and reporting layers reinforcing multi-persona collaboration.
- **Engineering Checklist**
  - [ ] Deploy shared inbox module accessible from `/player/inbox`, `/ops/inbox`, `/gm/inbox`, and `/admin/inbox` with persona-aware filters.
  - [ ] Implement comment/annotation system with @mentions respecting permissions and notification preferences.
  - [ ] Create cross-namespace reporting dashboards linking visitor conversion, player retention, event performance, and GM pipeline metrics.
  - [ ] Add feedback capture loops (surveys, quick reactions) feeding into product backlog dashboards.
- **Design & Content Checklist**
  - [ ] Align visual language for shared modules (inbox, reporting) to minimize cognitive load when switching personas.
  - [ ] Define notification hierarchy and tone for cross-role interactions.
  - [ ] Provide guidelines for responsive layout of collaborative tools, ensuring parity between mobile and desktop.
- **QA & Validation Checklist**
  - [ ] Integration tests covering cross-role message visibility and permission boundaries.
  - [ ] Accessibility audits for collaborative components (keyboard navigation, ARIA roles, live region announcements).
  - [ ] Instrument feedback loops and confirm analytics dashboards reflect submission funnel accurately.

## Sustaining Engineering & Rollout Governance

- **Release Cadence**
  - Ship phases incrementally behind feature flags, enabling opt-in previews for representative personas.
  - Maintain changelog entries per phase with persona impact summaries.
- **Quality Gates**
  - Require passing `pnpm lint`, `pnpm check-types`, and relevant integration tests before merges.
  - Enforce design QA sign-off and product acceptance for each phase.
- **Telemetry & Feedback**
  - Establish baseline KPIs per persona (conversion, engagement, task completion) and compare post-launch.
  - Monitor role-switch error rates and degrade gracefully with support escalation paths.
- **Documentation**
  - Update internal playbooks, runbooks, and support scripts alongside each release.
  - Provide enablement sessions and knowledge base articles for community and staff.

This plan ensures that every persona receives focused value while the engineering scaffolding remains resilient, testable, and extensible for future initiatives.
