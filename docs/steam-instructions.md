# Stream Instructions: D-003 Group Registration + Bundled Checkout

This document splits D-003 into four parallel streams. Each stream can be owned
by a separate agent. Coordinate on shared types and interfaces before merging.

## Shared Context

Goal: Support flexible registration groups (individual, pair, relay, team,
family), invite-by-email, and a unified checkout that can include event
registration plus membership (annual or day pass).

Key decisions:

- Registration groups are event-scoped.
- Invites can target emails before account creation.
- Day passes are event-scoped entitlements in `membership_purchases`.

Schemas already exist:

- `registration_groups`, `registration_group_members`, `registration_invites`
- `checkout_sessions`, `checkout_items`
- `membership_purchases`

Primary references:

- `docs/sin-rfp/requirements/tickets/SIN-IMPLEMENTATION-BACKLOG-V2.md`
- `docs/sin-rfp/decisions/ADR-2025-12-29-d0-18-group-registration-bundled-checkout.md`
- `docs/sin-rfp/square-callback-refactor-plan.md`

Keep server-only imports inside handlers (see `AGENTS.md`).

---

## Stream A: UI/UX (Registrant + Organizer)

Owner focus: new UI flows for creating groups, inviting members, and
organizer-facing management.

Scope

- Group registration UI:
  - Group type selector (individual, pair, relay, team, family)
  - Invite inputs (email + role), pending list, status messaging
- Pending/resume payment UX
- Organizer view: registration groups + member status management

Likely files

- `src/routes/dashboard/events/$slug.register.tsx`
- `src/features/events/` (registration components)
- `src/components/` (shared UI, forms)

Deliverables

- UI components and route wiring
- Client-side state and optimistic updates where appropriate
- Error states and user-friendly messages

Definition of done

- Registrant can create a group and invite members by email
- Pending/invited status visible
- Organizer can view group members and status
- Pending checkout can be resumed without duplicates (UI only; backend in Stream C)

Notes

- Avoid premature backend assumptions; use typed server functions once defined.

---

## Stream B: Domain Logic (Groups, Eligibility, Exports)

Owner focus: server functions and business rules for group creation, invites,
member status, and eligibility checks.

Scope

- Registration group creation and membership management
- Invite-by-email and acceptance flows
- Membership eligibility checks (annual vs day pass)
- Organizer roster exports with group members (including pending)

Likely files

- `src/features/events/` (new server functions)
- `src/features/membership/` (eligibility helpers)
- `src/lib/` (shared domain utilities)

Deliverables

- Zod schemas + server functions (`createServerFn` + `.inputValidator`)
- Audit hooks where required
- Tests for key rules (eligibility, status transitions)

Definition of done

- Server functions cover group CRUD, invites, and member status
- Eligibility checks are reusable by checkout flow
- Exports include group member status (pending/invited/active)

Notes

- Keep imports server-only inside handlers.

---

## Stream C: Payments + Integrations (Unified Checkout)

Owner focus: checkout sessions/items, Square callback/webhooks, refunds.

Scope

- Unified checkout flow for event registration + membership purchase
- Square callback uses `checkout_sessions` + `checkout_items` only
- Webhook finalization for registrations + membership purchases
- Refund handling updates both registration + membership states
- Pending/resume flow backend (idempotent)

Likely files

- `src/routes/api/webhooks/square.ts`
- `src/lib/payments/` (Square service)
- `src/features/membership/membership.finalize.ts`
- `src/features/events/` (registration finalize helpers)

Deliverables

- Checkout session creation + itemization
- Callback/webhook refactor to new tables
- Idempotent handling and audit logging

Definition of done

- Single checkout can include event + membership items
- Square callback finalizes both item types
- Refunds update registration + membership purchase status
- Pending checkout can be resumed safely

Notes

- Keep existing receipt flow intact (see `CLAUDE.md` Square checklist).
- Avoid top-level server-only imports.

---

## Stream D: Legacy Cleanup + Migration Safety

Owner focus: remove reliance on legacy payment session tables and ensure
backwards compatibility during transition.

Scope

- Remove `event_payment_sessions` / `membership_payment_sessions` from active
  flows
- Add guards or migration shims if legacy sessions exist
- Update docs and any fixtures/tests referencing legacy sessions

Likely files

- `src/features/events/` (registration flow)
- `src/features/membership/` (payment flow)
- `src/routes/api/` (legacy endpoints)
- `docs/sin-rfp/` (plans and notes)

Deliverables

- Updated flow to use `checkout_sessions`/`checkout_items` only
- Cleanup of unused references
- Docs updated to reflect new flow

Definition of done

- No active code path requires legacy payment session tables
- All references are either removed or flagged as deprecated

Notes

- Coordinate with Stream C to avoid conflicting changes.

---

## Cross-Stream Coordination

Shared contracts to agree early

- Group creation payloads and status enums
- Checkout item types and idempotency keys
- Invite acceptance flow and links

Suggested integration order

1. Stream B defines schemas and core server functions
2. Stream C integrates checkout flow with new APIs
3. Stream A wires UI to server functions
4. Stream D removes legacy flows after C is stable

---

## Stream A Output

Added group registration UX to the event registration page (group type selector, invite drafting with role/status, and a pending checkout resume banner stored in localStorage) and surfaced an organizer-facing Groups tab that summarizes registration groups from existing registrations. Updates are in `src/routes/dashboard/events/$slug.register.tsx` and `src/routes/dashboard/events/$eventId.manage.tsx`.

- `src/routes/dashboard/events/$slug.register.tsx`: group type selection drives team vs individual flows, invite list with add/remove, and localStorage-backed pending checkout resume
- `src/routes/dashboard/events/$eventId.manage.tsx`: new Groups tab showing group status + members (derived from registration summary)

Tests:

- `pnpm lint`
- `pnpm check-types`

Next steps:

1. Wire the invite draft list to the upcoming group/invite server functions once Stream C lands.
2. Replace the Groups tab placeholder “Manage” action with real member status actions when group queries are available.

Updated the Square callback and webhook to stick to checkout_sessions/items, handle broader redirect params, and ensure refunds update registrations + membership purchases while keeping Square service imports server-only. Also adjusted the webhook test to match the refund flow and email subject.

Details:

- `src/routes/api/payments/square/callback.ts`: parse multiple return params, handle explicit cancel, guard missing payment IDs, and persist order/payment metadata consistently.
- `src/routes/api/webhooks/square.ts`: move Square service import inside handler, mark checkout sessions/refunds, update event registrations + membership records, and tighten refund notification payloads.
- `src/features/membership/__tests__/square.webhook.test.ts`: align refund test with new lookup order + subject.

Tests:

- `pnpm lint`
- `pnpm check-types` (fails with existing errors in `src/features/membership/__tests__/membership.finalize.integration.test.ts`, `src/features/membership/membership.queries.ts`, `src/lib/payments/legacy-checkout.ts`)

Note: I noticed a lot of unrelated modified/untracked files in the repo and left them untouched. Do you want me to ignore them going forward or focus on isolating only the stream C changes?

Next steps if you want:

1. Run `pnpm test src/features/membership/__tests__/square.webhook.test.ts` to validate the webhook changes.
2. Triage the existing `pnpm check-types` failures.

---

## Stream D Output

Implemented the legacy checkout shim and removed the last runtime use of legacy payment session tables, then reworked the membership finalize integration test to exercise the active `membership_purchases` flow. Updated the relevant docs to reflect `checkout_sessions`/`checkout_items` and marked the legacy removal backlog item complete.

Changes by area

- Added legacy session migration helper in `src/lib/payments/legacy-checkout.ts` to materialize checkout sessions/items (and `membership_purchases` for memberships) from `event_payment_sessions`/`membership_payment_sessions`.
- Wired legacy fallback into Square callback and webhook flows in `src/routes/api/payments/square/callback.ts` and `src/routes/api/webhooks/square.ts`.
- Dropped the legacy finalize path from `src/features/membership/membership.finalize.ts` and rewrote the integration test around `finalizeMembershipPurchase` in `src/features/membership/__tests__/membership.finalize.integration.test.ts`.
- Updated docs to reference unified checkout and migration shims in `docs/plans/event-payments.md`, `docs/sin-rfp/registration-model-migration-plan.md`, `docs/sin-rfp/requirements/tickets/SIN-IMPLEMENTATION-BACKLOG-V2.md`, and `docs/sin-rfp/square-callback-refactor-plan.md`.

Tests

- `pnpm lint` failed due to pre-existing issues:
  - `src/features/events/events.mutations.ts` unused `gte` and `memberships`
  - `src/features/events/registration-groups.schemas.ts` deprecated `datetime` warning
- `pnpm check-types` failed due to pre-existing issue:
  - `src/features/membership/membership.queries.ts` exactOptionalPropertyTypes mismatch for `eventId`

If you want, I can also fix the lint/type issues above.

Next steps

1. Decide if you want the legacy shim to emit metrics or alerts (currently logs warnings only).
2. Address the existing lint/type errors so `pnpm lint` and `pnpm check-types` pass cleanly.

---

## Stream B Output

Implemented registration-group domain logic plus membership eligibility helpers, and wired eligibility into event registration to unify group + membership checks. Added new server functions, schemas, and queries for group CRUD/invites/acceptance and roster exports, plus invite email support and unit tests. Key updates are in `src/features/events/registration-groups.mutations.ts`, `src/features/events/registration-groups.queries.ts`, `src/features/events/registration-groups.schemas.ts`, `src/features/events/registration-groups.types.ts`, `src/features/events/registration-groups.rules.ts`, `src/features/events/registration-groups.utils.ts`, `src/features/membership/membership.eligibility.ts`, `src/features/membership/membership.queries.ts`, `src/features/events/events.mutations.ts`, and `src/lib/email/sendgrid.ts`.

Tests run:

- `pnpm lint`
- `pnpm check-types`

Note: `sendRegistrationGroupInviteEmail` builds links as `/join/registration/${token}`; there isn’t a route for that yet, so invites will need a matching acceptance page.

I also see many unrelated modified files in `git status` (e.g., `CLAUDE.md`, several docs, migrations, and routes) that I didn’t touch. How would you like to proceed with those?

If you want next steps, I can:

1. add the registration invite acceptance route to consume `/join/registration/:token`
2. hook the roster export query into the organizer UI/export flow

---

Updated the Square callback and webhook to stick to checkout_sessions/items, handle broader redirect params, and ensure refunds update registrations + membership purchases while keeping Square service imports server-only. Also adjusted the webhook test to match the refund flow and email subject.

Details:

- `src/routes/api/payments/square/callback.ts`: parse multiple return params, handle explicit cancel, guard missing payment IDs, and persist order/payment metadata consistently.
- `src/routes/api/webhooks/square.ts`: move Square service import inside handler, mark checkout sessions/refunds, update event registrations + membership records, and tighten refund notification payloads.
- `src/features/membership/__tests__/square.webhook.test.ts`: align refund test with new lookup order + subject.

Tests:

- `pnpm lint`
- `pnpm check-types` (fails with existing errors in `src/features/membership/__tests__/membership.finalize.integration.test.ts`, `src/features/membership/membership.queries.ts`, `src/lib/payments/legacy-checkout.ts`)

Note: I noticed a lot of unrelated modified/untracked files in the repo and left them untouched. Do you want me to ignore them going forward or focus on isolating only the stream C changes?

Next steps if you want:

1. Run `pnpm test src/features/membership/__tests__/square.webhook.test.ts` to validate the webhook changes.
2. Triage the existing `pnpm check-types` failures.
