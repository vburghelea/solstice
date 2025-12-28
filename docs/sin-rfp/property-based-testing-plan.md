# Property-Based Testing Implementation Plan

> High-value PBT additions for SIN compliance and correctness guarantees.
> See [PBT Adversarial LLMs blog](https://protocols-made-fun.com/pbt/2025/12/22/pbt-adversarial-llms.html) for context on why PBT matters for AI-assisted codebases.

---

## Executive Summary

**Investment**: ~2-3 days initial setup + ongoing test additions
**ROI**: High for security-critical paths; moderate elsewhere
**Recommendation**: Targeted adoption in 4 priority areas

Property-based testing generates random inputs to verify invariants hold across the entire input space, not just hand-picked examples. For SIN compliance, this provides stronger correctness guarantees for access control, audit integrity, and data handling.

---

## Priority 1: Organization Access Control (Critical)

**Files**: `src/features/organizations/organizations.access.ts`, `src/lib/auth/guards/org-context.ts`
**Current tests**: `organizations.access.test.ts` (4 example-based tests)
**Risk**: Cross-org data leakage violates SIN requirements

### Why PBT Matters Here

The `resolveOrganizationAccess` and `listAccessibleOrganizationsForUser` functions implement complex hierarchical inheritance:

- Membership propagates from parent → children
- Delegated access has scope-based role derivation
- Role priority picking across multiple access paths

Example-based tests cover specific topologies but miss edge cases like:

- Deep hierarchies (10+ levels)
- Diamond inheritance patterns
- Conflicting membership + delegation roles
- Expired vs active delegation at same time

### Properties to Verify

```typescript
// Property 1: No access without explicit relationship
// "A user with no membership or delegation in an org or its ancestors
// MUST receive null access, regardless of org structure"
test.prop([arbitraryOrgTree, arbitraryUser])("no phantom access", (tree, user) => {
  // If user has no memberships and no delegations in tree...
  if (!hasAnyRelationship(user, tree)) {
    // ...access to any org in tree should be null
    for (const org of tree.orgs) {
      expect(resolveAccess(user, org.id, tree)).toBeNull();
    }
  }
});

// Property 2: Parent membership implies child access
// "Membership in parent org ALWAYS grants at least that role to all descendants"
test.prop([arbitraryOrgTree, arbitraryMembership])(
  "inheritance monotonicity",
  async (tree, membership) => {
    const parentRole = membership.role;
    const descendants = getDescendants(tree, membership.orgId);

    for (const childId of descendants) {
      const access = await resolveAccess(membership.userId, childId, tree);
      expect(access).not.toBeNull();
      expect(rolePriority[access!.role]).toBeGreaterThanOrEqual(rolePriority[parentRole]);
    }
  },
);

// Property 3: Sibling isolation
// "Membership in org A never grants access to sibling org B"
test.prop([arbitraryOrgTree, arbitraryMembership])(
  "sibling isolation",
  async (tree, membership) => {
    const siblings = getSiblings(tree, membership.orgId);

    for (const siblingId of siblings) {
      // Access to sibling should only exist if there's explicit membership/delegation
      const access = await resolveAccess(membership.userId, siblingId, tree);
      if (access !== null) {
        expect(hasDirectOrAncestorAccess(membership.userId, siblingId, tree)).toBe(true);
      }
    }
  },
);

// Property 4: Role priority is deterministic
// "Given same inputs, pickHighestRole always returns same result"
test.prop([fc.array(arbitraryRole)])("role priority determinism", (roles) => {
  const result1 = pickHighestRole(roles);
  const result2 = pickHighestRole([...roles].reverse());
  expect(result1).toBe(result2);
});
```

### Arbitraries (Generators)

```typescript
// src/tests/arbitraries/organization.arbitrary.ts
import fc from "fast-check";

const arbitraryOrgId = fc.uuid();
const arbitraryUserId = fc.string({ minLength: 10, maxLength: 30 });

const arbitraryRole = fc.constantFrom("owner", "admin", "reporter", "viewer", "member");
const arbitraryScope = fc.constantFrom("admin", "reporting", "analytics");

// Generate valid org trees with controlled depth
const arbitraryOrgTree = fc
  .letrec((tie) => ({
    org: fc.record({
      id: arbitraryOrgId,
      parentOrgId: fc.oneof(
        fc.constant(null),
        tie("org").map((o) => o.id),
      ),
      type: fc.constantFrom("governing_body", "pso", "club", "affiliate"),
      status: fc.constantFrom("active", "suspended"),
    }),
    tree: fc.array(tie("org"), { minLength: 1, maxLength: 20 }),
  }))
  .tree.filter(isValidTree); // Ensure no cycles, valid parent refs

const arbitraryMembership = fc.record({
  userId: arbitraryUserId,
  orgId: arbitraryOrgId,
  role: arbitraryRole,
  status: fc.constantFrom("active", "pending", "suspended"),
});

const arbitraryDelegation = fc.record({
  userId: arbitraryUserId,
  orgId: arbitraryOrgId,
  scope: arbitraryScope,
  expiresAt: fc.option(
    fc.date({ min: new Date("2020-01-01"), max: new Date("2030-01-01") }),
  ),
  revokedAt: fc.option(fc.date()),
});
```

### Implementation Notes

1. **Pure function extraction**: The core logic in `organizations.access.ts` (lines 15-70) is already mostly pure. Extract `pickHighestRole`, `deriveRoleFromScopes`, `buildOrgMaps`, `collectDescendants` for direct unit testing.

2. **Mock boundaries**: For PBT, mock the database layer and test the logic functions directly with generated org structures.

3. **Edge case additions**: Add explicit tests for known boundaries:
   - Max org depth (currently unbounded - consider adding limit)
   - Simultaneous active + expired delegation
   - User with 50+ memberships

---

## Priority 2: Audit Log Hash Chain Integrity (Critical)

**Files**: `src/lib/audit/index.ts`
**Current tests**: None for hash chain logic
**Risk**: Audit tampering undetected violates SEC-AGG-004

### Why PBT Matters Here

The `verifyAuditHashChain` function validates that:

- Each entry's `prevHash` matches prior entry's `entryHash`
- Each entry's `entryHash` matches recomputed hash of payload

PBT can verify these invariants hold for any sequence of audit entries.

### Properties to Verify

```typescript
// Property 1: Valid chains always verify
test.prop([fc.array(arbitraryAuditEntry, { minLength: 1, maxLength: 100 })])(
  "buildChain produces verifiable chain",
  async (entries) => {
    const chain = await buildChainInMemory(entries);
    const result = await verifyChainInMemory(chain);
    expect(result.valid).toBe(true);
  },
);

// Property 2: Any modification breaks chain
test.prop([
  fc.array(arbitraryAuditEntry, { minLength: 2, maxLength: 50 }),
  fc.nat(), // index to modify
  fc.string(), // modification
])("modification detected", async (entries, indexSeed, modification) => {
  const chain = await buildChainInMemory(entries);
  const index = indexSeed % chain.length;

  // Modify a field
  const tampered = [...chain];
  tampered[index] = { ...tampered[index], action: modification };

  const result = await verifyChainInMemory(tampered);
  expect(result.valid).toBe(false);
  expect(result.invalidIds).toContain(tampered[index].id);
});

// Property 3: Insertion breaks chain
test.prop([
  fc.array(arbitraryAuditEntry, { minLength: 2 }),
  arbitraryAuditEntry,
  fc.nat(),
])("insertion detected", async (entries, inserted, indexSeed) => {
  const chain = await buildChainInMemory(entries);
  const index = (indexSeed % (chain.length - 1)) + 1; // Never first

  // Insert entry with "valid looking" but wrong prevHash
  const spliced = [...chain];
  spliced.splice(index, 0, {
    ...inserted,
    prevHash: chain[index - 1].entryHash,
    entryHash: await computeHash({ ...inserted, prevHash: chain[index - 1].entryHash }),
  });

  const result = await verifyChainInMemory(spliced);
  expect(result.valid).toBe(false);
});

// Property 4: PII redaction is consistent
test.prop([arbitraryChangesWithPII])("pii redaction deterministic", async (changes) => {
  const sanitized1 = await sanitizeChanges(changes);
  const sanitized2 = await sanitizeChanges(changes);
  expect(sanitized1).toEqual(sanitized2);

  // Verify sensitive fields are redacted
  for (const field of Object.keys(changes)) {
    if (REDACT_FIELDS.includes(field)) {
      expect(sanitized1[field]).toEqual({ old: "[REDACTED]", new: "[REDACTED]" });
    }
  }
});

// Property 5: Hash is deterministic (same input = same output)
test.prop([fc.anything()])("stableStringify deterministic", (value) => {
  const str1 = stableStringify(value);
  const str2 = stableStringify(JSON.parse(JSON.stringify(value)));
  expect(str1).toBe(str2);
});
```

### Arbitraries

```typescript
const arbitraryAuditEntry = fc.record({
  id: fc.uuid(),
  action: fc.stringOf(fc.constantFrom(..."ABCDEFGHIJKLMNOPQRSTUVWXYZ._".split("")), {
    minLength: 3,
    maxLength: 30,
  }),
  actionCategory: fc.constantFrom("AUTH", "ADMIN", "DATA", "EXPORT", "SECURITY"),
  actorUserId: fc.option(fc.string()),
  actorOrgId: fc.option(fc.uuid()),
  actorIp: fc.option(fc.ipV4()),
  actorUserAgent: fc.option(fc.string()),
  targetType: fc.option(fc.string()),
  targetId: fc.option(fc.string()),
  targetOrgId: fc.option(fc.uuid()),
  changes: fc.option(
    fc.dictionary(
      fc.string(),
      fc.record({
        old: fc.jsonValue(),
        new: fc.jsonValue(),
      }),
    ),
  ),
  metadata: fc.dictionary(fc.string(), fc.jsonValue()),
  requestId: fc.uuid(),
});

const arbitraryChangesWithPII = fc.dictionary(
  fc.oneof(
    fc.constant("password"),
    fc.constant("dateOfBirth"),
    fc.constant("phone"),
    fc.constant("normalField"),
    fc.string(),
  ),
  fc.record({ old: fc.jsonValue(), new: fc.jsonValue() }),
);
```

### Implementation Notes

1. **Extract pure functions**: `stableStringify`, `hashValue`, `sanitizeValue`, `sanitizeChanges` are already pure - add exports for testing.

2. **In-memory chain builder**: Create test helper that builds chain without database:

   ```typescript
   async function buildChainInMemory(entries: AuditEntryInput[]): Promise<AuditLogRow[]> {
     let prevHash: string | null = null;
     const chain: AuditLogRow[] = [];

     for (const entry of entries) {
       const payload = { ...entry, prevHash };
       const entryHash = await hashValue(payload);
       chain.push({ ...entry, prevHash, entryHash, id: crypto.randomUUID() });
       prevHash = entryHash;
     }

     return chain;
   }
   ```

---

## Priority 3: Step-Up Auth Time Windows (High)

**Files**: `src/lib/auth/guards/step-up.ts`
**Current tests**: `step-up.test.ts` (basic scenarios)
**Risk**: Time-based bypasses or lockouts

### Why PBT Matters Here

The `requireRecentAuth` function has time-based logic with multiple conditions:

- Session age vs reauth window
- MFA verification age vs reauth window
- Edge cases at exact boundaries

### Properties to Verify

```typescript
// Property 1: Fresh auth always passes
test.prop([arbitraryUser, fc.nat({ max: REAUTH_WINDOW_MS - 1 })])(
  "recent auth always allowed",
  async (user, ageMs) => {
    const session = mockSession({ authenticatedAt: new Date(Date.now() - ageMs) });

    // Should not throw
    await expect(requireRecentAuth(user.id, session)).resolves.not.toThrow();
  },
);

// Property 2: Stale auth always fails
test.prop([arbitraryUser, fc.integer({ min: REAUTH_WINDOW_MS + 1, max: 86400000 })])(
  "stale auth always rejected",
  async (user, ageMs) => {
    const session = mockSession({ authenticatedAt: new Date(Date.now() - ageMs) });

    await expect(requireRecentAuth(user.id, session)).rejects.toThrow(
      "Re-authentication required",
    );
  },
);

// Property 3: Boundary precision
test("exact boundary behavior", async () => {
  const exactlyAtLimit = mockSession({
    authenticatedAt: new Date(Date.now() - REAUTH_WINDOW_MS),
  });
  // At exactly the limit should pass or fail consistently (document which)
  // Currently: > means expired, so exactly at limit should pass
  await expect(requireRecentAuth("user", exactlyAtLimit)).resolves.not.toThrow();

  const oneOverLimit = mockSession({
    authenticatedAt: new Date(Date.now() - REAUTH_WINDOW_MS - 1),
  });
  await expect(requireRecentAuth("user", oneOverLimit)).rejects.toThrow();
});

// Property 4: MFA users need both fresh auth AND fresh MFA
test.prop([
  fc.nat({ max: REAUTH_WINDOW_MS - 1 }), // auth age
  fc.nat({ max: REAUTH_WINDOW_MS - 1 }), // mfa age
])("mfa user needs both fresh", async (authAgeMs, mfaAgeMs) => {
  const user = { id: "user", twoFactorEnabled: true, mfaRequired: false };
  const session = mockSession({
    authenticatedAt: new Date(Date.now() - authAgeMs),
    lastMfaVerifiedAt: new Date(Date.now() - mfaAgeMs),
  });

  await expect(requireRecentAuth(user.id, session)).resolves.not.toThrow();
});
```

---

## Priority 4: Client-Side Permission Helpers (Medium)

**Files**: `src/features/roles/permission.service.ts` (lines 127-169)
**Current tests**: Basic example coverage
**Risk**: UI showing wrong permissions, user confusion

### Properties to Verify

```typescript
// Property 1: userHasRole is symmetric in role matching
test.prop([arbitraryUserWithRoles, fc.string()])(
  "role matching is case-sensitive and exact",
  (user, roleName) => {
    const hasRole = userHasRole(user, roleName);
    const hasExactMatch = user.roles?.some((r) => r.role.name === roleName) ?? false;
    expect(hasRole).toBe(hasExactMatch);
  },
);

// Property 2: isAnyAdmin is monotonic (more roles = still admin)
test.prop([arbitraryAdminUser, arbitraryRole])(
  "adding roles never removes admin status",
  (user, newRole) => {
    const wasAdmin = isAnyAdmin(user);
    const withNewRole = {
      ...user,
      roles: [...(user.roles ?? []), { role: { name: newRole } }],
    };
    const stillAdmin = isAnyAdmin(withNewRole);

    if (wasAdmin) expect(stillAdmin).toBe(true);
  },
);

// Property 3: Empty/undefined roles is always non-admin
test.prop([fc.constantFrom({}, { roles: [] }, { roles: undefined })])(
  "empty user is never admin",
  (user) => {
    expect(isAnyAdmin(user)).toBe(false);
  },
);

// Property 4: Scoped role matching requires exact scope
test.prop([arbitraryUserWithRoles, fc.uuid(), fc.uuid()])(
  "scoped roles require exact match",
  (user, teamId1, teamId2) => {
    fc.pre(teamId1 !== teamId2);

    // If user has Team Admin for teamId1...
    const hasForTeam1 = userHasRole(user, "Team Admin", { teamId: teamId1 });
    const hasForTeam2 = userHasRole(user, "Team Admin", { teamId: teamId2 });

    // ...they shouldn't automatically have it for teamId2
    if (hasForTeam1 && !user.roles?.some((r) => r.teamId === teamId2)) {
      expect(hasForTeam2).toBe(false);
    }
  },
);
```

---

## Deferred: Lower-Value Candidates

### Schema Validation (Medium-Low)

The existing `*.schemas.test.ts` files use example-based tests. PBT could auto-generate valid/invalid inputs from Zod schemas using `zod-fast-check`, but the marginal value over well-chosen examples is lower.

**Recommendation**: Add PBT if a schema bug is found in production, otherwise defer.

### Form Validation (Medium)

The form builder's dynamic validation logic could benefit from PBT, but the complexity of generating valid `FormDefinition` objects makes it expensive.

**Recommendation**: Add after Priority 1-4 are complete.

### Import/Export Round-Trip (Medium)

Could verify `export → import` preserves data, but requires significant test infrastructure.

**Recommendation**: Add when import feature is actively used.

---

## Implementation Roadmap

### Phase 1: Setup (Day 1)

```bash
pnpm add -D fast-check @fast-check/vitest
```

Create test infrastructure:

```
src/tests/
├── arbitraries/
│   ├── organization.arbitrary.ts
│   ├── audit.arbitrary.ts
│   └── user.arbitrary.ts
├── properties/
│   └── README.md  # Document property patterns
└── setup.ts  # Add fast-check globals
```

### Phase 2: Org Access Properties (Day 1-2)

1. Extract pure functions from `organizations.access.ts`
2. Create org tree arbitrary
3. Implement 4 properties from Priority 1
4. Run with `{ numRuns: 1000 }` to find edge cases

### Phase 3: Audit Chain Properties (Day 2)

1. Extract pure functions from `src/lib/audit/index.ts`
2. Create in-memory chain builder/verifier
3. Implement 5 properties from Priority 2

### Phase 4: Auth & Permission Properties (Day 3)

1. Implement step-up auth properties
2. Implement permission helper properties
3. Document boundary behaviors discovered

---

## Success Metrics

1. **Bug discovery**: Track bugs found by PBT that examples missed
2. **Edge case documentation**: Properties document intended behavior
3. **Regression prevention**: PBT catches regressions in refactors
4. **Confidence for SIN**: Stronger correctness evidence for RFP

---

## References

- [fast-check documentation](https://fast-check.dev/)
- [zod-fast-check](https://github.com/DavidTimms/zod-fast-check) for schema-based generation
- [PBT Adversarial LLMs](https://protocols-made-fun.com/pbt/2025/12/22/pbt-adversarial-llms.html) - context on PBT limitations

---

## Document History

| Version | Date       | Changes      |
| ------- | ---------- | ------------ |
| v1.0    | 2025-12-27 | Initial plan |
