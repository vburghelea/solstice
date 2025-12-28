import { describe, expect, it } from "vitest";
import {
  createAuditDiff,
  sanitizeAuditChanges,
  sanitizeAuditMetadata,
} from "~/lib/audit";

describe("createAuditDiff", () => {
  it("emits dotted paths for nested changes", async () => {
    const diff = await createAuditDiff(
      {
        profile: {
          emergencyContact: { phone: "111", name: "Alex" },
        },
        settings: { nested: { value: 1 } },
      },
      {
        profile: {
          emergencyContact: { phone: "222", name: "Alex" },
        },
        settings: { nested: { value: 2 } },
      },
    );

    expect(diff["profile.emergencyContact.phone"]).toEqual({
      old: "111",
      new: "222",
    });
    expect(diff["settings.nested.value"]).toEqual({ old: 1, new: 2 });
  });
});

describe("sanitizeAuditChanges", () => {
  it("redacts and hashes nested PII", async () => {
    const diff = {
      "emergencyContact.phone": { old: "111", new: "222" },
      password: { old: "plain", new: "secret" },
      "profile.name": { old: "Alex", new: "Jordan" },
    };

    const sanitized = await sanitizeAuditChanges(diff);

    expect(sanitized?.["password"]?.new).toBe("[REDACTED]");
    expect(sanitized?.["emergencyContact.phone"]?.new).toMatch(/^[a-f0-9]{64}$/);
    expect(sanitized?.["profile.name"]?.new).toBe("Jordan");
  });
});

describe("sanitizeAuditMetadata", () => {
  it("redacts sensitive keys recursively", () => {
    const metadata = {
      token: "abc",
      nested: {
        mfaSecret: "123",
        keep: "ok",
      },
      list: [{ password: "secret", keep: "ok" }],
    };

    const sanitized = sanitizeAuditMetadata(metadata);

    expect(sanitized["token"]).toBe("[REDACTED]");
    expect((sanitized["nested"] as { mfaSecret: string })["mfaSecret"]).toBe(
      "[REDACTED]",
    );
    expect((sanitized["list"] as Array<{ password: string }>)[0]["password"]).toBe(
      "[REDACTED]",
    );
    expect((sanitized["nested"] as { keep: string })["keep"]).toBe("ok");
  });
});
