# Registration Model Migration Plan (Legacy -> Group-Based)

**Date:** 2025-12-29
**Scope:** Event registrations, payments, and membership checkout bundling
**Goal:** Cut over to registration groups with invite workflows and unified
checkout, replacing legacy registration and payment flows.

## Current State (Legacy)

- `events.registrationType` enum: `team`, `individual`, `both`.
- `event_registrations` stores team or individual registration with optional
  `team_id` and JSON `roster`.
- `event_payment_sessions` (legacy, deprecated) tied a Square checkout to one
  registration; active flows now use `checkout_sessions` + `checkout_items`.
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
3. Legacy payment session tables are deprecated in favor of `checkout_sessions`.

## Migration Phases

### Phase 0: Design and Prep

- Finalize ADR (D0.18) and data model.
- Add new tables and columns via migrations.
- Update server functions to write group-based registrations and checkout
  sessions only.

### Phase 1: Backfill Registration Groups

- For each `event_registrations` row:
  - Create a `registration_groups` row with:
    - `group_type`: map from `registration_type` (`team` -> team,
      `individual` -> individual).
    - `event_id`, `captain_user_id` from `event_registrations.user_id`.
    - `team_id` if present.
  - Create `registration_group_members` for:
    - The registrant user (always).
    - Additional roster entries; if no user ID, create a pending member with
      email/name in `roster_metadata`.
  - Set `event_registrations.registration_group_id`.
  - Use `scripts/backfill-registration-groups.ts` to automate the above steps
    and log progress.

### Phase 2: Backfill Checkout Sessions

- For each `event_payment_sessions` row (if legacy data exists):
  - Create `checkout_sessions` with Square identifiers, status, and amounts.
  - Create a `checkout_items` line item linked to the related
    `event_registrations` row.
  - Ensure totals match checkout item sums.
  - Use `scripts/backfill-registration-groups.ts` to backfill event checkouts
    and confirm the new rows exist before cutting over.

### Phase 3: Cutover and Cleanup

- Remove membership and event payment session creation paths (no new writes).
- Archive legacy `event_payment_sessions` and `membership_payment_sessions`
  after backfill/verification.
- Switch reporting/exports to group-based roster sources.

### Phase 4: Deprecation

- Deprecate direct use of `registration_type` on registrations (keep on events).
- Remove reliance on `event_registrations.roster` once group members are
  authoritative.
- Retain the legacy checkout shim for a short window (2-4 weeks) post-cutover,
  then disable it once all legacy sessions are backfilled and verified.

## Data Validation and Integrity Checks

- Ensure one registration group per legacy registration during backfill.
- Confirm payment totals match between legacy and new checkout sessions.
- Record mismatches in a migration report for review.
- Validate roster counts against group member counts where possible.

## Rollback Strategy

- Take a pre-migration database snapshot.
- Roll back via restore if cutover fails.

## Risks and Mitigations

- **Risk:** Missing user IDs in roster JSON.
  **Mitigation:** Create placeholder members with `pending` status, storing
  email/name in `roster_metadata`.
- **Risk:** Payment reconciliation drift.
  **Mitigation:** Backfill checkout sessions from `event_payment_sessions` and
  reconcile totals.

## Decisions Locked In

- Registration groups are event-scoped.
- Invites can target email addresses before account creation.
- Day passes are event-scoped entitlements tracked in `membership_purchases`.

## Implementation Status

**Last Updated:** 2025-12-29

### Completed

- [x] Schema: `registration_groups`, `registration_group_members`, `registration_invites` tables
- [x] Server: `registerForEvent` accepts `groupType` + `invites`, creates groups/members/invites
- [x] Server: `registration-groups.mutations.ts` - full CRUD + invite/accept/decline/revoke
- [x] Server: `registration-groups.queries.ts` - group roster + event listing queries
- [x] Server: `getRegistrationInvitePreview` - public query for invite details (cross-tenant)
- [x] UI: `$slug.register.tsx` - group type selection, invite management with localStorage persistence
- [x] UI: `/join/registration/$token` - enhanced invite acceptance with event details, loading states, invalid/expired handling
- [x] UI: `$eventId.manage.tsx` - Groups tab with real roster data + CSV export
- [x] Email: `sendRegistrationGroupInviteEmail` for invite notifications
- [x] E2E: `group-registration.auth.spec.ts` tests for group types, invites, and token handling

### In Progress

- [ ] Backfill script: `scripts/backfill-registration-groups.ts` (ready, needs scheduling)
- [ ] Legacy shim window: decide duration and monitoring approach

### Not Started

- [ ] Checkout sessions backfill from `event_payment_sessions`
- [ ] Deprecation of `event_registrations.roster` column
- [ ] Archive legacy payment session tables

### Recently Completed (2025-12-29)

- [x] Membership eligibility checks (`checkMembershipEligibility` in `membership.queries.ts`)
- [x] Unified checkout flow (`registerForEvent` creates `checkout_sessions` + `checkout_items`)
- [x] Square callback uses `checkout_sessions` + `checkout_items` (with legacy shim fallback)
- [x] Square webhooks finalize registrations + membership purchases (`webhooks/square.ts`)
- [x] Pending/resume payment UX (localStorage-backed in `$slug.register.tsx`)
- [x] Event configuration for pairs/relays with size rules (`minPlayersPerPair`, `maxPlayersPerPair`, `minPlayersPerRelay`, `maxPlayersPerRelay` in schema + form UI + registration enforcement)
