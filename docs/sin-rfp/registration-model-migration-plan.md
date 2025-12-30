# Registration Model Migration Plan (Legacy -> Group-Based)

**Date:** 2025-12-29
**Scope:** Event registrations, payments, and membership checkout bundling
**Goal:** Introduce registration groups with invite workflows and unified checkout
while preserving existing event registration behavior during transition.

## Current State (Legacy)

- `events.registrationType` enum: `team`, `individual`, `both`.
- `event_registrations` stores team or individual registration with optional
  `team_id` and JSON `roster`.
- `event_payment_sessions` ties a single Square checkout to one registration.
- Membership purchases are separate from event registrations.

## Target State (Group-Based)

- **Registration groups** represent the registration unit (individual, pair,
  team, relay, family).
- **Group members** and **invites** support registration flows where all
  participants are not known up-front.
- **Unified checkout** supports multiple line items (event registration + day
  pass + annual membership).

## Proposed Schema Changes (High-Level)

1. New tables:
   - `registration_groups`
   - `registration_group_members`
   - `registration_invites`
   - `checkout_sessions`
   - `checkout_items`
   - `membership_purchases`
2. New references:
   - `event_registrations.registration_group_id`
   - `event_payment_sessions.checkout_session_id` (optional)
3. Transitional views or computed columns as needed for legacy reads.

## Migration Phases

### Phase 0: Design and Prep

- Finalize ADR (D0.18) and data model.
- Add new tables and columns via migrations.
- Add feature flags: `group_registrations`, `bundled_checkout`.
- Implement dual-write primitives in server functions (write group data alongside
  legacy registration records).

### Phase 1: Backfill Registration Groups

- For each `event_registrations` row:
  - Create a `registration_groups` row with:
    - `group_type`: map from `registration_type` (`team` -> team,
      `individual` -> individual).
    - `event_id`, `captain_user_id` from `event_registrations.user_id`.
    - `team_id` if present.
  - Create `registration_group_members` for:
    - The registrant user (always).
    - Additional roster entries when they resolve to user IDs.
  - Set `event_registrations.registration_group_id`.

### Phase 2: Backfill Checkout Sessions

- For each `event_payment_sessions` row:
  - Create `checkout_sessions` with Square identifiers, status, and amounts.
  - Create a `checkout_items` line item linked to the related
    `event_registrations` row.
  - Link `event_payment_sessions.checkout_session_id`.

### Phase 3: Dual-Write and Compatibility

- New registration flows write:
  - `registration_groups` + `registration_group_members`
  - `event_registrations` (legacy compatibility)
  - `checkout_sessions` + `checkout_items`
- Legacy read paths continue to use `event_registrations` until UI migration is
  complete.
- Reporting/exports switch to group-based roster sources first (read-only).

### Phase 4: Incremental Rollout

- Enable group registration for select event types (e.g., orienteering).
- Enable bundled checkout for events requiring membership validation.
- Measure completion rate, payment success, and support tickets.

### Phase 5: Deprecation and Cleanup

- Deprecate direct use of `registration_type` on registrations (keep on events).
- Remove reliance on `event_registrations.roster` once group members are
  authoritative.
- Remove deprecated API routes or keep read-only compatibility endpoints.

## Data Validation and Integrity Checks

- Ensure one registration group per legacy registration during backfill.
- Confirm payment totals match between legacy and new checkout sessions.
- Validate roster counts against group member counts where possible.

## Rollback Strategy

- Keep legacy tables untouched (additive migration).
- Feature flags allow reverting UI and write paths to legacy-only.
- Backfilled data can remain without impacting legacy flows.

## Risks and Mitigations

- **Risk:** Missing user IDs in roster JSON.
  **Mitigation:** Create placeholder members with pending status or skip and
  track exceptions in a migration report.
- **Risk:** Payment reconciliation drift.
  **Mitigation:** Backfill checkout sessions from `event_payment_sessions` and
  reconcile totals.
- **Risk:** UX regression in team registrations.
  **Mitigation:** Keep team flow intact; map team -> group behind the scenes.

## Open Questions

- How should group invitations handle non-user participants?
- Do day memberships attach to events or to the group leader only?
- Should registration groups be reusable across events or event-scoped?
