import { z } from "zod";

export const locationSchema = z.object({
  address: z.string().min(1, "Address is required"),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  placeId: z.string().optional(),
});

export const minimumRequirementsSchema = z.object({
  languageLevel: z.enum(["beginner", "intermediate", "advanced", "fluent"]).optional(),
  minPlayers: z.number().int().positive().optional(),
  maxPlayers: z.number().int().positive().optional(),
  playerRadiusKm: z.number().int().min(1).max(10).optional(),
});

export const safetyRulesSchema = z.object({
  "no-alcohol": z.boolean(),
  "safe-word": z.boolean(),
});
