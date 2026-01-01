import { describe, expect, it } from "vitest";
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
      expect(aggregatorsPhase2.variance([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(4.0, 1);
    });

    it("returns null for single value", () => {
      expect(aggregatorsPhase2.variance([5])).toBeNull();
    });
  });
});
