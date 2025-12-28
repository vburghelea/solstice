import { fc, test as fcTest } from "@fast-check/vitest";
import { randomUUID } from "node:crypto";
import { describe, expect } from "vitest";
import type { AuditEntryInput } from "~/lib/audit";
import {
  hashValue,
  sanitizeAuditChanges,
  stableStringify,
  verifyAuditHashChainRows,
  type AuditHashRow,
} from "~/lib/audit";
import {
  auditChangesWithPiiArb,
  auditEntryArb,
} from "~/tests/arbitraries/audit.arbitrary";

const buildChainInMemory = async (
  entries: AuditEntryInput[],
): Promise<AuditHashRow[]> => {
  let prevHash: string | null = null;
  const rows: AuditHashRow[] = [];

  for (const [index, entry] of entries.entries()) {
    const occurredAt = new Date(1_700_000_000_000 + index * 1_000);
    const payload = {
      id: entry.requestId ?? randomUUID(),
      occurredAt,
      action: entry.action,
      actionCategory: entry.actionCategory ?? "DATA",
      actorUserId: entry.actorUserId ?? null,
      actorOrgId: entry.actorOrgId ?? null,
      actorIp: entry.actorIp ?? null,
      actorUserAgent: entry.actorUserAgent ?? null,
      targetType: entry.targetType ?? null,
      targetId: entry.targetId ?? null,
      targetOrgId: entry.targetOrgId ?? null,
      changes: entry.changes ?? null,
      metadata: entry.metadata ?? {},
      requestId: entry.requestId ?? randomUUID(),
      prevHash,
    };

    const entryHash = await hashValue(payload);

    rows.push({
      ...payload,
      id: payload.id,
      entryHash,
      prevHash,
      changes: (payload.changes as AuditHashRow["changes"]) ?? null,
      metadata: (payload.metadata as AuditHashRow["metadata"]) ?? {},
      createdAt: occurredAt,
    });

    prevHash = entryHash;
  }

  return rows;
};

describe("audit hash chain property tests", () => {
  fcTest.prop([fc.array(auditEntryArb, { minLength: 1, maxLength: 50 })])(
    "generated chains always verify",
    async (entries) => {
      const chain = await buildChainInMemory(entries);
      const result = await verifyAuditHashChainRows(chain);
      expect(result.valid).toBe(true);
    },
  );

  fcTest.prop([
    fc.array(auditEntryArb, { minLength: 2, maxLength: 30 }),
    fc.nat(),
    fc.string({ minLength: 1, maxLength: 30 }),
  ])("modification is detected", async (entries, indexSeed, modifiedAction) => {
    const chain = await buildChainInMemory(entries);
    const index = indexSeed % chain.length;
    const tampered = [...chain];
    tampered[index] = { ...tampered[index], action: modifiedAction };

    const result = await verifyAuditHashChainRows(tampered);
    expect(result.valid).toBe(false);
    expect(result.invalidIds).toContain(tampered[index].id);
  });

  fcTest.prop([
    fc.array(auditEntryArb, { minLength: 2, maxLength: 25 }),
    auditEntryArb,
    fc.nat(),
  ])("insertion is detected", async (entries, insertedEntry, indexSeed) => {
    const chain = await buildChainInMemory(entries);
    const index = (indexSeed % (chain.length - 1)) + 1;

    const previous = chain[index - 1];
    const occurredAt = new Date(previous.occurredAt.getTime() + 500);
    const payload = {
      id: insertedEntry.requestId ?? randomUUID(),
      occurredAt,
      action: insertedEntry.action,
      actionCategory: insertedEntry.actionCategory ?? "DATA",
      actorUserId: insertedEntry.actorUserId ?? null,
      actorOrgId: insertedEntry.actorOrgId ?? null,
      actorIp: insertedEntry.actorIp ?? null,
      actorUserAgent: insertedEntry.actorUserAgent ?? null,
      targetType: insertedEntry.targetType ?? null,
      targetId: insertedEntry.targetId ?? null,
      targetOrgId: insertedEntry.targetOrgId ?? null,
      changes: insertedEntry.changes ?? null,
      metadata: insertedEntry.metadata ?? {},
      requestId: insertedEntry.requestId ?? randomUUID(),
      prevHash: previous.entryHash,
    };

    const entryHash = await hashValue(payload);
    const row: AuditHashRow = {
      ...payload,
      id: payload.id,
      entryHash,
      prevHash: payload.prevHash,
      changes: (payload.changes as AuditHashRow["changes"]) ?? null,
      metadata: (payload.metadata as AuditHashRow["metadata"]) ?? {},
      createdAt: occurredAt,
    };

    const spliced = [...chain];
    spliced.splice(index, 0, row);

    const result = await verifyAuditHashChainRows(spliced);
    expect(result.valid).toBe(false);
  });

  fcTest.prop([auditChangesWithPiiArb])(
    "PII redaction is deterministic",
    async (changes) => {
      const sanitized1 = await sanitizeAuditChanges(changes);
      const sanitized2 = await sanitizeAuditChanges(changes);

      expect(sanitized1).toEqual(sanitized2);

      const redactedFields = ["password", "token", "mfaSecret"];
      for (const field of redactedFields) {
        if (sanitized1 && field in sanitized1) {
          expect(sanitized1[field]).toEqual({ old: "[REDACTED]", new: "[REDACTED]" });
        }
      }
    },
  );

  fcTest.prop([fc.jsonValue()])("stableStringify is deterministic", (value) => {
    const str1 = stableStringify(value);
    const str2 = stableStringify(JSON.parse(JSON.stringify(value)));
    expect(str1).toBe(str2);
  });
});
