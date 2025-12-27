# Tenant Stage Mapping Plan (Canonical Stages)

## Goal

Formalize tenant selection and environment classification using canonical stage
names so the tenant is deterministic and misconfiguration fails fast.

## Canonical Stages

| Stage    | Tenant Key | Environment Class |
| -------- | ---------- | ----------------- |
| qc-dev   | qc         | dev               |
| sin-dev  | viasport   | dev               |
| qc-perf  | qc         | perf              |
| sin-perf | viasport   | perf              |
| qc-prod  | qc         | prod              |
| sin-prod | viasport   | prod              |

Notes:

- "sin" maps to tenant key "viasport".
- Environment class "prod" is treated as production.

## Implementation Steps

1. Add a shared stage resolver in `sst.config.ts`.
   - Use a canonical stage pattern: `^(qc|sin)-(dev|perf|prod)$`.
   - Implement a helper to resolve:
     - `stageTenant` (qc | viasport)
     - `stageEnv` (dev | perf | prod)
   - Use this resolver in both `app()` and `run()` so removal/protect
     logic and runtime env agree.

2. Update production/perf detection to honor canonical stage suffixes.
   - `isProd` should be true when `stageEnv === "prod"` (and remain true for
     legacy "production" if we keep it).
   - `isPerf` should be true when `stageEnv === "perf"`.
   - Update `removal` and `protect` logic to use `stageEnv`, not raw stage.

3. Fail fast on near-canonical typos.
   - If a stage starts with `qc-` or `sin-` but does not match the canonical
     pattern, throw with a message listing valid canonical stages.

4. Derive tenant env vars from canonical stage names and guard against drift.
   - If stage is canonical:
     - set `tenantKey` to `stageTenant`.
     - if `TENANT_KEY` or `VITE_TENANT_KEY` are provided and differ from
       `stageTenant`, throw with a clear error message.
   - If stage is not canonical:
     - keep current fallback (env vars first, then heuristic) for backward
       compatibility.

5. Document the canonical stage policy.
   - Update `docs/sin-rfp/phase-0/architecture-reference.md` with the canonical
     stage list and tenant mapping rule.
   - Add a short note to `docs/sin-rfp/route-tree-implementation-plan.md` in
     the environment section describing the canonical stages.

## Validation

- Run `pnpm lint` and `pnpm check-types`.
- Spot check with:
  - `AWS_PROFILE=techdev npx sst dev --stage qc-dev --mode mono`
  - `AWS_PROFILE=techdev npx sst dev --stage sin-dev --mode mono`

## Notes / Risks

- Canonical stages create separate stacks per tenant; this is desirable to keep
  infra isolated, but costs more.
- Backward-compatible stages (e.g., `dev`, `perf`, `production`) will continue
  to behave as before unless we decide to enforce canonical-only later.
