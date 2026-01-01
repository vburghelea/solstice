import { describe, expect, it } from "vitest";
import goldenMasters from "../../__fixtures__/pivot-golden-masters.json";
import { buildPivotResult, type PivotConfig } from "../pivot-aggregator";

describe("pivot-aggregator golden masters", () => {
  for (const testCase of goldenMasters.testCases) {
    it(`matches golden master: ${testCase.name}`, () => {
      const result = buildPivotResult(
        testCase.input.rows,
        testCase.input.config as PivotConfig,
      );
      expect(result).toEqual(testCase.expectedOutput);
    });
  }
});
