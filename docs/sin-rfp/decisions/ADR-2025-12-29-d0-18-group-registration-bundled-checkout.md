# ADR-2025-12-29-d0-18-group-registration-bundled-checkout: Group registration and bundled checkout model

Status: Proposed
Date: 2025-12-29

## Decision

Adopt a group-based registration model with a unified checkout session that can
bundle event registrations and membership purchases (annual or day pass).

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
- Existing registration and payment flows need a compatibility layer during
  rollout.
- Data migration is required to backfill groups for existing registrations.

## Links

- `docs/sin-rfp/requirements/user-stories-and-flows.md`
- `docs/sin-rfp/registration-model-migration-plan.md`
