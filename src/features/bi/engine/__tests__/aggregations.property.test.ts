import { fc, test as fcTest } from "@fast-check/vitest";
import { describe, expect } from "vitest";
import { aggregators, aggregatorsPhase2 } from "../aggregations";

describe("aggregation invariants", () => {
  fcTest.prop([fc.array(fc.nat(), { minLength: 1 })])(
    "sum >= max for positive numbers",
    (values) => {
      expect(aggregators.sum(values)).toBeGreaterThanOrEqual(
        aggregators.max(values) ?? 0,
      );
    },
  );

  fcTest.prop([fc.array(fc.integer(), { minLength: 1 })])(
    "sum is commutative",
    (values) => {
      const shuffled = [...values].sort(() => Math.random() - 0.5);
      expect(aggregators.sum(values)).toBe(aggregators.sum(shuffled));
    },
  );

  fcTest.prop([fc.array(fc.integer({ min: -1000, max: 1000 }), { minLength: 1 })])(
    "min <= avg <= max",
    (values) => {
      const mn = aggregators.min(values) ?? 0;
      const av = aggregators.avg(values) ?? 0;
      const mx = aggregators.max(values) ?? 0;
      expect(mn).toBeLessThanOrEqual(av);
      expect(av).toBeLessThanOrEqual(mx);
    },
  );

  fcTest.prop([fc.integer({ min: -1000, max: 1000 }), fc.integer({ min: 1, max: 100 })])(
    "avg of identical values equals that value",
    (value, count) => {
      const values = Array(count).fill(value);
      expect(aggregators.avg(values)).toBe(value);
    },
  );

  fcTest.prop([fc.array(fc.integer())])("count equals array length", (values) => {
    expect(aggregators.count(values)).toBe(values.length);
  });

  fcTest.prop([fc.array(fc.integer({ min: 1, max: 10 }), { minLength: 1 })])(
    "count_distinct <= count",
    (values) => {
      expect(aggregatorsPhase2.count_distinct(values) ?? 0).toBeLessThanOrEqual(
        aggregators.count(values) ?? 0,
      );
    },
  );

  fcTest.prop([fc.set(fc.integer(), { minLength: 1 })])(
    "count_distinct of unique values equals count",
    (uniqueValues) => {
      const values = [...uniqueValues];
      expect(aggregatorsPhase2.count_distinct(values) ?? 0).toBe(values.length);
    },
  );

  fcTest.prop([fc.array(fc.integer({ min: -1000, max: 1000 }), { minLength: 1 })])(
    "min <= median <= max",
    (values) => {
      const mn = aggregators.min(values) ?? 0;
      const med = aggregatorsPhase2.median(values) ?? 0;
      const mx = aggregators.max(values) ?? 0;
      expect(mn).toBeLessThanOrEqual(med);
      expect(med).toBeLessThanOrEqual(mx);
    },
  );

  fcTest.prop([fc.array(fc.integer({ min: -1000, max: 1000 }), { minLength: 2 })])(
    "stddev >= 0",
    (values) => {
      const value = aggregatorsPhase2.stddev(values);
      expect(value ?? 0).toBeGreaterThanOrEqual(0);
    },
  );

  fcTest.prop([fc.integer({ min: -1000, max: 1000 }), fc.integer({ min: 2, max: 100 })])(
    "stddev of identical values is 0",
    (value, count) => {
      const values = Array(count).fill(value);
      expect(aggregatorsPhase2.stddev(values)).toBe(0);
    },
  );
});
