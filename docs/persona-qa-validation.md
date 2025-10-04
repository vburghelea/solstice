# Persona QA & Validation Baseline

This document defines acceptance criteria, automated coverage, and telemetry validation for phase 0 persona scaffolding.

## Acceptance Criteria

1. **Guest fallback**
   - When no authenticated user is present, the persona resolution must default to the Visitor persona with all privileged personas marked restricted.
2. **Single-role resolution**
   - Authenticated users with only Player permissions must resolve to the Player persona while preserving Visitor access for public content.
3. **Multi-role prioritization**
   - Users holding higher-scope roles (Ops, GM, Admin) must automatically activate the highest-priority available persona while leaving lower personas switchable.
4. **Revoked role recovery**
   - If a stored preferred persona is no longer available, the system must fall back to the highest available persona and surface the new state without crashing.
5. **Persistence**
   - Persona switches must persist across reloads via local storage, provided the persona remains available.

## Automated Coverage

- `persona-resolution-acceptance.test.tsx` exercises guest, single-role, multi-role, and revoked role scenarios, ensuring active persona selection and availability flags respect acceptance criteria.
- `RoleSwitcherProvider` test coverage confirms local storage persistence and fallback behavior when preferences become invalid.
- Existing analytics unit tests confirm persona switch and impression events emit correct payloads, satisfying telemetry instrumentation.

## Telemetry Validation

- PostHog dashboard `Persona Scaffolding / Phase 0` monitors `persona.*.switch` and `persona.*.navigation_impression` events with 95th percentile alert when switch failure rate exceeds 1%.
- Feedback event dashboard tracks `persona.*.coming_soon_feedback` submissions segmented by persona to confirm gating works across namespaces.
- Alerting integrates with Slack `#persona-scaffolding` channel via webhook for switch failures and missing impression events detected over 10-minute windows.
