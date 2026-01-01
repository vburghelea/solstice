import { describe, expect, it } from "vitest";
import filterFixtures from "../../__fixtures__/filter-fixtures.json";
import type { FilterConfig } from "../../bi.schemas";
import { normalizeFilter, validateFilter, type AllowedFilterConfig } from "../filters";

const allowedFilters: Record<string, AllowedFilterConfig> = {
  status: { operators: ["eq", "in"], type: "enum" },
  createdAt: { operators: ["gte", "lte", "between"], type: "date" },
};

const normalizeValue = (value: unknown): unknown => {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(normalizeValue);
  return value;
};

describe("normalizeFilter", () => {
  for (const testCase of filterFixtures.normalizeFilterCases) {
    it(`normalizes ${testCase.name}`, () => {
      const result = normalizeFilter(testCase.input as FilterConfig, allowedFilters);
      expect({
        ...result,
        value: normalizeValue(result.value),
      }).toEqual(testCase.expected);
    });
  }

  it("throws on invalid operator", () => {
    expect(() =>
      normalizeFilter(
        { field: "status", operator: "invalid" as never, value: "active" },
        allowedFilters,
      ),
    ).toThrow("Operator 'invalid' not allowed for 'status'");
  });
});

describe("validateFilter", () => {
  for (const testCase of filterFixtures.validateFilterCases) {
    it(`validates ${testCase.name}`, () => {
      const result = validateFilter(
        testCase.input as FilterConfig,
        testCase.allowedFilters as Record<string, AllowedFilterConfig>,
      );
      expect(result.valid).toBe(testCase.expectedValid);
      expect(result.errors).toEqual(testCase.expectedErrors);
    });
  }
});
