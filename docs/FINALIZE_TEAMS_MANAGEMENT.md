# Finalize Teams Management Plan

## Phase 1 — Schema & Data Integrity

- [x] Review current `teamMembers` table to confirm the metadata adequately distinguishes captain invites from player join requests, aligning with the “Ask to Join” support described in `docs/teams-feature.md`.
- [x] Cross-check planned data changes against the documented schema (roles, statuses, invite metadata) and capture any deviations that need doc updates instead of new migrations.
- [x] Decide whether to extend the schema with `approvedBy`, `decisionAt`, or a dedicated declined status; document the rationale and update `docs/teams-feature.md` if we broaden the enum beyond the values listed there.
  - Added `approved_by`, `decision_at`, and `status = 'declined'` plus doc updates summarizing approval provenance.
- [x] If new columns or enum variants are required, draft migration scripts (`src/db/migrations/*.sql`), regenerate `src/db/schema/teams.schema.ts` via `pnpm db generate`, and reconcile the documentation so it reflects the live schema.
  - Migration: `0008_team_member_approvals.sql`; schema + relations updated. Run `pnpm db migrate` against local/preview DBs.
- [x] Validate resulting Drizzle types and ensure indexes (`team_members_team_status_idx`, `team_members_user_status_idx`, `team_members_active_user_idx`) still satisfy query requirements.
  - `pnpm lint` / `pnpm check-types` pass; existing indexes remain unchanged.

## Phase 2 — Server Actions & Validation

- [ ] Add Zod schemas to `src/features/teams/teams.schemas.ts` for captain approvals and rejections (e.g., `respondToTeamRequestSchema`), reusing patterns already outlined for invites.
- [ ] Implement `approveTeamMembership` and `rejectTeamMembership` server functions in `src/features/teams/teams.mutations.ts`, reusing `getAuthMiddleware` and enforcing the captain/coach permissions noted in the documentation.
- [ ] Ensure approval flow transitions `pending` → `active`, clears invite/request metadata, and updates audit columns; rejection should mark the membership inactive/declined without deleting the row so historical invite tracking remains intact.
- [ ] Reuse `isActiveMembershipConstraintError` handling so approvals surface a friendly validation error when a user already has an active team elsewhere.
- [ ] Update `teams.queries.ts` (or add a dedicated helper) so pending request callers receive the new approval metadata while keeping existing “pending invitation” surfaces consistent with the docs.

## Phase 3 — Client Experience

- [ ] Extend the roster screen at `src/routes/dashboard/teams/$teamId.members.tsx` to show actionable controls for pending join requests (Approve/Decline buttons) alongside existing invite messaging, matching the management affordances promised in `teams-feature.md`.
- [ ] Wire `useMutation` hooks to the new server functions with optimistic updates and consistent error messaging; invalidate `teamMembers`/`user-teams`/`pendingTeamInvites` cache keys on settlement.
- [ ] Provide feedback UI (toasts or inline alerts) indicating approval/rejection success or failure, mirroring patterns already used in the invitations component.
- [ ] Ensure the correct call-to-action appears for users who have submitted requests (disable duplicate requests, surface status badges) so the “Ask to Join” feature remains intuitive.

## Phase 4 — Notifications & Messaging

- [ ] Confirm the mail provider referenced in `teams-feature.md` aligns with the Resend implementation (`~/lib/email/resend`) and update any lingering references.
- [ ] Update the chosen mailer to send transactional emails for approvals and rejections; reuse the invite template where possible to stay within brand guidelines.
- [ ] Guard email dispatch in `try/catch` so messaging failures do not break mutations, and log meaningful errors for observability.
- [ ] Add copy updates to any in-app messaging or docs so captains and players understand the new flow.

## Phase 5 — Testing & QA

- [ ] Add Vitest coverage for the new schemas and server functions, mocking database access to assert authorization, validation, and constraint handling paths.
- [ ] Create component-level tests around the roster management UI to confirm buttons render only for eligible users and that state updates follow expectations.
- [ ] Write a Playwright scenario where a player requests membership and a captain approves/declines, validating UI feedback and data changes.
- [ ] Run `pnpm lint`, `pnpm check-types`, and the targeted `pnpm test` suites to ensure baseline quality gates pass.

## Phase 6 — Documentation & Rollout

- [ ] Update `docs/teams-feature.md` (and related feature docs) with the finalized manage workflow, including any schema changes, authorization nuances, and notification behavior.
- [ ] Add release notes or backlog ticket updates describing the completed functionality and any migrations that must run.
- [ ] Coordinate deployment sequencing (apply migrations before app updates) and monitor for constraint conflicts in production logs after release.
