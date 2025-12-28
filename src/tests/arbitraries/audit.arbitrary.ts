import fc from "fast-check";
import type { AuditActionCategory, AuditEntryInput } from "~/lib/audit";

const actionCategoryArb = fc.constantFrom<AuditActionCategory>(
  "AUTH",
  "ADMIN",
  "DATA",
  "EXPORT",
  "SECURITY",
);

const actionArb = fc.string({ minLength: 3, maxLength: 30 });

export const auditEntryArb: fc.Arbitrary<AuditEntryInput> = fc.record({
  action: actionArb,
  actionCategory: actionCategoryArb,
  actorUserId: fc.option(fc.uuid(), { nil: null }),
  actorOrgId: fc.option(fc.uuid(), { nil: null }),
  actorIp: fc.option(fc.ipV4(), { nil: null }),
  actorUserAgent: fc.option(fc.string({ maxLength: 120 }), { nil: null }),
  targetType: fc.option(fc.string({ maxLength: 40 }), { nil: null }),
  targetId: fc.option(fc.string({ maxLength: 64 }), { nil: null }),
  targetOrgId: fc.option(fc.uuid(), { nil: null }),
  changes: fc.option(
    fc.dictionary(
      fc.string({ minLength: 1, maxLength: 40 }),
      fc.record({
        old: fc.jsonValue(),
        new: fc.jsonValue(),
      }),
    ),
    { nil: null },
  ),
  metadata: fc.dictionary(fc.string({ maxLength: 40 }), fc.jsonValue()),
  requestId: fc.uuid(),
});

export const auditChangesWithPiiArb = fc.dictionary(
  fc.oneof(
    fc.constant("password"),
    fc.constant("token"),
    fc.constant("mfaSecret"),
    fc.constant("dateOfBirth"),
    fc.constant("phone"),
    fc.constant("normalField"),
    fc.string({ minLength: 1, maxLength: 24 }),
  ),
  fc.record({
    old: fc.jsonValue(),
    new: fc.jsonValue(),
  }),
);
