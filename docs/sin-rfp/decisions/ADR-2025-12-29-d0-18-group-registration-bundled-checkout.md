# ADR-2025-12-29-d0-18-group-registration-bundled-checkout: Group registration and bundled checkout model

Status: Accepted
Date: 2025-12-29

## Decision

Adopt a group-based registration model with a unified checkout session that can
bundle event registrations and membership purchases (annual or day pass).

Default decisions:

- Registration groups are event-scoped.
- Invites can target email addresses before account creation.
- Group members remain pending until they accept and claim the invite.
- Day passes are event-scoped entitlements stored as membership purchases.

## Context

- Current event registrations are keyed to a `registration_type` enum
  (`team`, `individual`, `both`) with a single `event_registrations` record per
  team or individual.
- The platform needs to support pairs, relays, and variable-size groups, plus
  an invite-during-registration workflow.
- Membership purchases are separate from event registration and cannot be
  bundled into a single checkout or eligibility check.
- viaSport RFP scope expects flexible data collection and operational flows,
  including registrations that match different sport formats.

## Options considered

1. **Extend the existing team model** with ephemeral teams for pairs/relays.
2. **Add flexible participant counts to `event_registrations`** and store
   roster/invite data in JSONB.
3. **Introduce registration groups + unified checkout** with line items for
   event registration and membership purchases. (Chosen)

## Rationale

- Supports variable group sizes and invite workflows without overloading team
  entities.
- Enables a single checkout for event fee + membership fee.
- Keeps membership logic consistent while allowing day-pass products.
- Provides a clean foundation for future formats (family registrations, mixed
  relays, guest slots).

## Consequences

- New tables and API changes are required (registration groups, group members,
  invites, checkout sessions/items, membership purchases).
- Membership eligibility checks must accept either an active membership or a
  valid event-scoped day pass.
- Legacy payment session tables are replaced by unified checkout sessions.

## Implementation Progress

**Last Updated:** 2025-12-29

Core implementation complete:

- Registration groups schema and server functions (CRUD, invites)
- `registerForEvent` integration with group types and invite workflows
- Enhanced invite acceptance UI with event details and error states
- Organizer Groups tab with roster data and CSV export
- E2E test coverage for group registration flows
- Membership eligibility checks (`checkMembershipEligibility`)
- Unified checkout flow with `checkout_sessions` + `checkout_items`
- Square callback refactor (with legacy shim fallback)
- Square webhooks for payment finalization and refunds
- Pending/resume payment UX (localStorage-backed)

**Status:** All implementation items complete as of 2025-12-29.

See `docs/sin-rfp/registration-model-migration-plan.md` for migration status.

## Links

- `docs/sin-rfp/user-stories-and-flows.md`
- `docs/sin-rfp/registration-model-migration-plan.md`
- `docs/sin-rfp/square-callback-refactor-plan.md`
