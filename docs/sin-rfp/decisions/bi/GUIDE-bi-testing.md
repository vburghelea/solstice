# Solstice BI Platform - Testing Guide

**Status**: Approved
**Date**: 2025-12-30
**Author**: Technical Architecture

---

## Table of Contents

1. [Test Matrix](#1-test-matrix)
2. [Golden Master Strategy](#2-golden-master-strategy)
3. [Unit Tests (TDD)](#3-unit-tests-tdd)
4. [Property-Based Tests](#4-property-based-tests)
5. [SQL Parser Testing](#5-sql-parser-testing)
6. [Integration Tests](#6-integration-tests)
7. [E2E Tests](#7-e2e-tests)
8. [Fixture Management](#8-fixture-management)

---

## 1. Test Matrix

### 1.1 Coverage by Layer

| Layer                     | Test Type            | Coverage Target     | Tools            | Priority |
| ------------------------- | -------------------- | ------------------- | ---------------- | -------- |
| Engine (aggregations)     | Unit (TDD)           | 95%+                | Vitest           | P0       |
| Engine (filters)          | Unit (TDD)           | 90%+                | Vitest           | P0       |
| Engine (SQL parser)       | Unit (TDD)           | 95%+                | Vitest           | P0       |
| Engine (pivot aggregator) | Golden master + Unit | 95%+                | Vitest           | P0       |
| Governance (ACL, masking) | Unit (TDD)           | 95%+                | Vitest           | P0       |
| Governance (org scoping)  | Integration          | Critical paths      | Vitest + test DB | P0       |
| Server functions          | Integration          | Critical paths      | Vitest + test DB | P1       |
| UI components             | Component            | After stabilization | RTL              | P2       |
| User flows                | E2E                  | Happy paths + ACL   | Playwright       | P1       |

### 1.2 Test File Locations

```
src/features/bi/
├── engine/
│   └── __tests__/
│       ├── aggregations.test.ts
│       ├── aggregations.property.test.ts    # Property-based
│       ├── filters.test.ts
│       ├── pivot-aggregator.test.ts
│       ├── pivot-aggregator.golden.test.ts  # Golden masters
│       ├── sql-parser.test.ts
│       └── sql-rewriter.test.ts
├── governance/
│   └── __tests__/
│       ├── org-scoping.test.ts
│       ├── field-acl.test.ts
│       └── pii-masking.test.ts
├── __tests__/
│   └── bi.integration.test.ts
└── __fixtures__/
    ├── pivot-golden-masters.json
    ├── filter-fixtures.json
    └── sql-test-cases.json

e2e/tests/authenticated/
├── bi-pivot.auth.spec.ts
├── bi-export.auth.spec.ts
└── bi-dashboard.auth.spec.ts
```

---

## 2. Golden Master Strategy

### 2.1 Purpose

When refactoring `buildPivotResult` from `reports.mutations.ts` into
`engine/pivot-aggregator.ts`, golden masters ensure we don't break existing behavior.

### 2.2 Creating Golden Masters

**Step 1**: Identify representative inputs

```typescript
// __fixtures__/pivot-golden-masters.json
{
  "testCases": [
    {
      "name": "simple_count_by_type",
      "input": {
        "rows": [
          { "type": "club", "status": "active" },
          { "type": "club", "status": "pending" },
          { "type": "league", "status": "active" }
        ],
        "config": {
          "rowFields": ["type"],
          "columnFields": ["status"],
          "measures": [{ "field": null, "aggregation": "count", "key": "count:count", "label": "Count" }]
        }
      },
      "expectedOutput": {
        "rowFields": ["type"],
        "columnFields": ["status"],
        "measures": [{ "field": null, "aggregation": "count", "key": "count:count", "label": "Count" }],
        "columnKeys": [
          { "key": "active", "label": "status: active", "values": { "status": "active" } },
          { "key": "pending", "label": "status: pending", "values": { "status": "pending" } }
        ],
        "rows": [
          { "key": "club", "values": { "type": "club" }, "cells": { "active": { "count:count": 1 }, "pending": { "count:count": 1 } } },
          { "key": "league", "values": { "type": "league" }, "cells": { "active": { "count:count": 1 }, "pending": { "count:count": null } } }
        ]
      }
    },
    {
      "name": "sum_with_nulls",
      "input": { /* ... */ },
      "expectedOutput": { /* ... */ }
    },
    {
      "name": "avg_with_empty_groups",
      "input": { /* ... */ },
      "expectedOutput": { /* ... */ }
    }
  ]
}
```

**Step 2**: Generate snapshots from current implementation

```typescript
// scripts/generate-golden-masters.ts
import { buildPivotResult } from "../src/features/reports/reports.mutations";
import testCases from "../src/features/bi/__fixtures__/pivot-test-inputs.json";

const goldenMasters = testCases.map((tc) => ({
  name: tc.name,
  input: tc.input,
  expectedOutput: buildPivotResult(tc.input.rows, tc.input.config),
}));

fs.writeFileSync(
  "src/features/bi/__fixtures__/pivot-golden-masters.json",
  JSON.stringify({ testCases: goldenMasters }, null, 2),
);
```

**Step 3**: Test refactored code against golden masters

```typescript
// engine/__tests__/pivot-aggregator.golden.test.ts
import { describe, it, expect } from "vitest";
import { buildPivotResult } from "../pivot-aggregator";
import goldenMasters from "../../__fixtures__/pivot-golden-masters.json";

describe("pivot-aggregator golden masters", () => {
  for (const tc of goldenMasters.testCases) {
    it(`matches golden master: ${tc.name}`, () => {
      const result = buildPivotResult(tc.input.rows, tc.input.config);
      expect(result).toEqual(tc.expectedOutput);
    });
  }
});
```

### 2.3 Updating Golden Masters

Golden masters should only be updated when:

1. A bug is fixed (document the fix)
2. Behavior intentionally changes (document why)

Never update golden masters to "make tests pass" without understanding why.

---

## 3. Unit Tests (TDD)

### 3.1 Aggregations

```typescript
// engine/__tests__/aggregations.test.ts
import { describe, it, expect } from "vitest";
import { aggregators, aggregatorsPhase2 } from "../aggregations";

describe("aggregators", () => {
  describe("count", () => {
    it("returns length of array", () => {
      expect(aggregators.count([1, 2, 3])).toBe(3);
    });

    it("returns 0 for empty array", () => {
      expect(aggregators.count([])).toBe(0);
    });
  });

  describe("sum", () => {
    it("sums positive numbers", () => {
      expect(aggregators.sum([1, 2, 3, 4])).toBe(10);
    });

    it("handles negative numbers", () => {
      expect(aggregators.sum([-1, 2, -3, 4])).toBe(2);
    });

    it("returns 0 for empty array", () => {
      expect(aggregators.sum([])).toBe(0);
    });
  });

  describe("avg", () => {
    it("calculates average", () => {
      expect(aggregators.avg([2, 4, 6])).toBe(4);
    });

    it("returns null for empty array", () => {
      expect(aggregators.avg([])).toBeNull();
    });

    it("handles single value", () => {
      expect(aggregators.avg([42])).toBe(42);
    });
  });

  describe("min", () => {
    it("returns minimum value", () => {
      expect(aggregators.min([5, 2, 8, 1, 9])).toBe(1);
    });

    it("handles negative numbers", () => {
      expect(aggregators.min([-5, -2, -8])).toBe(-8);
    });

    it("returns null for empty array", () => {
      expect(aggregators.min([])).toBeNull();
    });
  });

  describe("max", () => {
    it("returns maximum value", () => {
      expect(aggregators.max([5, 2, 8, 1, 9])).toBe(9);
    });

    it("returns null for empty array", () => {
      expect(aggregators.max([])).toBeNull();
    });
  });
});

describe("aggregatorsPhase2", () => {
  describe("count_distinct", () => {
    it("counts unique values", () => {
      expect(aggregatorsPhase2.count_distinct([1, 2, 2, 3, 3, 3])).toBe(3);
    });

    it("returns 0 for empty array", () => {
      expect(aggregatorsPhase2.count_distinct([])).toBe(0);
    });
  });

  describe("median", () => {
    it("returns middle value for odd-length array", () => {
      expect(aggregatorsPhase2.median([1, 2, 3, 4, 5])).toBe(3);
    });

    it("returns average of two middle values for even-length", () => {
      expect(aggregatorsPhase2.median([1, 2, 3, 4])).toBe(2.5);
    });

    it("returns null for empty array", () => {
      expect(aggregatorsPhase2.median([])).toBeNull();
    });

    it("handles single value", () => {
      expect(aggregatorsPhase2.median([42])).toBe(42);
    });

    it("handles unsorted input", () => {
      expect(aggregatorsPhase2.median([5, 1, 3, 2, 4])).toBe(3);
    });
  });

  describe("stddev", () => {
    it("returns 0 for identical values", () => {
      expect(aggregatorsPhase2.stddev([5, 5, 5, 5])).toBe(0);
    });

    it("calculates population stddev correctly", () => {
      // Known values: [2, 4, 4, 4, 5, 5, 7, 9] has stddev ~2.0
      expect(aggregatorsPhase2.stddev([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(2.0, 1);
    });

    it("returns null for single value", () => {
      expect(aggregatorsPhase2.stddev([5])).toBeNull();
    });

    it("returns null for empty array", () => {
      expect(aggregatorsPhase2.stddev([])).toBeNull();
    });
  });

  describe("variance", () => {
    it("returns 0 for identical values", () => {
      expect(aggregatorsPhase2.variance([3, 3, 3])).toBe(0);
    });

    it("calculates variance correctly", () => {
      // Variance of [2, 4, 4, 4, 5, 5, 7, 9] is ~4.0
      expect(aggregatorsPhase2.variance([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(4.0, 1);
    });

    it("returns null for single value", () => {
      expect(aggregatorsPhase2.variance([5])).toBeNull();
    });
  });
});
```

### 3.2 Filters

```typescript
// engine/__tests__/filters.test.ts
import { describe, it, expect } from "vitest";
import { normalizeFilter, validateFilter } from "../filters";

describe("normalizeFilter", () => {
  it("normalizes eq filter", () => {
    expect(normalizeFilter({ field: "status", operator: "eq", value: "active" })).toEqual(
      { field: "status", operator: "eq", value: "active" },
    );
  });

  it("normalizes in filter with single value to eq", () => {
    expect(
      normalizeFilter({ field: "status", operator: "in", value: ["active"] }),
    ).toEqual({ field: "status", operator: "eq", value: "active" });
  });

  it("normalizes between filter", () => {
    expect(
      normalizeFilter({
        field: "createdAt",
        operator: "between",
        value: ["2024-01-01", "2024-12-31"],
      }),
    ).toEqual({
      field: "createdAt",
      operator: "between",
      value: [new Date("2024-01-01"), new Date("2024-12-31")],
    });
  });

  it("throws on invalid operator", () => {
    expect(() =>
      normalizeFilter({ field: "x", operator: "invalid" as any, value: 1 }),
    ).toThrow("Invalid operator");
  });
});

describe("validateFilter", () => {
  const allowedFilters = {
    status: { operators: ["eq", "in"], type: "enum" },
    createdAt: { operators: ["gte", "lte", "between"], type: "date" },
  };

  it("allows valid filter", () => {
    expect(
      validateFilter(
        { field: "status", operator: "eq", value: "active" },
        allowedFilters,
      ),
    ).toEqual({ valid: true, errors: [] });
  });

  it("rejects disallowed field", () => {
    expect(
      validateFilter({ field: "secret", operator: "eq", value: "x" }, allowedFilters),
    ).toEqual({ valid: false, errors: ["Field 'secret' is not allowed"] });
  });

  it("rejects disallowed operator", () => {
    expect(
      validateFilter({ field: "status", operator: "gte", value: "x" }, allowedFilters),
    ).toEqual({
      valid: false,
      errors: ["Operator 'gte' not allowed for field 'status'"],
    });
  });
});
```

### 3.3 Field ACL

```typescript
// governance/__tests__/field-acl.test.ts
import { describe, it, expect } from "vitest";
import {
  applyFieldMasking,
  canViewSensitiveFields,
  SENSITIVE_FIELDS,
} from "../field-acl";

describe("canViewSensitiveFields", () => {
  it("returns true for wildcard permission", () => {
    expect(canViewSensitiveFields(new Set(["*"]))).toBe(true);
  });

  it("returns true for pii.read permission", () => {
    expect(canViewSensitiveFields(new Set(["pii.read"]))).toBe(true);
  });

  it("returns true for pii:read permission (colon variant)", () => {
    expect(canViewSensitiveFields(new Set(["pii:read"]))).toBe(true);
  });

  it("returns false without PII permission", () => {
    expect(canViewSensitiveFields(new Set(["analytics.view"]))).toBe(false);
  });

  it("returns false for empty permissions", () => {
    expect(canViewSensitiveFields(new Set())).toBe(false);
  });
});

describe("applyFieldMasking", () => {
  const testRows = [
    { id: "1", name: "Test User", email: "test@example.com", phone: "555-1234" },
    {
      id: "2",
      name: "Another User",
      email: "another@example.com",
      dateOfBirth: "1990-01-01",
    },
  ];

  it("returns rows unchanged when canViewPii is true", () => {
    const result = applyFieldMasking(testRows, true);
    expect(result).toEqual(testRows);
  });

  it("masks sensitive fields when canViewPii is false", () => {
    const result = applyFieldMasking(testRows, false);

    expect(result[0].email).toBe("***");
    expect(result[0].phone).toBe("***");
    expect(result[0].name).toBe("Test User"); // Not sensitive
    expect(result[0].id).toBe("1"); // Not sensitive

    expect(result[1].email).toBe("***");
    expect(result[1].dateOfBirth).toBe("***");
  });

  it("does not modify original rows", () => {
    const original = [{ email: "test@example.com" }];
    applyFieldMasking(original, false);
    expect(original[0].email).toBe("test@example.com");
  });
});
```

---

## 4. Property-Based Tests

Use `fast-check` for property-based testing of aggregation invariants.

```typescript
// engine/__tests__/aggregations.property.test.ts
import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { aggregators, aggregatorsPhase2 } from "../aggregations";

describe("aggregation invariants", () => {
  describe("sum", () => {
    it("sum >= max for positive numbers", () => {
      fc.assert(
        fc.property(
          fc.array(fc.nat(), { minLength: 1 }),
          (values) => aggregators.sum(values) >= aggregators.max(values)!,
        ),
      );
    });

    it("sum is commutative", () => {
      fc.assert(
        fc.property(fc.array(fc.integer()), (values) => {
          const shuffled = [...values].sort(() => Math.random() - 0.5);
          return aggregators.sum(values) === aggregators.sum(shuffled);
        }),
      );
    });
  });

  describe("avg", () => {
    it("min <= avg <= max", () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: -1000, max: 1000 }), { minLength: 1 }),
          (values) => {
            const mn = aggregators.min(values)!;
            const av = aggregators.avg(values)!;
            const mx = aggregators.max(values)!;
            return mn <= av && av <= mx;
          },
        ),
      );
    });

    it("avg of identical values equals that value", () => {
      fc.assert(
        fc.property(fc.integer(), fc.integer({ min: 1, max: 100 }), (value, count) => {
          const values = Array(count).fill(value);
          return aggregators.avg(values) === value;
        }),
      );
    });
  });

  describe("count", () => {
    it("count equals array length", () => {
      fc.assert(
        fc.property(
          fc.array(fc.anything()),
          (values) => aggregators.count(values as number[]) === values.length,
        ),
      );
    });
  });

  describe("count_distinct", () => {
    it("count_distinct <= count", () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 1, max: 10 }), { minLength: 1 }),
          (values) =>
            aggregatorsPhase2.count_distinct(values) <= aggregators.count(values),
        ),
      );
    });

    it("count_distinct of unique values equals count", () => {
      fc.assert(
        fc.property(fc.set(fc.integer(), { minLength: 1 }), (uniqueValues) => {
          const values = [...uniqueValues];
          return aggregatorsPhase2.count_distinct(values) === values.length;
        }),
      );
    });
  });

  describe("median", () => {
    it("min <= median <= max", () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: -1000, max: 1000 }), { minLength: 1 }),
          (values) => {
            const mn = aggregators.min(values)!;
            const med = aggregatorsPhase2.median(values)!;
            const mx = aggregators.max(values)!;
            return mn <= med && med <= mx;
          },
        ),
      );
    });
  });

  describe("stddev", () => {
    it("stddev >= 0", () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: -1000, max: 1000 }), { minLength: 2 }),
          (values) => aggregatorsPhase2.stddev(values)! >= 0,
        ),
      );
    });

    it("stddev of identical values is 0", () => {
      fc.assert(
        fc.property(fc.integer(), fc.integer({ min: 2, max: 100 }), (value, count) => {
          const values = Array(count).fill(value);
          return aggregatorsPhase2.stddev(values) === 0;
        }),
      );
    });
  });
});
```

---

## 5. SQL Parser Testing

### 5.1 Test Categories

Use an AST parser, not regex. Test these categories exhaustively:

```typescript
// engine/__tests__/sql-parser.test.ts
import { describe, it, expect } from "vitest";
import { parseAndValidateSql, validateAgainstDataset } from "../sql-parser";

describe("SQL parser", () => {
  describe("blocked statements", () => {
    const blockedCases = [
      { sql: "INSERT INTO users VALUES (1, 'test')", reason: "INSERT" },
      { sql: "UPDATE users SET name = 'hacked'", reason: "UPDATE" },
      { sql: "DELETE FROM users WHERE id = 1", reason: "DELETE" },
      { sql: "DROP TABLE users", reason: "DROP" },
      { sql: "TRUNCATE TABLE users", reason: "TRUNCATE" },
      { sql: "ALTER TABLE users ADD COLUMN x TEXT", reason: "ALTER" },
      { sql: "CREATE TABLE evil (id INT)", reason: "CREATE" },
      { sql: "GRANT ALL ON users TO public", reason: "GRANT" },
      { sql: "REVOKE ALL ON users FROM admin", reason: "REVOKE" },
    ];

    for (const { sql, reason } of blockedCases) {
      it(`rejects ${reason} statement`, () => {
        const result = parseAndValidateSql(sql);
        expect(result.isValid).toBe(false);
        expect(
          result.errors.some((e) => e.includes(reason) || e.includes("not allowed")),
        ).toBe(true);
      });
    }
  });

  describe("multiple statements", () => {
    it("rejects multiple statements separated by semicolon", () => {
      const result = parseAndValidateSql("SELECT 1; SELECT 2;");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Multiple statements not allowed");
    });

    it("rejects SQL injection via semicolon", () => {
      const result = parseAndValidateSql(
        "SELECT * FROM users WHERE id = 1; DROP TABLE users;",
      );
      expect(result.isValid).toBe(false);
    });
  });

  describe("table extraction", () => {
    it("extracts single table from FROM clause", () => {
      const result = parseAndValidateSql("SELECT * FROM organizations");
      expect(result.tables).toEqual(["organizations"]);
    });

    it("extracts multiple tables from JOINs", () => {
      const result = parseAndValidateSql(`
        SELECT o.name, u.email
        FROM organizations o
        INNER JOIN users u ON u.org_id = o.id
        LEFT JOIN roles r ON r.user_id = u.id
      `);
      expect(result.tables).toContain("organizations");
      expect(result.tables).toContain("users");
      expect(result.tables).toContain("roles");
    });

    it("extracts tables from subqueries", () => {
      const result = parseAndValidateSql(`
        SELECT * FROM organizations
        WHERE id IN (SELECT org_id FROM memberships WHERE active = true)
      `);
      expect(result.tables).toContain("organizations");
      expect(result.tables).toContain("memberships");
    });
  });

  describe("parameter extraction", () => {
    it("extracts {{param}} placeholders", () => {
      const result = parseAndValidateSql(
        "SELECT * FROM orgs WHERE id = {{org_id}} AND type = {{type}}",
      );
      expect(result.parameters).toHaveLength(2);
      expect(result.parameters.map((p) => p.name)).toEqual(["org_id", "type"]);
    });

    it("handles query with no parameters", () => {
      const result = parseAndValidateSql("SELECT * FROM orgs");
      expect(result.parameters).toHaveLength(0);
    });
  });

  describe("valid SELECT queries", () => {
    const validCases = [
      "SELECT * FROM organizations",
      "SELECT name, type FROM organizations WHERE status = 'active'",
      "SELECT COUNT(*) FROM organizations GROUP BY type",
      "SELECT o.name, COUNT(m.id) FROM orgs o LEFT JOIN members m ON m.org_id = o.id GROUP BY o.name",
      "SELECT * FROM organizations ORDER BY created_at DESC LIMIT 100",
      "SELECT DISTINCT type FROM organizations",
      "SELECT name, COALESCE(description, 'N/A') FROM organizations",
      "WITH active_orgs AS (SELECT * FROM orgs WHERE status = 'active') SELECT * FROM active_orgs",
    ];

    for (const sql of validCases) {
      it(`accepts valid query: ${sql.slice(0, 50)}...`, () => {
        const result = parseAndValidateSql(sql);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    }
  });
});

describe("dataset validation", () => {
  const allowedTables = new Set(["bi_v_organizations", "bi_v_members"]);
  const allowedColumns = new Map([
    ["bi_v_organizations", new Set(["id", "name", "type", "status"])],
    ["bi_v_members", new Set(["id", "org_id", "user_id", "role"])],
  ]);

  it("allows query using only allowed tables", () => {
    const parsed = parseAndValidateSql("SELECT * FROM bi_v_organizations");
    const errors = validateAgainstDataset(parsed, allowedTables, allowedColumns);
    expect(errors).toHaveLength(0);
  });

  it("rejects query with disallowed table", () => {
    const parsed = parseAndValidateSql("SELECT * FROM users");
    const errors = validateAgainstDataset(parsed, allowedTables, allowedColumns);
    expect(errors).toContain('Table "users" is not in the allowed dataset');
  });

  it("rejects query with disallowed JOIN table", () => {
    const parsed = parseAndValidateSql(`
      SELECT * FROM bi_v_organizations o
      JOIN secrets s ON s.org_id = o.id
    `);
    const errors = validateAgainstDataset(parsed, allowedTables, allowedColumns);
    expect(errors).toContain('Table "secrets" is not in the allowed dataset');
  });

  it("rejects access to PII columns when not in allowed list", () => {
    const parsed = parseAndValidateSql("SELECT email FROM bi_v_organizations");
    parsed.columns = ["bi_v_organizations.email"]; // Simulated column extraction
    const errors = validateAgainstDataset(parsed, allowedTables, allowedColumns);
    expect(errors.some((e) => e.includes("email") && e.includes("not accessible"))).toBe(
      true,
    );
  });
});
```

### 5.2 SQL Injection Test Cases

Test against common SQL injection patterns:

```typescript
describe("SQL injection prevention", () => {
  const injectionCases = [
    "SELECT * FROM users WHERE id = 1 OR 1=1", // Always true
    "SELECT * FROM users WHERE id = 1 UNION SELECT * FROM secrets", // UNION injection
    "SELECT * FROM users WHERE name = '' OR ''=''", // Empty string injection
    "SELECT * FROM users; DROP TABLE users; --", // Multi-statement
    "SELECT * FROM users WHERE id = 1/**/OR/**/1=1", // Comment bypass
    "SELECT * FROM users WHERE id = CHAR(49)", // Encoded injection
  ];

  for (const sql of injectionCases) {
    it(`handles injection attempt: ${sql.slice(0, 40)}...`, () => {
      const result = parseAndValidateSql(sql);
      // These should either be rejected or, if valid syntax, should still
      // be caught by dataset validation (no access to 'users' or 'secrets')
      if (result.isValid) {
        const errors = validateAgainstDataset(
          result,
          new Set(["bi_v_organizations"]),
          new Map(),
        );
        expect(errors.length).toBeGreaterThan(0);
      }
    });
  }
});
```

---

## 6. Integration Tests

### 6.1 Org Scoping

```typescript
// __tests__/bi.integration.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createTestContext, createTestOrg, createTestUser } from "~/tests/utils";

describe("BI org scoping integration", () => {
  let org1: TestOrg;
  let org2: TestOrg;
  let user1: TestUser; // Belongs to org1
  let user2: TestUser; // Belongs to org2

  beforeAll(async () => {
    org1 = await createTestOrg({ name: "Org 1" });
    org2 = await createTestOrg({ name: "Org 2" });
    user1 = await createTestUser({ orgId: org1.id, role: "reporter" });
    user2 = await createTestUser({ orgId: org2.id, role: "reporter" });

    // Seed test data
    await seedOrganizations([
      { id: "data-1", orgId: org1.id, name: "Org1 Data" },
      { id: "data-2", orgId: org2.id, name: "Org2 Data" },
    ]);
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  it("user1 only sees org1 data", async () => {
    const ctx = createTestContext({ user: user1, organizationId: org1.id });
    const result = await runPivotQuery({
      data: {
        dataSource: "organizations",
        measures: [{ aggregation: "count" }],
      },
      context: ctx,
    });

    expect(result.rowCount).toBe(1);
    expect(result.pivot.rows.some((r) => r.values.name === "Org1 Data")).toBe(true);
    expect(result.pivot.rows.some((r) => r.values.name === "Org2 Data")).toBe(false);
  });

  it("user2 only sees org2 data", async () => {
    const ctx = createTestContext({ user: user2, organizationId: org2.id });
    const result = await runPivotQuery({
      data: {
        dataSource: "organizations",
        measures: [{ aggregation: "count" }],
      },
      context: ctx,
    });

    expect(result.rowCount).toBe(1);
    expect(result.pivot.rows.some((r) => r.values.name === "Org2 Data")).toBe(true);
  });

  it("rejects cross-org query from non-admin", async () => {
    const ctx = createTestContext({ user: user1, organizationId: org1.id });

    await expect(
      runPivotQuery({
        data: {
          dataSource: "organizations",
          measures: [{ aggregation: "count" }],
          filters: { id: { operator: "eq", value: org2.id } }, // Try to query org2
        },
        context: ctx,
      }),
    ).rejects.toThrow("Organization context mismatch");
  });

  it("global admin can query cross-org", async () => {
    const globalAdmin = await createTestUser({ isGlobalAdmin: true });
    const ctx = createTestContext({ user: globalAdmin });

    const result = await runPivotQuery({
      data: {
        dataSource: "organizations",
        measures: [{ aggregation: "count" }],
      },
      context: ctx,
    });

    expect(result.rowCount).toBeGreaterThanOrEqual(2);
  });
});
```

### 6.2 Export Step-Up Auth

```typescript
describe("BI export step-up auth", () => {
  it("rejects export without recent auth", async () => {
    const user = await createTestUser({ lastAuthAt: new Date(Date.now() - 3600000) }); // 1 hour ago
    const ctx = createTestContext({ user });

    await expect(
      exportPivotData({
        data: {
          dataSource: "organizations",
          measures: [{ aggregation: "count" }],
          exportType: "csv",
        },
        context: ctx,
      }),
    ).rejects.toThrow(/recent auth|step-up/i);
  });

  it("allows export with recent auth", async () => {
    const user = await createTestUser({ lastAuthAt: new Date() }); // Just now
    const ctx = createTestContext({ user });

    const result = await exportPivotData({
      data: {
        dataSource: "organizations",
        measures: [{ aggregation: "count" }],
        exportType: "csv",
      },
      context: ctx,
    });

    expect(result.data).toBeDefined();
    expect(result.fileName).toMatch(/\.csv$/);
  });

  it("logs export to export_history", async () => {
    const user = await createTestUser({ lastAuthAt: new Date() });
    const ctx = createTestContext({ user });

    await exportPivotData({
      data: {
        dataSource: "organizations",
        measures: [{ aggregation: "count" }],
        exportType: "excel",
      },
      context: ctx,
    });

    const history = await db
      .select()
      .from(exportHistory)
      .where(eq(exportHistory.userId, user.id))
      .orderBy(desc(exportHistory.createdAt))
      .limit(1);

    expect(history).toHaveLength(1);
    expect(history[0].exportType).toBe("excel");
    expect(history[0].dataSource).toBe("organizations");
  });
});
```

### 6.3 PII Masking

```typescript
describe("BI PII masking", () => {
  it("masks PII fields for users without pii.read", async () => {
    const user = await createTestUser({ permissions: ["analytics.view"] }); // No pii.read
    const ctx = createTestContext({ user });

    // Seed data with PII
    await seedFormSubmission({ email: "test@example.com", phone: "555-1234" });

    const result = await runPivotQuery({
      data: {
        dataSource: "form_submissions",
        columns: ["email", "phone", "status"],
        measures: [{ aggregation: "count" }],
      },
      context: ctx,
    });

    // PII should be masked
    for (const row of result.pivot.rows) {
      expect(row.values.email).toBe("***");
      expect(row.values.phone).toBe("***");
    }
  });

  it("shows PII fields for users with pii.read", async () => {
    const user = await createTestUser({ permissions: ["analytics.view", "pii.read"] });
    const ctx = createTestContext({ user });

    await seedFormSubmission({ email: "test@example.com", phone: "555-1234" });

    const result = await runPivotQuery({
      data: {
        dataSource: "form_submissions",
        columns: ["email", "phone", "status"],
        measures: [{ aggregation: "count" }],
      },
      context: ctx,
    });

    // PII should be visible
    const hasRealEmail = result.pivot.rows.some((r) => r.values.email?.includes("@"));
    expect(hasRealEmail).toBe(true);
  });
});
```

---

## 7. E2E Tests

### 7.1 Pivot Builder Flow

```typescript
// e2e/tests/authenticated/bi-pivot.auth.spec.ts
import { test, expect } from "@playwright/test";

test.describe("BI Pivot Builder", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard/analytics/explore");
  });

  test("creates pivot table and views results", async ({ page }) => {
    // Select data source
    await page.getByLabel("Data Source").click();
    await page.getByRole("option", { name: "Organizations" }).click();

    // Add row field
    await page.getByTestId("field-type").dragTo(page.getByTestId("rows-dropzone"));

    // Add column field
    await page.getByTestId("field-status").dragTo(page.getByTestId("columns-dropzone"));

    // Add measure
    await page.getByTestId("add-measure").click();
    await page.getByLabel("Aggregation").selectOption("count");

    // Run query
    await page.getByRole("button", { name: "Run Query" }).click();

    // Verify results
    await expect(page.getByTestId("pivot-table")).toBeVisible();
    await expect(page.getByText("club")).toBeVisible();
    await expect(page.getByText("active")).toBeVisible();
  });

  test("saves and loads report", async ({ page }) => {
    // Create pivot...
    await page.getByLabel("Data Source").selectOption("Organizations");
    await page.getByRole("button", { name: "Run Query" }).click();

    // Save report
    await page.getByRole("button", { name: "Save Report" }).click();
    await page.getByLabel("Report Name").fill("Test Report");
    await page.getByRole("button", { name: "Save" }).click();

    // Verify saved
    await expect(page.getByText("Report saved")).toBeVisible();

    // Navigate away and back
    await page.goto("/dashboard/analytics");
    await page.getByText("Test Report").click();

    // Verify loaded
    await expect(page.getByTestId("pivot-table")).toBeVisible();
  });
});
```

### 7.2 Export Flow

```typescript
// e2e/tests/authenticated/bi-export.auth.spec.ts
import { test, expect } from "@playwright/test";

test.describe("BI Export", () => {
  test("requires step-up auth for export", async ({ page }) => {
    await page.goto("/dashboard/analytics/explore");

    // Create pivot
    await page.getByLabel("Data Source").selectOption("Organizations");
    await page.getByRole("button", { name: "Run Query" }).click();

    // Click export
    await page.getByRole("button", { name: "Export" }).click();
    await page.getByRole("menuitem", { name: "CSV" }).click();

    // Should trigger step-up auth
    await expect(page.getByText(/verify your identity|re-authenticate/i)).toBeVisible();
  });

  test("exports CSV after step-up auth", async ({ page }) => {
    await page.goto("/dashboard/analytics/explore");

    // Create pivot
    await page.getByLabel("Data Source").selectOption("Organizations");
    await page.getByRole("button", { name: "Run Query" }).click();

    // Export
    await page.getByRole("button", { name: "Export" }).click();
    await page.getByRole("menuitem", { name: "CSV" }).click();

    // Complete step-up auth (assuming already recent)
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Confirm Export" }).click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.csv$/);
  });
});
```

### 7.3 Dashboard Flow

```typescript
// e2e/tests/authenticated/bi-dashboard.auth.spec.ts
import { test, expect } from "@playwright/test";

test.describe("BI Dashboard", () => {
  test("creates dashboard with widgets", async ({ page }) => {
    await page.goto("/dashboard/analytics/dashboards/new");

    // Set name
    await page.getByLabel("Dashboard Name").fill("Test Dashboard");

    // Add chart widget
    await page.getByRole("button", { name: "Add Widget" }).click();
    await page.getByRole("option", { name: "Chart" }).click();

    // Configure widget
    await page.getByLabel("Data Source").selectOption("Organizations");
    await page.getByLabel("Chart Type").selectOption("bar");
    await page.getByRole("button", { name: "Add to Dashboard" }).click();

    // Verify widget added
    await expect(page.getByTestId("dashboard-widget")).toBeVisible();

    // Save dashboard
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Dashboard saved")).toBeVisible();
  });

  test("shares dashboard org-wide", async ({ page }) => {
    // Navigate to existing dashboard
    await page.goto("/dashboard/analytics/dashboards/test-dashboard-id");

    // Click share
    await page.getByRole("button", { name: "Share" }).click();
    await page.getByLabel("Share with entire organization").check();
    await page.getByRole("button", { name: "Save Sharing Settings" }).click();

    // Verify
    await expect(page.getByText("Sharing settings updated")).toBeVisible();
  });
});
```

---

## 8. Fixture Management

### 8.1 Fixture Files

```
src/features/bi/__fixtures__/
├── pivot-golden-masters.json    # Golden master outputs
├── pivot-test-inputs.json       # Representative pivot inputs
├── filter-fixtures.json         # Filter normalization test cases
├── sql-test-cases.json          # SQL parser test cases
└── acl-test-cases.json          # Field ACL test cases
```

### 8.2 Fixture Schema

```typescript
// __fixtures__/filter-fixtures.json
{
  "normalizeFilterCases": [
    {
      "name": "eq_string",
      "input": { "field": "status", "operator": "eq", "value": "active" },
      "expected": { "field": "status", "operator": "eq", "value": "active" }
    },
    {
      "name": "in_single_to_eq",
      "input": { "field": "status", "operator": "in", "value": ["active"] },
      "expected": { "field": "status", "operator": "eq", "value": "active" }
    }
  ],
  "validateFilterCases": [
    {
      "name": "valid_eq_on_allowed_field",
      "input": { "field": "status", "operator": "eq", "value": "active" },
      "allowedFilters": { "status": { "operators": ["eq", "in"], "type": "enum" } },
      "expectedValid": true,
      "expectedErrors": []
    },
    {
      "name": "invalid_operator",
      "input": { "field": "status", "operator": "gt", "value": "active" },
      "allowedFilters": { "status": { "operators": ["eq", "in"], "type": "enum" } },
      "expectedValid": false,
      "expectedErrors": ["Operator 'gt' not allowed for field 'status'"]
    }
  ]
}
```

### 8.3 Using Fixtures in Tests

```typescript
import filterFixtures from "../../__fixtures__/filter-fixtures.json";

describe("filter normalization", () => {
  for (const tc of filterFixtures.normalizeFilterCases) {
    it(`normalizes ${tc.name}`, () => {
      expect(normalizeFilter(tc.input)).toEqual(tc.expected);
    });
  }
});

describe("filter validation", () => {
  for (const tc of filterFixtures.validateFilterCases) {
    it(`validates ${tc.name}`, () => {
      const result = validateFilter(tc.input, tc.allowedFilters);
      expect(result.valid).toBe(tc.expectedValid);
      expect(result.errors).toEqual(tc.expectedErrors);
    });
  }
});
```

### 8.4 Regenerating Fixtures

```bash
# Regenerate golden masters from current implementation
pnpm tsx scripts/generate-golden-masters.ts

# Verify golden masters match
pnpm test src/features/bi/engine/__tests__/pivot-aggregator.golden.test.ts
```

---

## Links

- [SPEC-bi-platform.md](./SPEC-bi-platform.md) - Platform specification
- [PLAN-bi-implementation.md](./PLAN-bi-implementation.md) - Implementation plan
- [CHECKLIST-sql-workbench-gate.md](./CHECKLIST-sql-workbench-gate.md) - SQL Workbench prerequisites
- [fast-check documentation](https://github.com/dubzzz/fast-check)
- [pgsql-ast-parser](https://github.com/oguimbal/pgsql-ast-parser)
