# Worklog — Stream A - Auth, session, and MFA foundations

## Instructions

- Use `docs/sin-rfp/5.2-pro-review-output/consolidated-backlog.md` (Stream A - Auth, session, and MFA foundations) as the source of truth.
- Keep this log updated during implementation and link any new ADRs.
- Follow TanStack Start server-only import patterns.
- Verify UI flows with sst dev and Playwright MCP on 5173; kill other processes on 5173 and then re-run sst dev if sst dev starts another port.
- Log blockers, questions, and technical debt here and proceed with best judgment on the current and next tasks.

## Scope (from consolidated backlog)

- [ ] A1 Add shared session helper (auth.api.getSession with
      disableCookieCache); update auth middleware, org-context guard, auth queries,
      and step-up to use it.
- [ ] A2 Harden requireRecentAuth: extract nested timestamps, fail closed when
      missing, treat MFA timestamps consistently; add unit tests.
- [ ] A3 Update requireAdmin to throw typed unauthorized/forbidden errors and
      enforce MFA-required admin checks in route guards.
- [ ] A4 Add structured step-up error signaling and update StepUpDialog to use
      it; add backup code verification path.
- [ ] A5 Enforce session policies: admin max-age 4h, idle timeout 30m; add
      lastActivityAt tracking and middleware enforcement.
- [ ] A6 Backfill mfaRequired for existing global admins and update seed scripts
      to set MFA state.
- [ ] A7 Harden scripts/seed-sin-data.ts: require E2E_DATABASE_URL or --force,
      refuse production, remove process.exit(0), and align seeded sessions with auth
      policy or remove them.

## Dependencies

- See `docs/sin-rfp/worklogs/master.md`.

## Questions for User

## Decisions Made

## Blockers

## Files Modified This Session

## Session Log

### 2025-12-27: Session Start

- Initialized worklog.
