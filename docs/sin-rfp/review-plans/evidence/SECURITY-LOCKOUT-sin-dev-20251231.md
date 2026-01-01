# Security Lockout Evidence (sin-dev)

Date: 2025-12-31

## Command

```
SIN_LOCKOUT_UNLOCK=true AWS_PROFILE=techdev npx sst shell --stage sin-dev -- npx tsx scripts/verify-sin-security-lockout.ts
```

## Result Summary

- Triggered 5 failed logins for `austinwallacetech@gmail.com`.
- Recorded 6 `login_fail` events within 15 minutes, plus `account_flagged` and
  `account_locked` events.
- Account lock created and then cleared (`unlockAccount` with reason
  "Post-verification unlock").

## Console Output (excerpt)

```
Triggering 5 failed logins for austinwallacetech@gmail.com...
Attempt 1/5: status 401
Attempt 2/5: status 401
Attempt 3/5: status 401
Attempt 4/5: status 401
Attempt 5/5: status 401
Login fail events (last 15m): 6
Active lock: {
  id: '6106a2f1-6ce7-421b-bd30-2e5ea1a9cee7',
  userId: 'sin-user-pso-admin-001',
  reason: 'failed_logins',
  lockedAt: 2025-12-31T08:01:14.481Z,
  unlockAt: 2025-12-31T08:31:14.166Z,
  unlockedBy: null,
  unlockedAt: null,
  unlockReason: null,
  metadata: { threshold: 'lock_5_in_15m' }
}
Recent security events:
- login_fail @ 2025-12-31T08:01:18.761Z
- account_locked @ 2025-12-31T08:01:16.805Z
- login_fail @ 2025-12-31T08:01:12.218Z
- login_fail @ 2025-12-31T08:01:08.849Z
- account_flagged @ 2025-12-31T08:01:06.746Z
- login_fail @ 2025-12-31T08:01:03.532Z
Lock cleared.
```
