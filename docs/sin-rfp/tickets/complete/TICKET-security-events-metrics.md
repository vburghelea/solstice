# TICKET: Emit CloudWatch Metrics for Security Events

**Status**: Completed
**Priority**: P1
**Component**: Security / Observability
**Date**: 2026-01-06
**Author**: Codex (AI Assistant)

---

## Summary

The RFP response claims security events are logged with CloudWatch metrics, but
only rate limit metrics are emitted today. Add CloudWatch metrics for key
security events or update the proposal language to remove the claim.

---

## Background

`docs/sin-rfp/response/04-system-requirements/security-sec-agg/final.md` states
that `security_events` are recorded with CloudWatch metrics. The implementation
in `src/lib/security/events.ts` writes to the database and audit log, while
metrics are emitted only for rate limits in `src/lib/observability/metrics.ts`.

---

## Current Behavior

- `recordSecurityEvent` writes to `security_events` and audit log entries.
- `recordRateLimitMetric` emits CloudWatch metrics only for rate limit events.
- No metrics are emitted for `login_fail`, `login_anomaly`, `account_flagged`,
  `account_locked`, or `mfa_fail` events.

---

## Proposed Scope

1. Define which security event types should emit metrics.
2. Add metric emission in `recordSecurityEvent` or the relevant rule handlers.
3. Avoid high-volume noise by sampling or aggregating where needed.
4. Optional: add CloudWatch alarms for thresholds.
5. Update proposal language to match the implemented behavior.

---

## Testing

- Trigger known security events in dev.
- Confirm log output includes metric payloads.
- Verify metrics appear in CloudWatch namespace `Solstice/App`.

---

## References

- `src/lib/security/events.ts`
- `src/lib/security/detection.ts`
- `src/lib/observability/metrics.ts`
- `docs/sin-rfp/response/04-system-requirements/security-sec-agg/final.md`
