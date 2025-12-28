# Property-Based Tests

This folder documents property-based testing conventions for Solstice.

## Guidelines

- Prefer `@fast-check/vitest` and `test.prop` for property tests.
- Use arbitraries in `src/tests/arbitraries/` when possible.
- Keep properties deterministic by avoiding global state or time drift.
- Add a short comment describing the invariant each property asserts.

## Running

- `pnpm test` runs property tests along with unit tests.
