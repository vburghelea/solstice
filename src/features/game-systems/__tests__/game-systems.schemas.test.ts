import { describe, expect, it } from "vitest";
import {
  getSystemBySlugSchema,
  listSystemsSchema,
  mapExternalTagSchema,
  reorderImagesSchema,
  triggerRecrawlSchema,
  upsertCmsContentSchema,
} from "../game-systems.schemas";

describe("Game Systems Schemas", () => {
  describe("listSystemsSchema", () => {
    it("validates with defaults", () => {
      const result = listSystemsSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.perPage).toBe(20);
      }
    });
  });

  describe("getSystemBySlugSchema", () => {
    it("requires slug", () => {
      const result = getSystemBySlugSchema.safeParse({ slug: "dnd-5e" });
      expect(result.success).toBe(true);
    });
  });

  describe("upsertCmsContentSchema", () => {
    it("validates minimal payload", () => {
      const result = upsertCmsContentSchema.safeParse({ systemId: 1 });
      expect(result.success).toBe(true);
    });
  });

  describe("reorderImagesSchema", () => {
    it("validates image order", () => {
      const result = reorderImagesSchema.safeParse({ systemId: 1, imageIds: [2, 3] });
      expect(result.success).toBe(true);
    });
  });

  describe("mapExternalTagSchema", () => {
    it("validates mapping", () => {
      const result = mapExternalTagSchema.safeParse({
        systemId: 1,
        targetType: "category",
        targetId: 2,
        source: "bgg",
        externalTag: "123",
        confidence: 0.9,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("triggerRecrawlSchema", () => {
    it("validates trigger", () => {
      const result = triggerRecrawlSchema.safeParse({ systemId: 1 });
      expect(result.success).toBe(true);
    });
  });
});
